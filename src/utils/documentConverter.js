import Papa from 'papaparse';
import JSON5 from 'json5';

export const DOCUMENT_FORMATS = {
  csv: { label: 'CSV', extension: '.csv', mimeType: 'text/csv;charset=utf-8' },
  json: { label: 'JSON', extension: '.json', mimeType: 'application/json;charset=utf-8' },
  xlsx: { label: 'Excel workbook', extension: '.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
};

export const SAMPLE_CSV = [
  'Order ID,Customer Name,Region,Amount,Status,Internal Note',
  '1001,Ada Lovelace,EMEA,1250.5,paid,"Fast delivery; first order"',
  '1002,Grace Hopper,Americas,980,paid,"Send the invoice"',
  '1003,Linus Torvalds,EMEA,340,pending,"Hold for review"',
].join('\n');

export const SAMPLE_JSON = JSON.stringify([
  { 'Order ID': 1001, 'Customer Name': 'Ada Lovelace', Region: 'EMEA', Amount: 1250.5, Status: 'paid', 'Internal Note': 'Fast delivery; first order' },
  { 'Order ID': 1002, 'Customer Name': 'Grace Hopper', Region: 'Americas', Amount: 980, Status: 'paid', 'Internal Note': 'Send the invoice' },
  { 'Order ID': 1003, 'Customer Name': 'Linus Torvalds', Region: 'EMEA', Amount: 340, Status: 'pending', 'Internal Note': 'Hold for review' },
], null, 2);

export const SAMPLE_MAPPING_RULES = `{
  "mapping": {
    "Order ID": "orderId",
    "Customer Name": "customerName",
    "Region": "region",
    "Amount": "amount",
    "Status": "status"
  },
  "skip": ["Internal Note"]
}`;

const BLOCKED_FIELD_NAMES = new Set(['__proto__', 'prototype', 'constructor']);
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function normalizeCellValue(value) {
  if (value === undefined || value === null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'object') return value;
  if (typeof value.text === 'string') return value.text;
  if (Array.isArray(value.richText)) return value.richText.map((part) => part?.text || '').join('');
  if (Object.prototype.hasOwnProperty.call(value, 'result')) return normalizeCellValue(value.result);
  if (value.hyperlink && value.text) return value.text;
  if (value.formula) return value.result ?? `=${value.formula}`;
  try { return JSON.stringify(value); } catch { return String(value); }
}

/** Build a rectangular table from a two-dimensional row array; the first row is the header. */
export function tableFromRows(inputRows) {
  const rows = (Array.isArray(inputRows) ? inputRows : [])
    .filter((row) => Array.isArray(row))
    .map((row) => row.map(normalizeCellValue));
  while (rows.length && rows[rows.length - 1].every((cell) => cell === '')) rows.pop();
  if (!rows.length || rows[0].every((cell) => cell === '')) {
    throw new Error('The source has no header row. Add a first row with column names, then preview again.');
  }

  const width = rows.reduce((maximum, row) => Math.max(maximum, row.length), 0);
  const occurrences = new Map();
  const usedKeys = new Set();
  const headers = Array.from({ length: width }, (_, index) => {
    const label = String(rows[0][index] ?? '').trim() || `Column ${index + 1}`;
    let count = (occurrences.get(label) || 0) + 1;
    let key = count === 1 ? label : `${label} (${count})`;
    while (usedKeys.has(key)) {
      count += 1;
      key = `${label} (${count})`;
    }
    occurrences.set(label, count);
    usedKeys.add(key);
    return { key, label, index };
  });
  const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell !== '')).map((row) => (
    Array.from({ length: width }, (_, index) => row[index] ?? '')
  ));
  return { headers, rows: dataRows };
}

export function parseCsvTable(source, delimiter = '') {
  if (!String(source || '').trim()) throw new Error('CSV input is empty. Paste data or load a sample file.');
  const parsed = Papa.parse(String(source), {
    header: false,
    delimiter: delimiter || '',
    dynamicTyping: false,
    skipEmptyLines: 'greedy',
  });
  if (parsed.errors?.length) {
    const first = parsed.errors[0];
    const row = Number.isInteger(first.row) ? ` on row ${first.row + 1}` : '';
    throw new Error(`CSV parsing failed${row}: ${first.message}`);
  }
  return tableFromRows(parsed.data);
}

