import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LEARN } from '../content/learn.js';
import { NORMAL } from '../content/normal.js';
import { Answer } from './Normal.jsx';

export default function Learn() {
  const { hash } = useLocation();
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView(); }, [hash]);

  return (
    <div className="stack">
      <div>
        <h1>Learn</h1>
        <p className="muted">Short answers about your body. No textbook.</p>
      </div>
      {LEARN.map((t) => {
        const related = NORMAL.filter((n) => n.topic === t.id);
        return (
          <details key={t.id} id={t.id} className="card" open={hash.slice(1) === t.id}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', listStyle: 'none' }}>{t.emoji} {t.title}</summary>
            <div className="stack" style={{ marginTop: 12 }}>
              {t.cards.map(([title, body]) => (
                <div key={title}>
                  <h3 style={{ marginBottom: 4 }}>{title}</h3>
                  <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{body}</p>
                </div>
              ))}
              {t.id === 'school' && <Link className="btn small" to="/school">Open School</Link>}
              {related.length > 0 && (
                <div>
                  <p className="chip-label" style={{ marginTop: 8 }}>Is this normal?</p>
                  {related.map((item) => <Answer key={item.id} item={item} />)}
                </div>
              )}
            </div>
          </details>
        );
      })}
      <p className="muted small">General information based on guidance from pediatric and gynecology organizations. It isn’t medical advice.</p>
    </div>
  );
}
