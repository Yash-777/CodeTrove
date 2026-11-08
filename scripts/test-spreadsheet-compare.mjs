import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseCsvTable, serializeCsv, tableFromRows } from '../src/utils/documentConverter.js';
import {
  applySpreadsheetGridChanges,
  copySpreadsheetSelectionAsTsv,
  deleteSpreadsheetSelection,
  SHEET_COLUMN_ID_PREFIX,
  SHEET_COLUMN_LABEL_ROW_ID,
  SHEET_DATA_ROW_PREFIX,
  SHEET_FIELD_HEADER_ROW_ID,
  SHEET_MIN_COLUMN_WIDTH,
  SHEET_MIN_ROW_HEIGHT,
  SHEET_ROW_NUMBER_COLUMN_WIDTH,
  SHEET_ROW_NUMBER_COLUMN_ID,
  resizeSpreadsheetColumnWidths,
  resizeSpreadsheetRowHeights,
  spreadsheetColumnLabel,
} from '../src/utils/spreadsheetGrid.js';
import {
  compareSpreadsheetTables,
  createRecordExportTable,
  createSpreadsheetDiffCsv,
  getSharedComparisonKeys,
  parseComparisonCsv,
  SAMPLE_AFTER_CSV,
  SAMPLE_BEFORE_CSV,
  worksheetToComparisonTable,
} from '../src/utils/spreadsheetCompare.js';

const before = parseComparisonCsv(SAMPLE_BEFORE_CSV);
const after = parseComparisonCsv(SAMPLE_AFTER_CSV);
assert.equal(before.rows.length, 21);
assert.equal(after.rows.length, 21);

const sampleDiff = compareSpreadsheetTables(before, after, { matchBy: 'key', key: 'Employee ID' });
assert.deepEqual(sampleDiff.summary, { total: 22, added: 1, removed: 1, changed: 2, unchanged: 18, changedCells: 2 });
assert.deepEqual(sampleDiff.addedColumns, []);
assert.equal(sampleDiff.records.find((record) => record.rowKey === 'E-103')?.type, 'removed');
assert.equal(sampleDiff.records.find((record) => record.rowKey === 'E-105')?.type, 'added');
assert.deepEqual(sampleDiff.records.find((record) => record.rowKey === 'E-101')?.cells.filter((cell) => cell.changed).map((cell) => cell.label), ['Salary']);
assert.equal(sampleDiff.records.find((record) => record.rowKey === 'E-102')?.type, 'unchanged');
assert.deepEqual([sampleDiff.records[0].leftRecordId, sampleDiff.records[0].rightRecordId], ['L-01', 'R-01']);
assert.equal(sampleDiff.records.find((record) => record.rowKey === 'E-104')?.rightRecordId, 'R-03', 'key matching should retain each source row ID after reordering');
const sampleLongPair = sampleDiff.records.find((record) => record.rowKey === 'E-121');
assert.deepEqual([sampleLongPair.leftRecordId, sampleLongPair.rightRecordId], ['L-21', 'R-09'], 'the visible CSV sample should demonstrate a matched key at different source row positions');
assert.ok(createRecordExportTable(sampleDiff, 'identical').rows.some((row) => row.slice(0, 3).join('|') === 'unchanged|L-21|R-09'));

const leftReordered = tableFromRows([['id', 'name'], ['a', 'Ada'], ['b', 'Grace']]);
const rightReordered = tableFromRows([['name', 'id'], ['Grace', 'b'], ['Ada', 'a']]);
assert.deepEqual(getSharedComparisonKeys(leftReordered, rightReordered).map(({ key }) => key), ['id', 'name']);
const byKey = compareSpreadsheetTables(leftReordered, rightReordered, { matchBy: 'key', key: 'id' });
assert.equal(byKey.summary.changed, 0, 'key matching should tolerate row and column reordering');
assert.equal(byKey.summary.unchanged, 2);
const leftLong = tableFromRows([['id', 'value'], ...Array.from({ length: 21 }, (_, index) => [`key-${index + 1}`, `value-${index + 1}`])]);
const rightLong = tableFromRows([['id', 'value'], ...Array.from({ length: 8 }, (_, index) => [`other-${index + 1}`, `right-${index + 1}`]), ['key-21', 'value-21']]);
const pairedLong = compareSpreadsheetTables(leftLong, rightLong, { matchBy: 'key', key: 'id' });
const pairedRecord = pairedLong.records.find((record) => record.rowKey === 'key-21');
assert.deepEqual([pairedRecord.leftRecordId, pairedRecord.rightRecordId], ['L-21', 'R-09'], 'record IDs should preserve each side’s source data-row order');
assert.deepEqual(createRecordExportTable(pairedLong, 'identical').rows[0].slice(0, 3), ['unchanged', 'L-21', 'R-09']);
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

