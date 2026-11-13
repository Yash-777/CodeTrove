import { useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/legacy-modes/mode/javascript';
import { StreamLanguage } from '@codemirror/language';
import { Check, CheckCircle2, Clipboard, Download, FileJson, Minimize2, WandSparkles } from 'lucide-react';
import ToolBackLink from '../../components/ToolBackLink.jsx';
import '../../components/CodeRunner/RunnableCode.css';
import './CompilerPage.css';
import './HtmlXmlJsonToolPage.css';
import './HttpStatusCodesPage.css';

const JSON_LANGUAGE = StreamLanguage.define(javascript);
const DATASET_KEY = 'status_codes';
const STATUS_CATEGORIES = {
  all: { label: 'ALL', range: '100–599', title: 'All HTTP status codes' },
  '1xx': { label: '1XX', range: '100–199', title: 'Informational responses' },
  '2xx': { label: '2XX', range: '200–299', title: 'Successful responses' },
  '3xx': { label: '3XX', range: '300–399', title: 'Redirection responses' },
  '4xx': { label: '4XX', range: '400–499', title: 'Client error responses' },
  '5xx': { label: '5XX', range: '500–599', title: 'Server error responses' },
};

const HTTP_STATUS_CODES = [
  [100, 'Continue', 'Informational', 'The server has received the request headers and the client should proceed with the request body.'],
  [101, 'Switching Protocols', 'Informational', 'The server is switching protocols as requested by the client.'],
  [102, 'Processing', 'Informational', 'The server has received and is processing the request, but no response is available yet.'],
  [103, 'Early Hints', 'Informational', 'The server is sending preliminary response headers before the final response.'],
  [200, 'OK', 'Success', 'The request was successful.'],
  [201, 'Created', 'Success', 'The request succeeded and created a new resource.'],
  [202, 'Accepted', 'Success', 'The request has been accepted for processing, but processing may not be complete.'],
  [203, 'Non-Authoritative Information', 'Success', 'The response metadata came from a transforming proxy rather than the origin server.'],
  [204, 'No Content', 'Success', 'The request succeeded and there is no content to return in the response body.'],
  [205, 'Reset Content', 'Success', 'The request succeeded and the client should reset the document view.'],
  [206, 'Partial Content', 'Success', 'The server is delivering only the range of the resource requested by the client.'],
  [207, 'Multi-Status', 'Success', 'The response contains multiple independent status values for different operations.'],
  [208, 'Already Reported', 'Success', 'The members of a WebDAV binding have already been enumerated in an earlier response.'],
  [226, 'IM Used', 'Success', 'The server fulfilled a GET request using one or more instance manipulations.'],
  [300, 'Multiple Choices', 'Redirection', 'The request has more than one possible response and the client may choose one.'],
  [301, 'Moved Permanently', 'Redirection', 'The target resource has been assigned a new permanent URL.'],
  [302, 'Found', 'Redirection', 'The target resource is temporarily available at a different URL.'],
  [303, 'See Other', 'Redirection', 'The response can be found at another URL using a GET request.'],
  [304, 'Not Modified', 'Redirection', 'The resource has not changed since the version specified by the request headers.'],
  [305, 'Use Proxy', 'Redirection', 'The requested resource must be accessed through the proxy specified in the response.'],
  [307, 'Temporary Redirect', 'Redirection', 'The request should be repeated at another URL without changing the request method.'],
  [308, 'Permanent Redirect', 'Redirection', 'The target resource has been assigned a new permanent URL and preserves the request method.'],
  [400, 'Bad Request', 'Client Error', 'The server cannot process the request because the request syntax or contents are invalid.'],
  [401, 'Unauthorized', 'Client Error', 'The request requires valid authentication credentials.'],
  [402, 'Payment Required', 'Client Error', 'The request cannot be completed until a payment condition is met.'],
  [403, 'Forbidden', 'Client Error', 'The server understood the request but refuses to authorize it.'],
  [404, 'Not Found', 'Client Error', 'The requested resource could not be found.'],
  [405, 'Method Not Allowed', 'Client Error', 'The request method is known but is not supported for the target resource.'],
  [406, 'Not Acceptable', 'Client Error', 'The server cannot produce a response matching the acceptable representations in the request.'],
  [407, 'Proxy Authentication Required', 'Client Error', 'The client must authenticate itself with the proxy before the request can proceed.'],
  [408, 'Request Timeout', 'Client Error', 'The server did not receive a complete request within the time it was prepared to wait.'],
  [409, 'Conflict', 'Client Error', 'The request conflicts with the current state of the target resource.'],
  [410, 'Gone', 'Client Error', 'The target resource is no longer available and the condition is likely permanent.'],
  [411, 'Length Required', 'Client Error', 'The server refuses the request without a valid Content-Length header.'],
  [412, 'Precondition Failed', 'Client Error', 'One or more request preconditions evaluated to false.'],
  [413, 'Content Too Large', 'Client Error', 'The request content is larger than the server is willing or able to process.'],
  [414, 'URI Too Long', 'Client Error', 'The request target is longer than the server is willing to interpret.'],
  [415, 'Unsupported Media Type', 'Client Error', 'The request content format is not supported by the target resource.'],
  [416, 'Range Not Satisfiable', 'Client Error', 'The requested range cannot be supplied for the target resource.'],
  [417, 'Expectation Failed', 'Client Error', 'The server cannot meet the requirements of the Expect request header.'],
  [418, "I'm a Teapot", 'Client Error', 'The server refuses to brew coffee because it is, permanently, a teapot.'],
  [421, 'Misdirected Request', 'Client Error', 'The request was directed to a server that cannot produce a response for the target authority.'],
  [422, 'Unprocessable Content', 'Client Error', 'The server understands the content type and syntax but cannot process the instructions.'],
  [423, 'Locked', 'Client Error', 'The source or target resource is locked.'],
  [424, 'Failed Dependency', 'Client Error', 'The request failed because a previous request on which it depended failed.'],
  [425, 'Too Early', 'Client Error', 'The server is unwilling to risk processing a request that might be replayed.'],
  [426, 'Upgrade Required', 'Client Error', 'The server refuses the request unless the client switches to another protocol.'],
  [428, 'Precondition Required', 'Client Error', 'The origin server requires the request to be conditional.'],
  [429, 'Too Many Requests', 'Client Error', 'The user has sent too many requests in a given amount of time.'],
  [431, 'Request Header Fields Too Large', 'Client Error', 'The server refuses the request because its header fields are too large.'],
  [451, 'Unavailable For Legal Reasons', 'Client Error', 'The server is denying access to the resource because of a legal demand.'],
  [500, 'Internal Server Error', 'Server Error', 'The server encountered an unexpected condition that prevented it from fulfilling the request.'],
  [501, 'Not Implemented', 'Server Error', 'The server does not support the functionality required to fulfill the request.'],
  [502, 'Bad Gateway', 'Server Error', 'The server received an invalid response from an upstream server.'],
  [503, 'Service Unavailable', 'Server Error', 'The server is currently unable to handle the request because of temporary overload or maintenance.'],
  [504, 'Gateway Timeout', 'Server Error', 'The server did not receive a timely response from an upstream server.'],
  [505, 'HTTP Version Not Supported', 'Server Error', 'The server does not support the HTTP version used in the request.'],
  [506, 'Variant Also Negotiates', 'Server Error', 'The server has an internal configuration error in transparent content negotiation.'],
  [507, 'Insufficient Storage', 'Server Error', 'The server cannot store the representation needed to complete the request.'],
  [508, 'Loop Detected', 'Server Error', 'The server detected an infinite loop while processing the request.'],
  [510, 'Not Extended', 'Server Error', 'Further extensions to the request are required for the server to fulfill it.'],
  [511, 'Network Authentication Required', 'Server Error', 'The client needs to authenticate to gain network access.'],
].map(([code, message, category, description]) => ({ code, message, category, description }));

function sampleRecords(category) {
  if (category === 'all') return HTTP_STATUS_CODES;
  const firstDigit = Number(category[0]);
  return HTTP_STATUS_CODES.filter((item) => Math.floor(item.code / 100) === firstDigit);
}

function sortRecords(records) {
  return [...records].sort((left, right) => left.code - right.code).map((record) => ({
    category: record.category,
    code: record.code,
    description: record.description,
    message: record.message,
  }));
}

function readRecords(source) {
  let parsed;
  try { parsed = JSON.parse(source); } catch (error) { throw new Error(`Invalid JSON: ${error.message}`); }
  const records = Array.isArray(parsed) ? parsed : parsed?.[DATASET_KEY];
  if (!Array.isArray(records)) throw new Error(`Expected a JSON array or an object containing "${DATASET_KEY}".`);
  if (!records.length) throw new Error('The status code dataset must contain at least one record.');
  records.forEach((record, index) => {
    if (!record || !Number.isInteger(record.code) || record.code < 100 || record.code > 599) throw new Error(`Record ${index + 1} must contain an integer HTTP code from 100 to 599.`);
    if (typeof record.message !== 'string' || typeof record.category !== 'string' || typeof record.description !== 'string') throw new Error(`Record ${index + 1} must contain string message, category, and description fields.`);
  });
  return records;
}

function toJson(records, indent, minify, sortKeys) {
  const prepared = sortKeys ? sortRecords(records) : records;
  return JSON.stringify({ [DATASET_KEY]: prepared }, null, minify ? undefined : indent);
}

function toJsonl(records, minify, sortKeys) {
  const prepared = sortKeys ? sortRecords(records) : records;
  return prepared.map((record) => JSON.stringify(record, null, minify ? undefined : 0)).join('\n');
}

function formatCount(count) { return `${count} ${count === 1 ? 'status code' : 'status codes'}`; }

export default function HttpStatusCodesPage() {
  const [category, setCategory] = useState('all');
  const [outputFormat, setOutputFormat] = useState('json');
  const [input, setInput] = useState(() => JSON.stringify({ [DATASET_KEY]: HTTP_STATUS_CODES }, null, 2));
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState('2');
  const [sortKeys, setSortKeys] = useState(false);
  const [minify, setMinify] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const recordsForSample = useMemo(() => sampleRecords(category), [category]);
  const extensions = useMemo(() => [JSON_LANGUAGE], []);
  const activeCategory = STATUS_CATEGORIES[category];

  const loadSample = (nextCategory = category) => {
    const records = sampleRecords(nextCategory);
    setInput(JSON.stringify({ [DATASET_KEY]: records }, null, 2));
    setOutput(''); setError(''); setStatus(`${activeCategory.title} sample loaded: ${formatCount(records.length)}.`); setCopied(false);
  };
  const validate = () => {
    try { const records = readRecords(input); setError(''); setStatus(`Valid dataset: ${formatCount(records.length)}.`); return records; }
    catch (problem) { setError(problem.message); setStatus(''); return null; }
  };
  const convert = (nextMinify = minify) => {
    const records = validate();
    setMinify(nextMinify);
    if (!records) { setOutput(''); return; }
    try {
      const result = outputFormat === 'jsonl' ? toJsonl(records, nextMinify, sortKeys) : toJson(records, Number(indent), nextMinify, sortKeys);
      setOutput(result); setError(''); setStatus(`${nextMinify ? 'Compacted' : 'Formatted'} ${outputFormat.toUpperCase()} output: ${formatCount(records.length)}.`); setCopied(false);
    } catch (problem) { setOutput(''); setError(problem.message); setStatus(''); }
  };
  const copyOutput = async () => {
    if (!output) return;
    try { await navigator.clipboard.writeText(output); setCopied(true); setError(''); setStatus('Copied output to clipboard.'); window.setTimeout(() => setCopied(false), 1500); }
    catch { setError('Clipboard access was blocked by the browser. Select and copy the output manually.'); }
  };
  const downloadOutput = () => {
    if (!output) return;
    const blob = new Blob([output], { type: outputFormat === 'jsonl' ? 'application/x-ndjson' : 'application/json' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `http-status-codes.${outputFormat}`; anchor.click(); URL.revokeObjectURL(url);
    setStatus(`Downloaded ${outputFormat.toUpperCase()} dataset.`);
  };
  const clear = () => { setInput(''); setOutput(''); setError(''); setStatus(''); setCopied(false); };
  const changeCategory = (nextCategory) => { setCategory(nextCategory); setInput(JSON.stringify({ [DATASET_KEY]: sampleRecords(nextCategory) }, null, 2)); setOutput(''); setError(''); setStatus(`${STATUS_CATEGORIES[nextCategory].label} sample loaded: ${formatCount(sampleRecords(nextCategory).length)}.`); };

  return (
    <div className="content-page hxt-page status-codes-page">
      <ToolBackLink />
      <div className="cp-head"><div><h1>HTTP Status Codes</h1><p className="cp-subtitle">Browse, validate, format, and convert a practical HTTP status code dataset for API documentation and testing.</p></div></div>
      <div className="hxt-intro">Choose a status-code family, edit the JSON input if needed, then convert it to formatted JSON or newline-delimited JSON. Everything runs locally in your browser.</div>
      <section className="status-codes-card hxt-card" aria-label="HTTP status code converter">
        <div className="status-codes-controls">
          <label className="runnable-code__target"><span>Sample input</span><select value={category} onChange={(event) => changeCategory(event.target.value)} aria-label="HTTP status code sample category">{Object.entries(STATUS_CATEGORIES).map(([key, item]) => <option key={key} value={key}>{item.label} · {item.title}</option>)}</select></label>
          <label className="runnable-code__target"><span>Output</span><select value={outputFormat} onChange={(event) => { setOutputFormat(event.target.value); setOutput(''); setStatus(''); }} aria-label="Output format"><option value="json">JSON dataset</option><option value="jsonl">JSONL records</option></select></label>
          <label className="runnable-code__target"><span>Indent</span><select value={indent} onChange={(event) => setIndent(event.target.value)} aria-label="JSON indentation"><option value="2">2 spaces</option><option value="3">3 spaces</option><option value="4">4 spaces</option></select></label>
          <label className="hxt-check"><input type="checkbox" checked={sortKeys} onChange={(event) => setSortKeys(event.target.checked)} /><span className="switch-label">Sort keys</span></label>
          <span className="status-codes-count">{activeCategory.range} · {formatCount(recordsForSample.length)}</span>
        </div>
        <div className="hxt-toolbar-actions status-codes-actions"><button type="button" className="runnable-code__button runnable-code__button--run" onClick={() => convert(false)}><WandSparkles size={14} /> Beautify / Convert</button><button type="button" className="runnable-code__button" onClick={() => convert(true)}><Minimize2 size={14} /> Minify / Compact</button><button type="button" className="runnable-code__button" onClick={validate}><CheckCircle2 size={14} /> Validate</button><button type="button" className="runnable-code__button" onClick={() => loadSample()}><FileJson size={14} /> Reload sample</button></div>
        {(error || status) && <div className={`hxt-message${error ? ' hxt-message--error' : ' hxt-message--success'}`} role={error ? 'alert' : 'status'}>{error || status}</div>}
        <div className="hxt-panes">
          <div className="hxt-pane"><div className="hxt-pane-header"><span><span className="hxt-format-badge">INPUT</span><strong>http-status-codes.json</strong></span><div className="hxt-pane-actions"><button type="button" className="runnable-code__button" onClick={clear}>Clear</button><button type="button" className="runnable-code__button runnable-code__button--run" onClick={validate}><CheckCircle2 size={14} /> Validate</button></div></div><CodeMirror value={input} onChange={(value) => { setInput(value); setOutput(''); setError(''); setStatus(''); }} theme={oneDark} extensions={extensions} height="430px" basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }} aria-label="HTTP status code JSON input" /><div className="hxt-pane-footer"><span>{input.length.toLocaleString()} characters</span><span>{formatCount(recordsForSample.length)} in selected sample</span></div></div>
          <div className="hxt-pane"><div className="hxt-pane-header"><span><span className="hxt-format-badge hxt-format-badge--output">OUTPUT</span><strong>http-status-codes.{outputFormat}</strong></span><div className="hxt-pane-actions"><button type="button" className={`runnable-code__icon-button${copied ? ' is-copied' : ''}`} onClick={copyOutput} disabled={!output} title="Copy output" aria-label="Copy output">{copied ? <Check size={16} /> : <Clipboard size={16} />}</button><button type="button" className="runnable-code__button" onClick={downloadOutput} disabled={!output}><Download size={14} /> Download</button></div></div><CodeMirror value={output} theme={oneDark} extensions={extensions} readOnly height="430px" basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: false }} aria-label="Converted HTTP status code output" /><div className="hxt-pane-footer"><span>{output.length.toLocaleString()} characters</span><span>Output appears after conversion</span></div></div>
        </div>
      </section>
      <section className="status-codes-reference hxt-about"><h2>HTTP status code dataset</h2><p>Each record follows a predictable schema with <code>code</code>, <code>message</code>, <code>category</code>, and <code>description</code>. JSON output wraps records in <code>status_codes</code>; JSONL output writes one status object per line for streaming and log-friendly workflows.</p><div className="status-codes-category-grid">{Object.entries(STATUS_CATEGORIES).filter(([key]) => key !== 'all').map(([key, item]) => <button type="button" key={key} className="status-codes-category" onClick={() => changeCategory(key)}><strong>{item.label}</strong><span>{item.title}</span><small>{item.range} · {sampleRecords(key).length} records</small></button>)}</div><details><summary>Sample record fields</summary><pre className="hxt-sample">{JSON.stringify(HTTP_STATUS_CODES[HTTP_STATUS_CODES.findIndex((item) => item.code === 200)], null, 2)}</pre></details><p className="hxt-note">Processing stays in your browser. Use JSON for API payloads and configuration files; use JSONL when each status object should be consumed independently as a stream.</p></section>
    </div>
  );
}
