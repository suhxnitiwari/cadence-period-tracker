import { useState } from 'react';
import { PublicLayout } from '../components/PublicLayout.jsx';
import { NEVER, LETTER_ISNT } from '../content/mission.js';

const GUIDE = [
  {
    q: 'My child just got their first period. What do I do?',
    a: [
      'Stay calm and matter-of-fact. How you react teaches them this is a normal, healthy part of growing up. “Congratulations, let’s get you set up” is perfect.',
      'Make sure they have pads (most people start with pads) and know how to use them: the sticky side goes on the underwear, the wings fold underneath, and used pads get wrapped and put in the bin, never flushed.',
      'Pack a small pouch for their school bag with 2 or 3 pads, spare underwear and a small bag.',
    ],
  },
  {
    q: 'What’s normal in the first few years?',
    a: [
      'Irregular periods are very common at first. Cycles anywhere from about 21 to 45 days apart are typical, and a month may be skipped. A period usually lasts 2 to 7 days.',
      'First periods are often light or brownish. That’s normal.',
    ],
  },
  {
    q: 'What should I buy?',
    a: [
      'Pads in a couple of sizes (regular and overnight) are the easiest start. Period underwear is a great backup, especially for sleep and sports.',
      'Tampons and cups are fine for anyone who wants to try them later. Let your child lead.',
      'A heating pad or heat patches, and a pain reliever your doctor or pharmacist says is right for their age.',
    ],
  },
  {
    q: 'How can I help with cramps?',
    a: [
      'Warmth, gentle movement, rest and water all help. Over-the-counter pain relievers like ibuprofen can help too. Check with your doctor or pharmacist about the right one and dose.',
      'Cramps that regularly keep them home from school or stop everyday life are not something to push through. Painful periods can be treated.',
    ],
  },
  {
    q: 'When should we see a doctor?',
    a: [
      '• No period by 15, or 3 years after breast development began\n• Soaking a pad or tampon every hour or two for several hours in a row\n• Periods lasting more than 7 days\n• Periods less than 3 weeks apart, or more than 3 months without one\n• Pain that keeps them from school or activities\n• Feeling dizzy or faint during periods',
    ],
  },
  {
    q: 'How do I talk about this without embarrassing them?',
    a: [
      'Keep it short and low-key. Side-by-side conversations (in the car, on a walk) often feel easier than face-to-face.',
      'Stock supplies somewhere private so they never have to ask in the moment.',
      'Don’t share their period news with others unless they say it’s okay.',
      'Let them know they can text you instead. Cadence can help them write that message.',
    ],
  },
];

export default function Parents() {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href.split('#')[0];
    if (navigator.share) await navigator.share({ title: 'A letter from Cadence', url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <PublicLayout>
      <article className="stack">
        <div>
          <div className="eyebrow">For parents and guardians</div>
          <h1>A letter to parents and guardians</h1>
        </div>

        <section className="card letter">
          <p>Dear parents and guardians,</p>
          <p>If you’re reading this, someone you love may be starting their period, or getting ready for it. That’s a big moment. Cadence is here to make it a little easier for both of you.</p>
          <p><strong>What Cadence is.</strong> A free period app designed for first periods. It helps your child log their period, understand what’s normal, get ready for school, and know when to ask for help, in words that make sense at 9 and still work at 19.</p>
          <p><strong>What it isn’t.</strong> {LETTER_ISNT}</p>
          <p><strong>Their privacy, and why it helps you too.</strong> Everything they log stays on their own device. There’s no account, and we never collect their name or email. There’s no parent dashboard, on purpose. Kids are far more likely to track honestly, and to come to you when something’s wrong, when they know the app isn’t reporting on them.</p>
          <p><strong>How you stay connected.</strong> Cadence encourages them to talk to you. When they’re ready, they can send you an update from the app, like “Could we get more pads?” or “My cramps are really bad,” or when their next period might come. It includes simple ideas for how you can help. If something in their logs looks worth a doctor’s attention, Cadence gently suggests they tell a trusted adult. That’s you.</p>
          <p><strong>It’s free, and it stays free.</strong> Cadence is a nonprofit. Periods aren’t a luxury, and period tracking shouldn’t be either.</p>
          <p>Thank you for being someone they can come to.</p>
          <p style={{ margin: 0 }}>Warmly,<br /><strong>Suhani Tiwari</strong><br /><span className="muted">Founder, Cadence</span></p>
        </section>

        <div className="row no-print">
          <button className="btn" onClick={share}>{copied ? 'Link copied' : 'Share this letter'}</button>
          <button className="btn" onClick={() => window.print()}>Print</button>
        </div>

        <section className="card">
          <h2>Parent guide</h2>
          <p className="muted small">Short answers to what parents ask most.</p>
          {GUIDE.map((g) => (
            <details className="qa" key={g.q}>
              <summary>{g.q}</summary>
              <div className="answer">{g.a.map((p) => <p key={p} style={{ whiteSpace: 'pre-line' }}>{p}</p>)}</div>
            </details>
          ))}
        </section>

        <section className="card">
          <h2>What Cadence will never include</h2>
          <ul style={{ margin: 0 }}>{NEVER.map((n) => <li key={n}>{n}</li>)}</ul>
        </section>

        <p className="muted small">This guide is general information based on guidance from ACOG, the American Academy of Pediatrics and the NHS. It isn’t medical advice. Your child’s doctor is always the best person to ask.</p>
      </article>
    </PublicLayout>
  );
}
