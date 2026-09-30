import { Link } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { CycleChart } from '../components/CycleChart.jsx';
import { CONFIDENCE, typicalRange } from '../lib/cycles.js';

function Row({ label, value, note }) {
  return (
    <div className="pattern" style={{ justifyContent: 'space-between' }}>
      <span className="muted">{label}</span>
      <span style={{ textAlign: 'right' }}><strong>{value}</strong>{note && <><br /><span className="muted small">{note}</span></>}</span>
    </div>
  );
}

// "What has my body been doing?" Her own information, given back to her. Free.
export default function MyBody() {
  const { analysis: a, person } = useStore();
  const title = person.isChild ? `${person.Your} body` : 'My body';
  const { lengths, periodLengths, patterns, changes, checkIns, cycles, periods, common, stillChanging } = a;
  const heaviest = patterns.find((p) => p.id === 'heaviest');
  const recent = lengths.slice(-3);
  const noticed = patterns.filter((p) => !['length', 'heaviest'].includes(p.id));
  const c = CONFIDENCE[a.confidence];
  const usual = periodLengths.length ? typicalRange(periodLengths) : null;

  if (periods.length < 2) {
    return (
      <div className="stack">
        <h1>{title}</h1>
        <section className="card">
          <p className="big">We’re just getting to know {person.isChild ? person.you : 'you'} 🌱</p>
          <p>After you’ve logged a couple of periods, this page will show how long your periods usually last, how far apart they are, your heaviest day and your most common symptoms.</p>
          <p className="muted small">You don’t need to know any of this yourself. Figuring it out is Cadence’s job.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      <div>
        <h1>{title}</h1>
        <p className="muted">From what you’ve logged. Observations, not a diagnosis.</p>
      </div>

      <section className="card">
        <Row label="Periods" value={usual ? (usual[0] === usual[1] ? `Usually ${usual[0]} days` : `Usually ${usual[0]}–${usual[1]} days`) : 'Still learning'} />
        <Row label="Cycle" value={recent.length ? `Recently ${Math.min(...recent)}–${Math.max(...recent)} days` : 'Still learning'} note={`${c.emoji} ${c.label}`} />
        <Row label="Flow" value={heaviest ? heaviest.text.replace('Your heaviest day is usually ', 'Usually heaviest: ').replace('.', '') : 'Log flow to see your heaviest day'} />
        {common.length > 0 && (
          <div className="pattern" style={{ justifyContent: 'space-between' }}>
            <span className="muted">Common symptoms</span>
            <ol style={{ margin: 0, paddingLeft: 20, textAlign: 'left' }}>{common.map((s) => <li key={s.symptom}><strong>{s.symptom}</strong></li>)}</ol>
          </div>
        )}
      </section>

      {changes.length > 0 && (
        <section className="card warm">
          <h2>Something’s different</h2>
          {changes.map((t) => <p key={t}>{t}</p>)}
          <p className="small">Keep tracking to see if it continues. If it keeps happening or worries you, it may be worth telling someone.</p>
          <Link className="btn small" to="/tell">Help me tell someone</Link>
        </section>
      )}

      {(noticed.length > 0 || stillChanging) && (
        <section className="card calm">
          <h2>Something we’ve noticed</h2>
          {noticed.map((p) => <div className="pattern" key={p.id}><span className="mark" /><span>{p.text}</span></div>)}
          {stillChanging && <div className="pattern"><span className="mark" /><span>Your cycles are still changing quite a bit. That’s common when periods are relatively new.</span></div>}
        </section>
      )}

      {lengths.length > 0 && (
        <section className="card">
          <h2>Days between periods</h2>
          <p className="muted small">The shaded band is the 21–45 days that’s typical in the first few years.</p>
          <CycleChart cycles={cycles} />
        </section>
      )}

      {checkIns.length > 0 && (
        <section className="card calm">
          <h2>Worth talking about</h2>
          <ul style={{ paddingLeft: 20 }}>{checkIns.map((t) => <li key={t}>{t}</li>)}</ul>
          <Link className="btn small primary" to="/tell">Want help telling someone?</Link>
        </section>
      )}

      <Link className="btn block" to="/report">My period report (for a doctor)</Link>
    </div>
  );
}
