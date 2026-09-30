import { Link } from 'react-router-dom';
import { formatRange, formatDate, diffDays } from '../lib/dates.js';

export function confidenceLabel(analysis) {
  const n = analysis.lengths.length;
  const spread = analysis.predictions[0] ? diffDays(analysis.predictions[0].latest, analysis.predictions[0].expected) : 0;
  return {
    estimate: 'Estimate: based on the typical cycle length in Settings',
    learning: `Still learning: ${n} cycle${n === 1 ? '' : 's'} logged so far`,
    steady: `Your cycles are steady (give or take ${spread} days)`,
    varies: 'Your cycles vary, so the range is wider',
    irregular: 'Your cycles are irregular, so the range is wide',
  }[analysis.confidence];
}

export function StatusCard({ analysis, today }) {
  const { status } = analysis;

  if (status.phase === 'empty') {
    return (
      <section className="card hero">
        <div className="eyebrow">Welcome</div>
        <p className="headline">Let’s start with your last period.</p>
        <p className="muted">Log the days of your most recent period (or today, if it just started) and Cadence will start learning your cycle.</p>
        <Link to="/calendar?mode=period" className="btn primary">Log a past period</Link>
      </section>
    );
  }

  if (status.phase === 'period') {
    return (
      <section className="card hero">
        <div className="eyebrow">Today · {formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <p className="headline">Period, <em>day {status.day}</em></p>
        <p className="muted">Log how heavy it is each day. When you stop logging bleeding, Cadence knows your period has ended.</p>
      </section>
    );
  }

  if (status.phase === 'late') {
    return (
      <section className="card hero">
        <div className="eyebrow">Cycle day {status.cycleDay}</div>
        <p className="headline">Your period is {status.daysLate} day{status.daysLate === 1 ? '' : 's'} later than expected.</p>
        <p className="muted">
          That’s common. Stress, illness, travel, sleep changes, sports and the first few years after periods start can all shift a cycle.
          If you’re worried, talking to someone you trust or a doctor is always okay.
        </p>
      </section>
    );
  }

  const { minDays, maxDays, next } = status;
  const headline = minDays === 0
    ? <>Your period could start <em>any day now</em>.</>
    : <>Next period likely in <em>{minDays}–{maxDays} days</em></>;
  return (
    <section className="card hero">
      <div className="eyebrow">Cycle day {status.cycleDay}</div>
      <p className="headline">{headline}</p>
      <p style={{ marginBottom: 12 }}>Most likely between <strong>{formatRange(next.earliest, next.latest)}</strong>.</p>
      <span className="pill">{confidenceLabel(analysis)}</span>
    </section>
  );
}
