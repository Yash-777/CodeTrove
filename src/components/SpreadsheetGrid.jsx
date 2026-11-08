import { useEffect, useMemo, useState } from 'react';
import { Copy, Maximize2, Minimize2, Pin, PinOff, Trash2 } from 'lucide-react';
import { ReactGrid } from '@silevis/reactgrid';
import '@silevis/reactgrid/styles.css';
import {
  applySpreadsheetGridChanges,
  copySpreadsheetSelectionAsTsv,
  deleteSpreadsheetSelection,
  SHEET_COLUMN_ID_PREFIX,
  SHEET_COLUMN_LABEL_ROW_ID,
  SHEET_DATA_ROW_PREFIX,
  SHEET_FIELD_HEADER_ROW_ID,
  SHEET_DEFAULT_COLUMN_WIDTH,
  SHEET_DEFAULT_ROW_HEIGHT,
  SHEET_MIN_COLUMN_WIDTH,
  SHEET_MIN_ROW_HEIGHT,
  SHEET_ROW_NUMBER_COLUMN_WIDTH,
  SHEET_ROW_NUMBER_COLUMN_ID,
  resizeSpreadsheetColumnWidths,
  resizeSpreadsheetRowHeights,
  spreadsheetColumnLabel,
} from '../utils/spreadsheetGrid.js';
import './SpreadsheetGrid.css';

function buildGridRows(table, rowHeights) {
  return [
    {
      rowId: SHEET_COLUMN_LABEL_ROW_ID,
      height: rowHeights[SHEET_COLUMN_LABEL_ROW_ID] ?? SHEET_DEFAULT_ROW_HEIGHT,
      resizable: true,
      cells: [
        { type: 'header', text: '' },
        ...table.headers.map((_, index) => ({ type: 'header', text: spreadsheetColumnLabel(index) })),
      ],
    },
    {
      rowId: SHEET_FIELD_HEADER_ROW_ID,
      height: rowHeights[SHEET_FIELD_HEADER_ROW_ID] ?? SHEET_DEFAULT_ROW_HEIGHT,
      resizable: true,
      cells: [
        { type: 'header', text: '1' },
        ...table.headers.map((header) => ({ type: 'text', text: String(header.label ?? '') })),
      ],
    },
    ...table.rows.map((row, rowIndex) => ({
      rowId: `${SHEET_DATA_ROW_PREFIX}${rowIndex}`,
      height: rowHeights[`${SHEET_DATA_ROW_PREFIX}${rowIndex}`] ?? SHEET_DEFAULT_ROW_HEIGHT,
      resizable: true,
      cells: [
        { type: 'header', text: String(rowIndex + 2) },
        ...table.headers.map((_, columnIndex) => ({ type: 'text', text: String(row[columnIndex] ?? '') })),
      ],
    })),
  ];
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const temporary = document.createElement('textarea');
  temporary.value = text;
  temporary.setAttribute('readonly', '');
  temporary.style.position = 'fixed';
  temporary.style.opacity = '0';
  document.body.appendChild(temporary);
  temporary.select();
  const copied = document.execCommand('copy');
  temporary.remove();
  if (!copied) throw new Error('Clipboard access is unavailable in this browser.');
}

