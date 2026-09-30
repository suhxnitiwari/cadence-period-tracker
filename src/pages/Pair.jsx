import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { Logo } from '../components/Layout.jsx';
import { ShareToggles } from '../components/ShareToggles.jsx';
import { SYNC_URL, DEFAULT_SHARES, parsePairFragment, spaceKeys, decryptRecord } from '../lib/syncCore.js';
import { pullRecords, SyncGone } from '../lib/useSync.js';

// The phone that scanned the code: "Whose phone is this?"
export default function Pair() {
  const { addSyncedProfile, profiles } = useStore();
  const navigate = useNavigate();
  const [space] = useState(() => parsePairFragment(window.location.hash));
  const [info, setInfo] = useState(null); // { name, count }
  const [error, setError] = useState('');
  const [who, setWho] = useState(null);
  const [shares, setShares] = useState(DEFAULT_SHARES);
  const [name, setName] = useState('');

  const already = space && profiles.find((p) => p.sync?.id === space.id);

  useEffect(() => {
    if (!space || !SYNC_URL || already) return;
    (async () => {
      try {
        const keys = await spaceKeys(space.key);
        const res = await pullRecords(space, 0);
        let foundName = '';
        let count = 0;
        for (const r of res.records) {
          try {
            const { n, v } = await decryptRecord(keys, r);
            if (n === 'meta' && v.name) foundName = v.name;
            if (n.startsWith('day:') && v.flow) count += 1;
          } catch { /* skip */ }
        }
        setInfo({ name: foundName, count });
        setName(foundName);
      } catch (e) {
        setError(e instanceof SyncGone ? 'This code has expired or sharing was stopped. Ask for a new one.' : 'Couldn’t connect. Check your internet and try again.');
      }
    })();
  }, [space, already]);

  const join = () => {
    addSyncedProfile({ relation: who, name: who === 'child' ? name : '', sync: { ...space, seq: 0, pushed: {}, fresh: true, ...(who === 'me' && { shares }) } });
    navigate('/', { replace: true });
  };

  let body;
  if (!space) body = <p>This link isn’t complete. Ask for the code to be shown again.</p>;
  else if (!SYNC_URL) body = <p>Sharing between phones isn’t switched on for this version of Cadence yet.</p>;
  else if (already) body = <><p>This phone already has this profile.</p><button className="btn primary block" onClick={() => navigate('/')}>Open Cadence</button></>;
  else if (error) body = <p className="error">{error}</p>;
  else if (!info) body = <p className="muted">Connecting…</p>;
  else {
    const label = info.name ? `${info.name}’s` : 'a';
    body = (
      <>
        <p className="question">Add {label} profile to this phone?</p>
        <p className="muted" style={{ marginTop: -8 }}>{info.count ? `${info.count} logged days will be copied here, encrypted end to end.` : 'Nothing logged yet. That’s fine.'}</p>
        <p className="chip-label">Whose phone is this?</p>
        <div className="choices">
          <button className="choice" aria-pressed={who === 'me'} onClick={() => setWho('me')}>Mine. It’s my period history</button>
          <button className="choice" aria-pressed={who === 'child'} onClick={() => setWho('child')}>I’m a parent or guardian</button>
        </div>
        {who === 'me' && (
          <div className="card stack" style={{ marginTop: 16 }}>
            <p style={{ margin: 0 }}><strong>From now on, you’re in charge.</strong> Choose what keeps being shared with the other phone. You can change this anytime.</p>
            <ShareToggles shares={shares} onChange={setShares} />
          </div>
        )}
        {who === 'child' && (
          <label className="field" style={{ marginTop: 16 }}><span>What should this profile be called?</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="e.g. Maya" />
          </label>
        )}
        <button className="btn primary block" disabled={!who} onClick={join} style={{ marginTop: 20 }}>Add to this phone</button>
      </>
    );
  }

  return (
    <div className="onboard">
      <div className="brand" style={{ fontSize: '1.3rem', marginBottom: 16 }}><Logo />Cadence</div>
      {body}
    </div>
  );
}
