import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useStore } from '../store.jsx';

export function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="10" fill="none" stroke="var(--line)" strokeWidth="3.5" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeDasharray="44 20" strokeLinecap="round" transform="rotate(-90 16 16)" />
    </svg>
  );
}

const icon = (d) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const ICONS = {
  today: icon(<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2.5" /></>),
  calendar: icon(<><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>),
  body: icon(<path d="M4 16c2.5 0 2.5-8 5-8s2.5 8 5 8 2.5-8 5-8" />),
  learn: icon(<><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z" /></>),
  school: icon(<><path d="M6 8V6.5A2.5 2.5 0 0 1 8.5 4h7A2.5 2.5 0 0 1 18 6.5V8" /><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M9 13h6" /></>),
  ask: icon(<><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4A8 8 0 1 1 20 12Z" /><path d="M10 10a2 2 0 1 1 2.5 1.9c-.3.1-.5.4-.5.7V13M12 16h.01" /></>),
  settings: icon(<><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" /></>),
};

const TABS = [
  ['/', 'Today', 'today'],
  ['/calendar', 'Calendar', 'calendar'],
  ['/body', 'My body', 'body'],
  ['/school', 'School', 'school'],
  ['/learn', 'Learn', 'learn'],
];

/** "Who am I logging for?" Shows when a phone holds more than one profile, or a child's. */
function ProfileSwitcher() {
  const { profiles, activeId, switchProfile, person } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  if (profiles.length < 2 && !person.isChild) return null;
  const label = (p) => p.name || (p.relation === 'child' ? 'My child' : 'Me');
  return (
    <div className="switcher" ref={ref}>
      <button className="btn small" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        <span className="avatar" aria-hidden="true">{person.label[0].toUpperCase()}</span>{person.label} ▾
      </button>
      {open && (
        <div className="menu" role="menu">
          <p className="chip-label" style={{ margin: '4px 8px 6px' }}>Logging for</p>
          {profiles.map((p) => (
            <button key={p.id} role="menuitemradio" aria-checked={p.id === activeId} className="menu-item" onClick={() => { switchProfile(p.id); setOpen(false); }}>
              <span className="avatar" aria-hidden="true">{label(p)[0].toUpperCase()}</span>{label(p)}{p.sync && !p.sync.ended && <span className="muted small"> · shared</span>}
            </button>
          ))}
          <Link role="menuitem" className="menu-item" to="/add">＋ Add a profile</Link>
        </div>
      )}
    </div>
  );
}

export function Layout({ children }) {
  const { saveError, place } = useStore();
  const tabs = TABS.map((t) => (t[0] === '/school' ? [t[0], place.tab, t[2]] : t));
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand"><Logo /><span className="brand-name">Cadence</span></Link>
        <ProfileSwitcher />
        <span className="spacer" />
        <Link to="/normal" className="btn small normal-btn">{ICONS.ask}Is this normal?</Link>
        <NavLink to="/settings" className="icon-btn" aria-label="Settings and privacy">{ICONS.settings}</NavLink>
      </header>
      <main className="main">
        {saveError && <p className="card warm small" role="alert">This browser isn’t letting Cadence save right now (private browsing can do this). Anything you log may not be kept.</p>}
        {children}
        <p className="footer">Periods aren’t a luxury. Period tracking shouldn’t be either.<br />Free means free. No ads, no subscription, ever.<br />© {new Date().getFullYear()} Suhani Tiwari. All rights reserved.</p>
      </main>
      <nav className="tabbar" aria-label="Main">
        {tabs.map(([to, label, key]) => <NavLink key={to} to={to} end={to === '/'}>{ICONS[key]}{label}</NavLink>)}
      </nav>
    </div>
  );
}
