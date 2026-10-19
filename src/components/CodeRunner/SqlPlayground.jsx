import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, SQLite } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap } from '@codemirror/view';
import './SqlPlayground.css';

const SAMPLE_SQL = `-- Runs locally with SQLite (SQL.js WebAssembly).
-- Create a small dataset, add an index, then inspect the query plan.
DROP TABLE IF EXISTS employees;

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL
);

INSERT INTO employees (name, email, department, salary) VALUES
  ('Ava Chen', 'ava@example.test', 'Engineering', 118000),
  ('Noah Patel', 'noah@example.test', 'Engineering', 112000),
  ('Mia Garcia', 'mia@example.test', 'Design', 98000),
  ('Liam Brown', 'liam@example.test', 'Sales', 93000),
  ('Ivy Wilson', 'ivy@example.test', 'Engineering', 124000);

CREATE INDEX idx_employees_department_name
  ON employees (department, name);

SELECT name, department, salary
FROM employees
WHERE department = 'Engineering'
ORDER BY name;

EXPLAIN QUERY PLAN
SELECT name
FROM employees
WHERE department = 'Engineering'
ORDER BY name;
`;

const MAX_QUERY_MS = 10000;

function displayCell(value) {
  if (value === null || value === undefined) return 'NULL';
  if (value instanceof Uint8Array) {
    const bytes = Array.from(value.slice(0, 32), (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `0x${bytes}${value.length > 32 ? '…' : ''}`;
  }
  return String(value);
}

export default function SqlPlayground({ isActive = false }) {
  const [code, setCode] = useState(SAMPLE_SQL);
  const [resultSets, setResultSets] = useState([]);
  const [engineReady, setEngineReady] = useState(false);
  const [engineVersion, setEngineVersion] = useState('');
  const [runtimeMessage, setRuntimeMessage] = useState('Select SQL to load the local SQLite runtime.');
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
          setRunMessage('The SQL engine reported an error.');
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
    if (isActive) createWorker();
  }, [isActive, createWorker]);

  useEffect(() => () => {
    window.clearTimeout(timeoutRef.current);
    workerRef.current?.terminate();
    workerRef.current = null;
    engineReadyRef.current = false;
  }, []);

  const runSql = useCallback(() => {
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
    setRunMessage('Executing locally…');

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
  }, [code, createWorker]);

  runRef.current = runSql;
  const extensions = useMemo(() => [
    sql({
      dialect: SQLite,
      schema: { employees: ['id', 'name', 'email', 'department', 'salary'] },
      defaultTable: 'employees',
      upperCaseKeywords: true,
    }),
    oneDark,
    EditorView.lineWrapping,
    keymap.of([{
      key: 'Mod-Enter',
      run: () => {
        runRef.current?.();
        return true;
      },
    }]),
  ], []);

  const resetDatabase = () => {
    if (!engineReadyRef.current || !workerRef.current) return;
    setError('');
    setResultSets([]);
    setElapsedMs(null);
    workerRef.current.postMessage({ type: 'reset' });
  };

  const loadSample = () => {
    setCode(SAMPLE_SQL);
    setError('');
    setResultSets([]);
    setElapsedMs(null);
    setRunMessage('Sample loaded. Run it to create the table, add an index, and view the plan.');
    if (engineReadyRef.current && workerRef.current) workerRef.current.postMessage({ type: 'reset' });
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

  return (
    <section className="sql-workbench" aria-label="Browser SQL editor">
      <div className="sql-workbench__frame">
        <div className="sql-workbench__toolbar">
          <div className="sql-workbench__engine">
            <span className={`sql-workbench__status-dot${engineReady ? ' is-ready' : ''}`} aria-hidden="true" />
            <span>{runtimeMessage}</span>
          </div>
          <div className="sql-workbench__actions" aria-label="SQL editor controls">
            <button type="button" onClick={loadSample} title="Load the sample script">Sample</button>
            <button type="button" onClick={() => { setCode(''); setResultSets([]); setError(''); setRunMessage('Editor cleared.'); }} title="Clear SQL text">Clear</button>
            <button type="button" onClick={copyCode} title="Copy SQL text">{copied ? 'Copied' : 'Copy'}</button>
            <button type="button" className="sql-workbench__run" onClick={runSql} disabled={!engineReady || running}>
              {running ? 'Running…' : 'Run SQL'}
            </button>
            <button type="button" onClick={resetDatabase} disabled={!engineReady || running} title="Clear all tables and rows">Reset database</button>
          </div>
        </div>

        <div className="sql-workbench__editor" aria-label="SQL input">
          <CodeMirror
            value={code}
            onChange={setCode}
            extensions={extensions}
            height="390px"
            theme={oneDark}
            basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
            aria-label="SQL query editor"
          />
        </div>

        <div className="sql-workbench__hint">
          <span>SQLite dialect · SQL runs in this browser, not on a remote database</span>
          <span>Run with <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd></span>
        </div>
      </div>

      <section className="sql-workbench__output" aria-labelledby="sql-output-title">
        <div className="sql-workbench__output-head">
          <h2 id="sql-output-title">Results</h2>
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
          <p className="sql-workbench__empty">Output appears here when a statement returns columns and rows.</p>
        )}
      </section>
      <p className="sql-workbench__privacy">The database is temporary and in memory. It is cleared when this page reloads or when the worker is reset after a timeout.</p>
    </section>
  );
}
