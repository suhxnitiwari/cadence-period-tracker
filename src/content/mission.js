// Public-facing mission copy for Home, About and the parent letter.
// NOTE: this is the one file the product-guardrail test skips, because saying
// what Cadence will never build means naming those things. No feature may import
// from here except the public pages.

export const PROMISE = 'Designed for your first period. Built for every period after.';

export const PRINCIPLES = [
  ['Periods aren’t a luxury.', 'Period tracking stays free. Not five free logs, not a trial, not “free to download.” Everything you need to understand your own period is free, forever.'],
  ['You don’t need to know your cycle.', 'Understanding it is our job. Cadence never asks for your cycle length. It learns from what you log and tells you in plain words.'],
  ['Your period fits into your life.', 'School at 11, college at 20, work, travel and sports after that. Cadence connects your period to your actual plans.'],
];

export const PILLARS = [
  ['Notice', 'One tap to log your period, flow, pain, feelings and how it affected your day.'],
  ['Understand', 'Honest ranges instead of fake dates, your own patterns, and a heads-up when something changes.'],
  ['Prepare', 'School Mode, a period pouch, discreet reminders, and help for real moments like bleeding through your clothes.'],
  ['Speak up', 'Help finding the words to tell a parent, nurse or doctor, and a report you can show them.'],
];

export const NEVER = [
  'Fertility windows or ovulation countdowns',
  'Pregnancy or trying-to-conceive modes',
  'Sex, intimacy or contraception tracking',
  'Community feeds, chat with strangers or public profiles',
  'Ads, data selling or behavioral tracking',
  'Paywalled period logs, history or basic education',
  '“Your period is late!” panic',
  'A parent dashboard that watches you',
];

export const WHY_OTHERS = 'Most period apps were built around adult reproductive health, with fertility windows, pregnancy modes and sex tracking front and center. But most people start their periods years before any of that is relevant. They just want to know: ';

export const LETTER_ISNT = 'It isn’t a fertility, pregnancy or dating app, and it never will be. There are no ads, no strangers, no chat, and no content that isn’t right for a child.';
