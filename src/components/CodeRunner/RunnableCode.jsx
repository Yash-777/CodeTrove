/**
 * src/components/CodeRunner/RunnableCode.jsx
 * ------------------------------------------------------------------
 * Editable + runnable code box used by ```js runnable / ```ts runnable /
 * ```kotlin runnable blocks in Markdown pages and by the online compiler
 * page (/build/compiler, variant="playground").
 *
 * Every box has:
 *   - a header with the file name on the left (index.js / index.ts /
 *     Main.kt) and Copy, Save (download), Reset and Run on the right;
 *   - a collapsible input section (<details>): STDIN for JS/TS (read with
 *     readLine() / prompt()), program arguments for Kotlin;
 *   - an output panel with Copy output, time taken and (when the browser
 *     exposes it) memory used.
 * The Run button shows "Running..." while the code executes.
 *
 * Execution
 * - JavaScript/TypeScript: sandboxed iframe (no allow-same-origin, so no
 *   access to the app's cookies/storage) hosting a Web Worker. Stop, or the
 *   10 s timeout, removes the iframe and terminates the worker, so
 *   `while (true) {}` cannot freeze the page. TypeScript is type-checked
 *   first with the real compiler (utils/tsCompiler.js); errors are underlined
 *   while typing and printed as `index.ts(2,1): error TS2322: ...`.
 * - Kotlin: compiled by JetBrains' public service (api.kotlinlang.org, the
 *   backend of play.kotlinlang.org - utils/kotlinApi.js). Needs internet.
 *
 * Limitation: JS/TS code runs in a worker, so there is no DOM
 * (`document`/`window`).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { StreamLanguage } from '@codemirror/language';
import { kotlin } from '@codemirror/legacy-modes/mode/clike';
import { linter, lintGutter, setDiagnostics } from '@codemirror/lint';
import { compileTypeScript, formatDiagnostic, preloadTypeScript } from '../../utils/tsCompiler.js';
import { DEFAULT_KOTLIN_TARGET, getKotlinVersion, highlightKotlin, runKotlin } from '../../utils/kotlinApi.js';
import './RunnableCode.css';

/** File name shown in the header, used by Save and in error messages. */
export const FILE_NAMES = { javascript: 'index.js', typescript: 'index.ts', kotlin: 'Main.kt' };
const LANGUAGE_LABELS = { javascript: 'JavaScript', typescript: 'TypeScript', kotlin: 'Kotlin' };
const LANGUAGE_BADGES = { javascript: 'JS', typescript: 'TS', kotlin: 'KT' };

const TIMEOUT_MS = 10000;

/* Code that runs INSIDE the worker. Kept as a function so it is
   syntax-checked/linted like normal code, then stringified. */
