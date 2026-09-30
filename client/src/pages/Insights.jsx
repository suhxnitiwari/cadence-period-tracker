import { Link } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { CycleChart } from '../components/CycleChart.jsx';
import { symptomPatterns } from '../lib/cycles.js';
import { formatDate } from '../lib/dates.js';
import { confidenceLabel } from '../components/StatusCard.jsx';

export function Flags({ flags }) {
  if (!flags.length) return null;
  return (
    <section className="card">
      <h2>Worth mentioning to a doctor</h2>
      <p className="muted small">These aren’t diagnoses. They’re patterns clinicians find useful to hear about. Cycles are often irregular for the first few years after periods start, and that’s normal.</p>
      <ul>{flags.map((f) => <li key={f}>{f}</li>)}</ul>
      <Link to="/report" className="btn small">Make a report to bring to an appointment</Link>
    </section>
  );
}

export default function Insights() {
  const { analysis, days } = useStore();
  const { lengths, avgCycle, variation, avgPeriod, cycles, periods, flags } = analysis;
  const patterns = symptomPatterns(days, periods);

  if (periods.length < 2) {
    return (
      <div className="narrow card">
        <h1>Insights</h1>
        <p>Insights appear once you’ve logged two periods, because that’s when there’s a full cycle to measure.</p>
        <p className="muted">Logged {periods.length} so far. You can add past periods from the <Link to="/calendar?mode=period">calendar</Link>.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="row">
        <h1 style={{ margin: 0 }}>Insights</h1>
        <span className="spacer" />
        <Link to="/report" className="btn small">Doctor report</Link>
      </div>

      <div className="stats">
        <div className="stat"><div className="label">Average cycle</div><div className="value">{avgCycle ? Math.round(avgCycle) : '–'}<small>days</small></div></div>
        <div className="stat"><div className="label">Varies by about</div><div className="value">{variation != null ? `±${Math.round(variation)}` : '–'}<small>days</small></div></div>
        <div className="stat"><div className="label">Average period</div><div className="value">{avgPeriod ? Math.round(avgPeriod) : '–'}<small>days</small></div></div>
        <div className="stat"><div className="label">Cycles logged</div><div className="value">{lengths.length}</div></div>
      </div>
      <p className="muted small">{confidenceLabel(analysis)}.</p>

      <Flags flags={flags} />

      <div className="grid-2">
        <section className="card">
          <h2>Cycle length</h2>
          <p className="muted small">Days from the start of one period to the start of the next. The shaded band is the typical 21–35 day adult range.</p>
          <CycleChart cycles={cycles} />
        </section>

        <section className="card">
          <h2>Your patterns</h2>
          {patterns.length ? (
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {patterns.map((p) => (
                <li key={p.symptom} style={{ marginBottom: 8 }}>
                  <strong>{p.symptom}</strong> usually shows up {p.when}.
                  <span className="muted small"> ({p.count} times logged)</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Log symptoms like cramps, headaches or mood on a few more days and Cadence will point out when they tend to show up. Knowing that ahead of time helps you plan.</p>
          )}
        </section>
      </div>

      <section className="card">
        <h2>History</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Period started</th><th className="num">Period length</th><th className="num">Cycle length</th></tr></thead>
            <tbody>
              {[...cycles].reverse().map((c) => (
                <tr key={c.start}>
                  <td>{formatDate(c.start, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="num">{c.periodLength} days</td>
                  <td className="num">{c.gap ? <span className="muted">gap in logging</span> : `${c.length} days`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
