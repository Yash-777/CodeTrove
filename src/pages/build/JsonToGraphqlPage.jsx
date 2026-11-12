import { useMemo, useState } from 'react';
import { Check, Copy, Download, FileJson, Sparkles, Trash2 } from 'lucide-react';
import ToolBackLink from '../../components/ToolBackLink.jsx';
import { copyToClipboard } from '../../utils/textActions.js';
import { convertJsonToGraphql, JSON_TO_GRAPHQL_SAMPLE } from '../../utils/jsonToGraphql.js';
import './JsonToGraphqlPage.css';

function CopyButton({ value, label = 'Copy GraphQL' }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!value) return;
    if (await copyToClipboard(value)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  };
  return <button type="button" className={`j2g-icon-button${copied ? ' is-copied' : ''}`} onClick={copy} disabled={!value} aria-label={copied ? 'Copied' : label} title={copied ? 'Copied' : label}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>;
}

function downloadText(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function JsonToGraphqlPage() {
  const [input, setInput] = useState(JSON_TO_GRAPHQL_SAMPLE);
  const [rootTypeName, setRootTypeName] = useState('UserData');
  const [makeFieldsNullable, setMakeFieldsNullable] = useState(false);
  const [generateQuery, setGenerateQuery] = useState(true);
  const [notice, setNotice] = useState('');
  const result = useMemo(() => {
    try {
      return { ...convertJsonToGraphql(input, { rootTypeName, makeFieldsNullable, generateQuery }), error: '' };
    } catch (error) {
      return { schema: '', query: '', error: error.message || 'Could not convert JSON.' };
    }
  }, [input, rootTypeName, makeFieldsNullable, generateQuery]);
  const output = [result.schema, result.query].filter(Boolean).join('\n\n');

  const loadSample = () => { setInput(JSON_TO_GRAPHQL_SAMPLE); setRootTypeName('UserData'); setNotice('Sample JSON loaded.'); };
  const clear = () => { setInput(''); setNotice('Input cleared.'); };
  const download = () => { if (output) downloadText(output, `${rootTypeName || 'generated-schema'}.graphql`); };

  return (
    <main className="j2g-page">
      <ToolBackLink />
      <header className="j2g-intro">
        <span className="j2g-eyebrow">BUILD / TOOLS / WEB</span>
        <h1><FileJson size={30} aria-hidden="true" /> JSON to GraphQL Schema Converter</h1>
        <p>Generate GraphQL type definitions and an example query from JSON data. Everything runs locally in your browser; your JSON is not uploaded.</p>
      </header>

      <section className="j2g-workspace" aria-label="JSON to GraphQL converter">
        <div className="j2g-settings">
          <label><span>Root type name</span><input value={rootTypeName} onChange={(event) => setRootTypeName(event.target.value)} placeholder="RootType" /></label>
          <label className="j2g-check"><input type="checkbox" checked={makeFieldsNullable} onChange={(event) => setMakeFieldsNullable(event.target.checked)} /> Make fields nullable</label>
          <label className="j2g-check"><input type="checkbox" checked={generateQuery} onChange={(event) => setGenerateQuery(event.target.checked)} /> Generate query example</label>
          <span className="j2g-settings-spacer" />
          <button type="button" className="j2g-button" onClick={loadSample}><Sparkles size={15} /> Sample</button>
          <button type="button" className="j2g-button" onClick={clear}><Trash2 size={15} /> Clear</button>
        </div>

        <div className="j2g-panes">
          <section className="j2g-pane">
            <div className="j2g-pane__bar"><strong>Input JSON</strong><span>Paste an object or array</span></div>
            <textarea className="j2g-editor" value={input} onChange={(event) => { setInput(event.target.value); setNotice(''); }} spellCheck="false" placeholder="{\n  &quot;id&quot;: 1,\n  &quot;name&quot;: &quot;Example&quot;\n}" aria-label="Input JSON" />
            <div className="j2g-pane__footer">{input.length.toLocaleString()} characters</div>
          </section>
          <section className="j2g-pane">
            <div className="j2g-pane__bar"><strong>GraphQL Schema Output</strong><div className="j2g-pane__actions"><CopyButton value={output} /><button type="button" className="j2g-icon-button" onClick={download} disabled={!output} aria-label="Download GraphQL" title="Download GraphQL"><Download size={16} /></button></div></div>
            <textarea className={`j2g-editor j2g-editor--output${result.error ? ' has-error' : ''}`} value={result.error || output} readOnly aria-label="GraphQL schema output" />
            <div className="j2g-pane__footer">{result.error ? 'Fix the JSON to generate output' : `${output.length.toLocaleString()} characters · ${result.rootType || 'No type'}`}</div>
          </section>
        </div>
        <div className={`j2g-status${result.error ? ' is-error' : ''}`} role="status" aria-live="polite">{result.error || notice || 'JSON types are mapped to GraphQL scalars; nested objects become custom types and arrays become lists.'}</div>
      </section>

      <section className="j2g-about" aria-labelledby="j2g-about-title">
        <span className="j2g-eyebrow">QUICK REFERENCE</span>
        <h2 id="j2g-about-title">How JSON becomes GraphQL</h2>
        <p>GraphQL schemas describe the shape of data. This converter infers a practical schema from representative JSON values and adds a <code>Query.data</code> field so the generated query has a valid root selection.</p>
        <div className="j2g-type-grid">
          <article><strong>String</strong><span>JSON text → <code>String</code></span></article>
          <article><strong>Integer</strong><span>Whole number → <code>Int</code></span></article>
          <article><strong>Decimal</strong><span>Fractional number → <code>Float</code></span></article>
          <article><strong>Boolean</strong><span>true / false → <code>Boolean</code></span></article>
          <article><strong>Object</strong><span>Nested object → a named <code>type</code></span></article>
          <article><strong>Array</strong><span>List of values → <code>[Type]</code></span></article>
        </div>
        <h3>Nullability and generated queries</h3>
        <p>By default, fields inferred from present values are non-null with <code>!</code>. Enable <strong>Make fields nullable</strong> when your API may omit values or return null. The query example selects nested fields without selecting scalar leaves as subfields.</p>
        <pre className="j2g-sample">{JSON_TO_GRAPHQL_SAMPLE}</pre>
        <p className="j2g-privacy">Runs locally in your browser. Generated output is a starting point: review field names, nullability, IDs, and list shapes against your real API contract.</p>
      </section>
    </main>
  );
}
