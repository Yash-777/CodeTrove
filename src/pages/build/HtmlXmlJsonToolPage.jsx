import { useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { StreamLanguage } from '@codemirror/language';
import { linter, lintGutter } from '@codemirror/lint';
import { xml } from '@codemirror/legacy-modes/mode/xml';
import { javascript } from '@codemirror/legacy-modes/mode/javascript';
import { Check, CheckCircle2, ChevronDown, ChevronRight, Clipboard, Code2, FileCode2, FileJson, FileText, Minimize2, WandSparkles } from 'lucide-react';
import '../../components/CodeRunner/RunnableCode.css';
import './CompilerPage.css';
import './HtmlXmlJsonToolPage.css';

const XML_LANGUAGE = StreamLanguage.define(xml);
const JSON_LANGUAGE = StreamLanguage.define(javascript);
const FORMATS = {
  html: { label: 'HTML', file: 'index.html', language: XML_LANGUAGE, sample: '<!doctype html>\n<html lang="en">\n  <head>\n    <title>CodeTrove</title>\n    <!-- Commented info: sample page styles -->\n    <style>\n      /* Content spacing */\n      .content {\n        padding: 16px;\n      }\n    </style>\n  </head>\n  <body>\n    <!-- Main page content -->\n    <main class="content">\n      <h1>Hello, CodeTrove!</h1>\n      <p>Format and validate markup.</p>\n    </main>\n  </body>\n</html>' },
  xml: { label: 'XML', file: 'document.xml', language: XML_LANGUAGE, sample: '<?xml version="1.0" encoding="UTF-8"?>\n<!-- Commented info: sample book catalog -->\n<catalog>\n  <book id="bk101">\n    <title>\n      Developer Guide\n    </title>\n    <price currency="USD">29.99</price>\n  </book>\n</catalog>' },
  json: { label: 'JSON', file: 'data.json', language: JSON_LANGUAGE, sample: '{\n  "name": "CodeTrove",\n  "active": true,\n  "tools": ["HTML", "XML", "JSON"],\n  "comment": "JSON does not support comments; this field contains sample info.",\n  "metadata": { "version": 1 }\n}' },
};
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function validateHtml(source) {
  const stack = [];
  const tokens = source.match(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>|[^<]+|</g) || [];
  for (const token of tokens) {
    if (token.startsWith('<!--') || /^<!/i.test(token) || !token.startsWith('<')) continue;
    const close = token.match(/^<\/\s*([\w:-]+)/);
    const open = token.match(/^<\s*([\w:-]+)/);
    if (close) {
      const name = close[1].toLowerCase();
      const index = stack.lastIndexOf(name);
      if (index < 0) return `Unexpected closing tag </${name}>. Check that it has a matching opening tag.`;
      if (index !== stack.length - 1) return `Tag </${name}> closes before </${stack[stack.length - 1]}>. Close nested tags in the correct order.`;
      stack.pop();
    } else if (open) {
      const name = open[1].toLowerCase();
      if (!VOID_TAGS.has(name) && !/\/\s*>$/.test(token)) stack.push(name);
    }
  }
  if (stack.length) return `Missing closing tag for <${stack[stack.length - 1]}>.`;
  try { new DOMParser().parseFromString(source, 'text/html'); } catch { /* HTML parsing is intentionally forgiving. */ }
  return '';
}

function validateSource(kind, source) {
  if (!source.trim()) return 'Enter some code before validating or converting.';
  if (kind === 'json') {
    try { JSON.parse(source); return ''; }
    catch (error) { return `Invalid JSON: ${error.message}`; }
  }
  if (kind === 'xml') {
    const doc = new DOMParser().parseFromString(source, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    return parseError ? `Invalid XML: ${parseError.textContent.replace(/\s+/g, ' ').trim()}` : '';
  }
  return validateHtml(source);
}

function formatMarkup(source, options = {}) {
  const { indent = 2, minify = false, keepComments = true, unquoteAttributes = false, minifyCss = false, trimTextNodes = false, kind = 'html' } = options;
  let text = source.replace(/\r\n?/g, '\n').trim();
  if (kind === 'xml' && trimTextNodes) {
    text = text.replace(/(<([A-Za-z_][\w:.-]*)(?:\s[^<>]*?)?>)([^<>]*?)(<\/\2\s*>)/gi, (_, open, _name, value, close) => `${open}${value.trim()}${close}`);
  }
  if (kind === 'html' && !keepComments) {
    text = text.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, (_, start, css, end) => `${start}${css.replace(/\/\*[\s\S]*?\*\//g, '')}${end}`);
  }
  if (minify) {
    if (!keepComments) text = text.replace(/<!--[\s\S]*?-->/g, '');
    if (minifyCss) text = text.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, (_, start, css, end) => { const compactCss = (keepComments ? css : css.replace(/\/\*[\s\S]*?\*\//g, '')).replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').trim(); return `${start}${compactCss}${end}`; });
    text = text.replace(/>\s+</g, '><').replace(/[\t\n\r ]+/g, ' ').trim();
    if (!keepComments) text = text.replace(/\s*<!--.*?-->/gs, '');
    if (unquoteAttributes) text = text.replace(/\s([\w:-]+)="([\w./:#-]+)"/g, ' $1=$2');
    return text;
  }
  const tokens = text.match(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<![^>]*>|<[^>]+>|[^<]+/g) || [];
  const lines = [];
  let depth = 0;
  let preserveText = false;
  const indentText = options.indentText || ' '.repeat(indent);
  const pad = (level) => indentText.repeat(Math.max(0, level));
  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex += 1) {
    const token = tokens[tokenIndex];
    const value = token.trim();
    if (!value) continue;
    if (value.startsWith('<!--') && !keepComments) continue;
    const closing = /^<\//.test(value);
    const opening = /^<[\w!?]/.test(value) && !/^<\?/.test(value) && !/^<!/.test(value);
    const name = (value.match(/^<\/?\s*([\w:-]+)/) || [])[1]?.toLowerCase();
    if (kind === 'xml' && trimTextNodes && opening && !closing) {
      const textToken = tokens[tokenIndex + 1] || '';
      const closeToken = (tokens[tokenIndex + 2] || '').trim();
      const closeName = (closeToken.match(/^<\/\s*([\w:-]+)/) || [])[1]?.toLowerCase();
      if (textToken && !textToken.includes('<') && closeName === name) {
        lines.push(`${pad(depth)}${value}${textToken.trim()}${closeToken}`);
        tokenIndex += 2;
        continue;
      }
    }
    if (closing) depth = Math.max(0, depth - 1);
    if (opening && ['pre', 'textarea', 'script', 'style'].includes(name)) preserveText = true;
    if (preserveText && !closing && !opening) {
      const previous = lines.pop() || '';
      lines.push(`${previous}${previous ? '' : pad(depth)}${token}`);
      continue;
    }
    let output = value;
    if (unquoteAttributes) output = output.replace(/\s([\w:-]+)="([\w./:#-]+)"/g, ' $1=$2');
    lines.push(`${pad(depth)}${output}`);
    if (opening && !closing && !VOID_TAGS.has(name) && !/\/\s*>$/.test(value) && !/^<!/.test(value) && !/^<\?/.test(value)) depth += 1;
    if (closing && ['pre', 'textarea', 'script', 'style'].includes(name)) preserveText = false;
  }
  return lines.join('\n');
}

function toTree(kind, source) {
  if (kind === 'json') {
    const toNode = (name, value) => {
      if (Array.isArray(value)) return { name, value: `Array(${value.length})`, children: value.map((item, index) => toNode(`[${index}]`, item)) };
      if (value && typeof value === 'object') return { name, value: 'Object', children: Object.entries(value).map(([key, item]) => toNode(key, item)) };
      return { name, value: value === null ? 'null' : JSON.stringify(value), children: [] };
    };
    return toNode('root', JSON.parse(source));
  }
  const doc = new DOMParser().parseFromString(source, 'application/xml');
  const build = (node, name = node.nodeName) => ({
    name,
    value: node.nodeType === 3 ? node.nodeValue.trim() : '',
    children: Array.from(node.childNodes).filter((child) => child.nodeType === 1 || (child.nodeType === 3 && child.nodeValue.trim())).map((child) => build(child)),
    attributes: node.nodeType === 1 ? Array.from(node.attributes).map((attribute) => `${attribute.name}="${attribute.value}"`) : [],
  });
  return build(doc.documentElement);
}

function TreeNode({ node, depth = 0, expanded }) {
  const [openOverride, setOpenOverride] = useState(null);
  const isOpen = openOverride ?? expanded;
  const hasChildren = node.children?.length > 0;
  return (
    <div className="hxt-tree-node" style={{ '--tree-depth': depth }}>
      <div className="hxt-tree-line">
        {hasChildren ? <button type="button" className="hxt-tree-toggle" onClick={() => setOpenOverride((value) => !(value ?? expanded))} aria-label={isOpen ? 'Collapse node' : 'Expand node'}>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button> : <span className="hxt-tree-spacer" />}
        <code className="hxt-tree-name">{node.name}</code>
        {node.attributes?.length > 0 && <span className="hxt-tree-attributes">{node.attributes.join(' ')}</span>}
        {node.value && <span className="hxt-tree-value">{node.value}</span>}
        {hasChildren && <span className="hxt-tree-count">{node.children.length}</span>}
      </div>
      {hasChildren && isOpen && <div className="hxt-tree-children">{node.children.map((child, index) => <TreeNode key={`${child.name}-${index}`} node={child} depth={depth + 1} expanded={expanded} />)}</div>}
    </div>
  );
}

export default function HtmlXmlJsonToolPage() {
  const [kind, setKind] = useState('html');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [operation, setOperation] = useState('format');
  const [indent, setIndent] = useState('2');
  const [useTabs, setUseTabs] = useState(false);
  const [keepComments, setKeepComments] = useState(true);
  const [unquoteAttributes, setUnquoteAttributes] = useState(false);
  const [minifyCss, setMinifyCss] = useState(false);
  const [trimTextNodes, setTrimTextNodes] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [tree, setTree] = useState(null);
  const [treeExpanded, setTreeExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const config = FORMATS[kind];
  const language = kind === 'json' ? JSON_LANGUAGE : XML_LANGUAGE;
  const indentSize = useTabs ? 2 : Number(indent);
  const options = { indent: indentSize, indentText: useTabs ? '\t' : ' '.repeat(Number(indent)), minify: operation === 'minify', keepComments, unquoteAttributes: kind === 'html' && unquoteAttributes, minifyCss: kind === 'html' && minifyCss, trimTextNodes: kind === 'xml' && trimTextNodes, kind };
  const extensions = useMemo(() => [
    language,
    lintGutter(),
    linter((view) => {
      const source = view.state.doc.toString();
      if (!source.trim()) return [];
      const message = validateSource(kind, source);
      if (!message) return [];
      return [{ from: 0, to: Math.min(source.length, 1), severity: 'error', message }];
    }),
  ], [language, kind]);

  const validate = () => {
    const message = validateSource(kind, input);
    setError(message);
    setStatus(message ? '' : `${config.label} validation passed.`);
    return !message;
  };
  const convert = (nextOperation = operation) => {
    setOperation(nextOperation);
    const message = validateSource(kind, input);
    setError(message);
    setStatus('');
    setTree(null);
    setCopied(false);
    if (message) { setOutput(''); return; }
    try {
      const isMinify = nextOperation === 'minify';
      let result;
      if (kind === 'json') result = JSON.stringify(JSON.parse(input), null, isMinify ? undefined : useTabs ? '\t' : Number(indent));
      else result = formatMarkup(input, { ...options, minify: isMinify });
      setOutput(result);
      setStatus(isMinify ? 'Minified successfully.' : 'Formatted successfully.');
    } catch (problem) {
      setOutput('');
      setError(problem?.message || 'Unable to process this input.');
    }
  };
  const showTree = () => {
    if (kind === 'html') return;
    const message = validateSource(kind, input);
    setError(message);
    setStatus('');
    setOutput('');
    setCopied(false);
    if (message) { setTree(null); return; }
    try { setTree(toTree(kind, input)); setTreeExpanded(true); setStatus('Tree view ready.'); }
    catch (problem) { setTree(null); setError(problem?.message || 'Unable to parse this input.'); }
  };
  const clearOrSample = () => {
    if (input.trim()) { setInput(''); setOutput(''); setTree(null); setCopied(false); setError(''); setStatus(''); }
    else { setInput(config.sample); setOutput(''); setTree(null); setCopied(false); setError(''); setStatus('Sample loaded. Validate before converting.'); }
  };
  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setStatus('Copied to clipboard');
      setError('');
      window.setTimeout(() => { setCopied(false); setStatus((current) => current === 'Copied to clipboard' ? '' : current); }, 1500);
    } catch { setError('Clipboard access was blocked by the browser. Select and copy the output manually.'); }
  };
  const onKindChange = (next) => { setKind(next); setInput(''); setOutput(''); setTree(null); setCopied(false); setError(''); setStatus(''); };

  return (
    <div className="content-page hxt-page">
      <div className="cp-head">
        <div>
          <h1>HTML / XML / JSON Tools</h1>
          <p className="cp-subtitle">Beautify, minify, validate, and inspect structured data — right in your browser.</p>
        </div>
      </div>
      <div className="hxt-intro">Free HTML, XML, and JSON formatter with configurable indentation, compact output, validation, and a tree viewer for XML and JSON. Your code stays in this browser.</div>

      <div className="cp-tabs hxt-language-tabs" role="tablist" aria-label="Input format">
        {Object.entries(FORMATS).map(([key, item]) => <button key={key} type="button" role="tab" aria-selected={kind === key} className={`cp-tab${kind === key ? ' is-active' : ''}`} onClick={() => onKindChange(key)}>{key === 'html' ? <FileCode2 size={15} /> : key === 'xml' ? <FileText size={15} /> : <FileJson size={15} />}{item.label}</button>)}
      </div>
      <section className="runnable-code runnable-code--playground hxt-card" aria-label={`${config.label} formatter`}>
        <div className="runnable-code__header hxt-toolbar">
          <div className="hxt-toolbar-options">
            <label className="runnable-code__target"><span>Indent</span><select value={useTabs ? 'tabs' : indent} onChange={(event) => { const value = event.target.value; setUseTabs(value === 'tabs'); if (value !== 'tabs') setIndent(value); }} aria-label="Indentation"><option value="2">2 spaces</option><option value="3">3 spaces</option><option value="4">4 spaces</option><option value="tabs">Tabs</option></select></label>
            <label className="hxt-check"><input type="checkbox" checked={keepComments} onChange={(event) => setKeepComments(event.target.checked)} /> Keep comments</label>
            {kind === 'xml' && <label className="hxt-check" title="Removes leading and trailing whitespace from XML text values"><input type="checkbox" checked={trimTextNodes} onChange={(event) => setTrimTextNodes(event.target.checked)} /> Trim Text Nodes</label>}
            {kind === 'html' && <>
              <label className="hxt-check"><input type="checkbox" checked={unquoteAttributes} onChange={(event) => setUnquoteAttributes(event.target.checked)} /> Unquote safe attributes</label>
              <label className="hxt-check"><input type="checkbox" checked={minifyCss} onChange={(event) => setMinifyCss(event.target.checked)} /> Minify inline CSS</label>
            </>}
          </div>
          <div className="hxt-toolbar-right">
            <div className="hxt-toolbar-actions">
              <button type="button" className={`runnable-code__button runnable-code__button--run${operation === 'format' && !tree ? ' is-active' : ''}`} onClick={() => { setTree(null); convert('format'); }}><WandSparkles size={14} /> Beautify / Format</button>
              <button type="button" className={`runnable-code__button${operation === 'minify' && !tree ? ' is-active' : ''}`} onClick={() => { setTree(null); convert('minify'); }}><Minimize2 size={14} /> Minify / Compact</button>
              {kind !== 'html' && <button type="button" className={`runnable-code__button${tree ? ' is-active' : ''}`} onClick={showTree}><Code2 size={14} /> Parse to Tree View</button>}
            </div>
            <span className="hxt-privacy-note">Local processing · No upload</span>
          </div>
        </div>

        <div className="hxt-panes">
          <div className="hxt-pane">
            <div className="hxt-pane-header"><span><span className="hxt-format-badge">{config.label}</span><strong>{config.file}</strong></span><div className="hxt-pane-actions"><button type="button" className="runnable-code__button" onClick={clearOrSample}>{input.trim() ? 'Clear' : 'Sample'}</button><button type="button" className="runnable-code__button runnable-code__button--run" onClick={validate}><CheckCircle2 size={14} /> Validate</button></div></div>
            <CodeMirror value={input} onChange={(value) => { setInput(value); setError(''); setStatus(''); setTree(null); }} theme={oneDark} extensions={extensions} height="390px" basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }} aria-label={`${config.label} input`} />
            <div className="hxt-pane-footer"><span>{input.length.toLocaleString()} characters</span><span>Validate runs before every conversion</span></div>
          </div>
          <div className="hxt-pane">
            <div className="hxt-pane-header"><span><span className="hxt-format-badge hxt-format-badge--output">{tree ? 'TREE' : operation === 'format' ? 'PRETTY' : 'MINIFIED'}</span><strong>{tree ? 'Parsed structure' : 'Output'}</strong></span><div className="hxt-pane-actions">{tree ? <button type="button" className="runnable-code__button" onClick={() => setTreeExpanded((value) => !value)}>{treeExpanded ? 'Collapse all' : 'Expand all'}</button> : <button type="button" className={`runnable-code__icon-button${copied ? ' is-copied' : ''}`} onClick={copyOutput} disabled={!output} title={copied ? 'Copied to clipboard' : 'Copy output'} aria-label={copied ? 'Copied to clipboard' : 'Copy output'}>{copied ? <Check size={16} /> : <Clipboard size={16} />}</button>}</div></div>
            {tree ? <div className="hxt-tree-view"><TreeNode key={treeExpanded ? 'all-open' : 'all-closed'} node={tree} expanded={treeExpanded} /></div> : <CodeMirror value={output} theme={oneDark} extensions={extensions} readOnly height="390px" basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: false }} aria-label="Formatted output" />}
            <div className="hxt-pane-footer"><span>{tree ? 'XML / JSON tree' : `${output.length.toLocaleString()} characters`}</span><span>{tree ? 'Use node arrows to inspect values' : 'Output appears after a successful operation'}</span></div>
          </div>
        </div>

        {(error || status) && <div className={`hxt-message${error ? ' hxt-message--error' : ' hxt-message--success'}`} role={error ? 'alert' : 'status'}>{error || status}</div>}
      </section>

      <section className="hxt-about"><h2>How to use this tool</h2><ul><li><strong>Validate</strong> checks the input and shows a useful error before formatting or minifying.</li><li><strong>Beautify / Format</strong> formats code with 2, 3, or 4 spaces, or tab indentation. Inline editor diagnostics flag invalid input while you edit.</li><li><strong>Minify</strong> removes unnecessary whitespace to make markup or JSON more compact.</li><li><strong>Parse to Tree View</strong> lets you inspect JSON values or XML elements; use Expand all / Collapse all to navigate the structure.</li><li><strong>HTML options</strong> control comment retention, safe attribute quotes, and inline CSS compaction.</li><li><strong>XML option</strong> trims leading and trailing whitespace from text nodes.</li></ul><p className="hxt-note">Note: HTML is parsed using browser-friendly rules; the validator checks common mismatched and unclosed tags. XML and JSON are validated with strict parsers.</p></section>
    </div>
  );
}
