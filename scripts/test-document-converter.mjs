import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  applyColumnMapping,
  parseCsvTable,
  parseJsonTable,
  SAMPLE_CSV,
  SAMPLE_JSON,
  SAMPLE_MAPPING_RULES,
  serializeCsv,
  serializeJson,
  tableFromRows,
} from '../src/utils/documentConverter.js';
import { getSampleFormatRules } from '../src/utils/codeFormatter.js';

const csvTable = parseCsvTable(SAMPLE_CSV);
assert.equal(csvTable.headers.length, 6);
assert.equal(csvTable.rows.length, 3);
assert.equal(csvTable.rows[0][1], 'Ada Lovelace');

const mapped = applyColumnMapping(csvTable, SAMPLE_MAPPING_RULES);
assert.deepEqual(mapped.headers, ['orderId', 'customerName', 'region', 'amount', 'status']);
assert.equal(mapped.rows[0][0], '1001');
assert.equal(mapped.rows[0][1], 'Ada Lovelace');
assert.equal(mapped.rows[0].length, 5, 'the Internal Note column is skipped');

const jsonRoundTrip = parseJsonTable(serializeJson(mapped, 4));
assert.deepEqual(jsonRoundTrip.headers.map(({ key }) => key), mapped.headers);
assert.equal(jsonRoundTrip.rows.length, 3);
assert.equal(JSON.parse(serializeJson(mapped, 4))[0].customerName, 'Ada Lovelace');

const multiline = parseCsvTable('id,note\n1,"line one, with comma\nline two"\n');
assert.equal(multiline.rows[0][1], 'line one, with comma\nline two');

const duplicateHeaders = parseCsvTable('name,name\nfirst,second');
assert.deepEqual(duplicateHeaders.headers.map(({ key }) => key), ['name', 'name (2)']);
const duplicateMapped = applyColumnMapping(duplicateHeaders, '{ mapping: { name: "firstName", "name (2)": "lastName" }, skip: [] }');
assert.deepEqual(duplicateMapped.rows[0], ['first', 'second']);

const jsonTable = parseJsonTable(SAMPLE_JSON);
assert.equal(jsonTable.rows.length, 3);
assert.equal(jsonTable.headers[0].key, 'Order ID');

const csvSafe = serializeCsv({ headers: ['value'], rows: [['=2+2']] });
assert.match(csvSafe, /'=2\+2/, 'formula-like output should be escaped before opening in spreadsheet software');

assert.throws(() => parseJsonTable('{not valid json'), /Invalid JSON/);
assert.throws(() => parseCsvTable(''), /empty/);
assert.throws(() => applyColumnMapping(csvTable, '{ mapping: { Unknown: "field" }, skip: [] }'), /unknown column/);
assert.throws(() => applyColumnMapping(csvTable, '{ mapping: { "Order ID": "__proto__" }, skip: [] }'), /not a safe/);
assert.throws(() => applyColumnMapping(csvTable, '{ mapping: { "Order ID": "same", "Customer Name": "same" }, skip: [] }'), /unique output field/);
assert.throws(() => tableFromRows([]), /no header row/);

const ExcelJSModule = await import('exceljs');
const ExcelJS = ExcelJSModule.default || ExcelJSModule;
const workbook = new ExcelJS.Workbook();
const originalSheet = workbook.addWorksheet('Original');
originalSheet.addRow(['id', 'name']);
originalSheet.addRow([1, 'Ada']);
const bytes = await workbook.xlsx.writeBuffer();
const reopened = new ExcelJS.Workbook();
await reopened.xlsx.load(bytes);
assert.deepEqual(reopened.worksheets.map((worksheet) => worksheet.name), ['Original']);
const resultSheet = reopened.addWorksheet('Converted data');
resultSheet.addRow(['customerId', 'customerName']);
resultSheet.addRow([1, 'Ada Lovelace']);
const outputBytes = await reopened.xlsx.writeBuffer();
const verified = new ExcelJS.Workbook();
await verified.xlsx.load(outputBytes);
assert.deepEqual(verified.worksheets.map((worksheet) => worksheet.name), ['Original', 'Converted data']);
assert.equal(verified.getWorksheet('Converted data').getCell('B2').value, 'Ada Lovelace');

const formatterRules = JSON.parse(getSampleFormatRules());
assert.equal(typeof formatterRules.singleQuote, 'boolean');
assert.ok('clangStyle' in formatterRules && 'pythonQuoteStyle' in formatterRules);
const runnableCode = await readFile(new URL('../src/components/CodeRunner/RunnableCode.jsx', import.meta.url), 'utf8');
assert.match(runnableCode, /<span>Format rules<\/span>/);
assert.match(runnableCode, /Sample rules/);
assert.match(runnableCode, /<details className="runnable-code__input" open=/);

const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const registry = await readFile(new URL('../src/data/topics/index.js', import.meta.url), 'utf8');
assert.match(app, /\/build\/tools\/document-converter/);
assert.match(registry, /internalTool: 'document-converter'/);

console.log('Document Converter tests passed: CSV/JSON parsing, mapping and skip rules, formula protection, XLSX worksheet preservation, compiler formatter example, and route registration.');
