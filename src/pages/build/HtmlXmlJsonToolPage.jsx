import { useMemo, useState } from 'react';
import JSON5 from 'json5';
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
  json: { label: 'JSON', file: 'data.json', language: JSON_LANGUAGE, sample: '{\n  "active": true,\n  "comment": "JSON does not support comments; this field contains sample info.",\n  "metadata": {\n    "version": 1\n  },\n  "name": "CodeTrove",\n  "tools": ["HTML", "XML", "JSON"]\n}' },
};
const JSON5_SAMPLE = `// Postman / microservice payload sample\n{\n  // Enable this feature\n  active: true,\n  /* API metadata */\n  metadata: { version: 1, },\n  name: 'CodeTrove',\n  tools: ['HTML', 'XML', 'JSON'],\n}`;
const TOOL_DESCRIPTIONS = {
  html: 'Format and inspect HTML markup. Use Trim Text Nodes to remove leading and trailing whitespace from text values.',
  xml: 'An XML viewer shows an XML file as a tree you can open and close, one element per row.',
  json: 'Tree View: Interactive visualization of nested structure. Use tree view to understand complex nested structures. Validate against JSON Schema when dealing with structured data. Document your JSON structure with comments where possible (though standard JSON doesn’t support comments).',
};
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function scanJsonComments(source) {
  const comments = [];
  let quote = '';
  let escaped = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '/' && (next === '/' || next === '*')) {
      const start = i;
      const lineComment = next === '/';
      i += 2;
      if (lineComment) {
        while (i < source.length && source[i] !== '\n' && source[i] !== '\r') i += 1;
        comments.push(source.slice(start, i));
        i -= 1;
      } else {
        while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
        if (i < source.length) i += 1;
        comments.push(source.slice(start, i + 1));
      }
    }
  }
  return comments;
}

function stripJsonComments(source) {
  let output = '';
  let quote = '';
  let escaped = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (quote) {
      output += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") { quote = char; output += char; continue; }
    if (char === '/' && (next === '/' || next === '*')) {
      const lineComment = next === '/';
      const start = i;
      i += 2;
      if (lineComment) {
        while (i < source.length && source[i] !== '\n' && source[i] !== '\r') i += 1;
        output += source.slice(start, i).replace(/[^\r\n]/g, ' ');
        i -= 1;
      } else {
        while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
        if (i < source.length) i += 1;
        output += source.slice(start, i + 1).replace(/[^\r\n]/g, ' ');
      }
      continue;
    }
    output += char;
  }
  return output;
}

function jsonCommentsError(source) {
  return scanJsonComments(source).length > 0;
}

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

