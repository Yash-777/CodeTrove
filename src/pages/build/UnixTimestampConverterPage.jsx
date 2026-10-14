import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, RefreshCw, Clock3, ArrowLeftRight, AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';
import { copyToClipboard } from '../../utils/textActions.js';
import '../../components/CodeRunner/RunnableCode.css';
import './CompilerPage.css';
import './UnixTimestampConverterPage.css';

const PATTERNS = [
  { value: 'yyyy-MM-dd HH:mm:ss', label: 'yyyy-MM-dd HH:mm:ss — Standard 24-hour' },
  { value: 'yyyy-MM-dd hh:mm:ss a', label: 'yyyy-MM-dd hh:mm:ss a — 12-hour with AM/PM' },
  { value: 'yyyy-MM-dd HH:mm:ss.SSS', label: 'yyyy-MM-dd HH:mm:ss.SSS — Milliseconds' },
  { value: "yyyy-MM-dd'T'HH:mm:ss", label: "yyyy-MM-dd'T'HH:mm:ss — ISO style" },
  { value: 'yy-M-d H:m:s', label: 'yy-M-d H:m:s — No padding' },
];
const pad = (n, length = 2) => String(n).padStart(length, '0');
const nowSeconds = () => Math.floor(Date.now() / 1000);
const toLocalInput = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

function parseTimestamp(raw) {
  const value = String(raw).trim();
  if (!value || !/^[+-]?\d+(\.\d+)?$/.test(value)) throw new Error('Enter a valid numeric Unix timestamp.');
  const number = Number(value);
  const digits = value.replace(/^[+-]/, '').split('.')[0].length;
  let milliseconds;
  let unit;
  if (digits <= 10) { milliseconds = number * 1000; unit = 'seconds'; }
  else if (digits <= 13) { milliseconds = number; unit = 'milliseconds'; }
  else if (digits <= 16) { milliseconds = number / 1000; unit = 'microseconds'; }
  else { milliseconds = number / 1e6; unit = 'nanoseconds'; }
  const date = new Date(milliseconds);
  if (!Number.isFinite(milliseconds) || Number.isNaN(date.getTime())) throw new Error('Timestamp is outside the supported JavaScript date range.');
  return { date, unit, milliseconds };
}

function partsFor(date, zone) {
  const options = { timeZone: zone === 'GMT' ? 'UTC' : undefined, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' };
  const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(date);
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return { yyyy: p.year, yy: p.year.slice(-2), M: String(Number(p.month)), MM: p.month, d: String(Number(p.day)), dd: p.day, H: String(Number(p.hour)), HH: p.hour, h: String((Number(p.hour) % 12) || 12), hh: pad((Number(p.hour) % 12) || 12), m: String(Number(p.minute)), mm: p.minute, s: String(Number(p.second)), ss: p.second, SSS: pad(date.getMilliseconds(), 3), a: Number(p.hour) >= 12 ? 'PM' : 'AM' };
}

function formatDate(date, pattern, zone) {
  if (!pattern) throw new Error('Choose or enter a date-time format pattern.');
  // Validate tokens before formatting; quoted literals (for example 'T') are supported.
  const tokenPattern = /'(?:[^']|'')*'|yyyy|yy|SSS|MM|M|dd|d|HH|H|hh|h|mm|m|ss|s|a/g;
  const stripped = pattern.replace(tokenPattern, '').replace(/''/g, '');
  if (/[A-Za-z]/.test(stripped)) {
    const token = stripped.match(/[A-Za-z]+/)[0];
    const suggestion = token === token.toUpperCase() && /Y|D/.test(token)
      ? 'Use the supported case-sensitive pattern yyyy-MM-dd HH:mm:ss (yyyy = year, MM = month, dd = day, HH = hour, mm = minute, ss = second).'
      : 'Use supported tokens: yyyy/yy (year), MM/M (month), dd/d (day), HH/H or hh/h (hour), mm/m (minute), ss/s (second), SSS (milliseconds), and a (AM/PM).';
    throw new Error(`Unsupported pattern token: ${token}. ${suggestion}`);
  }
  if (!/(yyyy|yy|M|d|H|h|m|s)/.test(pattern)) throw new Error('Pattern must include at least one supported date or time token, for example yyyy-MM-dd HH:mm:ss.');
  const p = partsFor(date, zone);
  return pattern.replace(tokenPattern, (token) => {
    if (token.startsWith("'")) return token.slice(1, -1).replace(/''/g, "'");
    return p[token];
  });
}