const ignoredColumnDiff = compareSpreadsheetTables(
  tableFromRows([['id', 'name', 'internal'], ['21', 'Ada', 'old note']]),
  tableFromRows([['id', 'name', 'internal'], ['21', 'Ada', 'new note']]),
  { matchBy: 'position', ignoredColumns: ['internal'] },
);
assert.equal(ignoredColumnDiff.summary.unchanged, 1, 'an ignored column must not affect comparison classification');
assert.equal(ignoredColumnDiff.records[0].leftRecordId, 'L-01');
assert.equal(ignoredColumnDiff.records[0].rightRecordId, 'R-01');
assert.deepEqual(ignoredColumnDiff.records[0].cells.map((cell) => cell.label), ['id', 'name']);
assert.deepEqual(createRecordExportTable(ignoredColumnDiff, 'identical').headers.slice(0, 3), ['Record status', 'L-ID', 'R-ID']);
assert.deepEqual(createRecordExportTable(ignoredColumnDiff, 'identical').rows[0].slice(0, 3), ['unchanged', 'L-01', 'R-01']);
assert.equal(createRecordExportTable(ignoredColumnDiff, 'mismatched').recordCount, 0);
assert.equal(createRecordExportTable(sampleDiff, 'identical').recordCount, 18);
assert.equal(createRecordExportTable(sampleDiff, 'mismatched').recordCount, 4);
assert.deepEqual(createRecordExportTable(sampleDiff, 'identical').rows[0].slice(0, 3), ['unchanged', 'L-02', 'R-02']);

