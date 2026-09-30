import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { api } from '../lib/api.js';
import { buildIcs, DISCREET_TITLE } from '../lib/ics.js';
import { todayISO } from '../lib/dates.js';
import { FLOWS, PAIN } from '../lib/cycles.js';

function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function CalendarSettings() {
  const { settings, saveSettings, analysis, calendarToken, setCalendarToken, resetPublished } = useStore();
  const cal = settings.calendar;
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState(cal.title);
  useEffect(() => setTitle(cal.title), [cal.title]);

  const feedUrl = calendarToken ? `${window.location.origin}/api/feed/${calendarToken}.ics` : null;
  const webcal = feedUrl?.replace(/^https?:/, 'webcal:');
  const isLocal = /localhost|127\.0\.0\.1/.test(window.location.hostname);

  const setCal = (patch) => saveSettings({ calendar: { ...cal, ...patch } });
  const turnOff = async () => {
    await api.del('/calendar');
    setCalendarToken(null);
    resetPublished();
    await setCal({ enabled: false });
  };
  const copy = async () => {
    await navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const ics = () => buildIcs(analysis.predictions, { title: cal.title, includeFertile: cal.includeFertile && analysis.showFertile });

  return (
    <section className="card stack" id="calendar">
      <h2>Calendar</h2>
      <div>
        <p className="chip-label">Event title</p>
        <div className="chips">
          {['Period likely', DISCREET_TITLE].map((t) => (
            <button key={t} className="chip" aria-pressed={cal.title === t} onClick={() => setCal({ title: t })}>
              {t === DISCREET_TITLE ? `“${t}” (discreet)` : `“${t}”`}
            </button>
          ))}
        </div>
        <label className="field" style={{ marginTop: 10 }}>
          <span className="small muted">Or write your own</span>
          <input type="text" value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== cal.title && setCal({ title: title.trim() })} />
        </label>
        <p className="muted small">Good to know if your calendar is shared with family or work.</p>
      </div>

      {analysis.showFertile && (
        <label className="check">
          <input type="checkbox" checked={cal.includeFertile} onChange={(e) => setCal({ includeFertile: e.target.checked })} />
          Also add estimated fertile windows
        </label>
      )}

      <hr className="divider" style={{ margin: 0 }} />
      <div>
        <h3>Sync with Google or Apple Calendar</h3>
        <p className="muted small">Your calendar subscribes to your predicted dates and updates as you log. This publishes <strong>only the predicted dates and your event title</strong>, unencrypted, at a private address, because calendar apps can’t decrypt. Turning it off deletes it.</p>
        {!cal.enabled ? (
          <button className="btn" onClick={() => setCal({ enabled: true })} disabled={!analysis.predictions.length}>Turn on calendar sync</button>
        ) : !feedUrl ? (
          <p className="muted">Setting up…</p>
        ) : (
          <div className="stack">
            <div className="row">
              <a className="btn small primary" href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`} target="_blank" rel="noreferrer">Add to Google Calendar</a>
              <a className="btn small" href={webcal}>Add to Apple Calendar</a>
              <button className="btn small" onClick={copy}>{copied ? 'Copied' : 'Copy address'}</button>
              <button className="btn small danger" onClick={turnOff}>Turn off sync</button>
            </div>
            <p className="muted small" style={{ margin: 0 }}>
              If the button doesn’t work: in Google Calendar, go to <em>Other calendars → + → From URL</em> and paste the address.
              {isLocal && ' (Google can only subscribe once Cadence is running at a public web address, not on localhost.)'}
            </p>
          </div>
        )}
        {!analysis.predictions.length && <p className="muted small">Log a period first so there’s something to add.</p>}
      </div>
      <div>
        <button className="btn small" disabled={!analysis.predictions.length} onClick={() => download('cadence.ics', ics(), 'text/calendar')}>Download .ics file instead</button>
      </div>
    </section>
  );
}

export default function Settings() {
  const { user, settings, saveSettings, days, saveDays, logout, deleteAccount } = useStore();
  const [newSymptom, setNewSymptom] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [cycle, setCycle] = useState(settings.typicalCycle);
  const [period, setPeriod] = useState(settings.typicalPeriod);

  const exportJson = () => download(`cadence-${todayISO()}.json`, JSON.stringify({ app: 'cadence', version: 1, exportedAt: new Date().toISOString(), settings, days }, null, 2), 'application/json');
  const exportCsv = () => {
    const rows = [['date', 'flow', 'pain', 'symptoms', 'notes'].join(',')];
    for (const date of Object.keys(days).sort()) {
      const d = days[date];
      rows.push([date, d.flow, d.pain, (d.symptoms ?? []).join('; '), d.notes].map(csvCell).join(','));
    }
    download(`cadence-${todayISO()}.csv`, rows.join('\n'), 'text/csv');
  };

  const importJson = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.app !== 'cadence' || typeof parsed.days !== 'object') throw new Error();
      const clean = {};
      for (const [date, log] of Object.entries(parsed.days)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || typeof log !== 'object') continue;
        clean[date] = {
          ...(FLOWS.includes(log.flow) && { flow: log.flow }),
          ...(PAIN.includes(log.pain) && { pain: log.pain }),
          ...(Array.isArray(log.symptoms) && { symptoms: log.symptoms.filter((s) => typeof s === 'string').slice(0, 40) }),
          ...(typeof log.notes === 'string' && { notes: log.notes.slice(0, 2000) }),
        };
      }
      await saveDays(clean);
      setImportMsg(`Imported ${Object.keys(clean).length} days.`);
    } catch {
      setImportMsg('That file doesn’t look like a Cadence export.');
    }
  };

  const addSymptom = (e) => {
    e.preventDefault();
    const s = newSymptom.trim();
    if (!s || settings.customSymptoms.includes(s)) return;
    saveSettings({ customSymptoms: [...settings.customSymptoms, s] });
    setNewSymptom('');
  };

  return (
    <div className="grid-2">
      <div className="stack">
        <h1>Settings</h1>

        <section className="card stack">
          <h2>Your cycle</h2>
          <p className="muted small">Used for predictions until you’ve logged a few cycles. After that, Cadence learns from your real data.</p>
          <div className="row">
            <label className="field"><span>Typical cycle (days)</span>
              <input type="number" min={15} max={90} value={cycle} onChange={(e) => setCycle(e.target.value)}
                onBlur={() => cycle >= 15 && cycle <= 90 && saveSettings({ typicalCycle: Number(cycle) })} />
            </label>
            <label className="field"><span>Typical period (days)</span>
              <input type="number" min={1} max={15} value={period} onChange={(e) => setPeriod(e.target.value)}
                onBlur={() => period >= 1 && period <= 15 && saveSettings({ typicalPeriod: Number(period) })} />
            </label>
          </div>
          <label className="check">
            <input type="checkbox" checked={settings.showFertility} onChange={(e) => saveSettings({ showFertility: e.target.checked })} />
            <span>Show estimated fertile windows<br />
              <span className="muted small">Off by default. These are rough estimates, hidden when cycles are irregular, and <strong>not a form of birth control</strong>.</span>
            </span>
          </label>
        </section>

        <section className="card stack">
          <h2>Your own symptoms</h2>
          <p className="muted small">Add anything you want to track that isn’t on the list.</p>
          {settings.customSymptoms.length > 0 && (
            <div className="chips">
              {settings.customSymptoms.map((s) => (
                <button key={s} className="chip" onClick={() => saveSettings({ customSymptoms: settings.customSymptoms.filter((x) => x !== s) })} aria-label={`Remove ${s}`}>{s} ✕</button>
              ))}
            </div>
          )}
          <form className="row" onSubmit={addSymptom}>
            <input type="text" value={newSymptom} onChange={(e) => setNewSymptom(e.target.value)} placeholder="e.g. Migraine" maxLength={30} style={{ flex: 1, minWidth: 160 }} />
            <button className="btn">Add</button>
          </form>
        </section>

        <CalendarSettings />
      </div>

      <div className="stack" style={{ paddingTop: 0 }}>
        <section className="card stack">
          <h2>Your data</h2>
          <p className="muted small">It’s yours. Take it anywhere. Exports are unencrypted, so keep them somewhere private.</p>
          <div className="row">
            <button className="btn small" onClick={exportJson}>Export backup (.json)</button>
            <button className="btn small" onClick={exportCsv}>Export spreadsheet (.csv)</button>
          </div>
          <label className="field">
            <span>Restore from a backup</span>
            <input type="file" accept="application/json,.json" onChange={importJson} />
          </label>
          {importMsg && <p className="small" role="status">{importMsg}</p>}
          <p className="small"><Link to="/privacy">How your privacy works</Link></p>
        </section>

        <section className="card stack">
          <h2>Account</h2>
          <p className="muted small">Signed in as <strong>{user.username}</strong>.</p>
          <div><button className="btn" onClick={logout}>Log out</button></div>
          <hr className="divider" style={{ margin: 0 }} />
          <h3>Delete everything</h3>
          <p className="muted small">Permanently deletes your account, every day you’ve logged, your share links and your calendar feed, immediately. This can’t be undone.</p>
          <label className="field">
            <span className="small">Type <strong>{user.username}</strong> to confirm</span>
            <input type="text" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} autoCapitalize="none" />
          </label>
          <div><button className="btn danger" disabled={confirmName.trim().toLowerCase() !== user.username} onClick={deleteAccount}>Delete my account and data</button></div>
        </section>
      </div>
    </div>
  );
}
