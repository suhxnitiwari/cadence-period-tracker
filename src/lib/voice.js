// "Grows up with you": the same features, worded for where she is.
// simple → an 8-to-10-year-old · standard → most people · grown → older teens and adults.
export const VOICES = [
  ['simple', 'Simple', 'Short, friendly words'],
  ['standard', 'Standard', 'Clear and straightforward'],
  ['grown', 'Grown-up', 'More detail, fewer emoji'],
];

const COPY = {
  logTitle: { simple: 'How are you feeling today?', standard: 'Log today', grown: 'Daily check-in' },
  logHint: { simple: 'Tap anything that fits. That’s it!', standard: 'Tap what fits. It saves right away.', grown: 'Saved instantly, on this device only.' },
  gotIt: { simple: '🩸 I got my period!', standard: '🩸 I got my period', grown: 'Period started' },
  gotItToday: { simple: 'Got your period today?', standard: 'Did your period start?', grown: 'Log a new period' },
  myBody: { simple: 'My body', standard: 'My body', grown: 'My body' },
};

export const say = (voice, key) => COPY[key]?.[voice] ?? COPY[key]?.standard ?? key;
