import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { Logo } from '../components/Layout.jsx';
import { MONTHS, GRADES } from '../lib/profile.js';

const STAGES = {
  me: [['notYet', 'Not yet'], ['new', 'Yes, today!'], ['few', 'I’ve had a few'], ['while', 'I’ve had periods for a while']],
  child: [['notYet', 'Not yet'], ['new', 'Yes, just now'], ['few', 'A few'], ['while', 'For a while']],
};

const GOALS = {
  me: [
    ['when', 'Knowing when my period might come'], ['normal', 'Understanding what’s normal'], ['cramps', 'Managing cramps'],
    ['school', 'Being prepared at school'], ['mood', 'Understanding my mood'], ['body', 'Learning about my body'], ['symptoms', 'Remembering symptoms'],
  ],
  child: [
    ['when', 'Knowing when the next period might come'], ['normal', 'Knowing what’s normal'], ['cramps', 'Helping with cramps'],
    ['school', 'Getting ready for school'], ['body', 'Explaining what’s happening'], ['symptoms', 'Keeping a record for the doctor'],
  ],
};

function Choice({ pressed, onClick, children }) {
  return <button type="button" className="choice" aria-pressed={pressed} onClick={onClick}>{children}</button>;
}

/** First run, or adding another profile later (e.g. a parent adding a second child). */
export default function Onboarding({ adding = false }) {
  const { createProfile, today, profiles } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(adding ? 'who' : 'welcome');
  const [who, setWho] = useState(null);
  const [name, setName] = useState('');
  const [stage, setStage] = useState(null);
  const [remember, setRemember] = useState(null);
  const [lastStart, setLastStart] = useState('');
  const [goals, setGoals] = useState([]);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [grade, setGrade] = useState(null);
  const thisYear = Number(today.slice(0, 4));
  const years = Array.from({ length: 70 }, (_, i) => thisYear - 6 - i);
  const hasMe = profiles.some((p) => p.relation === 'me');

  const kid = who === 'child';
  const n = name.trim() || 'your child';
  const N = name.trim() || 'Your child';
  const nPossessive = name.trim() ? `${name.trim()}’s` : 'your child’s';

  const steps = ['welcome', 'who', ...(kid ? ['name'] : []), 'stage', ...(stage && stage !== 'notYet' ? ['last'] : []), 'birthday', 'grade', 'goals', 'privacy']
    .filter((s) => !(adding && s === 'welcome'));
  const next = () => setStep(steps[steps.indexOf(step) + 1]);
  const back = () => (steps.indexOf(step) === 0 ? navigate(-1) : setStep(steps[steps.indexOf(step) - 1]));
  const toggleGoal = (g) => setGoals((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]));

  const done = () => {
    createProfile({
      relation: who, name, stage, goals, grade,
      lastStart: remember === 'yes' && lastStart ? lastStart : null,
      birth: month && year ? { month: Number(month), year: Number(year) } : null,
    });
    navigate('/', { replace: true });
  };

  return (
    <div className="onboard">
      {step !== 'welcome' && (
        <div className="row" style={{ marginBottom: 8 }}>
          <button className="btn small" onClick={back} aria-label="Back">‹ Back</button>
          <div className="progress spacer" aria-hidden="true">
            {steps.filter((s) => s !== 'welcome').map((s, i) => <i key={s} className={i <= steps.filter((x) => x !== 'welcome').indexOf(step) ? 'on' : ''} />)}
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
          <p className="small muted" style={{ textAlign: 'center' }}>Already using Cadence on another phone? Scan the code it shows you under Settings → Share with another phone.</p>
        </div>
      )}

      {step === 'who' && (
        <>
          <p className="question">{adding ? 'Who is this for?' : 'Who’s using Cadence?'}</p>
          <div className="choices">
            <Choice pressed={who === 'me'} onClick={() => setWho('me')}>{adding && hasMe ? 'Me (a second profile)' : 'Me, for my own periods'}</Choice>
            <Choice pressed={who === 'child'} onClick={() => setWho('child')}>I’m a parent or guardian, logging for my child</Choice>
          </div>
          {kid && <p className="muted" style={{ marginTop: 16 }}>Perfect for kids who don’t have a phone yet. When they get one, you can move their whole history over.</p>}
          <div className="spacer" />
          <button className="btn primary block" disabled={!who} onClick={next} style={{ marginTop: 24 }}>Next</button>
        </>
      )}

      {step === 'name' && (
        <>
          <p className="question">What should we call them?</p>
          <p className="muted" style={{ marginTop: -8 }}>A first name or nickname, so you can tell profiles apart. It stays on this phone.</p>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoFocus placeholder="e.g. Maya" />
          <div className="spacer" />
          <button className="btn primary block" onClick={next} style={{ marginTop: 24 }}>{name.trim() ? 'Next' : 'Skip'}</button>
        </>
      )}

      {step === 'stage' && (
        <>
          <p className="question">{kid ? `Has ${n} had a first period?` : 'Have you had your first period?'}</p>
          <div className="choices">
            {STAGES[kid ? 'child' : 'me'].map(([key, label]) => <Choice key={key} pressed={stage === key} onClick={() => setStage(key)}>{label}</Choice>)}
          </div>
          {stage === 'notYet' && <p className="muted" style={{ marginTop: 16 }}>{kid ? 'Getting ready early makes the first one so much less scary.' : 'That’s great. You can get ready now, so it’s less of a surprise when it comes.'}</p>}
          {stage === 'new' && <p className="muted" style={{ marginTop: 16 }}>{kid ? 'A big day. Cadence will help you both through it.' : 'That’s a big deal, and it’s completely normal. We’ll help you figure it out.'}</p>}
          <div className="spacer" />
          <button className="btn primary block" disabled={!stage} onClick={next} style={{ marginTop: 24 }}>Next</button>
        </>
      )}

      {step === 'last' && (
        <>
          <p className="question">{kid ? `Do you remember when ${nPossessive} last period started?` : 'Do you remember when your last period started?'}</p>
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
          {remember === 'no' && <p className="muted" style={{ marginTop: 16 }}>No problem. Most people don’t! Just log the next one, and Cadence will learn from there.</p>}
          <div className="spacer" />
          <button className="btn primary block" disabled={!remember || (remember === 'yes' && !lastStart)} onClick={next} style={{ marginTop: 24 }}>Next</button>
        </>
      )}

      {step === 'birthday' && (
        <>
          <p className="question">{kid ? `When is ${nPossessive} birthday?` : 'When’s your birthday?'}</p>
          <p className="muted" style={{ marginTop: -8 }}>Just the month and year. It helps Cadence use the right words, and it never leaves this device.</p>
          <div className="row">
            <label className="field spacer"><span>Month</span>
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                <option value="">Month</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </label>
            <label className="field spacer"><span>Year</span>
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">Year</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
          </div>
          <div className="spacer" />
          <button className="btn primary block" disabled={Boolean(month) !== Boolean(year)} onClick={next} style={{ marginTop: 24 }}>{month && year ? 'Next' : 'Skip'}</button>
        </>
      )}

      {step === 'grade' && (
        <>
          <p className="question">{kid ? `What grade is ${n} in?` : 'What grade are you in?'}</p>
          <p className="muted" style={{ marginTop: -8 }}>So School Mode fits. It moves up by itself every year.</p>
          <div className="chips">
            {GRADES.map(([k, label]) => <button key={k} type="button" className="chip" aria-pressed={grade === k} onClick={() => setGrade(grade === k ? null : k)}>{label}</button>)}
          </div>
          <div className="spacer" />
          <button className="btn primary block" onClick={next} style={{ marginTop: 24 }}>{grade ? 'Next' : 'Skip'}</button>
        </>
      )}

      {step === 'goals' && (
        <>
          <p className="question">{kid ? 'What would help most?' : 'What would you like help with?'}</p>
          <p className="muted" style={{ marginTop: -8 }}>Pick as many as you like.</p>
          <div className="choices">
            {GOALS[kid ? 'child' : 'me'].map(([key, label]) => <Choice key={key} pressed={goals.includes(key)} onClick={() => toggleGoal(key)}>{label}</Choice>)}
          </div>
          <button className="btn primary block" onClick={next} style={{ marginTop: 24 }}>{goals.length ? 'Next' : 'Skip for now'}</button>
        </>
      )}

      {step === 'privacy' && (
        <div className="stack">
          <p className="question">{kid ? `This is ${nPossessive} history. Keep it safe.` : 'This is just for you.'}</p>
          <div className="card stack">
            <p><strong>Everything stays on this device.</strong> No account, no email, no phone number. Birthday and grade stay here too.</p>
            {kid ? (
              <>
                <p><strong>When {n} gets a phone,</strong> you can share this profile with it. The whole history moves over, and {n} will choose what keeps being shared back with you. Private things stay private.</p>
                <p className="small muted" style={{ margin: 0 }}>Our <Link to="/parents">parent guide</Link> has tips for talking about periods without embarrassing anyone.</p>
              </>
            ) : (
              <p><strong>Nobody else can see it.</strong> Not us, not advertisers, not a parent dashboard. If you ever share with a parent’s phone, you choose exactly what they see.</p>
            )}
            <p style={{ margin: 0 }}><strong>You can take it or delete it anytime</strong> from Settings.</p>
          </div>
          <p className="muted small">Since data lives only on this device, clearing browser data or losing the phone erases it, unless you’ve saved a backup or shared with another phone.</p>
          <button className="btn primary block" onClick={done}>{kid ? `Start ${nPossessive} profile` : 'Got it, let’s go'}</button>
          {kid && <p className="small muted" style={{ textAlign: 'center' }}>{N} can also have their own profile on this phone later.</p>}
        </div>
      )}
    </div>
  );
}
