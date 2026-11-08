export const SHEET_ROW_NUMBER_COLUMN_ID = 'sheet-row-number';
export const SHEET_COLUMN_LABEL_ROW_ID = 'sheet-column-labels';
export const SHEET_FIELD_HEADER_ROW_ID = 'sheet-field-headers';
export const SHEET_DATA_ROW_PREFIX = 'sheet-data-';
export const SHEET_COLUMN_ID_PREFIX = 'sheet-column-';
export const SHEET_ROW_NUMBER_COLUMN_WIDTH = 42;
export const SHEET_DEFAULT_COLUMN_WIDTH = 168;
export const SHEET_MIN_COLUMN_WIDTH = 96;
export const SHEET_DEFAULT_ROW_HEIGHT = 29;
export const SHEET_MIN_ROW_HEIGHT = 22;

function updateDimensionMap(current, primaryId, value, selectedIds, minimum) {
  const ids = Array.isArray(selectedIds) && selectedIds.length ? selectedIds : [primaryId];
  const size = Math.max(minimum, Math.round(Number(value) || minimum));
  const next = { ...current };
  ids.forEach((id) => { if (id) next[id] = size; });
  return next;
}

export function resizeSpreadsheetColumnWidths(current, columnId, width, selectedColumnIds = []) {
  const ids = (Array.isArray(selectedColumnIds) && selectedColumnIds.length ? selectedColumnIds : [columnId])
    .filter((id) => id && id !== SHEET_ROW_NUMBER_COLUMN_ID);
  if (!ids.length) return current;
  return updateDimensionMap(current, columnId, width, ids, SHEET_MIN_COLUMN_WIDTH);
}

export function resizeSpreadsheetRowHeights(current, rowId, height, selectedRowIds = []) {
  return updateDimensionMap(current, rowId, height, selectedRowIds, SHEET_MIN_ROW_HEIGHT);
}