assert.deepEqual([0, 25, 26, 27, 51, 52].map(spreadsheetColumnLabel), ['A', 'Z', 'AA', 'AB', 'AZ', 'BA']);
assert.equal(SHEET_ROW_NUMBER_COLUMN_WIDTH, 42, 'row number column should stay compact like a spreadsheet row header');
assert.deepEqual(resizeSpreadsheetColumnWidths({}, `${SHEET_COLUMN_ID_PREFIX}1`, 214), { [`${SHEET_COLUMN_ID_PREFIX}1`]: 214 }, 'column resizing should persist the requested width');
assert.deepEqual(resizeSpreadsheetColumnWidths({}, `${SHEET_COLUMN_ID_PREFIX}1`, 214, [`${SHEET_COLUMN_ID_PREFIX}1`, `${SHEET_COLUMN_ID_PREFIX}2`]), { [`${SHEET_COLUMN_ID_PREFIX}1`]: 214, [`${SHEET_COLUMN_ID_PREFIX}2`]: 214 }, 'selected columns should retain the resized width');
assert.deepEqual(resizeSpreadsheetColumnWidths({}, SHEET_ROW_NUMBER_COLUMN_ID, 200), {}, 'the row-number gutter should remain non-resizable');
assert.deepEqual(resizeSpreadsheetColumnWidths({}, `${SHEET_COLUMN_ID_PREFIX}0`, 20), { [`${SHEET_COLUMN_ID_PREFIX}0`]: SHEET_MIN_COLUMN_WIDTH }, 'columns should respect the minimum width');
assert.equal(SHEET_MIN_ROW_HEIGHT, 22);
assert.deepEqual(resizeSpreadsheetRowHeights({}, 'sheet-data-0', 42, ['sheet-data-0', 'sheet-data-1']), { 'sheet-data-0': 42, 'sheet-data-1': 42 }, 'selected rows should retain the resized height');
assert.deepEqual(resizeSpreadsheetRowHeights({}, 'sheet-data-0', 10), { 'sheet-data-0': SHEET_MIN_ROW_HEIGHT }, 'rows should respect a readable minimum height');
const editableGridTable = tableFromRows([['id', 'name'], ['1', 'Ada'], ['2', 'Grace']]);
const editedGridTable = applySpreadsheetGridChanges(editableGridTable, [
  { rowId: SHEET_FIELD_HEADER_ROW_ID, columnId: `${SHEET_COLUMN_ID_PREFIX}1`, newCell: { type: 'text', text: 'fullName' } },
  { rowId: `${SHEET_DATA_ROW_PREFIX}0`, columnId: `${SHEET_COLUMN_ID_PREFIX}1`, newCell: { type: 'text', text: 'Ada Lovelace' } },
]);
assert.equal(editedGridTable.headers[1].key, 'fullName');
assert.equal(editedGridTable.rows[0][1], 'Ada Lovelace');
const allGridColumns = [SHEET_ROW_NUMBER_COLUMN_ID, `${SHEET_COLUMN_ID_PREFIX}0`, `${SHEET_COLUMN_ID_PREFIX}1`].map((columnId) => ({ columnId }));
const allGridRows = [SHEET_COLUMN_LABEL_ROW_ID, SHEET_FIELD_HEADER_ROW_ID, `${SHEET_DATA_ROW_PREFIX}0`, `${SHEET_DATA_ROW_PREFIX}1`].map((rowId) => ({ rowId }));
assert.equal(copySpreadsheetSelectionAsTsv(editedGridTable, [{ rows: [{ rowId: `${SHEET_DATA_ROW_PREFIX}0` }], columns: allGridColumns }]), '1\tAda Lovelace');
assert.equal(copySpreadsheetSelectionAsTsv(editableGridTable, [{ rows: allGridRows, columns: [{ columnId: `${SHEET_COLUMN_ID_PREFIX}0` }] }]), 'id\n1\n2');
const removedGridRow = deleteSpreadsheetSelection(editableGridTable, [{ rows: [{ rowId: `${SHEET_DATA_ROW_PREFIX}0` }], columns: allGridColumns }]);
assert.equal(removedGridRow.kind, 'rows');
assert.deepEqual(removedGridRow.table.rows, [['2', 'Grace']]);
const removedGridColumn = deleteSpreadsheetSelection(editableGridTable, [{ rows: allGridRows, columns: [{ columnId: `${SHEET_COLUMN_ID_PREFIX}1` }] }]);
assert.equal(removedGridColumn.kind, 'columns');
assert.deepEqual(removedGridColumn.table.headers.map(({ label }) => label), ['id']);
const clearedGridCell = deleteSpreadsheetSelection(editableGridTable, [{ rows: [{ rowId: `${SHEET_DATA_ROW_PREFIX}0` }], columns: [{ columnId: `${SHEET_COLUMN_ID_PREFIX}1` }] }]);
assert.equal(clearedGridCell.kind, 'cells');
assert.deepEqual(clearedGridCell.table.rows[0], ['1', '']);
assert.match(serializeCsv({ headers: ['value'], rows: [['=2+2']] }), /'=2\+2/);
assert.match(serializeCsv({ headers: ['value'], rows: [['=2+2']] }, ',', { escapeFormulae: false }), /=2\+2/);

const csvTable = parseCsvTable('code,value\n1,"comma, and quote"" inside"\n2,plain');
assert.equal(csvTable.rows[0][1], 'comma, and quote" inside');
assert.throws(() => parseComparisonCsv(''), /empty/);
assert.throws(() => compareSpreadsheetTables(before, after, { matchBy: 'key', key: 'missing' }), /present in both/);
assert.throws(() => worksheetToComparisonTable(null), /Choose a worksheet/);

const report = createSpreadsheetDiffCsv(sampleDiff);
assert.match(report, /Change,L-ID,R-ID,Row key,Original row,Updated row,Column,Original value,Updated value/);
assert.match(report, /removed,L-03,,E-103/);
assert.match(report, /added,,R-04,E-105/);
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
const spreadsheetGrid = await readFile(new URL('../src/components/SpreadsheetGrid.jsx', import.meta.url), 'utf8');
const spreadsheetGridCss = await readFile(new URL('../src/components/SpreadsheetGrid.css', import.meta.url), 'utf8');
assert.match(app, /\/build\/tools\/document-compare/);
assert.match(registry, /internalTool: 'document-compare'/);
assert.match(page, /Files stay in this browser/);
assert.match(page, /role="tab"/);
assert.match(page, /Validate \{formatMode === 'csv' \? 'CSV' : 'Excel'\}/);
assert.match(page, /Plain text/);
assert.match(page, /Rows &amp; columns/);
assert.match(page, /Download identical/);
assert.match(page, /Download mismatches/);
assert.match(page, /Original Excel row/);
assert.match(page, /first shared column is selected as the match key/);
assert.match(spreadsheetGrid, /enableRowSelection/);
assert.match(spreadsheetGrid, /enableColumnSelection/);
assert.match(spreadsheetGrid, /onColumnResized=\{handleColumnResized\}/);
assert.match(spreadsheetGrid, /onRowResized=\{handleRowResized\}/);
assert.match(spreadsheetGrid, /Maximize2/);
assert.match(spreadsheetGrid, /Restore spreadsheet panel/);
assert.match(spreadsheetGrid, /stickyTopRows/);
assert.match(spreadsheetGrid, /Copy selection/);
assert.match(spreadsheetGrid, /Delete selection/);
assert.match(spreadsheetGridCss, /\.ct-sheet__grid\s*\{[^}]*overflow:\s*auto/s);
assert.match(spreadsheetGridCss, /\.ct-sheet--maximized/);
assert.doesNotMatch(page, /textcompare\.org|diffchecker\.com|xlcompare\.com|draftable\.com/);

console.log('Document Compare tests passed: CSV/Excel modes, editable grid coordinates, cell and row/column selection actions, local parsing, validation, ignored columns, source IDs, exports, matching, XLSX sheets, and route registration.');
