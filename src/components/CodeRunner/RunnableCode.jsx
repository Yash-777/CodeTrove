/**
 * src/components/CodeRunner/RunnableCode.jsx
 * ------------------------------------------------------------------
 * Editable + runnable code box used by ```js runnable / ```ts runnable
 * blocks in Markdown pages.
 *
 * - Editor: CodeMirror 6.
 * - JavaScript: runs inside a sandboxed iframe (no allow-same-origin, so
 *   no access to the app's cookies/storage) that hosts a Web Worker. Stop,
 *   or the 10 s timeout, removes the iframe and terminates the worker, so
 *   `while (true) {}` cannot freeze the page.
 * - TypeScript: type-checked with the real `typescript` compiler (lazy
 *   loaded, see utils/tsCompiler.js). Errors are underlined in the editor
 *   as you type (@codemirror/lint) and Run prints
 *   `main.ts(2,1): error TS2322: ...` instead of executing code that does
 *   not compile.
 *
 * Limitation: code runs in a worker, so there is no DOM (`document`/`window`).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { linter, lintGutter } from '@codemirror/lint';
import { compileTypeScript, formatDiagnostic, preloadTypeScript } from '../../utils/tsCompiler.js';
import './RunnableCode.css';

const TIMEOUT_MS = 10000;

/* Code that runs INSIDE the worker. Kept as a function so it is
   syntax-checked/linted like normal code, then stringified. */
function workerMain() {
  const post = (type, text) => self.postMessage({ type, text });

  const format = (value) => {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
    if (typeof value === 'symbol' || typeof value === 'bigint') return String(value);
    if (value !== null && typeof value === 'object') {
      const seen = new WeakSet();
      try {
        return JSON.stringify(
          value,
          (key, val) => {
            if (typeof val === 'bigint') return `${val}n`;
            if (val instanceof Map) return { 'Map': Array.from(val.entries()) };
            if (val instanceof Set) return { 'Set': Array.from(val.values()) };
            if (val !== null && typeof val === 'object') {
              if (seen.has(val)) return '[Circular]';
              seen.add(val);
            }
            return val;
          },
          2
        );
      } catch (e) {
        return String(value);
      }
    }
    return String(value);
  };

  ['log', 'info', 'warn', 'error'].forEach((level) => {
    console[level] = (...args) => post(level, args.map(format).join(' '));
  });

  self.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    post('error', `Uncaught (in promise) ${reason && reason.message ? `${reason.name}: ${reason.message}` : format(reason)}`);
  });

  // Track timers so "done" is only reported once the snippet's
  // setTimeout callbacks have fired (event-loop demos rely on this).
  const nativeSetTimeout = self.setTimeout.bind(self);
  const nativeClearTimeout = self.clearTimeout.bind(self);
  const nativeSetInterval = self.setInterval.bind(self);
  const nativeClearInterval = self.clearInterval.bind(self);
  const pending = new Set();
  let bodyFinished = false;
  let doneSent = false;

  const maybeDone = () => {
    if (!bodyFinished || doneSent || pending.size > 0) return;
    // One extra macrotask lets promise continuations flush first.
    nativeSetTimeout(() => {
      if (pending.size === 0 && !doneSent) {
        doneSent = true;
        post('done', '');
      }
    }, 0);
  };

  self.setTimeout = (fn, delay, ...args) => {
    const id = nativeSetTimeout(() => {
      pending.delete(id);
      try {
        if (typeof fn === 'function') fn(...args);
      } catch (error) {
        post('error', `Uncaught ${error && error.name ? error.name : 'Error'}: ${error && error.message ? error.message : error}`);
      }
      maybeDone();
    }, delay);
    pending.add(id);
    return id;
  };
  self.clearTimeout = (id) => { pending.delete(id); nativeClearTimeout(id); maybeDone(); };
  self.setInterval = (fn, delay, ...args) => {
    const id = nativeSetInterval(() => {
      try {
        if (typeof fn === 'function') fn(...args);
      } catch (error) {
        post('error', `Uncaught ${error && error.name ? error.name : 'Error'}: ${error && error.message ? error.message : error}`);
      }
    }, delay);
    pending.add(id);
    return id;
  };
  self.clearInterval = (id) => { pending.delete(id); nativeClearInterval(id); maybeDone(); };

  self.onmessage = async (event) => {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    try {
      await new AsyncFunction(event.data)();
    } catch (error) {
      post('error', `${error && error.name ? error.name : 'Error'}: ${error && error.message ? error.message : error}`);
    }
    bodyFinished = true;
    maybeDone();
  };
}