function parseHumanDate(value, zone) {
  if (!value) throw new Error('Enter a human-readable date and time.');
  // datetime-local is interpreted as local time; GMT input is interpreted as UTC.
  const date = zone === 'GMT' ? new Date(`${value.replace('T', ' ')} UTC`) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid date and time.');
  return date;
}

function CopyAction({ value, title = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const text = value || String(nowSeconds());
    if (await copyToClipboard(text)) { setCopied(true); window.setTimeout(() => setCopied(false), 1300); }
  };
  return <button type="button" className={`runnable-code__icon-button${copied ? ' is-copied' : ''}`} onClick={handleCopy} title="Copy to clipboard" aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>;
}

export default function UnixTimestampConverterPage() {
  const [tab, setTab] = useState('timestamp');
  const [epoch, setEpoch] = useState('1791800830');
  const [human, setHuman] = useState(() => toLocalInput(new Date(1791800830 * 1000)));
  const [pattern, setPattern] = useState(PATTERNS[0].value);
  const [customPattern, setCustomPattern] = useState(false);
  const [customValue, setCustomValue] = useState(PATTERNS[0].value);
  const [zone, setZone] = useState('Local');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [now, setNow] = useState(Date.now());
  const activePattern = customPattern ? customValue : pattern;

  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const currentDate = useMemo(() => new Date(now), [now]);
  const currentSeconds = Math.floor(now / 1000);
  const currentMillis = now;

  const clearStatus = () => { setStatus({ type: 'idle', message: '' }); setResult(''); };
  const convertTimestamp = () => {
    try {
      const { date, unit } = parseTimestamp(epoch);
      const formatted = formatDate(date, activePattern, zone);
      setHuman(toLocalInput(date));
      setResult(formatted);
      setStatus({ type: 'ok', message: `Valid timestamp (${unit}). Format pattern is valid.` });
    } catch (error) { setResult(''); setStatus({ type: 'error', message: error.message }); }
  };
  const convertHuman = () => {
    try {
      // Validate the requested pattern on conversion, even though this direction emits a timestamp.
      formatDate(new Date(), activePattern, zone);
      const date = parseHumanDate(human, zone);
      const seconds = Math.floor(date.getTime() / 1000);
      setEpoch(String(seconds));
      setResult(`${seconds} seconds  |  ${date.getTime()} milliseconds`);
      setStatus({ type: 'ok', message: 'Date-time and format pattern are valid.' });
    } catch (error) { setResult(''); setStatus({ type: 'error', message: error.message }); }
  };
  const resetEpoch = () => { setEpoch(String(nowSeconds())); setHuman(toLocalInput(new Date())); setResult(''); setStatus({ type: 'idle', message: 'Reset to the current time.' }); };
  const resetHuman = () => { setHuman(toLocalInput(new Date())); setEpoch(String(nowSeconds())); setResult(''); setStatus({ type: 'idle', message: 'Reset to the current date and time.' }); };

  return <main className="content-page ut-page">
    <div className="ut-hero">
      <div className="ut-eyebrow"><Clock3 size={16} /> DATA &amp; TIME TOOL</div>
      <h1>Unix Timestamp Converter</h1>
      <p>Convert Unix timestamps to human-readable dates and vice versa, in local time or GMT. Fast, accurate, and entirely in your browser.</p>
      <div className="ut-live-card">
        <div><span className="ut-live-label"><span className="ut-live-dot" /> Current Epoch Unix Timestamp</span><strong>{currentSeconds}</strong><small>Seconds</small></div>
        <CopyAction value={String(currentSeconds)} title="Copy current timestamp in seconds" />
        <div className="ut-live-divider" />
        <div><strong>{currentMillis}</strong><small>Milliseconds</small></div>
        <CopyAction value={String(currentMillis)} title="Copy current timestamp in milliseconds" />
        <div className="ut-live-time">{currentDate.toLocaleString()} <span>({currentDate.toISOString().replace('T', ' ').replace('Z', ' GMT')})</span></div>
      </div>
    </div>

    <section className="ut-workspace">
      <div className="ut-tabs" role="tablist" aria-label="Timestamp conversion direction">
        <button type="button" role="tab" aria-selected={tab === 'timestamp'} className={tab === 'timestamp' ? 'active' : ''} onClick={() => { setTab('timestamp'); clearStatus(); }}>Unix to Date Time</button>
        <button type="button" role="tab" aria-selected={tab === 'human'} className={tab === 'human' ? 'active' : ''} onClick={() => { setTab('human'); clearStatus(); }}>Date Time to Unix</button>
      </div>
      <div className="ut-convert-grid">
        <section className="ut-input-card">
          <div className="ut-card-heading"><div><span className="ut-step">01</span><h2>{tab === 'timestamp' ? 'Timestamp' : 'Human date'}</h2></div><span className="ut-file-pill">{tab === 'timestamp' ? 'UNIX TIME' : 'DATE & TIME'}</span></div>
          <label className="ut-field-label" htmlFor="ut-value">{tab === 'timestamp' ? 'Enter a Timestamp' : 'Enter a human-readable date and time'}</label>
          {tab === 'timestamp' ? <input id="ut-value" className="ut-text-input ut-epoch-input" value={epoch} onChange={(e) => setEpoch(e.target.value)} placeholder="1791800830" inputMode="numeric" /> : <input id="ut-value" className="ut-text-input" type="datetime-local" step="1" value={human} onChange={(e) => setHuman(e.target.value)} />}
          <p className="ut-help">{tab === 'timestamp' ? 'Supports seconds, milliseconds, microseconds and nanoseconds. The unit is inferred from the number of digits.' : 'Choose a date and time. Local mode uses your device timezone; GMT mode interprets the input as UTC.'}</p>
          <div className="ut-inline-actions"><CopyAction value={tab === 'timestamp' ? epoch : human} /><button type="button" className="ut-icon-action" onClick={tab === 'timestamp' ? resetEpoch : resetHuman}><RefreshCw size={15} /><span>Clear / Now</span></button></div>
        </section>
        <section className="ut-options-card">
          <div className="ut-card-heading"><div><span className="ut-step">02</span><h2>{tab === 'timestamp' ? 'Format & timezone' : 'Timestamp'}</h2></div></div>
          {tab === 'human' ? <div className="ut-timestamp-preview"><span className="ut-result-label">UNIX TIMESTAMP</span><strong>{(() => { try { return Math.floor(parseHumanDate(human, zone).getTime() / 1000); } catch { return '—'; } })()}</strong><span>Seconds</span><strong>{(() => { try { return parseHumanDate(human, zone).getTime(); } catch { return '—'; } })()}</strong><span>Milliseconds</span><p className="ut-help">Update the date and time on the left to preview the timestamp, then select Convert to confirm.</p><div className="ut-format-actions"><button type="button" className="ut-primary-button" onClick={convertHuman}><ArrowLeftRight size={16} /> Convert to timestamp</button></div></div> : <>
          <label className="ut-field-label" htmlFor="ut-pattern">Date-time format pattern</label>
          {!customPattern ? <select id="ut-pattern" className="ut-select" value={pattern} onChange={(e) => setPattern(e.target.value)}>{PATTERNS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select> : <input id="ut-pattern" className="ut-text-input" value={customValue} onChange={(e) => setCustomValue(e.target.value)} placeholder="yyyy-MM-dd HH:mm:ss" />}
          <label className="ut-checkbox"><input type="checkbox" checked={customPattern} onChange={(e) => { setCustomPattern(e.target.checked); setStatus({ type: 'idle', message: '' }); }} /><span>Use custom pattern</span></label>
          <div className="ut-pattern-examples"><code>yyyy</code> year <code>MM</code> month <code>dd</code> day <code>HH</code> 24-hour <code>mm</code> minute <code>ss</code> second <code>SSS</code> milliseconds <code>a</code> AM/PM</div>
          <label className="ut-field-label">Time zone</label>
          <div className="ut-segmented"><button type="button" className={zone === 'Local' ? 'selected' : ''} onClick={() => setZone('Local')}>Local</button><button type="button" className={zone === 'GMT' ? 'selected' : ''} onClick={() => setZone('GMT')}>GMT / UTC</button></div>
          <div className="ut-format-actions"><button type="button" className="ut-secondary-button" onClick={() => { try { formatDate(new Date(), activePattern, zone); setStatus({ type: 'ok', message: 'Format pattern is valid.' }); } catch (error) { setStatus({ type: 'error', message: error.message }); } }}>Validate format</button><button type="button" className="ut-primary-button" onClick={convertTimestamp}><ArrowLeftRight size={16} /> Convert</button></div>
          </>}
        </section>
      </div>
      {status.type !== 'idle' && <div className={`ut-status ut-status--${status.type}`} role="status">{status.type === 'ok' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}<span>{status.message}</span></div>}
      {result && <section className="ut-result-card"><div><span className="ut-result-label">{tab === 'timestamp' ? 'HUMAN-READABLE DATE' : 'UNIX TIMESTAMP'}</span><strong>{result}</strong></div><CopyAction value={result} title="Copy conversion result" /></section>}
    </section>

    <article className="ut-about">
      <h2>What is the Unix timestamp?</h2>
      <p>A Unix timestamp (also called epoch time) is the number of elapsed seconds since <strong>1970-01-01 00:00:00 UTC</strong>, excluding leap seconds in the conventional Unix-time model. It provides a compact, timezone-independent way to represent a point in time. Millisecond, microsecond, and nanosecond timestamps express the same epoch using finer units.</p>
      <h2>What happens on January 19, 2038?</h2>
      <p>At 03:14:07 UTC on 19 January 2038, a signed 32-bit integer holding Unix seconds reaches its maximum value. The next second overflows that representation, potentially causing incorrect dates or failures in older systems that still use 32-bit time values. Modern 64-bit time representations avoid this specific limit, but legacy devices and software may need updates.</p>
      <h2>Format reference</h2>
      <div className="ut-pattern-table-wrap"><table className="ut-pattern-table"><thead><tr><th>Pattern</th><th>Meaning</th><th>Example</th></tr></thead><tbody><tr><td><code>yyyy-MM-dd HH:mm:ss</code></td><td>Standard 24-hour</td><td>2026-10-12 16:16:05</td></tr><tr><td><code>yyyy-MM-dd hh:mm:ss a</code></td><td>12-hour with AM/PM</td><td>2026-10-12 04:16:05 PM</td></tr><tr><td><code>yyyy-MM-dd HH:mm:ss.SSS</code></td><td>Milliseconds</td><td>2026-10-12 16:16:05.342</td></tr><tr><td><code>yyyy-MM-dd'T'HH:mm:ss</code></td><td>ISO-style literal T</td><td>2026-10-12T16:16:05</td></tr><tr><td><code>yy-M-d H:m:s</code></td><td>Without zero-padding</td><td>26-10-12 16:16:5</td></tr></tbody></table></div>
      <p className="ut-note" style={{ "white-space": 'pre-wrap' }}><AlertCircle size={16} />
        <div className="ut-pattern-table-wrap">
          <p>Pattern tokens are case-sensitive.</p>

          <table className="ut-pattern-table">
            <thead>
              <tr>
                <th colSpan={2}>Date</th>
                <th colSpan={2}>Time</th>
              </tr>
              <tr>
                <th>Pattern</th>
                <th>Explanation</th>
                <th>Pattern</th>
                <th>Explanation</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td><code>yyyy</code></td>
                <td>4-digit year (e.g., 2026)</td>
                <td><code>HH</code></td>
                <td>24-hour format, zero-padded (e.g., 00, 09, 13, 23)</td>
              </tr>
              <tr>
                <td><code>yy</code></td>
                <td>2-digit year (e.g., 26)</td>
                <td><code>H</code></td>
                <td>24-hour format, without leading zero (e.g., 0, 9, 13, 23)</td>
              </tr>
              <tr>
                <td><code>MMMM</code></td>
                <td>Full month name (e.g., January)</td>
                <td><code>hh</code></td>
                <td>12-hour format, zero-padded (e.g., 01, 09, 12)</td>
              </tr>
              <tr>
                <td><code>MMM</code></td>
                <td>Short month name (e.g., Jan, Feb)</td>
                <td><code>h</code></td>
                <td>12-hour format, without leading zero (e.g., 1, 9, 12)</td>
              </tr>
              <tr>
                <td><code>MM</code></td>
                <td>Month, zero-padded (e.g., 01, 12)</td>
                <td><code>mm</code></td>
                <td>Minutes, zero-padded (e.g., 05, 30, 59)</td>
              </tr>
              <tr>
                <td><code>M</code></td>
                <td>Month, without leading zero (e.g., 1, 12)</td>
                <td><code>m</code></td>
                <td>Minutes, without leading zero (e.g., 5, 30, 59)</td>
              </tr>
              <tr>
                <td><code>dddd</code></td>
                <td>Full weekday name (e.g., Monday)</td>
                <td><code>ss</code></td>
                <td>Seconds, zero-padded (e.g., 05, 30, 59)</td>
              </tr>
              <tr>
                <td><code>ddd</code></td>
                <td>Short weekday name (e.g., Mon, Tue)</td>
                <td><code>s</code></td>
                <td>Seconds, without leading zero (e.g., 5, 30, 59)</td>
              </tr>
              <tr>
                <td><code>dd</code></td>
                <td>Day of month, zero-padded (e.g., 01, 12, 31)</td>
                <td><code>SSS</code></td>
                <td>Milliseconds, 3 digits (e.g., 005, 050, 250)</td>
              </tr>
              <tr>
                <td><code>d</code></td>
                <td>Day of month, without leading zero (e.g., 1, 12, 31)</td>
                <td><code>a</code></td>
                <td>AM/PM marker (e.g., AM, PM)</td>
              </tr>
              <tr>
                <td>—</td>
                <td>—</td>
                <td><code>hh:mm a</code></td>
                <td>12-hour time with AM/PM (e.g., 04:30 PM)</td>
              </tr>
              <tr>
                <td>—</td>
                <td>—</td>
                <td><code>HH:mm</code></td>
                <td>24-hour time (e.g., 16:30)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </p>
      <h2>Common invalid date-format patterns</h2>
      <div className="ut-pattern-table-wrap"><table className="ut-pattern-table"><thead><tr><th>Pattern entered</th><th>Why it fails</th><th>Use instead</th></tr></thead><tbody><tr><td><code>YYYY-MM-DD hh:mm:ss</code></td><td>Uppercase <code>YYYY</code> and <code>DD</code> are unsupported tokens in this formatter.</td><td><code>yyyy-MM-dd HH:mm:ss</code></td></tr><tr><td><code>yyyy-mm-dd HH:MM:ss</code></td><td><code>mm</code> means minutes and <code>MM</code> means month; they are swapped.</td><td><code>yyyy-MM-dd HH:mm:ss</code></td></tr><tr><td><code>yyyy-MM-dd HH:mm:ss Q</code></td><td><code>Q</code> is not a supported token.</td><td><code>yyyy-MM-dd HH:mm:ss</code></td></tr><tr><td><code>yyyy-MM-dd'T HH:mm:ss</code></td><td>The quoted literal is not closed.</td><td><code>yyyy-MM-dd'T'HH:mm:ss</code></td></tr></tbody></table></div>
    </article>
  </main>;
}
