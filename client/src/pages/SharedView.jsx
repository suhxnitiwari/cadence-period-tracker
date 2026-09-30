import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { decryptJson, importShareKey } from '../lib/crypto.js';
import { caregiverTips, REQUESTS } from '../lib/share.js';
import { formatDate, formatRange } from '../lib/dates.js';
import { googleCalendarUrl } from '../lib/ics.js';

const PAIN_TEXT = { none: 'No pain today', mild: 'Mild pain today', moderate: 'Moderate pain today', severe: 'Severe pain today' };

// What a parent, guardian, caregiver or partner sees. No account needed.
export default function SharedView() {
  const { token } = useParams();
  const [snap, setSnap] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const raw = window.location.hash.slice(1);
    if (!raw) return setError('This link is missing its key. Ask for the full link again.');
    (async () => {
      try {
        const blob = await api.get(`/shared/${token}`);
        setSnap(await decryptJson(await importShareKey(raw), blob, token));
      } catch (e) {
        setError(e.status === 404 ? 'This link has been turned off.' : 'This link couldn’t be opened. Ask for the full link again.');
      }
    })();
  }, [token]);

  if (error) return <div className="narrow card"><h1>Shared cycle</h1><p>{error}</p></div>;
  if (!snap) return <div className="narrow card"><p className="muted">Opening…</p></div>;

  const name = snap.name;
  const requests = snap.requests ?? [];
  return (
    <div className="narrow stack">
      <div>
        <p className="muted small" style={{ marginBottom: 4 }}>Shared with {snap.label} · updated {formatDate(snap.updated, { month: 'long', day: 'numeric' })}</p>
        <h1>{name ? `How ${name} is doing` : 'How they’re doing'}</h1>
      </div>

      {requests.length > 0 && (
        <section className="card" style={{ borderColor: 'var(--period)' }}>
          <h2>{name ? `${name} asked` : 'They asked'}</h2>
          <ul style={{ margin: 0, paddingLeft: 20 }}>{requests.map((r) => <li key={r}><strong>{REQUESTS[r]}</strong></li>)}</ul>
        </section>
      )}

      <section className="card">
        {snap.status && (
          <p className="headline" style={{ fontFamily: 'var(--display)', fontSize: '1.6rem', fontWeight: 600, margin: '0 0 8px' }}>
            {snap.status.onPeriod ? `On their period, day ${snap.status.day}` : 'Not on their period right now'}
          </p>
        )}
        {snap.next?.earliest && <p>Next period likely <strong>{formatRange(snap.next.earliest, snap.next.latest)}</strong>.</p>}
        {snap.next?.late && <p>Their period is a little later than expected. That’s common and usually nothing to worry about.</p>}
        {snap.pain && <p>{PAIN_TEXT[snap.pain]}.</p>}
        {!snap.status && !snap.next && !snap.pain && !requests.length && <p className="muted">Nothing to show right now.</p>}
        {snap.next?.earliest && (
          <a className="btn small" href={googleCalendarUrl(snap.next, name ? `${name}: period likely` : 'Period likely')} target="_blank" rel="noreferrer">Add to my Google Calendar</a>
        )}
      </section>

      <section className="card">
        <h2>Ways to help</h2>
        <ul style={{ margin: 0, paddingLeft: 20 }}>{caregiverTips(snap).map((t) => <li key={t} style={{ marginBottom: 6 }}>{t}</li>)}</ul>
        <p className="muted small" style={{ marginTop: 12, marginBottom: 0 }}>
          Want to brush up? <Link to="/learn">Cadence’s basics page</Link> is written for any age, including for grown-ups who want to know what to say.
        </p>
      </section>

      <p className="muted small">{name ?? 'They'} chose exactly what’s shown here and can turn this link off anytime. It’s encrypted, so Cadence can’t read it either.</p>
    </div>
  );
}
