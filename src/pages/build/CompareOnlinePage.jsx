import { useMemo, useRef, useState } from 'react';
import { Check, Clipboard, Copy, FileDiff, FileUp, RotateCcw, Sparkles } from 'lucide-react';
import ToolBackLink from '../../components/ToolBackLink.jsx';
import { compareText } from '../../utils/textDiff.js';
import {
  STRUCTURED_SAMPLES,
  STRUCTURED_TYPES,
  prepareStructuredDocument,
  validateStructuredDocument,
} from '../../utils/structuredCompare.js';
import './CompareOnlinePage.css';

function copyToClipboard(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  return copied ? Promise.resolve() : Promise.reject(new Error('Copy was blocked by the browser.'));
}

export default function CompareOnlinePage() {
  const [type, setType] = useState('json');
  const [leftText, setLeftText] = useState(STRUCTURED_SAMPLES.json.left);
  const [rightText, setRightText] = useState(STRUCTURED_SAMPLES.json.right);
  const [pretty, setPretty] = useState(true);
  const [indent, setIndent] = useState(2);
  const [validate, setValidate] = useState(true);
  const [validation, setValidation] = useState({ left: null, right: null });
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState('');
  const leftFileRef = useRef(null);
  const rightFileRef = useRef(null);

  const selectedType = useMemo(() => STRUCTURED_TYPES.find((item) => item.value === type), [type]);

  function updateType(event) {
    const nextType = event.target.value;
    setType(nextType);
    setLeftText(STRUCTURED_SAMPLES[nextType].left);
    setRightText(STRUCTURED_SAMPLES[nextType].right);
    setValidation({ left: null, right: null });
    setResult(null);
    setNotice('');
  }

  function loadSample() {
    setLeftText(STRUCTURED_SAMPLES[type].left);
    setRightText(STRUCTURED_SAMPLES[type].right);
    setValidation({ left: null, right: null });
    setResult(null);
    setNotice('Sample loaded.');
  }

  function clearAll() {
    setLeftText('');
    setRightText('');
    setValidation({ left: null, right: null });
    setResult(null);
    setNotice('');
  }

  function loadFile(event, setText) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result ?? ''));
      setResult(null);
      setNotice(`${file.name} loaded locally.`);
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  async function copyText(label, value) {
    try {
      await copyToClipboard(value);
      setNotice(`${label} copied.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Copy was blocked by the browser.');
    }
  }

  function formatBoth() {
    const left = prepareStructuredDocument(leftText, type, { pretty: true, indent });
    const right = prepareStructuredDocument(rightText, type, { pretty: true, indent });
    setValidation({ left: left.validation, right: right.validation });
    if (!left.validation.valid || !right.validation.valid) {
      setNotice('Fix the highlighted document errors before formatting.');
      return;
    }
    setLeftText(left.value);
    setRightText(right.value);
    setNotice(`Both ${selectedType.label} documents formatted with ${indent} spaces.`);
    setResult(null);
  }

  function compare() {
    const left = prepareStructuredDocument(leftText, type, { pretty, indent });
    const right = prepareStructuredDocument(rightText, type, { pretty, indent });
    setValidation(validate ? { left: left.validation, right: right.validation } : { left: null, right: null });
    if (validate && (!left.validation.valid || !right.validation.valid)) {
      setResult(null);
      setNotice('Comparison stopped. Fix both document errors first.');
      return;
    }
    setResult(compareText(left.value, right.value));
    setNotice(`${selectedType.label} comparison complete.`);
  }

  const rows = result?.rows ?? [];
  const diffText = rows.map((row) => `${row.type === 'add' ? '+' : row.type === 'remove' ? '-' : ' '} ${row.type === 'add' ? row.right : row.left}`).join('\n');

  return (
    <main className="compare-online-page">
      <ToolBackLink />
      <header className="compare-online-page__header">
        <div>
          <p className="compare-online-page__eyebrow">TEXT / STRUCTURED DATA</p>
          <h1>Compare Online <span>(JSON / XML / HTML)</span></h1>
          <p>Compare two documents of the same type in your browser. Format, validate, and inspect changes without uploading your source.</p>
        </div>
        <div className="compare-online-page__local-note"><Sparkles size={15} /> Local browser processing</div>
      </header>

      <section className="compare-online-card compare-online-card--controls" aria-label="Comparison controls">
        <label className="compare-online-field">
          <span>Document type</span>
          <select value={type} onChange={updateType}>
            {STRUCTURED_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="compare-online-check"><input type="checkbox" checked={pretty} onChange={(event) => setPretty(event.target.checked)} /> Pretty-print before compare</label>
        <label className="compare-online-field compare-online-field--small">
          <span>Indent spaces</span>
          <select value={indent} onChange={(event) => setIndent(Number(event.target.value))} disabled={!pretty}>
            {[2, 3, 4].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="compare-online-check"><input type="checkbox" checked={validate} onChange={(event) => setValidate(event.target.checked)} /> Validate both documents</label>
        <button type="button" className="compare-online-button" onClick={formatBoth}><Sparkles size={16} /> Format both</button>
        <button type="button" className="compare-online-button compare-online-button--primary" onClick={compare}><FileDiff size={16} /> Compare</button>
      </section>

      <section className="compare-online-card compare-online-card--inputs" aria-label="Documents to compare">
        {[['left', 'File 1 / Original', leftText, setLeftText, leftFileRef, validation.left], ['right', 'File 2 / Updated', rightText, setRightText, rightFileRef, validation.right]].map(([side, label, value, setValue, fileRef, sideValidation]) => (
          <div className={`compare-online-input-column compare-online-input-column--${side}`} key={side}>
            <div className="compare-online-input-head">
              <div>
                <span className="compare-online-label">{label}</span>
                <span className="compare-online-helper">Paste or load {selectedType.label}; both sides must use the selected type.</span>
              </div>
              <div className="compare-online-input-actions">
                <input ref={fileRef} type="file" accept={type === 'json' ? '.json' : type === 'xml' ? '.xml' : '.html,.htm'} hidden onChange={(event) => loadFile(event, setValue)} />
                <button type="button" className="compare-online-icon-button" onClick={() => fileRef.current?.click()} title={`Load ${label}`}><FileUp size={15} /> Load</button>
                <button type="button" className="compare-online-icon-button" onClick={() => copyText(label, value)} title={`Copy ${label}`}><Copy size={15} /> Copy</button>
              </div>
            </div>
            <textarea aria-label={label} value={value} onChange={(event) => { setValue(event.target.value); setResult(null); }} spellCheck="false" />
            {sideValidation && <p className={`compare-online-validation ${sideValidation.valid ? 'is-valid' : 'is-invalid'}`} role="status">{sideValidation.valid ? <Check size={14} /> : <span aria-hidden="true">!</span>} {sideValidation.message}</p>}
          </div>
        ))}
      </section>

      <div className="compare-online-actions" role="toolbar" aria-label="Document actions">
        <button type="button" className="compare-online-button compare-online-button--secondary" onClick={loadSample}><FileDiff size={16} /> Samples</button>
        <button type="button" className="compare-online-button compare-online-button--secondary" onClick={clearAll}><RotateCcw size={16} /> Clear</button>
        <button type="button" className="compare-online-button compare-online-button--secondary" onClick={() => copyText('comparison result', diffText)} disabled={!result}><Clipboard size={16} /> Copy comparison</button>
        <span className="compare-online-status" role="status">{notice || (result ? `${result.additions} added · ${result.removals} removed · ${result.unchanged} unchanged` : 'Ready to compare')}</span>
      </div>

      <section className="compare-online-card compare-online-card--result" aria-label="Comparison result">
        <div className="compare-online-result-head"><strong>Comparison result</strong><span>{result ? `${rows.length} aligned lines` : 'Click Compare to inspect differences'}</span></div>
        {!result ? <p className="compare-online-empty">Your aligned JSON, XML, or HTML differences will appear here.</p> : (
          <div className="compare-online-diff-table">
            <div className="compare-online-diff-header"><span>File 1 / Original</span><span>File 2 / Updated</span></div>
            {rows.length === 0 ? <p className="compare-online-empty">The documents are identical.</p> : rows.map((row, index) => (
              <div className={`compare-online-diff-row compare-online-diff-row--${row.type}`} key={`${row.type}-${row.leftNumber ?? 'x'}-${row.rightNumber ?? 'x'}-${index}`}>
                <div className="compare-online-diff-cell"><span>{row.leftNumber ?? ''}</span><code>{row.left}</code></div>
                <div className="compare-online-diff-cell"><span>{row.rightNumber ?? ''}</span><code>{row.right}</code></div>
              </div>
            ))}
          </div>
        )}
      </section>

      <details className="compare-online-help">
        <summary>How to use Compare Online</summary>
        <p>Select JSON, XML, or HTML, then paste two versions of the same document type. Use <strong>Pretty-print before compare</strong> to reduce indentation noise, choose 2, 3, or 4 spaces, and leave validation enabled when you want syntax errors identified before comparison.</p>
        <ul>
          <li><strong>JSON:</strong> compares formatted object and array text after native JSON parsing.</li>
          <li><strong>XML:</strong> checks well-formed markup and formats nested elements for easier review.</li>
          <li><strong>HTML:</strong> parses browser HTML and formats tags into readable lines for a practical source diff.</li>
          <li>Red rows are present only in File 1. Green rows are present only in File 2. Neutral rows are shared.</li>
          <li>All processing happens in this page; pasted documents are not sent to a comparison server.</li>
        </ul>
      </details>
    </main>
  );
}
