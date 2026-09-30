import { Link } from 'react-router-dom';
import { PublicLayout } from '../components/PublicLayout.jsx';
import { PROMISE, PRINCIPLES, PILLARS, NEVER, WHY_OTHERS } from '../content/mission.js';

export default function About() {
  return (
    <PublicLayout>
      <article className="stack">
        <div>
          <div className="eyebrow">About Cadence</div>
          <h1>{PROMISE}</h1>
        </div>

        <section className="card">
          <h2>Why this exists</h2>
          <p>{WHY_OTHERS}<em>I got my period. What is happening?</em></p>
          <p>And it isn’t only kids. Plenty of people in their twenties still couldn’t tell you how long their cycle is, because period apps expect you to understand your menstrual data instead of doing the work for you.</p>
          <p style={{ margin: 0 }}>Cadence starts with the hardest possible user: someone who knows almost nothing about her cycle. If it works for her at 9, it works for everyone after.</p>
        </section>

        <section className="card stack">
          <h2>What we believe</h2>
          {PRINCIPLES.map(([t, b]) => <p key={t} style={{ margin: 0 }}><strong>{t}</strong> {b}</p>)}
        </section>

        <section className="card">
          <h2>What Cadence does</h2>
          {PILLARS.map(([t, b]) => <p key={t}><strong>{t}.</strong> {b}</p>)}
          <p className="muted small" style={{ margin: 0 }}>Every feature has to pass one test: does it help her notice, understand, prepare for, or speak up about her menstrual health? If not, it doesn’t go in.</p>
        </section>

        <section className="card">
          <h2>What we’ll never build</h2>
          <ul>{NEVER.map((n) => <li key={n}>{n}</li>)}</ul>
          <p className="muted small" style={{ margin: 0 }}>There are good apps for those needs. Cadence doesn’t need to be one of them.</p>
        </section>

        <section className="card calm">
          <h2>A nonprofit, on purpose</h2>
          <p>Cadence exists to make menstrual-health literacy available to everyone, whatever their family can afford. We don’t design around subscriptions, so we never have to ration period logs or put your own history behind a paywall.</p>
          <p style={{ margin: 0 }}><strong>Free means free.</strong></p>
        </section>

        <section className="card">
          <h2>Health information</h2>
          <p style={{ margin: 0 }}>Cadence’s explanations are based on published guidance from pediatric and gynecology organizations, including ACOG, the American Academy of Pediatrics and the NHS. Cadence gives general information and observations from what you log. It never diagnoses, and it isn’t a substitute for a doctor.</p>
        </section>

        <p className="muted small">Created by Suhani Tiwari. <Link to="/parents">Read our letter to parents and guardians →</Link></p>
      </article>
    </PublicLayout>
  );
}
