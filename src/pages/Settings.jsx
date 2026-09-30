import { useState } from 'react';
import { useStore } from '../store.jsx';
import { VOICES } from '../lib/voice.js';
import { FLOWS, PAIN } from '../lib/cycles.js';
import { sanitizeBackup } from '../lib/storage.js';
import { importCsv, importStartDates } from '../lib/importers.js';
import { hashPasscode } from '../lib/lock.js';
import { todayISO } from '../lib/dates.js';

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function Passcode() {
  const { lock, setLock } = useStore();
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    if (code.length < 4) return setError('Use at least 4 numbers.');
    if (code !== confirm) return setError('Those don’t match.');
    setLock(await hashPasscode(code));
    setEditing(false); setCode(''); setConfirm(''); setError('');
  };

  return (
    <section className="card stack">
      <h2>🔐 Passcode</h2>
      <p className="muted small" style={{ margin: 0 }}>Keeps Cadence closed if someone else picks up your phone. It locks again after a minute in the background.</p>
      {lock && !editing && (
        <div className="row">
          <span className="pill">On</span>
          <button className="btn small" onClick={() => setEditing(true)}>Change</button>
          <button className="btn small danger" onClick={() => setLock(null)}>Turn off</button>
        </div>
      )}
      {!lock && !editing && <div><button className="btn small" onClick={() => setEditing(true)}>Set a passcode</button></div>}
      {editing && (
        <form className="stack" onSubmit={save}>
          <label className="field"><span>New passcode (numbers)</span>
            <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          </label>
          <label className="field"><span>Type it again</span>
            <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))} />
          </label>
          <p className="small muted" style={{ margin: 0 }}>If you forget it, the only way back in is to erase your data, so pick something you’ll remember.</p>
          {error && <p className="error">{error}</p>}
          <div className="row"><button className="btn small primary">Save</button><button type="button" className="btn small" onClick={() => setEditing(false)}>Cancel</button></div>
        </form>
      )}
    </section>
  );
}

function BringHistory() {
  const { importDays } = useStore();
  const [msg, setMsg] = useState('');
  const [paste, setPaste] = useState('');

  const fromFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const days = file.name.endsWith('.json') ? sanitizeBackup(JSON.parse(text), { flows: FLOWS, pain: PAIN }) : importCsv(text);
      importDays(days);
      setMsg(`Brought in ${Object.keys(days).length} days. Welcome!`);
    } catch (err) {
      setMsg(err.message?.startsWith('Couldn’t') || err.message?.startsWith('Didn’t') || err.message?.startsWith('That') ? err.message : 'Couldn’t read that file. Try a CSV with a date column, or a Cadence backup.');
    }
  };
  const fromPaste = () => {
    const { days, count } = importStartDates(paste);
    if (!count) return setMsg('Couldn’t find any dates there.');
    importDays(days);
    setPaste('');
    setMsg(`Added ${count} period start dates.`);
  };

  return (
    <section className="card stack">
      <h2>Bring my history</h2>
      <p className="muted small" style={{ margin: 0 }}>Switching from another app? You shouldn’t have to start over.</p>
      <label className="field">
        <span>From a file <span className="muted small">(a Cadence backup, or a CSV from another app or a spreadsheet)</span></span>
        <input type="file" accept=".json,.csv,.txt,text/csv,application/json" onChange={fromFile} />
      </label>
      <label className="field">
        <span>Or paste the dates your periods started</span>
        <textarea value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'2026-06-03\n2026-07-01\nAug 2, 2026'} rows={3} />
      </label>
      <div><button className="btn small" disabled={!paste.trim()} onClick={fromPaste}>Add these dates</button></div>
      {msg && <p className="small" role="status" style={{ margin: 0 }}>{msg}</p>}
    </section>
  );
}

