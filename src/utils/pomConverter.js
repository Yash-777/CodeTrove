/**
 * src/utils/pomConverter.js
 * ------------------------------------------------------------------
 * Pure, dependency-free helpers for the Maven POM Formatter tool
 * (/build/tools/pom-formatter):
 *
 *   xmlToCustom   Maven <dependency> XML      ->  custom build notation
 *   customToXml   custom build notation       ->  Maven <dependency> XML
 *   formatPomXml  any (POM) XML               ->  pretty-printed XML
 *
 * Custom notation (one statement per dependency):
 *
 *   scope:optional('groupId:artifactId:version:classifier@type') {
 *       exclude group: 'groupId', module: 'artifactId',
 *       exclude group: 'groupId', module: 'artifactId'
 *   }
 *
 * Compared with the first blueprint these functions
 *   - read the dependency's OWN groupId/artifactId even when <exclusions>
 *     comes first (exclusions are removed before the fields are read);
 *   - accept several dependencies at once (a whole <dependencies> block);
 *   - skip an absent <version> (managed by a BOM) instead of writing
 *     "group:artifact:" - `g:a@jar`, or `g:a::classifier@jar` when a
 *     classifier is present;
 *   - ignore XML comments, decode/encode XML entities and CDATA;
 *   - accept single or double quotes, optional commas between exclude lines
 *     and `//` / `/* *\/` comments in the custom notation;
 *   - throw PomConvertError with a line number instead of returning
 *     "<!-- Invalid Custom Format -->";
 *   - validate scope/optional, honour a 2/3/4 space indent for XML output.
 */

export class PomConvertError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PomConvertError';
  }
}

/* ------------------------------------------------------------------ *
 * Templates and samples (shown as placeholders / loaded by "Sample")
 * ------------------------------------------------------------------ */

export const CUSTOM_TEMPLATE = `// Custom Format Template
scope:optional('groupId:artifactId:version:classifier@type') {
    exclude group: 'groupId', module: 'artifactId',
    exclude group: 'groupId', module: 'artifactId'
}`;

export const XML_TEMPLATE = `<!-- Maven dependency XML -->
<dependency>
  <groupId>groupId</groupId>
  <artifactId>artifactId</artifactId>
  <version>version</version>
  <classifier>classifier</classifier>
  <type>type</type>
  <scope>scope</scope>
  <optional>optional</optional>
  <exclusions>
    <exclusion>
      <groupId>groupId</groupId>
      <artifactId>artifactId</artifactId>
    </exclusion>
  </exclusions>
</dependency>`;

export const SAMPLE_XML = `<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
  <version>3.2.0</version>
  <classifier>jdk17</classifier>
  <type>jar</type>
  <scope>runtime</scope>
  <optional>false</optional>
  <exclusions>
    <exclusion>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-tomcat</artifactId>
    </exclusion>
  </exclusions>
</dependency>`;

export const SAMPLE_CUSTOM = `runtime:false('org.springframework.boot:spring-boot-starter-web:3.2.0:jdk17@jar') {
    exclude group: 'org.springframework.boot', module: 'spring-boot-starter-tomcat'
}`;

export const SAMPLE_POM = '<?xml version="1.0" encoding="UTF-8"?><project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd"><modelVersion>4.0.0</modelVersion><groupId>com.example</groupId><artifactId>demo</artifactId><version>1.0.0</version><properties><java.version>17</java.version></properties><dependencies><dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId><version>3.2.0</version></dependency><dependency><groupId>org.projectlombok</groupId><artifactId>lombok</artifactId><scope>provided</scope><optional>true</optional></dependency></dependencies></project>';

/* ------------------------------------------------------------------ *
 * XML helpers
 * ------------------------------------------------------------------ */

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };
const decodeXml = (text) => text
  .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1')
  .replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => ENTITIES[entity]);
const encodeXml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stripXmlComments = (xml) => xml.replace(/<!--[\s\S]*?-->/g, '');

/** Text of the first <tag>…</tag> in `src` ('' when absent). */
function extractTag(tag, src) {
  const match = src.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  return match ? decodeXml(match[1].trim()) : '';
}

const KNOWN_DEPENDENCY_TAGS = new Set(['groupId', 'artifactId', 'version', 'classifier', 'type', 'scope', 'optional']);

