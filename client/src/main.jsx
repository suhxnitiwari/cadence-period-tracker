import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './store.jsx';
import { Layout } from './components/Layout.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import Today from './pages/Today.jsx';
import CalendarPage from './pages/Calendar.jsx';
import Insights from './pages/Insights.jsx';
import Report from './pages/Report.jsx';
import People from './pages/People.jsx';
import SharedView from './pages/SharedView.jsx';
import Learn from './pages/Learn.jsx';
import Privacy from './pages/Privacy.jsx';
import Settings from './pages/Settings.jsx';
import './styles.css';

function Private({ children }) {
  const { user } = useStore();
  const location = useLocation();
  if (user === null) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function Home() {
  const { user } = useStore();
  return user ? <Today /> : <Landing />;
}

function App() {
  const { user } = useStore();
  if (user === undefined) return null; // checking session; avoids a flash of the wrong page
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Auth mode="login" />} />
        <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Auth mode="signup" />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/s/:token" element={<SharedView />} />
        <Route path="/calendar" element={<Private><CalendarPage /></Private>} />
        <Route path="/insights" element={<Private><Insights /></Private>} />
        <Route path="/report" element={<Private><Report /></Private>} />
        <Route path="/people" element={<Private><People /></Private>} />
        <Route path="/settings" element={<Private><Settings /></Private>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
