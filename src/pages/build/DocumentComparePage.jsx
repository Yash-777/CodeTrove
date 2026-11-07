import { useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeftRight, Check, ChevronDown, Download, FileSpreadsheet, FileUp, RotateCcw, ShieldCheck, Table2, Text } from 'lucide-react';
import ToolBackLink from '../../components/ToolBackLink.jsx';
import { parseCsvTable, serializeCsv } from '../../utils/documentConverter.js';
import {
  compareSpreadsheetTables,
  createRecordExportTable,
  createSpreadsheetDiffCsv,
  getSharedComparisonKeys,
  MAX_COMPARE_FILE_BYTES,
  parseComparisonCsv,
  SAMPLE_AFTER_CSV,
  SAMPLE_BEFORE_CSV,
  worksheetToComparisonTable,
} from '../../utils/spreadsheetCompare.js';
import './DocumentComparePage.css';

const EMPTY_SIDE = { name: '', size: 0, type: '', rawText: '', table: null, workbook: null, sheetNames: [], sheetName: '' };
const ROW_LIMIT = 350;

function getExcelJS() {
  return import('exceljs').then((module) => module.default || module);
}

async function createExcelSample(source, filename) {
  const ExcelJS = await getExcelJS();
  const table = parseComparisonCsv(source);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Employees');
  worksheet.addRow(table.headers.map((header) => header.label));
  table.rows.forEach((row) => worksheet.addRow(row));
  return { ...EMPTY_SIDE, name: filename, type: 'xlsx', table, workbook, sheetNames: ['Employees'], sheetName: 'Employees' };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getDisplayValue(value) {
  if (value === '' || value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function DataTable({ table, label, side }) {
  if (!table) return <div className="sp-drop-hint"><Table2 size={18} /><span>{label} is not loaded yet. Choose a file or use Sample to preview rows and columns.</span></div>;
  return (
    <div className="sp-source-table-wrap" role="region" aria-label={`${label} rows and columns`} tabIndex="0">
      <table className="sp-source-table">
        <thead><tr><th scope="col">{side}-ID</th>{table.headers.map((header) => <th scope="col" key={header.key}>{header.label}</th>)}</tr></thead>
        <tbody>{table.rows.slice(0, 60).map((row, rowIndex) => (
          <tr key={`${side}-${rowIndex}`}><th scope="row">{side}-{String(rowIndex + 1).padStart(2, '0')}</th>{table.headers.map((header) => <td key={header.key}>{getDisplayValue(row[header.index])}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function SideInput({ side, label, data, fileRef, formatMode, csvView, onLoadFile, onSample, onClear, onSheetChange, onTextChange }) {
  const sideName = side === 'left' ? 'Original' : 'Updated';
  const fileAccept = formatMode === 'csv' ? '.csv,.tsv,text/csv,text/tab-separated-values' : '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return (
    <section className={`sp-file-panel sp-file-panel--${side}`} aria-label={`${sideName} file`}>
      <div className="sp-file-panel__heading">
        <div><span className={`sp-file-tag sp-file-tag--${side}`}>{label}</span><h2>{sideName} {formatMode === 'csv' ? 'CSV' : 'Excel workbook'}</h2><p>{side === 'left' ? 'Left-hand source' : 'Right-hand source'}</p></div>
        <FileSpreadsheet size={21} aria-hidden="true" />
      </div>
      <div className="sp-file-panel__actions">
        <label className="sp-file-picker"><FileUp size={16} /> Choose {formatMode === 'csv' ? 'CSV' : 'Excel'} file
          <input ref={fileRef} type="file" accept={fileAccept} aria-label={`Choose ${sideName.toLowerCase()} ${formatMode === 'csv' ? 'CSV' : 'Excel'} file`} onChange={(event) => onLoadFile(event.target.files?.[0])} />
        </label>
        <button type="button" className="sp-button sp-button--quiet" onClick={onSample}>Sample</button>
        {data.name && <button type="button" className="sp-icon-button" onClick={onClear} title={`Clear ${sideName.toLowerCase()} file`} aria-label={`Clear ${sideName.toLowerCase()} file`}><RotateCcw size={15} /></button>}
      </div>
      {data.name && <div className="sp-loaded-file"><strong title={data.name}>{data.name}</strong><span>{data.table?.rows.length.toLocaleString() ?? 0} records{data.size ? ` · ${(data.size / 1024).toFixed(1)} KB` : ''}</span></div>}
      {formatMode === 'csv' && csvView === 'text' && (
        <div className="sp-source-view">
          <div className="sp-source-view__heading"><strong>{sideName} source text</strong><span>Edit, paste, or load a CSV file.</span></div>
          <textarea className="sp-csv-textarea" value={data.rawText} onChange={(event) => onTextChange(event.target.value)} spellCheck="false" aria-label={`${sideName} CSV source text`} placeholder={'Employee ID,Name,Department\nE-101,Ada Lovelace,Engineering'} />
        </div>
      )}
      {formatMode === 'csv' && csvView === 'table' && <div className="sp-source-view"><div className="sp-source-view__heading"><strong>{sideName} rows and columns</strong><span>{data.table?.rows.length > 60 ? `First 60 of ${data.table.rows.length.toLocaleString()} rows` : 'Parsed data preview'}</span></div><DataTable table={data.table} label={sideName} side={side === 'left' ? 'L' : 'R'} /></div>}
      {formatMode === 'excel' && data.sheetNames.length > 1 && (
        <label className="sp-sheet-select">Worksheet<select value={data.sheetName} onChange={(event) => onSheetChange(event.target.value)} aria-label={`Select ${sideName.toLowerCase()} worksheet`}>{data.sheetNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
      )}
      {formatMode === 'excel' && data.sheetName && data.sheetNames.length <= 1 && <p className="sp-sheet-name">Worksheet: {data.sheetName}</p>}
      {formatMode === 'excel' && <div className="sp-source-view"><div className="sp-source-view__heading"><strong>{sideName} worksheet preview</strong><span>{data.table?.rows.length > 60 ? `First 60 of ${data.table.rows.length.toLocaleString()} rows` : 'Rows and columns'}</span></div><DataTable table={data.table} label={`${sideName} Excel worksheet`} side={side === 'left' ? 'L' : 'R'} /></div>}
    </section>
  );
}

function buildVisibleCells(result, changedOnly, query) {
  if (!result) return [];
  const needle = query.trim().toLocaleLowerCase();
  return result.records.flatMap((record) => {
    if (changedOnly && record.type === 'unchanged') return [];
    const cells = changedOnly && record.type === 'changed' ? record.cells.filter((cell) => cell.changed) : record.cells;
    return cells.map((cell) => ({ ...cell, type: record.type, rowKey: record.rowKey, leftRowNumber: record.leftRowNumber, rightRowNumber: record.rightRowNumber, leftRecordId: record.leftRecordId, rightRecordId: record.rightRecordId }))
      .filter((entry) => !needle || [entry.type, entry.rowKey, entry.leftRecordId, entry.rightRecordId, entry.label, entry.left, entry.right].some((value) => String(value ?? '').toLocaleLowerCase().includes(needle)));
  });
}

export default function DocumentComparePage() {
  const leftInputRef = useRef(null);
  const rightInputRef = useRef(null);
  const requestIds = useRef({ left: 0, right: 0 });
  const [left, setLeft] = useState(EMPTY_SIDE);
  const [right, setRight] = useState(EMPTY_SIDE);
  const [formatMode, setFormatMode] = useState('csv');
  const [csvView, setCsvView] = useState('text');
  const [matchMode, setMatchMode] = useState('key');
  const [matchKey, setMatchKey] = useState('');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [changedOnly, setChangedOnly] = useState(true);
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({ type: 'idle', message: 'Choose CSV or Excel, then load, paste, or sample both sides.' });
  const [busySide, setBusySide] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(ROW_LIMIT);
  const [ignoredColumns, setIgnoredColumns] = useState([]);
  const [validationReady, setValidationReady] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  const sharedKeys = useMemo(() => getSharedComparisonKeys(left.table, right.table), [left.table, right.table]);
  const availableKeys = sharedKeys.filter(({ key }) => !ignoredColumns.includes(key));
  const comparisonColumns = useMemo(() => {
    const headers = [...(left.table?.headers || []), ...(right.table?.headers || [])];
    const seen = new Set();
    return headers.filter((header) => { if (seen.has(header.key)) return false; seen.add(header.key); return true; });
  }, [left.table, right.table]);
  const defaultKey = availableKeys.find(({ key }) => key.toLocaleLowerCase() === 'id') || availableKeys[0];
  const effectiveKey = availableKeys.find(({ key }) => key === matchKey)?.key || defaultKey?.key || '';
  const visibleCells = useMemo(() => buildVisibleCells(result, changedOnly, search), [result, changedOnly, search]);
  const visibleRows = visibleCells.slice(0, visibleLimit);

  function assignSide(side, value) { if (side === 'left') setLeft(value); else setRight(value); }
  function getSide(side) { return side === 'left' ? left : right; }

  async function loadFile(side, file) {
    if (!file) return;
    const id = ++requestIds.current[side];
    assignSide(side, { ...EMPTY_SIDE, name: file.name, size: file.size, type: 'loading' });
    setResult(null);
    setValidationReady(false);
    setBusySide(side);
    setStatus({ type: 'loading', message: `Reading ${file.name} locally…` });
    if (file.size > MAX_COMPARE_FILE_BYTES) {
      assignSide(side, EMPTY_SIDE); setBusySide('');
      setStatus({ type: 'error', message: `Choose a file no larger than ${MAX_COMPARE_FILE_BYTES / (1024 * 1024)} MB.` });
      const ref = side === 'left' ? leftInputRef : rightInputRef; if (ref.current) ref.current.value = '';
      return;
    }
    try {
      const extension = file.name.split('.').pop()?.toLocaleLowerCase();
      let next;
      if (formatMode === 'csv' && ['csv', 'tsv'].includes(extension)) {
        const rawText = await file.text();
        next = { ...EMPTY_SIDE, name: file.name, size: file.size, type: extension, rawText, table: parseComparisonCsv(rawText, extension === 'tsv' ? '\t' : '') };
      } else if (formatMode === 'excel' && extension === 'xlsx') {
        const ExcelJS = await getExcelJS(); const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const sheetNames = workbook.worksheets.map((sheet) => sheet.name);
        if (!sheetNames.length) throw new Error('This workbook does not contain a worksheet.');
        const sheetName = sheetNames[0];
        next = { ...EMPTY_SIDE, name: file.name, size: file.size, type: extension, table: worksheetToComparisonTable(workbook.getWorksheet(sheetName)), workbook, sheetNames, sheetName };
      } else {
        throw new Error(formatMode === 'csv' ? 'CSV mode accepts .csv and .tsv files.' : 'Excel mode accepts .xlsx files. Older .xls workbooks are not supported.');
      }
      if (requestIds.current[side] !== id) return;
      assignSide(side, next); setIgnoredColumns([]);
      setStatus({ type: 'ok', message: `${file.name} read locally. Press Validate before comparing; no file was uploaded.` });
    } catch (error) {
      if (requestIds.current[side] !== id) return;
      assignSide(side, EMPTY_SIDE); setStatus({ type: 'error', message: error?.message || `Could not read ${file.name}.` });
    } finally {
      if (requestIds.current[side] === id) { setBusySide(''); const ref = side === 'left' ? leftInputRef : rightInputRef; if (ref.current) ref.current.value = ''; }
    }
  }

  function changeCsvText(side, rawText) {
    const current = getSide(side);
    assignSide(side, { ...current, name: current.name || (rawText ? 'Pasted CSV data' : ''), size: new Blob([rawText]).size, type: current.type === 'tsv' ? 'tsv' : 'csv', rawText, table: null, workbook: null, sheetNames: [], sheetName: '' });
    setResult(null); setValidationReady(false);
    setStatus({ type: 'idle', message: 'CSV text changed. Validate both inputs to check the data before comparing.' });
  }

  async function loadSample(side) {
    const source = side === 'left' ? SAMPLE_BEFORE_CSV : SAMPLE_AFTER_CSV;
    const label = side === 'left' ? 'before' : 'after';
    if (formatMode === 'csv') {
      const fileName = `employees-${label}.csv`;
      assignSide(side, { ...EMPTY_SIDE, name: fileName, size: new Blob([source]).size, type: 'csv', rawText: source, table: parseCsvTable(source) });
    } else {
      try { assignSide(side, await createExcelSample(source, `employees-${label}-sample.xlsx`)); }
      catch (error) { setStatus({ type: 'error', message: error?.message || 'Could not generate the Excel sample.' }); return; }
    }
    setMatchMode('key'); setMatchKey('Employee ID'); setResult(null); setValidationReady(false);
    setIgnoredColumns([]);
    setStatus({ type: 'ok', message: `${side === 'left' ? 'Original' : 'Updated'} sample loaded. Validate both sides before comparing.` });
  }

  async function loadBothSamples() {
    setIgnoredColumns([]); setMatchMode('key'); setMatchKey('Employee ID'); setIgnoreWhitespace(false); setIgnoreCase(false); setChangedOnly(true); setSearch(''); setVisibleLimit(ROW_LIMIT);
    if (formatMode === 'csv') {
      setLeft({ ...EMPTY_SIDE, name: 'employees-before.csv', size: new Blob([SAMPLE_BEFORE_CSV]).size, type: 'csv', rawText: SAMPLE_BEFORE_CSV, table: parseCsvTable(SAMPLE_BEFORE_CSV) });
      setRight({ ...EMPTY_SIDE, name: 'employees-after.csv', size: new Blob([SAMPLE_AFTER_CSV]).size, type: 'csv', rawText: SAMPLE_AFTER_CSV, table: parseCsvTable(SAMPLE_AFTER_CSV) });
    } else {
      try {
        const [leftSample, rightSample] = await Promise.all([createExcelSample(SAMPLE_BEFORE_CSV, 'employees-before-sample.xlsx'), createExcelSample(SAMPLE_AFTER_CSV, 'employees-after-sample.xlsx')]);
        setLeft(leftSample); setRight(rightSample);
      } catch (error) { setStatus({ type: 'error', message: error?.message || 'Could not generate the Excel sample.' }); return; }
    }
    setResult(null); setValidationReady(false);
    setStatus({ type: 'ok', message: 'Both sample datasets are ready. Validate both sides, then compare.' });
  }

  function changeFormatMode(nextMode) {
    if (formatMode === nextMode) return;
    requestIds.current.left += 1; requestIds.current.right += 1;
    setFormatMode(nextMode); setLeft(EMPTY_SIDE); setRight(EMPTY_SIDE); setResult(null); setIgnoredColumns([]); setValidationReady(false);
    setMatchMode('key'); setMatchKey(''); setCsvView('text'); setStatus({ type: 'idle', message: `${nextMode === 'csv' ? 'CSV' : 'Excel'} mode selected. Load, paste, or sample both sides.` });
  }

  function validateFiles() {
    try {
      let leftTable; let rightTable;
      if (formatMode === 'csv') {
        if (!left.rawText.trim() || !right.rawText.trim()) throw new Error('Add or load CSV data on both the left and right before validating.');
        leftTable = parseComparisonCsv(left.rawText, left.type === 'tsv' ? '\t' : '');
        rightTable = parseComparisonCsv(right.rawText, right.type === 'tsv' ? '\t' : '');
      } else {
        if (!left.workbook || !right.workbook) throw new Error('Load or sample an Excel workbook on both sides before validating.');
        leftTable = worksheetToComparisonTable(left.workbook.getWorksheet(left.sheetName));
        rightTable = worksheetToComparisonTable(right.workbook.getWorksheet(right.sheetName));
      }
      if (!leftTable.headers.length || !rightTable.headers.length) throw new Error('Both inputs need a header row with at least one column.');
      setLeft((current) => ({ ...current, table: leftTable })); setRight((current) => ({ ...current, table: rightTable }));
      setValidationReady(true); setResult(null);
      setStatus({ type: 'ok', message: `Validation passed: ${leftTable.rows.length.toLocaleString()} left records and ${rightTable.rows.length.toLocaleString()} right records; ${leftTable.headers.length} and ${rightTable.headers.length} columns.` });
    } catch (error) { setValidationReady(false); setResult(null); setStatus({ type: 'error', message: error?.message || 'Validation failed.' }); }
  }

  function changeSheet(side, name) {
    const current = getSide(side);
    try {
      const table = worksheetToComparisonTable(current.workbook?.getWorksheet(name));
      assignSide(side, { ...current, sheetName: name, table }); setResult(null); setValidationReady(false);
      setStatus({ type: 'ok', message: `Selected worksheet “${name}”. Validate again before comparing.` });
    } catch (error) { setStatus({ type: 'error', message: error?.message || 'Could not read that worksheet.' }); }
  }

  function clearSide(side) {
    requestIds.current[side] += 1; assignSide(side, EMPTY_SIDE); setResult(null); setValidationReady(false);
    const ref = side === 'left' ? leftInputRef : rightInputRef; if (ref.current) ref.current.value = '';
    setStatus({ type: 'idle', message: `${side === 'left' ? 'Original' : 'Updated'} input cleared.` });
  }

  function clearAll() {
    requestIds.current.left += 1; requestIds.current.right += 1; setLeft(EMPTY_SIDE); setRight(EMPTY_SIDE); setResult(null); setValidationReady(false); setIgnoredColumns([]); setSearch(''); setVisibleLimit(ROW_LIMIT);
    if (leftInputRef.current) leftInputRef.current.value = ''; if (rightInputRef.current) rightInputRef.current.value = '';
    setStatus({ type: 'idle', message: 'Both inputs and the comparison were cleared.' });
  }

  function toggleIgnoredColumn(key) { setIgnoredColumns((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]); setResult(null); }

  function compareFiles() {
    try {
      if (!validationReady) throw new Error('Validate both files before comparing.');
      const comparison = compareSpreadsheetTables(left.table, right.table, { matchBy: matchMode, key: effectiveKey, ignoreWhitespace, ignoreCase, ignoredColumns });
      setResult(comparison); setVisibleLimit(ROW_LIMIT);
      setStatus({ type: 'ok', message: `Comparison complete: ${comparison.summary.changed} changed, ${comparison.summary.added} added, ${comparison.summary.removed} removed, ${comparison.summary.unchanged} identical.` });
    } catch (error) { setResult(null); setStatus({ type: 'error', message: error?.message || 'Could not compare these files.' }); }
  }

  function swapFiles() { setLeft(right); setRight(left); setResult(null); setValidationReady(false); setStatus({ type: 'idle', message: 'Inputs swapped. Validate again before comparing.' }); }

  async function downloadRecordCategory(category) {
    if (!result) return;
    const fileStem = category === 'identical' ? 'codetrove-identical-records' : 'codetrove-mismatched-records';
    try {
      const table = createRecordExportTable(result, category);
      if (!table.recordCount) { setStatus({ type: 'idle', message: `There are no ${category} records to download.` }); return; }
      if (exportFormat === 'csv') {
        downloadBlob(new Blob([serializeCsv({ headers: table.headers, rows: table.rows })], { type: 'text/csv;charset=utf-8' }), `${fileStem}.csv`);
      } else {
        const ExcelJS = await getExcelJS(); const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet(category === 'identical' ? 'Identical records' : 'Mismatches');
        sheet.addRow(table.headers); table.rows.forEach((row) => sheet.addRow(row)); sheet.views = [{ state: 'frozen', ySplit: 1 }]; sheet.getRow(1).font = { bold: true }; sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, table.rows.length + 1), column: table.headers.length } };
        const buffer = await workbook.xlsx.writeBuffer(); downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${fileStem}.xlsx`);
      }
      setStatus({ type: 'ok', message: `Downloaded ${table.recordCount.toLocaleString()} ${category} records as ${exportFormat.toUpperCase()}. L-ID/R-ID values refer to the original data-row order.` });
    } catch (error) { setStatus({ type: 'error', message: error?.message || 'Could not create the record download.' }); }
  }

  function swapFilesButton() { swapFiles(); }

  const activeInput = formatMode === 'csv' ? '.csv / .tsv' : '.xlsx';
  return (
    <main className="spreadsheet-compare-page">
      <div className="sp-topbar"><ToolBackLink /><span className="sp-local-note"><ShieldCheck size={15} /> Files stay in this browser</span></div>
      <header className="sp-heading"><div><p className="sp-eyebrow">DATA &amp; DOCUMENTS</p><h1>Document Compare</h1><p>Compare CSV data or Excel worksheets side by side. Validate first, choose columns to ignore, then review identical and mismatched records.</p></div><div className="sp-heading__actions"><button type="button" className="sp-button sp-button--secondary" onClick={loadBothSamples}><FileSpreadsheet size={16} /> Load {formatMode === 'csv' ? 'CSV' : 'Excel'} sample</button><button type="button" className="sp-button sp-button--secondary" onClick={clearAll}><RotateCcw size={16} /> Clear all</button></div></header>

      <div className="sp-mode-tabs" role="tablist" aria-label="Document type to compare">
        <button type="button" role="tab" aria-selected={formatMode === 'csv'} className={formatMode === 'csv' ? 'is-active' : ''} onClick={() => changeFormatMode('csv')}><Text size={17} /> CSV</button>
        <button type="button" role="tab" aria-selected={formatMode === 'excel'} className={formatMode === 'excel' ? 'is-active' : ''} onClick={() => changeFormatMode('excel')}><FileSpreadsheet size={17} /> Excel</button>
      </div>
      {formatMode === 'csv' && <div className="sp-view-switch" role="group" aria-label="CSV input display"><span>View CSV as</span><button type="button" className={csvView === 'text' ? 'is-active' : ''} aria-pressed={csvView === 'text'} onClick={() => setCsvView('text')}><Text size={15} /> Plain text</button><button type="button" className={csvView === 'table' ? 'is-active' : ''} aria-pressed={csvView === 'table'} onClick={() => setCsvView('table')}><Table2 size={15} /> Rows &amp; columns</button></div>}

      <section className="sp-workspace" aria-label={`${formatMode === 'csv' ? 'CSV' : 'Excel'} comparison workspace`}>
        <div className="sp-file-grid">
          <SideInput side="left" label="LEFT · ORIGINAL" data={left} fileRef={leftInputRef} formatMode={formatMode} csvView={csvView} onLoadFile={(file) => loadFile('left', file)} onSample={() => loadSample('left')} onClear={() => clearSide('left')} onSheetChange={(name) => changeSheet('left', name)} onTextChange={(value) => changeCsvText('left', value)} />
          <div className="sp-swap" aria-hidden="true"><ArrowLeftRight size={19} /></div>
          <SideInput side="right" label="RIGHT · UPDATED" data={right} fileRef={rightInputRef} formatMode={formatMode} csvView={csvView} onLoadFile={(file) => loadFile('right', file)} onSample={() => loadSample('right')} onClear={() => clearSide('right')} onSheetChange={(name) => changeSheet('right', name)} onTextChange={(value) => changeCsvText('right', value)} />
        </div>

        <div className="sp-options" aria-label="Comparison options">
          <label className="sp-option-select"><span>Match records</span><select value={matchMode} onChange={(event) => { setMatchMode(event.target.value); setResult(null); }} aria-label="How to match records"><option value="key" disabled={!availableKeys.length}>By shared key column</option><option value="position">By row position</option></select></label>
          {matchMode === 'key' && <label className="sp-option-select"><span>Key column</span><select value={effectiveKey} onChange={(event) => { setMatchKey(event.target.value); setResult(null); }} disabled={!availableKeys.length} aria-label="Choose shared key column">{availableKeys.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}</select></label>}
          <label className="sp-check"><input type="checkbox" checked={ignoreWhitespace} onChange={(event) => { setIgnoreWhitespace(event.target.checked); setResult(null); }} /> Ignore whitespace</label>
          <label className="sp-check"><input type="checkbox" checked={ignoreCase} onChange={(event) => { setIgnoreCase(event.target.checked); setResult(null); }} /> Ignore case</label>
          <button type="button" className="sp-button sp-button--swap" onClick={swapFilesButton} disabled={!left.name || !right.name}><ArrowLeftRight size={16} /> Swap sides</button>
          <button type="button" className="sp-button sp-button--validate" onClick={validateFiles} disabled={Boolean(busySide)}><Check size={16} /> Validate {formatMode === 'csv' ? 'CSV' : 'Excel'}</button>
          <button type="button" className="sp-button sp-button--primary" onClick={compareFiles} disabled={!validationReady || Boolean(busySide)}><FileSpreadsheet size={16} /> Compare</button>
        </div>
        {comparisonColumns.length > 0 && <fieldset className="sp-ignore-columns"><legend>Columns to ignore in comparison</legend><span className="sp-ignore-columns__help">Ignored columns remain in downloads but do not affect matching results or difference counts.</span><div>{comparisonColumns.map((header) => <label className="sp-check" key={header.key}><input type="checkbox" checked={ignoredColumns.includes(header.key)} onChange={() => toggleIgnoredColumn(header.key)} /> Ignore {header.label}</label>)}</div></fieldset>}
        <p className={`sp-status sp-status--${status.type}`} role="status">{status.type === 'error' ? <AlertCircle size={15} /> : status.type === 'ok' ? <Check size={15} /> : null}{status.message || `${activeInput} files are processed locally.`}</p>
      </section>

      {result && <section className="sp-results" aria-label="Spreadsheet comparison result">
        <div className="sp-results__heading"><div><p className="sp-eyebrow">COMPARISON RESULT</p><h2>Matched and mismatched records</h2></div><label className="sp-export-format">Download format<select value={exportFormat} onChange={(event) => setExportFormat(event.target.value)} aria-label="Download format"><option value="csv">CSV</option><option value="xlsx">Excel workbook</option></select></label></div>
        <div className="sp-export-actions"><button type="button" className="sp-button sp-button--secondary" onClick={() => downloadRecordCategory('identical')} disabled={!result.summary.unchanged}><Download size={16} /> Download identical ({result.summary.unchanged})</button><button type="button" className="sp-button sp-button--secondary" onClick={() => downloadRecordCategory('mismatched')} disabled={!(result.summary.changed + result.summary.added + result.summary.removed)}><Download size={16} /> Download mismatches ({result.summary.changed + result.summary.added + result.summary.removed})</button><button type="button" className="sp-button sp-button--quiet" onClick={() => downloadBlob(new Blob([createSpreadsheetDiffCsv(result)], { type: 'text/csv;charset=utf-8' }), 'codetrove-spreadsheet-diff.csv')}><Download size={15} /> Cell-by-cell diff CSV</button></div>
        <div className="sp-summary" aria-label="Change summary"><div><strong>{result.summary.unchanged}</strong><span>Identical records</span></div><div><strong>{result.summary.changed}</strong><span>Changed records</span></div><div className="sp-summary__added"><strong>{result.summary.added}</strong><span>Right-only records</span></div><div className="sp-summary__removed"><strong>{result.summary.removed}</strong><span>Left-only records</span></div><div><strong>{result.summary.changedCells}</strong><span>Changed cells</span></div></div>
        {(result.addedColumns.length > 0 || result.removedColumns.length > 0) && <p className="sp-column-note">{result.addedColumns.length > 0 && <span><b>New columns:</b> {result.addedColumns.join(', ')}</span>}{result.addedColumns.length > 0 && result.removedColumns.length > 0 && <span aria-hidden="true"> · </span>}{result.removedColumns.length > 0 && <span><b>Removed columns:</b> {result.removedColumns.join(', ')}</span>}</p>}
        <div className="sp-result-toolbar"><label className="sp-check"><input type="checkbox" checked={changedOnly} onChange={(event) => setChangedOnly(event.target.checked)} /> Show mismatches only</label><label className="sp-search"><span className="sr-only">Filter comparison results</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter by ID, row, column, or value" /></label><span className="sp-result-count">{visibleCells.length.toLocaleString()} matching cell entries</span></div>
        {visibleCells.length === 0 ? <div className="sp-empty-result"><Check size={19} /><p>{result.summary.changed || result.summary.added || result.summary.removed ? 'No cells match this filter.' : 'The records match. No differences were found.'}</p></div> : <div className="sp-table-wrap" role="region" aria-label="Scrollable side-by-side cell differences" tabIndex="0"><table className="sp-diff-table"><thead><tr><th scope="col">Change</th><th scope="col">Record IDs</th><th scope="col">Match key</th><th scope="col">Column</th><th scope="col">Original</th><th scope="col">Updated</th></tr></thead><tbody>{visibleRows.map((cell, index) => <tr className={`sp-diff-row sp-diff-row--${cell.type}${cell.changed && cell.type === 'changed' ? ' is-cell-changed' : ''}`} key={`${cell.type}-${cell.rowKey}-${cell.label}-${index}`}><td><span className={`sp-change-badge sp-change-badge--${cell.type}`}>{cell.type}</span></td><td className="sp-record-ids"><span>{cell.leftRecordId || '—'}</span><span>{cell.rightRecordId || '—'}</span></td><td><span className="sp-row-key">{cell.rowKey}</span><small>source rows {cell.leftRowNumber || '—'} / {cell.rightRowNumber || '—'}</small></td><td>{cell.label}</td><td className="sp-value sp-value--left">{getDisplayValue(cell.left)}</td><td className="sp-value sp-value--right">{getDisplayValue(cell.right)}</td></tr>)}</tbody></table>{visibleCells.length > visibleRows.length && <button type="button" className="sp-show-more" onClick={() => setVisibleLimit((limit) => limit + ROW_LIMIT)}><ChevronDown size={16} /> Show more ({(visibleCells.length - visibleRows.length).toLocaleString()} remaining)</button>}</div>}
      </section>}

      <details className="sp-help"><summary>How to compare CSV and Excel files</summary><div><p>Choose a format tab, then load, paste, or use sample data on both sides. CSV mode lets you edit the source text or switch to a rows-and-columns preview. Excel mode lets you choose a worksheet and preview its records.</p><p><strong>Validate</strong> checks that both sources parse and contain headers. Then choose a shared key to align reordered records, or compare by row position. Ignore selected columns to exclude them from difference counts; ignored columns are retained in record downloads.</p><p>Each matched source record receives an <strong>L-ID</strong> and <strong>R-ID</strong> based on its one-based data-row order (for example, L-21 matched with R-09). Download identical or mismatched records as CSV or Excel, or download the cell-by-cell CSV report.</p><p>Files are processed locally in this browser and are not uploaded. CSV, TSV, and XLSX are supported; legacy XLS files are not supported.</p></div></details>
    </main>
  );
}
