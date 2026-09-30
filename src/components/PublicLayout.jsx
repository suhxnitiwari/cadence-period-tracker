import { Link, NavLink } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { Logo } from './Layout.jsx';

// Home, About, the parent letter and the guardian view: pages anyone can open
// without setting anything up.
export function PublicLayout({ children, wide = false }) {
  const { profile } = useStore();
  return (
    <div className="app">
      <header className="public-bar">
        <Link to={profile ? '/home' : '/'} className="brand"><Logo />Cadence</Link>
        <nav className="public-nav" aria-label="Site">
          <NavLink to="/about">About</NavLink>
          <NavLink to="/parents">Parents</NavLink>
        </nav>
        <span className="spacer" />
        <Link className="btn small primary nowrap" to={profile ? '/' : '/start'}>{profile ? 'Open' : 'Start'}<span className="wide-only">{profile ? ' Cadence' : ' free'}</span></Link>
      </header>
      <main className={wide ? 'public-main wide' : 'public-main'}>{children}</main>
      <footer className="footer" style={{ paddingBottom: 32 }}>
        <p>Periods aren’t a luxury. Period tracking shouldn’t be either.</p>
        <p><Link to="/about">About</Link> · <Link to="/parents">Letter to parents</Link> · <Link to={profile ? '/' : '/start'}>Open the app</Link></p>
        <p>© {new Date().getFullYear()} Suhani Tiwari. All rights reserved. Cadence gives general information and isn’t medical advice.</p>
      </footer>
    </div>
  );
}
