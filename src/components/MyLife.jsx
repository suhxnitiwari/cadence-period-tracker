import { useState } from 'react';
import { useStore } from '../store.jsx';
import { PLAN_KINDS, planOverlaps } from '../lib/plans.js';
import { formatDate, formatRange } from '../lib/dates.js';

/** "My life": plans she adds, checked against her possible window. Stays on this device. */
export function MyLife() {
  const { plans, addPlan, removePlan, analysis: a, today } = useStore();
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState(PLAN_KINDS[0]);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const overlapping = new Set(planOverlaps(plans, a.next, today, a.patterns).map((p) => p.id));
  const upcoming = plans.filter((p) => (p.end ?? p.start) >= today);

  const save = (e) => {
    e.preventDefault();
    if (!start) return;
    addPlan({ emoji: kind[0], title: title.trim() || kind[1], start, end: end && end >= start ? end : null });
    setAdding(false); setTitle(''); setStart(''); setEnd('');
  };

  return (
    <section className="card stack">
      <div>
        <h2>My life</h2>
        <p className="muted small" style={{ margin: 0 }}>Add trips, exams, swim meets or sleepovers, and Cadence will tell you if your period might overlap.</p>
      </div>
      {upcoming.length > 0 && (
        <ul className="list">
          {upcoming.map((p) => (
            <li key={p.id} className="row" style={{ padding: '10px 0' }}>
              <span style={{ flex: 1 }}>
                <strong>{p.emoji} {p.title}</strong><br />
                <span className="muted small">{p.end ? formatRange(p.start, p.end) : formatDate(p.start, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                {overlapping.has(p.id) && <><br /><span className="small" style={{ color: 'var(--calm)', fontWeight: 600 }}>🌷 Might overlap your period</span></>}
              </span>
              <button className="icon-btn" aria-label={`Remove ${p.title}`} onClick={() => removePlan(p.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}
      {adding ? (
        <form className="stack" onSubmit={save}>
          <div className="chips">
            {PLAN_KINDS.map((k) => <button type="button" key={k[1]} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{k[0]} {k[1]}</button>)}
          </div>
          <label className="field"><span>Name <span className="muted small">(optional)</span></span><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind[1]} maxLength={40} /></label>
          <div className="row">
            <label className="field spacer"><span>Starts</span><input type="date" min={today} value={start} onChange={(e) => setStart(e.target.value)} required /></label>
            <label className="field spacer"><span>Ends <span className="muted small">(optional)</span></span><input type="date" min={start || today} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
          </div>
          <div className="row"><button className="btn small primary">Add plan</button><button type="button" className="btn small" onClick={() => setAdding(false)}>Cancel</button></div>
        </form>
      ) : <button className="btn small" onClick={() => setAdding(true)}>+ Add a plan</button>}
    </section>
  );
}
