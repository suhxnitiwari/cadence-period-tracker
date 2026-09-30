import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { DayEditor } from '../components/DayEditor.jsx';
import { GotPeriod } from '../components/GotPeriod.jsx';
import { PERIOD_FLOWS, CONFIDENCE, SCHOOL_IMPACT } from '../lib/cycles.js';
import { say } from '../lib/voice.js';
import { planOverlaps } from '../lib/plans.js';
import { ageCheckIns } from '../lib/profile.js';
import { addDays, diffDays, formatDate, formatRange } from '../lib/dates.js';

const long = (d) => formatDate(d, { weekday: 'long', month: 'long', day: 'numeric' });

function Confidence({ a }) {
  const c = CONFIDENCE[a.confidence];
  return (
    <>
      <p>{c.note}</p>
      <span className="pill">{c.emoji} {c.label}</span>
    </>
  );
}

function lastLoggedBleeding(days, from, today) {
  let last = from;
  for (let d = from; d <= today; d = addDays(d, 1)) if (PERIOD_FLOWS.has(days[d]?.flow)) last = d;
  return last;
}

function Status({ onGotIt }) {
  const { analysis: a, today, days, profile, endPeriod, setDay, settings } = useStore();
  const { status, next } = a;
  const [endDate, setEndDate] = useState(null);

  if (status.phase === 'none') {
    return (
      <section className="card">
        <div className="eyebrow">{profile.stage === 'notYet' ? 'Getting ready' : 'Welcome'}</div>
        <p className="big">{profile.stage === 'notYet' ? 'Your first period hasn’t come yet.' : 'Tap below when your period starts.'}</p>
        <p className="muted">{profile.stage === 'notYet'
          ? 'When it comes, tap the button below. Cadence will help you figure out what to do.'
          : 'Or add your last period on the calendar if you remember it.'}</p>
        <button className="btn accent block" onClick={onGotIt}>{say(settings.voice, 'gotIt')}</button>
        {profile.stage !== 'notYet' && <Link className="btn block" style={{ marginTop: 10 }} to="/calendar?mode=period">Add a past period</Link>}
      </section>
    );
  }

  if (status.phase === 'period') {
    return (
      <section className="card">
        <div className="eyebrow">{long(today)}</div>
        <p className="big">Period, <em>day {status.day}</em></p>
        <p className="muted">Log how it’s going below. When it’s over, tap the button so Cadence knows.</p>
        <div className="row">
          <button className="btn primary" onClick={() => endPeriod(today)}>It ended today</button>
          {status.day > 1 && <button className="btn" onClick={() => endPeriod(addDays(today, -1))}>It ended yesterday</button>}
        </div>
      </section>
    );
  }

  if (status.phase === 'stillGoing') {
    const lastLogged = lastLoggedBleeding(days, status.start, today);
    const chosen = endDate ?? lastLogged;
    return (
      <section className="card warm">
        <p className="big">Are you still on your period?</p>
        <p>You haven’t logged it since {formatDate(lastLogged, { weekday: 'long', month: 'short', day: 'numeric' })}. We don’t want to guess.</p>
        <div className="stack">
          <button className="btn accent block" onClick={() => setDay(today, { ...days[today], flow: 'yes' })}>Yes, still going</button>
          <div className="card stack">
            <label className="field">
              <span>No, the last day was</span>
              <input type="date" min={status.start} max={today} value={chosen} onChange={(e) => setEndDate(e.target.value)} />
            </label>
            <button className="btn primary block" onClick={() => endPeriod(chosen)}>Save</button>
          </div>
        </div>
      </section>
    );
  }

  const since = <p className="muted small" style={{ marginBottom: 0 }}>It’s been {status.since} days since your last period started.</p>;

  if (status.phase === 'waiting') {
    return (
      <section className="card">
        <div className="eyebrow">Next period</div>
        <p className="big">May come around <em>{formatRange(next.earliest, next.latest)}</em></p>
        <Confidence a={a} />
        <div style={{ marginTop: 12 }}>{since}</div>
      </section>
    );
  }
  if (status.phase === 'window') {
    return (
      <section className="card">
        <div className="eyebrow">Next period</div>
        <p className="big">It could come <em>any day now</em>.</p>
        <p>Most likely by {formatDate(next.latest, { weekday: 'long', month: 'short', day: 'numeric' })}. A good time to <Link to="/school">check your pouch</Link>.</p>
        {since}
      </section>
    );
  }
  if (status.phase === 'notYet') {
    return (
      <section className="card">
        <p className="big">Your period hasn’t come yet, and that’s okay.</p>
        <p>In the first few years it’s really common for cycles to be longer, or for a month to be skipped. Stress, being sick, sports and travel can shift things too.</p>
        {since}
      </section>
    );
  }
  // longGap
  return (
    <section className="card warm">
      <p className="big">It’s been a while since your last period.</p>
      <p>It’s been {status.since} days. That can happen, especially in the first few years, but after about 3 months it’s a good idea to mention it to a doctor.</p>
      <Link className="btn small" to="/tell?topic=notCome">Help me tell someone</Link>
    </section>
  );
}

