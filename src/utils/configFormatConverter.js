import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export const CONFIG_FORMATS = {
  properties: { label: 'Java Properties', file: 'application.properties', badge: 'PROP', mode: 'properties' },
  yaml: { label: 'YAML', file: 'application.yml', badge: 'YAML', mode: 'yaml' },
  json: { label: 'JSON', file: 'application.json', badge: 'JSON', mode: 'json' },
};

export const SAMPLE_PROPERTIES = `server.port=8081
spring.application.name=codetrove

# Database connection settings
spring.datasource.url=jdbc:mysql://localhost:3306/mydatabase
spring.datasource.username=root
spring.datasource.password=secret

# JPA and Hibernate settings
spring.jpa.show-sql=true
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

config[0].name=Hibernate ORM
config[0].category=Java DB Frameworks
config[0].origin.type=Framework
config[0].origin.ecosystem=Java / Spring
config[1].name=Spring Data JPA
config[1].category=Java DB Frameworks
config[1].origin.type=Abstraction Layer
config[1].origin.ecosystem=Spring Boot
config[2].name=Flyway
config[2].category=Java DB Frameworks
config[2].origin.type=Database Migration
config[2].origin.ecosystem=Java / Spring`;

export class ConfigConvertError extends Error {
  constructor(message) { super(message); this.name = 'ConfigConvertError'; }
}

function unescapeProperty(value) {
  return value.replace(/\\(u[0-9a-fA-F]{4}|t|n|r|f|\\|:|=|\s)/g, (match, code) => {
    if (code.startsWith('u')) return String.fromCharCode(parseInt(code.slice(1), 16));
    return ({ t: '\t', n: '\n', r: '\r', f: '\f', '\\': '\\', ':': ':', '=': '=', ' ': ' ' })[code] ?? code;
  });
}

function parseProperties(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const entries = {};
  let pending = '';
  for (let i = 0; i < lines.length; i++) {
    let line = pending + lines[i];
    const lineNumber = i + 1;
    if (/\\\s*$/.test(line)) { pending = line.replace(/\\\s*$/, ''); continue; }
    pending = '';
    line = line.trim();
    if (!line || /^[#!]/.test(line)) continue;
    let splitAt = -1;
    let escaped = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (escaped) { escaped = false; continue; }
      if (c === '\\') { escaped = true; continue; }
      if (c === '=' || c === ':' || /\s/.test(c)) { splitAt = j; break; }
    }
    const rawKey = splitAt < 0 ? line : line.slice(0, splitAt);
    let valueStart = splitAt < 0 ? line.length : splitAt;
    while (valueStart < line.length && /\s/.test(line[valueStart])) valueStart++;
    if (line[valueStart] === '=' || line[valueStart] === ':') valueStart++;
    while (valueStart < line.length && /\s/.test(line[valueStart])) valueStart++;
    const key = unescapeProperty(rawKey);
    if (!key) throw new ConfigConvertError(`Line ${lineNumber}: property key cannot be empty.`);
    entries[key] = unescapeProperty(line.slice(valueStart));
  }
  if (pending) throw new ConfigConvertError('The final properties line ends with a continuation backslash.');
  return entries;
}

function inferScalar(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value)) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return value;
}

function pathParts(key) {
  const parts = [];
  key.replace(/([^.[\]]+)|\[(\d+)\]/g, (_, plain, index) => { parts.push(index === undefined ? plain : Number(index)); return ''; });
  return parts.length ? parts : [key];
}

function setNested(root, key, value) {
  const parts = pathParts(key);
  let current = root;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const last = i === parts.length - 1;
    if (last) { current[part] = value; continue; }
    const nextIsIndex = typeof parts[i + 1] === 'number';
    if (current[part] == null || typeof current[part] !== 'object') current[part] = nextIsIndex ? [] : {};
    current = current[part];
  }
}

function propertiesToObject(text, nested) {
  const flat = parseProperties(text);
  if (!nested) return Object.fromEntries(Object.entries(flat).map(([key, value]) => [key, inferScalar(value)]));
  const root = {};
  for (const [key, value] of Object.entries(flat)) setNested(root, key, inferScalar(value));
  return root;
}

function flattenObject(value, prefix = '', result = {}) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenObject(item, `${prefix}[${index}]`, result));
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      const next = prefix ? `${prefix}.${key}` : key;
      flattenObject(item, next, result);
    }
  } else if (prefix) {
    result[prefix] = value == null ? '' : String(value);
  }
  return result;
}

function escapeProperty(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
}

function objectToProperties(value) {
  return Object.entries(flattenObject(value)).map(([key, item]) => `${escapeProperty(key)}=${escapeProperty(item)}`).join('\n');
}

export function parseConfig(text, format, { writeNestedKeys = false } = {}) {
  if (!text.trim()) throw new ConfigConvertError('Enter some source content, or choose Sample to load an example.');
  try {
    if (format === 'properties') return propertiesToObject(text, writeNestedKeys);
    if (format === 'yaml') {
      const value = parseYaml(text);
      if (value === undefined) throw new ConfigConvertError('The YAML document is empty.');
      return value;
    }
    if (format === 'json') return JSON.parse(text);
    throw new ConfigConvertError(`Unsupported source format: ${format}`);
  } catch (error) {
    if (error instanceof ConfigConvertError) throw error;
    const detail = error?.message || String(error);
    throw new ConfigConvertError(`${format.toUpperCase()} validation failed: ${detail}`);
  }
}

export function stringifyConfig(value, format, { indent = 2 } = {}) {
  try {
    if (format === 'properties') return objectToProperties(value);
    if (format === 'yaml') return stringifyYaml(value, { indent: 2, lineWidth: 0, sortMapEntries: false }).trimEnd();
    if (format === 'json') return JSON.stringify(value, null, Number(indent) || 2);
    throw new ConfigConvertError(`Unsupported target format: ${format}`);
  } catch (error) {
    if (error instanceof ConfigConvertError) throw error;
    throw new ConfigConvertError(`Could not format as ${format.toUpperCase()}: ${error?.message || error}`);
  }
}

export function convertConfig(text, sourceFormat, targetFormat, options = {}) {
  const value = parseConfig(text, sourceFormat, options);
  return { output: stringifyConfig(value, targetFormat, options), value };
}

export function formatConfig(text, format, options = {}) {
  return stringifyConfig(parseConfig(text, format, options), format, options);
}
