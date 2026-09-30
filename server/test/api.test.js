import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createDb } from '../src/db.js';
import { createApp } from '../src/app.js';

const key = (c) => c.repeat(64);
const salt = 'ab'.repeat(16);
const entry = (c, data = 'c2VjcmV0') => ({ id: c.repeat(64), iv: 'aXZpdml2aXZpdml2', data });

let app;
before(async () => {
  const db = await createDb({ connectionString: '', silent: true });
  app = createApp(db, { secret: 'test-secret', bcryptRounds: 4, rateLimitMax: 1000 });
});

async function signup(username, authKey = key('a')) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/signup').send({ username, authKey, salt });
  assert.equal(res.status, 201);
  return agent;
}

test('signup sets an httpOnly session cookie and never needs an email', async () => {
  const res = await request(app).post('/api/auth/signup').send({ username: 'Maya_12', authKey: key('a'), salt });
  assert.equal(res.status, 201);
  assert.equal(res.body.username, 'maya_12');
  assert.match(res.headers['set-cookie'][0], /HttpOnly/);
  assert.match(res.headers['set-cookie'][0], /SameSite=Strict/);
});

test('duplicate usernames and bad input are rejected', async () => {
  await signup('dupe');
  const again = await request(app).post('/api/auth/signup').send({ username: 'DUPE', authKey: key('a'), salt });
  assert.equal(again.status, 409);
  const bad = await request(app).post('/api/auth/signup').send({ username: 'x', authKey: key('a'), salt });
  assert.equal(bad.status, 400);
  const badKey = await request(app).post('/api/auth/signup').send({ username: 'okname', authKey: 'password123', salt });
  assert.equal(badKey.status, 400);
});

test('salt lookup does not reveal whether an account exists', async () => {
  await signup('real-user');
  const real = await request(app).get('/api/auth/salt/real-user');
  const fake = await request(app).get('/api/auth/salt/nobody-here');
  const fakeAgain = await request(app).get('/api/auth/salt/nobody-here');
  assert.equal(real.body.salt, salt);
  assert.match(fake.body.salt, /^[0-9a-f]{32}$/);
  assert.equal(fake.body.salt, fakeAgain.body.salt, 'fake salt is stable');
});

test('login accepts the right key only', async () => {
  await signup('login-test', key('b'));
  const wrong = await request(app).post('/api/auth/login').send({ username: 'login-test', authKey: key('c') });
  assert.equal(wrong.status, 401);
  const agent = request.agent(app);
  const ok = await agent.post('/api/auth/login').send({ username: 'LOGIN-TEST', authKey: key('b') });
  assert.equal(ok.status, 200);
  const me = await agent.get('/api/auth/me');
  assert.equal(me.body.username, 'login-test');
});

test('entries require a session', async () => {
  const res = await request(app).get('/api/entries');
  assert.equal(res.status, 401);
});

test('entries upsert, list and delete, scoped to their owner', async () => {
  const alice = await signup('alice');
  const bob = await signup('bob');

  assert.equal((await alice.put(`/api/entries/${'1'.repeat(64)}`).send(entry('1'))).status, 204);
  await alice.put(`/api/entries/${'1'.repeat(64)}`).send(entry('1', 'dXBkYXRlZA=='));
  await alice.put(`/api/entries/${'2'.repeat(64)}`).send(entry('2'));

  const mine = await alice.get('/api/entries');
  assert.equal(mine.body.length, 2);
  assert.equal(mine.body.find((e) => e.id === '1'.repeat(64)).data, 'dXBkYXRlZA==');

  assert.deepEqual((await bob.get('/api/entries')).body, []);
  await bob.delete(`/api/entries/${'1'.repeat(64)}`);
  assert.equal((await alice.get('/api/entries')).body.length, 2, "bob can't delete alice's entries");

  await alice.delete(`/api/entries/${'2'.repeat(64)}`);
  assert.equal((await alice.get('/api/entries')).body.length, 1);
});

test('malformed entries are rejected', async () => {
  const agent = await signup('validator');
  const res = await agent.put('/api/entries/not-a-hash').send(entry('1'));
  assert.equal(res.status, 400);
  const notB64 = await agent.put(`/api/entries/${'3'.repeat(64)}`).send({ iv: 'aaaa', data: '{"flow":"heavy"}' });
  assert.equal(notB64.status, 400);
});

test('bulk import', async () => {
  const agent = await signup('importer');
  const res = await agent.post('/api/entries/bulk').send({ entries: [entry('4'), entry('5'), entry('6')] });
  assert.equal(res.body.saved, 3);
  assert.equal((await agent.get('/api/entries')).body.length, 3);
});

test('calendar feed is opt-in, token-gated and removable', async () => {
  const agent = await signup('cal-user');
  assert.equal((await agent.get('/api/calendar')).body.token, null);

  const ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n';
  const { body } = await agent.put('/api/calendar').send({ ics });
  assert.ok(body.token.length >= 32);

  const feed = await request(app).get(`/api/feed/${body.token}.ics`);
  assert.equal(feed.status, 200);
  assert.match(feed.headers['content-type'], /text\/calendar/);
  assert.equal(feed.text, ics);

  const again = await agent.put('/api/calendar').send({ ics });
  assert.equal(again.body.token, body.token, 'updating keeps the same subscription URL');

  await agent.delete('/api/calendar');
  assert.equal((await request(app).get(`/api/feed/${body.token}.ics`)).status, 404);
});

test('deleting an account removes everything and ends the session', async () => {
  const agent = await signup('leaving');
  await agent.put(`/api/entries/${'7'.repeat(64)}`).send(entry('7'));
  const { body } = await agent.put('/api/calendar').send({ ics: 'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n' });

  assert.equal((await agent.delete('/api/account')).status, 204);
  assert.equal((await agent.get('/api/auth/me')).status, 401);
  assert.equal((await request(app).get(`/api/feed/${body.token}.ics`)).status, 404);

  const relogin = await request(app).post('/api/auth/login').send({ username: 'leaving', authKey: key('a') });
  assert.equal(relogin.status, 401);
});

test('share links: owner writes, anyone with the token reads ciphertext, owner revokes', async () => {
  const owner = await signup('sharer');
  const other = await signup('not-owner');
  const token = 'Zm9vYmFyYmF6cXV4MTIzNDU2';
  const snapshot = { iv: 'aXZpdml2aXZpdml2', data: 'c25hcHNob3Q=' };

  assert.equal((await owner.put(`/api/shares/${token}`).send(snapshot)).status, 204);
  const read = await request(app).get(`/api/shared/${token}`);
  assert.deepEqual(read.body, snapshot);

  const hijack = await other.put(`/api/shares/${token}`).send({ ...snapshot, data: 'aGFja2Vk' });
  assert.equal(hijack.status, 404, "another user can't overwrite someone's share");
  await other.delete(`/api/shares/${token}`);
  assert.equal((await request(app).get(`/api/shared/${token}`)).status, 200, "another user can't revoke it");

  await owner.delete(`/api/shares/${token}`);
  assert.equal((await request(app).get(`/api/shared/${token}`)).status, 404);
});
