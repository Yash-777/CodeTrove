/**
 * src/pages/build/PomFormatterPage.jsx
 * ------------------------------------------------------------------
 * Route: /build/tools/pom-formatter   (deep link: ?tab=pom)
 * Java -> Maven POM Formatter. Two tabs, laid out like the online compiler
 * (/build/compiler) and reusing its header / button / editor styling:
 *
 *   Dependencies   Maven <dependency> XML  ⇄  custom build notation
 *                  scope:optional('group:artifact:version:classifier@type') { exclude ... }
 *   POM Formatter  pretty-print a whole pom.xml with 2 / 3 / 4 space indent
 *
 * Everything runs in the browser (utils/pomConverter.js); nothing is uploaded.
 * Both tabs stay mounted so switching tabs keeps what you typed.
 */

import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { StreamLanguage } from '@codemirror/language';
import { xml } from '@codemirror/legacy-modes/mode/xml';
import { groovy } from '@codemirror/legacy-modes/mode/groovy';
import { keymap, placeholder } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { Check, Copy, Download } from 'lucide-react';
import {
  convert,
  CUSTOM_TEMPLATE,
  XML_TEMPLATE,
  SAMPLE_XML,
  SAMPLE_CUSTOM,
  SAMPLE_POM,
} from '../../utils/pomConverter.js';
import { copyToClipboard, downloadTextFile } from '../../utils/textActions.js';
import '../../components/CodeRunner/RunnableCode.css'; // header, buttons, select: same look as the compiler
import './CompilerPage.css'; // tabs, page header, "about" card
import './PomFormatterPage.css';

const XML_LANGUAGE = StreamLanguage.define(xml);
const GROOVY_LANGUAGE = StreamLanguage.define(groovy);
const INDENTS = [2, 3, 4];

/** The text formats the tool reads and writes. */
const FORMATS = {
  xml: { label: 'Dependencies XML', file: 'dependency.xml', badge: 'XML', language: XML_LANGUAGE, template: XML_TEMPLATE, sample: SAMPLE_XML, hint: 'Paste Maven <dependency> XML here, or press Sample.' },
  custom: { label: 'Custom Build Format', file: 'dependency.custom', badge: 'CB', language: GROOVY_LANGUAGE, template: CUSTOM_TEMPLATE, sample: SAMPLE_CUSTOM, hint: "Paste scope:optional('group:artifact:version@type') here, or press Sample." },
  pom: { label: 'POM XML', file: 'pom.xml', badge: 'XML', language: XML_LANGUAGE, template: '<!-- The formatted POM appears here after Format -->', sample: SAMPLE_POM, hint: 'Paste a pom.xml (or any XML) here, or press Sample.' },
};

const TABS = [
  {
    key: 'dependency',
    param: 'dependency',
    label: 'Dependencies',
    title: 'Maven Dependency Converter',
    subtitle: 'Convert a Maven <dependency> block to a compact custom build line - and back.',
  },
  {
    key: 'pom',
    param: 'pom',
    label: 'POM Formatter',
    title: 'Maven POM Formatter',
    subtitle: 'Pretty-print pom.xml with 2, 3 or 4 space indentation.',
  },
];

function pickTab(value) {
  const v = (value || '').toLowerCase();
  return TABS.find((tab) => tab.param === v || tab.key === v) || TABS[0];
}

/** Read-only or editable CodeMirror editor with an optional multi-line placeholder. */
function ToolEditor({ value, onChange, format, placeholderText, readOnly = false, onRun, label }) {
  const extensions = useMemo(() => {
    const list = [format.language];
    if (placeholderText) {
      list.push(placeholder(() => {
        const element = document.createElement('div');
        element.className = 'pom-placeholder';
        element.textContent = placeholderText;
        return element;
      }));
    }
    if (onRun) {
      list.push(Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => { onRun(); return true; } }])));
    }
    return list;
  }, [format, placeholderText, onRun]);

  return (
    <CodeMirror
      value={value}
      theme={oneDark}
      extensions={extensions}
      onChange={onChange}
      readOnly={readOnly}
      height="380px"
      basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: !readOnly }}
      aria-label={label}
    />
  );
}

function FilePill({ format }) {
  return (
    <span className="runnable-code__file" title={format.label}>
      <span className="runnable-code__badge pom-badge">{format.badge}</span>
      <span className="runnable-code__file-name">{format.file}</span>
    </span>
  );
}

