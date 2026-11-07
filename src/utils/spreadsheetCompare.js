import { parseCsvTable, normalizeCellValue, serializeCsv, tableFromRows } from './documentConverter.js';

export const MAX_COMPARE_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_COMPARE_ROWS = 50000;
export const MAX_COMPARE_COLUMNS = 1000;
export const MAX_COMPARE_CELLS = 500000;

function sampleEmployee(id) {
  return `${id},Employee ${id.slice(2)},Operations,90000,Remote,Active`;
}

export const SAMPLE_BEFORE_CSV = [
  'Employee ID,Name,Department,Salary,Office,Status',
  'E-101,Ada Lovelace,Engineering,145000,London,Active',
  'E-102,Grace Hopper,Engineering,138000,New York,Active',
  'E-103,Linus Torvalds,Platform,132000,Oslo,Inactive',
  'E-104,Katherine Johnson,Research,121000,New York,Active',
  ...Array.from({ length: 16 }, (_, index) => sampleEmployee(`E-${String(201 + index).padStart(3, '0')}`)),
  'E-121,Row-order demo,Operations,90000,Remote,Active',
].join('\n');

export const SAMPLE_AFTER_CSV = [
  'Employee ID,Name,Department,Salary,Office,Status',
  'E-101,Ada Lovelace,Engineering,150000,London,Active',
  'E-102,Grace Hopper,Engineering,138000,New York,Active',
  'E-104,Katherine Johnson,Research,121000,Boston,Active',
  'E-105,Dorothy Vaughan,Data,128000,London,New',
  ...Array.from({ length: 4 }, (_, index) => sampleEmployee(`E-${String(201 + index).padStart(3, '0')}`)),
  'E-121,Row-order demo,Operations,90000,Remote,Active',
  ...Array.from({ length: 12 }, (_, index) => sampleEmployee(`E-${String(205 + index).padStart(3, '0')}`)),
].join('\n');

function headerInfo(header, index) {
  if (typeof header === 'string') return { key: header, label: header, index };
  const label = String(header?.label ?? header?.key ?? `Column ${index + 1}`);
  return { key: String(header?.key ?? label), label, index };
}

export function parseComparisonCsv(source, delimiter = '') {
  if (!String(source ?? '').trim()) throw new Error('This CSV file is empty.');
  const table = parseCsvTable(source, delimiter);
  if (table.rows.length > MAX_COMPARE_ROWS) {
    throw new Error(`This file has more than ${MAX_COMPARE_ROWS.toLocaleString()} data rows. Compare a smaller file for a responsive result.`);
  }
  if (table.headers.length > MAX_COMPARE_COLUMNS) {
    throw new Error(`This file has more than ${MAX_COMPARE_COLUMNS.toLocaleString()} columns. Compare a narrower table for a responsive result.`);
  }
  if ((table.rows.length + 1) * table.headers.length > MAX_COMPARE_CELLS) {
    throw new Error(`This file has more than ${MAX_COMPARE_CELLS.toLocaleString()} cells. Compare a smaller table for a responsive result.`);
  }
  return table;
}

export function worksheetToComparisonTable(worksheet) {
  if (!worksheet) throw new Error('Choose a worksheet before comparing.');
  if (worksheet.rowCount > MAX_COMPARE_ROWS + 1) {
    throw new Error(`This worksheet has more than ${MAX_COMPARE_ROWS.toLocaleString()} data rows. Compare a smaller sheet for a responsive result.`);
  }
  const width = worksheet.columnCount;
  if (width > MAX_COMPARE_COLUMNS) {
    throw new Error(`This worksheet has more than ${MAX_COMPARE_COLUMNS.toLocaleString()} columns. Compare a narrower sheet for a responsive result.`);
  }
  if (worksheet.rowCount * width > MAX_COMPARE_CELLS) {
    throw new Error(`This worksheet has more than ${MAX_COMPARE_CELLS.toLocaleString()} cells. Compare a smaller sheet for a responsive result.`);
  }
  const rows = [];
  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    rows.push(Array.from({ length: width }, (_, index) => normalizeCellValue(row.getCell(index + 1).value)));
  }
  const table = tableFromRows(rows);
  if (table.rows.length > MAX_COMPARE_ROWS) throw new Error(`This worksheet has more than ${MAX_COMPARE_ROWS.toLocaleString()} data rows.`);
  return table;
}

