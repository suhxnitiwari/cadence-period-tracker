// "My people": she sends a grown-up an update she chose. There's no server.
// The update lives inside the link's #fragment, which browsers never send to any
// web server, so only the person holding the link can read it. It's a snapshot,
// not a live feed, and nobody can watch her.

export const RECIPIENTS = [
  ['Mom', 'Mom'], ['Dad', 'Dad'], ['Guardian', 'Guardian'], ['Grandparent', 'Grandparent'], ['Trusted adult', 'Another trusted adult'],
];

export const INCLUDE = {
  status: 'Whether I’m on my period right now',
  next: 'When my next period might come',
  request: 'Something I need',
  note: 'A note from me',
};

export const REQUESTS = {
  supplies: 'Could we get more pads or supplies?',
  pain: 'My cramps are really bad today.',
  talk: 'Can we talk sometime?',
  firstPeriod: 'I got my first period.',
};

const toB64url = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

/** Builds exactly what the grown-up will see. Nothing else from her logs is ever included. */
export function buildUpdate({ to, name, include, request, note, analysis, today }) {
  const u = { v: 1, to, at: today };
  if (name?.trim()) u.name = name.trim().slice(0, 30);
  const { status, next } = analysis;
  if (include.status && status.phase !== 'none') {
    u.status = status.phase === 'period' ? { on: true, day: status.day } : { on: false };
  }
  if (include.next && next && status.phase !== 'period') u.next = [next.earliest, next.latest];
  if (include.request && REQUESTS[request]) u.req = request;
  if (include.note && note?.trim()) u.note = note.trim().slice(0, 280);
  return u;
}

export const encodeUpdate = (u) => toB64url(JSON.stringify(u));

export function decodeUpdate(fragment) {
  try {
    const u = JSON.parse(fromB64url(fragment.replace(/^#/, '')));
    if (u?.v !== 1 || typeof u.at !== 'string') return null;
    return u;
  } catch {
    return null;
  }
}

/** Practical, age-appropriate ways a grown-up can help, based only on what she sent. */
export function waysToHelp(u) {
  const tips = [];
  if (u.req === 'firstPeriod') tips.push('Stay calm and matter-of-fact. Your reaction teaches them this is a normal part of life. “Congratulations, let’s get you set up” goes a long way.');
  if (u.req === 'supplies' || u.req === 'firstPeriod') tips.push('Stock pads (and whatever else they use) somewhere private, so they never have to ask in the moment.');
  if (u.req === 'pain') {
    tips.push('A heating pad or hot-water bottle, a warm drink and rest can help with cramps. Ask your doctor or pharmacist which pain reliever is right for them.');
    tips.push('If cramps regularly keep them home from school or stop everyday life, book a doctor visit. Painful periods can be treated.');
  }
  if (u.req === 'talk') tips.push('They’d like to talk. Somewhere low-pressure, like a car ride or a walk, often feels easiest. Let them lead.');
  if (u.status?.on && u.status.day <= 2) tips.push('The first day or two are often the heaviest. A spare change of clothes in a school bag can be a real relief.');
  if (u.next) tips.push('Their period might come in the dates shown. A quiet “Do you have what you need for next week?” can help.');
  if (!tips.length) tips.push('Nothing needed right now. Knowing they can come to you is often the most helpful thing of all.');
  return tips;
}
