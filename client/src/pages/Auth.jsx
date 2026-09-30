import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';

export default function Auth({ mode }) {
  const isSignup = mode === 'signup';
  const { signup, login } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (isSignup) {
      if (password.length < 10) return setError('Use at least 10 characters. A short phrase works well, like “purple otter tuesday”.');
      if (password !== confirm) return setError('Those passwords don’t match.');
      if (!understood) return setError('Please check the box so we know you’ve read the note about passwords.');
    }
    setBusy(true);
    try {
      await (isSignup ? signup(username, password) : login(username, password));
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="narrow" style={{ maxWidth: 440 }}>
      <form className="card stack" onSubmit={submit}>
        <div>
          <h1>{isSignup ? 'Make your account' : 'Welcome back'}</h1>
          <p className="muted">
            {isSignup
              ? 'No email, no phone number, no real name. Just a username only you need to know.'
              : 'Your password unlocks your data on this device.'}
          </p>
        </div>
        <label className="field">
          <span>Username</span>
          <input type="text" autoComplete="username" autoCapitalize="none" spellCheck={false}
            value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={32} />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {isSignup && (
          <>
            <label className="field">
              <span>Type it again</span>
              <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </label>
            <div className="notice">
              <strong>Write your password down somewhere safe.</strong> Your password is the key that unlocks your data,
              and we never see it. That’s what keeps your data private, but it also means we can’t reset it for you.
            </div>
            <label className="check">
              <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />
              I understand that if I forget my password, my data can’t be recovered.
            </label>
          </>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy}>
          {busy ? (isSignup ? 'Setting up encryption…' : 'Unlocking…') : isSignup ? 'Create account' : 'Log in'}
        </button>
        <p className="small muted" style={{ textAlign: 'center' }}>
          {isSignup ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New here? <Link to="/signup">Make an account</Link></>}
        </p>
      </form>
    </div>
  );
}
