import { Link } from 'react-router-dom';

// Calm, factual basics suitable for any age. Based on widely published guidance
// from pediatric and gynecology organizations (e.g. ACOG, AAP, NHS).
const TOPICS = [
  {
    title: 'Your first period',
    body: (
      <>
        <p>Most people get their first period somewhere between ages 10 and 15. Around 12 is common, but earlier or later can be normal too. It often comes about two years after breasts start to develop.</p>
        <ul>
          <li>The first few periods can be light, and the blood may look brown instead of red. That’s normal.</li>
          <li>For the first year or two, periods are often irregular. They might skip a month or come close together.</li>
          <li>A period is usually only a few tablespoons of blood in total, even though it can look like more.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'What’s a “normal” cycle?',
    body: (
      <>
        <p>A cycle is counted from the first day of one period to the first day of the next.</p>
        <ul>
          <li>For teens, cycles anywhere from about 21 to 45 days are common. For adults, 21 to 35 days is typical.</li>
          <li>A period usually lasts 2 to 7 days.</li>
          <li>Almost nobody is exactly 28 days every time. A few days of difference from month to month is normal.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Pads, tampons, cups and period underwear',
    body: (
      <>
        <p>All of these are safe options. Pick whatever feels comfortable, and you can switch anytime.</p>
        <ul>
          <li><strong>Pads</strong> stick to your underwear. Change them every 4 to 8 hours, or sooner if they feel full.</li>
          <li><strong>Tampons</strong> go inside the vagina. Use the lowest absorbency you need and change at least every 8 hours. This lowers the risk of a rare but serious illness called toxic shock syndrome (TSS).</li>
          <li><strong>Menstrual cups and discs</strong> collect blood and can be reused. Follow the instructions for how long to wear them.</li>
          <li><strong>Period underwear</strong> absorbs blood and is washed and reused.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'A period kit for your bag',
    body: (
      <ul>
        <li>A couple of pads or tampons (or whatever you use)</li>
        <li>A spare pair of underwear</li>
        <li>A small zip bag for anything you need to carry home</li>
        <li>Wipes or tissues</li>
        <li>Pain relief, if a parent, guardian or doctor says it’s okay for you</li>
      </ul>
    ),
  },
  {
    title: 'What helps with cramps',
    body: (
      <ul>
        <li>Warmth: a heating pad, hot-water bottle or warm bath.</li>
        <li>Gentle movement like walking or stretching often helps more than you’d expect.</li>
        <li>Over-the-counter pain relievers like ibuprofen can help. Check with a parent, guardian, pharmacist or doctor about what’s right for you.</li>
        <li>If pain stops you from going to school or doing everyday things, tell a doctor. That’s not something you have to put up with.</li>
      </ul>
    ),
  },
  {
    title: 'When to talk to a doctor',
    body: (
      <>
        <p>These are all good reasons to check in. Mentioning them isn’t an overreaction.</p>
        <ul>
          <li>No period by age 15.</li>
          <li>Soaking through a pad or tampon every hour or two for several hours in a row.</li>
          <li>A period that lasts more than 7 days.</li>
          <li>Periods that come more often than every 21 days, or more than 45 days apart (after the first couple of years).</li>
          <li>Pain that stops you from doing normal things.</li>
          <li>Bleeding between periods, or feeling dizzy or faint during your period.</li>
        </ul>
        <p>Cadence’s <Link to="/report">doctor report</Link> can help you explain what’s been happening.</p>
      </>
    ),
  },
  {
    title: 'Talking to a grown-up about it',
    body: (
      <>
        <p>It can feel awkward, but the adults in your life have almost certainly talked about this before. Some things that make it easier:</p>
        <ul>
          <li>Bring it up somewhere low-pressure, like in the car or on a walk.</li>
          <li>You can start small: “Can we get some pads?” is a whole conversation.</li>
          <li>If talking feels too hard, Cadence’s <Link to="/people">People</Link> page lets you share a link and tap “I need supplies” instead.</li>
          <li>A school nurse, counselor or doctor is also a good person to ask.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'For parents, guardians and caregivers',
    body: (
      <ul>
        <li>Keep supplies stocked somewhere private so they never have to ask in the moment.</li>
        <li>Say it plainly and calmly. Your tone teaches them it’s a normal part of life.</li>
        <li>Irregular periods are common in the first couple of years. Very heavy bleeding or pain that stops school is worth a doctor visit.</li>
        <li>Respect their privacy. Cadence only shows you what they choose to share.</li>
      </ul>
    ),
  },
];

export default function Learn() {
  return (
    <div className="narrow">
      <h1>The basics</h1>
      <p className="muted">Clear, calm information that’s right for any age. No ads, no sign-up, nothing to buy.</p>
      <div style={{ marginTop: 24 }}>
        {TOPICS.map((t, i) => (
          <details className="topic" key={t.title} open={i === 0}>
            <summary>{t.title}</summary>
            {t.body}
          </details>
        ))}
      </div>
      <p className="muted small" style={{ marginTop: 24 }}>This is general information, not medical advice. If something feels wrong, trust that and talk to a doctor.</p>
    </div>
  );
}