function comparable(value, { ignoreWhitespace = false, ignoreCase = false } = {}) {
  let result = normalizeCellValue(value);
  if (result === undefined || result === null) result = '';
  result = String(result);
  if (ignoreWhitespace) result = result.replace(/\s+/gu, '');
  if (ignoreCase) result = result.toLocaleLowerCase();
  return result;
}

function getColumns(leftTable, rightTable) {
  const leftHeaders = (leftTable?.headers || []).map(headerInfo);
  const rightHeaders = (rightTable?.headers || []).map(headerInfo);
  const rightByKey = new Map(rightHeaders.map((header) => [header.key, header]));
  const leftByKey = new Map(leftHeaders.map((header) => [header.key, header]));
  const columns = leftHeaders.map((header) => ({
    key: header.key,
    label: header.label,
    leftIndex: header.index,
    rightIndex: rightByKey.get(header.key)?.index ?? -1,
  }));
  rightHeaders.forEach((header) => {
    if (!leftByKey.has(header.key)) columns.push({ key: header.key, label: header.label, leftIndex: -1, rightIndex: header.index });
  });
  return { columns, leftHeaders, rightHeaders };
}

export function getSharedComparisonKeys(leftTable, rightTable) {
  const rightKeys = new Set((rightTable?.headers || []).map((header, index) => headerInfo(header, index).key));
  return (leftTable?.headers || []).map(headerInfo).filter((header) => rightKeys.has(header.key)).map(({ key, label }) => ({ key, label }));
}

function createRecord(leftRow, rightRow, leftIndex, rightIndex, columns, options, keyIndex = -1) {
  const cells = columns.map((column) => {
    const leftValue = column.leftIndex < 0 || !leftRow ? '' : leftRow[column.leftIndex] ?? '';
    const rightValue = column.rightIndex < 0 || !rightRow ? '' : rightRow[column.rightIndex] ?? '';
    return {
      key: column.key,
      label: column.label,
      left: leftValue,
      right: rightValue,
      changed: comparable(leftValue, options) !== comparable(rightValue, options),
    };
  });
  const type = !leftRow ? 'added' : !rightRow ? 'removed' : cells.some((cell) => cell.changed) ? 'changed' : 'unchanged';
  const keyValue = keyIndex >= 0 ? comparable((leftRow || rightRow)?.[keyIndex], {}) : '';
  return {
    type,
    leftRowNumber: leftRow ? leftIndex + 2 : null,
    rightRowNumber: rightRow ? rightIndex + 2 : null,
    leftRecordId: leftRow ? `L-${String(leftIndex + 1).padStart(2, '0')}` : '',
    rightRecordId: rightRow ? `R-${String(rightIndex + 1).padStart(2, '0')}` : '',
    rowKey: keyValue || (leftRow && rightRow ? `Row ${leftIndex + 2} ↔ ${rightIndex + 2}` : `Row ${leftIndex != null ? leftIndex + 2 : rightIndex + 2}`),
    cells,
    changedCellCount: cells.filter((cell) => cell.changed).length,
  };
}

