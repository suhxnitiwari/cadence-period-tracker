import { useState } from 'react';
import { useStore } from '../store.jsx';
import { analyze, symptomFrequency } from '../lib/cycles.js';
import { addDays, formatDate } from '../lib/dates.js';

const RANGES = [[3, 'Last 3 months'], [6, 'Last 6 months'], [12, 'Last 12 months'], [0, 'Everything']];
const PAIN_RANK = { none: 0, mild: 1, moderate: 2, severe: 3 };

// A one-page summary a clinician can read in under a minute.
export default function Report() {
  const { days: allDays, settings, today } = useStore();
  const [months, setMonths] = useState(6);
  const [name, setName] = useState(settings.displayName ?? '');

  const from = months ? addDays(today, -months * 30) : '0000-01-01';
  const days = Object.fromEntries(Object.entries(allDays).filter(([d]) => d >= from && d <= today));
  const a = analyze(days, settings, today);
  const freq = symptomFrequency(days, a.periods);
  const painDays = Object.values(days).reduce((acc, d) => { if (d.pain) acc[d.pain] = (acc[d.pain] ?? 0) + 1; return acc; }, {});
  const round = (x) => (x == null ? '–' : Math.round(x));
  const long = (d) => formatDate(d, { month: 'short', day: 'numeric', year: 'numeric' });

  const perPeriod = a.periods.map((p, i) => {
    const logs = p.days.map((d) => days[d]);
    const worstPain = logs.reduce((w, l) => (PAIN_RANK[l.pain] ?? -1) > (PAIN_RANK[w] ?? -1) ? l.pain : w, null);
    return {
      start: p.start, length: p.length,
      heavy: logs.filter((l) => l.flow === 'heavy').length,
      worstPain,
      cycle: a.cycles[i] ? (a.cycles[i].gap ? null : a.cycles[i].length) : null,
    };
  });

  return (
    <div className="narrow" style={{ maxWidth: 760 }}>
      <div className="card no-print stack" style={{ marginBottom: 20 }}>
        <p style={{ margin: 0 }}>Bring this to an appointment, print it, or save it as a PDF. It only includes what you choose here and nothing is uploaded.</p>
        <div className="row">
          <label className="field" style={{ flex: '1 1 200px' }}>
            <span>Name on report (optional)</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field" style={{ flex: '1 1 160px' }}>
            <span>Time period</span>
            <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              {RANGES.map(([m, l]) => <option key={m} value={m}>{l}</option>)}
            </select>
          </label>
        </div>
        <div><button className="btn primary" onClick={() => window.print()}>Print or save as PDF</button></div>
      </div>

      <article className="card stack">
        <header>
          <h1 style={{ marginBottom: 4 }}>Menstrual cycle summary</h1>
          <p className="muted" style={{ margin: 0 }}>
            {name && <>{name} · </>}{months ? `${RANGES.find((r) => r[0] === months)[1]}` : 'All logged data'} · Generated {long(today)} · Self-reported data from Cadence
          </p>
        </header>

        <section>
          <h3>Overview</h3>
          <table>
            <tbody>
              <tr><th scope="row">Periods logged</th><td className="num">{a.periods.length}</td></tr>
              <tr><th scope="row">Average cycle length</th><td className="num">{round(a.avgCycle)} days {a.lengths.length ? `(range ${Math.min(...a.lengths)}–${Math.max(...a.lengths)})` : ''}</td></tr>
              <tr><th scope="row">Cycle-to-cycle variation</th><td className="num">{a.variation != null ? `±${round(a.variation)} days` : '–'}</td></tr>
              <tr><th scope="row">Average period length</th><td className="num">{round(a.avgPeriod)} days</td></tr>
              <tr><th scope="row">Days with heavy flow</th><td className="num">{Object.values(days).filter((d) => d.flow === 'heavy').length}</td></tr>
              <tr><th scope="row">Days with pain (mild / moderate / severe)</th><td className="num">{painDays.mild ?? 0} / {painDays.moderate ?? 0} / {painDays.severe ?? 0}</td></tr>
              {a.status.phase !== 'empty' && <tr><th scope="row">Most recent period started</th><td className="num">{long(a.periods.at(-1).start)}</td></tr>}
            </tbody>
          </table>
        </section>

        {a.flags.length > 0 && (
          <section>
            <h3>Patterns to discuss</h3>
            <ul>{a.flags.map((f) => <li key={f}>{f}</li>)}</ul>
          </section>
        )}

        {perPeriod.length > 0 && (
          <section>
            <h3>Each period</h3>
            <table>
              <thead><tr><th>Started</th><th className="num">Length</th><th className="num">Heavy days</th><th>Worst pain</th><th className="num">Cycle length</th></tr></thead>
              <tbody>
                {[...perPeriod].reverse().map((p) => (
                  <tr key={p.start}>
                    <td>{long(p.start)}</td>
                    <td className="num">{p.length} d</td>
                    <td className="num">{p.heavy}</td>
                    <td>{p.worstPain ?? '–'}</td>
                    <td className="num">{p.cycle ? `${p.cycle} d` : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {freq.length > 0 && (
          <section>
            <h3>Symptoms (share of cycles they appeared in)</h3>
            <table>
              <tbody>
                {freq.map((f) => <tr key={f.symptom}><td>{f.symptom}</td><td className="num">{f.cycles} of {a.cycles.length} cycles ({Math.round(f.share * 100)}%)</td></tr>)}
              </tbody>
            </table>
          </section>
        )}

        <p className="muted small">This summary is based on what the patient logged and isn’t a diagnosis.</p>
      </article>
    </div>
  );
}
