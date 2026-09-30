import { useState } from 'react';
import { useStore } from '../store.jsx';
import { checkPasscode } from '../lib/lock.js';
import { Logo } from './Layout.jsx';

export function Lock({ onUnlock }) {
  const { lock, eraseEverything } = useStore();
  const [code, setCode] = useState('');
  const [wrong, setWrong] = useState(false);
  const [forgot, setForgot] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (await checkPasscode(code, lock)) onUnlock();
    else { setWrong(true); setCode(''); }
  };

  return (
    <div className="lock">
      <form className="stack" onSubmit={submit} style={{ width: '100%', maxWidth: 320 }}>
        <div className="brand" style={{ justifyContent: 'center', fontSize: '1.4rem' }}><Logo />Cadence</div>
        <label className="field">
          <span>Enter your passcode</span>
          <input className="pin" type="password" inputMode="numeric" autoComplete="off" autoFocus maxLength={8}
            value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setWrong(false); }} />
        </label>
        {wrong && <p className="error" role="alert">That’s not it. Try again.</p>}
        <button className="btn primary block" disabled={code.length < 4}>Unlock</button>
        {!forgot ? (
          <button type="button" className="btn small" onClick={() => setForgot(true)}>Forgot it?</button>
        ) : (
          <div className="card warm stack small">
            <p>Because your data only lives on this device, nobody (not even us) can reset your passcode without erasing it.</p>
            <button type="button" className="btn small danger" onClick={eraseEverything}>Erase everything and start over</button>
            <button type="button" className="btn small" onClick={() => setForgot(false)}>Keep trying</button>
          </div>
        )}
      </form>
    </div>
  );
}