export default function SpreadsheetGrid({ table, label, onChange }) {
  const [selectedRanges, setSelectedRanges] = useState([]);
  const [freezeHeader, setFreezeHeader] = useState(true);
  const [message, setMessage] = useState('');
  const [columnWidths, setColumnWidths] = useState({});
  const [rowHeights, setRowHeights] = useState({});
  const [isMaximized, setIsMaximized] = useState(false);
  const columns = useMemo(() => [
    { columnId: SHEET_ROW_NUMBER_COLUMN_ID, width: SHEET_ROW_NUMBER_COLUMN_WIDTH, resizable: false },
    ...table.headers.map((_, index) => {
      const columnId = `${SHEET_COLUMN_ID_PREFIX}${index}`;
      return { columnId, width: columnWidths[columnId] ?? SHEET_DEFAULT_COLUMN_WIDTH, resizable: true };
    }),
  ], [table.headers, columnWidths]);
  const rows = useMemo(() => buildGridRows(table, rowHeights), [table, rowHeights]);

  useEffect(() => {
    if (!isMaximized) return undefined;
    function restoreOnEscape(event) {
      if (event.key === 'Escape') setIsMaximized(false);
    }
    window.addEventListener('keydown', restoreOnEscape);
    return () => window.removeEventListener('keydown', restoreOnEscape);
  }, [isMaximized]);

  function handleChanges(changes) {
    const nextTable = applySpreadsheetGridChanges(table, changes);
    if (nextTable !== table) {
      onChange(nextTable);
      setMessage('Cell edits are local. Validate again to refresh the comparison.');
    }
  }

  async function handleCopySelection() {
    const text = copySpreadsheetSelectionAsTsv(table, selectedRanges);
    if (!text) {
      setMessage('Select a cell, row, column, or range to copy.');
      return;
    }
    try {
      await copyToClipboard(text);
      setMessage('Selected cells copied as tab-separated values.');
    } catch (error) {
      setMessage(error?.message || 'Could not copy the selected cells.');
    }
  }

  function handleDeleteSelection() {
    const result = deleteSpreadsheetSelection(table, selectedRanges);
    setMessage(result.message);
    if (result.changed) {
      onChange(result.table);
      setSelectedRanges([]);
    }
  }

  function handleColumnResized(columnId, width, selectedColumnIds) {
    setColumnWidths((current) => resizeSpreadsheetColumnWidths(current, columnId, width, selectedColumnIds));
  }

  function handleRowResized(rowId, height, selectedRowIds) {
    setRowHeights((current) => resizeSpreadsheetRowHeights(current, rowId, height, selectedRowIds));
  }

  return (
    <section className={`ct-sheet${isMaximized ? ' ct-sheet--maximized' : ''}`} aria-label={`${label} editable spreadsheet`}>
      <div className="ct-sheet__toolbar" role="toolbar" aria-label={`${label} spreadsheet actions`}>
        <label className="ct-sheet__freeze">
          <input type="checkbox" checked={freezeHeader} onChange={(event) => setFreezeHeader(event.target.checked)} />
          {freezeHeader ? <Pin size={14} /> : <PinOff size={14} />}
          Freeze headers
        </label>
        <button type="button" className="ct-sheet__action" onClick={handleCopySelection} disabled={!selectedRanges.length} title="Copy selected cells, rows, or columns as TSV">
          <Copy size={14} /> Copy selection
        </button>
        <button type="button" className="ct-sheet__action ct-sheet__action--danger" onClick={handleDeleteSelection} disabled={!selectedRanges.length} title="Delete selected rows or columns, or clear selected cells">
          <Trash2 size={14} /> Delete selection
        </button>
        <button type="button" className="ct-sheet__action ct-sheet__maximize" onClick={() => setIsMaximized((value) => !value)} aria-label={isMaximized ? 'Restore spreadsheet panel' : 'Maximize spreadsheet panel'} aria-pressed={isMaximized} title={isMaximized ? 'Restore panel' : 'Maximize panel'}>
          {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>
      <p className="ct-sheet__hint">Edit cells directly. Click a row number or A/B/C heading to select a full row or column; Ctrl/Cmd+C and Ctrl/Cmd+V work on selected ranges.</p>
      <div className="ct-sheet__grid" role="region" aria-label={`${label} Excel-style grid`}>
        <ReactGrid
          rows={rows}
          columns={columns}
          onCellsChanged={handleChanges}
          onColumnResized={handleColumnResized}
          onRowResized={handleRowResized}
          onSelectionChanged={setSelectedRanges}
          enableRangeSelection
          enableRowSelection
          enableColumnSelection
          stickyTopRows={freezeHeader ? 2 : 0}
          stickyLeftColumns={1}
          minRowHeight={SHEET_MIN_ROW_HEIGHT}
          minColumnWidth={SHEET_MIN_COLUMN_WIDTH}
        />
      </div>
      <p className="ct-sheet__message" role="status" aria-live="polite">{message || `${table.rows.length.toLocaleString()} data rows · ${table.headers.length} columns · source stays in this browser.`}</p>
    </section>
  );
}