export function spreadsheetColumnLabel(index) {
  if (!Number.isInteger(index) || index < 0) return '';
  let value = index + 1;
  let label = '';
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

function getColumnIndex(columnId) {
  if (typeof columnId !== 'string' || !columnId.startsWith(SHEET_COLUMN_ID_PREFIX)) return -1;
  const index = Number(columnId.slice(SHEET_COLUMN_ID_PREFIX.length));
  return Number.isInteger(index) && index >= 0 ? index : -1;
}

function getDataRowIndex(rowId) {
  if (typeof rowId !== 'string' || !rowId.startsWith(SHEET_DATA_ROW_PREFIX)) return -1;
  const index = Number(rowId.slice(SHEET_DATA_ROW_PREFIX.length));
  return Number.isInteger(index) && index >= 0 ? index : -1;
}

function createHeaderKey(label, index, headers) {
  const base = String(label ?? '').trim() || `Column ${index + 1}`;
  const used = new Set(headers.filter((_, headerIndex) => headerIndex !== index).map((header) => header.key));
  let key = base;
  let suffix = 2;
  while (used.has(key)) {
    key = `${base} (${suffix})`;
    suffix += 1;
  }
  return key;
}

export function applySpreadsheetGridChanges(table, changes) {
  if (!table?.headers?.length || !Array.isArray(changes) || changes.length === 0) return table;
  const headers = table.headers.map((header, index) => ({ ...header, index }));
  const rows = table.rows.map((row) => [...row]);
  let changed = false;

  changes.forEach(({ rowId, columnId, newCell }) => {
    const columnIndex = getColumnIndex(columnId);
    if (columnIndex < 0 || columnIndex >= headers.length) return;
    const value = String(newCell?.text ?? '');
    if (rowId === SHEET_FIELD_HEADER_ROW_ID) {
      if (headers[columnIndex].label === value) return;
      headers[columnIndex] = {
        ...headers[columnIndex],
        key: createHeaderKey(value, columnIndex, headers),
        label: value,
        index: columnIndex,
      };
      changed = true;
      return;
    }
    const rowIndex = getDataRowIndex(rowId);
    if (rowIndex < 0 || rowIndex >= rows.length || rows[rowIndex][columnIndex] === value) return;
    rows[rowIndex][columnIndex] = value;
    changed = true;
  });

  return changed ? { ...table, headers, rows } : table;
}

function selectedCellText(table, rowId, columnIndex) {
  if (rowId === SHEET_FIELD_HEADER_ROW_ID) return table.headers[columnIndex]?.label ?? '';
  const rowIndex = getDataRowIndex(rowId);
  return rowIndex < 0 ? null : table.rows[rowIndex]?.[columnIndex] ?? '';
}

function quoteTsvCell(value) {
  const text = String(value ?? '').replace(/\r\n?/gu, '\n');
  return /[\t\n"]/.test(text) ? `"${text.replace(/"/gu, '""')}"` : text;
}

export function copySpreadsheetSelectionAsTsv(table, selectedRanges) {
  if (!table?.headers?.length || !Array.isArray(selectedRanges)) return '';
  const blocks = selectedRanges.map((range) => {
    const columnIndexes = (range.columns || []).map((column) => getColumnIndex(column.columnId)).filter((index) => index >= 0 && index < table.headers.length);
    const rowIds = (range.rows || []).map((row) => row.rowId).filter((rowId) => rowId !== SHEET_COLUMN_LABEL_ROW_ID);
    if (!columnIndexes.length || !rowIds.length) return '';
    return rowIds.map((rowId) => columnIndexes
      .map((columnIndex) => selectedCellText(table, rowId, columnIndex))
      .filter((value) => value !== null)
      .map(quoteTsvCell)
      .join('\t')).join('\n');
  }).filter(Boolean);
  return blocks.join('\n\n');
}

function selectedRangesWithShape(table, selectedRanges) {
  const totalGridRows = table.rows.length + 2;
  const totalGridColumns = table.headers.length + 1;
  return (selectedRanges || []).map((range) => {
    const rows = range.rows || [];
    const columns = range.columns || [];
    const columnIndexes = columns.map((column) => getColumnIndex(column.columnId)).filter((index) => index >= 0 && index < table.headers.length);
    const rowIndexes = rows.map((row) => getDataRowIndex(row.rowId)).filter((index) => index >= 0 && index < table.rows.length);
    return {
      fullColumn: rows.length === totalGridRows && columns.length < totalGridColumns,
      fullRow: columns.length === totalGridColumns && rows.length < totalGridRows,
      columnIndexes,
      rowIndexes,
      includesFieldHeader: rows.some((row) => row.rowId === SHEET_FIELD_HEADER_ROW_ID),
    };
  });
}

export function deleteSpreadsheetSelection(table, selectedRanges) {
  if (!table?.headers?.length || !Array.isArray(selectedRanges) || selectedRanges.length === 0) {
    return { table, changed: false, kind: 'none', message: 'Select cells, a full row, or a column first.' };
  }

  const selections = selectedRangesWithShape(table, selectedRanges);
  const fullColumnSelections = selections.filter((selection) => selection.fullColumn);
  if (fullColumnSelections.length) {
    const indexes = [...new Set(fullColumnSelections.flatMap((selection) => selection.columnIndexes))].sort((a, b) => a - b);
    if (indexes.length >= table.headers.length) {
      return { table, changed: false, kind: 'none', message: 'Keep at least one column in the sheet.' };
    }
    const removed = new Set(indexes);
    const headers = table.headers.filter((_, index) => !removed.has(index)).map((header, index) => ({ ...header, index }));
    const rows = table.rows.map((row) => row.filter((_, index) => !removed.has(index)));
    return { table: { ...table, headers, rows }, changed: true, kind: 'columns', count: indexes.length, message: `Deleted ${indexes.length} selected ${indexes.length === 1 ? 'column' : 'columns'}.` };
  }

  const fullRowSelections = selections.filter((selection) => selection.fullRow);
  if (fullRowSelections.length) {
    const indexes = [...new Set(fullRowSelections.flatMap((selection) => selection.rowIndexes))].sort((a, b) => a - b);
    if (!indexes.length) {
      return { table, changed: false, kind: 'none', message: 'The field-header row is kept; select one or more data rows to delete.' };
    }
    const removed = new Set(indexes);
    const rows = table.rows.filter((_, index) => !removed.has(index));
    return { table: { ...table, rows }, changed: true, kind: 'rows', count: indexes.length, message: `Deleted ${indexes.length} selected ${indexes.length === 1 ? 'data row' : 'data rows'}.` };
  }

  const changes = [];
  selectedRanges.forEach((range) => {
    (range.rows || []).forEach((row) => {
      if (row.rowId === SHEET_COLUMN_LABEL_ROW_ID) return;
      (range.columns || []).forEach((column) => {
        if (column.columnId === SHEET_ROW_NUMBER_COLUMN_ID) return;
        const columnIndex = getColumnIndex(column.columnId);
        if (columnIndex >= 0) changes.push({ rowId: row.rowId, columnId: column.columnId, newCell: { type: 'text', text: '' } });
      });
    });
  });
  const nextTable = applySpreadsheetGridChanges(table, changes);
  return nextTable === table
    ? { table, changed: false, kind: 'none', message: 'No editable cells were selected.' }
    : { table: nextTable, changed: true, kind: 'cells', count: changes.length, message: 'Cleared the selected cells.' };
}
