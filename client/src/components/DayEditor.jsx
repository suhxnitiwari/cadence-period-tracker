import { useEffect, useState } from 'react';
import { useStore } from '../store.jsx';
import { SYMPTOMS, PAIN } from '../lib/cycles.js';

const FLOW_OPTIONS = [
  [null, 'None'],
  ['spotting', 'Spotting'],
  ['light', 'Light'],
  ['medium', 'Medium'],
  ['heavy', 'Heavy'],
];
const PAIN_LABELS = { none: 'No pain', mild: 'Mild', moderate: 'Moderate', severe: 'Severe' };

/** Everything saves the moment you tap it. No save button to forget. */
export function DayEditor({ date }) {
  const { days, saveDay, settings } = useStore();
  const log = days[date] ?? {};
  const [notes, setNotes] = useState(log.notes ?? '');
  const [error, setError] = useState('');

  useEffect(() => setNotes(days[date]?.notes ?? ''), [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch) => {
    setError('');
    saveDay(date, { ...log, ...patch }).catch(() => setError('Couldn’t save. Check your connection and try again.'));
  };
  const toggleSymptom = (s) => {
    const current = log.symptoms ?? [];
    update({ symptoms: current.includes(s) ? current.filter((x) => x !== s) : [...current, s] });
  };

  const groups = { ...SYMPTOMS, ...(settings.customSymptoms?.length ? { Yours: settings.customSymptoms } : {}) };

  return (
    <div className="stack">
      <div>
        <p className="chip-label" id={`flow-${date}`}>Bleeding</p>
        <div className="chips" role="group" aria-labelledby={`flow-${date}`}>
          {FLOW_OPTIONS.map(([value, label]) => (
            <button key={label} type="button" className={value ? 'chip flow' : 'chip'} aria-pressed={(log.flow ?? null) === value}
              onClick={() => update({ flow: value ?? undefined })}>{label}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="chip-label" id={`pain-${date}`}>Pain</p>
        <div className="chips" role="group" aria-labelledby={`pain-${date}`}>
          {PAIN.map((p) => (
            <button key={p} type="button" className="chip" aria-pressed={log.pain === p}
              onClick={() => update({ pain: log.pain === p ? undefined : p })}>{PAIN_LABELS[p]}</button>
          ))}
        </div>
      </div>

      {Object.entries(groups).map(([group, list]) => (
        <div key={group}>
          <p className="chip-label" id={`${group}-${date}`}>{group}</p>
          <div className="chips" role="group" aria-labelledby={`${group}-${date}`}>
            {list.map((s) => (
              <button key={s} type="button" className="chip" aria-pressed={Boolean(log.symptoms?.includes(s))} onClick={() => toggleSymptom(s)}>{s}</button>
            ))}
          </div>
        </div>
      ))}

      <label className="field">
        <span>Notes <span className="muted small">(only you can read these)</span></span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (log.notes ?? '') && update({ notes: notes || undefined })}
          placeholder="Anything you want to remember" maxLength={2000} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
