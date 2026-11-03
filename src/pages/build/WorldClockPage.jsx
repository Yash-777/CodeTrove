import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, CalendarDays, Check, Clock3, Copy, Globe2, Plus, RefreshCw, X } from 'lucide-react';
import { copyToClipboard } from '../../utils/textActions.js';
import {
  addZonedDateTime,
  formatClock,
  formatDateTime,
  formatDuration,
  getDefaultWorldClocks,
  getOffsetLabel,
  getSupportedTimeZones,
  getZoneLabel,
  isDaylightSavingTime,
  parseTimestamp,
  resolveLocalDateTime,
  toZonedInput,
} from '../../utils/worldClock.js';
import '../../components/CodeRunner/RunnableCode.css';
import './WorldClockPage.css';

const SAMPLE_CONVERTER_TIME = '2026-11-03T12:00:00';
const SAMPLE_DIFFERENCE_A = '2026-03-08T01:30:00';
const SAMPLE_DIFFERENCE_B = '2026-03-08T03:30:00';
const SAMPLE_ADD_TIME = '2026-03-07T12:00:00';

const COMMON_ZONES = [
  'UTC', 'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Africa/Johannesburg',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland',
];
const ZONE_LOCALE = {
  UTC: 'en-GB',
  'America/Los_Angeles': 'en-US', 'America/Denver': 'en-US', 'America/Chicago': 'en-US', 'America/New_York': 'en-US',
  'America/Sao_Paulo': 'pt-BR', 'Europe/London': 'en-GB', 'Europe/Paris': 'fr-FR', 'Europe/Berlin': 'de-DE',
  'Africa/Johannesburg': 'en-ZA', 'Asia/Dubai': 'en-AE', 'Asia/Kolkata': 'en-IN',
  'Asia/Singapore': 'en-SG', 'Asia/Tokyo': 'ja-JP', 'Australia/Sydney': 'en-AU', 'Pacific/Auckland': 'en-NZ',
};
const TIME_UNITS = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'];

function zoneLocale(timeZone) {
  return ZONE_LOCALE[timeZone] || 'en-US';
}

function zoneOptionLabel(timeZone) {
  return `${getZoneLabel(timeZone)} · ${timeZone}`;
}

function TimeZoneOptions({ zones }) {
  const common = COMMON_ZONES.filter((timeZone) => zones.includes(timeZone));
  const other = zones.filter((timeZone) => !COMMON_ZONES.includes(timeZone));
  return <>
    <optgroup label="Popular time zones">{common.map((timeZone) => <option value={timeZone} key={timeZone}>{zoneOptionLabel(timeZone)}</option>)}</optgroup>
    <optgroup label="All other IANA time zones">{other.map((timeZone) => <option value={timeZone} key={timeZone}>{zoneOptionLabel(timeZone)}</option>)}</optgroup>
  </>;
}

