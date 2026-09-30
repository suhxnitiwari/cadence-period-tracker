import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createDb } from '../src/db.js';
import { createApp } from '../src/app.js';

let app;
before(async () => {
  app = createApp(await createDb({ connectionString: '', silent: true }), { origins: ['http://localhost:5173'], rateLimitMax: 10_000 });
});

const SPACE = 'AbCdEfGhIjKlMnOpQrStUv';
const TOKEN = 'a'.repeat(64);
const auth = (t = TOKEN) => ({ Authorization: `Bearer ${t}` });
const rec = (c, data = 'Y2lwaGVy') => ({ id: c.repeat(64), iv: 'aXZpdml2aXZpdml2', data });

test('create a space once; the token is required to use it', async () => {
  assert.equal((await request(app).post(`/api/spaces/${SPACE}`).set(auth())).status, 201);
  assert.equal((await request(app).post(`/api/spaces/${SPACE}`).set(auth())).status, 409);
  assert.equal((await request(app).get(`/api/spaces/${SPACE}/records`)).status, 400);
  assert.equal((await request(app).get(`/api/spaces/${SPACE}/records`).set(auth('b'.repeat(64)))).status, 404, 'wrong token looks like no space');
  assert.equal((await request(app).get(`/api/spaces/NoSuchSpaceNoSuchSpac1/records`).set(auth())).status, 404);
});

test('records sync incrementally by sequence number, and updates replace', async () => {
  const s = 'SyncSyncSyncSyncSyncSy';
  await request(app).post(`/api/spaces/${s}`).set(auth());
  const first = await request(app).put(`/api/spaces/${s}/records`).set(auth()).send({ records: [rec('1'), rec('2')] });
  assert.equal(first.body.seq, 2);
  const all = await request(app).get(`/api/spaces/${s}/records?since=0`).set(auth());
  assert.equal(all.body.records.length, 2);

  await request(app).put(`/api/spaces/${s}/records`).set(auth()).send({ records: [rec('1', 'dXBkYXRlZA==')] });
  const since = await request(app).get(`/api/spaces/${s}/records?since=2`).set(auth());
  assert.deepEqual(since.body.records.map((r) => [r.id[0], r.data, r.seq]), [['1', 'dXBkYXRlZA==', 3]]);
  assert.equal(since.body.seq, 3);
});

test('rejects anything that is not opaque ciphertext', async () => {
  const s = 'ValidValidValidValidVa';
  await request(app).post(`/api/spaces/${s}`).set(auth());
  const plain = await request(app).put(`/api/spaces/${s}/records`).set(auth()).send({ records: [{ id: '1'.repeat(64), iv: 'aXZp', data: '{"flow":"heavy"}' }] });
  assert.equal(plain.status, 400);
  const badId = await request(app).put(`/api/spaces/${s}/records`).set(auth()).send({ records: [{ ...rec('1'), id: 'day:2026-09-30' }] });
  assert.equal(badId.status, 400);
});

test('stop sharing deletes the space and every record', async () => {
  const s = 'DeleteDeleteDeleteDele';
  await request(app).post(`/api/spaces/${s}`).set(auth());
  await request(app).put(`/api/spaces/${s}/records`).set(auth()).send({ records: [rec('3')] });
  assert.equal((await request(app).delete(`/api/spaces/${s}`).set(auth())).status, 204);
  assert.equal((await request(app).get(`/api/spaces/${s}/records`).set(auth())).status, 404);
});

test('CORS only allows the Cadence site', async () => {
  const ok = await request(app).options(`/api/spaces/${SPACE}/records`).set('Origin', 'http://localhost:5173').set('Access-Control-Request-Method', 'GET');
  assert.equal(ok.headers['access-control-allow-origin'], 'http://localhost:5173');
  const evil = await request(app).options(`/api/spaces/${SPACE}/records`).set('Origin', 'https://evil.example').set('Access-Control-Request-Method', 'GET');
  assert.equal(evil.headers['access-control-allow-origin'], undefined);
});
