import { Link } from 'react-router-dom';

const PROMISES = [
  ['We can’t sell your data. We can’t even read it.', 'Everything you log is encrypted on your device before it’s saved. Our server only ever holds scrambled text, so there’s nothing to sell, leak or hand over.'],
  ['Free. Actually free.', 'No ads, no premium plan, no “choose your plan” pop-ups, no free trial that turns into a bill. Every feature is here from day one.'],
  ['Safe for your first period', 'No sex content, no strangers, no community feed. Just calm, clear information that’s right for any age, and a way to quietly ask a grown-up for help.'],
  ['Honest predictions', 'Bodies aren’t clocks. You get a likely range that’s as wide as your cycles really are, plus a plain note when something is worth asking a doctor about.'],
  ['For the people who help you', 'Share just what you choose with a parent, guardian, caregiver or partner. They get practical ways to help, and you can turn their link off anytime.'],
  ['Works with your calendar', 'Add your next period to Google Calendar in one tap, or subscribe so it updates itself. You pick the event title, so it can stay discreet on a shared calendar.'],
  ['Useful at the doctor’s office', 'One tap makes a clear, printable summary of your cycles, pain and symptoms, the kind of record that helps get conditions like endometriosis or PCOS taken seriously.'],
  ['Your data leaves with you', 'Export everything as a file anytime, or delete your account and all of your data instantly.'],
];

const COMPARE = [
  ['Price', 'Subscription, paywalled features', 'Free, everything included'],
  ['Ads and upsells', 'Yes', 'Never'],
  ['Who can read your data', 'The company', 'Only you'],
  ['Sign-up', 'Email, often more', 'Just a username'],
  ['Content', 'Sex, dating and fertility feeds', 'Calm basics that are right for any age'],
  ['Sharing', 'Partners only', 'Parents, guardians, caregivers or partners'],
  ['Predictions', 'One exact date', 'An honest range'],
  ['Google Calendar', 'No', 'Yes'],
];

export default function Landing() {
  return (
    <div>
      <section className="landing-hero">
        <h1>A period tracker that works for you, not for advertisers.</h1>
        <p className="lede">
          Cadence is free, private and made for everyone, from your very first period on.
          No ads, no plans to pick, and your data is encrypted so even we can’t see it.
        </p>
        <div className="row" style={{ marginTop: 24 }}>
          <Link to="/signup" className="btn primary">Start tracking free</Link>
          <Link to="/learn" className="btn">New to periods? Start here</Link>
        </div>
      </section>

      <section className="promises">
        {PROMISES.map(([title, body]) => (
          <div className="card" key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>How it’s different</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="compare">
            <thead><tr><th></th><th>Typical period apps</th><th>Cadence</th></tr></thead>
            <tbody>
              {COMPARE.map(([row, them, us]) => <tr key={row}><th scope="row">{row}</th><td>{them}</td><td>{us}</td></tr>)}
            </tbody>
          </table>
        </div>
        <p className="muted small" style={{ marginTop: 12 }}>
          Curious how the encryption works? <Link to="/privacy">Here’s the plain-language version.</Link>
        </p>
      </section>
    </div>
  );
}
