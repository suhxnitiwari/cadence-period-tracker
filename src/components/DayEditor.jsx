import { useEffect, useState } from 'react';
import { useStore } from '../store.jsx';
import { SYMPTOMS, PAIN, PAIN_LABELS } from '../lib/cycles.js';

const FLOW_OPTIONS = [
  [null, 'None'],
  ['spotting', 'Spotting'],
  ['light', 'Light'],
  ['medium', 'Medium'],
  ['heavy', 'Heavy'],
];

/** Everything saves the moment she taps it. No save button to forget. */
export function DayEditor({ date, compact = false }) {
  const { days, setDay, settings, hidden, person } = useStore();
  const log = days[date] ?? {};
  const [notes, setNotes] = useState(log.notes ?? '');
  const [showAll, setShowAll] = useState(!compact);
  useEffect(() => setNotes(days[date]?.notes ?? ''), [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch) => setDay(date, { ...log, ...patch });
  const toggle = (s) => {
    const cur = log.symptoms ?? [];
    update({ symptoms: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s] });
  };

  const groups = hidden.symptoms ? {} : { ...SYMPTOMS, ...(settings.customSymptoms?.length ? { Mine: settings.customSymptoms } : {}) };
  const shown = hidden.symptoms ? [] : showAll ? Object.entries(groups) : [['Body', ['Cramps', 'Headache', 'Bloating', 'Tired', 'Back pain', 'Acne']], ['Feelings', SYMPTOMS.Feelings.slice(0, 6)]];
  const privateNote = Object.values(hidden).some(Boolean) && (
    <p className="muted small" style={{ margin: 0 }}>{person.You} keeps some things private on their own phone{hidden.pain ? ', like pain' : ''}{hidden.symptoms ? `${hidden.pain ? ' and' : ', like'} symptoms and feelings` : ''}. That’s by design.</p>
  );
  const flowValue = log.flow === 'yes' ? null : log.flow ?? null;

  return (
    <div className="stack">
      <div>
        <p className="chip-label" id={`flow-${date}`}>Bleeding{log.flow === 'yes' && <span style={{ textTransform: 'none', letterSpacing: 0 }}> · on your period (tap to add how heavy)</span>}</p>
        <div className="chips" role="group" aria-labelledby={`flow-${date}`}>
          {FLOW_OPTIONS.map(([value, label]) => (
            <button key={label} type="button" className={value ? 'chip flow' : 'chip'}
              aria-pressed={value === null ? !log.flow : flowValue === value}
              onClick={() => update({ flow: value ?? undefined })}>{label}</button>
          ))}
        </div>
      </div>

      {!hidden.pain && <div>
        <p className="chip-label" id={`pain-${date}`}>Pain</p>
        <div className="chips" role="group" aria-labelledby={`pain-${date}`}>
          {PAIN.map((p) => (
            <button key={p} type="button" className="chip" aria-pressed={log.pain === p}
              onClick={() => update({ pain: log.pain === p ? undefined : p })}>{PAIN_LABELS[p]}</button>
          ))}
        </div>
      </div>}

      {shown.map(([group, list]) => (
        <div key={group}>
          <p className="chip-label" id={`${group}-${date}`}>{group}</p>
          <div className="chips" role="group" aria-labelledby={`${group}-${date}`}>
            {list.map((s) => (
              <button key={s} type="button" className="chip" aria-pressed={Boolean(log.symptoms?.includes(s))} onClick={() => toggle(s)}>{s}</button>
            ))}
          </div>
        </div>
      ))}
      {privateNote}
      {!showAll && !hidden.symptoms && <button type="button" className="btn small" onClick={() => setShowAll(true)}>More: clots, sleep, sports, medicine, your own…</button>}

      {(showAll || hidden.symptoms) && (
        <label className="field">
          <span>Private notes <span className="muted small">(only on this phone, never shared)</span></span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== (log.notes ?? '') && update({ notes: notes || undefined })}
            placeholder="Anything you want to remember" maxLength={2000} />
        </label>
      )}
    </div>
  );
}
