import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseCsvTable, tableFromRows } from '../src/utils/documentConverter.js';
import {
  compareSpreadsheetTables,
  createSpreadsheetDiffCsv,
  getSharedComparisonKeys,
  parseComparisonCsv,
  SAMPLE_AFTER_CSV,
  SAMPLE_BEFORE_CSV,
  worksheetToComparisonTable,
} from '../src/utils/spreadsheetCompare.js';

const before = parseComparisonCsv(SAMPLE_BEFORE_CSV);
const after = parseComparisonCsv(SAMPLE_AFTER_CSV);
assert.equal(before.rows.length, 4);
assert.equal(after.rows.length, 4);

const sampleDiff = compareSpreadsheetTables(before, after, { matchBy: 'key', key: 'Employee ID' });
assert.deepEqual(sampleDiff.summary, { total: 5, added: 1, removed: 1, changed: 3, unchanged: 0, changedCells: 5 });
assert.deepEqual(sampleDiff.addedColumns, ['Status']);
assert.equal(sampleDiff.records.find((record) => record.rowKey === 'E-103')?.type, 'removed');
assert.equal(sampleDiff.records.find((record) => record.rowKey === 'E-105')?.type, 'added');
assert.deepEqual(sampleDiff.records.find((record) => record.rowKey === 'E-101')?.cells.filter((cell) => cell.changed).map((cell) => cell.label), ['Salary', 'Status']);

const leftReordered = tableFromRows([['id', 'name'], ['a', 'Ada'], ['b', 'Grace']]);
const rightReordered = tableFromRows([['name', 'id'], ['Grace', 'b'], ['Ada', 'a']]);
assert.deepEqual(getSharedComparisonKeys(leftReordered, rightReordered).map(({ key }) => key), ['id', 'name']);
const byKey = compareSpreadsheetTables(leftReordered, rightReordered, { matchBy: 'key', key: 'id' });
assert.equal(byKey.summary.changed, 0, 'key matching should tolerate row and column reordering');
assert.equal(byKey.summary.unchanged, 2);
const byPosition = compareSpreadsheetTables(leftReordered, rightReordered, { matchBy: 'position' });
assert.equal(byPosition.summary.changed, 2, 'position matching should compare corresponding row positions');

const duplicatesLeft = tableFromRows([['id', 'value'], ['same', 'old-1'], ['same', 'old-2']]);
const duplicatesRight = tableFromRows([['id', 'value'], ['same', 'new-1'], ['same', 'new-2']]);
const duplicates = compareSpreadsheetTables(duplicatesLeft, duplicatesRight, { matchBy: 'key', key: 'id' });
assert.equal(duplicates.summary.changed, 2, 'duplicate keys should match deterministically in source order');

const ignoreDiff = compareSpreadsheetTables(
  tableFromRows([['id', 'name'], ['a', 'Ada Lovelace']]),
  tableFromRows([['id', 'name'], ['a', ' ada   lovelace ']]),
  { matchBy: 'key', key: 'id', ignoreWhitespace: true, ignoreCase: true },
);
assert.equal(ignoreDiff.summary.changed, 0, 'ignore options should normalize cell values and keys');

const csvTable = parseCsvTable('code,value\n1,"comma, and quote"" inside"\n2,plain');
assert.equal(csvTable.rows[0][1], 'comma, and quote" inside');
assert.throws(() => parseComparisonCsv(''), /empty/);
assert.throws(() => compareSpreadsheetTables(before, after, { matchBy: 'key', key: 'missing' }), /present in both/);
assert.throws(() => worksheetToComparisonTable(null), /Choose a worksheet/);

const report = createSpreadsheetDiffCsv(sampleDiff);
assert.match(report, /Change,Row key,Original row,Updated row,Column,Original value,Updated value/);
assert.match(report, /removed,E-103/);
assert.match(report, /added,E-105/);
const formulaReport = createSpreadsheetDiffCsv(compareSpreadsheetTables(
  tableFromRows([['id', 'value'], ['x', '=2+2']]),
  tableFromRows([['id', 'value'], ['x', '=3+3']]),
  { matchBy: 'key', key: 'id' },
));
assert.match(formulaReport, /'=2\+2/, 'diff CSV export must escape formula-like values');

const ExcelJSModule = await import('exceljs');
const ExcelJS = ExcelJSModule.default || ExcelJSModule;
const workbook = new ExcelJS.Workbook();
const leftSheet = workbook.addWorksheet('Current');
leftSheet.addRow(['id', 'name']);
leftSheet.addRow(['1', 'Ada']);
const rightSheet = workbook.addWorksheet('Next');
rightSheet.addRow(['id', 'name']);
rightSheet.addRow(['1', 'Ada Lovelace']);
const buffer = await workbook.xlsx.writeBuffer();
const localWorkbook = new ExcelJS.Workbook();
await localWorkbook.xlsx.load(buffer);
const importedSheet = worksheetToComparisonTable(localWorkbook.getWorksheet('Next'));
assert.deepEqual(importedSheet.headers.map(({ key }) => key), ['id', 'name']);
assert.equal(importedSheet.rows[0][1], 'Ada Lovelace');
assert.equal(compareSpreadsheetTables(worksheetToComparisonTable(localWorkbook.getWorksheet('Current')), importedSheet, { matchBy: 'key', key: 'id' }).summary.changed, 1);
const wideSheet = new ExcelJS.Workbook().addWorksheet('Wide');
wideSheet.addRow(Array.from({ length: 1001 }, (_, index) => `column-${index + 1}`));
assert.throws(() => worksheetToComparisonTable(wideSheet), /more than 1,000 columns/);

const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const registry = await readFile(new URL('../src/data/topics/index.js', import.meta.url), 'utf8');
const page = await readFile(new URL('../src/pages/build/DocumentComparePage.jsx', import.meta.url), 'utf8');
assert.match(app, /\/build\/tools\/document-compare/);
assert.match(registry, /internalTool: 'document-compare'/);
assert.match(page, /Files stay in this browser/);
assert.doesNotMatch(page, /textcompare\.org|diffchecker\.com|xlcompare\.com|draftable\.com/);

console.log('Document Compare tests passed: local CSV/XLSX parsing, key/position matching, row and column changes, duplicate keys, filters, safe diff export, and route registration.');