export function compareSpreadsheetTables(leftTable, rightTable, options = {}) {
  if (!leftTable?.headers?.length || !rightTable?.headers?.length) {
    throw new Error('Load two CSV or Excel worksheets with a header row before comparing.');
  }
  const matchBy = options.matchBy || 'position';
  const { columns, leftHeaders, rightHeaders } = getColumns(leftTable, rightTable);
  const ignored = new Set(options.ignoredColumns || []);
  const comparedColumns = columns.filter((column) => !ignored.has(column.key));
  const records = [];
  if (matchBy === 'key') {
    const key = String(options.key || '');
    const leftKeyIndex = leftHeaders.find((header) => header.key === key)?.index ?? -1;
    const rightKeyIndex = rightHeaders.find((header) => header.key === key)?.index ?? -1;
    if (leftKeyIndex < 0 || rightKeyIndex < 0) throw new Error('Choose a matching column present in both files.');
    const normalizeKey = (value) => comparable(value, options);
    const rightRowsByKey = new Map();
    rightTable.rows.forEach((row, index) => {
      const value = normalizeKey(row[rightKeyIndex]);
      if (!value) return;
      const bucket = rightRowsByKey.get(value) || [];
      bucket.push({ row, index });
      rightRowsByKey.set(value, bucket);
    });
    const usedRightRows = new Set();
    const nextRightMatch = new Map();
    leftTable.rows.forEach((leftRow, leftIndex) => {
      const value = normalizeKey(leftRow[leftKeyIndex]);
      const bucket = value ? rightRowsByKey.get(value) : null;
      const nextIndex = value ? nextRightMatch.get(value) || 0 : 0;
      const match = bucket?.[nextIndex] || null;
      if (!match) {
        records.push(createRecord(leftRow, null, leftIndex, null, comparedColumns, options, leftKeyIndex));
        return;
      }
      nextRightMatch.set(value, nextIndex + 1);
      usedRightRows.add(match.index);
      records.push(createRecord(leftRow, match.row, leftIndex, match.index, comparedColumns, options, leftKeyIndex));
    });
    rightTable.rows.forEach((rightRow, rightIndex) => {
      if (!usedRightRows.has(rightIndex)) records.push(createRecord(null, rightRow, null, rightIndex, comparedColumns, options, rightKeyIndex));
    });
  } else {
    const rowCount = Math.max(leftTable.rows.length, rightTable.rows.length);
    for (let index = 0; index < rowCount; index += 1) {
      records.push(createRecord(leftTable.rows[index] || null, rightTable.rows[index] || null, index, index, comparedColumns, options));
    }
  }

  const summary = {
    total: records.length,
    added: records.filter((record) => record.type === 'added').length,
    removed: records.filter((record) => record.type === 'removed').length,
    changed: records.filter((record) => record.type === 'changed').length,
    unchanged: records.filter((record) => record.type === 'unchanged').length,
    changedCells: records.filter((record) => record.type === 'changed').reduce((sum, record) => sum + record.changedCellCount, 0),
  };
  const leftKeys = new Set(leftHeaders.map((header) => header.key));
  const rightKeys = new Set(rightHeaders.map((header) => header.key));
  return {
    columns: comparedColumns,
    records,
    summary,
    addedColumns: rightHeaders.filter((header) => !leftKeys.has(header.key) && !ignored.has(header.key)).map(({ label }) => label),
    removedColumns: leftHeaders.filter((header) => !rightKeys.has(header.key) && !ignored.has(header.key)).map(({ label }) => label),
    ignoredColumns: [...ignored],
    leftHeaders,
    rightHeaders,
    leftRows: leftTable.rows,
    rightRows: rightTable.rows,
    matchBy,
    key: options.key || '',
  };
}

export function createSpreadsheetDiffCsv(result) {
  const fields = ['Change', 'L-ID', 'R-ID', 'Row key', 'Original row', 'Updated row', 'Column', 'Original value', 'Updated value'];
  const rows = [];
  for (const record of result?.records || []) {
    if (record.type === 'unchanged') continue;
    const changedCells = record.type === 'changed' ? record.cells.filter((cell) => cell.changed) : record.cells;
    if (!changedCells.length) {
      rows.push([record.type, record.leftRecordId, record.rightRecordId, record.rowKey, record.leftRowNumber ?? '', record.rightRowNumber ?? '', '', '', '']);
      continue;
    }
    changedCells.forEach((cell) => rows.push([
      record.type,
      record.leftRecordId,
      record.rightRecordId,
      record.rowKey,
      record.leftRowNumber ?? '',
      record.rightRowNumber ?? '',
      cell.label,
      cell.left,
      cell.right,
    ]));
  }
  return serializeCsv({ headers: fields, rows });
}

export function createRecordExportTable(result, category) {
  const records = (result?.records || []).filter((record) => category === 'identical'
    ? record.type === 'unchanged'
    : record.type !== 'unchanged');
  const leftHeaders = result?.leftHeaders || [];
  const rightHeaders = result?.rightHeaders || [];
  const headers = [
    'Record status', 'L-ID', 'R-ID',
    ...leftHeaders.map((header) => `Original: ${header.label}`),
    ...rightHeaders.map((header) => `Updated: ${header.label}`),
  ];
  const rows = records.map((record) => {
    const leftRow = record.leftRowNumber ? result.leftRows[record.leftRowNumber - 2] : null;
    const rightRow = record.rightRowNumber ? result.rightRows[record.rightRowNumber - 2] : null;
    return [
      record.type,
      record.leftRecordId,
      record.rightRecordId,
      ...leftHeaders.map((header) => leftRow?.[header.index] ?? ''),
      ...rightHeaders.map((header) => rightRow?.[header.index] ?? ''),
    ];
  });
  return { headers, rows, recordCount: records.length };
}
