import JSON5 from 'json5';

export const JAVA_JSON_SAMPLE = `{
  // CodeTrove sample: a small tool catalog
  id: 42,
  name: 'JSON to Java Converter',
  active: true,
  tags: ['java', 'json5'],
  owner: {
    name: 'CodeTrove',
    website: 'https://codetrove.example'
  }
}`;

function pascalCase(value, fallback = 'GeneratedType') {
  const words = String(value || '')
    .replace(/[^0-9A-Za-z]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  let name = words.join('') || fallback;
  if (/^\d/.test(name)) name = `${fallback}${name}`;
  return name;
}

function camelCase(value, fallback = 'value') {
  const words = String(value || '').replace(/[^0-9A-Za-z]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return fallback;
  const name = words[0].toLowerCase() + words.slice(1).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  return /^\d/.test(name) ? `${fallback}${name}` : name;
}

function quote(value) {
  return JSON.stringify(value).replace(/\\u2028|\\u2029/g, '');
}

function javaScalar(value) {
  if (typeof value === 'boolean') return 'Boolean';
  if (typeof value === 'number') return Number.isInteger(value) ? 'Integer' : 'Double';
  if (typeof value === 'string') return 'String';
  return 'Object';
}

function createContext(options) {
  return { options, declarations: [], usedNames: new Set(), imports: new Set() };
}

function uniqueClassName(preferred, context) {
  const base = pascalCase(preferred);
  let name = base;
  let index = 2;
  while (context.usedNames.has(name)) name = `${base}${index++}`;
  context.usedNames.add(name);
  return name;
}

function fieldType(value, preferredName, context) {
  if (value === null || value === undefined) return 'Object';
  if (Array.isArray(value)) {
    context.imports.add('java.util.List');
    const item = value.find((entry) => entry !== null && entry !== undefined);
    return `List<${item === undefined ? 'Object' : fieldType(item, `${preferredName}Item`, context)}>`;
  }
  if (typeof value === 'object') {
    const className = uniqueClassName(preferredName, context);
    createDeclaration(className, value, context);
    return className;
  }
  return javaScalar(value);
}

function createDeclaration(className, object, context) {
  const fields = Object.entries(object).map(([key, value]) => ({
    jsonName: key,
    name: camelCase(key, 'field'),
    type: fieldType(value, `${className}${pascalCase(key)}`, context),
  }));
  context.declarations.push({ className, fields });
}

function renderPojo(declaration, options) {
  const { className, fields } = declaration;
  const lines = [];
  if (options.lombok) lines.push('@Data', '@NoArgsConstructor', '@AllArgsConstructor');
  lines.push(`public class ${className} {`);
  fields.forEach(({ name, type, jsonName }) => {
    if (name !== jsonName) lines.push(`    @JsonProperty(${quote(jsonName)})`);
    lines.push(`    private ${type} ${name};`);
  });
  if (!options.lombok) {
    if (fields.length) lines.push('');
    fields.forEach(({ name, type }) => {
      const methodName = name.charAt(0).toUpperCase() + name.slice(1);
      lines.push(`    public ${type} get${methodName}() { return ${name}; }`);
      lines.push(`    public void set${methodName}(${type} ${name}) { this.${name} = ${name}; }`);
    });
  }
  lines.push('}');
  return lines.join('\n');
}

function renderRecord(declaration, options) {
  const { className, fields } = declaration;
  const components = fields.map(({ name, type, jsonName }) => `${type} ${name}${name !== jsonName ? ` /* JSON: ${jsonName} */` : ''}`).join(',\n        ');
  return `public record ${className}(\n        ${components}\n) {\n}`;
}

export function parseJsonSource(source, syntax = 'json5') {
  try {
    const value = syntax === 'json5' ? JSON5.parse(source) : JSON.parse(source);
    if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('The root value must be a JSON object for Java class generation.');
    return value;
  } catch (error) {
    throw new Error(`Invalid ${syntax.toUpperCase()}: ${error.message}`);
  }
}

export function jsonToJava(source, options = {}) {
  const value = parseJsonSource(source, options.syntax || 'json5');
  const context = createContext({ lombok: Boolean(options.lombok) });
  const rootName = uniqueClassName(options.className || 'CodeTrovePayload', context);
  createDeclaration(rootName, value, context);
  const declarations = [...context.declarations].reverse();
  if (options.lombok) {
    context.imports.add('lombok.AllArgsConstructor');
    context.imports.add('lombok.Data');
    context.imports.add('lombok.NoArgsConstructor');
  }
  if (declarations.some(({ fields }) => fields.some(({ name, jsonName }) => name !== jsonName))) context.imports.add('com.fasterxml.jackson.annotation.JsonProperty');
  const imports = [...context.imports].sort().map((item) => `import ${item};`);
  const body = declarations.map((declaration) => options.kind === 'record' ? renderRecord(declaration, options) : renderPojo(declaration, options)).join('\n\n');
  return { code: [...imports, imports.length ? '' : null, body].filter((line) => line !== null).join('\n'), rootName, parsed: value };
}

function defaultValue(type) {
  const normalized = type.replace(/<.*>/, '').trim();
  if (/^(int|long|short|byte|Integer|Long|Short|Byte|double|float|Double|Float)$/.test(normalized)) return 0;
  if (/^(boolean|Boolean)$/.test(normalized)) return false;
  if (/^(List|Set|Collection|ArrayList)/.test(normalized)) return [];
  if (/^(Map|HashMap)/.test(normalized)) return {};
  if (/^(String|char|Character)$/.test(normalized)) return '';
  return {};
}

function splitTopLevel(value) {
  const parts = [];
  let start = 0;
  let depth = 0;
  value.split('').forEach((character, index) => {
    if ('<([{'.includes(character)) depth += 1;
    if ('>)]}'.includes(character)) depth -= 1;
    if (character === ',' && depth === 0) { parts.push(value.slice(start, index)); start = index + 1; }
  });
  parts.push(value.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}

export function javaToJson(source) {
  const text = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  const recordMatch = text.match(/record\s+\w+\s*\(([^)]*)\)/m);
  const fields = [];
  if (recordMatch) {
    splitTopLevel(recordMatch[1]).forEach((part) => {
      const match = part.match(/^([\w.$<>?, ]+)\s+(\w+)$/);
      if (match) fields.push({ type: match[1].trim(), name: match[2] });
    });
  } else {
    const fieldPattern = /(?:private|protected|public)\s+(?:static\s+|final\s+|volatile\s+)*([\w.$<>?, ]+)\s+(\w+)\s*(?:=[^;]+)?;/g;
    let match;
    while ((match = fieldPattern.exec(text))) fields.push({ type: match[1].trim(), name: match[2] });
  }
  if (!fields.length) throw new Error('No public, protected, or private fields were found. Paste a Java POJO or record declaration.');
  const object = Object.fromEntries(fields.map(({ type, name }) => [name, defaultValue(type)]));
  return { json: JSON.stringify(object, null, 2), fields };
}
