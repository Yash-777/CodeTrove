import { useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeftRight, Check, ChevronDown, Download, FileSpreadsheet, FileUp, RotateCcw, ShieldCheck } from 'lucide-react';
import ToolBackLink from '../../components/ToolBackLink.jsx';
import { parseCsvTable } from '../../utils/documentConverter.js';
import {
  compareSpreadsheetTables,
  createSpreadsheetDiffCsv,
  getSharedComparisonKeys,
  MAX_COMPARE_FILE_BYTES,
  parseComparisonCsv,
  SAMPLE_AFTER_CSV,
  SAMPLE_BEFORE_CSV,
  worksheetToComparisonTable,
} from '../../utils/spreadsheetCompare.js';
import './DocumentComparePage.css';

const EMPTY_SIDE = { name: '', size: 0, type: '', table: null, workbook: null, sheetNames: [], sheetName: '' };
const ROW_LIMIT = 350;

function getExcelJS() {
  return import('exceljs').then((module) => module.default || module);
}

function downloadCsv(content, filename) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function SideInput({ side, label, descriptor, data, fileRef, onLoadFile, onSample, onClear, onSheetChange }) {
  const sideName = side === 'left' ? 'Original' : 'Updated';
  return (
    <section className={`sp-file-panel sp-file-panel--${side}`} aria-label={`${sideName} file`}>
      <div className="sp-file-panel__heading">
        <div>
          <span className={`sp-file-tag sp-file-tag--${side}`}>{label}</span>
          <h2>{sideName} file</h2>
          <p>{descriptor}</p>
        </div>
        <FileSpreadsheet size={21} aria-hidden="true" />
      </div>
      <div className="sp-file-panel__actions">
        <label className="sp-file-picker">
          <FileUp size={16} /> Choose file
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.xlsx,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            aria-label={`Choose ${sideName.toLowerCase()} CSV or Excel file`}
            onChange={(event) => onLoadFile(event.target.files?.[0])}
          />
        </label>
        <button type="button" className="sp-button sp-button--quiet" onClick={onSample}>Sample</button>
        {data.table && <button type="button" className="sp-icon-button" onClick={onClear} title={`Clear ${sideName.toLowerCase()} file`} aria-label={`Clear ${sideName.toLowerCase()} file`}><RotateCcw size={15} /></button>}
      </div>
      {data.name ? (
        <div className="sp-loaded-file">
          <strong title={data.name}>{data.name}</strong>
          <span>{data.table?.rows.length.toLocaleString() ?? 0} data rows · {(data.size / 1024).toFixed(1)} KB</span>
        </div>
      ) : (
        <div className="sp-drop-hint"><FileSpreadsheet size={20} /><span>Choose a CSV, TSV, or XLSX file. It stays in this browser.</span></div>
      )}
      {data.sheetNames.length > 1 && (
        <label className="sp-sheet-select">
          Worksheet
          <select value={data.sheetName} onChange={(event) => onSheetChange(event.target.value)} aria-label={`Select ${sideName.toLowerCase()} worksheet`}>
            {data.sheetNames.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      )}
      {data.sheetNames.length === 1 && <p className="sp-sheet-name">Worksheet: {data.sheetName}</p>}
    </section>
  );
}

function getDisplayValue(value) {
  if (value === '' || value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function buildVisibleCells(result, changedOnly, query) {
  if (!result) return [];
  const needle = query.trim().toLocaleLowerCase();
  return result.records.flatMap((record) => {
    if (changedOnly && record.type === 'unchanged') return [];
    const cells = changedOnly && record.type === 'changed' ? record.cells.filter((cell) => cell.changed) : record.cells;
    return cells.map((cell) => ({ ...cell, type: record.type, rowKey: record.rowKey, leftRowNumber: record.leftRowNumber, rightRowNumber: record.rightRowNumber }))
      .filter((entry) => !needle || [entry.type, entry.rowKey, entry.label, entry.left, entry.right].some((value) => String(value ?? '').toLocaleLowerCase().includes(needle)));
  });
}

export default function DocumentComparePage() {
  const leftInputRef = useRef(null);
  const rightInputRef = useRef(null);
  const requestIds = useRef({ left: 0, right: 0 });
  const [left, setLeft] = useState(EMPTY_SIDE);
  const [right, setRight] = useState(EMPTY_SIDE);
  const [matchMode, setMatchMode] = useState('key');
  const [matchKey, setMatchKey] = useState('');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [changedOnly, setChangedOnly] = useState(true);
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({ type: 'idle', message: 'Load two files or try the sample comparison.' });
  const [busySide, setBusySide] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(ROW_LIMIT);

  const sharedKeys = useMemo(() => getSharedComparisonKeys(left.table, right.table), [left.table, right.table]);
  const defaultKey = sharedKeys.find(({ key }) => key.toLocaleLowerCase() === 'id') || sharedKeys[0];
  const effectiveKey = sharedKeys.find(({ key }) => key === matchKey)?.key || defaultKey?.key || '';
  const visibleCells = useMemo(() => buildVisibleCells(result, changedOnly, search), [result, changedOnly, search]);
  const visibleRows = visibleCells.slice(0, visibleLimit);

  function assignSide(side, value) {
    if (side === 'left') setLeft(value);
    else setRight(value);
  }

  async function loadFile(side, file) {
    if (!file) return;
    const id = ++requestIds.current[side];
    assignSide(side, { ...EMPTY_SIDE, name: file.name, size: file.size, type: 'loading' });
    setResult(null);
    setBusySide(side);
    setStatus({ type: 'loading', message: `Reading ${file.name} locally…` });
    if (file.size > MAX_COMPARE_FILE_BYTES) {
      assignSide(side, EMPTY_SIDE);
      setBusySide('');
      setStatus({ type: 'error', message: `Choose a file no larger than ${MAX_COMPARE_FILE_BYTES / (1024 * 1024)} MB.` });
      if (side === 'left' && leftInputRef.current) leftInputRef.current.value = '';
      if (side === 'right' && rightInputRef.current) rightInputRef.current.value = '';
      return;
    }
    try {
      const extension = file.name.split('.').pop()?.toLocaleLowerCase();
      let next;
      if (extension === 'csv' || extension === 'tsv') {
        const table = parseComparisonCsv(await file.text(), extension === 'tsv' ? '\t' : '');
        next = { name: file.name, size: file.size, type: extension, table, workbook: null, sheetNames: [], sheetName: '' };
      } else if (extension === 'xlsx') {
        const ExcelJS = await getExcelJS();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const sheetNames = workbook.worksheets.map((sheet) => sheet.name);
        if (!sheetNames.length) throw new Error('This workbook does not contain a worksheet.');
        const sheetName = sheetNames[0];
        next = { name: file.name, size: file.size, type: extension, table: worksheetToComparisonTable(workbook.getWorksheet(sheetName)), workbook, sheetNames, sheetName };
      } else {
        throw new Error('Choose a .csv, .tsv, or .xlsx file. Older .xls workbooks are not supported.');
      }
      if (requestIds.current[side] !== id) return;
      assignSide(side, next);
      setResult(null);
      setStatus({ type: 'ok', message: `${file.name} read in this browser. No file was uploaded.` });
    } catch (error) {
      if (requestIds.current[side] !== id) return;
      assignSide(side, EMPTY_SIDE);
      setStatus({ type: 'error', message: error?.message || `Could not read ${file.name}.` });
    } finally {
      if (requestIds.current[side] === id) {
        setBusySide('');
        const ref = side === 'left' ? leftInputRef : rightInputRef;
        if (ref.current) ref.current.value = '';
      }
    }
  }

  function loadSample(side) {
    const source = side === 'left' ? SAMPLE_BEFORE_CSV : SAMPLE_AFTER_CSV;
    const fileName = side === 'left' ? 'employees-before.csv' : 'employees-after.csv';
    assignSide(side, { name: fileName, size: new Blob([source]).size, type: 'csv', table: parseCsvTable(source), workbook: null, sheetNames: [], sheetName: '' });
    setMatchMode('key');
    setMatchKey('Employee ID');
    setResult(null);
    setStatus({ type: 'ok', message: `${side === 'left' ? 'Original' : 'Updated'} sample loaded locally. Compare both files to view their differences.` });
  }

  function loadBothSamples() {
    setLeft({ name: 'employees-before.csv', size: new Blob([SAMPLE_BEFORE_CSV]).size, type: 'csv', table: parseCsvTable(SAMPLE_BEFORE_CSV), workbook: null, sheetNames: [], sheetName: '' });
    setRight({ name: 'employees-after.csv', size: new Blob([SAMPLE_AFTER_CSV]).size, type: 'csv', table: parseCsvTable(SAMPLE_AFTER_CSV), workbook: null, sheetNames: [], sheetName: '' });
    setMatchMode('key');
    setMatchKey('Employee ID');
    setIgnoreWhitespace(false);
    setIgnoreCase(false);
    setChangedOnly(true);
    setSearch('');
    setVisibleLimit(ROW_LIMIT);
    const comparison = compareSpreadsheetTables(parseCsvTable(SAMPLE_BEFORE_CSV), parseCsvTable(SAMPLE_AFTER_CSV), { matchBy: 'key', key: 'Employee ID' });
    setResult(comparison);
    setStatus({ type: 'ok', message: 'Sample comparison ready. Files were created in browser memory; nothing was uploaded.' });
  }

  function changeSheet(side, name) {
    const current = side === 'left' ? left : right;
    try {
      const table = worksheetToComparisonTable(current.workbook?.getWorksheet(name));
      assignSide(side, { ...current, sheetName: name, table });
      setResult(null);
      setStatus({ type: 'ok', message: `Selected worksheet “${name}”. Compare the files to refresh the results.` });
    } catch (error) {
      setStatus({ type: 'error', message: error?.message || 'Could not read that worksheet.' });
    }
  }

  function clearSide(side) {
    requestIds.current[side] += 1;
    assignSide(side, EMPTY_SIDE);
    setResult(null);
    setStatus({ type: 'idle', message: `${side === 'left' ? 'Original' : 'Updated'} file cleared.` });
  }

  function clearAll() {
    requestIds.current.left += 1;
    requestIds.current.right += 1;
    setLeft(EMPTY_SIDE);
    setRight(EMPTY_SIDE);
    setResult(null);
    setSearch('');
    setVisibleLimit(ROW_LIMIT);
    setStatus({ type: 'idle', message: 'Both files and the comparison were cleared.' });
  }

  function compareFiles() {
    try {
      const comparison = compareSpreadsheetTables(left.table, right.table, {
        matchBy: matchMode === 'key' && effectiveKey ? 'key' : 'position',
        key: effectiveKey,
        ignoreWhitespace,
        ignoreCase,
      });
      setResult(comparison);
      setVisibleLimit(ROW_LIMIT);
      setStatus({
        type: 'ok',
        message: comparison.summary.changed || comparison.summary.added || comparison.summary.removed
          ? `Comparison complete: ${comparison.summary.changed} changed, ${comparison.summary.added} added, ${comparison.summary.removed} removed.`
          : 'Comparison complete. No row differences found.',
      });
    } catch (error) {
      setResult(null);
      setStatus({ type: 'error', message: error?.message || 'Could not compare these files.' });
    }
  }

  function swapFiles() {
    setLeft(right);
    setRight(left);
    setResult(null);
    setStatus({ type: 'idle', message: 'Files swapped. Compare again to refresh the result.' });
  }

  return (
    <main className="spreadsheet-compare-page">
      <div className="sp-topbar">
        <ToolBackLink />
        <span className="sp-local-note"><ShieldCheck size={15} /> Files stay in this browser</span>
      </div>

      <header className="sp-heading">
        <div>
          <p className="sp-eyebrow">DATA &amp; DOCUMENTS</p>
          <h1>Document Compare</h1>
          <p>Compare CSV, TSV, and Excel worksheets side by side. Find changed cells, added rows, removed rows, and new columns.</p>
        </div>
        <div className="sp-heading__actions">
          <button type="button" className="sp-button sp-button--secondary" onClick={loadBothSamples}><FileSpreadsheet size={16} /> Load sample</button>
          <button type="button" className="sp-button sp-button--secondary" onClick={clearAll}><RotateCcw size={16} /> Clear all</button>
        </div>
      </header>

      <section className="sp-workspace" aria-label="Spreadsheet comparison workspace">
        <div className="sp-file-grid">
          <SideInput side="left" label="BEFORE" descriptor="The original file" data={left} fileRef={leftInputRef} onLoadFile={(file) => loadFile('left', file)} onSample={() => loadSample('left')} onClear={() => clearSide('left')} onSheetChange={(name) => changeSheet('left', name)} />
          <div className="sp-swap" aria-hidden="true"><ArrowLeftRight size={19} /></div>
          <SideInput side="right" label="AFTER" descriptor="The updated file" data={right} fileRef={rightInputRef} onLoadFile={(file) => loadFile('right', file)} onSample={() => loadSample('right')} onClear={() => clearSide('right')} onSheetChange={(name) => changeSheet('right', name)} />
        </div>

        <div className="sp-options" aria-label="Comparison options">
          <label className="sp-option-select">
            <span>Match rows</span>
            <select value={matchMode} onChange={(event) => setMatchMode(event.target.value)} aria-label="How to match rows">
              <option value="key" disabled={!sharedKeys.length}>By shared key column</option>
              <option value="position">By row position</option>
            </select>
          </label>
          {matchMode === 'key' && (
            <label className="sp-option-select">
              <span>Key column</span>
              <select value={effectiveKey} onChange={(event) => setMatchKey(event.target.value)} disabled={!sharedKeys.length} aria-label="Choose shared key column">
                {sharedKeys.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
          )}
          <label className="sp-check"><input type="checkbox" checked={ignoreWhitespace} onChange={(event) => setIgnoreWhitespace(event.target.checked)} /> Ignore whitespace</label>
          <label className="sp-check"><input type="checkbox" checked={ignoreCase} onChange={(event) => setIgnoreCase(event.target.checked)} /> Ignore case</label>
          <button type="button" className="sp-button sp-button--swap" onClick={swapFiles} disabled={!left.table || !right.table}><ArrowLeftRight size={16} /> Swap files</button>
          <button type="button" className="sp-button sp-button--primary" onClick={compareFiles} disabled={!left.table || !right.table || Boolean(busySide)}><FileSpreadsheet size={16} /> Compare files</button>
        </div>

        {status.message && <p className={`sp-status sp-status--${status.type}`} role="status">{status.type === 'error' ? <AlertCircle size={15} /> : status.type === 'ok' ? <Check size={15} /> : null}{status.message}</p>}
      </section>

      {result && (
        <section className="sp-results" aria-label="Spreadsheet comparison result">
          <div className="sp-results__heading">
            <div><p className="sp-eyebrow">COMPARISON RESULT</p><h2>Changes between files</h2></div>
            <button type="button" className="sp-button sp-button--secondary" onClick={() => downloadCsv(createSpreadsheetDiffCsv(result), 'codetrove-spreadsheet-diff.csv')}><Download size={16} /> Download diff CSV</button>
          </div>
          <div className="sp-summary" aria-label="Change summary">
            <div><strong>{result.summary.changed}</strong><span>Changed rows</span></div>
            <div className="sp-summary__added"><strong>{result.summary.added}</strong><span>Added rows</span></div>
            <div className="sp-summary__removed"><strong>{result.summary.removed}</strong><span>Removed rows</span></div>
            <div><strong>{result.summary.changedCells}</strong><span>Changed cells</span></div>
            <div><strong>{result.columns.length}</strong><span>Compared columns</span></div>
          </div>
          {(result.addedColumns.length > 0 || result.removedColumns.length > 0) && (
            <p className="sp-column-note">
              {result.addedColumns.length > 0 && <span><b>New columns:</b> {result.addedColumns.join(', ')}</span>}
              {result.addedColumns.length > 0 && result.removedColumns.length > 0 && <span aria-hidden="true"> · </span>}
              {result.removedColumns.length > 0 && <span><b>Removed columns:</b> {result.removedColumns.join(', ')}</span>}
            </p>
          )}
          <div className="sp-result-toolbar">
            <label className="sp-check"><input type="checkbox" checked={changedOnly} onChange={(event) => setChangedOnly(event.target.checked)} /> Show changes only</label>
            <label className="sp-search"><span className="sr-only">Filter comparison results</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter by row, column, or value" /></label>
            <span className="sp-result-count">{visibleCells.length.toLocaleString()} matching cell entries</span>
          </div>
          {visibleCells.length === 0 ? (
            <div className="sp-empty-result"><Check size={19} /><p>{result.summary.changed || result.summary.added || result.summary.removed ? 'No cells match this filter.' : 'The worksheets match. No differences were found.'}</p></div>
          ) : (
            <div className="sp-table-wrap" role="region" aria-label="Scrollable side-by-side cell differences" tabIndex="0">
              <table className="sp-diff-table">
                <thead><tr><th scope="col">Change</th><th scope="col">Row / key</th><th scope="col">Column</th><th scope="col">Original</th><th scope="col">Updated</th></tr></thead>
                <tbody>{visibleRows.map((cell, index) => (
                  <tr className={`sp-diff-row sp-diff-row--${cell.type}${cell.changed && cell.type === 'changed' ? ' is-cell-changed' : ''}`} key={`${cell.type}-${cell.rowKey}-${cell.label}-${index}`}>
                    <td><span className={`sp-change-badge sp-change-badge--${cell.type}`}>{cell.type}</span></td>
                    <td><span className="sp-row-key">{cell.rowKey}</span><small>{cell.leftRowNumber ? `row ${cell.leftRowNumber}` : '—'} / {cell.rightRowNumber ? `row ${cell.rightRowNumber}` : '—'}</small></td>
                    <td>{cell.label}</td>
                    <td className="sp-value sp-value--left">{getDisplayValue(cell.left)}</td>
                    <td className="sp-value sp-value--right">{getDisplayValue(cell.right)}</td>
                  </tr>
                ))}</tbody>
              </table>
              {visibleCells.length > visibleRows.length && <button type="button" className="sp-show-more" onClick={() => setVisibleLimit((limit) => limit + ROW_LIMIT)}><ChevronDown size={16} /> Show more ({(visibleCells.length - visibleRows.length).toLocaleString()} remaining)</button>}
            </div>
          )}
        </section>
      )}

      <details className="sp-help">
        <summary>How to compare CSV and Excel files</summary>
        <div>
          <p>Load a file into each side, or use the sample to see an edited row, a removed record, a newly added record, and a new column. For Excel workbooks, choose the worksheet on each side independently.</p>
          <p><strong>By shared key column</strong> matches records by a common field such as an employee ID, so rows can be reordered without appearing as changes. <strong>By row position</strong> compares the first data row with the first data row, the second with the second, and so on.</p>
          <p>Use the whitespace and case options to reduce formatting-only differences. The comparison reads files locally in the browser and does not upload them. CSV, TSV, and XLSX are supported; legacy XLS files are not supported.</p>
          <p className="sp-open-source-note">Built with open-source, browser-capable CSV and Excel libraries already used by CodeTrove.</p>
        </div>
      </details>
    </main>
  );
}
