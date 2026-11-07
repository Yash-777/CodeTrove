const DEFAULT_TIME_ZONES = [
  { timeZone: 'UTC', label: 'UTC', locale: 'en-GB' },
  { timeZone: 'America/New_York', label: 'New York', locale: 'en-US' },
  { timeZone: 'Europe/London', label: 'London', locale: 'en-GB' },
  { timeZone: 'Asia/Kolkata', label: 'Kolkata', locale: 'en-IN' },
  { timeZone: 'Asia/Tokyo', label: 'Tokyo', locale: 'ja-JP' },
];

const pad = (value, length = 2) => String(value).padStart(length, '0');

function utcMilliseconds(parts) {
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  date.setUTCHours(parts.hour ?? 0, parts.minute ?? 0, parts.second ?? 0, parts.millisecond ?? 0);
  return date.getTime();
}

function partsFromUtcMilliseconds(value) {
  const date = new Date(value);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
    millisecond: date.getUTCMilliseconds(),
  };
}

export function getDefaultWorldClocks() {
  return DEFAULT_TIME_ZONES.map((location) => ({ ...location }));
}

export function getSupportedTimeZones() {
  const zones = typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : ['America/Los_Angeles', 'America/New_York', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney', 'Europe/Berlin', 'Europe/London', 'Pacific/Auckland'];
  return [...new Set(['UTC', ...zones, ...DEFAULT_TIME_ZONES.map((location) => location.timeZone)])]
    .filter(isTimeZoneSupported)
    .sort((a, b) => a.localeCompare(b));
}

export function isTimeZoneSupported(timeZone) {
  try {
    new Intl.DateTimeFormat('en', { timeZone }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function getZoneLabel(timeZone) {
  if (timeZone === 'UTC') return 'UTC';
  return timeZone.split('/').at(-1).replaceAll('_', ' ');
}

export function getZonedParts(epochMs, timeZone) {
  if (!Number.isFinite(epochMs)) throw new Error('Enter a valid date or timestamp.');
  if (!isTimeZoneSupported(timeZone)) throw new Error(`Unsupported time zone: ${timeZone}. Choose an IANA time zone from the list.`);
  const parts = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(epochMs));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    year: Number(values.year), month: Number(values.month), day: Number(values.day),
    hour: Number(values.hour), minute: Number(values.minute), second: Number(values.second),
    millisecond: new Date(epochMs).getUTCMilliseconds(),
  };
}

export function getOffsetMinutes(epochMs, timeZone) {
  const parts = getZonedParts(epochMs, timeZone);
  const represented = utcMilliseconds({ ...parts, millisecond: 0 });
  return Math.round((represented - Math.floor(epochMs / 1000) * 1000) / 60000);
}

export function getOffsetLabel(epochMs, timeZone) {
  const name = new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(new Date(epochMs)).find((part) => part.type === 'timeZoneName')?.value || 'GMT';
  return name.replace(/^GMT/, 'UTC');
}

export function isDaylightSavingTime(epochMs, timeZone) {
  const parts = getZonedParts(epochMs, timeZone);
  const jan = getOffsetMinutes(utcMilliseconds({ year: parts.year, month: 1, day: 15 }), timeZone);
  const jul = getOffsetMinutes(utcMilliseconds({ year: parts.year, month: 7, day: 15 }), timeZone);
  if (jan === jul) return false;
  return getOffsetMinutes(epochMs, timeZone) === Math.max(jan, jul);
}

export function formatClock(epochMs, timeZone, mode = '24', locale = 'en-US') {
  const hourOptions = mode === '12'
    ? { hour: 'numeric', hourCycle: 'h12' }
    : mode === '24'
      ? { hour: '2-digit', hourCycle: 'h23' }
      : { hour: 'numeric' };
  const time = new Intl.DateTimeFormat(locale, {
    timeZone, ...hourOptions, minute: '2-digit', second: '2-digit', timeZoneName: 'short',
  }).format(new Date(epochMs));
  const date = new Intl.DateTimeFormat(locale, {
    timeZone, weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(epochMs));
  return { time, date, offset: getOffsetLabel(epochMs, timeZone), isDst: isDaylightSavingTime(epochMs, timeZone) };
}

export function toZonedInput(epochMs, timeZone) {
  const p = getZonedParts(epochMs, timeZone);
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

export function parseLocalDateTime(value) {
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/);
  if (!match) throw new Error('Enter a complete local date and time.');
  const parts = {
    year: Number(match[1]), month: Number(match[2]), day: Number(match[3]),
    hour: Number(match[4]), minute: Number(match[5]), second: Number(match[6] || 0),
    millisecond: Number((match[7] || '').padEnd(3, '0') || 0),
  };
  const check = new Date(utcMilliseconds(parts));
  const valid = check.getUTCFullYear() === parts.year
    && check.getUTCMonth() + 1 === parts.month && check.getUTCDate() === parts.day
    && parts.hour <= 23 && parts.minute <= 59 && parts.second <= 59;
  if (!valid) throw new Error('That date or time is not valid. Check the month, day, and 24-hour time.');
  return parts;
}

function sameWallTime(a, b) {
  return a.year === b.year && a.month === b.month && a.day === b.day
    && a.hour === b.hour && a.minute === b.minute && a.second === b.second;
}

export function resolveLocalDateTime(value, timeZone, disambiguation = 'earlier') {
  const parts = parseLocalDateTime(value);
  if (!isTimeZoneSupported(timeZone)) throw new Error(`Unsupported time zone: ${timeZone}.`);
  const wallMs = utcMilliseconds(parts);
  const offsets = new Set();
  for (const hours of [-48, -36, -24, -12, -6, 0, 6, 12, 24, 36, 48]) {
    offsets.add(getOffsetMinutes(wallMs + hours * 3600000, timeZone));
  }
  const candidates = [...offsets]
    .map((offset) => wallMs - offset * 60000)
    .filter((instant) => sameWallTime(getZonedParts(instant, timeZone), parts))
    .sort((a, b) => a - b);
  const unique = [...new Set(candidates)];
  if (unique.length === 0) return { status: 'nonexistent', candidates: [], parts };
  if (unique.length === 1) return { status: 'valid', candidates: unique, epochMs: unique[0], parts };
  const selectedIndex = disambiguation === 'later' ? unique.length - 1 : 0;
  return {
    status: 'ambiguous', candidates: unique,
    epochMs: unique[selectedIndex], selected: disambiguation === 'later' ? 'later' : 'earlier', parts,
  };
}

export function parseTimestamp(value) {
  const raw = String(value).trim();
  if (!raw) throw new Error('Enter a timestamp or ISO date-time.');
  if (/^[+-]?\d+(?:\.\d+)?$/.test(raw)) {
    const digits = raw.replace(/^[+-]/, '').split('.')[0].length;
    const unit = digits <= 10 ? 'seconds' : 'milliseconds';
    const epochMs = Number(raw) * (unit === 'seconds' ? 1000 : 1);
    if (!Number.isFinite(epochMs) || Number.isNaN(new Date(epochMs).getTime())) throw new Error('Timestamp is outside the supported date range.');
    return { epochMs, label: unit };
  }
  if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)) {
    throw new Error('ISO timestamps must include a time-zone designator, such as Z or +05:30.');
  }
  const epochMs = Date.parse(raw);
  if (!Number.isFinite(epochMs)) throw new Error('Enter a valid ISO date-time with an explicit time-zone offset.');
  return { epochMs, label: 'ISO timestamp' };
}

export function formatDateTime(epochMs, timeZone, mode = '24', locale = 'en-US') {
  const options = {
    timeZone, year: 'numeric', month: 'short', day: '2-digit',
    hour: mode === '12' ? 'numeric' : '2-digit', minute: '2-digit', second: '2-digit',
    timeZoneName: 'short',
    ...(mode === '12' ? { hourCycle: 'h12' } : { hourCycle: 'h23' }),
  };
  return new Intl.DateTimeFormat(locale, options).format(new Date(epochMs));
}

function daysInMonth(year, month) {
  const date = new Date(0);
  date.setUTCFullYear(year, month, 0);
  return date.getUTCDate();
}

function localInputFromParts(parts) {
  return `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;
}

export function addZonedDateTime(epochMs, timeZone, amount, unit, operation = 'add', disambiguation = 'earlier') {
  if (String(amount).trim() === '') throw new Error('Enter an amount to add or remove.');
  const value = Number(amount) * (operation === 'subtract' ? -1 : 1);
  if (!Number.isFinite(value) || Math.abs(value) > 1000000) throw new Error('Enter a finite amount between -1,000,000 and 1,000,000.');
  const baseParts = getZonedParts(epochMs, timeZone);
  const calendarUnits = ['years', 'months', 'weeks', 'days'];
  if (calendarUnits.includes(unit)) {
    if (!Number.isInteger(value)) throw new Error('Years, months, weeks, and days must use whole numbers.');
    let target;
    if (unit === 'years' || unit === 'months') {
      const monthIndex = baseParts.year * 12 + (baseParts.month - 1) + value * (unit === 'years' ? 12 : 1);
      const year = Math.floor(monthIndex / 12);
      const month = ((monthIndex % 12) + 12) % 12 + 1;
      target = { ...baseParts, year, month, day: Math.min(baseParts.day, daysInMonth(year, month)) };
    } else {
      const date = new Date(utcMilliseconds(baseParts));
      date.setUTCDate(date.getUTCDate() + value * (unit === 'weeks' ? 7 : 1));
      target = { ...baseParts, ...partsFromUtcMilliseconds(date.getTime()) };
    }
    const result = resolveLocalDateTime(localInputFromParts(target), timeZone, disambiguation);
    if (result.status === 'nonexistent') throw new Error('The adjusted local time falls inside a daylight-saving gap and does not exist. Choose a different time or smaller adjustment.');
    return { epochMs: result.epochMs, kind: 'calendar', dstResolution: result.status, selected: result.selected };
  }
  const multipliers = { hours: 3600000, minutes: 60000, seconds: 1000, milliseconds: 1 };
  if (!multipliers[unit]) throw new Error('Choose years, months, weeks, days, hours, minutes, seconds, or milliseconds.');
  const result = epochMs + value * multipliers[unit];
  if (!Number.isFinite(result) || Number.isNaN(new Date(result).getTime())) throw new Error('Result is outside the supported date range.');
  return { epochMs: result, kind: 'elapsed' };
}

export function formatDuration(milliseconds) {
  let remaining = Math.abs(Math.trunc(milliseconds));
  const parts = [];
  const units = [
    ['days', 86400000], ['hours', 3600000], ['minutes', 60000], ['seconds', 1000], ['milliseconds', 1],
  ];
  for (const [label, unitMs] of units) {
    const count = Math.floor(remaining / unitMs);
    remaining %= unitMs;
    if (count || (label === 'milliseconds' && parts.length === 0)) {
      const singular = label.endsWith('s') ? label.slice(0, -1) : label;
      parts.push(`${count} ${count === 1 ? singular : label}`);
    }
  }
  return `${milliseconds < 0 ? '−' : ''}${parts.join(', ')}`;
}
