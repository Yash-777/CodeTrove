import { useMemo, useState } from 'react';
import { Check, Copy, Download, FileCode2, Sparkles, Trash2 } from 'lucide-react';
import ToolBackLink from '../../components/ToolBackLink.jsx';
import { copyToClipboard } from '../../utils/textActions.js';
import { JAVA_JSON_SAMPLE, javaToJson, jsonToJava } from '../../utils/javaJsonConverter.js';
import './JavaJsonConverterPage.css';

const JAVA_SAMPLE = `public record ToolSummary(\n    Integer id,\n    String name,\n    Boolean active\n) {\n}`;

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (value && await copyToClipboard(value)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  };
  return <button type="button" className={`jj-icon-button${copied ? ' is-copied' : ''}`} onClick={copy} disabled={!value} title={copied ? 'Copied' : 'Copy output'} aria-label={copied ? 'Copied' : 'Copy output'}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>;
}

function downloadText(value, filename) {
  const url = URL.createObjectURL(new Blob([value], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function JavaJsonConverterPage() {
  const [mode, setMode] = useState('json-to-java');
  const [syntax, setSyntax] = useState('json5');
  const [kind, setKind] = useState('pojo');
  const [lombok, setLombok] = useState(false);
  const [className, setClassName] = useState('ToolPayload');
  const [input, setInput] = useState(JAVA_JSON_SAMPLE);
  const [notice, setNotice] = useState('');
  const result = useMemo(() => {
    try {
      if (mode === 'json-to-java') return { value: jsonToJava(input, { syntax, kind, lombok, className }).code, error: '' };
      return { value: javaToJson(input).json, error: '' };
    } catch (error) { return { value: '', error: error.message || 'Conversion failed.' }; }
  }, [mode, syntax, kind, lombok, className, input]);

  const loadSample = () => { const next = mode === 'json-to-java' ? JAVA_JSON_SAMPLE : JAVA_SAMPLE; setInput(next); setNotice('CodeTrove sample loaded.'); };
  const clear = () => { setInput(''); setNotice('Input cleared.'); };
  const swap = () => { setMode((current) => current === 'json-to-java' ? 'java-to-json' : 'json-to-java'); setInput(mode === 'json-to-java' ? JAVA_SAMPLE : JAVA_JSON_SAMPLE); setNotice('Conversion direction changed.'); };
  const download = () => { if (result.value) downloadText(result.value, mode === 'json-to-java' ? `${className || 'ToolPayload'}.java` : 'codetrove-sample.json'); };

  return (
    <main className="jj-page">
      <ToolBackLink />
      <header className="jj-intro">
        <span className="jj-eyebrow">BUILD / TOOLS / JAVA</span>
        <h1><FileCode2 size={30} aria-hidden="true" /> JSON ⇄ Java Converter</h1>
        <p>Generate a Java POJO or Record from JSON/JSON5, or turn a Java declaration into a representative JSON payload. Examples use CodeTrove tool data and all processing stays in your browser.</p>
      </header>
      <section className="jj-workspace" aria-label="JSON and Java converter">
        <div className="jj-toolbar" role="tablist" aria-label="Conversion direction">
          <button type="button" role="tab" aria-selected={mode === 'json-to-java'} className={mode === 'json-to-java' ? 'is-active' : ''} onClick={() => { setMode('json-to-java'); setInput(JAVA_JSON_SAMPLE); }}>JSON → Java</button>
          <button type="button" role="tab" aria-selected={mode === 'java-to-json'} className={mode === 'java-to-json' ? 'is-active' : ''} onClick={() => { setMode('java-to-json'); setInput(JAVA_SAMPLE); }}>Java → JSON</button>
          <span className="jj-toolbar__spacer" />
          <button type="button" className="jj-button" onClick={swap}>⇄ Swap</button>
          <button type="button" className="jj-button" onClick={loadSample}><Sparkles size={15} /> Sample</button>
          <button type="button" className="jj-button" onClick={clear}><Trash2 size={15} /> Clear</button>
        </div>
        {mode === 'json-to-java' && <div className="jj-options">
          <label><span>JSON syntax</span><select value={syntax} onChange={(event) => setSyntax(event.target.value)}><option value="json">JSON</option><option value="json5">JSON5</option></select></label>
          <label><span>Java output</span><select value={kind} onChange={(event) => setKind(event.target.value)}><option value="pojo">POJO class</option><option value="record">Record</option></select></label>
          <label><span>Root class</span><input value={className} onChange={(event) => setClassName(event.target.value)} /></label>
          <label className="jj-check"><input type="checkbox" checked={lombok} onChange={(event) => setLombok(event.target.checked)} /> Lombok annotations</label>
        </div>}
        <div className="jj-panes">
          <section className="jj-pane"><div className="jj-pane__bar"><strong>{mode === 'json-to-java' ? `Input ${syntax.toUpperCase()}` : 'Input Java'}</strong><span>{mode === 'json-to-java' ? 'JSON or JSON5 object' : 'POJO fields or record components'}</span></div><textarea className="jj-editor" value={input} onChange={(event) => { setInput(event.target.value); setNotice(''); }} spellCheck="false" aria-label="Converter input" /><div className="jj-pane__footer">{input.length.toLocaleString()} characters</div></section>
          <section className="jj-pane"><div className="jj-pane__bar"><strong>{mode === 'json-to-java' ? 'Generated Java' : 'Generated JSON'}</strong><div className="jj-pane__actions"><CopyButton value={result.value} /><button type="button" className="jj-icon-button" onClick={download} disabled={!result.value} title="Download output" aria-label="Download output"><Download size={16} /></button></div></div><textarea className={`jj-editor jj-editor--output${result.error ? ' has-error' : ''}`} value={result.error || result.value} readOnly aria-label="Converter output" /><div className="jj-pane__footer">{result.error ? 'Fix the input to generate output' : `${result.value.length.toLocaleString()} characters`}</div></section>
        </div>
        <div className={`jj-status${result.error ? ' is-error' : ''}`} role="status" aria-live="polite">{result.error || notice || (mode === 'json-to-java' ? 'Nested objects become Java types, arrays become List<T>, and JSON5 comments are accepted when JSON5 is selected.' : 'Java fields are mapped to representative JSON values so you can quickly create a payload skeleton.')}</div>
      </section>
      <section className="jj-about" aria-labelledby="jj-about-title">
        <span className="jj-eyebrow">CODETROVE GUIDE</span><h2 id="jj-about-title">POJO, Record, and Lombok choices</h2>
        <p>A POJO is a mutable Java class with fields and accessor methods. A Record is a compact immutable data carrier. Lombok annotations keep the POJO concise by generating accessors and constructors at compile time; add Lombok to your build before using the generated annotations.</p>
        <div className="jj-cards"><article><strong>POJO</strong><span>Private fields plus getters and setters. Best for mutable DTOs and older Java frameworks.</span></article><article><strong>Record</strong><span>Compact final components with generated accessors. Best for immutable request and response data.</span></article><article><strong>Lombok</strong><span><code>@Data</code>, <code>@NoArgsConstructor</code>, and <code>@AllArgsConstructor</code> reduce boilerplate in POJOs.</span></article></div>
        <h3>CodeTrove sample</h3><pre className="jj-sample">{JAVA_JSON_SAMPLE}</pre>
        <p className="jj-note">JSON5 accepts comments, trailing commas, unquoted keys, and single-quoted strings. Choose standard JSON when the receiving API requires strict JSON. Review generated field names and types before using the class in production.</p>
      </section>
    </main>
  );
}
