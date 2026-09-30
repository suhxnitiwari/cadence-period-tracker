import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Logo } from '../components/Layout.jsx';

export const STAGES = [
  ['notYet', 'Not yet'],
  ['new', 'Yes, today!'],
  ['few', 'I’ve had a few'],
  ['while', 'I’ve had periods for a while'],
];

export const GOALS = [
  ['when', 'Knowing when my period might come'],
  ['normal', 'Understanding what’s normal'],
  ['cramps', 'Managing cramps'],
  ['school', 'Being prepared at school'],
  ['mood', 'Understanding my mood'],
  ['body', 'Learning about my body'],
  ['symptoms', 'Remembering symptoms'],
];

function Choice({ pressed, onClick, children }) {
  return <button type="button" className="choice" aria-pressed={pressed} onClick={onClick}>{children}</button>;
}

export default function Onboarding() {
  const { finishOnboarding, today } = useStore();
  const [step, setStep] = useState('welcome');
  const [stage, setStage] = useState(null);
  const [remember, setRemember] = useState(null);
  const [lastStart, setLastStart] = useState('');
  const [goals, setGoals] = useState([]);

  const steps = ['welcome', 'stage', ...(stage && stage !== 'notYet' ? ['last'] : []), 'goals', 'privacy'];
  const next = () => setStep(steps[steps.indexOf(step) + 1]);
  const back = () => setStep(steps[steps.indexOf(step) - 1]);
  const toggleGoal = (g) => setGoals((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]));

  const done = () => finishOnboarding({ stage, goals, lastStart: remember === 'yes' && lastStart ? lastStart : null });

  return (
    <div className="onboard">
      {step !== 'welcome' && (
        <div className="row" style={{ marginBottom: 8 }}>
          <button className="btn small" onClick={back} aria-label="Back">‹ Back</button>
          <div className="progress spacer" aria-hidden="true">
            {steps.slice(1).map((s, i) => <i key={s} className={i < steps.indexOf(step) ? 'on' : ''} />)}
          </div>
        </div>
      )}

      {step === 'welcome' && (
        <div className="stack" style={{ margin: 'auto 0' }}>
          <div className="brand" style={{ fontSize: '1.5rem' }}><Logo />Cadence</div>
          <p className="question" style={{ fontSize: '2rem' }}>Designed for your first period. Built for every period after.</p>
          <p className="mission">You don’t need to know anything about your cycle. Understanding it is our job.</p>
          <p className="mission"><strong>Periods aren’t a luxury.</strong> Period tracking stays free. No ads, no subscription, no running out of logs.</p>
          <button className="btn primary block" onClick={next}>Let’s start</button>
        </div>
      )}

      {step === 'stage' && (
        <>
          <p className="question">Have you had your first period?</p>
          <div className="choices">
            {STAGES.map(([key, label]) => <Choice key={key} pressed={stage === key} onClick={() => setStage(key)}>{label}</Choice>)}
          </div>
          {stage === 'notYet' && <p className="muted" style={{ marginTop: 16 }}>That’s great. You can get ready now, so it’s less of a surprise when it comes.</p>}
          {stage === 'new' && <p className="muted" style={{ marginTop: 16 }}>That’s a big deal, and it’s completely normal. We’ll help you figure it out.</p>}
          <div className="spacer" />
          <button className="btn primary block" disabled={!stage} onClick={next} style={{ marginTop: 24 }}>Next</button>
        </>
      )}

      {step === 'last' && (
        <>
          <p className="question">Do you remember when your last period started?</p>
          <div className="choices">
            <Choice pressed={remember === 'yes'} onClick={() => setRemember('yes')}>Yes</Choice>
            <Choice pressed={remember === 'no'} onClick={() => setRemember('no')}>Not really</Choice>
          </div>
          {remember === 'yes' && (
            <label className="field" style={{ marginTop: 20 }}>
              <span>About when did it start?</span>
              <input type="date" max={today} value={lastStart} onChange={(e) => setLastStart(e.target.value)} />
            </label>
          )}
          {remember === 'no' && <p className="muted" style={{ marginTop: 16 }}>No problem. Most people don’t! Just tap “My period started” next time, and Cadence will learn from there.</p>}
          <div className="spacer" />
          <button className="btn primary block" disabled={!remember || (remember === 'yes' && !lastStart)} onClick={next} style={{ marginTop: 24 }}>Next</button>
        </>
      )}

      {step === 'goals' && (
        <>
          <p className="question">What would you like help with?</p>
          <p className="muted" style={{ marginTop: -8 }}>Pick as many as you like.</p>
          <div className="choices">
            {GOALS.map(([key, label]) => <Choice key={key} pressed={goals.includes(key)} onClick={() => toggleGoal(key)}>{label}</Choice>)}
          </div>
          <button className="btn primary block" onClick={next} style={{ marginTop: 24 }}>{goals.length ? 'Next' : 'Skip for now'}</button>
        </>
      )}

      {step === 'privacy' && (
        <div className="stack">
          <p className="question">This is just for you.</p>
          <div className="card stack">
            <p><strong>Everything stays on this device.</strong> There’s no account, and we don’t ask your name, email or age.</p>
            <p><strong>Nobody else can see it.</strong> Not us, not advertisers, not a parent dashboard. If you want to tell someone something, Cadence can help you, but you decide.</p>
            <p><strong>You can take it or delete it anytime</strong> from Settings.</p>
          </div>
          <p className="muted small">One thing to know: since your data lives only on this device, clearing your browser data or losing your phone will erase it. You can save a backup file from Settings.</p>
          <button className="btn primary block" onClick={done}>Got it, let’s go</button>
        </div>
      )}
    </div>
  );
}