/* ------------------------------------------------------------------ *
 * Maven XML  ->  custom notation
 * ------------------------------------------------------------------ */

/** Parse every <dependency> in the XML into plain objects. */
export function parseDependenciesXml(xml) {
  const cleaned = stripXmlComments(xml);
  const blocks = [...cleaned.matchAll(/<dependency(?:\s[^>]*)?>([\s\S]*?)<\/dependency>/g)].map((m) => m[1]);
  if (blocks.length === 0) {
    throw new PomConvertError('No <dependency> element found. Paste one or more <dependency>…</dependency> blocks.');
  }

  const warnings = [];
  const dependencies = blocks.map((body, index) => {
    const label = blocks.length > 1 ? `Dependency #${index + 1}: ` : '';
    const withoutExclusions = body.replace(/<exclusions(?:\s[^>]*)?>[\s\S]*?<\/exclusions>/g, '');

    const dep = {
      groupId: extractTag('groupId', withoutExclusions),
      artifactId: extractTag('artifactId', withoutExclusions),
      version: extractTag('version', withoutExclusions),
      classifier: extractTag('classifier', withoutExclusions),
      type: extractTag('type', withoutExclusions) || 'jar',
      scope: extractTag('scope', withoutExclusions) || 'compile',
      optional: (extractTag('optional', withoutExclusions) || 'false').toLowerCase(),
      exclusions: [],
    };

    if (!dep.groupId) throw new PomConvertError(`${label}<groupId> is missing.`);
    if (!dep.artifactId) throw new PomConvertError(`${label}<artifactId> is missing.`);
    if (!/^[\w-]+$/.test(dep.scope)) throw new PomConvertError(`${label}scope "${dep.scope}" is not a valid word (compile, provided, runtime, test, system, import).`);
    if (dep.optional !== 'true' && dep.optional !== 'false') throw new PomConvertError(`${label}<optional> must be true or false, found "${dep.optional}".`);

    for (const m of body.matchAll(/<exclusion(?:\s[^>]*)?>([\s\S]*?)<\/exclusion>/g)) {
      const groupId = extractTag('groupId', m[1]);
      const artifactId = extractTag('artifactId', m[1]);
      if (!groupId || !artifactId) throw new PomConvertError(`${label}an <exclusion> needs both <groupId> and <artifactId>.`);
      dep.exclusions.push({ groupId, artifactId });
    }

    const skipped = new Set([...withoutExclusions.matchAll(/<([A-Za-z][\w.-]*)/g)].map((m) => m[1]).filter((tag) => !KNOWN_DEPENDENCY_TAGS.has(tag)));
    skipped.forEach((tag) => warnings.push(`${label}<${tag}> has no place in the custom format and was skipped.`));
    return dep;
  });

  return { dependencies, warnings };
}

/** One dependency object -> custom notation text. */
export function formatCustomDependency(dep) {
  let coords = `${dep.groupId}:${dep.artifactId}`;
  if (dep.version || dep.classifier) coords += `:${dep.version}`; // keeps the classifier slot: g:a::classifier
  if (dep.classifier) coords += `:${dep.classifier}`;
  coords += `@${dep.type}`;

  let text = `${dep.scope}:${dep.optional}('${coords}')`;
  if (dep.exclusions.length > 0) {
    const lines = dep.exclusions.map((e) => `    exclude group: '${e.groupId}', module: '${e.artifactId}'`);
    text += ` {\n${lines.join(',\n')}\n}`;
  }
  return text;
}

/** Converts Maven XML dependency text to the custom build format. */
export function xmlToCustom(xmlString) {
  const { dependencies, warnings } = parseDependenciesXml(xmlString);
  return { output: dependencies.map(formatCustomDependency).join('\n'), count: dependencies.length, warnings };
}

/* ------------------------------------------------------------------ *
 * custom notation  ->  Maven XML
 * ------------------------------------------------------------------ */

function stripCustomComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' ')) // keep line numbers stable
    .split('\n')
    .map((line) => line.replace(/(^|\s)\/\/.*$/, '$1'))
    .join('\n');
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/** Parse custom notation into dependency objects. */
export function parseCustom(customString) {
  const text = stripCustomComments(customString);
  const head = /([\w-]+)\s*:\s*([\w-]+)\s*\(\s*(['"])(.*?)\3\s*\)/y;
  const warnings = [];
  const dependencies = [];
  let pos = 0;

  for (;;) {
    while (pos < text.length && /[\s,;]/.test(text[pos])) pos += 1;
    if (pos >= text.length) break;

    head.lastIndex = pos;
    const match = head.exec(text);
    if (!match) {
      const found = text.slice(pos).split('\n')[0].trim().slice(0, 50);
      throw new PomConvertError(`Line ${lineOf(text, pos)}: expected scope:optional('groupId:artifactId:version:classifier@type'), found "${found}".`);
    }
    const startLine = lineOf(text, pos);
    const [whole, scope, optionalRaw, , coordinates] = match;
    pos = head.lastIndex;
    const label = `Line ${startLine}: `;

    const optional = optionalRaw.toLowerCase();
    if (optional !== 'true' && optional !== 'false') throw new PomConvertError(`${label}optional must be true or false, found "${optionalRaw}" in ${whole.slice(0, 40)}…`);

    // groupId:artifactId[:version[:classifier]][@type]
    const at = coordinates.lastIndexOf('@');
    const type = at >= 0 ? coordinates.slice(at + 1).trim() : 'jar';
    const parts = (at >= 0 ? coordinates.slice(0, at) : coordinates).split(':').map((part) => part.trim());
    if (parts.length > 4) throw new PomConvertError(`${label}too many ":" parts in '${coordinates}' - expected groupId:artifactId:version:classifier@type.`);
    const [groupId = '', artifactId = '', version = '', classifier = ''] = parts;
    if (!groupId || !artifactId) throw new PomConvertError(`${label}'${coordinates}' needs at least groupId:artifactId.`);

    const dep = { groupId, artifactId, version, classifier, type: type || 'jar', scope, optional, exclusions: [] };

    // optional { exclude group: '…', module: '…' } closure
    let lookahead = pos;
    while (lookahead < text.length && /\s/.test(text[lookahead])) lookahead += 1;
    if (text[lookahead] === '{') {
      const close = text.indexOf('}', lookahead);
      if (close < 0) throw new PomConvertError(`${label}missing closing "}" for the exclusions block.`);
      const body = text.slice(lookahead + 1, close);
      const exclude = /exclude\s+group\s*:\s*(['"])(.*?)\1\s*,\s*module\s*:\s*(['"])(.*?)\3/g;
      for (const m of body.matchAll(exclude)) dep.exclusions.push({ groupId: m[2].trim(), artifactId: m[4].trim() });
      const leftover = body.replace(exclude, '').replace(/[\s,;]/g, '');
      if (leftover) warnings.push(`${label}unrecognised text inside { } was ignored: "${leftover.slice(0, 40)}".`);
      pos = close + 1;
    }
    dependencies.push(dep);
  }

  if (dependencies.length === 0) throw new PomConvertError("No dependency found. Expected scope:optional('groupId:artifactId:version:classifier@type').");
  return { dependencies, warnings };
}

/** One dependency object -> <dependency> XML using `indent` spaces. */
export function formatXmlDependency(dep, indent = 2) {
  const u = ' '.repeat(indent);
  const tag = (depth, name, value) => `${u.repeat(depth)}<${name}>${encodeXml(value)}</${name}>`;
  const lines = ['<dependency>', tag(1, 'groupId', dep.groupId), tag(1, 'artifactId', dep.artifactId)];
  if (dep.version) lines.push(tag(1, 'version', dep.version));
  if (dep.classifier) lines.push(tag(1, 'classifier', dep.classifier));
  lines.push(tag(1, 'type', dep.type), tag(1, 'scope', dep.scope), tag(1, 'optional', dep.optional));
  if (dep.exclusions.length > 0) {
    lines.push(`${u}<exclusions>`);
    dep.exclusions.forEach((e) => {
      lines.push(`${u.repeat(2)}<exclusion>`, tag(3, 'groupId', e.groupId), tag(3, 'artifactId', e.artifactId), `${u.repeat(2)}</exclusion>`);
    });
    lines.push(`${u}</exclusions>`);
  }
  lines.push('</dependency>');
  return lines.join('\n');
}

/** Converts custom build notation back to Maven XML dependencies. */
export function customToXml(customString, { indent = 2 } = {}) {
  const { dependencies, warnings } = parseCustom(customString);
  return { output: dependencies.map((dep) => formatXmlDependency(dep, indent)).join('\n'), count: dependencies.length, warnings };
}

/* ------------------------------------------------------------------ *
 * XML pretty printer (whole POM)
 * ------------------------------------------------------------------ */

/** Re-indents XML with `indent` spaces; text-only elements stay on one line. */
export function formatPomXml(xml, indent = 2) {
  const source = xml.trim();
  if (!source) throw new PomConvertError('Nothing to format.');

  const tokens = source.matchAll(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/?[A-Za-z_][^>]*>|[^<]+/g);
  const root = { children: [] };
  const stack = [root];
  let elements = 0;

  for (const token of tokens) {
    const raw = token[0];
    const top = stack[stack.length - 1];
    if (raw.startsWith('<!--') || raw.startsWith('<?') || raw.startsWith('<!DOCTYPE')) {
      top.children.push({ kind: 'raw', text: raw });
    } else if (raw.startsWith('<![CDATA[')) {
      top.children.push({ kind: 'text', text: raw });
    } else if (raw.startsWith('</')) {
      const name = raw.slice(2, -1).trim();
      if (stack.length === 1 || top.name !== name) {
        throw new PomConvertError(`Line ${lineOf(source, token.index)}: </${name}> does not match ${stack.length > 1 ? `<${top.name}>` : 'any open tag'}.`);
      }
      stack.pop();
    } else if (raw.startsWith('<')) {
      const selfClosing = raw.endsWith('/>');
      const name = raw.match(/^<([^\s>/]+)/)[1];
      const attrs = raw.slice(1 + name.length, raw.length - (selfClosing ? 2 : 1)).replace(/\s+/g, ' ').trimEnd();
      const element = { kind: 'element', name, attrs, selfClosing, children: [], line: lineOf(source, token.index) };
      top.children.push(element);
      elements += 1;
      if (!selfClosing) stack.push(element);
    } else if (raw.trim()) {
      top.children.push({ kind: 'text', text: raw.replace(/\s+/g, ' ').trim() });
    }
  }
  if (stack.length > 1) throw new PomConvertError(`Line ${stack[stack.length - 1].line}: <${stack[stack.length - 1].name}> is never closed.`);
  if (elements === 0) throw new PomConvertError('No XML elements found.');

  const unit = ' '.repeat(indent);
  const out = [];
  const print = (node, depth) => {
    const pad = unit.repeat(depth);
    if (node.kind === 'raw' || node.kind === 'text') {
      out.push(`${pad}${node.text}`);
      return;
    }
    const open = `<${node.name}${node.attrs ? ` ${node.attrs.trimStart()}` : ''}`;
    if (node.selfClosing) {
      out.push(`${pad}${open}/>`);
    } else if (node.children.length === 0) {
      out.push(`${pad}${open}></${node.name}>`);
    } else if (node.children.every((child) => child.kind === 'text')) {
      out.push(`${pad}${open}>${node.children.map((child) => child.text).join(' ')}</${node.name}>`);
    } else {
      out.push(`${pad}${open}>`);
      node.children.forEach((child) => print(child, depth + 1));
      out.push(`${pad}</${node.name}>`);
    }
  };
  root.children.forEach((child) => print(child, 0));
  return { output: out.join('\n'), count: elements, warnings: [] };
}

/* ------------------------------------------------------------------ *
 * Single entry point used by the page
 * ------------------------------------------------------------------ */

export const MODES = {
  'xml-to-custom': (text) => xmlToCustom(text),
  'custom-to-xml': (text, options) => customToXml(text, options),
  'format-pom': (text, options) => formatPomXml(text, options?.indent),
};

/** convert('xml-to-custom' | 'custom-to-xml' | 'format-pom', text, { indent }) */
export function convert(mode, text, options = {}) {
  if (!MODES[mode]) throw new PomConvertError(`Unknown conversion "${mode}".`);
  if (!text || !text.trim()) throw new PomConvertError('Nothing to convert - type or paste something on the left, or press Sample.');
  return MODES[mode](text, options);
}