/** What she needs right now depends on where she is in her journey. */
function Journey() {
  const { analysis: a, profile } = useStore();
  const n = a.periods.length;

  if (profile.stage === 'notYet' && n === 0) {
    return (
      <section className="card calm">
        <h2>Getting ready</h2>
        <ul className="list">
          <li><Link className="list-link" to="/learn#before">What will my first period be like?</Link></li>
          <li><Link className="list-link" to="/normal?q=signs coming">Signs it’s coming soon</Link></li>
          <li><Link className="list-link" to="/school">Build my first period pouch 🎒</Link></li>
          <li><Link className="list-link" to="/school#started">What if it starts at school?</Link></li>
        </ul>
      </section>
    );
  }
  if (n <= 1) {
    return (
      <section className="card calm">
        <h2>Your first period</h2>
        <ul className="list">
          <li><Link className="list-link" to="/learn#period">What’s actually happening?</Link></li>
          <li><Link className="list-link" to="/normal?q=bleeding a lot">How much blood is normal?</Link></li>
          <li><Link className="list-link" to="/learn#products">How to use and change a pad</Link></li>
          <li><Link className="list-link" to="/tell?topic=first">Help me tell someone</Link></li>
        </ul>
      </section>
    );
  }
  if (a.patterns.length || a.changes.length) {
    const top = [...a.changes, ...a.patterns.map((p) => p.text)].slice(0, 2);
    return (
      <section className="card calm">
        <h2>Your body lately</h2>
        {top.map((t) => <p key={t}>{t}</p>)}
        <Link className="btn small" to="/body">See my body</Link>
      </section>
    );
  }
  return (
    <section className="card calm">
      <h2>Is this normal?</h2>
      <p className="small">In the first months, lots of things change from period to period. Here’s what people wonder about most:</p>
      <ul className="list">
        <li><Link className="list-link" to="/normal?q=regular">Why aren’t my periods regular?</Link></li>
        <li><Link className="list-link" to="/normal?q=brown">Why is my blood brown?</Link></li>
        <li><Link className="list-link" to="/normal?q=clots">Why are there clumps?</Link></li>
      </ul>
      <p className="muted small" style={{ marginTop: 10 }}>After a few more periods, Cadence will start showing you your own patterns.</p>
    </section>
  );
}

function SchoolImpact() {
  const { today, days, setDay } = useStore();
  const log = days[today] ?? {};
  return (
    <section className="card">
      <h3>Did your period affect school today?</h3>
      <div className="chips">
        {SCHOOL_IMPACT.map(([k, label]) => (
          <button key={k} className="chip" aria-pressed={log.school === k} onClick={() => setDay(today, { ...log, school: log.school === k ? undefined : k })}>{label}</button>
        ))}
      </div>
    </section>
  );
}

function CalendarChanged() {
  const { analysis: a, calendarWindow } = useStore();
  if (!calendarWindow || !a.next || a.status.phase === 'period') return null;
  const moved = calendarWindow.earliest !== a.next.earliest || calendarWindow.latest !== a.next.latest;
  if (!moved) return null;
  return (
    <section className="card calm row">
      <span style={{ flex: 1 }}>Cadence learned more, so your possible window moved to {formatRange(a.next.earliest, a.next.latest)}.</span>
      <Link className="btn small" to="/calendar#add">Update my calendar</Link>
    </section>
  );
}

export default function Today() {
  const { analysis: a, today, profile, plans, settings, age, place } = useStore();
  const checkIns = [...ageCheckIns({ age, stage: profile.stage, periodsCount: a.periods.length }), ...a.checkIns];
  const [gotIt, setGotIt] = useState(false);
  const overlaps = planOverlaps(plans, a.next, today, a.patterns);
  const showStart = !['period', 'stillGoing', 'none'].includes(a.status.phase);
  const soon = a.next && a.status.phase !== 'period' && diffDays(a.next.earliest, today) <= 3;
  const wantsSchool = profile.goals?.includes('school');

  return (
    <div className="stack">
      <Status onGotIt={() => setGotIt(true)} />
      {showStart && <button className="btn accent block" onClick={() => setGotIt(true)}>{say(settings.voice, 'gotIt')}</button>}
      {gotIt && <GotPeriod onClose={() => setGotIt(false)} />}
      {a.status.phase === 'period' && <SchoolImpact />}
      <CalendarChanged />
      {overlaps.map((p) => (
        <section key={p.id} className="card overlap">
          <p style={{ margin: 0 }}><strong>{p.emoji} {p.title}</strong>: your period may overlap. {p.packing}</p>
          <Link className="btn small" style={{ marginTop: 10 }} to="/school">{p.cta}</Link>
        </section>
      ))}

      {checkIns.length > 0 && (
        <section className="card warm">
          <h2>Worth talking about</h2>
          {checkIns.slice(0, 2).map((c) => <p key={c} className="small">{c}</p>)}
          <Link className="btn small" to="/tell">Want help telling someone?</Link>
        </section>
      )}

      {(soon || (wantsSchool && a.status.phase !== 'period')) && a.status.phase !== 'none' && (
        <section className="card calm row">
          <span style={{ flex: 1 }}>{soon ? 'Your period might come soon. Is your pouch packed?' : `Ready for ${place.tab === 'School' ? 'school' : 'the week'}?`}</span>
          <Link className="btn small" to="/school">{place.tab}</Link>
        </section>
      )}

      <Journey />

      <section className="card row">
        <span style={{ flex: 1 }}>Want a parent or guardian to know something?</span>
        <Link className="btn small" to="/people">Send an update</Link>
      </section>

      <section className="card">
        <h2>{say(settings.voice, 'logTitle')}</h2>
        <p className="muted small">{say(settings.voice, 'logHint')}</p>
        <DayEditor date={today} compact />
      </section>
    </div>
  );
}
