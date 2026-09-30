import { Link } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { PublicLayout } from '../components/PublicLayout.jsx';
import { PROMISE, PRINCIPLES, PILLARS, NEVER } from '../content/mission.js';

const MOMENTS = [
  ['9', 'What is happening?'],
  ['12', 'Is this normal?'],
  ['15', 'How do I deal with this at school?'],
  ['18', 'Why do I always feel like this before my period?'],
  ['20', 'When is my period actually coming?'],
  ['24', 'Will it overlap with my trip?'],
  ['28', 'Have my cramps changed over the last two years?'],
];

export default function Home() {
  const { profile } = useStore();
  const start = profile ? '/' : '/start';
  return (
    <PublicLayout wide>
      <section className="hero">
        <h1>{PROMISE}</h1>
        <p className="lede">A free, private period app that explains your body in plain words, gets you ready for real life, and helps you speak up when something’s not right.</p>
        <div className="row" style={{ marginTop: 20 }}>
          <Link className="btn primary" to={start}>{profile ? 'Open Cadence' : 'Start free'}</Link>
          <Link className="btn" to="/parents">I’m a parent or guardian</Link>
        </div>
        <p className="muted small" style={{ marginTop: 14 }}>No account. No ads. No subscription. Your data stays on your phone.</p>
      </section>

      <section className="public-grid three">
        {PRINCIPLES.map(([title, body]) => (
          <div className="card" key={title}><h2>{title}</h2><p className="muted">{body}</p></div>
        ))}
      </section>

      <section className="card">
        <h2>One app, from your first period on</h2>
        <p className="muted">Same app, same history, more useful every year. You never have to graduate from Cadence. It grows up with you.</p>
        <ol className="moments">
          {MOMENTS.map(([age, q]) => <li key={age}><span className="age">{age}</span><span>“{q}”</span></li>)}
        </ol>
      </section>

      <section className="public-grid two">
        {PILLARS.map(([title, body]) => (
          <div className="card" key={title}><div className="eyebrow">{title}</div><p style={{ margin: 0 }}>{body}</p></div>
        ))}
      </section>

      <section className="public-grid two">
        <div className="card calm">
          <h2>Private by design</h2>
          <ul>
            <li>No account, no email, no name.</li>
            <li>Everything you log stays on your device. There’s no server that receives it.</li>
            <li>No ads, no trackers, no selling data.</li>
            <li>You decide what, if anything, a parent or guardian sees.</li>
          </ul>
        </div>
        <div className="card">
          <h2>What we’ll never build</h2>
          <ul>{NEVER.map((n) => <li key={n}>{n}</li>)}</ul>
          <p className="muted small" style={{ margin: 0 }}>Not because those things are shameful. They just aren’t this app’s job.</p>
        </div>
      </section>

      <section className="card warm" style={{ textAlign: 'center' }}>
        <h2>Periods aren’t a luxury. Period tracking shouldn’t be either.</h2>
        <Link className="btn primary" to={start}>{profile ? 'Open Cadence' : 'Start free'}</Link>
      </section>
    </PublicLayout>
  );
}
