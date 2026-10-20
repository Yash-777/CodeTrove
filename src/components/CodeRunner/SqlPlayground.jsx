import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, SQLite, MySQL, PostgreSQL, MSSQL, MariaSQL } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap } from '@codemirror/view';
import { lintGutter, setDiagnostics } from '@codemirror/lint';
import {
  DEFAULT_SQL_DIALECT,
  SQL_DIALECTS,
  formatSqlSource,
  getSampleSqlFormatRules,
  getSqlDialect,
  getSqlSyntaxDiagnostics,
} from '../../utils/sqlDialectTools.js';
import './SqlPlayground.css';

const SAMPLE_SETUP = `-- SQL interview practice dataset. Each department has multiple salaries.
DROP TABLE IF EXISTS employees;

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  department VARCHAR(40) NOT NULL,
  salary DECIMAL(10, 2) NOT NULL
);

INSERT INTO employees (id, name, email, department, salary) VALUES
  (1, 'Ivy Wilson', 'ivy@example.test', 'Engineering', 124000),
  (2, 'Ava Chen', 'ava@example.test', 'Engineering', 118000),
  (3, 'Noah Patel', 'noah@example.test', 'Engineering', 112000),
  (4, 'Olivia Reed', 'olivia@example.test', 'Design', 105000),
  (5, 'Mia Garcia', 'mia@example.test', 'Design', 98000),
  (6, 'Emma Davis', 'emma@example.test', 'Design', 91000),
  (7, 'Ethan Cole', 'ethan@example.test', 'Sales', 110000),
  (8, 'Sophia Kim', 'sophia@example.test', 'Sales', 110000),
  (9, 'Liam Brown', 'liam@example.test', 'Sales', 93000),
  (10, 'Sam Rivera', 'sam@example.test', 'Sales', 87000);
`;

const THIRD_HIGHEST_QUERY = `-- Interview question: find the third-highest DISTINCT salary.
-- Count distinct salaries above each row; two higher values means rank three.
SELECT DISTINCT employee.salary
FROM employees AS employee
WHERE (
  SELECT COUNT(DISTINCT higher.salary)
  FROM employees AS higher
  WHERE higher.salary > employee.salary
) = 2;
`;

const DEPARTMENT_SECOND_QUERY = `-- Interview question: find each department's second-highest DISTINCT salary.
-- Count distinct higher salaries within the same department; one means rank two.
SELECT employee.department, employee.name, employee.salary
FROM employees AS employee
WHERE (
  SELECT COUNT(DISTINCT higher.salary)
  FROM employees AS higher
  WHERE higher.department = employee.department
    AND higher.salary > employee.salary
) = 1
ORDER BY employee.department, employee.name;
`;

const SQL_EXAMPLES = {
  both: {
    label: 'Both salary interview queries',
    code: `${SAMPLE_SETUP}\n${THIRD_HIGHEST_QUERY}\n${DEPARTMENT_SECOND_QUERY}`,
  },
  third: {
    label: 'Third-highest salary',
    code: `${SAMPLE_SETUP}\n${THIRD_HIGHEST_QUERY}`,
  },
  department: {
    label: 'Department-wise second-highest salary',
    code: `${SAMPLE_SETUP}\n${DEPARTMENT_SECOND_QUERY}`,
  },
};

const CODEMIRROR_DIALECTS = {
  sqlite: SQLite,
  mysql: MySQL,
  postgresql: PostgreSQL,
  sqlserver: MSSQL,
  mariadb: MariaSQL,
};
const MAX_QUERY_MS = 10000;
const MAX_SYNTAX_CHECK_CHARS = 50000;

function displayCell(value) {
  if (value === null || value === undefined) return 'NULL';
  if (value instanceof Uint8Array) {
    const bytes = Array.from(value.slice(0, 32), (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `0x${bytes}${value.length > 32 ? '…' : ''}`;
  }
  return String(value);
}

function CopyIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg>;
}

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 5-5m-5 5-5-5M4 20h16" /></svg>;
}

function EraseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 15 8-10a2 2 0 0 1 3-.2l5 4a2 2 0 0 1 .3 2.8l-6.3 8H7l-3-2.5A1.8 1.8 0 0 1 4 15Z" /><path d="m10 19 5-6" /></svg>;
}

function SampleIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></svg>;
}

function FormatIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 5 14v5h5L20 9zM13 6l5 5M4 21h16" /></svg>;
}

function ResetIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11a9 9 0 1 1 2.6 6.4" /><path d="M3 4v7h7" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}

function ChevronIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
}

function downloadTextFile(fileName, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getDiagnosticSpan(diagnostic, sourceLength) {
  const from = Math.max(0, Math.min(diagnostic.from, sourceLength));
  const to = Math.max(from, Math.min(diagnostic.to, sourceLength));
  return { from, to };
}

export default function SqlPlayground({ isActive = false }) {
  const [code, setCode] = useState(SQL_EXAMPLES.both.code);
  const [database, setDatabase] = useState(DEFAULT_SQL_DIALECT);
  const [example, setExample] = useState('both');
  const [indentWidth, setIndentWidth] = useState(2);
  const [formatRules, setFormatRules] = useState(() => Object.fromEntries(
    SQL_DIALECTS.map((dialect) => [dialect.id, getSampleSqlFormatRules(dialect.id)])
  ));
  const [formatMessage, setFormatMessage] = useState('');
  const [syntaxMessage, setSyntaxMessage] = useState('Select SQL to load the local syntax checker.');
  const [syntaxDiagnostics, setSyntaxDiagnostics] = useState([]);
  const [resultSets, setResultSets] = useState([]);
  const [engineReady, setEngineReady] = useState(false);
  const [engineVersion, setEngineVersion] = useState('');
  const [runtimeMessage, setRuntimeMessage] = useState('Select SQLite to load the local execution engine.');
  const [runMessage, setRunMessage] = useState('Run a statement to see its result here.');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(null);
  const [copied, setCopied] = useState(false);
  const workerRef = useRef(null);
  const engineReadyRef = useRef(false);
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef(null);
  const startedAtRef = useRef(0);
  const timeoutRef = useRef(null);
  const runRef = useRef(null);
  const editorViewRef = useRef(null);
  const syntaxRequestRef = useRef(0);
  const formatRulesId = useId();
  const dialectInfo = getSqlDialect(database);
  const canExecute = database === 'sqlite';

  const createWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;

    engineReadyRef.current = false;
    setEngineReady(false);
    setRuntimeMessage('Loading SQLite WebAssembly…');

    const worker = new Worker(new URL('../../workers/sqlWorker.js', import.meta.url), {
      type: 'module',
      name: 'codetrove-sqlite-playground',
    });
    workerRef.current = worker;

    worker.onmessage = ({ data }) => {
      if (workerRef.current !== worker) return;

      if (data.type === 'ready') {
        engineReadyRef.current = true;
        setEngineReady(true);
        setEngineVersion(data.version || '');
        setRuntimeMessage(`SQLite ${data.version || ''} ready · in-memory database`);
        return;
      }

      if (data.type === 'reset') {
        setRunMessage('Database reset. Tables and rows have been removed.');
        return;
      }

      if (data.type === 'result' && data.id === activeRequestRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        setResultSets(data.resultSets || []);
        setElapsedMs(Math.max(0, performance.now() - startedAtRef.current));
        setRunMessage(data.resultSets?.length
          ? `Completed · ${data.resultSets.length} result set${data.resultSets.length === 1 ? '' : 's'}`
          : 'Script executed successfully · no result rows');
        setRunning(false);
        activeRequestRef.current = null;
        return;
      }

      if (data.type === 'error') {
        if (data.id === 'init') {
          engineReadyRef.current = false;
          setEngineReady(false);
          setRuntimeMessage('SQLite could not be initialized. Check that the WebAssembly asset loaded.');
          setError(data.message || 'SQLite initialization failed.');
          worker.terminate();
          workerRef.current = null;
          return;
        }
        if (data.id === activeRequestRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
          setError(data.message || 'SQL execution failed.');
          setRunMessage('The SQLite engine reported an error.');
          setRunning(false);
          activeRequestRef.current = null;
        }
      }
    };

    worker.onerror = (event) => {
      if (workerRef.current !== worker) return;
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      activeRequestRef.current = null;
      engineReadyRef.current = false;
      setEngineReady(false);
      setRuntimeMessage('The isolated SQL worker stopped unexpectedly.');
      setError(event.message || 'The SQL worker failed to start.');
      setRunning(false);
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({ type: 'init', id: 'init' });
    return worker;
  }, []);

  useEffect(() => {
    if (isActive && canExecute) createWorker();
  }, [isActive, canExecute, createWorker]);

  useEffect(() => () => {
    window.clearTimeout(timeoutRef.current);
    workerRef.current?.terminate();
    workerRef.current = null;
    engineReadyRef.current = false;
  }, []);

  useEffect(() => {
    if (!isActive) return undefined;

    const requestId = ++syntaxRequestRef.current;
    const source = code;
    const selectedDialect = database;
    const view = editorViewRef.current;
    setSyntaxDiagnostics([]);
    if (view) view.dispatch(setDiagnostics(view.state, []));

    if (!source.trim()) {
      setSyntaxMessage(`Enter ${dialectInfo.label} SQL to check syntax locally.`);
      return undefined;
    }
    if (source.length > MAX_SYNTAX_CHECK_CHARS) {
      setSyntaxMessage(`Syntax check skipped above ${MAX_SYNTAX_CHECK_CHARS.toLocaleString()} characters.`);
      return undefined;
    }

    setSyntaxMessage(`Checking ${dialectInfo.label} syntax locally…`);
    const timer = window.setTimeout(async () => {
      try {
        const diagnostics = await getSqlSyntaxDiagnostics(source, selectedDialect);
        if (requestId !== syntaxRequestRef.current) return;
        setSyntaxDiagnostics(diagnostics);
        const editorView = editorViewRef.current;
        if (editorView) editorView.dispatch(setDiagnostics(editorView.state, diagnostics));
        setSyntaxMessage(diagnostics.length
          ? `${diagnostics.length} ${diagnostics.length === 1 ? 'syntax issue' : 'syntax issues'} · ${dialectInfo.label} parser`
          : `No syntax errors · ${dialectInfo.label} parser`);
      } catch (syntaxError) {
        if (requestId !== syntaxRequestRef.current) return;
        setSyntaxDiagnostics([]);
        setSyntaxMessage(`Local syntax check unavailable: ${syntaxError.message}`);
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      if (syntaxRequestRef.current === requestId) syntaxRequestRef.current += 1;
    };
  }, [code, database, dialectInfo.label, isActive]);

  const runSql = useCallback(() => {
    if (!canExecute) {
      setError(`${dialectInfo.label} syntax checking and formatting are available locally, but this playground executes SQL only with its SQLite runtime. Select SQLite to run the query.`);
      setRunMessage('Execution is available in SQLite mode only.');
      setResultSets([]);
      return;
    }
    if (!code.trim()) {
      setError('Enter a SQL statement before running the query.');
      setResultSets([]);
      setElapsedMs(null);
      return;
    }

    const worker = workerRef.current || createWorker();
    if (!engineReadyRef.current) {
      setRunMessage('The SQLite runtime is still loading. Run again when it is ready.');
      return;
    }

    const id = ++requestIdRef.current;
    activeRequestRef.current = id;
    startedAtRef.current = performance.now();
    setRunning(true);
    setError('');
    setResultSets([]);
    setElapsedMs(null);
    setRunMessage('Executing locally in SQLite…');

    timeoutRef.current = window.setTimeout(() => {
      if (activeRequestRef.current !== id) return;
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      engineReadyRef.current = false;
      activeRequestRef.current = null;
      setEngineReady(false);
      setRunning(false);
      setResultSets([]);
      setElapsedMs(null);
      setError(`Query exceeded the ${MAX_QUERY_MS / 1000}-second execution limit. The isolated runtime was restarted, so its in-memory database has been reset.`);
      setRunMessage('The runtime is reloading; run the query again when SQLite is ready.');
      createWorker();
    }, MAX_QUERY_MS);

    worker.postMessage({ type: 'run', id, sql: code });
  }, [canExecute, code, createWorker, dialectInfo.label]);

  runRef.current = runSql;

  const extensions = useMemo(() => [
    sql({
      dialect: CODEMIRROR_DIALECTS[database],
      schema: { employees: ['id', 'name', 'email', 'department', 'salary'] },
      defaultTable: 'employees',
      upperCaseKeywords: true,
    }),
    oneDark,
    EditorView.lineWrapping,
    lintGutter(),
    keymap.of([{
      key: 'Mod-Enter',
      run: () => {
        runRef.current?.();
        return true;
      },
    }]),
  ], [database]);

  const clearOutput = () => {
    setResultSets([]);
    setElapsedMs(null);
    setError('');
    setRunMessage('Output appears here after you run a statement.');
  };

  const resetDatabase = () => {
    if (!canExecute || !engineReadyRef.current || !workerRef.current) return;
    setError('');
    setResultSets([]);
    setElapsedMs(null);
    workerRef.current.postMessage({ type: 'reset' });
  };

  const loadSample = () => {
    setCode(SQL_EXAMPLES[example].code);
    setError('');
    setResultSets([]);
    setElapsedMs(null);
    setRunMessage(`${SQL_EXAMPLES[example].label} loaded. Run it to create the sample table and view the answer.`);
    if (canExecute && engineReadyRef.current && workerRef.current) workerRef.current.postMessage({ type: 'reset' });
  };

  const clearCode = () => {
    setCode('');
    clearOutput();
  };

  const resetCode = () => {
    setCode(SQL_EXAMPLES[example].code);
    clearOutput();
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError('Clipboard access is unavailable in this browser context.');
    }
  };

  const formatCurrentCode = async () => {
    try {
      const formatted = await formatSqlSource(code, database, {
        indentWidth,
        rulesText: formatRules[database],
      });
      setCode(formatted);
      setFormatMessage(`${dialectInfo.label} SQL formatted with ${indentWidth}-space indentation.`);
    } catch (formatError) {
      setFormatMessage(`Format failed: ${formatError.message}`);
    }
  };

  const changeDatabase = (nextDatabase) => {
    setDatabase(nextDatabase);
    setError('');
    setResultSets([]);
    setElapsedMs(null);
    setRunMessage(nextDatabase === 'sqlite'
      ? 'SQLite selected. Queries run locally in a temporary database.'
      : `${getSqlDialect(nextDatabase).label} selected. Local syntax checking and formatting are enabled; execution requires SQLite.`);
    setFormatMessage('');
  };

  const updateDiagnostic = (diagnostic) => {
    const view = editorViewRef.current;
    if (!view) return;
    const { from, to } = getDiagnosticSpan(diagnostic, view.state.doc.length);
    view.dispatch({ selection: { anchor: from, head: to }, scrollIntoView: true });
    view.focus();
  };

  const runtimeText = canExecute
    ? (engineReady ? runtimeMessage : runtimeMessage || 'Loading SQLite runtime…')
    : `${dialectInfo.label} selected · local syntax/format tools only`;
  const formatRuleText = formatRules[database];

  return (
    <section className="sql-workbench" aria-label="SQL editor and playground">
      <div className="sql-workbench__frame">
        <div className="sql-workbench__toolbar">
          <div className="sql-workbench__engine">
            <span className={`sql-workbench__status-dot${canExecute && engineReady ? ' is-ready' : ''}${!canExecute ? ' is-syntax-only' : ''}`} aria-hidden="true" />
            <span>{runtimeText}</span>
          </div>
          <div className="sql-workbench__actions" aria-label="SQL execution controls">
            <label className="sql-workbench__select" title="Select the SQL dialect used for highlighting, local syntax diagnostics, and formatting.">
              <span>Database</span>
              <select value={database} onChange={(event) => changeDatabase(event.target.value)} aria-label="Database dialect">
                {SQL_DIALECTS.map((dialect) => <option key={dialect.id} value={dialect.id}>{dialect.label}</option>)}
              </select>
            </label>
            <button
              type="button"
              className="sql-workbench__run"
              onClick={runSql}
              disabled={!canExecute || !engineReady || running}
              title={canExecute ? 'Run SQL locally in SQLite (Ctrl/Cmd + Enter)' : 'Only SQLite execution is available; this dialect is checked and formatted locally.'}
            >
              {running ? 'Running…' : 'Run SQL'}
            </button>
            <button type="button" onClick={resetDatabase} disabled={!canExecute || !engineReady || running} title="Clear all tables and rows">
              Reset database
            </button>
          </div>
        </div>

        <details className="sql-workbench__format">
          <summary><ChevronIcon /><span>Format rules</span><span className="sql-workbench__format-summary">{dialectInfo.label} · local formatting</span></summary>
          <div className="sql-workbench__format-body">
            <div className="sql-workbench__format-toolbar">
              <label className="sql-workbench__select" title="Indentation width used by the selected dialect formatter.">
                <span>Indent</span>
                <select value={indentWidth} onChange={(event) => { setIndentWidth(Number(event.target.value)); setFormatMessage(''); }} aria-label="SQL indentation width">
                  {[2, 3, 4].map((width) => <option key={width} value={width}>{width} spaces</option>)}
                </select>
              </label>
              <button type="button" onClick={formatCurrentCode} title={`Format using ${dialectInfo.label} rules`}>Format SQL</button>
              <button
                type="button"
                onClick={() => { setFormatRules((current) => ({ ...current, [database]: current[database].trim() ? '' : getSampleSqlFormatRules(database) })); setFormatMessage(''); }}
                title={formatRuleText.trim() ? `Clear ${dialectInfo.label} rules` : `Restore ${dialectInfo.label} sample rules`}
              >
                {formatRuleText.trim() ? 'Clear rules' : 'Sample rules'}
              </button>
            </div>
            <label className="sql-workbench__rules-label" htmlFor={`sql-format-rules-${formatRulesId}`}>Format rules for {dialectInfo.label} (JSON)</label>
            <textarea
              id={`sql-format-rules-${formatRulesId}`}
              className="sql-workbench__rules-area"
              value={formatRuleText}
              onChange={(event) => { setFormatRules((current) => ({ ...current, [database]: event.target.value })); setFormatMessage(''); }}
              spellCheck={false}
              rows={6}
              placeholder="Enter formatter options as a JSON object."
            />
            <p className="sql-workbench__format-hint">
              Rules are stored separately for each database dialect and applied locally. Supported options include <code>keywordCase</code>, <code>dataTypeCase</code>, <code>functionCase</code>, <code>identifierCase</code>, <code>linesBetweenQueries</code>, <code>logicalOperatorNewline</code>, and <code>expressionWidth</code>.
            </p>
            {formatMessage && <p className={`sql-workbench__format-message${formatMessage.startsWith('Format failed:') ? ' is-error' : ''}`} role="status">{formatMessage}</p>}
          </div>
        </details>

        <div className="sql-workbench__editor-head">
          <span className="sql-workbench__editor-title">Input</span>
          <label className="sql-workbench__example-select">
            <span>Example</span>
            <select value={example} onChange={(event) => setExample(event.target.value)} aria-label="SQL sample example">
              {Object.entries(SQL_EXAMPLES).map(([key, sample]) => <option key={key} value={key}>{sample.label}</option>)}
            </select>
          </label>
          <div className="sql-workbench__editor-tools" aria-label="SQL editor actions">
            <button type="button" className="sql-workbench__icon-button" onClick={code ? clearCode : loadSample} title={code ? 'Clear SQL text' : 'Load selected sample'} aria-label={code ? 'Clear SQL text' : 'Load selected sample'}>
              {code ? <EraseIcon /> : <SampleIcon />}
            </button>
            <button type="button" className="sql-workbench__icon-button" onClick={() => downloadTextFile('query.sql', code)} title="Download SQL" aria-label="Download SQL"><DownloadIcon /></button>
            <button type="button" className={`sql-workbench__icon-button${copied ? ' is-copied' : ''}`} onClick={copyCode} title="Copy SQL text" aria-label={copied ? 'Copied SQL text' : 'Copy SQL text'}>
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
            <button type="button" className="sql-workbench__icon-button" onClick={formatCurrentCode} title="Format SQL using the selected database rules" aria-label="Format SQL"><FormatIcon /></button>
            <button type="button" className="sql-workbench__icon-button" onClick={resetCode} title="Restore the selected sample" aria-label="Restore the selected sample"><ResetIcon /></button>
          </div>
        </div>

        <div className="sql-workbench__editor" aria-label="SQL input">
          <CodeMirror
            value={code}
            onChange={(value) => { setCode(value); if (error) setError(''); }}
            extensions={extensions}
            height="390px"
            theme={oneDark}
            onCreateEditor={(view) => { editorViewRef.current = view; }}
            basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
            aria-label={`${dialectInfo.label} SQL query editor`}
          />
        </div>

        <div className="sql-workbench__hint">
          <span className="sql-workbench__syntax-status" aria-live="polite">{syntaxMessage}</span>
          <span>{canExecute ? `SQLite ${engineVersion || ''} · in-memory execution` : 'Syntax and formatting are local; no database connection is made.'} · Run with <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd></span>
        </div>
        {syntaxDiagnostics.length > 0 && (
          <div className="sql-workbench__diagnostics" aria-label="SQL syntax diagnostics">
            {syntaxDiagnostics.map((diagnostic, index) => (
              <button key={`${diagnostic.from}-${index}`} type="button" onClick={() => updateDiagnostic(diagnostic)} title="Go to this diagnostic in the editor">
                <strong>Line {diagnostic.line}, column {diagnostic.column}:</strong> {diagnostic.message}
              </button>
            ))}
            <p>The local parser checks SQL grammar only. It does not connect to a database or validate schema objects, permissions, server version, or query results.</p>
          </div>
        )}
      </div>

      <section className="sql-workbench__output" aria-labelledby="sql-output-title">
        <div className="sql-workbench__output-head">
          <h2 id="sql-output-title">Output</h2>
          <div>
            <span role="status" aria-live="polite">{runMessage}</span>
            {elapsedMs !== null && <span className="sql-workbench__elapsed">{elapsedMs < 1 ? '<1' : Math.round(elapsedMs)} ms</span>}
          </div>
        </div>

        {error && <pre className="sql-workbench__error" role="alert">{error}</pre>}

        {resultSets.length > 0 ? resultSets.map((result, index) => (
          <div className="sql-workbench__result" key={`result-${index}`}>
            <div className="sql-workbench__result-title">
              Result set {index + 1} <span>{result.totalRows} row{result.totalRows === 1 ? '' : 's'}</span>
            </div>
            <div className="sql-workbench__table-scroll">
              <table>
                <thead><tr>{result.columns.map((column, columnIndex) => <th key={`${column}-${columnIndex}`}>{column}</th>)}</tr></thead>
                <tbody>
                  {result.rows.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`}>
                      {row.map((value, columnIndex) => <td key={`cell-${rowIndex}-${columnIndex}`}>{displayCell(value)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.truncated && <p className="sql-workbench__truncated">Showing the first {result.rows.length} rows in this result set.</p>}
          </div>
        )) : !error && !running && (
          <p className="sql-workbench__empty">Output appears here when a SQLite statement returns columns and rows.</p>
        )}
      </section>
      <p className="sql-workbench__privacy">SQLite data is temporary and held in memory. It is cleared when this page reloads or when the worker is reset after a timeout.</p>
    </section>
  );
}
