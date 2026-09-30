import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchNormal } from '../content/normal.js';

const SUGGESTIONS = ['My blood is brown', 'I have clots', 'My period stopped and came back', 'My cramps really hurt', 'Why am I crying?', 'I got blood on my clothes'];

export function Answer({ item, open = false }) {
  return (
    <details className="qa" open={open}>
      <summary>{item.q}</summary>
      <div className="answer stack">
        <p><strong>What’s happening:</strong> {item.happening}</p>
        <p><strong>Usually:</strong> {item.usually}</p>
        {item.watch && <p><strong>Keep an eye on:</strong> {item.watch}</p>}
        {item.tell && <p className="tell"><strong>Tell someone if…</strong> {item.tell}</p>}
      </div>
    </details>
  );
}

// "Is this normal?" Private search. Nothing typed here leaves the device.
export default function Normal() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const results = searchNormal(q);

  return (
    <div className="stack">
      <div>
        <h1>Is this normal?</h1>
        <p className="muted">Type what’s going on, in your own words. What you type stays on this device.</p>
      </div>
      <input type="search" value={q} autoFocus placeholder="e.g. my blood is brown"
        onChange={(e) => { setQ(e.target.value); setParams(e.target.value ? { q: e.target.value } : {}, { replace: true }); }} />
      {!q && (
        <div className="chips">
          {SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => setQ(s)}>{s}</button>)}
        </div>
      )}
      <section className="card" style={{ paddingTop: 4, paddingBottom: 4 }}>
        {results.length ? results.map((item, i) => <Answer key={item.id} item={item} open={Boolean(q) && i === 0} />) : (
          <p style={{ padding: '14px 0' }}>We don’t have an answer for that yet. A parent, guardian, school nurse or doctor can help. <Link to="/tell?topic=other">Help me ask someone</Link></p>
        )}
      </section>
      <p className="muted small">General information, not medical advice. If something feels wrong, trust that and tell someone.</p>
    </div>
  );
}
