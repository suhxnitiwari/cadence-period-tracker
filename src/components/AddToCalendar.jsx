import { useStore } from '../store.jsx';
import { CALENDAR_STYLES, windowIcs, googleUrl, outlookUrl } from '../lib/ics.js';
import { formatRange } from '../lib/dates.js';

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}

/** "Add my period to my calendar": a range, at the privacy level she picks. */
export function AddToCalendar() {
  const { analysis: a, settings, saveSettings, calendarWindow, setCalendarWindow } = useStore();
  const style = settings.calendarStyle;
  const next = a.status.phase === 'period' ? null : a.next;
  const cycleKey = a.periods.at(-1)?.start;

  if (!next) {
    return (
      <section className="card" id="add">
        <h2>Add to my calendar</h2>
        <p className="muted">{a.status.phase === 'period' ? 'Once this period ends, you can add your next possible window.' : 'Log a period first, then you can add your possible window to Google, Apple or Outlook.'}</p>
      </section>
    );
  }

  const s = CALENDAR_STYLES[style];
  const same = calendarWindow?.cycleKey === cycleKey;
  const changed = same && (calendarWindow.earliest !== next.earliest || calendarWindow.latest !== next.latest || calendarWindow.style !== style);
  const sequence = same ? calendarWindow.sequence + (changed ? 1 : 0) : 0;
  const record = () => setCalendarWindow({ cycleKey, earliest: next.earliest, latest: next.latest, style, sequence });
  const event = { start: next.earliest, end: next.latest, title: s.title, details: s.details };

  return (
    <section className="card stack" id="add">
      <div>
        <h2>Add to my calendar</h2>
        <p className="muted small" style={{ margin: 0 }}>See your possible window next to your plans: {formatRange(next.earliest, next.latest)}. It’s added as a range, never one fake-exact day.</p>
      </div>
      <div>
        <p className="chip-label">What should the event say?</p>
        <div className="chips">
          {Object.entries(CALENDAR_STYLES).map(([k, v]) => (
            <button key={k} className="chip" aria-pressed={style === k} onClick={() => saveSettings({ calendarStyle: k })}>{v.emoji} {v.label}: “{v.title}”</button>
          ))}
        </div>
      </div>
      {changed && <p className="card calm small" style={{ margin: 0 }}>Your window moved since you last added it. Add it again and it’ll update the same event.</p>}
      <div className="row">
        <a className="btn small primary" href={googleUrl(event)} target="_blank" rel="noreferrer" onClick={record}>Google</a>
        <button className="btn small" onClick={() => { download('cadence-window.ics', windowIcs({ ...next, cycleKey, style, sequence })); record(); }}>Apple</button>
        <a className="btn small" href={outlookUrl(event)} target="_blank" rel="noreferrer" onClick={record}>Outlook</a>
      </div>
      <p className="muted small" style={{ margin: 0 }}>Apple and other calendars update the existing event when you add it again. Google may add a new one, so delete the old one there. Nothing is shared with Cadence.</p>
    </section>
  );
}
