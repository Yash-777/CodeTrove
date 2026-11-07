import ToolBackLink from '../../components/ToolBackLink.jsx';
import { useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, Check, ChevronDown, Copy, Download, FileSpreadsheet, FolderOpen, WandSparkles } from 'lucide-react';
import JSON5 from 'json5';
import {
  createDefaultMappingRules,
  DOCUMENT_FORMATS,
  normalizeCellValue,
  parseCsvTable,
  parseJsonTable,
  readMappingRules,
  SAMPLE_CSV,
  SAMPLE_JSON,
  SAMPLE_MAPPING_RULES,
  serializeCsv,
  serializeJson,
  tableFromRows,
  applyColumnMapping,
} from '../../utils/documentConverter.js';
import { copyToClipboard } from '../../utils/textActions.js';
import '../../components/CodeRunner/RunnableCode.css';
import './CompilerPage.css';
import './DocumentConverterPage.css';

const MAX_LOCAL_FILE_BYTES = 15 * 1024 * 1024;
const FORMAT_OPTIONS = Object.entries(DOCUMENT_FORMATS).map(([value, format]) => ({ value, label: `${format.label} (${format.extension})` }));
const DELIMITERS = [
  { value: '', label: 'Auto-detect' },
  { value: ',', label: 'Comma (,)' },
  { value: ';', label: 'Semicolon (;)' },
  { value: '\t', label: 'Tab' },
  { value: '|', label: 'Pipe (|)' },
];

function getExcelJS() {
  return import('exceljs').then((module) => module.default || module);
}

function worksheetToTable(worksheet) {
  if (!worksheet) throw new Error('Choose a worksheet from this workbook.');
  const rows = [];
  const width = worksheet.columnCount;
  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    rows.push(Array.from({ length: width }, (_, index) => normalizeCellValue(row.getCell(index + 1).value)));
  }
  return tableFromRows(rows);
}

function safeSheetName(value) {
  const name = String(value || '').trim();
  if (!name) throw new Error('Enter a name for the result worksheet.');
  if (name.length > 31) throw new Error('Excel worksheet names must be 31 characters or fewer.');
  if (/[\\/?*:[\]]/.test(name)) throw new Error('Excel worksheet names cannot contain \\, /, ?, *, :, [ or ].');
  return name;
}

