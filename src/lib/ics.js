import { addDays } from './dates.js';

const compact = (iso) => iso.replaceAll('-', '');
const escape = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

// How much a calendar event reveals is her choice. Calendars are often shared.
export const CALENDAR_STYLES = {
  discreet: { emoji: '🌷', label: 'Discreet', title: 'Personal', details: '' },
  practical: { emoji: '🎒', label: 'Practical', title: 'Period window', details: 'Possible period window. It’s a range, and Cadence updates it as it learns.' },
  direct: { emoji: '🩸', label: 'Direct', title: 'Expected period', details: 'Possible period window. It’s a range, and Cadence updates it as it learns.' },
};

function stampOf(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
}

/**
 * One all-day event covering the whole likely window. The UID stays the same
 * for a given cycle, so re-adding the file after the prediction changes moves
 * the existing event instead of creating a second one.
 */
export function windowIcs({ earliest, latest, cycleKey, style = 'discreet', sequence = 0, stamp = new Date() }) {
  const s = CALENDAR_STYLES[style];
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cadence//Calendar//EN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:window-${cycleKey}@cadence`,
    `SEQUENCE:${sequence}`,
    `DTSTAMP:${stampOf(stamp)}`,
    `DTSTART;VALUE=DATE:${compact(earliest)}`,
    `DTEND;VALUE=DATE:${compact(addDays(latest, 1))}`,
    `SUMMARY:${escape(s.title)}`,
    ...(s.details ? [`DESCRIPTION:${escape(s.details)}`] : []),
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n';
}

/** An all-day reminder (e.g. "Might want your pouch tomorrow 🎒") with a 7am alert. */
export function reminderIcs(date, title, stamp = new Date()) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cadence//Reminder//EN',
    'BEGIN:VEVENT',
    `UID:reminder-${compact(date)}@cadence`,
    `DTSTAMP:${stampOf(stamp)}`,
    `DTSTART;VALUE=DATE:${compact(date)}`,
    `DTEND;VALUE=DATE:${compact(addDays(date, 1))}`,
    `SUMMARY:${escape(title)}`,
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escape(title)}`,
    'TRIGGER:PT7H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n';
}

export function googleUrl({ start, end, title, details = '' }) {
  const params = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${compact(start)}/${compact(addDays(end, 1))}`, details });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function outlookUrl({ start, end, title, details = '' }) {
  const params = new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: title, startdt: start, enddt: addDays(end, 1), allday: 'true', body: details });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}

export function reminderGoogleUrl(date, title) {
  return googleUrl({ start: date, end: date, title });
}