function CopyButton({ value, label = 'Copy result' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (await copyToClipboard(value)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  };
  return (
    <button
      type="button"
      className={`runnable-code__icon-button wc-copy${copied ? ' is-copied' : ''}`}
      onClick={handleCopy}
      title={copied ? 'Copied to clipboard' : label}
      aria-label={copied ? 'Copied to clipboard' : label}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}

function TimeZoneSelect({ id, label, value, onChange, zones, compact = false }) {
  return (
    <label className={`wc-field${compact ? ' wc-field--compact' : ''}`} htmlFor={id}>
      <span>{label}</span>
      <select id={id} className="wc-select" value={value} onChange={(event) => onChange(event.target.value)}>
        <TimeZoneOptions zones={zones} />
      </select>
    </label>
  );
}

function Status({ status }) {
  if (!status?.message) return null;
  return <div className={`wc-status wc-status--${status.type}`} role="status">{status.message}</div>;
}

function resolveInput(value, timeZone, disambiguation) {
  const resolved = resolveLocalDateTime(value, timeZone, disambiguation);
  if (resolved.status === 'nonexistent') {
    throw new Error(`That local time does not exist in ${timeZone} because the clock moves forward for daylight saving time. Choose another time.`);
  }
  return resolved;
}

function ambiguityText(result, timeZone) {
  return result.status === 'ambiguous'
    ? `This local time occurs twice in ${timeZone}; the ${result.selected} occurrence was used.`
    : '';
}

function WorldClockPanel({ now, zones, mode, setMode, locations, setLocations, zoneToAdd, setZoneToAdd }) {
  const addLocation = () => {
    if (locations.some((item) => item.timeZone === zoneToAdd)) return;
    setLocations([...locations, {
      timeZone: zoneToAdd,
      label: getZoneLabel(zoneToAdd),
      locale: zoneLocale(zoneToAdd),
    }]);
  };
  const removeLocation = (timeZone) => setLocations(locations.filter((item) => item.timeZone !== timeZone));

  return (
    <details className="wc-world-clock" open>
      <summary className="wc-world-summary">
        <span className="wc-summary-title"><Globe2 size={18} /> World Clock</span>
        <span className="wc-clock-modes" onClick={(event) => event.stopPropagation()}>
          <button type="button" className={mode === '12' ? 'selected' : ''} onClick={() => setMode('12')} title="Switch to 12-hour clock" aria-label="Switch to 12-hour clock">AM/PM</button>
          <button type="button" className={mode === '24' ? 'selected' : ''} onClick={() => setMode('24')} title="Switch to 24-hour clock" aria-label="Switch to 24-hour clock">24</button>
          <button type="button" className={mode === 'mixed' ? 'selected' : ''} onClick={() => setMode('mixed')} title="Switch to mixed mode (show each location in its native format)" aria-label="Switch to mixed mode (show each location in its native format)">MX</button>
        </span>
      </summary>
      <div className="wc-world-content">
        <p className="wc-section-copy">Compare live local times at a glance. Choose 12-hour, 24-hour, or mixed locale formatting for each location.</p>
        <div className="wc-clock-grid">
          {locations.map((location) => {
            const displayMode = mode === 'mixed' ? 'mixed' : mode;
            const display = formatClock(now, location.timeZone, displayMode, location.locale);
            return (
              <article className="wc-clock-card" key={location.timeZone}>
                <div className="wc-clock-card__top">
                  <div><h3>{location.label}</h3><span>{location.timeZone}</span></div>
                  {locations.length > 1 && <button type="button" className="wc-remove" onClick={() => removeLocation(location.timeZone)} title={`Remove ${location.label}`} aria-label={`Remove ${location.label}`}><X size={16} /></button>}
                </div>
                <strong className="wc-clock-time">{display.time}</strong>
                <div className="wc-clock-date">{display.date}</div>
                <div className="wc-clock-meta"><span>{display.offset}</span><span className={display.isDst ? 'wc-dst wc-dst--active' : ''}>{display.isDst ? 'DST active' : 'Standard offset'}</span></div>
              </article>
            );
          })}
        </div>
        <div className="wc-add-location">
          <label htmlFor="wc-add-zone">Add a time zone</label>
          <select id="wc-add-zone" className="wc-select" value={zoneToAdd} onChange={(event) => setZoneToAdd(event.target.value)}>
            <TimeZoneOptions zones={zones} />
          </select>
          <button type="button" className="wc-button wc-button--secondary" onClick={addLocation} disabled={locations.some((item) => item.timeZone === zoneToAdd)}><Plus size={16} /> Add location</button>
        </div>
      </div>
    </details>
  );
}

export default function WorldClockPage() {
  const zones = useMemo(() => getSupportedTimeZones(), []);
  const [now, setNow] = useState(() => Date.now());
  const [clockMode, setClockMode] = useState('12');
  const [locations, setLocations] = useState(() => getDefaultWorldClocks());
  const [zoneToAdd, setZoneToAdd] = useState('Australia/Sydney');
  const [tab, setTab] = useState('converter');
  const [converterZone, setConverterZone] = useState('UTC');
  const [converterTarget, setConverterTarget] = useState('Asia/Kolkata');
  const [converterInput, setConverterInput] = useState(SAMPLE_CONVERTER_TIME);
  const [converterAmbiguity, setConverterAmbiguity] = useState('earlier');
  const [converterResult, setConverterResult] = useState(null);
  const [converterStatus, setConverterStatus] = useState(null);
  const [diffMode, setDiffMode] = useState('local');
  const [dateA, setDateA] = useState(SAMPLE_DIFFERENCE_A);
  const [dateB, setDateB] = useState(SAMPLE_DIFFERENCE_B);
  const [zoneA, setZoneA] = useState('America/New_York');
  const [zoneB, setZoneB] = useState('America/New_York');
  const [stampA, setStampA] = useState('2026-03-08T01:30:00-05:00');
  const [stampB, setStampB] = useState('2026-03-08T03:30:00-04:00');
  const [diffAmbiguity, setDiffAmbiguity] = useState('earlier');
  const [differenceResult, setDifferenceResult] = useState(null);
  const [differenceStatus, setDifferenceStatus] = useState(null);
  const [adjustInput, setAdjustInput] = useState(SAMPLE_ADD_TIME);
  const [adjustZone, setAdjustZone] = useState('America/New_York');
  const [adjustAmount, setAdjustAmount] = useState('1');
  const [adjustUnit, setAdjustUnit] = useState('days');
  const [adjustOperation, setAdjustOperation] = useState('add');
  const [adjustAmbiguity, setAdjustAmbiguity] = useState('earlier');
  const [adjustResult, setAdjustResult] = useState(null);
  const [adjustStatus, setAdjustStatus] = useState(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const useConverterSample = () => {
    setConverterZone('UTC'); setConverterTarget('Asia/Kolkata'); setConverterInput(SAMPLE_CONVERTER_TIME);
    setConverterAmbiguity('earlier'); setConverterResult(null); setConverterStatus({ type: 'idle', message: 'Sample loaded: 12:00 UTC converts to 17:30 in India Standard Time.' });
  };

  const convertTime = () => {
    try {
      const resolved = resolveInput(converterInput, converterZone, converterAmbiguity);
      const result = {
        epochMs: resolved.epochMs,
        source: formatDateTime(resolved.epochMs, converterZone, '24', zoneLocale(converterZone)),
        target: formatDateTime(resolved.epochMs, converterTarget, '24', zoneLocale(converterTarget)),
        sourceOffset: getOffsetLabel(resolved.epochMs, converterZone),
        targetOffset: getOffsetLabel(resolved.epochMs, converterTarget),
        dst: isDaylightSavingTime(resolved.epochMs, converterTarget),
      };
      setConverterResult(result);
      setConverterStatus({ type: resolved.status === 'ambiguous' ? 'warning' : 'ok', message: ambiguityText(resolved, converterZone) || 'Converted using current IANA time-zone rules, including daylight-saving changes.' });
    } catch (error) { setConverterResult(null); setConverterStatus({ type: 'error', message: error.message }); }
  };

  const useCurrentConverterTime = () => {
    setConverterInput(toZonedInput(Date.now(), converterZone));
    setConverterResult(null); setConverterStatus({ type: 'idle', message: 'Input set to the current time in the selected source zone.' });
  };

  const swapConverterZones = () => {
    let nextInput = converterInput;
    try {
      const current = resolveInput(converterInput, converterZone, converterAmbiguity);
      nextInput = toZonedInput(current.epochMs, converterTarget);
    } catch {
      // Keep the typed wall time if it is incomplete; the user can correct it after swapping.
    }
    setConverterZone(converterTarget); setConverterTarget(converterZone); setConverterInput(nextInput);
    setConverterResult(null); setConverterStatus(null);
  };

  const loadDifferenceSample = () => {
    setDiffMode('local'); setDateA(SAMPLE_DIFFERENCE_A); setDateB(SAMPLE_DIFFERENCE_B);
    setZoneA('America/New_York'); setZoneB('America/New_York'); setDiffAmbiguity('earlier');
    setDifferenceResult(null); setDifferenceStatus({ type: 'idle', message: 'Sample loaded: the New York clock jumps from 01:30 to 03:30; only one real hour passes.' });
  };

  const calculateDifference = () => {
    try {
      let a; let b; let aLabel; let bLabel;
      if (diffMode === 'local') {
        const resultA = resolveInput(dateA, zoneA, diffAmbiguity);
        const resultB = resolveInput(dateB, zoneB, diffAmbiguity);
        a = resultA.epochMs; b = resultB.epochMs;
        aLabel = formatDateTime(a, zoneA, '24', zoneLocale(zoneA));
        bLabel = formatDateTime(b, zoneB, '24', zoneLocale(zoneB));
        const warning = ambiguityText(resultA, zoneA) || ambiguityText(resultB, zoneB);
        setDifferenceStatus({ type: warning ? 'warning' : 'ok', message: warning || 'Both local date-times were resolved with their selected IANA zones and DST rules.' });
      } else {
        const parsedA = parseTimestamp(stampA); const parsedB = parseTimestamp(stampB);
        a = parsedA.epochMs; b = parsedB.epochMs; aLabel = `${stampA} (${parsedA.label})`; bLabel = `${stampB} (${parsedB.label})`;
        setDifferenceStatus({ type: 'ok', message: 'Timestamps represent absolute instants; ISO values must include Z or a numeric UTC offset.' });
      }
      const delta = b - a;
      setDifferenceResult({ delta, duration: formatDuration(delta), direction: delta === 0 ? 'The two moments are the same.' : `Date B is ${delta > 0 ? 'after' : 'before'} Date A.`, aLabel, bLabel });
    } catch (error) { setDifferenceResult(null); setDifferenceStatus({ type: 'error', message: error.message }); }
  };

  const loadAdjustSample = () => {
    setAdjustInput(SAMPLE_ADD_TIME); setAdjustZone('America/New_York'); setAdjustAmount('1'); setAdjustUnit('days'); setAdjustOperation('add'); setAdjustAmbiguity('earlier');
    setAdjustResult(null); setAdjustStatus({ type: 'idle', message: 'Sample loaded: add one calendar day across New York’s spring DST change.' });
  };

  const calculateAdjustment = () => {
    try {
      const resolved = resolveInput(adjustInput, adjustZone, adjustAmbiguity);
      const result = addZonedDateTime(resolved.epochMs, adjustZone, adjustAmount, adjustUnit, adjustOperation, adjustAmbiguity);
      const totalElapsed = result.epochMs - resolved.epochMs;
      const adjusted = {
        epochMs: result.epochMs,
        formatted: formatDateTime(result.epochMs, adjustZone, '24', zoneLocale(adjustZone)),
        offset: getOffsetLabel(result.epochMs, adjustZone),
        elapsed: formatDuration(totalElapsed),
        dst: isDaylightSavingTime(result.epochMs, adjustZone),
      };
      setAdjustResult(adjusted);
      let message = result.kind === 'calendar'
        ? 'Calendar arithmetic preserves the local clock time; the elapsed duration may change at a DST boundary.'
        : 'Elapsed-time arithmetic adds exact hours, minutes, seconds, or milliseconds.';
      if (result.dstResolution === 'ambiguous') message += ` The adjusted time occurs twice; the ${result.selected} occurrence was used.`;
      if (resolved.status === 'ambiguous') message += ` The input time occurs twice; the ${resolved.selected} occurrence was used.`;
      setAdjustStatus({ type: result.dstResolution === 'ambiguous' || resolved.status === 'ambiguous' ? 'warning' : 'ok', message });
    } catch (error) { setAdjustResult(null); setAdjustStatus({ type: 'error', message: error.message }); }
  };

  const resetInputs = () => {
    if (tab === 'converter') { setConverterInput(toZonedInput(Date.now(), converterZone)); setConverterResult(null); setConverterStatus(null); }
    if (tab === 'difference') { setDateA(toZonedInput(Date.now(), zoneA)); setDateB(toZonedInput(Date.now(), zoneB)); setStampA(String(Math.floor(Date.now() / 1000))); setStampB(String(Math.floor(Date.now() / 1000))); setDifferenceResult(null); setDifferenceStatus(null); }
    if (tab === 'adjust') { setAdjustInput(toZonedInput(Date.now(), adjustZone)); setAdjustResult(null); setAdjustStatus(null); }
  };

  const sharedZones = useMemo(() => {
    const values = new Set([...COMMON_ZONES, ...zones]);
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [zones]);

  return (
    <main className="content-page wc-page">
      <header className="wc-hero">
        <div className="wc-eyebrow"><Clock3 size={16} /> DATA &amp; TIME TOOL</div>
        <h1>World Clock &amp; Time Zone Converter</h1>
        <p>Compare cities, convert local times, measure the time between two moments, and add or subtract time. Calculations run in your browser using IANA time-zone rules, including daylight-saving transitions.</p>
        <div className="wc-hero-stamp"><span className="wc-live-dot" /> Live clock <strong>{new Intl.DateTimeFormat('en', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(now))} UTC</strong></div>
      </header>

      <WorldClockPanel now={now} zones={sharedZones} mode={clockMode} setMode={setClockMode} locations={locations} setLocations={setLocations} zoneToAdd={zoneToAdd} setZoneToAdd={setZoneToAdd} />

      <section className="wc-workspace">
        <div className="wc-tabs" role="tablist" aria-label="World clock and date-time tools">
          <button type="button" role="tab" aria-selected={tab === 'converter'} className={tab === 'converter' ? 'active' : ''} onClick={() => setTab('converter')}><ArrowLeftRight size={16} /> Converter</button>
          <button type="button" role="tab" aria-selected={tab === 'difference'} className={tab === 'difference' ? 'active' : ''} onClick={() => setTab('difference')}><Clock3 size={16} /> Time Difference</button>
          <button type="button" role="tab" aria-selected={tab === 'adjust'} className={tab === 'adjust' ? 'active' : ''} onClick={() => setTab('adjust')}><CalendarDays size={16} /> Add / Remove</button>
        </div>

        {tab === 'converter' && <section className="wc-tab-panel" role="tabpanel">
          <div className="wc-panel-intro"><div><h2>Convert between time zones</h2><p>Convert a wall-clock date and time between UTC, IST, and any supported IANA time zone. The target date can change when the conversion crosses midnight.</p></div><div className="wc-panel-actions"><button type="button" className="wc-button wc-button--text" onClick={useConverterSample}>Load UTC → IST sample</button><button type="button" className="wc-button wc-button--text" onClick={useCurrentConverterTime}>Use now</button><button type="button" className="wc-button wc-button--text" onClick={resetInputs}><RefreshCw size={15} /> Reset</button></div></div>
          <div className="wc-converter-grid">
            <div className="wc-card">
              <div className="wc-card-heading"><span className="wc-step">01</span><h3>Source date &amp; time</h3></div>
              <TimeZoneSelect id="wc-converter-zone" label="From time zone" value={converterZone} onChange={(value) => { setConverterZone(value); setConverterResult(null); }} zones={sharedZones} />
              <label className="wc-field" htmlFor="wc-converter-input"><span>Local date and time in {getZoneLabel(converterZone)}</span><input id="wc-converter-input" className="wc-input" type="datetime-local" step="1" value={converterInput} onChange={(event) => { setConverterInput(event.target.value); setConverterResult(null); }} /></label>
              <p className="wc-help">This field is interpreted in the selected source zone, not your device zone. Spring-forward gaps are rejected; repeated fall-back times use the occurrence selected below.</p>
            </div>
            <div className="wc-converter-middle"><button type="button" className="wc-swap" onClick={swapConverterZones} title="Swap source and target time zones" aria-label="Swap source and target time zones"><ArrowLeftRight size={18} /></button></div>
            <div className="wc-card">
              <div className="wc-card-heading"><span className="wc-step">02</span><h3>Target time</h3></div>
              <TimeZoneSelect id="wc-converter-target" label="Convert to time zone" value={converterTarget} onChange={(value) => { setConverterTarget(value); setConverterResult(null); }} zones={sharedZones} />
              <label className="wc-field" htmlFor="wc-converter-disambiguation"><span>If the local time repeats during DST</span><select id="wc-converter-disambiguation" className="wc-select" value={converterAmbiguity} onChange={(event) => setConverterAmbiguity(event.target.value)}><option value="earlier">Use earlier occurrence</option><option value="later">Use later occurrence</option></select></label>
              <p className="wc-help">UTC offsets can change by date. The converter calculates the destination offset for the selected date.</p>
            </div>
          </div>
          <div className="wc-action-row"><button type="button" className="wc-button wc-button--primary" onClick={convertTime}><ArrowLeftRight size={16} /> Convert time</button></div>
          <Status status={converterStatus} />
          {converterResult && <div className="wc-result-grid">
            <article className="wc-result-card"><div><span className="wc-result-label">SOURCE · {getZoneLabel(converterZone)} · {converterResult.sourceOffset}</span><strong>{converterResult.source}</strong></div><CopyButton value={converterResult.source} label="Copy source time" /></article>
            <article className="wc-result-card wc-result-card--accent"><div><span className="wc-result-label">TARGET · {getZoneLabel(converterTarget)} · {converterResult.targetOffset}{converterResult.dst ? ' · DST ACTIVE' : ''}</span><strong>{converterResult.target}</strong></div><CopyButton value={converterResult.target} label="Copy converted time" /></article>
          </div>}
          <div className="wc-example"><strong>Example</strong><span>2026-11-03 12:00 UTC → 2026-11-03 17:30 Asia/Kolkata (IST, UTC+05:30).</span></div>
        </section>}

        {tab === 'difference' && <section className="wc-tab-panel" role="tabpanel">
          <div className="wc-panel-intro"><div><h2>Time difference between two moments</h2><p>Compare zoned local date-times or timestamps. This is useful for meeting planning, elapsed-time checks, log analysis, and travel schedules.</p></div><div className="wc-panel-actions"><button type="button" className="wc-button wc-button--text" onClick={loadDifferenceSample}>Load DST sample</button><button type="button" className="wc-button wc-button--text" onClick={resetInputs}><RefreshCw size={15} /> Reset</button></div></div>
          <div className="wc-segmented" role="group" aria-label="Time difference input format"><button type="button" className={diffMode === 'local' ? 'selected' : ''} onClick={() => setDiffMode('local')}>Local date &amp; time</button><button type="button" className={diffMode === 'timestamp' ? 'selected' : ''} onClick={() => setDiffMode('timestamp')}>Unix / ISO timestamp</button></div>
          <div className="wc-converter-grid wc-converter-grid--difference">
            {[{ id: 'a', label: 'Date A', input: diffMode === 'local' ? dateA : stampA, setInput: diffMode === 'local' ? setDateA : setStampA, zone: zoneA, setZone: setZoneA }, { id: 'b', label: 'Date B', input: diffMode === 'local' ? dateB : stampB, setInput: diffMode === 'local' ? setDateB : setStampB, zone: zoneB, setZone: setZoneB }].map((item) => <div className="wc-card" key={item.id}>
              <div className="wc-card-heading"><span className="wc-step">{item.id.toUpperCase()}</span><h3>{item.label}</h3></div>
              {diffMode === 'local' ? <><TimeZoneSelect id={`wc-diff-zone-${item.id}`} label={`${item.label} time zone`} value={item.zone} onChange={item.setZone} zones={sharedZones} /><label className="wc-field" htmlFor={`wc-diff-date-${item.id}`}><span>{item.label} local date and time</span><input id={`wc-diff-date-${item.id}`} className="wc-input" type="datetime-local" step="1" value={item.input} onChange={(event) => item.setInput(event.target.value)} /></label></> : <label className="wc-field" htmlFor={`wc-diff-stamp-${item.id}`}><span>{item.label} timestamp</span><input id={`wc-diff-stamp-${item.id}`} className="wc-input wc-input--mono" value={item.input} onChange={(event) => item.setInput(event.target.value)} placeholder="Seconds, milliseconds, or ISO 8601" /><small>Numeric values: up to 10 digits are seconds; longer values are milliseconds. ISO must include Z or ±HH:MM.</small></label>}
            </div>)}
          </div>
          {diffMode === 'local' && <label className="wc-field wc-disambiguation" htmlFor="wc-diff-ambiguity"><span>If a local time repeats during DST</span><select id="wc-diff-ambiguity" className="wc-select" value={diffAmbiguity} onChange={(event) => setDiffAmbiguity(event.target.value)}><option value="earlier">Use earlier occurrence</option><option value="later">Use later occurrence</option></select></label>}
          <div className="wc-action-row"><button type="button" className="wc-button wc-button--primary" onClick={calculateDifference}><Clock3 size={16} /> Calculate difference</button></div>
          <Status status={differenceStatus} />
          {differenceResult && <div className="wc-difference-result"><div><span className="wc-result-label">ELAPSED TIME · EXACT INSTANT DIFFERENCE</span><strong>{differenceResult.duration}</strong><p>{differenceResult.direction}</p></div><CopyButton value={differenceResult.duration} label="Copy time difference" /><div className="wc-diff-points"><span><b>Date A</b> {differenceResult.aLabel}</span><span><b>Date B</b> {differenceResult.bLabel}</span></div></div>}
          <div className="wc-example"><strong>DST example</strong><span>New York, 2026-03-08 01:30 → 03:30 is one elapsed hour because the local clock skips from 01:59 to 03:00.</span></div>
        </section>}

        {tab === 'adjust' && <section className="wc-tab-panel" role="tabpanel">
          <div className="wc-panel-intro"><div><h2>Add or remove time</h2><p>Adjust a zoned date-time by calendar units or elapsed-time units. Calendar days preserve the local clock time; hours and smaller units add exact elapsed time.</p></div><div className="wc-panel-actions"><button type="button" className="wc-button wc-button--text" onClick={loadAdjustSample}>Load DST sample</button><button type="button" className="wc-button wc-button--text" onClick={resetInputs}><RefreshCw size={15} /> Reset</button></div></div>
          <div className="wc-card wc-adjust-card">
            <div className="wc-card-heading"><span className="wc-step">01</span><h3>Starting date &amp; time</h3></div>
            <div className="wc-adjust-grid">
              <label className="wc-field" htmlFor="wc-adjust-input"><span>Local date and time</span><input id="wc-adjust-input" className="wc-input" type="datetime-local" step="1" value={adjustInput} onChange={(event) => setAdjustInput(event.target.value)} /></label>
              <TimeZoneSelect id="wc-adjust-zone" label="Time zone" value={adjustZone} onChange={setAdjustZone} zones={sharedZones} />
              <div className="wc-field"><span>Operation</span><div className="wc-segmented" role="group" aria-label="Add or remove time"><button type="button" className={adjustOperation === 'add' ? 'selected' : ''} onClick={() => setAdjustOperation('add')}>Add</button><button type="button" className={adjustOperation === 'subtract' ? 'selected' : ''} onClick={() => setAdjustOperation('subtract')}>Remove</button></div></div>
              <label className="wc-field" htmlFor="wc-adjust-amount"><span>Amount</span><input id="wc-adjust-amount" className="wc-input" type="number" min="0" step={['years', 'months', 'weeks', 'days'].includes(adjustUnit) ? '1' : 'any'} value={adjustAmount} onChange={(event) => setAdjustAmount(event.target.value)} /></label>
              <label className="wc-field" htmlFor="wc-adjust-unit"><span>Unit</span><select id="wc-adjust-unit" className="wc-select" value={adjustUnit} onChange={(event) => setAdjustUnit(event.target.value)}>{TIME_UNITS.map((unit) => <option value={unit} key={unit}>{unit[0].toUpperCase() + unit.slice(1)}</option>)}</select></label>
            </div>
            <label className="wc-field wc-disambiguation" htmlFor="wc-adjust-ambiguity"><span>If the adjusted local time repeats during DST</span><select id="wc-adjust-ambiguity" className="wc-select" value={adjustAmbiguity} onChange={(event) => setAdjustAmbiguity(event.target.value)}><option value="earlier">Use earlier occurrence</option><option value="later">Use later occurrence</option></select></label>
            <p className="wc-help">If an adjustment lands inside a spring-forward gap, the tool explains that the wall time does not exist instead of silently shifting it. Month/year changes clamp to the last valid day of the target month.</p>
          </div>
          <div className="wc-action-row"><button type="button" className="wc-button wc-button--primary" onClick={calculateAdjustment}><CalendarDays size={16} /> Calculate new date &amp; time</button></div>
          <Status status={adjustStatus} />
          {adjustResult && <div className="wc-result-card wc-result-card--accent wc-adjust-result"><div><span className="wc-result-label">NEW DATE &amp; TIME · {adjustZone} · {adjustResult.offset}{adjustResult.dst ? ' · DST ACTIVE' : ''}</span><strong>{adjustResult.formatted}</strong><small>Elapsed difference from start: {adjustResult.elapsed}</small></div><CopyButton value={adjustResult.formatted} label="Copy adjusted date and time" /></div>}
          <div className="wc-example"><strong>Calendar vs elapsed time</strong><span>Adding one calendar day to 2026-03-07 12:00 in New York returns 2026-03-08 12:00. Only 23 elapsed hours pass because daylight saving begins.</span></div>
        </section>}
      </section>

      <article className="wc-about">
        <h2>Time zones and daylight saving</h2>
        <p>A time-zone identifier such as <code>America/New_York</code> represents a region's changing clock rules, not a fixed UTC offset. CodeTrove uses the browser's internationalization data to calculate the offset for the selected date. That matters because a location can use a different offset in summer than in winter, while places such as India stay at UTC+05:30 year-round.</p>
        <div className="wc-about-grid"><section><h3>What the DST check does</h3><p>When you enter a local wall-clock time, the tool checks whether it maps to a real instant in that zone. It rejects times skipped by a spring-forward change. If clocks move back and a time occurs twice, choose the earlier or later occurrence. The displayed UTC offset updates for the specific result date.</p></section><section><h3>Choosing the right input</h3><p>Use a zoned local date-time when a human scheduled an event in a city. Use a Unix timestamp or an ISO value with <code>Z</code> / an explicit offset when comparing log events, since those already identify an absolute instant. A date-time without a zone is not enough to identify one global moment.</p></section></div>
        <p className="wc-local-note">All conversions and arithmetic run locally in this browser. Results depend on the browser's installed IANA time-zone database; recently changed government time-zone rules may require a browser update.</p>
      </article>
    </main>
  );
}
