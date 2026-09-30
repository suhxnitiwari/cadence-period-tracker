import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { TOPICS, PEOPLE, draftMessage, evidence } from '../lib/tell.js';

// SPEAK UP: help her turn what she's noticed into words for a real person.
// Nothing is ever sent by Cadence. She copies it, shares it herself, or says it out loud.
export default function Tell() {
  const { analysis, today } = useStore();
  const [params] = useSearchParams();
  const [topic, setTopic] = useState(params.get('topic') ?? null);
  const [person, setPerson] = useState(null);
  const [useData, setUseData] = useState(true);
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const facts = useMemo(() => evidence(analysis, today), [analysis, today]);
  const hasFacts = ['pain', 'heavy', 'school', 'mood', 'notCome'].includes(topic)
    && (facts.painDays || facts.heavyDays || facts.missedSchool || facts.lowMoodDays >= 3 || facts.since);

  useEffect(() => {
    if (topic && person) setText(draftMessage({ topic, person, facts, useData }));
  }, [topic, person, useData, facts]);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const share = () => navigator.share?.({ text }).catch(() => {});

  return (
    <div className="stack">
      <div>
        <h1>Help me tell someone</h1>
        <p className="muted">Some things are hard to bring up. Cadence can help you find the words. It never sends anything. You decide what to do with it.</p>
      </div>

      <section className="card">
        <p className="chip-label">What’s it about?</p>
        <div className="chips">
          {TOPICS.map(([k, label]) => <button key={k} className="chip" aria-pressed={topic === k} onClick={() => setTopic(k)}>{label}</button>)}
        </div>
      </section>

      {topic && (
        <section className="card">
          <p className="chip-label">Who do you want to tell?</p>
          <div className="chips">
            {PEOPLE.map(([k, label]) => <button key={k} className="chip" aria-pressed={person === k} onClick={() => setPerson(k)}>{label}</button>)}
          </div>
        </section>
      )}

      {topic && person && (
        <section className="card stack">
          <label className="field">
            <span>Here’s a start. Change anything you like.</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} />
          </label>
          {hasFacts && (
            <label className="check">
              <input type="checkbox" checked={useData} onChange={(e) => setUseData(e.target.checked)} />
              <span>Include what I’ve logged <span className="muted small">(it can help people understand)</span></span>
            </label>
          )}
          <div className="row">
            <button className="btn primary" onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
            {'share' in navigator && <button className="btn" onClick={share}>Share…</button>}
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            You can also just read it out loud, or show them your screen. {person === 'doctor' && 'For a doctor, your period report can help too. '}
            There’s no wrong way to ask for help.
          </p>
          {person === 'doctor' && <Link className="btn small" to="/report">Open my period report</Link>}
          {['mom', 'dad', 'guardian', 'adult'].includes(person) && <Link className="btn small" to="/people">Or send them an update from Cadence</Link>}
        </section>
      )}
    </div>
  );
}