function CopyButton({ text, label, disabled }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (await copyToClipboard(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <button type="button" className={`runnable-code__icon-button${copied ? ' is-copied' : ''}`} onClick={copy} disabled={disabled} title={copied ? 'Copied to clipboard' : label} aria-label={copied ? 'Copied to clipboard' : label}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

/**
 * One converter. kind="dependency": XML ⇄ custom with a direction switch.
 * kind="pom": single direction (format pom.xml).
 */
function Converter({ kind }) {
  const isPom = kind === 'pom';
  const [direction, setDirection] = useState(isPom ? 'format-pom' : 'xml-to-custom');
  const [input, setInput] = useState(isPom ? SAMPLE_POM : SAMPLE_XML);
  const [result, setResult] = useState(null); // { output, count, warnings }
  const [error, setError] = useState('');
  const [indent, setIndent] = useState(2);
  const [switched, setSwitched] = useState(false);

  const sourceKey = isPom ? 'pom' : direction === 'xml-to-custom' ? 'xml' : 'custom';
  const targetKey = isPom ? 'pom' : direction === 'xml-to-custom' ? 'custom' : 'xml';
  const source = FORMATS[sourceKey];
  const target = FORMATS[targetKey];
  const outputIsXml = targetKey !== 'custom';

  const compute = (text, mode, spaces) => {
    try {
      setResult(convert(mode, text, { indent: spaces }));
      setError('');
    } catch (problem) {
      setResult(null);
      setError(problem?.name === 'PomConvertError' ? problem.message : `Unexpected error: ${problem?.message || problem}`);
    }
  };

  // Latest-value ref so the CodeMirror Ctrl/Cmd+Enter shortcut never runs stale state.
  const runRef = useRef();
  runRef.current = () => compute(input, direction, indent);
  const run = useMemo(() => () => runRef.current(), []);

  const clear = () => {
    setInput('');
    setResult(null);
    setError('');
  };

  const loadSample = () => {
    setInput(source.sample);
    setResult(null);
    setError('');
  };

  const changeIndent = (value) => {
    const spaces = Number(value);
    setIndent(spaces);
    if (result) compute(input, direction, spaces); // keep the output in step with the selector
  };

  const switchDirection = () => {
    const next = direction === 'xml-to-custom' ? 'custom-to-xml' : 'xml-to-custom';
    const nextSource = FORMATS[next === 'xml-to-custom' ? 'xml' : 'custom'];
    let nextInput = input;
    if (result) nextInput = result.output; // the output becomes the new input: ⇄ round trip
    else if (input.trim() === '') nextInput = '';
    else if (input.trim() === source.sample.trim()) nextInput = nextSource.sample;
    setDirection(next);
    setInput(nextInput);
    setResult(null);
    setError('');
    setSwitched((value) => !value);
  };

  const status = result
    ? `${isPom ? `Formatted ${plural(result.count, 'element', 'elements')}` : `Converted ${plural(result.count, 'dependency', 'dependencies')}`}${outputIsXml ? ` · ${indent}-space indent` : ''}`
    : '';

  return (
    <section className="runnable-code runnable-code--playground pom-card" aria-label={isPom ? 'POM formatter' : 'Dependency converter'}>
      <div className="runnable-code__header">
        {isPom ? (
          <span className="pom-direction"><span className="pom-direction__label">pom.xml</span><span className="pom-direction__arrow" aria-hidden="true">→</span><span className="pom-direction__label">Formatted pom.xml</span></span>
        ) : (
          <span className="pom-direction" role="group" aria-label="Conversion direction">
            <span className="pom-direction__label" data-testid="source-label">{source.label}</span>
            <button
              type="button"
              className={`pom-switch${switched ? ' is-flipped' : ''}`}
              onClick={switchDirection}
              title={`Switch to ${target.label} ⇄ ${source.label}`}
              aria-label={`Switch direction: ${target.label} to ${source.label}`}
            >
              ⇄
            </button>
            <span className="pom-direction__label" data-testid="target-label">{target.label}</span>
          </span>
        )}
        <div className="runnable-code__actions">
          {outputIsXml && (
            <label className="runnable-code__target" title="Spaces used for each indentation level of the XML output">
              <span>Indent</span>
              <select value={indent} onChange={(event) => changeIndent(event.target.value)} aria-label="XML indentation">
                {INDENTS.map((spaces) => <option key={spaces} value={spaces}>{spaces} spaces</option>)}
              </select>
            </label>
          )}
          <button type="button" className="runnable-code__button runnable-code__button--run" onClick={run} title="Convert (Ctrl/Cmd + Enter)">
            {isPom ? '▶ Format' : '▶ Convert'}
          </button>
        </div>
      </div>

      <div className="pom-panes">
        <div className="pom-pane">
          <div className="pom-pane__bar">
            <FilePill format={source} />
            <div className="runnable-code__actions">
              <CopyButton text={input} label="Copy input" disabled={!input} />
              <button type="button" className="runnable-code__button" onClick={clear} disabled={!input} title="Clear the input">Clear</button>
              {input === '' && (
                <button type="button" className="runnable-code__button pom-sample" onClick={loadSample} title="Insert example data">Sample</button>
              )}
            </div>
          </div>
          <ToolEditor
            value={input}
            onChange={setInput}
            format={source}
            placeholderText={source.hint}
            onRun={run}
            label={`${source.label} input`}
          />
        </div>

        <div className="pom-pane pom-pane--output">
          <div className="pom-pane__bar">
            <FilePill format={target} />
            <div className="runnable-code__actions">
              <CopyButton text={result?.output || ''} label="Copy output" disabled={!result} />
              <button
                type="button"
                className="runnable-code__icon-button"
                onClick={() => downloadTextFile(target.file, result.output)}
                disabled={!result}
                title={`Save as ${target.file}`}
                aria-label={`Save as ${target.file}`}
              >
                <Download size={16} />
              </button>
            </div>
          </div>
          <ToolEditor
            value={result?.output || ''}
            format={target}
            placeholderText={target.template}
            readOnly
            label={`${target.label} output`}
          />
        </div>
      </div>

      <div className={`pom-status${error ? ' pom-status--error' : result ? ' pom-status--ok' : ''}`} role="status" aria-live="polite">
        {error && <div>{error}</div>}
        {!error && result && <div>✓ {status}</div>}
        {!error && !result && <div className="pom-status__idle">Press {isPom ? 'Format' : 'Convert'} to see the result on the right.</div>}
        {result?.warnings.map((warning) => <div key={warning} className="pom-status__warn">⚠ {warning}</div>)}
      </div>
    </section>
  );
}

function About({ tab }) {
  if (tab.key === 'pom') {
    return (
      <section className="cp-about" aria-labelledby="pom-about-format">
        <h2 id="pom-about-format">About the POM formatter</h2>
        <p>
          Paste a <code>pom.xml</code> (or any XML), pick 2, 3 or 4 spaces and press <strong>Format</strong>. Each element
          goes on its own line, nesting is indented, text-only elements such as <code>&lt;version&gt;3.2.0&lt;/version&gt;</code>{' '}
          stay on one line, and the XML declaration, comments and CDATA are kept. Unbalanced tags are reported with a line number.
        </p>
      </section>
    );
  }
  return (
    <section className="cp-about" aria-labelledby="pom-about-deps">
      <h2 id="pom-about-deps">About the dependency converter</h2>
      <p>
        Gradle-style builds, wiki pages and chat messages often need a dependency on one line, while Maven wants the
        full <code>&lt;dependency&gt;</code> XML. This tool converts between the two with a fixed blueprint. Press{' '}
        <strong>Convert</strong> (or <kbd>Ctrl/Cmd</kbd> + <kbd>Enter</kbd>); use <strong>⇄</strong> to swap the direction - the
        current output becomes the new input.
      </p>

      <h3>Blueprint</h3>
      <pre className="cp-about__code">{CUSTOM_TEMPLATE}</pre>
      <table className="pom-map">
        <thead><tr><th>Maven XML</th><th>Custom build format</th></tr></thead>
        <tbody>
          <tr><td><code>&lt;scope&gt;</code>, <code>&lt;optional&gt;</code></td><td><code>scope:optional(…)</code> prefix - defaults <code>compile:false</code></td></tr>
          <tr><td><code>groupId</code> · <code>artifactId</code> · <code>version</code> · <code>classifier</code></td><td>joined with <code>:</code> inside the quotes. A missing version (managed by a BOM) is left out: <code>g:a@jar</code>, or <code>g:a::classifier@jar</code></td></tr>
          <tr><td><code>&lt;type&gt;</code></td><td><code>@type</code> after the coordinates - default <code>@jar</code></td></tr>
          <tr><td><code>&lt;exclusions&gt;</code></td><td><code>{'{ exclude group: \'…\', module: \'…\' }'}</code> - one line per exclusion</td></tr>
        </tbody>
      </table>

      <h3>Good to know</h3>
      <ul>
        <li>Paste one dependency or a whole <code>&lt;dependencies&gt;</code> block - each becomes its own line.</li>
        <li>XML comments are ignored; <code>//</code> and <code>/* */</code> comments are allowed in the custom format; single or double quotes both work.</li>
        <li>The <strong>Indent</strong> selector (2, 3 or 4 spaces) applies to XML output.</li>
        <li><strong>Clear</strong> empties the left box and reveals a <strong>Sample</strong> button to load the example again.</li>
        <li>Errors name the line that could not be read; tags with no place in the format (for example <code>&lt;systemPath&gt;</code>) are reported and skipped.</li>
      </ul>
    </section>
  );
}

export default function PomFormatterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = pickTab(searchParams.get('tab'));

  return (
    <div className="content-page cp-page">
      <div className="cp-head">
        <div>
          <h1>{active.title}</h1>
          <p className="cp-subtitle">{active.subtitle}</p>
        </div>
        <div className="cp-links">
          <Link className="cp-link cp-link--primary" to="/content/tree/languages/java">Learn Java</Link>
          <a className="cp-link" href="https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html" target="_blank" rel="noreferrer">Read Docs</a>
        </div>
      </div>

      <div className="cp-tabs" role="tablist" aria-label="Tool">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === active.key}
            className={`cp-tab${tab.key === active.key ? ' is-active' : ''}`}
            onClick={() => setSearchParams({ tab: tab.param }, { replace: true })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {TABS.map((tab) => (
        <div key={tab.key} hidden={tab.key !== active.key} role="tabpanel" aria-label={`${tab.label} tool`}>
          <Converter kind={tab.key} />
        </div>
      ))}

      <About tab={active} />

      <p className="cp-note">Runs entirely in your browser - nothing you paste here is sent anywhere.</p>
    </div>
  );
}
