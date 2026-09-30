import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { DEFAULT_POUCH, EMERGENCIES, GUIDES } from '../content/school.js';
import { reminderIcs, reminderGoogleUrl } from '../lib/ics.js';
import { addDays, formatDate } from '../lib/dates.js';

const REMINDER_TITLES = ['Might want your pouch tomorrow 🎒', 'Check your bag 🎒', 'Pack stuff', 'Reminder'];

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}

function Pouch() {
  const { pouch, setPouch } = useStore();
  const items = pouch ?? DEFAULT_POUCH.map((text) => ({ text, packed: false }));
  const [adding, setAdding] = useState('');
  const save = (next) => setPouch(next);

  return (
    <section className="card">
      <h2>🎒 My period pouch</h2>
      <p className="muted small">Keep a small bag in your backpack so you’re never caught without supplies.</p>
      <div>
        {items.map((it, i) => (
          <div className="row" key={it.text}>
            <label className={`check spacer ${it.packed ? 'done' : ''}`}>
              <input type="checkbox" checked={it.packed} onChange={() => save(items.map((x, j) => (j === i ? { ...x, packed: !x.packed } : x)))} />
              <span>{it.text}</span>
            </label>
            <button className="icon-btn" aria-label={`Remove ${it.text}`} onClick={() => save(items.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
      </div>
      <form className="row" style={{ marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); if (adding.trim()) { save([...items, { text: adding.trim(), packed: false }]); setAdding(''); } }}>
        <input type="text" value={adding} onChange={(e) => setAdding(e.target.value)} placeholder="Add something" maxLength={40} style={{ flex: 1, minWidth: 140 }} />
        <button className="btn small">Add</button>
      </form>
      {items.some((i) => i.packed) && <button className="btn small" style={{ marginTop: 10 }} onClick={() => save(items.map((x) => ({ ...x, packed: false })))}>Unpack all (start fresh)</button>}
    </section>
  );
}

function Reminder() {
  const { analysis: a, settings, saveSettings, today } = useStore();
  const title = settings.reminderTitle;
  const day = a.next && a.status.phase !== 'period' ? addDays(a.next.earliest, -1) : null;
  const when = day && day >= today ? day : null;

  return (
    <section className="card">
      <h2>Discreet reminder</h2>
      <p className="muted small">A heads-up the day before your period might start. It shows only the words you pick, so nobody glancing at your phone will know.</p>
      <div className="chips">
        {REMINDER_TITLES.map((t) => <button key={t} className="chip" aria-pressed={title === t} onClick={() => saveSettings({ reminderTitle: t })}>{t}</button>)}
      </div>
      {when ? (
        <div className="stack" style={{ marginTop: 14 }}>
          <p style={{ margin: 0 }}>For <strong>{formatDate(when, { weekday: 'long', month: 'short', day: 'numeric' })}</strong>:</p>
          <div className="row">
            <a className="btn small primary" href={reminderGoogleUrl(when, title)} target="_blank" rel="noreferrer">Google Calendar</a>
            <button className="btn small" onClick={() => download('reminder.ics', reminderIcs(when, title), 'text/calendar')}>Apple / Outlook</button>
          </div>
        </div>
      ) : <p className="muted small" style={{ marginTop: 12 }}>Log a period and Cadence can set this up for next time.</p>}
    </section>
  );
}

export default function School() {
  const { hash } = useLocation();
  const [open, setOpen] = useState(hash.slice(1) || null);
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'center' }); }, [hash]);

  return (
    <div className="stack">
      <div>
        <h1>School</h1>
        <p className="muted">Be ready, and know exactly what to do if something happens.</p>
      </div>

      <section className="card">
        <h2>Help right now</h2>
        <div className="stack">
          {EMERGENCIES.map((e) => (
            <div key={e.id} id={e.id}>
              <button className="choice" style={{ width: '100%' }} aria-expanded={open === e.id} onClick={() => setOpen(open === e.id ? null : e.id)}>{e.title}</button>
              {open === e.id && (
                <div className="card emergency" style={{ marginTop: 8 }}>
                  <ol>{e.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                  {e.note && <p style={{ marginTop: 10 }}><strong>{e.note}</strong></p>}
                  {e.tell && <p className="tell" style={{ marginTop: 10 }}><strong>Tell someone if…</strong> {e.tell}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Pouch />
      <Reminder />

      <section className="card">
        <h2>Good to know</h2>
        {GUIDES.map((g) => (
          <details className="qa" key={g.id}>
            <summary>{g.title}</summary>
            <div className="answer"><p>{g.body}</p></div>
          </details>
        ))}
      </section>
    </div>
  );
}
