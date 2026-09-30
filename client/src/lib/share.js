import { todayISO } from './dates.js';

// What a trusted person can be allowed to see. Each is opt-in per link.
export const SHARE_FIELDS = {
  status: 'Whether I’m on my period right now (and which day)',
  next: 'When my next period is likely',
  pain: 'How much pain I logged today',
  requests: 'My “I need…” requests',
};

export const SHARE_FIELDS_SHORT = { status: 'period status', next: 'next period', pain: 'today’s pain', requests: '“I need…” requests' };

export const REQUESTS = {
  supplies: 'I need pads, tampons or other supplies',
  pain: 'I’m in a lot of pain',
  talk: 'Can we talk?',
};

/** Build the small, pre-filtered snapshot a trusted person gets. Nothing else is shared. */
export function buildSnapshot({ share, analysis, days, requests, displayName }) {
  const today = todayISO();
  const snap = { name: displayName || null, label: share.label, updated: today };
  const { status } = analysis;

  if (share.fields.includes('status')) {
    snap.status = status.phase === 'period' ? { onPeriod: true, day: status.day } : { onPeriod: false };
  }
  if (share.fields.includes('next') && analysis.predictions[0] && status.phase !== 'period') {
    const p = status.phase === 'late' ? null : analysis.predictions[0];
    snap.next = p ? { earliest: p.earliest, latest: p.latest } : { late: true };
  }
  if (share.fields.includes('pain')) snap.pain = days[today]?.pain ?? null;
  if (share.fields.includes('requests')) snap.requests = Object.keys(requests ?? {}).filter((k) => requests[k]);
  return snap;
}

/** Practical, age-appropriate ways a caregiver can help, based on what they can see. */
export function caregiverTips(snap) {
  const tips = [];
  if (snap.requests?.includes('supplies')) tips.push('Pick up pads, tampons, period underwear or whatever they use, and leave them somewhere private.');
  if (snap.requests?.includes('pain') || ['moderate', 'severe'].includes(snap.pain)) {
    tips.push('A heating pad or hot-water bottle, a warm drink, and rest can help with cramps.');
    tips.push('If pain regularly stops them from going to school or doing everyday things, talk to a doctor. That’s not something anyone has to just put up with.');
  }
  if (snap.requests?.includes('talk')) tips.push('They’d like to talk. Somewhere private and low-pressure, like a walk or a car ride, often feels easiest.');
  if (snap.status?.onPeriod && snap.status.day <= 2) tips.push('The first couple of days are often the heaviest. A spare change of clothes in a school bag can be a relief.');
  if (!tips.length) tips.push('Nothing needed right now. Just knowing they can ask you is often the most helpful thing.');
  return tips;
}