export default function Settings() {
  const { settings, saveSettings, days, eraseEverything, profile, setStage } = useStore();
  const [newSymptom, setNewSymptom] = useState('');
  const [confirmErase, setConfirmErase] = useState(false);

  const exportJson = () => download(`cadence-${todayISO()}.json`, JSON.stringify({ app: 'cadence', version: 1, exportedAt: new Date().toISOString(), days }, null, 2), 'application/json');
  const exportCsv = () => {
    const rows = [['date', 'flow', 'pain', 'school', 'symptoms', 'notes'].join(',')];
    for (const d of Object.keys(days).sort()) {
      const l = days[d];
      rows.push([d, l.flow, l.pain, l.school, (l.symptoms ?? []).join('; '), l.notes].map(csvCell).join(','));
    }
    download(`cadence-${todayISO()}.csv`, rows.join('\n'), 'text/csv');
  };

  return (
    <div className="stack">
      <h1>Settings</h1>

      <section className="card stack">
        <h2>How should Cadence talk to you?</h2>
        <div className="chips">
          {VOICES.map(([k, label, hint]) => <button key={k} className="chip" aria-pressed={settings.voice === k} onClick={() => saveSettings({ voice: k })} title={hint}>{label}</button>)}
        </div>
        <p className="muted small" style={{ margin: 0 }}>{VOICES.find((v) => v[0] === settings.voice)?.[2]}. Same app, worded for you. Change it anytime.</p>
        {profile.stage === 'notYet' && (
          <button className="btn small" onClick={() => setStage('new')}>I’ve had my first period now</button>
        )}
      </section>

      <section className="card stack">
        <h2>My own symptoms</h2>
        {settings.customSymptoms.length > 0 && (
          <div className="chips">
            {settings.customSymptoms.map((s) => <button key={s} className="chip" onClick={() => saveSettings({ customSymptoms: settings.customSymptoms.filter((x) => x !== s) })} aria-label={`Remove ${s}`}>{s} ✕</button>)}
          </div>
        )}
        <form className="row" onSubmit={(e) => { e.preventDefault(); const s = newSymptom.trim(); if (s && !settings.customSymptoms.includes(s)) saveSettings({ customSymptoms: [...settings.customSymptoms, s] }); setNewSymptom(''); }}>
          <input type="text" value={newSymptom} onChange={(e) => setNewSymptom(e.target.value)} placeholder="Something else +" maxLength={30} style={{ flex: 1, minWidth: 140 }} />
          <button className="btn small">Add</button>
        </form>
      </section>

      <Passcode />
      <BringHistory />

      <section className="card stack">
        <h2>Take my data with me</h2>
        <p className="muted small" style={{ margin: 0 }}>Import freely. Export freely. Delete freely. A backup file is also how you move Cadence to a new phone.</p>
        <div className="row">
          <button className="btn small" onClick={exportJson}>Save a backup</button>
          <button className="btn small" onClick={exportCsv}>Spreadsheet (.csv)</button>
        </div>
      </section>

      <section className="card stack">
        <h2>Private by design</h2>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>Everything is stored only on this device. There’s no account and no server that gets your data.</li>
          <li>No ads, no trackers, no selling data. Ever.</li>
          <li>No profiles, no feeds, no strangers, no messages.</li>
          <li>No parent dashboard. You decide what to share and with whom.</li>
          <li>Reminders only say the words you choose.</li>
        </ul>
      </section>

      <section className="card stack">
        <h2>Delete everything</h2>
        <p className="muted small" style={{ margin: 0 }}>Erases every period, symptom, note, plan and setting from this device, right now. It can’t be undone.</p>
        {!confirmErase
          ? <div><button className="btn small danger" onClick={() => setConfirmErase(true)}>Delete my data</button></div>
          : <div className="row"><button className="btn small danger" onClick={eraseEverything}>Yes, delete everything</button><button className="btn small" onClick={() => setConfirmErase(false)}>Cancel</button></div>}
      </section>

      <section className="card calm stack">
        <h2>Designed for your first period. Built for every period after.</h2>
        <p><strong>Periods aren’t a luxury.</strong> Period tracking stays free. Not five free logs, not a trial. Forever.</p>
        <p><strong>You don’t need to know your cycle.</strong> Understanding it is our job.</p>
        <p><strong>Your period fits into your life.</strong> School, college, work, travel, sports and everything after. You never graduate from Cadence. It grows up with you.</p>
        <p className="small muted" style={{ margin: 0 }}>Notice → Understand → Prepare → Speak up.</p>
      </section>
    </div>
  );
}
