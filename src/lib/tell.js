import { addDays } from './dates.js';

export const TOPICS = [
  ['pain', 'My cramps or pain'],
  ['heavy', 'My period is really heavy'],
  ['notCome', 'My period hasn’t come'],
  ['mood', 'How I’ve been feeling'],
  ['school', 'My period is making school hard'],
  ['supplies', 'I need pads or supplies'],
  ['first', 'I got my first period'],
  ['other', 'Something else'],
];

export const PEOPLE = [
  ['mom', 'Mom'],
  ['dad', 'Dad'],
  ['guardian', 'Guardian'],
  ['adult', 'A trusted adult'],
  ['nurse', 'School nurse'],
  ['doctor', 'Doctor'],
];

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** Facts from her own logs that can back up what she's saying. */
export function evidence(analysis, today) {
  const { days, periods, status } = analysis;
  const recent = periods.slice(-3);
  const around = new Set(recent.flatMap((p) => [addDays(p.start, -1), ...p.days]));
  const inRecent = [...around].map((d) => days[d]).filter(Boolean);
  const since90 = Object.entries(days).filter(([d]) => d >= addDays(today, -90) && d <= today).map(([, l]) => l);
  return {
    periodsCount: recent.length,
    painDays: inRecent.filter((l) => ['moderate', 'severe'].includes(l.pain)).length,
    severeDays: inRecent.filter((l) => l.pain === 'severe').length,
    heavyDays: inRecent.filter((l) => l.flow === 'heavy').length,
    missedSchool: since90.filter((l) => ['lot', 'home'].includes(l.school)).length,
    lowMoodDays: since90.filter((l) => l.symptoms?.some((s) => ['Sad', 'Anxious', 'Sensitive'].includes(s))).length,
    since: status.since ?? null,
  };
}

/** A short, kind, age-appropriate message she can edit, copy or share. Never sent automatically. */
export function draftMessage({ topic, person, facts = {}, useData = true }) {
  const f = useData ? facts : {};
  const greet = { mom: 'Hi Mom,', dad: 'Hi Dad,', nurse: 'Hi,', doctor: '', guardian: 'Hi,', adult: 'Hi,' }[person] ?? 'Hi,';
  const over = f.periodsCount ? ` during my last ${plural(f.periodsCount, 'period')}` : '';
  const ask = person === 'nurse' ? 'Could I come talk to you about it?'
    : person === 'doctor' ? 'I’d like to talk about this at my appointment.'
      : 'Can we talk about it?';

  let body;
  switch (topic) {
    case 'pain':
      body = 'My cramps have been really painful';
      if (f.severeDays) body += `. I’ve logged a lot of pain on ${plural(f.severeDays, 'day')}${over}`;
      else if (f.painDays) body += `. I’ve logged medium or bad pain on ${plural(f.painDays, 'day')}${over}`;
      body += f.missedSchool ? `, and my period has really affected school on ${plural(f.missedSchool, 'day')} lately.` : ', and it’s hard to concentrate.';
      body += ` ${ask}`;
      break;
    case 'heavy':
      body = 'My periods have been really heavy';
      if (f.heavyDays) body += `. I’ve logged ${plural(f.heavyDays, 'heavy day')}${over}`;
      body += `. I’m not sure if that’s normal. ${ask}`;
      break;
    case 'notCome':
      body = f.since
        ? `It’s been ${f.since} days since my last period started and it hasn’t come yet. I’m not worried, but I’d like to check.`
        : 'My period hasn’t come in a while. I’m not worried, but I’d like to check.';
      body += ` ${ask}`;
      break;
    case 'mood':
      body = f.lowMoodDays >= 3
        ? `I’ve been feeling really down or emotional lately (I’ve logged it on ${plural(f.lowMoodDays, 'day')}), especially around my period.`
        : 'I’ve been feeling really down or emotional around my period.';
      body += ` ${person === 'doctor' ? ask : 'Can we talk?'}`;
      break;
    case 'school':
      body = 'My period has been making school hard';
      if (f.missedSchool) body += `. It’s really affected school on ${plural(f.missedSchool, 'day')} in the last few months`;
      body += `. ${ask}`;
      break;
    case 'supplies':
      body = person === 'nurse'
        ? 'Could I get a pad, please? I don’t have one with me.'
        : 'Could we get more pads (or whatever I need)? I’m running low. No big deal, just letting you know!';
      break;
    case 'first':
      body = person === 'nurse'
        ? 'I think I just got my first period. Could you help me?'
        : 'I got my first period. Can you help me get what I need?';
      break;
    default:
      body = 'There’s something about my period I’d like to talk about. Can we find a good time?';
  }
  return greet ? `${greet} ${body}` : body;
}
