import { diffDays } from './dates.js';

// "My life": plans she adds herself (a trip, finals, a swim meet, a field trip).
// Nothing is read from her real calendar.
export const PLAN_KINDS = [
  ['✈️', 'Trip'], ['🎓', 'Exams'], ['🏊', 'Swimming'], ['🏃', 'Sports'], ['🚌', 'Field trip'],
  ['⛺', 'Camp'], ['🛏️', 'Sleepover'], ['🎂', 'Party'], ['⭐', 'Something else'],
];

const PACKING = {
  '✈️': ['Pack extra supplies in your carry-on.', 'Packing reminder'],
  '🏊': ['A tampon, cup or period swimwear works in the water.', 'Swimming tips'],
  '🚌': ['Pack your pouch?', 'Check my pouch'],
  '⛺': ['Pack more supplies than you think, plus a small bag.', 'Camp tips'],
  '🛏️': ['An overnight pad and dark pajamas help.', 'Sleepover tips'],
};

/** Upcoming plans that fall inside her possible period window, with what she usually feels. */
export function planOverlaps(plans = [], next, today, patterns = []) {
  const cramps = patterns.find((p) => p.id === 'early-Cramps') ? ' Your cramps are usually strongest on Days 1–2.' : '';
  if (!next) return [];
  return plans
    .filter((p) => (p.end ?? p.start) >= today && p.start <= next.latest && (p.end ?? p.start) >= next.earliest)
    .filter((p) => diffDays(p.start, today) <= 45)
    .map((p) => {
      const [packing, cta] = PACKING[p.emoji] ?? ['Want to pack your pouch?', 'Check my pouch'];
      return { ...p, packing: packing + cramps, cta };
    });
}
