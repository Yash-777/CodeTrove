import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Check, Clipboard, Copy, FileDiff, FileUp, RotateCcw } from 'lucide-react';
import { compareText, copyableLines } from '../../utils/textDiff.js';
import './TextComparePage.css';

const SAMPLE_LEFT = `function greet(name) {
  const message = "Hello, " + name;
  return message;
}

console.log(greet("Alice"));`;

const SAMPLE_RIGHT = `function greet(name, punctuation = "!") {
  const message = \`Hello, \${name}\${punctuation}\`;
  return message;
}

console.log(greet("Alice"));
console.log(greet("Bob", "?"));`;

function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function TextComparePage() {
  const [leftText, setLeftText] = useState(SAMPLE_LEFT);
  const [rightText, setRightText] = useState(SAMPLE_RIGHT);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [changedOnly, setChangedOnly] = useState(false);
  const [copied, setCopied] = useState('');
  const leftFileRef = useRef(null);
  const rightFileRef = useRef(null);

  const result = useMemo(
    () => compareText(leftText, rightText, { ignoreWhitespace, ignoreCase }),
    [leftText, rightText, ignoreWhitespace, ignoreCase],
  );
  const visibleRows = changedOnly ? result.changedRows : result.rows;

  async function copyText(label, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(''), 1600);
    } catch {
      setCopied('Copy unavailable');
    }
  }

  function loadFile(event, setText) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ''));
    reader.readAsText(file);
    event.target.value = '';
  }

  function reset() {
    setLeftText('');
    setRightText('');
    setIgnoreWhitespace(false);
    setIgnoreCase(false);
    setChangedOnly(false);
  }

  function loadSample() {
    setLeftText(SAMPLE_LEFT);
    setRightText(SAMPLE_RIGHT);
  }

  return (
    <div className="text-compare-page">
      <div className="text-compare-page__topbar">
        <Link to="/build/tools" className="text-compare-page__back"><ArrowLeftRight size={16} /> Back to Tools</Link>
        <span className="text-compare-page__local-note"><FileDiff size={15} /> Runs locally in your browser</span>
      </div>

      <header className="text-compare-page__header">
        <div>
          <p className="text-compare-page__eyebrow">TEXT / FILE UTILITIES</p>
          <h1>Text Compare Pro</h1>
          <p>Compare two text files or code snippets with aligned line numbers, clear change colors, and copy-ready results.</p>
        </div>
        <div className="text-compare-page__actions">
          <button type="button" className="text-compare-button text-compare-button--secondary" onClick={loadSample}><FileDiff size={16} /> Load sample</button>
          <button type="button" className="text-compare-button text-compare-button--secondary" onClick={reset}><RotateCcw size={16} /> Clear</button>
        </div>
      </header>

      <section className="text-compare-card text-compare-card--inputs" aria-label="Comparison inputs">
        <div className="text-compare-input-head">
          <div>
            <span className="text-compare-label text-compare-label--left">File 1 / Original</span>
            <span className="text-compare-helper">Lines removed from File 1 are highlighted red.</span>
          </div>
          <div className="text-compare-input-actions">
            <input ref={leftFileRef} type="file" accept=".txt,.md,.json,.xml,.html,.css,.js,.jsx,.ts,.tsx,.java,.py,.csv" hidden onChange={(event) => loadFile(event, setLeftText)} />
            <button type="button" className="text-compare-icon-button" onClick={() => leftFileRef.current?.click()} title="Load File 1"><FileUp size={16} /> Load file</button>
            <button type="button" className="text-compare-icon-button" onClick={() => copyText('File 1', leftText)} title="Copy File 1"><Copy size={16} /> Copy</button>
          </div>
        </div>
        <textarea aria-label="File 1 original text" value={leftText} onChange={(event) => setLeftText(event.target.value)} spellCheck="false" />

        <div className="text-compare-input-head">
          <div>
            <span className="text-compare-label text-compare-label--right">File 2 / Updated</span>
            <span className="text-compare-helper">Lines added to File 2 are highlighted green.</span>
          </div>
          <div className="text-compare-input-actions">
            <input ref={rightFileRef} type="file" accept=".txt,.md,.json,.xml,.html,.css,.js,.jsx,.ts,.tsx,.java,.py,.csv" hidden onChange={(event) => loadFile(event, setRightText)} />
            <button type="button" className="text-compare-icon-button" onClick={() => rightFileRef.current?.click()} title="Load File 2"><FileUp size={16} /> Load file</button>
            <button type="button" className="text-compare-icon-button" onClick={() => copyText('File 2', rightText)} title="Copy File 2"><Copy size={16} /> Copy</button>
          </div>
        </div>
        <textarea aria-label="File 2 updated text" value={rightText} onChange={(event) => setRightText(event.target.value)} spellCheck="false" />
      </section>

      <section className="text-compare-toolbar" aria-label="Comparison options">
        <label><input type="checkbox" checked={ignoreWhitespace} onChange={(event) => setIgnoreWhitespace(event.target.checked)} /> Ignore whitespace</label>
        <label><input type="checkbox" checked={ignoreCase} onChange={(event) => setIgnoreCase(event.target.checked)} /> Ignore case</label>
        <label><input type="checkbox" checked={changedOnly} onChange={(event) => setChangedOnly(event.target.checked)} /> Show changed lines only</label>
        <button type="button" className="text-compare-button text-compare-button--swap" onClick={() => { setLeftText(rightText); setRightText(leftText); }}><ArrowLeftRight size={16} /> Swap files</button>
        <span className="text-compare-status" role="status">{copied ? <><Check size={15} /> {copied} copied</> : `${result.additions} added · ${result.removals} removed · ${result.unchanged} unchanged`}</span>
      </section>

      <section className="text-compare-card text-compare-card--diff" aria-label="Comparison result">
        <div className="text-compare-result-head">
          <div><strong>Comparison result</strong><span>{visibleRows.length} visible lines</span></div>
          <div className="text-compare-result-actions">
            <button type="button" className="text-compare-icon-button" onClick={() => copyText('changed lines', copyableLines(result.rows, 'right', true))}><Clipboard size={16} /> Copy changed lines</button>
            <button type="button" className="text-compare-icon-button" onClick={() => downloadText('codetrove-diff.txt', visibleRows.map((row) => `${row.type === 'add' ? '+' : row.type === 'remove' ? '-' : ' '} ${row.type === 'add' ? row.right : row.left}`).join('\n'))}><FileDiff size={16} /> Export diff</button>
          </div>
        </div>
        <div className="text-compare-legend"><span className="legend-add">Added to File 2</span><span className="legend-remove">Removed from File 1</span><span className="legend-equal">Unchanged</span></div>
        <div className="text-compare-diff-table">
          <div className="text-compare-diff-header"><span>File 1</span><span>File 2</span></div>
          {visibleRows.length === 0 ? <p className="text-compare-empty">Enter text in either editor to start comparing.</p> : visibleRows.map((row, index) => (
            <div className={`text-compare-diff-row text-compare-diff-row--${row.type}`} key={`${row.type}-${row.leftNumber ?? 'x'}-${row.rightNumber ?? 'x'}-${index}`}>
              <div className="text-compare-diff-cell"><span className="text-compare-line-number">{row.leftNumber ?? ''}</span><code>{row.left}</code></div>
              <div className="text-compare-diff-cell"><span className="text-compare-line-number">{row.rightNumber ?? ''}</span><code>{row.right}</code></div>
            </div>
          ))}
        </div>
      </section>

      <details className="text-compare-help">
        <summary>How to use Text Compare Pro</summary>
        <ul>
          <li>Paste text into both editors or load local files. Files are read in the browser and are not uploaded.</li>
          <li>Red rows exist only in File 1; green rows exist only in File 2; neutral rows are unchanged.</li>
          <li>Use Ignore whitespace or Ignore case when formatting or capitalization should not create noise.</li>
          <li>Copy the complete file, only changed File 2 lines, or export the visible comparison as a text diff.</li>
        </ul>
      </details>
    </div>
  );
}
