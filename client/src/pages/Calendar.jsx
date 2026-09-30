import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { DayEditor } from '../components/DayEditor.jsx';
import { Sheet } from '../components/Sheet.jsx';
import { addDays, diffDays, formatDate, formatRange } from '../lib/dates.js';
import { isEmptyLog } from '../lib/cycles.js';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function monthGrid(year, month) {
  const first = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lead = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = Array.from({ length: lead }, () => null);
  for (let i = 0; i < count; i++) cells.push(addDays(first, i));
  return cells;
}

export default function CalendarPage() {
  const { days, analysis, today, saveDays } = useStore();
  const [params, setParams] = useSearchParams();
  const [cursor, setCursor] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [open, setOpen] = useState(null);
  const [range, setRange] = useState(params.get('mode') === 'period' ? { start: null } : null);

  const predicted = useMemo(() => {
    const set = new Set();
    for (const p of analysis.predictions) for (let i = 0; i < p.length; i++) set.add(addDays(p.expected, i));
    return set;
  }, [analysis.predictions]);
  const fertile = useMemo(() => {
    const set = new Set();
    if (analysis.showFertile) for (const p of analysis.predictions) for (let d = p.fertile.start; d <= p.fertile.end; d = addDays(d, 1)) set.add(d);
    return set;
  }, [analysis]);

  const cells = monthGrid(cursor.y, cursor.m);
  const title = new Date(Date.UTC(cursor.y, cursor.m, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const move = (delta) => setCursor(({ y, m }) => {
    const d = new Date(Date.UTC(y, m + delta, 1));
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
  });

  const endRangeMode = () => {
    setRange(null);
    if (params.get('mode')) setParams({}, { replace: true });
  };

  const pick = (date) => {
    if (!range) return setOpen(date);
    if (date > today) return;
    if (!range.start || date < range.start) return setRange({ start: date });
    setRange({ start: range.start, end: date });
  };

  const confirmRange = async () => {
    const updates = {};
    const len = diffDays(range.end, range.start) + 1;
    for (let i = 0; i < len; i++) {
      const d = addDays(range.start, i);
      if (!days[d]?.flow || days[d].flow === 'spotting') updates[d] = { ...days[d], flow: 'medium' };
    }
    await saveDays(updates);
    endRangeMode();
  };

  const inRange = (d) => range?.start && d >= range.start && d <= (range.end ?? range.start);

  return (
    <div className="narrow" style={{ maxWidth: 760 }}>
      {range ? (
        <div className="notice row" style={{ marginBottom: 16 }}>
          <span>
            {!range.start && <>Tap the <strong>first day</strong> of the period.</>}
            {range.start && !range.end && <>Now tap the <strong>last day</strong> (or the same day again if it was one day).</>}
            {range.end && <>Log <strong>{formatRange(range.start, range.end)}</strong> as a period? You can adjust each day’s flow after.</>}
          </span>
          <span className="spacer" />
          {range.end && <button className="btn small primary" onClick={confirmRange}>Log it</button>}
          <button className="btn small" onClick={endRangeMode}>Cancel</button>
        </div>
      ) : (
        <div className="row" style={{ marginBottom: 16 }}>
          <p className="muted small" style={{ margin: 0 }}>Tap any day to log it.</p>
          <span className="spacer" />
          <button className="btn small" onClick={() => setRange({ start: null })}>Log a past period</button>
        </div>
      )}

      <section className="card cal-card">
        <div className="cal-head">
          <h2>{title}</h2>
          <button className="btn small" onClick={() => move(-1)} aria-label="Previous month">‹</button>
          <button className="btn small" onClick={() => setCursor({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 })}>Today</button>
          <button className="btn small" onClick={() => move(1)} aria-label="Next month">›</button>
        </div>
        <div className="cal">
          {DOW.map((d) => <div key={d} className="dow" aria-hidden="true">{d}</div>)}
          {cells.map((date, i) => {
            if (!date) return <div key={`pad-${i}`} className="day out" />;
            const log = days[date];
            const future = date > today;
            const classes = ['day'];
            if (future) classes.push('future');
            if (date === today) classes.push('today');
            if (log?.flow) classes.push(log.flow);
            else if (predicted.has(date) && date >= today) classes.push('predicted');
            if (fertile.has(date) && date >= today) classes.push('fertile');
            if (inRange(date)) classes.push('selecting');
            const hasDetails = log && (log.symptoms?.length || log.notes || log.pain);
            const label = [formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' }),
              log?.flow && `${log.flow} flow`, hasDetails && 'has notes or symptoms',
              !log?.flow && predicted.has(date) && date >= today && 'predicted period',
              fertile.has(date) && date >= today && 'estimated fertile window'].filter(Boolean).join(', ');
            return (
              <button key={date} className={classes.join(' ')} onClick={() => pick(date)} aria-label={label}
                disabled={future && Boolean(range)}>
                {Number(date.slice(8))}
                {hasDetails && <span className="dot" />}
              </button>
            );
          })}
        </div>
        <div className="legend">
          <span><i className="swatch" style={{ background: 'var(--flow-light)' }} />Light</span>
          <span><i className="swatch" style={{ background: 'var(--flow-medium)' }} />Medium</span>
          <span><i className="swatch" style={{ background: 'var(--flow-heavy)' }} />Heavy</span>
          <span><i className="swatch" style={{ border: '2px dashed var(--flow-medium)' }} />Predicted</span>
          {analysis.showFertile && <span><i className="swatch" style={{ background: 'var(--fertile)', height: 4 }} />Fertile window (estimate, not birth control)</span>}
        </div>
        {analysis.predictions[0] && (
          <p className="muted small" style={{ marginTop: 12, marginBottom: 0 }}>
            Predicted days show the middle of the likely range. Your next period could start anywhere from {formatRange(analysis.predictions[0].earliest, analysis.predictions[0].latest)}.
          </p>
        )}
      </section>

      {open && (
        <Sheet title={formatDate(open, { weekday: 'long', month: 'long', day: 'numeric' })} onClose={() => setOpen(null)}>
          {open > today
            ? <p className="muted">You can log this day when it comes.</p>
            : <DayEditor date={open} />}
          {open <= today && isEmptyLog(days[open]) && <p className="muted small" style={{ marginTop: 16 }}>Nothing logged for this day yet.</p>}
        </Sheet>
      )}
    </div>
  );
}
