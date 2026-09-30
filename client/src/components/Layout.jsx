import { NavLink, Link } from 'react-router-dom';
import { useStore } from '../store.jsx';

export function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="10" fill="none" stroke="var(--line)" strokeWidth="3" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="var(--period)" strokeWidth="3" strokeDasharray="44 20" strokeLinecap="round" transform="rotate(-90 16 16)" />
    </svg>
  );
}

const icon = (d) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const ICONS = {
  today: icon(<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2.5" /></>),
  calendar: icon(<><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>),
  insights: icon(<path d="M5 20V11M12 20V5M19 20v-6" />),
  people: icon(<><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19.5c.6-3 2.9-4.8 5.5-4.8s4.9 1.8 5.5 4.8M16 5.5a3 3 0 0 1 0 6M17.5 14.9c1.6.6 2.7 2.2 3 4.6" /></>),
  settings: icon(<><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" /></>),
};

const LINKS = [
  ['/', 'Today', 'today'],
  ['/calendar', 'Calendar', 'calendar'],
  ['/insights', 'Insights', 'insights'],
  ['/people', 'People', 'people'],
  ['/settings', 'Settings', 'settings'],
];

export function Footer() {
  return (
    <footer className="footer">
      <p>Free forever. No ads. No data sold, because we can’t read it. · <Link to="/learn">Learn</Link> · <Link to="/privacy">How privacy works</Link></p>
      <p>© {new Date().getFullYear()} Suhani Tiwari. All rights reserved.</p>
    </footer>
  );
}

export function Layout({ children }) {
  const { user } = useStore();
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand"><Logo />Cadence</Link>
        {user && (
          <nav className="nav" aria-label="Main">
            {LINKS.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
            <NavLink to="/learn">Learn</NavLink>
          </nav>
        )}
        <span className="spacer" />
        {!user && (
          <div className="row">
            <Link className="btn ghost small" to="/learn">Learn</Link>
            <Link className="btn ghost small" to="/login">Log in</Link>
            <Link className="btn primary small" to="/signup">Get started</Link>
          </div>
        )}
      </header>
      <main className="main">{children}</main>
      <Footer />
      {user && (
        <nav className="tabbar" aria-label="Main">
          {LINKS.map(([to, label, key]) => (
            <NavLink key={to} to={to} end={to === '/'}>{ICONS[key]}{label}</NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
