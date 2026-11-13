export const JSON_TO_GRAPHQL_SAMPLE = `{
  "user": {
    "id": 101,
    "name": "Ada Lovelace",
    "active": true,
    "score": 98.5,
    "roles": ["admin", "author"],
    "address": {
      "city": "London",
      "country": "UK"
    },
    "projects": [
      {
        "id": 1,
        "name": "Analytical Engine",
        "tags": ["history", "computing"]
      }
    ]
  }
}`;

const GRAPHQL_SCALARS = new Set(['String', 'Int', 'Float', 'Boolean', 'ID']);
const INVALID_NAME_CHARACTERS = /[^_0-9A-Za-z]/g;

function pascalCase(value, fallback = 'GeneratedType') {
  const words = String(value || '')
    .replace(INVALID_NAME_CHARACTERS, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  let name = words.join('') || fallback;
  if (/^\d/.test(name)) name = `${fallback}${name}`;
  return name;
}

function fieldName(value, index) {
  let name = String(value || '').replace(INVALID_NAME_CHARACTERS, ' ').trim().split(/\s+/).filter(Boolean).join('_');
  if (!name) name = `field_${index + 1}`;
  if (/^\d/.test(name)) name = `field_${name}`;
  return name;
}

function scalarType(value) {
  if (typeof value === 'boolean') return 'Boolean';
  if (typeof value === 'number') return Number.isInteger(value) ? 'Int' : 'Float';
  return 'String';
}

function nonNull(type, required) {
  return required ? `${type}!` : type;
}

function firstMeaningfulValue(values) {
  return values.find((value) => value !== null && value !== undefined);
}

function mergeObjectValues(values) {
  const objects = values.filter((value) => value && typeof value === 'object' && !Array.isArray(value));
  const merged = {};
  objects.forEach((object) => Object.entries(object).forEach(([key, value]) => {
    if (!Object.prototype.hasOwnProperty.call(merged, key) || merged[key] === null) merged[key] = value;
  }));
  return merged;
}

function makeContext(makeFieldsNullable) {
  return {
    makeFieldsNullable,
    definitions: new Map(),
    usedNames: new Set(GRAPHQL_SCALARS),
  };
}

function uniqueTypeName(preferred, context) {
  const base = pascalCase(preferred);
  let name = base;
  let suffix = 2;
  while (context.usedNames.has(name)) name = `${base}${suffix++}`;
  context.usedNames.add(name);
  return name;
}

function inferType(value, preferredName, context, required) {
  if (value === null || value === undefined) return 'String';
  if (Array.isArray(value)) {
    const item = firstMeaningfulValue(value);
    const itemType = item === undefined ? 'String' : inferType(item, `${preferredName}Item`, context, true);
    return nonNull(`[${itemType}]`, required);
  }
  if (typeof value === 'object') {
    const typeName = uniqueTypeName(preferredName, context);
    context.definitions.set(typeName, null);
    const fields = Object.entries(value).map(([key, child], index) => {
      const childName = fieldName(key, index);
      const childRequired = !context.makeFieldsNullable && child !== null && child !== undefined;
      const childType = inferType(child, `${typeName}${pascalCase(childName)}`, context, childRequired);
      return { name: childName, type: childType };
    });
    context.definitions.set(typeName, fields);
    return nonNull(typeName, required);
  }
  return nonNull(scalarType(value), required);
}

function formatDefinition(name, fields) {
  const body = fields.map(({ name: field, type }) => `  ${field}: ${type}`).join('\n');
  return `type ${name} {\n${body}\n}`;
}

function querySelection(value, depth = 0) {
  if (depth > 5 || value === null || value === undefined) return '';
  if (Array.isArray(value)) return querySelection(firstMeaningfulValue(value), depth);
  if (typeof value !== 'object') return '';
  return Object.entries(value).map(([key, child]) => {
    const name = fieldName(key, 0);
    const nested = querySelection(child, depth + 1);
    return nested ? `${'  '.repeat(depth + 1)}${name} {\n${nested}\n${'  '.repeat(depth + 1)}}` : `${'  '.repeat(depth + 1)}${name}`;
  }).join('\n');
}

export function convertJsonToGraphql(source, options = {}) {
  const rootTypeName = pascalCase(options.rootTypeName || 'Root');
  const makeFieldsNullable = Boolean(options.makeFieldsNullable);
  const generateQuery = options.generateQuery !== false;
  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
  if (parsed === null || typeof parsed !== 'object') throw new Error('The root JSON value must be an object or array.');

  const context = makeContext(makeFieldsNullable);
  let rootValue = parsed;
  if (Array.isArray(parsed)) rootValue = firstMeaningfulValue(parsed) || {};
  const rootType = inferType(rootValue, rootTypeName, context, false).replace(/!$/, '');
  const definitions = [...context.definitions.entries()].filter(([, fields]) => fields).map(([name, fields]) => formatDefinition(name, fields));
  const queryType = `type Query {\n  data: ${rootType}\n}`;
  const schema = [...definitions, queryType].join('\n\n');
  const query = generateQuery ? `query Example {\n  data {\n${querySelection(rootValue)}\n  }\n}` : '';
  return { schema, query, parsed, rootType };
}

export function isGraphqlScalar(type) {
  return GRAPHQL_SCALARS.has(type.replace(/[[\]!]/g, ''));
}
