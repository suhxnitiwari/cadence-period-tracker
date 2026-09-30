import { useState } from 'react';
import { formatDate } from '../lib/dates.js';
import { TYPICAL_CYCLE } from '../lib/cycles.js';

// Cycle length per cycle, with the typical 21–35 day band shaded behind it.
// Single series, so no legend. The title names it and the table below is the text view.
export function CycleChart({ cycles }) {
  const [hover, setHover] = useState(null);
  const data = cycles.filter((c) => !c.gap).slice(-12);
  if (data.length < 1) return null;

  const W = 400, H = 220, pad = { t: 22, r: 4, b: 26, l: 28 };
  const max = Math.max(45, ...data.map((c) => c.length)) + 5;
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const band = (W - pad.l - pad.r) / data.length;
  const barW = Math.min(24, band * 0.6);
  const ticks = [0, 14, 28, 42].filter((t) => t <= max);

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Cycle length for each of your recent cycles, in days">
        <rect x={pad.l} y={y(TYPICAL_CYCLE[1])} width={W - pad.l - pad.r} height={y(TYPICAL_CYCLE[0]) - y(TYPICAL_CYCLE[1])} fill="var(--surface-2)" />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{t}</text>
          </g>
        ))}
        {data.map((c, i) => {
          const cx = pad.l + band * i + band / 2;
          const top = y(c.length), base = y(0), r = Math.min(4, barW / 2);
          const path = `M${cx - barW / 2},${base} V${top + r} Q${cx - barW / 2},${top} ${cx - barW / 2 + r},${top} H${cx + barW / 2 - r} Q${cx + barW / 2},${top} ${cx + barW / 2},${top + r} V${base} Z`;
          return (
            <g key={c.start} onMouseEnter={() => setHover({ c, x: cx / W, y: top / H })} onMouseLeave={() => setHover(null)}>
              <rect x={cx - band / 2} y={pad.t} width={band} height={H - pad.t - pad.b} fill="transparent" />
              <path d={path} fill="var(--flow-medium)" opacity={hover && hover.c !== c ? 0.55 : 1} />
              <text x={cx} y={top - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink-2)">{c.length}</text>
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">{formatDate(c.start, { month: 'short' })}</text>
            </g>
          );
        })}
      </svg>
      {hover && (
        <div className="chart-tip" style={{ left: `${hover.x * 100}%`, top: `${hover.y * 100}%` }}>
          Started {formatDate(hover.c.start)} · {hover.c.length} days · period {hover.c.periodLength} days
        </div>
      )}
    </div>
  );
}