function validateSource(kind, source, jsonMode = 'json') {
  if (!source.trim()) return 'Enter some code before validating or converting.';
  if (kind === 'json') {
    if (jsonMode === 'json' && jsonCommentsError(source)) {
      return 'Comments detected in JSON. Standard JSON does not support comments. Remove all // and /* */ comments.';
    }
    try { (jsonMode === 'json' ? JSON : JSON5).parse(source); return ''; }
    catch (error) { return `Invalid ${jsonMode === 'json' ? 'JSON' : 'JSON5 / JSONC'}: ${error.message}`; }
  }
  if (kind === 'xml') {
    const doc = new DOMParser().parseFromString(source, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    return parseError ? `Invalid XML: ${parseError.textContent.replace(/\s+/g, ' ').trim()}` : '';
  }
  return validateHtml(source);
}

function formatMarkup(source, options = {}) {
  const { indent = 2, minify = false, keepComments = true, minifyCss = false, trimTextNodes = false, kind = 'html' } = options;
  let text = source.replace(/\r\n?/g, '\n').trim();
  if (trimTextNodes) {
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
    if (trimTextNodes && opening && !closing) {
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
    lines.push(`${pad(depth)}${output}`);
    if (opening && !closing && !VOID_TAGS.has(name) && !/\/\s*>$/.test(value) && !/^<!/.test(value) && !/^<\?/.test(value)) depth += 1;
    if (closing && ['pre', 'textarea', 'script', 'style'].includes(name)) preserveText = false;
  }
  return lines.join('\n');
}

function toTree(kind, source, jsonMode = 'json') {
  if (kind === 'json') {
    const toNode = (name, value, isRoot = false) => {
      if (Array.isArray(value)) {
        return {
          name,
          format: 'json',
          kind: 'array',
          value: `${value.length} ${value.length === 1 ? 'item' : 'items'}`,
          children: value.map((item, index) => toNode(`[${index}]`, item)),
        };
      }
      if (value && typeof value === 'object') {
        const entries = Object.entries(value);
        return {
          name,
          format: 'json',
          kind: 'object',
          value: `${entries.length} ${entries.length === 1 ? 'property' : 'properties'}`,
          children: entries.map(([key, item]) => toNode(key, item)),
        };
      }
      return {
        name,
        format: 'json',
        kind: value === null ? 'null' : typeof value,
        value: value === null ? 'null' : JSON.stringify(value),
        children: [],
      };
    };
    const parsed = (jsonMode === 'json' ? JSON : JSON5).parse(source);
    return toNode('root', parsed, true);
  }

  const doc = new DOMParser().parseFromString(source, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error(`Invalid XML: ${parseError.textContent.replace(/\s+/g, ' ').trim()}`);

  const build = (node) => {
    const meaningfulChildren = Array.from(node.childNodes).filter((child) =>
      child.nodeType === 1 ||
      (child.nodeType === 3 && child.nodeValue.trim()) ||
      child.nodeType === 8 ||
      child.nodeType === 4,
    );
    const elementChildren = meaningfulChildren.filter((child) => child.nodeType === 1);
    const textOnly = elementChildren.length === 0 && meaningfulChildren.every((child) => child.nodeType === 3 || child.nodeType === 4);
    const textValue = textOnly ? meaningfulChildren.map((child) => child.nodeValue.trim()).join('') : '';
    const children = textOnly ? [] : meaningfulChildren.map((child) => {
      if (child.nodeType === 8) return { name: '#comment', format: 'xml', kind: 'comment', value: child.nodeValue.trim(), children: [] };
      if (child.nodeType === 4) return { name: '#cdata', format: 'xml', kind: 'cdata', value: child.nodeValue, children: [] };
      if (child.nodeType === 3) return { name: '#text', format: 'xml', kind: 'text', value: child.nodeValue.trim(), children: [] };
      return build(child);
    });

    return {
      name: node.nodeName,
      format: 'xml',
      kind: 'element',
      value: textValue,
      attributes: node.nodeType === 1 ? Array.from(node.attributes).map((attribute) => ({ name: attribute.name, value: attribute.value })) : [],
      children,
    };
  };

  const children = [];
  const declaration = source.match(/^\s*(<\?xml[^?]*\?>)/i);
  if (declaration) children.push({ name: declaration[1], format: 'xml', kind: 'declaration', value: '', children: [] });
  Array.from(doc.childNodes).forEach((child) => {
    if (child.nodeType === 8) children.push({ name: '#comment', format: 'xml', kind: 'comment', value: child.nodeValue.trim(), children: [] });
    else if (child.nodeType === 10) children.push({ name: `DOCTYPE ${child.name}`, format: 'xml', kind: 'declaration', value: '', children: [] });
    else if (child.nodeType === 1) children.push(build(child));
  });
  return { name: 'XML document', format: 'xml', kind: 'document', value: '', children };
}

function TreeNode({ node, depth = 0, expanded }) {
  const [openOverride, setOpenOverride] = useState(null);
  const isOpen = openOverride ?? expanded;
  const hasChildren = node.children?.length > 0;
  const xmlElement = node.format === 'xml' && node.kind === 'element';
  const jsonBranch = node.format === 'json' && ['object', 'array'].includes(node.kind);
  const isXmlText = node.format === 'xml' && ['text', 'cdata'].includes(node.kind);
  const xmlTagName = node.name;
  const renderXmlAttributes = () => node.attributes?.map((attribute) => (
    <span className="hxt-tree-attribute" key={`${attribute.name}=${attribute.value}`}>
      <span className="hxt-tree-attribute-name">{attribute.name}</span>=<span className="hxt-tree-attribute-value">&quot;{attribute.value}&quot;</span>
    </span>
  ));

  return (
    <div className={`hxt-tree-node${xmlElement ? ' hxt-tree-node--xml' : ''}`} style={{ '--tree-depth': depth }}>
      <div className={`hxt-tree-line${hasChildren && isOpen ? ' is-expanded' : ''}`}>
        {hasChildren ? (
          <button type="button" className="hxt-tree-toggle" onClick={() => setOpenOverride((value) => !(value ?? expanded))} aria-label={isOpen ? 'Collapse node' : 'Expand node'} aria-expanded={isOpen}>
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : <span className="hxt-tree-spacer" />}

        {xmlElement ? (
          <>
            <code className="hxt-tree-xml-tag">&lt;{xmlTagName}</code>
            {renderXmlAttributes()}
            <code className="hxt-tree-xml-tag">&gt;</code>
            {!hasChildren && <>
              <span className="hxt-tree-xml-text">{node.value}</span>
              <code className="hxt-tree-xml-tag">&lt;/{xmlTagName}&gt;</code>
            </>}
            {hasChildren && <span className="hxt-tree-count">{node.children.length} {node.children.length === 1 ? 'child' : 'children'}</span>}
          </>
        ) : node.format === 'json' ? (
          <>
            <code className={`hxt-tree-name hxt-tree-name--json${node.name === 'root' ? ' hxt-tree-name--root' : ''}`}>
              {node.name === 'root' ? '$' : node.name.startsWith('[') ? node.name : JSON.stringify(node.name)}
            </code>
            {node.name !== 'root' && <span className="hxt-tree-separator">:</span>}
            {jsonBranch ? (
              <span className={`hxt-tree-branch-summary hxt-tree-branch-summary--${node.kind}`}>
                {isOpen ? (node.kind === 'array' ? '[' : '{') : (node.kind === 'array' ? `[ ${node.value} ]` : `{ ${node.value} }`)}
              </span>
            ) : <span className={`hxt-tree-value hxt-tree-value--${node.kind}`}>{node.value}</span>}
          </>
        ) : node.kind === 'comment' ? (
          <code className="hxt-tree-xml-special">&lt;!-- {node.value} --&gt;</code>
        ) : node.kind === 'cdata' ? (
          <code className="hxt-tree-xml-special">&lt;![CDATA[{node.value}]]&gt;</code>
        ) : node.kind === 'declaration' ? (
          <code className="hxt-tree-xml-special">{node.name.startsWith('DOCTYPE') ? `<!${node.name}>` : node.name}</code>
        ) : node.kind === 'document' ? (
          <code className="hxt-tree-name hxt-tree-name--root">{node.name}</code>
        ) : isXmlText ? (
          <span className="hxt-tree-xml-text">{node.value}</span>
        ) : (
          <code className="hxt-tree-name">{node.name}</code>
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="hxt-tree-children">
          {node.children.map((child, index) => <TreeNode key={`${child.name}-${index}`} node={child} depth={depth + 1} expanded={expanded} />)}
          {xmlElement && <div className="hxt-tree-line hxt-tree-line--closing" style={{ '--tree-depth': depth + 1 }}><span className="hxt-tree-spacer" /><code className="hxt-tree-xml-tag">&lt;/{xmlTagName}&gt;</code></div>}
          {jsonBranch && <div className="hxt-tree-line hxt-tree-line--closing" style={{ '--tree-depth': depth + 1 }}><span className="hxt-tree-spacer" /><code className="hxt-tree-json-bracket">{node.kind === 'array' ? ']' : '}'}</code></div>}
        </div>
      )}
    </div>
  );
}

export default function HtmlXmlJsonToolPage() {
  const [kind, setKind] = useState('html');
  const [jsonMode, setJsonMode] = useState('json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [operation, setOperation] = useState('format');
  const [indent, setIndent] = useState('2');
  const [useTabs, setUseTabs] = useState(false);
  const [keepComments, setKeepComments] = useState(true);
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
  const options = { indent: indentSize, indentText: useTabs ? '\t' : ' '.repeat(Number(indent)), minify: operation === 'minify', keepComments, minifyCss: kind === 'html' && minifyCss, trimTextNodes: (kind === 'xml' || kind === 'html') && trimTextNodes, kind };
  const extensions = useMemo(() => [
    language,
    lintGutter(),
    linter((view) => {
      const source = view.state.doc.toString();
      if (!source.trim()) return [];
      const message = validateSource(kind, source, jsonMode);
      if (!message) return [];
      return [{ from: 0, to: Math.min(source.length, 1), severity: 'error', message }];
    }),
  ], [language, kind, jsonMode]);

  const validate = () => {
    const message = validateSource(kind, input, jsonMode);
    setError(message);
    setStatus(message ? '' : `${config.label} validation passed.`);
    return !message;
  };
  const convert = (nextOperation = operation) => {
    setOperation(nextOperation);
    const message = validateSource(kind, input, jsonMode);
    setError(message);
    setStatus('');
    setTree(null);
    setCopied(false);
    if (message) { setOutput(''); return; }
    try {
      const isMinify = nextOperation === 'minify';
      let result;
      if (kind === 'json') {
        const comments = scanJsonComments(input);
        const value = (jsonMode === 'json' ? JSON : JSON5).parse(input);
        const formatted = (jsonMode === 'json' ? JSON : JSON5).stringify(value, null, isMinify ? undefined : useTabs ? '\t' : Number(indent));
        result = keepComments && jsonMode !== 'json' && comments.length ? `${comments.join('\n')}\n${formatted}` : formatted;
      }
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
    const message = validateSource(kind, input, jsonMode);
    setError(message);
    setStatus('');
    setOutput('');
    setCopied(false);
    if (message) { setTree(null); return; }
    try { setTree(toTree(kind, input, jsonMode)); setTreeExpanded(true); setStatus('Tree view ready.'); }
    catch (problem) { setTree(null); setError(problem?.message || 'Unable to parse this input.'); }
  };
  const clearOrSample = () => {
    if (input.trim()) { setInput(''); setOutput(''); setTree(null); setCopied(false); setError(''); setStatus(''); }
    else { setInput(sample); setOutput(''); setTree(null); setCopied(false); setError(''); setStatus('Sample loaded. Validate before converting.'); }
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
  const onJsonModeChange = (next) => { setJsonMode(next); setInput(next === 'json' ? FORMATS.json.sample : JSON5_SAMPLE); setOutput(''); setTree(null); setCopied(false); setError(''); setStatus(''); };
  const sample = kind === 'json' && jsonMode !== 'json' ? JSON5_SAMPLE : FORMATS[kind].sample;
  const autoFixComments = () => { setInput(stripJsonComments(input)); setError(''); setStatus('Comments removed. Validate or format the corrected JSON.'); setTree(null); };

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
            {(kind !== 'json' || jsonMode !== 'json') && <label className="hxt-check"><input type="checkbox" checked={keepComments} onChange={(event) => setKeepComments(event.target.checked)} /> Keep comments</label>}
            {kind === 'json' && <label className="runnable-code__target"><span>Syntax</span><select value={jsonMode} onChange={(event) => onJsonModeChange(event.target.value)} aria-label="JSON syntax"><option value="json">JSON</option><option value="json5">JSON5 / JSONC</option></select></label>}
            {(kind === 'xml' || kind === 'html') && <label className="hxt-check" title="Removes leading and trailing whitespace from text nodes"><input type="checkbox" checked={trimTextNodes} onChange={(event) => setTrimTextNodes(event.target.checked)} /> Trim Text Nodes</label>}
            {kind === 'html' && <label className="hxt-check"><input type="checkbox" checked={minifyCss} onChange={(event) => setMinifyCss(event.target.checked)} /> Minify inline CSS</label>}
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

        {(error || status) && <div className={`hxt-message${error ? ' hxt-message--error' : ' hxt-message--success'}`} role={error ? 'alert' : 'status'}>{error || status}{error && kind === 'json' && jsonMode === 'json' && jsonCommentsError(input) && <button type="button" className="hxt-autofix" onClick={autoFixComments}><WandSparkles size={14} /> Auto-Fix: Remove Comments</button>}</div>}

        <div className="hxt-panes">
          <div className="hxt-pane">
            <div className="hxt-pane-header"><span><span className="hxt-format-badge">{config.label}</span><strong>{config.file}</strong></span><div className="hxt-pane-actions"><button type="button" className="runnable-code__button" onClick={clearOrSample}>{input.trim() ? 'Clear' : 'Sample'}</button><button type="button" className="runnable-code__button runnable-code__button--run" onClick={validate}><CheckCircle2 size={14} /> Validate</button></div></div>
            <CodeMirror value={input} onChange={(value) => { setInput(value); setError(''); setStatus(''); setTree(null); }} theme={oneDark} extensions={extensions} height="390px" basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }} aria-label={`${config.label} input`} />
            <div className="hxt-pane-footer"><span>{input.length.toLocaleString()} characters</span><span>Validate runs before every conversion</span></div>
          </div>
          <div className="hxt-pane">
            <div className="hxt-pane-header"><span><span className="hxt-format-badge hxt-format-badge--output">{tree ? 'TREE' : operation === 'format' ? 'PRETTY' : 'MINIFIED'}</span><strong>{tree ? 'Parsed structure' : 'Output'}</strong></span><div className="hxt-pane-actions">{tree ? <button type="button" className="runnable-code__button" onClick={() => setTreeExpanded((value) => !value)}>{treeExpanded ? 'Collapse all' : 'Expand all'}</button> : <button type="button" className={`runnable-code__icon-button${copied ? ' is-copied' : ''}`} onClick={copyOutput} disabled={!output} title="Copy to clipboard" aria-label="Copy output">{copied ? <Check size={16} /> : <Clipboard size={16} />}</button>}</div></div>
            {tree ? <div className="hxt-tree-view"><TreeNode key={treeExpanded ? 'all-open' : 'all-closed'} node={tree} expanded={treeExpanded} /></div> : <CodeMirror value={output} theme={oneDark} extensions={extensions} readOnly height="390px" basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: false }} aria-label="Formatted output" />}
            <div className="hxt-pane-footer"><span>{tree ? 'XML / JSON tree' : `${output.length.toLocaleString()} characters`}</span><span>{tree ? 'Use node arrows to inspect values' : 'Output appears after a successful operation'}</span></div>
          </div>
        </div>

      </section>

      <section className="hxt-about"><h2>{kind === 'html' ? 'About the HTML formatter' : kind === 'xml' ? 'About the XML viewer' : jsonMode === 'json' ? 'About the JSON formatter and tree viewer' : 'About JSON5 / JSONC'}</h2><p>{kind === 'json' ? jsonMode === 'json' ? TOOL_DESCRIPTIONS.json : 'JSON5 / JSONC mode supports // and /* */ comments for Postman and microservice payloads. Keep comments checked to retain extracted comments in formatted output.' : TOOL_DESCRIPTIONS[kind]}</p><ul><li><strong>Validate</strong> checks the input and shows an error before formatting or minifying.</li><li><strong>Beautify / Format</strong> formats the source with your selected indentation.</li><li><strong>Minify</strong> removes unnecessary whitespace to make the payload more compact.</li>{kind !== 'html' && <li><strong>Parse to Tree View</strong> displays the nested structure with expandable and collapsible nodes.</li>}{kind === 'json' && <li><strong>JSON Schema</strong> validation is recommended when working with structured API payloads. Standard JSON does not support comments.</li>}{kind === 'html' && <li><strong>Trim Text Nodes</strong> removes leading and trailing whitespace from HTML text values.</li>}{kind === 'xml' && <li><strong>Trim Text Nodes</strong> removes leading and trailing whitespace from XML text values.</li>}</ul><h3>Sample</h3><pre className="hxt-sample">{sample}</pre><p className="hxt-note">Processing stays in your browser. HTML uses browser parsing rules; XML is checked for well-formedness. JSON uses strict syntax unless JSON5 / JSONC is selected.</p></section>
    </div>
  );
}
