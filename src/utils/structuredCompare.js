const VOID_HTML_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

export const STRUCTURED_TYPES = [
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'html', label: 'HTML' },
];

export const STRUCTURED_SAMPLES = {
  json: {
    left: '{\n  "name": "Alice",\n  "age": 30,\n  "roles": ["reader"]\n}',
    right: '{\n  "name": "Alice",\n  "age": 31,\n  "roles": ["reader", "editor"]\n}',
  },
  xml: {
    left: '<user id="42"><name>Alice</name><role>reader</role></user>',
    right: '<user id="42"><name>Alice</name><role>editor</role><active>true</active></user>',
  },
  html: {
    left: '<article class="card"><h2>Welcome</h2><p>Read the introduction.</p></article>',
    right: '<article class="card featured"><h2>Welcome</h2><p>Read the updated introduction.</p><a href="/learn">Start learning</a></article>',
  },
};

function parserError(document) {
  return document.querySelector('parsererror');
}

function parseMarkup(source, type) {
  if (typeof DOMParser === 'undefined') {
    return { valid: false, message: 'Markup validation is available in a browser.' };
  }
  const document = new DOMParser().parseFromString(source, type === 'xml' ? 'application/xml' : 'text/html');
  const error = type === 'xml' ? parserError(document) : null;
  if (error) {
    return { valid: false, message: error.textContent?.replace(/\s+/g, ' ').trim() || 'The XML document is not well formed.' };
  }
  return { valid: true, message: `${type.toUpperCase()} parsed successfully.` };
}

export function validateStructuredDocument(source, type) {
  const value = String(source ?? '').trim();
  if (!value) return { valid: false, message: 'Enter a document before validating.' };
  if (type === 'json') {
    try {
      JSON.parse(value);
      return { valid: true, message: 'JSON is valid.' };
    } catch (error) {
      return { valid: false, message: error instanceof Error ? error.message : 'The JSON document is invalid.' };
    }
  }
  return parseMarkup(value, type);
}

function prettyMarkup(source) {
  const input = String(source ?? '').trim().replace(/>\s+</g, '><');
  if (!input) return '';
  const tokens = input.match(/<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<[^>]+>|[^<]+/gi) || [];
  const lines = [];
  let depth = 0;
  let textBuffer = '';
  const flushText = () => {
    const text = textBuffer.replace(/\s+/g, ' ').trim();
    if (text) lines.push(`${' '.repeat(depth * 2)}${text}`);
    textBuffer = '';
  };
  tokens.forEach((token) => {
    if (!token.startsWith('<')) {
      textBuffer += token;
      return;
    }
    flushText();
    const trimmed = token.trim();
    const closing = /^<\//.test(trimmed);
    const openingMatch = trimmed.match(/^<([\w:-]+)/);
    const selfClosing = /\/\s*>$/.test(trimmed);
    const voidElement = openingMatch && VOID_HTML_TAGS.has(openingMatch[1].toLowerCase());
    if (closing) depth = Math.max(0, depth - 1);
    lines.push(`${' '.repeat(depth * 2)}${trimmed}`);
    if (openingMatch && !closing && !selfClosing && !voidElement && !/^<!/.test(trimmed)) depth += 1;
  });
  flushText();
  return lines.join('\n');
}

export function formatStructuredDocument(source, type, indent = 2) {
  const value = String(source ?? '').trim();
  if (!value) return '';
  if (type === 'json') return JSON.stringify(JSON.parse(value), null, indent);
  return prettyMarkup(value);
}

export function prepareStructuredDocument(source, type, { pretty = false, indent = 2 } = {}) {
  const validation = validateStructuredDocument(source, type);
  if (!validation.valid) return { value: String(source ?? ''), validation };
  if (!pretty) return { value: String(source ?? ''), validation };
  try {
    return { value: formatStructuredDocument(source, type, indent), validation };
  } catch (error) {
    return { value: String(source ?? ''), validation: { valid: false, message: error instanceof Error ? error.message : 'Unable to format this document.' } };
  }
}
