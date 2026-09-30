import { Link } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { StatusCard } from '../components/StatusCard.jsx';
import { DayEditor } from '../components/DayEditor.jsx';
import { RequestButtons } from './People.jsx';
import { googleCalendarUrl } from '../lib/ics.js';
import { formatDate, addDays } from '../lib/dates.js';

export default function Today() {
  const { analysis, today, days, saveDay, shares, settings } = useStore();
  const { status } = analysis;
  const todayLog = days[today] ?? {};
  const yesterdayBleeding = ['light', 'medium', 'heavy'].includes(days[addDays(today, -1)]?.flow);
  const canStart = status.phase !== 'period' && !todayLog.flow;
  const next = analysis.predictions[0];
  const sharesRequests = shares.some((s) => s.fields.includes('requests'));

  return (
    <div className="grid-2">
      <div className="stack">
        <StatusCard analysis={analysis} today={today} />

        {canStart && status.phase !== 'empty' && (
          <button className="btn period" style={{ width: '100%' }} onClick={() => saveDay(today, { ...todayLog, flow: 'medium' })}>
            My period started today
          </button>
        )}
        {status.phase === 'period' && !todayLog.flow && yesterdayBleeding && (
          <div className="card row">
            <span>Still bleeding today?</span>
            <span className="spacer" />
            <button className="btn small period" onClick={() => saveDay(today, { ...todayLog, flow: days[addDays(today, -1)].flow })}>Yes, same as yesterday</button>
          </div>
        )}

        {sharesRequests && (
          <section className="card">
            <h3>Need something?</h3>
            <p className="muted small">Tap one and the people you share with will see it on their link. Tap again to clear it.</p>
            <RequestButtons />
          </section>
        )}

        {next && status.phase !== 'empty' && (
          <section className="card">
            <h3>Put it on your calendar</h3>
            <p className="muted small">Adds your next likely period ({formatDate(next.earliest)} to {formatDate(next.latest)}) to Google Calendar. For one that updates itself, turn on calendar sync in <Link to="/settings#calendar">Settings</Link>.</p>
            <a className="btn small" href={googleCalendarUrl(next, settings.calendar.title)} target="_blank" rel="noreferrer">Add to Google Calendar</a>
          </section>
        )}
      </div>

      <section className="card">
        <h2>Today</h2>
        <p className="muted small">Log as much or as little as you like. It saves as you tap.</p>
        <DayEditor date={today} />
      </section>
    </div>
  );
}
