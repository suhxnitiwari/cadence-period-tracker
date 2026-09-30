import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { DayEditor } from '../components/DayEditor.jsx';
import { Sheet } from '../components/Sheet.jsx';
import { AddToCalendar } from '../components/AddToCalendar.jsx';
import { MyLife } from '../components/MyLife.jsx';
import { addDays, formatDate, formatRange } from '../lib/dates.js';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function monthGrid(year, month) {
  const first = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lead = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = Array.from({ length: lead }, () => null);
  for (let i = 0; i < count; i++) cells.push(addDays(first, i));
  return cells;
}

export default function CalendarPage() {
  const { analysis, today, logRange } = useStore();
  const days = analysis.days; // includes confirmed days of an open period
  const [params, setParams] = useSearchParams();
  const [cursor, setCursor] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [open, setOpen] = useState(null);
  const [range, setRange] = useState(params.get('mode') === 'period' ? { start: null } : null);

  // The whole likely window is shaded, so it reads as "maybe", never as a promise.
  const maybe = useMemo(() => {
    const set = new Set();
    if (analysis.next && analysis.status.phase !== 'period') {
      for (let d = analysis.next.earliest; d <= analysis.next.latest; d = addDays(d, 1)) set.add(d);
    }
    return set;
  }, [analysis]);

  const cells = monthGrid(cursor.y, cursor.m);
  const title = new Date(Date.UTC(cursor.y, cursor.m, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const move = (delta) => setCursor(({ y, m }) => {
    const d = new Date(Date.UTC(y, m + delta, 1));
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
  });

  const endRange = () => {
    setRange(null);
    if (params.get('mode')) setParams({}, { replace: true });
  };
  const pick = (date) => {
    if (!range) return setOpen(date);
    if (date > today) return;
    if (!range.start || date < range.start) return setRange({ start: date });
    setRange({ start: range.start, end: date });
  };
  const inRange = (d) => range?.start && d >= range.start && d <= (range.end ?? range.start);

  const history = [...analysis.periods].reverse();

  return (
    <div className="stack">
      {range ? (
        <div className="card warm stack">
          <p style={{ margin: 0 }}>
            {!range.start && <>Tap the <strong>first day</strong> of your period.</>}
            {range.start && !range.end && <>Now tap the <strong>last day</strong> (or the same day if it was just one).</>}
            {range.end && <>Add <strong>{formatRange(range.start, range.end)}</strong> as a period?</>}
          </p>
          <div className="row">
            {range.end && <button className="btn small primary" onClick={() => { logRange(range.start, range.end); endRange(); }}>Add it</button>}
            <button className="btn small" onClick={endRange}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="row">
          <h1 style={{ margin: 0, flex: 1 }}>Calendar</h1>
          <button className="btn small" onClick={() => setRange({ start: null })}>Add a past period</button>
        </div>
      )}

      <section className="card" style={{ padding: '14px 10px' }}>
        <div className="cal-head">
          <h2 style={{ paddingLeft: 6 }}>{title}</h2>
          <button className="btn small" onClick={() => move(-1)} aria-label="Previous month">‹</button>
          <button className="btn small" onClick={() => move(1)} aria-label="Next month">›</button>
        </div>
        <div className="cal">
          {DOW.map((d, i) => <div key={i} className="dow" aria-hidden="true">{d}</div>)}
          {cells.map((date, i) => {
            if (!date) return <div key={`pad-${i}`} className="day out" />;
            const log = days[date];
            const classes = ['day'];
            if (date > today) classes.push('future');
            if (date === today) classes.push('today');
            if (log?.flow) classes.push(log.flow);
            else if (maybe.has(date) && date >= today) classes.push('maybe');
            if (inRange(date)) classes.push('selecting');
            const details = log && (log.symptoms?.length || log.notes || log.pain);
            const label = [formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' }),
              log?.flow && (log.flow === 'yes' ? 'period' : `${log.flow} bleeding`),
              details && 'has symptoms or notes',
              !log?.flow && maybe.has(date) && date >= today && 'period might come'].filter(Boolean).join(', ');
            return (
              <button key={date} className={classes.join(' ')} aria-label={label} onClick={() => pick(date)} disabled={date > today && Boolean(range)}>
                {Number(date.slice(8))}
                {details && <span className="dot" />}
              </button>
            );
          })}
        </div>
        <div className="legend">
          <span><i className="swatch" style={{ background: 'var(--flow-light)' }} />Light</span>
          <span><i className="swatch" style={{ background: 'var(--flow-medium)' }} />Medium</span>
          <span><i className="swatch" style={{ background: 'var(--flow-heavy)' }} />Heavy</span>
          <span><i className="swatch day maybe" style={{ aspectRatio: 'auto', padding: 0 }} />Might come</span>
        </div>
        {analysis.next && analysis.status.phase !== 'period' && (
          <p className="muted small" style={{ margin: '10px 6px 0' }}>Striped days show when your next period might come: {formatRange(analysis.next.earliest, analysis.next.latest)}. It’s a range because bodies aren’t clocks.</p>
        )}
      </section>

      <AddToCalendar />
      <MyLife />

      <section className="card">
        <h2>History</h2>
        {history.length ? (
          <table>
            <thead><tr><th>Started</th><th className="num">Lasted</th><th className="num">Days until next</th></tr></thead>
            <tbody>
              {history.map((p, i) => {
                const cycle = analysis.cycles.find((c) => c.start === p.start);
                const ongoing = i === 0 && analysis.status.phase === 'period';
                return (
                  <tr key={p.start}>
                    <td>{formatDate(p.start, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="num">{ongoing ? 'now' : p.estimated ? '–' : `${p.length} days`}</td>
                    <td className="num">{cycle ? `${cycle.length}` : '–'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <p className="muted">Your periods will show up here. Every one you log is kept, for free, forever.</p>}
      </section>

      {open && (
        <Sheet title={formatDate(open, { weekday: 'long', month: 'long', day: 'numeric' })} onClose={() => setOpen(null)}>
          {open > today ? <p className="muted">You can log this day when it comes.</p> : <DayEditor date={open} />}
        </Sheet>
      )}
    </div>
  );
}
