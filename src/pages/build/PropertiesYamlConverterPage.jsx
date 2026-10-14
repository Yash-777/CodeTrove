import { useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { StreamLanguage } from '@codemirror/language';
import { properties } from '@codemirror/legacy-modes/mode/properties';
import { yaml } from '@codemirror/legacy-modes/mode/yaml';
import { javascript } from '@codemirror/legacy-modes/mode/javascript';
import { Check, Copy, Download, ArrowLeftRight } from 'lucide-react';
import { CONFIG_FORMATS, SAMPLE_PROPERTIES, ConfigConvertError, convertConfig, formatConfig, parseConfig, stringifyConfig } from '../../utils/configFormatConverter.js';
import { copyToClipboard, downloadTextFile } from '../../utils/textActions.js';
import '../../components/CodeRunner/RunnableCode.css';
import './CompilerPage.css';
import './PomFormatterPage.css';
import './PropertiesYamlConverterPage.css';

const LANGUAGES = {
  properties: StreamLanguage.define(properties),
  yaml: StreamLanguage.define(yaml),
  json: StreamLanguage.define(javascript),
};
const FORMATS = ['properties', 'yaml', 'json'];
const INDENTS = { properties: [0], yaml: [2], json: [2, 3, 4] };
const SOURCE_HINTS = {
  properties: 'Paste application.properties content here, or press Sample.',
  yaml: 'Paste application.yml content here, or press Sample.',
  json: 'Paste application.json content here, or press Sample.',
};

function CopyButton({ text, label, disabled }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (await copyToClipboard(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return <button type="button" className={`runnable-code__icon-button${copied ? ' is-copied' : ''}`} onClick={copy} disabled={disabled} title="Copy to clipboard" aria-label={copied ? "Copied to clipboard" : label}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>;
}

function FilePill({ format }) {
  const item = CONFIG_FORMATS[format];
  return <span className="runnable-code__file" title={item.label}><span className="runnable-code__badge prop-badge">{item.badge}</span><span className="runnable-code__file-name">{item.file}</span></span>;
}

function Editor({ value, onChange, format, readOnly = false, placeholderText, label }) {
  const extensions = useMemo(() => [LANGUAGES[format]], [format]);
  return <CodeMirror value={value} theme={oneDark} extensions={extensions} onChange={onChange} readOnly={readOnly} height="410px" basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: !readOnly }} placeholder={placeholderText} aria-label={label} />;
}

function sampleFor(format) {
  if (format === 'properties') return SAMPLE_PROPERTIES;
  const value = parseConfig(SAMPLE_PROPERTIES, 'properties', { writeNestedKeys: true });
  return stringifyConfig(value, format, { indent: 2 });
}

export default function PropertiesYamlConverterPage() {
  const [sourceFormat, setSourceFormat] = useState('properties');
  const [targetFormat, setTargetFormat] = useState('yaml');
  const [input, setInput] = useState(SAMPLE_PROPERTIES);
  const [output, setOutput] = useState('');
  const [writeNestedKeys, setWriteNestedKeys] = useState(false);
  const [indent, setIndent] = useState(2);
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  const source = CONFIG_FORMATS[sourceFormat];
  const target = CONFIG_FORMATS[targetFormat];
  const heading = `Convert between ${source.label} and ${target.label} online`;
  const sourceFile = source.file;
  const targetFile = target.file;

  const options = { writeNestedKeys, indent };
  const validate = () => {
    try {
      const value = parseConfig(input, sourceFormat, options);
      setStatus({ type: 'ok', message: `✓ Valid ${source.label} source. ${value && typeof value === 'object' ? Object.keys(value).length + ' top-level entr' + (Object.keys(value).length === 1 ? 'y' : 'ies') + '.' : 'Valid document.'}` });
      return true;
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof ConfigConvertError ? error.message : `Validation failed: ${error?.message || error}` });
      return false;
    }
  };
  const convert = () => {
    try {
      const result = convertConfig(input, sourceFormat, targetFormat, options);
      setOutput(result.output);
      setStatus({ type: 'ok', message: `✓ Converted ${sourceFile} → ${targetFile}.` });
    } catch (error) {
      setOutput('');
      setStatus({ type: 'error', message: error instanceof ConfigConvertError ? error.message : `Conversion failed: ${error?.message || error}` });
    }
  };
  const formatSource = () => {
    try {
      setInput(formatConfig(input, sourceFormat, options));
      setStatus({ type: 'ok', message: `✓ Formatted ${sourceFile}.` });
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof ConfigConvertError ? error.message : `Format failed: ${error?.message || error}` });
    }
  };
  const clear = () => { setInput(''); setOutput(''); setStatus({ type: 'idle', message: '' }); };
  const loadSample = () => {
    try { setInput(sampleFor(sourceFormat)); setOutput(''); setStatus({ type: 'idle', message: '' }); }
    catch (error) { setStatus({ type: 'error', message: error.message }); }
  };
  const changeTarget = (format) => {
    setTargetFormat(format);
    const allowed = INDENTS[format];
    if (!allowed.includes(Number(indent))) setIndent(allowed[0]);
    setOutput('');
    setStatus({ type: 'idle', message: '' });
  };
  const swapFormats = () => {
    setSourceFormat(targetFormat);
    setTargetFormat(sourceFormat);
    if (output.trim()) setInput(output);
    setOutput('');
    const allowed = INDENTS[sourceFormat];
    if (!allowed.includes(Number(indent))) setIndent(allowed[0]);
    setStatus({ type: 'idle', message: '' });
  };

  return (
    <div className="content-page cp-page prop-page">
      <div className="cp-head">
        <div><h1>{heading}</h1><p className="cp-subtitle">Convert Java Properties, YAML, and JSON configuration files in your browser.</p></div>
        <div className="cp-links"><a className="cp-link" href="https://yaml.org/" target="_blank" rel="noreferrer">YAML docs</a><a className="cp-link" href="https://www.json.org/" target="_blank" rel="noreferrer">JSON docs</a></div>
      </div>

      <section className="runnable-code runnable-code--playground prop-card" aria-label="Properties YAML JSON converter">
        <div className="runnable-code__header prop-toolbar">
          <label className="prop-format-select"><span>Source Format</span><select value={sourceFormat} onChange={(event) => { setSourceFormat(event.target.value); setStatus({ type: 'idle', message: '' }); }} aria-label="Source Format">{FORMATS.map((format) => <option key={format} value={format}>{CONFIG_FORMATS[format].label} ({format === 'properties' ? '.properties' : format === 'yaml' ? '.yml' : '.json'})</option>)}</select></label>
          <button type="button" className="pom-switch" onClick={swapFormats} title="Swap source and target formats" aria-label="Swap source and target formats"><ArrowLeftRight size={18} /></button>
          <label className="prop-format-select"><span>Target Format</span><select value={targetFormat} onChange={(event) => changeTarget(event.target.value)} aria-label="Target Format">{FORMATS.map((format) => <option key={format} value={format}>{CONFIG_FORMATS[format].label} ({format === 'properties' ? '.properties' : format === 'yaml' ? '.yml' : '.json'})</option>)}</select></label>
          <label className="runnable-code__target prop-indent"><span>Indent</span><select value={indent} onChange={(event) => setIndent(Number(event.target.value))} aria-label="Output indentation">{INDENTS[targetFormat].map((spaces) => <option key={spaces} value={spaces}>{spaces === 0 ? '0 (flat)' : `${spaces} spaces`}</option>)}</select></label>
          <div className="runnable-code__actions prop-primary-actions">
            <button type="button" className="runnable-code__button" onClick={validate} title="Validate Before Converting">Validate</button>
            <button type="button" className="runnable-code__button" onClick={formatSource} title="Format source content">Format</button>
            <button type="button" className="runnable-code__button runnable-code__button--run" onClick={convert} title="Convert (Ctrl/Cmd + Enter)">Convert</button>
          </div>
        </div>

        <div className="prop-options">
          <label><input type="checkbox" checked={writeNestedKeys} onChange={(event) => setWriteNestedKeys(event.target.checked)} /> <span>Write nested keys</span></label>
          <span className="prop-options__hint">When enabled, dotted keys such as <code>a.b.c</code> become nested objects.</span>
        </div>

        <div className="pom-panes prop-panes">
          <div className="pom-pane">
            <div className="pom-pane__bar"><FilePill format={sourceFormat} /><div className="runnable-code__actions"><CopyButton text={input} label="Copy source" disabled={!input} /><button type="button" className="runnable-code__button" onClick={clear} disabled={!input} title="Clear source">Clear</button>{input === '' && <button type="button" className="runnable-code__button pom-sample" onClick={loadSample}>Sample</button>}</div></div>
            <Editor value={input} onChange={setInput} format={sourceFormat} placeholderText={SOURCE_HINTS[sourceFormat]} label={`${source.label} source editor`} />
          </div>
          <div className="pom-pane pom-pane--output">
            <div className="pom-pane__bar"><FilePill format={targetFormat} /><div className="runnable-code__actions"><CopyButton text={output} label="Copy converted output" disabled={!output} /><button type="button" className="runnable-code__icon-button" onClick={() => downloadTextFile(targetFile, output)} disabled={!output} title={`Download ${targetFile}`} aria-label={`Download ${targetFile}`}><Download size={16} /></button></div></div>
            <Editor value={output} format={targetFormat} readOnly placeholderText={`Converted ${targetFile} appears here…`} label={`${target.label} output editor`} />
          </div>
        </div>
        <div className={`pom-status${status.type === 'error' ? ' pom-status--error' : status.type === 'ok' ? ' pom-status--ok' : ''}`} role="status" aria-live="polite">{status.message || <span className="pom-status__idle">Validate the source before converting, or press Convert to create {targetFile}.</span>}</div>
      </section>

      <section className="cp-about prop-about">
        <h2>{heading}</h2>
        <p>JSON, YAML, and .properties are the three most common formats for application configuration across virtually every tech stack. REST APIs and config services use JSON, Docker Compose, Kubernetes, Ansible, and CI/CD pipelines (GitHub Actions, GitLab CI) use YAML, while Java and Gradle projects typically use .properties. These formats regularly need to cross boundaries — this tool converts instantly between all three, in any direction.</p>
        <p>YAML translation files use indentation instead of braces, which makes them easy to read and diff. Ruby on Rails, Symfony and many static site generators keep their locale files in YAML.</p>
        <p><strong>Note:</strong> YAML indentation uses 2 spaces. JSON output supports 2, 3, or 4 spaces; Java Properties uses flat key-value lines.</p>
        <h3>What changes between Java Properties and YAML</h3>
        <p>Keys are written flat by default. Enable <strong>Write nested keys</strong> to turn <code>a.b.c</code> into nested objects. Indexed keys such as <code>config[0].name</code> can become arrays when nested-key writing is enabled.</p>
        <h3>Java .properties</h3>
        <p>Key=value resource bundles used by Java, Spring Boot and Kotlin backends. Each language lives in its own <code>messages_xx.properties</code> file next to the default bundle.</p>
        <h3>JSON</h3>
        <p>JavaScript Object Notation (JSON) is an open standard text format for storing and transmitting data objects made of attribute-value pairs and arrays. It is widely used in APIs and data interchange, including as a replacement for XML in AJAX systems.</p>
        <h3>Key Features</h3>
        <ol><li><strong>All six conversion directions:</strong> Properties → YAML, Properties → JSON, YAML → Properties, YAML → JSON, JSON → Properties, and JSON → YAML.</li><li><strong>Validate before converting:</strong> catch malformed properties, YAML, or JSON without changing the output.</li><li><strong>Format and copy:</strong> normalize source content, copy either pane, or download the result using its matching application filename.</li><li><strong>Browser-only processing:</strong> content stays in your browser; no backend is required, so it works on GitHub Pages.</li></ol>
      </section>
      <p className="cp-note">Runs locally in your browser. Nothing you paste here is uploaded.</p>
    </div>
  );
}
