import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../components/PublicLayout.jsx';
import { decodeUpdate, waysToHelp, REQUESTS } from '../lib/connect.js';
import { googleUrl } from '../lib/ics.js';
import { formatDate, formatRange } from '../lib/dates.js';

export function UpdateView({ u, compact = false }) {
  const who = u.name || 'They';
  return (
    <div className="stack">
      {u.req && <div className="card warm"><p style={{ margin: 0 }}><strong>{u.name ? `${u.name} says:` : 'They say:'}</strong> {REQUESTS[u.req]}</p></div>}
      {u.note && <div className="card"><p style={{ margin: 0, whiteSpace: 'pre-line' }}>“{u.note}”</p></div>}
      {(u.status || u.next) && (
        <div className="card">
          {u.status && <p className="big" style={{ fontSize: '1.4rem' }}>{u.status.on ? `On their period (day ${u.status.day})` : 'Not on their period right now'}</p>}
          {u.next && <p style={{ margin: 0 }}>Next period might come around <strong>{formatRange(u.next[0], u.next[1])}</strong>. It’s a range, because bodies aren’t clocks.</p>}
        </div>
      )}
      {!compact && (
        <>
          <div className="card calm">
            <h2>Ways you can help</h2>
            <ul style={{ margin: 0, paddingLeft: 20 }}>{waysToHelp(u).map((t) => <li key={t} style={{ marginBottom: 6 }}>{t}</li>)}</ul>
          </div>
          {u.next && (
            <a className="btn" href={googleUrl({ start: u.next[0], end: u.next[1], title: 'Personal' })} target="_blank" rel="noreferrer">Add to my Google Calendar (as “Personal”)</a>
          )}
          <p className="muted small">{who} chose exactly what’s here and sent it on {formatDate(u.at, { month: 'long', day: 'numeric' })}. It’s a one-time update, not a live view. You can ask for a new one anytime.</p>
        </>
      )}
    </div>
  );
}

// What a parent or guardian sees when they open her link. No account needed.
export default function Guardian() {
  const [u, setU] = useState(() => decodeUpdate(window.location.hash));
  useEffect(() => {
    const onHash = () => setU(decodeUpdate(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <PublicLayout>
      {u ? (
        <div className="stack">
          <div>
            <div className="eyebrow">An update for {u.to === 'Trusted adult' ? 'you' : u.to}</div>
            <h1>{u.name ? `From ${u.name}` : 'Someone who trusts you sent this'}</h1>
          </div>
          <UpdateView u={u} />
          <section className="card">
            <h2>New to all this?</h2>
            <p className="muted">Read our short letter and parent guide: what’s normal, what to buy, and how to talk about it without embarrassing anyone.</p>
            <Link className="btn small" to="/parents">Letter and parent guide</Link>
          </section>
        </div>
      ) : (
        <div className="card">
          <h1>This link looks incomplete</h1>
          <p>Ask for the update to be sent again. Or read our <Link to="/parents">letter to parents and guardians</Link>.</p>
        </div>
      )}
    </PublicLayout>
  );
}