function workerMain() {
  // Peak JS heap seen while the snippet ran (Chromium only: performance.memory).
  let peakMemory = 0;
  const sampleMemory = () => {
    try {
      if (self.performance && self.performance.memory) {
        peakMemory = Math.max(peakMemory, self.performance.memory.usedJSHeapSize);
      }
    } catch (e) { /* not supported in this browser */ }
  };
  const post = (type, text) => { sampleMemory(); self.postMessage({ type, text }); };
  let startedAt = 0;

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
        sampleMemory();
        self.postMessage({ type: 'done', time: self.performance.now() - startedAt, memory: peakMemory || null });
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
    const { code, stdin } = event.data;
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

    // stdin: one value per line, read with readLine() (or prompt()).
    const inputLines = stdin ? String(stdin).replace(/\r\n/g, '\n').split('\n') : [];
    self.readLine = () => (inputLines.length > 0 ? inputLines.shift() : null);
    self.prompt = () => self.readLine();

    startedAt = self.performance.now();
    sampleMemory();
    try {
      await new AsyncFunction(code)();
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
function buildRunnerDocument(code, runId, stdin = '') {
  const payload = JSON.stringify({ code, stdin, runId, workerSource: WORKER_SOURCE }).replace(/</g, '\\u003c');
  return `<!doctype html><html><body><script>
(function () {
  var cfg = ${payload};
  var blob = new Blob([cfg.workerSource], { type: 'text/javascript' });
  var worker = new Worker(URL.createObjectURL(blob));
  function relay(type, text, stats) { parent.postMessage({ source: 'codetrove-runner', runId: cfg.runId, type: type, text: text, time: stats && stats.time, memory: stats && stats.memory }, '*'); }
  worker.onmessage = function (e) {
    if (e.data.type === 'done') { relay('finished', '', e.data); return; }
    relay(e.data.type, e.data.text);
  };
  worker.onerror = function (e) { relay('error', (e.message || 'Worker error')); relay('finished', ''); };
  worker.postMessage({ code: cfg.code, stdin: cfg.stdin });
})();
<\/script></body></html>`;
}

let runCounter = 0;
const KOTLIN_TIMEOUT_MS = 30000;

/* ---- small inline icons (no icon dependency) ---- */
const iconProps = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const CopyIcon = () => (<svg {...iconProps}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>);
const CheckIcon = () => (<svg {...iconProps}><path d="M20 6 9 17l-5-5" /></svg>);
const SaveIcon = () => (<svg {...iconProps}><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" /></svg>);
const ChevronIcon = () => (<svg {...iconProps} width="14" height="14"><path d="m6 9 6 6 6-6" /></svg>);

function formatMemory(bytes) {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatTime(ms) {
  if (ms === null || ms === undefined) return null;
  if (ms < 1) return '<1 ms';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts / older browsers.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    document.body.removeChild(area);
    return ok;
  }
}

function downloadTextFile(fileName, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Editable playground whose code executes in a sandboxed iframe + worker
 * (JS/TS) or on JetBrains' compiler service (Kotlin).
 *
 * Props: initial (source), initialInput (stdin / arguments), language
 * ('javascript' | 'typescript' | 'kotlin'), variant ('inline' | 'playground'),
 * fileName (override the default file name), targets (Kotlin only: dropdown of
 * [{ confType, label, hint, code }] - the selected confType is sent in the
 * request payload, and `code` is the sample swapped in while the editor still
 * holds the previous target's untouched sample).
 */
export default function RunnableCode({
  initial = '',
  initialInput = '',
  language = 'javascript',
  variant = 'inline',
  fileName,
  targets = null,
}) {
  const isTs = language === 'typescript';
  const isKotlin = language === 'kotlin';
  const label = LANGUAGE_LABELS[language] || 'JavaScript';
  const displayName = fileName || FILE_NAMES[language] || 'index.js';
  const isPlayground = variant === 'playground';

  const [code, setCode] = useState(initial);
  const [confType, setConfType] = useState(DEFAULT_KOTLIN_TARGET);
  const confTypeRef = useRef(confType);
  confTypeRef.current = confType;
  const [input, setInput] = useState(initialInput);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | running | done | timeout
  const [stats, setStats] = useState({ time: null, memory: null });
  const [execution, setExecution] = useState({ key: 0, document: null });
  const [copied, setCopied] = useState({ code: false, output: false });
  const frameRef = useRef(null);
  const rootRef = useRef(null);
  const activeRunRef = useRef(0);
  const timeoutRef = useRef(null);
  const startedAtRef = useRef(0);
  const abortRef = useRef(null);
  const editorViewRef = useRef(null);
  const inputRef = useRef(initialInput);
  inputRef.current = input;

  const stopCode = useCallback((nextStatus = 'idle') => {
    clearTimeout(timeoutRef.current);
    abortRef.current?.abort(); // cancels a pending Kotlin request
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
        setStats({
          time: typeof data.time === 'number' ? data.time : performance.now() - startedAtRef.current,
          memory: typeof data.memory === 'number' ? data.memory : null,
        });
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
    setStats({ time: null, memory: null });
    setLogs([]);
    setStatus('running');
    setExecution((current) => ({ ...current, document: null }));
    const finishWithoutRun = (lines) => {
      setLogs(lines);
      setStats({ time: performance.now() - startedAtRef.current, memory: null });
      setStatus('done');
    };

    if (isKotlin) {
      // Compile + run remotely (JetBrains' compiler service).
      const controller = new AbortController();
      abortRef.current = controller;
      timeoutRef.current = setTimeout(() => controller.abort('timeout'), KOTLIN_TIMEOUT_MS);
      try {
        const { lines, diagnostics } = await runKotlin(code, controller.signal, { args: inputRef.current.trim(), displayName, confType });
        if (activeRunRef.current !== myRun) return;
        clearTimeout(timeoutRef.current);
        // Underline the same problems the compiler reported for this Run.
        const view = editorViewRef.current;
        if (view) {
          const docLength = view.state.doc.length;
          view.dispatch(setDiagnostics(view.state, diagnostics.map((d) => ({
            from: Math.min(d.from, docLength),
            to: Math.min(Math.max(d.to, d.from + 1), docLength),
            severity: d.severity,
            message: d.message,
            source: 'Kotlin',
          }))));
        }
        finishWithoutRun(lines);
      } catch (error) {
        if (activeRunRef.current !== myRun) return; // stopped or re-run meanwhile
        clearTimeout(timeoutRef.current);
        const timedOut = controller.signal.aborted;
        finishWithoutRun([{
          type: 'error',
          text: timedOut
            ? `Timed out after ${KOTLIN_TIMEOUT_MS / 1000}s waiting for the Kotlin compiler service.`
            : `Could not reach the Kotlin compiler service (api.kotlinlang.org). Check your internet connection and try again. (${error.message})`,
        }]);
        if (timedOut) setStatus('timeout');
      }
      return;
    }

    let executableCode = code;
    if (isTs) {
      // Type-check first. Like tsc / the TS playgrounds, code that does not
      // compile is NOT executed - the compiler errors are the output.
      try {
        const { diagnostics, js } = await compileTypeScript(code);
        if (activeRunRef.current !== myRun) return; // stopped or re-run meanwhile
        if (diagnostics.length > 0) {
          finishWithoutRun(diagnostics.map((d) => ({ type: 'error', text: formatDiagnostic(d, displayName) })));
          return;
        }
        executableCode = js;
      } catch (error) {
        if (activeRunRef.current !== myRun) return;
        finishWithoutRun([{ type: 'error', text: `Could not load the TypeScript compiler: ${error.message}` }]);
        return;
      }
    }

    setExecution((current) => ({ key: current.key + 1, document: buildRunnerDocument(executableCode, myRun, inputRef.current) }));
    timeoutRef.current = setTimeout(() => {
      setLogs((current) => [...current, { type: 'error', text: `Timed out after ${TIMEOUT_MS / 1000}s - execution stopped (possible infinite loop).` }]);
      setStats({ time: performance.now() - startedAtRef.current, memory: null });
      stopCode('timeout');
    }, TIMEOUT_MS);
  }, [code, isTs, isKotlin, displayName, stopCode, confType]);

  const resetCode = () => {
    stopCode('idle');
    setCode(initial);
    setInput(initialInput);
    setLogs([]);
    setStats({ time: null, memory: null });
  };

  const eraseCode = () => {
    stopCode('idle');
    setCode('');
    setLogs([]);
    setStats({ time: null, memory: null });
  };

  const flashCopied = (key) => {
    setCopied((current) => ({ ...current, [key]: true }));
    setTimeout(() => setCopied((current) => ({ ...current, [key]: false })), 1500);
  };

  const copyCode = async () => { if (await copyToClipboard(code)) flashCopied('code'); };
  const copyOutput = async () => { if (await copyToClipboard(logs.map((entry) => entry.text).join('\n'))) flashCopied('output'); };

  const extensions = useMemo(() => {
    const list = [
      isKotlin ? StreamLanguage.define(kotlin) : javascript({ typescript: isTs }),
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
    if (isKotlin) {
      // Underline compiler errors/warnings as you type (service-side analysis).
      list.push(
        linter(
          async (view) => {
            const source = view.state.doc.toString();
            // Do not analyse the untouched sample: a page can hold many Kotlin
            // boxes and each request goes to JetBrains' free public service.
            // Diagnostics for an unedited box appear when you press Run.
            if (source === initial || !source.trim() || source.length > 20000) return [];
            try {
              const diagnostics = await highlightKotlin(source, undefined, confTypeRef.current);
              const docLength = view.state.doc.length;
              return diagnostics.map((d) => ({
                from: Math.min(d.from, docLength),
                to: Math.min(Math.max(d.to, d.from + 1), docLength),
                severity: d.severity,
                message: d.message,
                source: 'Kotlin',
              }));
            } catch {
              return []; // offline: editing still works, Run reports the problem
            }
          },
          { delay: 1000 }
        ),
        lintGutter()
      );
    }
    return list;
  }, [isTs, isKotlin, initial]);

  useEffect(() => {
    if (isTs) preloadTypeScript().catch(() => {});
    if (isKotlin) getKotlinVersion();
  }, [isTs, isKotlin]);

  // Only the box that owns keyboard focus reacts to Ctrl/Cmd + Enter.
  useEffect(() => {
    const handler = () => {
      if (rootRef.current && rootRef.current.contains(document.activeElement)) runCode();
    };
    document.addEventListener('codetrove:run-focused', handler);
    return () => document.removeEventListener('codetrove:run-focused', handler);
  }, [runCode]);

  // Switching target swaps in that target's sample unless you already edited the code.
  const changeTarget = (next) => {
    const from = targets?.find((t) => t.confType === confType);
    const to = targets?.find((t) => t.confType === next);
    if (from && to && code === from.code) setCode(to.code);
    setConfType(next);
    setLogs([]);
  };

  const isRunning = status === 'running';
  const timeText = formatTime(stats.time);
  const memoryText = formatMemory(stats.memory);
  const inputLineCount = input === '' ? 0 : input.split('\n').length;
  const inputTitle = isKotlin ? 'Arguments' : 'STDIN';
  const inputHelp = isKotlin
    ? 'Optional program arguments passed to main(args) - separated by spaces.'
    : 'Optional input fed to the program - one value per line, read with readLine() or prompt().';

  return (
    <section
      className={`runnable-code${isPlayground ? ' runnable-code--playground' : ''}`}
      ref={rootRef}
      aria-label={`Runnable ${label} example`}
    >
      <div className="runnable-code__header">
        <span className="runnable-code__file" title={`${label} file`}>
          <span className={`runnable-code__badge runnable-code__badge--${language}`}>{LANGUAGE_BADGES[language] || 'JS'}</span>
          <span className="runnable-code__file-name">{displayName}</span>
        </span>
        <div className="runnable-code__actions">
          {isKotlin && targets && (
            <label className="runnable-code__target" title={targets.find((t) => t.confType === confType)?.hint}>
              <span>Target</span>
              <select value={confType} onChange={(event) => changeTarget(event.target.value)} disabled={status === 'running'} aria-label="Kotlin compile target (confType)">
                {targets.map((t) => <option key={t.confType} value={t.confType}>{t.label}</option>)}
              </select>
            </label>
          )}
          <button type="button" className="runnable-code__icon-button" onClick={copyCode} title="Copy code" aria-label="Copy code">
            {copied.code ? <CheckIcon /> : <CopyIcon />}
          </button>
          <button type="button" className="runnable-code__icon-button" onClick={() => downloadTextFile(displayName, code)} title={`Save as ${displayName}`} aria-label={`Save as ${displayName}`}>
            <SaveIcon />
          </button>
          <button type="button" className="runnable-code__button" onClick={resetCode} title="Restore the original example">Reset</button>
          {isPlayground && <button type="button" className="runnable-code__button" onClick={eraseCode} title="Clear the editor">Erase</button>}
          {isRunning && <button type="button" className="runnable-code__button runnable-code__button--stop" onClick={() => stopCode('idle')}>■ Stop</button>}
          <button
            type="button"
            className={`runnable-code__button runnable-code__button--run${isRunning ? ' is-running' : ''}`}
            onClick={runCode}
            disabled={isRunning}
            title="Run (Ctrl/Cmd + Enter)"
          >
            {isRunning ? (<><span className="runnable-code__spinner" aria-hidden="true" />Running…</>) : '▶ Run'}
          </button>
        </div>
      </div>

      <details className="runnable-code__input" open={isPlayground && initialInput !== ''}>
        <summary>
          <ChevronIcon />
          <span className="runnable-code__input-title">{inputTitle}</span>
          <span className="runnable-code__input-help">{inputHelp}</span>
          <span className="runnable-code__count">{inputLineCount} {inputLineCount === 1 ? 'line' : 'lines'}</span>
        </summary>
        <textarea
          className="runnable-code__input-area"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={3}
          spellCheck={false}
          placeholder={isKotlin ? 'e.g. Kotlin 2026' : 'e.g.\nAlice\n30'}
          aria-label={isKotlin ? 'Program arguments' : 'Standard input'}
        />
      </details>

      <div className="runnable-code__body">
        <div className="runnable-code__editor">
          <CodeMirror
            value={code}
            extensions={extensions}
            theme={oneDark}
            onChange={setCode}
            onCreateEditor={(view) => { editorViewRef.current = view; }}
            height={isPlayground ? '420px' : undefined}
            basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
            aria-label={`${label} code editor`}
          />
        </div>

        <div className="runnable-code__output" aria-live="polite">
          <div className="runnable-code__output-head">
            <div className="runnable-code__output-title">
              Output
              {isRunning && <span className="runnable-code__meta"> · running…</span>}
            </div>
            <div className="runnable-code__stats">
              {timeText && <span className="runnable-code__stat" title={isKotlin ? 'Round trip, including compilation on the Kotlin service' : 'Execution time of your code'}>Time: {timeText}</span>}
              {memoryText && <span className="runnable-code__stat" title="Peak JavaScript heap while the code ran (Chromium browsers)">Memory: {memoryText}</span>}
            </div>
            <button
              type="button"
              className="runnable-code__icon-button"
              onClick={copyOutput}
              disabled={logs.length === 0}
              title="Copy output"
              aria-label="Copy output"
            >
              {copied.output ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
          <div className="runnable-code__logs">
            {logs.length === 0 ? (
              <div className="runnable-code__placeholder">{isRunning ? 'Running…' : 'Output appears here…'}</div>
            ) : logs.map((entry, index) => (
              <div key={`${index}-${entry.type}`} className={`runnable-code__log runnable-code__log--${entry.type}`}>{entry.text}</div>
            ))}
          </div>
          {isKotlin && <div className="runnable-code__footer">Compiled by JetBrains · api.kotlinlang.org</div>}
        </div>
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
