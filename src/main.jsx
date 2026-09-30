import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './store.jsx';
import { Layout } from './components/Layout.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Today from './pages/Today.jsx';
import CalendarPage from './pages/Calendar.jsx';
import MyBody from './pages/MyBody.jsx';
import School from './pages/School.jsx';
import Learn from './pages/Learn.jsx';
import Normal from './pages/Normal.jsx';
import Tell from './pages/Tell.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Parents from './pages/Parents.jsx';
import Guardian from './pages/Guardian.jsx';
import People from './pages/People.jsx';
import { Lock } from './components/Lock.jsx';
import Settings from './pages/Settings.jsx';
import Report from './pages/Report.jsx';
import './styles.css';

const RELOCK_AFTER_MS = 60_000;

class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="lock">
        <div className="stack" style={{ maxWidth: 340 }}>
          <p className="big">Oops, something went wrong.</p>
          <p>Your data is safe on this device. Try reloading.</p>
          <button className="btn primary block" onClick={() => window.location.assign(import.meta.env.BASE_URL)}>Reload</button>
        </div>
      </div>
    );
  }
}

function App() {
  const { profile, lock } = useStore();
  const [unlocked, setUnlocked] = useState(false);

  // Lock again if the app has been in the background for a minute.
  useEffect(() => {
    let hiddenAt = 0;
    const onVis = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > RELOCK_AFTER_MS) setUnlocked(false);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const { pathname } = useLocation();

  // Public pages: anyone can open these, with no setup and no passcode (they show none of her data).
  const pub = { '/home': <Home />, '/about': <About />, '/parents': <Parents />, '/guardian': <Guardian /> }[pathname];
  if (pub) return pub;
  if (!profile) return pathname === '/start' ? <Onboarding /> : pathname === '/' ? <Home /> : <Navigate to="/" replace />;
  if (lock && !unlocked) return <Lock onUnlock={() => setUnlocked(true)} />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/body" element={<MyBody />} />
        <Route path="/school" element={<School />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/normal" element={<Normal />} />
        <Route path="/tell" element={<Tell />} />
        <Route path="/people" element={<People />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/report" element={<Report />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <ErrorBoundary>
        <StoreProvider>
          <App />
        </StoreProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {}));
}
