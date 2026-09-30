import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { Sheet } from './Sheet.jsx';

const FLOWS = [
  ['spotting', '💧', 'Spotting'],
  ['light', '🩸', 'Light'],
  ['medium', '🩸🩸', 'Medium'],
  ['heavy', '🩸🩸🩸', 'Heavy'],
];

const EXPLAIN = [
  ['Spotting', 'A few drops or small spots. You might only see it when you wipe.'],
  ['Light', 'You can see blood, but your pad is far from full when you change it.'],
  ['Medium', 'Your pad is getting pretty full by the time you change it.'],
  ['Heavy', 'You need to change every 2 to 3 hours, or you’re worried about leaking.'],
];

/** The easiest interaction in the app: "I got my period" → first one? → how's your flow? */
export function GotPeriod({ onClose }) {
  const { analysis, today, startPeriod, person } = useStore();
  const neverLogged = analysis.periods.length === 0;
  const [step, setStep] = useState(neverLogged ? 'first' : 'flow');
  const [isFirst, setIsFirst] = useState(false);
  const [explain, setExplain] = useState(false);

  const choose = (flow) => {
    startPeriod(today, flow);
    setStep(isFirst ? 'firstDone' : 'done');
  };

  return (
    <Sheet title={step === 'firstDone' ? (person.isChild ? 'A big day 💗' : 'You did it 💗') : person.isChild ? `${person.You} got a period` : 'I got my period'} onClose={onClose}>
      {step === 'first' && (
        <div className="stack">
          <p className="big">Is this {person.your} first one?</p>
          <button className="choice" onClick={() => { setIsFirst(true); setStep('flow'); }}>Yes!</button>
          <button className="choice" onClick={() => setStep('flow')}>Nope</button>
        </div>
      )}

      {step === 'flow' && (
        <div className="stack">
          <p className="big">How’s your flow?</p>
          {FLOWS.map(([key, drops, label]) => (
            <button key={key} className="choice flow-choice" onClick={() => choose(key)}>
              <span className="drops" aria-hidden="true">{drops}</span>{label}
            </button>
          ))}
          <button className="choice" onClick={() => setExplain((e) => !e)} aria-expanded={explain}>I don’t know</button>
          {explain && (
            <div className="card calm stack">
              <p><strong>That’s okay!</strong> Here’s a way to tell:</p>
              {EXPLAIN.map(([t, d]) => <p key={t} className="small"><strong>{t}:</strong> {d}</p>)}
              <button className="btn small" onClick={() => choose(null)}>Still not sure. Just log it.</button>
            </div>
          )}
        </div>
      )}

      {step === 'firstDone' && person.isChild && (
        <div className="stack">
          <p>A first period is a big moment. Staying calm and matter-of-fact tells {person.you} this is a normal, healthy part of growing up.</p>
          <ul className="list">
            <li><Link className="list-link" to="/parents" onClick={onClose}>Parent guide: the first day</Link></li>
            <li><Link className="list-link" to="/learn#products" onClick={onClose}>How to use a pad (to show {person.you})</Link></li>
            <li><Link className="list-link" to="/school" onClick={onClose}>Pack a pouch for school</Link></li>
          </ul>
          <button className="btn primary block" onClick={onClose}>Done</button>
        </div>
      )}

      {step === 'firstDone' && !person.isChild && (
        <div className="stack">
          <p>Getting your first period is a big deal, and it’s completely normal. You’re not in trouble, nothing is wrong, and you don’t have to figure it out alone.</p>
          <ul className="list">
            <li><Link className="list-link" to="/learn#products" onClick={onClose}>How to use a pad</Link></li>
            <li><Link className="list-link" to="/normal" onClick={onClose}>Is what I’m seeing normal?</Link></li>
            <li><Link className="list-link" to="/tell?topic=first" onClick={onClose}>Help me tell someone</Link></li>
            <li><Link className="list-link" to="/school" onClick={onClose}>Getting ready for school</Link></li>
          </ul>
          <button className="btn primary block" onClick={onClose}>Done</button>
        </div>
      )}

      {step === 'done' && (
        <div className="stack">
          <p>Logged. Each day, you can add how it’s going. When it’s over, tap “It ended” on Today.</p>
          <button className="btn primary block" onClick={onClose}>Done</button>
        </div>
      )}
    </Sheet>
  );
}
