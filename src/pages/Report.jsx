import { useState } from 'react';
import { useStore } from '../store.jsx';
import { analyze, PAIN_LABELS, SCHOOL_IMPACT } from '../lib/cycles.js';
import { addDays, formatDate } from '../lib/dates.js';

const RANGES = [[6, 'Last 6 months'], [12, 'Last 12 months'], [0, 'Everything']];
const PAIN_RANK = { none: 0, mild: 1, moderate: 2, severe: 3 };

// "My period report": what she can show a doctor, because nobody should have to
// remember their cycle length on the spot. Built on this device; nothing is uploaded.
export default function Report() {
  const { days: allDays, today, openPeriod } = useStore();
  const [months, setMonths] = useState(6);

  const from = months ? addDays(today, -months * 30) : '0000-01-01';
  const days = Object.fromEntries(Object.entries(allDays).filter(([d]) => d >= from && d <= today));
  const a = analyze(days, { openPeriod }, today);
  const all = Object.values(a.days);
  const count = (fn) => all.filter(fn).length;
  const long = (d) => formatDate(d, { month: 'short', day: 'numeric', year: 'numeric' });
  const symptomCounts = {};
  all.forEach((d) => (d.symptoms ?? []).forEach((s) => { symptomCounts[s] = (symptomCounts[s] ?? 0) + 1; }));
  const topSymptoms = Object.entries(symptomCounts).sort((x, y) => y[1] - x[1]).slice(0, 8);

  return (
    <div className="stack">
      <div className="card no-print stack">
        <p style={{ margin: 0 }}>Show this to a doctor on your phone, or print it or save it as a PDF.</p>
        <div className="chips">{RANGES.map(([m, l]) => <button key={m} className="chip" aria-pressed={months === m} onClick={() => setMonths(m)}>{l}</button>)}</div>
        <div><button className="btn primary" onClick={() => window.print()}>Print or save as PDF</button></div>
      </div>

      <article className="card stack">
        <header>
          <h1 style={{ marginBottom: 4 }}>My period report</h1>
          <p className="muted small" style={{ margin: 0 }}>{RANGES.find((r) => r[0] === months)[1]} · Made {long(today)} · Self-logged in Cadence</p>
        </header>

        <table>
          <tbody>
            <tr><th scope="row">Periods logged</th><td className="num">{a.periods.length}</td></tr>
            <tr><th scope="row">Days between periods</th><td className="num">{a.lengths.length ? `${Math.round(a.avgCycle)} on average (${Math.min(...a.lengths)}–${Math.max(...a.lengths)})` : '–'}</td></tr>
            <tr><th scope="row">Cycle-to-cycle variation</th><td className="num">{a.variation != null ? `±${Math.round(a.variation)} days` : '–'}</td></tr>
            <tr><th scope="row">Period length</th><td className="num">{a.periodLengths.length ? `${Math.min(...a.periodLengths)}–${Math.max(...a.periodLengths)} days` : '–'}</td></tr>
            <tr><th scope="row">Heavy flow days</th><td className="num">{count((d) => d.flow === 'heavy')}</td></tr>
            <tr><th scope="row">Spotting days</th><td className="num">{count((d) => d.flow === 'spotting')}</td></tr>
            <tr><th scope="row">Days with clots</th><td className="num">{count((d) => d.symptoms?.includes('Clots'))}</td></tr>
            <tr><th scope="row">Pain (a little / medium / a lot)</th><td className="num">{count((d) => d.pain === 'mild')} / {count((d) => d.pain === 'moderate')} / {count((d) => d.pain === 'severe')}</td></tr>
            <tr><th scope="row">Took pain medicine</th><td className="num">{count((d) => d.symptoms?.includes('Pain medicine'))} days</td></tr>
            <tr><th scope="row">School affected a lot / went home</th><td className="num">{count((d) => d.school === 'lot')} / {count((d) => d.school === 'home')} days</td></tr>
          </tbody>
        </table>

        {(a.changes.length > 0 || a.checkIns.length > 0) && (
          <section>
            <h3>Changes and things to discuss</h3>
            <ul>{[...a.changes, ...a.checkIns].map((t) => <li key={t}>{t}</li>)}</ul>
          </section>
        )}

        {a.periods.length > 0 && (
          <section>
            <h3>Each period</h3>
            <table>
              <thead><tr><th>Started</th><th className="num">Length</th><th className="num">Heavy</th><th>Worst pain</th><th className="num">Next came</th></tr></thead>
              <tbody>
                {[...a.periods].reverse().map((p) => {
                  const logs = p.days.map((d) => a.days[d]);
                  const worst = logs.reduce((w, l) => ((PAIN_RANK[l.pain] ?? -1) > (PAIN_RANK[w] ?? -1) ? l.pain : w), null);
                  const cycle = a.cycles.find((c) => c.start === p.start);
                  return (
                    <tr key={p.start}>
                      <td>{long(p.start)}</td>
                      <td className="num">{p.estimated ? '–' : `${p.length} d`}</td>
                      <td className="num">{logs.filter((l) => l.flow === 'heavy').length}</td>
                      <td>{worst ? PAIN_LABELS[worst] : '–'}</td>
                      <td className="num">{cycle ? `${cycle.length} d` : '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {topSymptoms.length > 0 && (
          <section>
            <h3>Most logged</h3>
            <table><tbody>{topSymptoms.map(([s, n]) => <tr key={s}><td>{s}</td><td className="num">{n} days</td></tr>)}</tbody></table>
          </section>
        )}

        <p className="muted small" style={{ margin: 0 }}>Logged by the patient. Not a diagnosis. School impact options: {SCHOOL_IMPACT.map((x) => x[1]).join(', ')}.</p>
      </article>
    </div>
  );
}