const WORKER_SOURCE = `(${workerMain.toString()})();`;

/* Document loaded into the sandboxed iframe: spawns the worker, relays
   its messages to the parent page, and reports when it goes quiet. */
function buildRunnerDocument(code, runId) {
  const payload = JSON.stringify({ code, runId, workerSource: WORKER_SOURCE }).replace(/</g, '\\u003c');
  return `<!doctype html><html><body><script>
(function () {
  var cfg = ${payload};
  var blob = new Blob([cfg.workerSource], { type: 'text/javascript' });
  var worker = new Worker(URL.createObjectURL(blob));
  function relay(type, text) { parent.postMessage({ source: 'codetrove-runner', runId: cfg.runId, type: type, text: text }, '*'); }
  worker.onmessage = function (e) {
    if (e.data.type === 'done') { relay('finished', ''); return; }
    relay(e.data.type, e.data.text);
  };
  worker.onerror = function (e) { relay('error', (e.message || 'Worker error')); relay('finished', ''); };
  worker.postMessage(cfg.code);
})();
<\/script></body></html>`;
}

let runCounter = 0;

/** Editable playground whose code executes in a sandboxed iframe + worker. */
export default function RunnableCode({ initial = '', language = 'javascript' }) {
  const isTs = language === 'typescript';
  const label = isTs ? 'TypeScript' : 'JavaScript';
  const [code, setCode] = useState(initial);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | running | done | timeout
  const [elapsed, setElapsed] = useState(null);
  const [execution, setExecution] = useState({ key: 0, document: null });
  const frameRef = useRef(null);
  const rootRef = useRef(null);
  const activeRunRef = useRef(0);
  const timeoutRef = useRef(null);
  const startedAtRef = useRef(0);

  const stopCode = useCallback((nextStatus = 'idle') => {
    clearTimeout(timeoutRef.current);
    if (nextStatus === 'idle') activeRunRef.current = 0; // also cancels a pending TypeScript compile
    setExecution((current) => ({ ...current, document: null })); // removing the iframe terminates the worker
    setStatus(nextStatus);
  }, []);

  useEffect(() => {
    const onMessage = (event) => {
      const data = event.data;
      if (!data || data.source !== 'codetrove-runner') return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (data.runId !== activeRunRef.current) return;

      if (data.type === 'finished') {
        setElapsed(Math.round(performance.now() - startedAtRef.current));
        stopCode('done');
        return;
      }
      if (!['log', 'info', 'warn', 'error'].includes(data.type)) return;
      setLogs((current) => [...current, { type: data.type, text: String(data.text ?? '') }]);
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timeoutRef.current);
    };
  }, [stopCode]);

  const runCode = useCallback(async () => {
    clearTimeout(timeoutRef.current);
    runCounter += 1;
    const myRun = runCounter;
    activeRunRef.current = myRun;
    startedAtRef.current = performance.now();
    setElapsed(null);
    setLogs([]);
    setStatus('running');
    setExecution((current) => ({ ...current, document: null }));

    let executableCode = code;
    if (isTs) {
      // Type-check first. Like tsc / the TS playgrounds, code that does not
      // compile is NOT executed - the compiler errors are the output.
      try {
        const { diagnostics, js } = await compileTypeScript(code);
        if (activeRunRef.current !== myRun) return; // stopped or re-run meanwhile
        if (diagnostics.length > 0) {
          setLogs(diagnostics.map((d) => ({ type: 'error', text: formatDiagnostic(d) })));
          setElapsed(Math.round(performance.now() - startedAtRef.current));
          setStatus('done');
          return;
        }
        executableCode = js;
      } catch (error) {
        if (activeRunRef.current !== myRun) return;
        setLogs([{ type: 'error', text: `Could not load the TypeScript compiler: ${error.message}` }]);
        setStatus('done');
        return;
      }
    }

    setExecution((current) => ({ key: current.key + 1, document: buildRunnerDocument(executableCode, myRun) }));
    timeoutRef.current = setTimeout(() => {
      setLogs((current) => [...current, { type: 'error', text: `Timed out after ${TIMEOUT_MS / 1000}s - execution stopped (possible infinite loop).` }]);
      stopCode('timeout');
    }, TIMEOUT_MS);
  }, [code, isTs, stopCode]);

  const resetCode = () => {
    stopCode('idle');
    setCode(initial);
    setLogs([]);
    setElapsed(null);
  };

  const extensions = useMemo(() => {
    const list = [
      javascript({ typescript: isTs }),
      // Ctrl/Cmd + Enter runs the snippet from inside the editor.
      Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => { document.dispatchEvent(new CustomEvent('codetrove:run-focused')); return true; } }])),
    ];
    if (isTs) {
      // Red squiggles + gutter markers from the real TypeScript compiler.
      list.push(
        linter(
          async (view) => {
            try {
              const { diagnostics } = await compileTypeScript(view.state.doc.toString());
              const docLength = view.state.doc.length;
              return diagnostics.map((d) => ({
                from: Math.min(d.from, docLength),
                to: Math.min(Math.max(d.to, d.from + 1), docLength),
                severity: 'error',
                message: `TS${d.code}: ${d.message}`,
                source: 'TypeScript',
              }));
            } catch {
              return [];
            }
          },
          { delay: 500 }
        ),
        lintGutter()
      );
    }
    return list;
  }, [isTs]);

  useEffect(() => {
    if (isTs) preloadTypeScript().catch(() => {});
  }, [isTs]);

  // Only the box that owns keyboard focus reacts to Ctrl/Cmd + Enter.
  useEffect(() => {
    const handler = () => {
      if (rootRef.current && rootRef.current.contains(document.activeElement)) runCode();
    };
    document.addEventListener('codetrove:run-focused', handler);
    return () => document.removeEventListener('codetrove:run-focused', handler);
  }, [runCode]);

  const isRunning = status === 'running';

  return (
    <section className="runnable-code" ref={rootRef} aria-label={`Runnable ${label} example`}>
      <div className="runnable-code__editor">
        <CodeMirror
          value={code}
          extensions={extensions}
          theme={oneDark}
          onChange={setCode}
          basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
          aria-label={`${label} code editor`}
        />
      </div>
      <div className="runnable-code__toolbar">
        <button type="button" className="runnable-code__button runnable-code__button--run" onClick={runCode} title="Run (Ctrl/Cmd + Enter)">▶ Run</button>
        <button type="button" className="runnable-code__button" onClick={() => stopCode('idle')} disabled={!isRunning}>■ Stop</button>
        <button type="button" className="runnable-code__button" onClick={resetCode}>Reset</button>
      </div>
      <div className="runnable-code__output" aria-live="polite">
        <div className="runnable-code__output-title">
          Output
          {isRunning && <span className="runnable-code__meta"> · running…</span>}
          {status === 'done' && elapsed !== null && <span className="runnable-code__meta"> · finished in {elapsed} ms</span>}
        </div>
        {logs.length === 0 ? (
          <div className="runnable-code__placeholder">Output appears here…</div>
        ) : logs.map((entry, index) => (
          <div key={`${index}-${entry.type}`} className={`runnable-code__log runnable-code__log--${entry.type}`}>{entry.text}</div>
        ))}
      </div>
      {execution.document !== null && (
        <iframe
          key={execution.key}
          ref={frameRef}
          title={`${label} execution sandbox`}
          sandbox="allow-scripts"
          srcDoc={execution.document}
          className="runnable-code__frame"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
    </section>
  );
}
