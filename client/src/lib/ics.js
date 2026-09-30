import { addDays } from './dates.js';

const compact = (iso) => iso.replaceAll('-', '');
const escape = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

export const DISCREET_TITLE = 'Reminder';

/** An .ics calendar of predicted periods (and, if enabled, fertile windows). */
export function buildIcs(predictions, { title = 'Period likely', includeFertile = false, stamp = new Date() } = {}) {
  const dtstamp = stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cadence//Cycle predictions//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Cadence',
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
  ];
  const event = (uid, start, endInclusive, summary, description) => lines.push(
    'BEGIN:VEVENT',
    `UID:${uid}@cadence`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${compact(start)}`,
    `DTEND;VALUE=DATE:${compact(addDays(endInclusive, 1))}`,
    `SUMMARY:${escape(summary)}`,
    `DESCRIPTION:${escape(description)}`,
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  );

  predictions.forEach((p, i) => {
    event(`period-${i}`, p.earliest, p.latest, title, 'Estimated range from Cadence. Dates update as you log.');
    if (includeFertile) {
      event(`fertile-${i}`, p.fertile.start, p.fertile.end, `${title} (fertile window est.)`, 'Estimate only. Not a form of birth control.');
    }
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

/** A one-click "Add to Google Calendar" link for a single predicted range. */
export function googleCalendarUrl(prediction, title = 'Period likely') {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${compact(prediction.earliest)}/${compact(addDays(prediction.latest, 1))}`,
    details: 'Estimated range from Cadence.',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