export function parseJsonTable(source) {
  let value;
  try { value = JSON.parse(String(source || '')); }
  catch (error) { throw new Error(`Invalid JSON: ${error.message}`); }
  const records = Array.isArray(value) ? value : isRecord(value) ? [value] : null;
  if (!records || records.some((record) => !isRecord(record))) {
    throw new Error('JSON input must be an object or an array of flat objects.');
  }
  if (!records.length) throw new Error('The JSON array is empty. Add at least one object.');
  const keys = [];
  const seen = new Set();
  records.forEach((record) => Object.keys(record).forEach((key) => {
    if (!seen.has(key)) { seen.add(key); keys.push(key); }
  }));
  if (!keys.length) throw new Error('The JSON objects have no fields to convert.');
  return {
    headers: keys.map((key, index) => ({ key, label: key, index })),
    rows: records.map((record) => keys.map((key) => normalizeCellValue(record[key]))),
  };
}

export function createDefaultMappingRules(headers) {
  const mapping = Object.fromEntries((headers || []).map(({ key }) => [key, key]));
  return JSON.stringify({ mapping, skip: [] }, null, 2);
}

export function readMappingRules(rulesText) {
  const text = String(rulesText || '').trim();
  if (!text) return { mapping: {}, skip: [] };
  let rules;
  try { rules = JSON5.parse(text); }
  catch (error) { throw new Error(`Format rules must be a valid JSON object: ${error.message}`); }
  if (!isRecord(rules)) throw new Error('Format rules must be a JSON object.');
  if (rules.mapping !== undefined && !isRecord(rules.mapping)) throw new Error('The "mapping" rule must be an object of source headers and output fields.');
  if (rules.skip !== undefined && (!Array.isArray(rules.skip) || rules.skip.some((key) => typeof key !== 'string'))) {
    throw new Error('The "skip" rule must be an array of source column names.');
  }
  return { mapping: rules.mapping || {}, skip: rules.skip || [] };
}

export function applyColumnMapping(table, rulesText) {
  if (!table?.headers?.length) throw new Error('Preview the source data before converting.');
  const { mapping, skip } = readMappingRules(rulesText);
  const validKeys = new Set(table.headers.map(({ key }) => key));
  for (const key of Object.keys(mapping)) {
    if (!validKeys.has(key)) throw new Error(`Format rules refer to unknown column "${key}". Press Preview to refresh the available columns.`);
  }
  for (const key of skip) {
    if (!validKeys.has(key)) throw new Error(`The skip rule refers to unknown column "${key}". Press Preview to refresh the available columns.`);
  }

  const selected = [];
  const outputNames = new Set();
  table.headers.forEach((header) => {
    const hasMapping = Object.prototype.hasOwnProperty.call(mapping, header.key);
    const mappedValue = hasMapping ? mapping[header.key] : header.key;
    const skipped = skip.includes(header.key) || skip.includes(header.label) || mappedValue === null || mappedValue === '';
    if (skipped) return;
    if (typeof mappedValue !== 'string') throw new Error(`The mapping for "${header.key}" must be a string, an empty string, or null.`);
    const outputName = mappedValue.trim();
    if (!outputName) return;
    if (BLOCKED_FIELD_NAMES.has(outputName)) throw new Error(`"${outputName}" is not a safe JSON field name.`);
    if (outputNames.has(outputName)) throw new Error(`More than one source column maps to "${outputName}". Give each included column a unique output field.`);
    outputNames.add(outputName);
    selected.push({ sourceIndex: header.index, outputName });
  });
  if (!selected.length) throw new Error('All columns are skipped. Keep or map at least one column.');

  return {
    headers: selected.map(({ outputName }) => outputName),
    rows: table.rows.map((row) => selected.map(({ sourceIndex }) => row[sourceIndex] ?? '')),
  };
}

export function serializeCsv(table, delimiter = ',', options = {}) {
  return Papa.unparse({ fields: table.headers, data: table.rows }, {
    delimiter: delimiter || ',',
    newline: '\r\n',
    header: true,
    escapeFormulae: options.escapeFormulae ?? true,
  });
}

export function serializeJson(table, indent = 2) {
  const records = table.rows.map((row) => {
    const record = {};
    table.headers.forEach((header, index) => { record[header] = row[index] ?? ''; });
    return record;
  });
  return JSON.stringify(records, null, Number(indent) === 4 ? 4 : 2);
}
