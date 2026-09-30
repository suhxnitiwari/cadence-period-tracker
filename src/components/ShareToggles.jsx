import { SHARE_OPTIONS } from '../lib/syncCore.js';

/** Her choices about what a paired parent's phone can see. Periods always; the rest is up to her. */
export function ShareToggles({ shares, onChange, other = 'the other phone' }) {
  return (
    <div className="stack">
      <p className="chip-label" style={{ margin: 0 }}>What {other} can see</p>
      <label className="check" style={{ padding: '4px 0' }}>
        <input type="checkbox" checked disabled />
        <span>Periods and flow <span className="muted small">(that’s what sharing is for)</span></span>
      </label>
      {Object.entries(SHARE_OPTIONS).map(([k, label]) => (
        <label key={k} className="check" style={{ padding: '4px 0' }}>
          <input type="checkbox" checked={Boolean(shares[k])} onChange={() => onChange({ ...shares, [k]: !shares[k] })} />
          <span>{label}</span>
        </label>
      ))}
      <label className="check" style={{ padding: '4px 0' }}>
        <input type="checkbox" checked={false} disabled />
        <span>Private notes <span className="muted small">(never shared)</span></span>
      </label>
    </div>
  );
}
