import { useState } from 'react';
import { useStore } from '../store.jsx';
import { SYNC_URL, DEFAULT_SHARES, SHARE_OPTIONS, newSpace, pairFragment } from '../lib/syncCore.js';
import { createSpace, deleteSpace } from '../lib/useSync.js';
import { ShareToggles } from '../components/ShareToggles.jsx';
import { QR } from '../components/QR.jsx';

const pairUrl = (sync) => `${window.location.origin}${import.meta.env.BASE_URL}pair#${pairFragment(sync)}`;

function ago(ts) {
  if (!ts) return '';
  const s = Math.round((Date.now() - ts) / 1000);
  return s < 60 ? 'just now' : `${Math.round(s / 60)} min ago`;
}

// Share a profile with another phone: a parent's, or a daughter's first phone.
export default function Sharing() {
  const { sync, setSync, person, syncStatus } = useStore();
  const [shares, setShares] = useState(sync?.shares ?? DEFAULT_SHARES);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const [copied, setCopied] = useState(false);
  const mine = !person.isChild;
  const them = person.isChild ? person.name : 'you';

  const start = async () => {
    setBusy(true); setError('');
    try {
      const space = newSpace();
      await createSpace(space);
      setSync({ ...space, seq: 0, pushed: {}, ...(mine && { shares }) });
      setShowCode(true);
    } catch {
      setError('Couldn’t reach the sharing service. Check your connection and try again.');
    }
    setBusy(false);
  };
  const stop = async () => {
    setBusy(true);
    try { await deleteSpace(sync); } catch { /* offline: still stop here */ }
    setSync(null); setBusy(false); setConfirmStop(false);
  };
  const copy = async () => {
    await navigator.clipboard.writeText(pairUrl(sync));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (!SYNC_URL) {
    return (
      <div className="stack">
        <h1>Share with another phone</h1>
        <p className="card">Sharing between phones isn’t switched on for this version of Cadence yet. Everything still works on this phone, and you can move data with a backup file from Settings.</p>
      </div>
    );
  }

  if (sync?.ended) {
    return (
      <div className="stack">
        <h1>Sharing has ended</h1>
        <div className="card stack">
          <p style={{ margin: 0 }}>The other phone stopped sharing. Everything already on this phone is still here.</p>
          <button className="btn primary" onClick={() => setSync(null)}>OK</button>
        </div>
      </div>
    );
  }

  const code = sync && (
    <section className="card stack" style={{ alignItems: 'center', textAlign: 'center' }}>
      <h2>Scan this with the other phone</h2>
      <QR text={pairUrl(sync)} label="Code for the other phone to scan" />
      <p className="small" style={{ margin: 0 }}>Open the other phone’s camera and point it here. Or send the link:</p>
      <button className="btn small" onClick={copy}>{copied ? 'Link copied' : 'Copy link'}</button>
      <p className="small muted" style={{ margin: 0 }}>Only show this to your own family’s phones. Anyone who scans it can join.</p>
    </section>
  );

  if (sync) {
    const st = syncStatus?.state;
    return (
      <div className="stack">
        <h1>Sharing is on</h1>
        <section className="card stack">
          <p style={{ margin: 0 }}>
            <strong>{person.Your} profile is shared with another phone.</strong>{' '}
            <span className="muted small">
              {st === 'offline' ? 'Offline right now. It’ll catch up when you’re back online.' : st === 'syncing' ? 'Syncing…' : syncStatus?.at ? `Up to date (${ago(syncStatus.at)}).` : ''}
            </span>
          </p>
          {mine ? (
            <ShareToggles shares={sync.shares ?? DEFAULT_SHARES} onChange={(s) => setSync({ ...sync, shares: s })} />
          ) : sync.herShares ? (
            <p style={{ margin: 0 }}>
              {person.name} shares: periods and flow{Object.entries(SHARE_OPTIONS).filter(([k]) => sync.herShares[k]).map(([, l]) => `, ${l.toLowerCase()}`).join('')}.
              {Object.values(sync.herShares).some((v) => !v) && <span className="muted small"> Other things stay private on {person.your} phone. That’s by design.</span>}
            </p>
          ) : (
            <p className="muted" style={{ margin: 0 }}>Everything you log here syncs. If {them} gets a phone and joins, {them} will choose what keeps being shared back.</p>
          )}
          <button className="btn small" onClick={() => setShowCode((v) => !v)}>{showCode ? 'Hide code' : 'Add another phone'}</button>
        </section>
        {showCode && code}
        <section className="card stack">
          <h2>Stop sharing</h2>
          <p className="muted small" style={{ margin: 0 }}>Stops sharing on every phone and deletes the encrypted copy from the relay. What’s already on each phone stays there.</p>
          {!confirmStop
            ? <div><button className="btn small danger" onClick={() => setConfirmStop(true)}>Stop sharing</button></div>
            : <div className="row"><button className="btn small danger" disabled={busy} onClick={stop}>Yes, stop sharing</button><button className="btn small" onClick={() => setConfirmStop(false)}>Cancel</button></div>}
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      <div>
        <h1>Share with another phone</h1>
        <p className="muted">{mine
          ? 'Keep a parent or guardian’s phone up to date, and choose exactly what they see.'
          : `Put ${person.your} profile on their own phone, or on another parent’s phone. Both stay up to date.`}</p>
      </div>
      <section className="card">
        <h2>How it works</h2>
        <ul style={{ margin: 0 }}>
          <li>This phone shows a code. The other phone scans it. That’s it, no accounts.</li>
          <li>Everything is end-to-end encrypted. The secret key is only in the code, so the sharing service can’t read names, dates or anything logged.</li>
          <li>Private notes never leave the phone they were written on.</li>
          <li>Either phone can stop sharing anytime.</li>
        </ul>
      </section>
      {mine && (
        <section className="card"><ShareToggles shares={shares} onChange={setShares} other="their phone" /></section>
      )}
      {!mine && (
        <section className="card calm">
          <p style={{ margin: 0 }}>When {them} joins from their own phone, the whole history moves over. From then on, {them} decides what gets shared back with you, like pain or feelings. Periods are always shared.</p>
        </section>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn primary block" disabled={busy} onClick={start}>{busy ? 'Setting up…' : 'Start sharing'}</button>
    </div>
  );
}
