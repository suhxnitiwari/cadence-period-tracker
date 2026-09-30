import { useState } from 'react';
import { useStore } from '../store.jsx';
import { SHARE_FIELDS, SHARE_FIELDS_SHORT, REQUESTS } from '../lib/share.js';

const SUGGESTED = ['Mom', 'Dad', 'Parent', 'Guardian', 'Caregiver', 'Grandparent', 'Partner'];

export function RequestButtons() {
  const { requests, saveRequests } = useStore();
  return (
    <div className="chips">
      {Object.entries(REQUESTS).map(([key, label]) => (
        <button key={key} className="chip" aria-pressed={Boolean(requests[key])}
          onClick={() => saveRequests({ ...requests, [key]: !requests[key] })}>{label}</button>
      ))}
    </div>
  );
}

function shareUrl(s) {
  return `${window.location.origin}/s/${s.token}#${s.raw}`;
}

function ShareRow({ share }) {
  const { removeShare } = useStore();
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl(share));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <li className="card">
      <div className="row">
        <h3 style={{ margin: 0 }}>{share.label}</h3>
        <span className="spacer" />
        <button className="btn small" onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
        {confirming
          ? <button className="btn small danger" onClick={() => removeShare(share.token)}>Yes, turn off</button>
          : <button className="btn small ghost" onClick={() => setConfirming(true)}>Turn off</button>}
      </div>
      <p className="muted small" style={{ margin: '8px 0 0' }}>Can see: {share.fields.map((f) => SHARE_FIELDS_SHORT[f]).join(' · ')}</p>
    </li>
  );
}

export default function People() {
  const { shares, addShare, settings, saveSettings } = useStore();
  const [label, setLabel] = useState('');
  const [fields, setFields] = useState(['status', 'next', 'requests']);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(settings.displayName ?? '');

  const toggle = (f) => setFields((fs) => (fs.includes(f) ? fs.filter((x) => x !== f) : [...fs, f]));
  const create = async (e) => {
    e.preventDefault();
    if (!label.trim() || !fields.length) return;
    setBusy(true);
    if (name !== settings.displayName) await saveSettings({ displayName: name.trim() });
    await addShare({ label: label.trim(), fields });
    setLabel('');
    setBusy(false);
  };

  return (
    <div className="grid-2">
      <div className="stack">
        <div>
          <h1>People who help you</h1>
          <p className="muted">
            Give a parent, guardian, caregiver or partner a private link. They see only what you pick, plus simple ideas for how to help.
            They don’t need an account, and you can turn a link off anytime.
          </p>
        </div>

        {shares.length > 0 ? (
          <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {shares.map((s) => <ShareRow key={s.token} share={s} />)}
          </ul>
        ) : (
          <p className="card muted">You’re not sharing with anyone. That’s completely fine too.</p>
        )}

        {shares.some((s) => s.fields.includes('requests')) && (
          <section className="card">
            <h3>Need something?</h3>
            <p className="muted small">These show up on the links that include requests. It’s a quiet way to ask without having to bring it up.</p>
            <RequestButtons />
          </section>
        )}
      </div>

      <form className="card stack" onSubmit={create}>
        <h2>Add someone</h2>
        <label className="field">
          <span>Who is this link for?</span>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Mom" maxLength={40} required />
        </label>
        <div className="chips">
          {SUGGESTED.map((s) => <button type="button" key={s} className="chip" aria-pressed={label === s} onClick={() => setLabel(s)}>{s}</button>)}
        </div>
        <label className="field">
          <span>Your name, as they’ll see it <span className="muted small">(optional)</span></span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ava" maxLength={40} />
        </label>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
          <legend className="chip-label">They can see</legend>
          {Object.entries(SHARE_FIELDS).map(([key, text]) => (
            <label key={key} className="check">
              <input type="checkbox" checked={fields.includes(key)} onChange={() => toggle(key)} />
              {text}
            </label>
          ))}
        </fieldset>
        <p className="muted small">They’ll never see your notes, your symptoms, or anything you didn’t tick. The link is encrypted end to end: the key is in the part of the link that’s never sent to our server.</p>
        <button className="btn primary" disabled={busy || !fields.length}>{busy ? 'Creating…' : 'Create link'}</button>
      </form>
    </div>
  );
}
