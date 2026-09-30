import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { RECIPIENTS, INCLUDE, REQUESTS, buildUpdate, encodeUpdate } from '../lib/connect.js';
import { UpdateView } from './Guardian.jsx';
import { QR } from '../components/QR.jsx';

const base = () => `${window.location.origin}${import.meta.env.BASE_URL}`;

// "My people": she chooses who, what, and when. Nothing is ever sent automatically,
// and nobody can check on her. It's a message she sends, like a text.
export default function People() {
  const { analysis, today, profile } = useStore();
  const [to, setTo] = useState(null);
  const [name, setName] = useState('');
  const [include, setInclude] = useState({ status: false, next: true, request: false, note: false });
  const [request, setRequest] = useState(analysis.periods.length <= 1 && profile.stage !== 'notYet' ? 'firstPeriod' : 'supplies');
  const [note, setNote] = useState('');
  const [mode, setMode] = useState(null); // 'qr' after sending
  const [copied, setCopied] = useState(false);

  const update = useMemo(() => to && buildUpdate({ to, name, include, request, note, analysis, today }), [to, name, include, request, note, analysis, today]);
  const url = update ? `${base()}guardian#${encodeUpdate(update)}` : '';
  const message = update ? `${update.req ? `${REQUESTS[update.req]} ` : ''}I sent you an update from Cadence: ${url}` : '';
  const nothing = update && !update.status && !update.next && !update.req && !update.note;

  const send = async () => {
    if (navigator.share) await navigator.share({ text: message }).catch(() => {});
    else { await navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  const toggle = (k) => setInclude((i) => ({ ...i, [k]: !i[k] }));

  return (
    <div className="stack">
      <div>
        <h1>My people</h1>
        <p className="muted">Send a parent, guardian or trusted adult an update. You choose exactly what they see. Nobody can check on you. It only goes to them when you send it.</p>
      </div>

      <section className="card">
        <p className="chip-label">Who is it for?</p>
        <div className="chips">
          {RECIPIENTS.map(([k, label]) => <button key={k} className="chip" aria-pressed={to === k} onClick={() => setTo(k)}>{label}</button>)}
        </div>
      </section>

      {to && (
        <section className="card stack">
          <p className="chip-label" style={{ margin: 0 }}>What should they see?</p>
          {Object.entries(INCLUDE).map(([k, label]) => (
            <label key={k} className="check" style={{ padding: '4px 0' }}>
              <input type="checkbox" checked={include[k]} onChange={() => toggle(k)} />
              <span>{label}</span>
            </label>
          ))}
          {include.request && (
            <div className="chips">
              {Object.entries(REQUESTS).map(([k, label]) => <button key={k} className="chip" aria-pressed={request === k} onClick={() => setRequest(k)}>{label}</button>)}
            </div>
          )}
          {include.note && <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} placeholder="Anything you want to say" />}
          <label className="field"><span>Your name, as they’ll see it <span className="muted small">(optional)</span></span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
          </label>
          <p className="muted small" style={{ margin: 0 }}>They’ll never see your symptoms, feelings, notes or history.</p>
        </section>
      )}

      {update && !nothing && (
        <>
          <section className="card">
            <p className="chip-label">This is exactly what {to === 'Trusted adult' ? 'they' : to} will see</p>
            <div className="preview"><UpdateView u={update} compact /></div>
          </section>
          <section className="card stack">
            <div className="row">
              <button className="btn primary" onClick={send}>{copied ? 'Copied! Paste it in a text' : 'Send by text or message'}</button>
              <button className="btn" onClick={() => setMode(mode === 'qr' ? null : 'qr')}>{mode === 'qr' ? 'Hide code' : 'Show a code to scan'}</button>
            </div>
            {mode === 'qr' && (
              <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
                <QR text={url} label={`Code for ${to} to scan`} />
                <p className="small muted" style={{ margin: 0 }}>Hold up your screen so {to === 'Trusted adult' ? 'they' : to} can scan this with a phone camera.</p>
              </div>
            )}
            <p className="muted small" style={{ margin: 0 }}>The update is inside the link itself, and Cadence has no server that stores it, so only people with the link can see it. It’s a snapshot: send a new one whenever things change.</p>
          </section>
        </>
      )}
      {nothing && <p className="card muted">Pick at least one thing to include.</p>}

      <section className="card calm stack">
        <h2>Not sure how to bring it up?</h2>
        <div className="row">
          <Link className="btn small" to="/tell">Help me find the words</Link>
          <Link className="btn small" to="/parents">Send them our parent letter</Link>
        </div>
      </section>
    </div>
  );
}