function toExcelColumn(number) {
  let value = number;
  let result = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function makeOutputFilename(sourceFileName, targetFormat) {
  const base = String(sourceFileName || 'codetrove-data').replace(/\.[^.]+$/, '') || 'codetrove-data';
  return `${base}-converted${DOCUMENT_FORMATS[targetFormat].extension}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function writeWorkbook(sourceWorkbook, table, sheetName) {
  const ExcelJS = await getExcelJS();
  let workbook = new ExcelJS.Workbook();
  if (sourceWorkbook) {
    const original = await sourceWorkbook.xlsx.writeBuffer();
    await workbook.xlsx.load(original);
  }
  if (workbook.getWorksheet(sheetName)) {
    throw new Error(`This workbook already has a worksheet named "${sheetName}". Choose another output worksheet name.`);
  }
  const worksheet = workbook.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 1 }] });
  const headerRow = worksheet.addRow(table.headers);
  headerRow.font = { bold: true };
  worksheet.columns = table.headers.map((header, index) => {
    const longestCell = Math.max(String(header).length, ...table.rows.slice(0, 100).map((row) => String(row[index] ?? '').length));
    return { width: Math.min(Math.max(longestCell + 2, 12), 36) };
  });
  table.rows.forEach((row) => worksheet.addRow(row.map(normalizeCellValue)));
  if (table.headers.length > 0 && table.rows.length >= 0) {
    worksheet.autoFilter = { from: 'A1', to: `${toExcelColumn(table.headers.length)}${Math.max(1, table.rows.length + 1)}` };
  }
  return workbook.xlsx.writeBuffer();
}

function cleanMappingRules(text, headers) {
  let current;
  try { current = readMappingRules(text); }
  catch { return text; }
  const validKeys = new Set(headers.map(({ key }) => key));
  const mapping = Object.fromEntries(headers.map(({ key }) => [
    key,
    Object.prototype.hasOwnProperty.call(current.mapping, key) ? current.mapping[key] : key,
  ]));
  const skip = current.skip.filter((key) => validKeys.has(key));
  return JSON.stringify({ mapping, skip }, null, 2);
}

function CopyButton({ text, label = 'Copy output', disabled = false, onFailure }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      const copiedSuccessfully = await copyToClipboard(text);
      if (copiedSuccessfully) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      } else {
        onFailure?.();
      }
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" className={`runnable-code__icon-button${copied ? ' is-copied' : ''}`} onClick={copy} disabled={disabled} title={copied ? 'Copied' : label} aria-label={copied ? 'Copied to clipboard' : label}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}

function getPreviewHeader(header, index) {
  if (typeof header === 'string') return { key: header, label: header };
  const key = header?.key ?? header?.label ?? `column-${index + 1}`;
  const label = header?.label ?? header?.key ?? `Column ${index + 1}`;
  return { key, label };
}

function DataPreview({ table, label }) {
  if (!table?.headers?.length) return <p className="dc-empty-preview">Preview appears after you load or validate source data.</p>;
  const rows = table.rows.slice(0, 6);
  return (
    <div className="dc-table-wrap" aria-label={label}>
      <table className="dc-table">
        <thead><tr>{table.headers.map((header, index) => {
          const previewHeader = getPreviewHeader(header, index);
          return <th key={previewHeader.key} title={previewHeader.key}>{previewHeader.label}{previewHeader.key !== previewHeader.label && previewHeader.key.startsWith(previewHeader.label) ? <small> ({previewHeader.key.slice(previewHeader.label.length)})</small> : null}</th>;
        })}</tr></thead>
        <tbody>
          {rows.map((row, rowIndex) => <tr key={`row-${rowIndex}`}>{table.headers.map((header, index) => <td key={`${getPreviewHeader(header, index).key}-${index}`}>{String(row[index] ?? '')}</td>)}</tr>)}
        </tbody>
      </table>
      {table.rows.length > rows.length && <p className="dc-table-note">Showing {rows.length} of {table.rows.length} data rows.</p>}
    </div>
  );
}

function readRulesForDisplay(text) {
  try { return { ...readMappingRules(text), error: '' }; }
  catch (error) { return { mapping: {}, skip: [], error: error.message }; }
}

export default function DocumentConverterPage() {
  const fileInputRef = useRef(null);
  const [sourceFormat, setSourceFormat] = useState('csv');
  const [targetFormat, setTargetFormat] = useState('json');
  const [sourceText, setSourceText] = useState(SAMPLE_CSV);
  const [sourceFileName, setSourceFileName] = useState('codetrove-sample.csv');
  const [sourceWorkbook, setSourceWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [table, setTable] = useState(() => parseCsvTable(SAMPLE_CSV));
  const [rulesText, setRulesText] = useState(SAMPLE_MAPPING_RULES);
  const [delimiter, setDelimiter] = useState('');
  const [indent, setIndent] = useState(2);
  const [sheetName, setSheetName] = useState('Converted data');
  const [output, setOutput] = useState(null);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const rules = useMemo(() => readRulesForDisplay(rulesText), [rulesText]);
  const canSwap = sourceFormat !== 'xlsx' && targetFormat !== 'xlsx';

  const getCurrentTable = async () => {
    if (sourceFormat === 'csv') return parseCsvTable(sourceText, delimiter);
    if (sourceFormat === 'json') return parseJsonTable(sourceText);
    if (!sourceWorkbook || !selectedSheet) throw new Error('Choose a local Excel workbook and worksheet first.');
    return worksheetToTable(sourceWorkbook.getWorksheet(selectedSheet));
  };

  const resetForTextFormat = (format) => {
    setSourceWorkbook(null);
    setSheetNames([]);
    setSelectedSheet('');
    setSourceFileName('');
    setOutput(null);
    setDelimiter('');
    if (format === 'csv') {
      setSourceText(SAMPLE_CSV);
      const next = parseCsvTable(SAMPLE_CSV);
      setTable(next);
      setRulesText(SAMPLE_MAPPING_RULES);
      setSourceFileName('codetrove-sample.csv');
    } else if (format === 'json') {
      setSourceText(SAMPLE_JSON);
      const next = parseJsonTable(SAMPLE_JSON);
      setTable(next);
      setRulesText(SAMPLE_MAPPING_RULES);
      setSourceFileName('codetrove-sample.json');
    } else {
      setSourceText('');
      setTable(null);
      setRulesText('{\n  "mapping": {},\n  "skip": []\n}');
    }
    setStatus({ type: 'idle', message: '' });
  };

  const changeSourceFormat = (format) => {
    setSourceFormat(format);
    resetForTextFormat(format);
  };

  const previewSource = async () => {
    try {
      const next = await getCurrentTable();
      const normalizedRules = cleanMappingRules(rulesText, next.headers);
      setTable(next);
      setRulesText(normalizedRules);
      setStatus({ type: 'ok', message: `Preview ready: ${next.headers.length} columns and ${next.rows.length} data rows.` });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Could not preview this source.' });
    }
  };

  const loadFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_LOCAL_FILE_BYTES) {
      setStatus({ type: 'error', message: 'This browser-only workbook reader supports files up to 15 MB. Choose a smaller file to keep processing responsive.' });
      return;
    }
    const extension = file.name.split('.').pop().toLowerCase();
    setOutput(null);
    try {
      if (extension === 'csv' || extension === 'json') {
        const text = await file.text();
        const next = extension === 'csv' ? parseCsvTable(text, delimiter) : parseJsonTable(text);
        setSourceFormat(extension);
        setSourceText(text);
        setSourceFileName(file.name);
        setSourceWorkbook(null);
        setSheetNames([]);
        setSelectedSheet('');
        setTable(next);
        setRulesText(createDefaultMappingRules(next.headers));
        setStatus({ type: 'ok', message: `Read ${file.name} locally: ${next.headers.length} columns and ${next.rows.length} data rows. The file was not uploaded.` });
      } else if (extension === 'xlsx') {
        const ExcelJS = await getExcelJS();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const names = workbook.worksheets.map((worksheet) => worksheet.name);
        if (!names.length) throw new Error('The selected Excel workbook has no worksheets.');
        const next = worksheetToTable(workbook.getWorksheet(names[0]));
        setSourceFormat('xlsx');
        setSourceText('');
        setSourceFileName(file.name);
        setSourceWorkbook(workbook);
        setSheetNames(names);
        setSelectedSheet(names[0]);
        setTable(next);
        setRulesText(createDefaultMappingRules(next.headers));
        setStatus({ type: 'ok', message: `Opened ${file.name} in this browser with ${names.length} worksheet${names.length === 1 ? '' : 's'}. No upload occurred.` });
      } else {
        throw new Error('Choose a .csv, .json, or .xlsx file. Older .xls files are not supported.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setStatus({ type: 'error', message: error.message || `Could not read ${file.name}.` });
    }
  };

  const changeWorksheet = (name) => {
    setSelectedSheet(name);
    setOutput(null);
    try {
      const next = worksheetToTable(sourceWorkbook?.getWorksheet(name));
      const normalizedRules = cleanMappingRules(rulesText, next.headers);
      setTable(next);
      setRulesText(normalizedRules);
      setStatus({ type: 'ok', message: `Selected worksheet “${name}”: ${next.headers.length} columns and ${next.rows.length} data rows.` });
    } catch (error) {
      setTable(null);
      setStatus({ type: 'error', message: error.message || 'Could not read the selected worksheet.' });
    }
  };

  const loadSample = async () => {
    setOutput(null);
    if (sourceFormat === 'xlsx') {
      try {
        const ExcelJS = await getExcelJS();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Orders');
        const sample = parseCsvTable(SAMPLE_CSV);
        worksheet.addRow(sample.headers.map(({ label }) => label));
        sample.rows.forEach((row) => worksheet.addRow(row));
        const next = worksheetToTable(worksheet);
        setSourceWorkbook(workbook);
        setSheetNames(['Orders']);
        setSelectedSheet('Orders');
        setSourceFileName('codetrove-sample.xlsx');
        setSourceText('');
        setTable(next);
        setRulesText(SAMPLE_MAPPING_RULES);
        setStatus({ type: 'ok', message: 'Loaded an in-memory XLSX sample. It is not sent or uploaded anywhere.' });
      } catch (error) {
        setStatus({ type: 'error', message: error.message || 'Could not build the XLSX sample.' });
      }
      return;
    }
    const text = sourceFormat === 'json' ? SAMPLE_JSON : SAMPLE_CSV;
    const next = sourceFormat === 'json' ? parseJsonTable(text) : parseCsvTable(text, delimiter);
    setSourceText(text);
    setSourceFileName(sourceFormat === 'json' ? 'codetrove-sample.json' : 'codetrove-sample.csv');
    setTable(next);
    setRulesText(SAMPLE_MAPPING_RULES);
    setStatus({ type: 'ok', message: 'Sample data loaded. Try renaming fields or skipping “Internal Note” in the rules below.' });
  };

  const clearSource = () => {
    setSourceText('');
    setSourceFileName('');
    setSourceWorkbook(null);
    setSheetNames([]);
    setSelectedSheet('');
    setTable(null);
    setOutput(null);
    setRulesText('{\n  "mapping": {},\n  "skip": []\n}');
    setStatus({ type: 'idle', message: 'Source cleared.' });
  };

  const updateRuleMapping = (headerKey, value) => {
    let draft;
    try { draft = JSON5.parse(rulesText || '{}'); }
    catch { draft = {}; }
    if (!draft || typeof draft !== 'object' || Array.isArray(draft)) draft = {};
    const mapping = draft.mapping && typeof draft.mapping === 'object' && !Array.isArray(draft.mapping) ? draft.mapping : {};
    draft.mapping = { ...mapping, [headerKey]: value };
    draft.skip = Array.isArray(draft.skip) ? draft.skip.filter((key) => key !== headerKey) : [];
    setRulesText(JSON.stringify(draft, null, 2));
    setOutput(null);
  };

  const convert = async () => {
    try {
      const currentTable = await getCurrentTable();
      const activeRules = cleanMappingRules(rulesText, currentTable.headers);
      const mapped = applyColumnMapping(currentTable, activeRules);
      setTable(currentTable);
      setRulesText(activeRules);
      const filename = makeOutputFilename(sourceFileName, targetFormat);
      if (targetFormat === 'json') {
        const text = serializeJson(mapped, indent);
        setOutput({ format: targetFormat, text, filename, table: mapped });
        setStatus({ type: 'ok', message: `Converted ${sourceFileName || 'source data'} to formatted JSON. ${mapped.rows.length} records created.` });
      } else if (targetFormat === 'csv') {
        const text = serializeCsv(mapped, delimiter || ',');
        setOutput({ format: targetFormat, text, filename, table: mapped });
        setStatus({ type: 'ok', message: `Converted ${sourceFileName || 'source data'} to CSV. Formula-like cells are escaped for spreadsheet safety.` });
      } else {
        const cleanName = safeSheetName(sheetName);
        const buffer = await writeWorkbook(sourceFormat === 'xlsx' ? sourceWorkbook : null, mapped, cleanName);
        setOutput({ format: targetFormat, buffer, filename, table: mapped, sheetName: cleanName });
        setStatus({ type: 'ok', message: sourceFormat === 'xlsx'
          ? `Added “${cleanName}” as a new worksheet; the existing workbook sheets are preserved.`
          : `Created an Excel workbook with a “${cleanName}” worksheet.` });
      }
    } catch (error) {
      setOutput(null);
      setStatus({ type: 'error', message: error.message || 'Conversion failed.' });
    }
  };

  const swapFormats = () => {
    if (!canSwap) return;
    const previousSource = sourceFormat;
    const previousTarget = targetFormat;
    if (output?.text && output.format === previousTarget) {
      setSourceFormat(previousTarget);
      setTargetFormat(previousSource);
      setSourceText(output.text);
      setSourceFileName(output.filename);
      try {
        const next = previousTarget === 'csv' ? parseCsvTable(output.text, delimiter) : parseJsonTable(output.text);
        setTable(next);
        setRulesText(createDefaultMappingRules(next.headers));
      } catch { setTable(null); }
    } else {
      setSourceFormat(previousTarget);
      setTargetFormat(previousSource);
      resetForTextFormat(previousTarget);
    }
    setOutput(null);
    setStatus({ type: 'idle', message: '' });
  };

  const downloadOutput = () => {
    if (!output) return;
    const data = output.format === 'xlsx'
      ? new Blob([output.buffer], { type: DOCUMENT_FORMATS.xlsx.mimeType })
      : new Blob([output.text], { type: DOCUMENT_FORMATS[output.format].mimeType });
    downloadBlob(data, output.filename);
  };

  return (
    <div className="content-page cp-page dc-page">
      <ToolBackLink />
      <div className="cp-head">
        <div>
          <h1>Document Converter</h1>
          <p className="cp-subtitle">Convert CSV, JSON, and Excel workbooks locally. Map or skip columns before you create the output file.</p>
        </div>
        <div className="dc-privacy" role="note"><FileSpreadsheet size={17} /><span>Browser-only processing · files are never uploaded</span></div>
      </div>

      <section className="runnable-code runnable-code--playground dc-card" aria-label="Document converter workspace">
        <div className="dc-toolbar">
          <label className="dc-select"><span>Source</span><select value={sourceFormat} onChange={(event) => changeSourceFormat(event.target.value)} aria-label="Source format">{FORMAT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <button type="button" className="runnable-code__icon-button dc-swap" onClick={swapFormats} disabled={!canSwap} title={canSwap ? 'Swap source and target formats' : 'Choose CSV or JSON to swap formats'} aria-label="Swap formats"><ArrowLeftRight size={18} /></button>
          <label className="dc-select"><span>Convert to</span><select value={targetFormat} onChange={(event) => { setTargetFormat(event.target.value); setOutput(null); setStatus({ type: 'idle', message: '' }); }} aria-label="Target format">{FORMAT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          {sourceFormat === 'csv' && <label className="dc-select"><span>CSV delimiter</span><select value={delimiter} onChange={(event) => setDelimiter(event.target.value)} aria-label="CSV delimiter">{DELIMITERS.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}</select></label>}
          {targetFormat === 'json' && <label className="dc-select"><span>JSON indent</span><select value={indent} onChange={(event) => setIndent(Number(event.target.value))} aria-label="JSON indentation"><option value={2}>2 spaces</option><option value={4}>4 spaces</option></select></label>}
          <button type="button" className="runnable-code__button dc-convert" onClick={convert}><WandSparkles size={16} /> Convert</button>
        </div>

        {sourceFormat === 'xlsx' && (
          <div className="dc-workbook-options">
            {sheetNames.length > 0 && <label className="dc-select"><span>Worksheet</span><select value={selectedSheet} onChange={(event) => changeWorksheet(event.target.value)} aria-label="Excel worksheet">{sheetNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>}
            {sourceFileName && <span className="dc-local-file" title={sourceFileName}><FileSpreadsheet size={15} />{sourceFileName}</span>}
          </div>
        )}

        {targetFormat === 'xlsx' && <div className="dc-workbook-options dc-workbook-options--target">
          <label className="dc-select"><span>Output worksheet name</span><input type="text" value={sheetName} maxLength={31} onChange={(event) => setSheetName(event.target.value)} aria-label="Output worksheet name" placeholder="Converted data" /></label>
          <p>{sourceFormat === 'xlsx' && sourceWorkbook ? 'The converted data is added as a new worksheet; existing worksheets are preserved.' : 'Excel output is a workbook with the converted data in a new worksheet.'}</p>
        </div>}

        <div className="dc-actions-row">
          <div className="dc-actions-row__left">
            <label className="dc-file-picker"><FolderOpen size={16} /><span>Open local CSV, JSON, or XLSX</span><input ref={fileInputRef} type="file" accept=".csv,.json,.xlsx,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => loadFile(event.target.files?.[0])} aria-label="Open a local CSV, JSON, or XLSX file" /></label>
            <button type="button" className="runnable-code__button" onClick={previewSource} title="Read and preview the current source">Preview</button>
            <button type="button" className="runnable-code__button" onClick={loadSample}>Sample</button>
            <button type="button" className="runnable-code__button" onClick={clearSource}>Clear</button>
          </div>
          <span className="dc-file-size-note">Maximum local file size: 15 MB</span>
        </div>

        <div className="dc-panes">
          <div className="dc-pane">
            <div className="dc-pane__bar"><span className="runnable-code__file"><span className="runnable-code__badge">{sourceFormat.toUpperCase()}</span><span className="runnable-code__file-name">{sourceFileName || (sourceFormat === 'xlsx' ? 'local workbook' : `input${DOCUMENT_FORMATS[sourceFormat].extension}`)}</span></span>
              {sourceFormat !== 'xlsx' && <CopyButton text={sourceText} label="Copy source" disabled={!sourceText} onFailure={() => setStatus({ type: 'error', message: 'Clipboard access was unavailable. Select and copy the source text manually.' })} />}
            </div>
            {sourceFormat === 'xlsx' ? (
              <div className="dc-workbook-source">
                <FileSpreadsheet size={27} />
                <strong>{sourceWorkbook ? sourceFileName || 'In-memory XLSX sample' : 'Choose a local .xlsx workbook'}</strong>
                <span>{sourceWorkbook ? `${sheetNames.length} worksheet${sheetNames.length === 1 ? '' : 's'} available. Choose one above and preview its rows.` : 'The selected file is read directly in your browser. It is never sent to a server.'}</span>
              </div>
            ) : (
              <textarea className="dc-editor" value={sourceText} onChange={(event) => { setSourceText(event.target.value); setOutput(null); setStatus({ type: 'idle', message: 'Source edited. Preview or convert to apply the latest changes.' }); }} spellCheck={false} aria-label={`${DOCUMENT_FORMATS[sourceFormat].label} source data`} placeholder={`Paste ${DOCUMENT_FORMATS[sourceFormat].label} data here, or open a local file.`} />
            )}
            <div className="dc-pane__footer">Input data remains in this browser tab; the converter makes no upload request.</div>
          </div>

          <div className="dc-pane dc-pane--output">
            <div className="dc-pane__bar"><span className="runnable-code__file"><span className="runnable-code__badge">{targetFormat.toUpperCase()}</span><span className="runnable-code__file-name">{output?.filename || `output${DOCUMENT_FORMATS[targetFormat].extension}`}</span></span>
              <div className="runnable-code__actions">
                <CopyButton text={output?.text || ''} label="Copy converted output" disabled={!output?.text} onFailure={() => setStatus({ type: 'error', message: 'Clipboard access was unavailable. Select and copy the converted text manually.' })} />
                <button type="button" className="runnable-code__icon-button" onClick={downloadOutput} disabled={!output} title={output ? `Download ${output.filename}` : 'Convert data to enable download'} aria-label={`Download ${targetFormat} result`}><Download size={16} /></button>
              </div>
            </div>
            {output?.format === 'xlsx' ? (
              <div className="dc-xlsx-output"><div className="dc-xlsx-output__summary"><FileSpreadsheet size={20} /><span><strong>{output.sheetName}</strong> worksheet ready · {output.table.rows.length} rows · {(output.buffer.byteLength / 1024).toFixed(1)} KB</span></div><DataPreview table={output.table} label="Excel output preview" /></div>
            ) : (
              <textarea className="dc-editor dc-editor--output" value={output?.text || ''} readOnly aria-label="Converted output" placeholder={`Converted ${DOCUMENT_FORMATS[targetFormat].label} appears here. Choose Download to save the result file.`} />
            )}
            {output?.format !== 'xlsx' && output?.table && <div className="dc-pane__footer">{output.table.rows.length} rows · {output.table.headers.length} fields · Ready to download</div>}
          </div>
        </div>

        {table?.headers?.length > 0 && <details className="dc-rules" open>
          <summary><ChevronDown size={16} /><span>Field mapping and formatting rules</span><span className="dc-rules__summary-note">Rename JSON keys or skip columns</span></summary>
          <div className="dc-rules__body">
            <p>Map each source header to an output field. Clear a field name or uncheck <strong>Include</strong> to omit that column. You can also edit the JSON rules directly; comments are allowed.</p>
            <div className="dc-mapping-wrap">
              <table className="dc-mapping-table"><thead><tr><th scope="col">Source header</th><th scope="col">JSON / output field</th><th scope="col">Include</th></tr></thead>
                <tbody>{table.headers.map((header) => {
                  const mapped = Object.prototype.hasOwnProperty.call(rules.mapping, header.key) ? rules.mapping[header.key] : header.key;
                  const included = !rules.skip.includes(header.key) && !rules.skip.includes(header.label) && mapped !== '' && mapped !== null;
                  return <tr key={header.key}><th scope="row"><code>{header.key}</code></th><td><input type="text" value={typeof mapped === 'string' ? mapped : ''} disabled={!included} onChange={(event) => updateRuleMapping(header.key, event.target.value)} aria-label={`Output field for ${header.key}`} placeholder="Leave blank to skip" /></td><td><input type="checkbox" checked={included} onChange={(event) => updateRuleMapping(header.key, event.target.checked ? (typeof mapped === 'string' && mapped ? mapped : header.key) : '')} aria-label={`Include ${header.key}`} /></td></tr>;
                })}</tbody>
              </table>
            </div>
            <div className="dc-rules__toolbar"><label htmlFor="dc-rules-text">Format rules (JSON / JSON5)</label><button type="button" className="runnable-code__button" onClick={() => setRulesText(SAMPLE_MAPPING_RULES)}>Sample rules</button></div>
            <textarea id="dc-rules-text" className="dc-rules-editor" value={rulesText} onChange={(event) => { setRulesText(event.target.value); setOutput(null); }} spellCheck={false} rows={9} aria-label="Column mapping format rules" />
            <p className="dc-rules__hint"><code>mapping</code> renames source headers; <code>skip</code> lists source headers to omit. Use <code>null</code> or an empty mapping value to skip a column. The sample omits “Internal Note.”</p>
            {rules.error && <p className="dc-rules__error" role="alert">{rules.error}</p>}
          </div>
        </details>}

        <DataPreview table={table} label="Source data preview" />
        <div className={`dc-status${status.type === 'error' ? ' dc-status--error' : status.type === 'ok' ? ' dc-status--ok' : ''}`} role="status" aria-live="polite">{status.message || <span>Choose a source and target, preview the data, then convert and download the formatted file.</span>}</div>
      </section>

      <section className="cp-about dc-about" aria-labelledby="dc-about-title">
        <h2 id="dc-about-title">About the Document Converter</h2>
        <p>Use this tool to move structured rows between CSV, JSON, and modern Excel <code>.xlsx</code> workbooks. CSV and JSON can be pasted, edited, sampled, or read from a file. Excel input is read from a local file and lets you choose which worksheet to convert.</p>
        <h3>Field mapping example</h3>
        <p>A CSV header named <code>Customer Name</code> can become the JSON field <code>customerName</code>. To leave a column out, clear its output field or add the original header to <code>"skip"</code> in Format rules. For XLSX output, converted data is written into a worksheet; when the source is a workbook, its existing worksheets are preserved and a new result sheet is added.</p>
        <h3>Local processing and spreadsheet safety</h3>
        <p>Files are parsed and generated in your browser. The application does not send their contents to a server. CSV output escapes formula-like values that spreadsheet programs might otherwise interpret as formulas. Browser-based XLSX reading is intended for regular-sized workbooks; very large files and legacy <code>.xls</code> workbooks are not supported.</p>
        <p className="dc-open-source-note">Built with open-source Papa Parse for delimited text and ExcelJS for browser-based workbook processing.</p>
      </section>
    </div>
  );
}
