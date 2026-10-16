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

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { parse as parseJavaScript } from 'acorn';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { StreamLanguage } from '@codemirror/language';
import { c, cpp, java, kotlin } from '@codemirror/legacy-modes/mode/clike';
import { python } from '@codemirror/legacy-modes/mode/python';
import { linter, lintGutter, setDiagnostics } from '@codemirror/lint';
import { compileTypeScript, formatDiagnostic, preloadTypeScript } from '../../utils/tsCompiler.js';
import { DEFAULT_KOTLIN_TARGET, getKotlinVersions, highlightKotlin, runKotlin } from '../../utils/kotlinApi.js';
import { DEFAULT_JAVA_API, JAVA_APIS, getJavaRuntimes, pickDefaultRuntime, runJava } from '../../utils/javaApi.js';
import { getNativeRuntimes, isNativeLanguage, pickNativeRuntime, runNative } from '../../utils/judge0Api.js';
import { formatSource, getSampleFormatRules } from '../../utils/codeFormatter.js';
import { getLocalSyntaxDiagnostics } from '../../utils/localSyntaxDiagnostics.js';
import './RunnableCode.css';

/** File name shown in the header, used by Save and in error messages. */
export const FILE_NAMES = { javascript: 'index.js', typescript: 'index.ts', kotlin: 'Main.kt', java: 'Main.java', c: 'main.c', cpp: 'main.cpp', python: 'main.py' };
const LANGUAGE_LABELS = { javascript: 'JavaScript', typescript: 'TypeScript', kotlin: 'Kotlin', java: 'Java', c: 'C', cpp: 'C++', python: 'Python' };
const LANGUAGE_BADGES = { javascript: 'JS', typescript: 'TS', kotlin: 'KT', java: 'JV', c: 'C', cpp: 'C++', python: 'PY' };

const TIMEOUT_MS = 10000;
const JAVA_TIMEOUT_MS = 30000;

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
const FormatIcon = () => (<svg {...iconProps}><path d="m15 4 5 5" /><path d="M4 20 14.5 9.5" /><path d="m13 6 5 5" /><path d="M7 3v4M5 5h4M19 15v4M17 17h4" /></svg>);
const ResetIcon = () => (<svg {...iconProps}><path d="M3 11a9 9 0 1 1 2.6 6.4" /><path d="M3 4v7h7" /></svg>);
const ClearIcon = () => (<svg {...iconProps}><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="m5 7 1 14h12l1-14" /><path d="M9 7V4h6v3" /></svg>);
const SampleIcon = () => (<svg {...iconProps}><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>);

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
  versionSamples = null,
  isActive = true,
}) {
  const isTs = language === 'typescript';
  const isKotlin = language === 'kotlin';
  const isJava = language === 'java';
  const isNative = isNativeLanguage(language);
  const label = LANGUAGE_LABELS[language] || 'JavaScript';
  const displayName = fileName || FILE_NAMES[language] || 'index.js';
  const isPlayground = variant === 'playground';

  const [code, setCode] = useState(initial);
  const [confType, setConfType] = useState(DEFAULT_KOTLIN_TARGET);
  const [jsVersion, setJsVersion] = useState('es6');
  const [tsTarget, setTsTarget] = useState('ES2020');
  const [kotlinVersions, setKotlinVersions] = useState([]);
  const [kotlinVersion, setKotlinVersion] = useState('');
  const [indentWidth, setIndentWidth] = useState(2);
  const [formatRules, setFormatRules] = useState(getSampleFormatRules);
  const [formatMessage, setFormatMessage] = useState('');
  const [javaApi, setJavaApi] = useState(DEFAULT_JAVA_API);
  const [runtimes, setRuntimes] = useState([]);
  const [runtimeId, setRuntimeId] = useState('');
  const [loadedRuntimeKey, setLoadedRuntimeKey] = useState('');
  const confTypeRef = useRef(confType);
  confTypeRef.current = confType;
  const [input, setInput] = useState(initialInput);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | running | done | timeout
  const [stats, setStats] = useState({ time: null, memory: null });
  const [execution, setExecution] = useState({ key: 0, document: null });
  const [copied, setCopied] = useState({ code: false, output: false });
  const frameRef = useRef(null);
  const formatRulesId = useId();
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

    if (isNative) {
      // Compile + run C, C++, or Python remotely through Judge0.
      const controller = new AbortController();
      abortRef.current = controller;
      timeoutRef.current = setTimeout(() => controller.abort('timeout'), JAVA_TIMEOUT_MS);
      try {
        const compiler = runtimeId || pickNativeRuntime(await getNativeRuntimes(language));
        const { lines, diagnostics } = await runNative(code, controller.signal, { language, compiler, stdin: inputRef.current });
        if (activeRunRef.current !== myRun) return;
        clearTimeout(timeoutRef.current);
        const view = editorViewRef.current;
        if (view) {
          const docLength = view.state.doc.length;
          view.dispatch(setDiagnostics(view.state, diagnostics.map((d) => ({
            from: Math.min(d.from, docLength),
            to: Math.min(Math.max(d.to, d.from + 1), docLength),
            severity: d.severity,
            message: d.message,
            source: language,
          }))));
        }
        finishWithoutRun(lines);
      } catch (error) {
        if (activeRunRef.current !== myRun) return;
        clearTimeout(timeoutRef.current);
        const timedOut = controller.signal.aborted;
        finishWithoutRun([{
          type: 'error',
          text: timedOut
            ? `Timed out after ${JAVA_TIMEOUT_MS / 1000}s waiting for the ${label} service.`
            : `Could not reach the ${label} Judge0 service. Check your internet connection and try again. (${error.message})`,
        }]);
        if (timedOut) setStatus('timeout');
      }
      return;
    }

    if (isJava) {
      // Compile + run remotely with the selected provider and JDK.
      const controller = new AbortController();
      abortRef.current = controller;
      timeoutRef.current = setTimeout(() => controller.abort('timeout'), JAVA_TIMEOUT_MS);
      try {
        const compiler = runtimeId || pickDefaultRuntime(await getJavaRuntimes(javaApi));
        const { lines, diagnostics } = await runJava(code, controller.signal, { stdin: inputRef.current, compiler, api: javaApi });
        if (activeRunRef.current !== myRun) return;
        clearTimeout(timeoutRef.current);
        const view = editorViewRef.current;
        if (view) {
          const docLength = view.state.doc.length;
          view.dispatch(setDiagnostics(view.state, diagnostics.map((d) => ({
            from: Math.min(d.from, docLength),
            to: Math.min(Math.max(d.to, d.from + 1), docLength),
            severity: d.severity,
            message: d.message,
            source: 'javac',
          }))));
        }
        finishWithoutRun(lines);
      } catch (error) {
        if (activeRunRef.current !== myRun) return;
        clearTimeout(timeoutRef.current);
        const timedOut = controller.signal.aborted;
        finishWithoutRun([{
          type: 'error',
          text: timedOut
            ? `Timed out after ${JAVA_TIMEOUT_MS / 1000}s waiting for the Java service.`
            : `Could not reach the Java service (${JAVA_APIS[javaApi].server}). Check your internet connection and try again. (${error.message})`,
        }]);
        if (timedOut) setStatus('timeout');
      }
      return;
    }

    if (isKotlin) {
      // Compile + run remotely (JetBrains' compiler service).
      const controller = new AbortController();
      abortRef.current = controller;
      timeoutRef.current = setTimeout(() => controller.abort('timeout'), KOTLIN_TIMEOUT_MS);
      try {
        const { lines, diagnostics } = await runKotlin(code, controller.signal, { args: inputRef.current.trim(), displayName, confType, version: kotlinVersion });
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
        const { diagnostics, js } = await compileTypeScript(code, { target: tsTarget });
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
  }, [code, isTs, isKotlin, isJava, isNative, language, label, displayName, stopCode, confType, runtimeId, javaApi, tsTarget, kotlinVersion]);

  const resetCode = () => {
    stopCode('idle');
    setCode(language === 'javascript' ? (versionSamples?.[jsVersion] || initial) : initial);
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

  const clearOrSampleCode = () => {
    stopCode('idle');
    setCode(code ? '' : (language === 'javascript' ? (versionSamples?.[jsVersion] || initial) : initial));
    setLogs([]);
    setStats({ time: null, memory: null });
  };

  const flashCopied = (key) => {
    setCopied((current) => ({ ...current, [key]: true }));
    setTimeout(() => setCopied((current) => ({ ...current, [key]: false })), 1500);
  };

  const copyCode = async () => { if (await copyToClipboard(code)) flashCopied('code'); };
  const copyOutput = async () => { if (await copyToClipboard(logs.map((entry) => entry.text).join('\n'))) flashCopied('output'); };

  const formatCurrentCode = async () => {
    try {
      const formatted = await formatSource(language, code, { indentWidth, rulesText: formatRules });
      setCode(formatted);
      setFormatMessage(`${label} formatted with ${indentWidth}-space indentation.`);
    } catch (error) {
      setFormatMessage(`Format failed: ${error.message}`);
    }
  };

  const changeJavaScriptVersion = (next) => {
    const oldSample = versionSamples?.[jsVersion];
    if (oldSample && (code === oldSample || code === initial)) setCode(versionSamples[next] || code);
    setJsVersion(next);
  };

  const extensions = useMemo(() => {
    const list = [
      isJava ? StreamLanguage.define(java)
        : language === 'c' ? StreamLanguage.define(c)
        : language === 'cpp' ? StreamLanguage.define(cpp)
        : language === 'python' ? StreamLanguage.define(python)
        : isKotlin ? StreamLanguage.define(kotlin) : javascript({ typescript: isTs }),
      // Ctrl/Cmd + Enter runs the snippet from inside the editor.
      Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => { document.dispatchEvent(new CustomEvent('codetrove:run-focused')); return true; } }])),
    ];
    if (isActive && language === 'javascript') {
      list.push(
        linter((view) => {
          try {
            parseJavaScript(view.state.doc.toString(), {
              ecmaVersion: jsVersion === 'es5' ? 5 : 6,
              sourceType: 'script',
              allowReturnOutsideFunction: true,
            });
            return [];
          } catch (error) {
            const from = Math.min(error.pos ?? 0, view.state.doc.length);
            return [{
              from,
              to: Math.min(from + 1, view.state.doc.length),
              severity: 'error',
              message: `${jsVersion === 'es5' ? 'ES5' : 'ES6'}: ${error.message}`,
              source: 'Acorn',
            }];
          }
        }, { delay: 350 }),
        lintGutter()
      );
    }
    if (isActive && isTs) {
      // Red squiggles + gutter markers from the real TypeScript compiler.
      list.push(
        linter(
          async (view) => {
            try {
              const { diagnostics } = await compileTypeScript(view.state.doc.toString(), { target: tsTarget });
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
    if (isActive && (isJava || ['c', 'cpp', 'python'].includes(language))) {
      // Tree-sitter parses locally in the browser: no source is sent to Judge0
      // or Wandbox while typing. Run still performs full compiler/type checks.
      list.push(
        linter(async (view) => {
          const source = view.state.doc.toString();
          if (!source.trim() || source.length > 50000) return [];
          try { return await getLocalSyntaxDiagnostics(language, source); }
          catch { return []; }
        }, { delay: 500 }),
        lintGutter()
      );
    }
    if (isActive && isKotlin) {
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
              const diagnostics = await highlightKotlin(source, undefined, confTypeRef.current, kotlinVersion);
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
  }, [isActive, isTs, isKotlin, isJava, isNative, initial, language, jsVersion, tsTarget, kotlinVersion]);

  // Java/C/C++/Python: load runtime versions offered by the selected provider.
  useEffect(() => {
    if (!isActive || (!isJava && !isNative)) return undefined;
    const requestedRuntimeKey = `${language}:${javaApi}`;
    if (loadedRuntimeKey === requestedRuntimeKey) return undefined;
    let cancelled = false;
    setRuntimes([]);
    setRuntimeId('');
    const runtimePromise = isNative ? getNativeRuntimes(language) : getJavaRuntimes(javaApi);
    runtimePromise.then((list) => {
      if (cancelled) return;
      setRuntimes(list);
      setRuntimeId((current) => current || (isNative ? pickNativeRuntime(list) : pickDefaultRuntime(list)));
      setLoadedRuntimeKey(requestedRuntimeKey);
    });
    return () => { cancelled = true; };
  }, [isActive, isJava, isNative, javaApi, language, loadedRuntimeKey]);

  useEffect(() => {
    if (!isActive) return;
    if (isTs) preloadTypeScript().catch(() => {});
    if (isKotlin && kotlinVersions.length === 0) {
      getKotlinVersions().then((versions) => {
        setKotlinVersions(versions);
        setKotlinVersion((current) => current || versions[0] || '');
      });
    }
  }, [isActive, isTs, isKotlin, kotlinVersions.length]);

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
    : isJava || isNative
    ? 'Optional input fed to the program through standard input.'
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
          {isPlayground && language === 'javascript' && (
            <label className="runnable-code__target" title="Choose the ECMAScript syntax version and matching prototype/class sample.">
              <span>Version</span>
              <select value={jsVersion} onChange={(event) => changeJavaScriptVersion(event.target.value)} disabled={isRunning} aria-label="JavaScript language version">
                <option value="es5">ES5 · Prototype</option>
                <option value="es6">ES6 · Class</option>
              </select>
            </label>
          )}
          {isPlayground && isTs && (
            <label className="runnable-code__target" title="JavaScript target used by TypeScript checking and transpilation.">
              <span>Version</span>
              <select value={tsTarget} onChange={(event) => setTsTarget(event.target.value)} disabled={isRunning} aria-label="TypeScript JavaScript target version">
                <option value="ES5">ES5</option>
                <option value="ES2015">ES2015</option>
                <option value="ES2020">ES2020</option>
              </select>
            </label>
          )}
          {isJava && (
            <label className="runnable-code__target" title="Java execution API. Wandbox is the default; Judge0 can be public or self-hosted.">
              <span>API</span>
              <select value={javaApi} onChange={(event) => setJavaApi(event.target.value)} disabled={status === 'running'} aria-label="Java execution API">
                {Object.values(JAVA_APIS).map((api) => <option key={api.id} value={api.id}>{api.label}</option>)}
              </select>
            </label>
          )}
          {isJava && (
            <label className="runnable-code__target" title={`JDK used by ${JAVA_APIS[javaApi].label} (sent as the provider's runtime identifier)`}>
              <span>Version</span>
              <select value={runtimeId} onChange={(event) => setRuntimeId(event.target.value)} disabled={status === 'running' || runtimes.length === 0} aria-label="Java runtime version">
                {runtimes.length === 0 && <option value="">Loading…</option>}
                {runtimes.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </label>
          )}
          {isNative && (
            <label className="runnable-code__target" title={`${label} runtime provided by Judge0 CE. The selected language ID is sent with the submission.`}>
              <span>Version</span>
              <select value={runtimeId} onChange={(event) => setRuntimeId(event.target.value)} disabled={status === 'running' || runtimes.length === 0} aria-label={`${label} runtime version`}>
                {runtimes.length === 0 && <option value="">Loading…</option>}
                {runtimes.map((runtime) => <option key={runtime.id} value={runtime.id}>{runtime.label}</option>)}
              </select>
            </label>
          )}
          {isKotlin && targets && (
            <label className="runnable-code__target" title={targets.find((t) => t.confType === confType)?.hint}>
              <span>Target</span>
              <select value={confType} onChange={(event) => changeTarget(event.target.value)} disabled={status === 'running'} aria-label="Kotlin compile target (confType)">
                {targets.map((t) => <option key={t.confType} value={t.confType}>{t.label}</option>)}
              </select>
            </label>
          )}
          {isPlayground && isKotlin && (
            <label className="runnable-code__target" title="Compiler versions are discovered from the Kotlin Playground compiler service.">
              <span>Version</span>
              <select value={kotlinVersion} onChange={(event) => setKotlinVersion(event.target.value)} disabled={isRunning || kotlinVersions.length === 0} aria-label="Kotlin compiler version">
                {kotlinVersions.length === 0 && <option value="">Loading…</option>}
                {kotlinVersions.map((version) => <option key={version} value={version}>{version}</option>)}
              </select>
            </label>
          )}
          <button type="button" className={`runnable-code__icon-button${copied.code ? ' is-copied' : ''}`} onClick={copyCode} title="Copy to clipboard" aria-label={copied.code ? "Copied to clipboard" : "Copy code"}>
            {copied.code ? <CheckIcon /> : <CopyIcon />}
          </button>
          <button type="button" className="runnable-code__icon-button" onClick={() => downloadTextFile(displayName, code)} title={`Save as ${displayName}`} aria-label={`Save as ${displayName}`}>
            <SaveIcon />
          </button>
          {isPlayground && <button type="button" className="runnable-code__button" onClick={formatCurrentCode} title="Format code using the selected language and rules">Format</button>}
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

      {isPlayground && (
        <details className="runnable-code__format">
          <summary><ChevronIcon /><span>Format rules</span><span className="runnable-code__format-summary">Language-aware, local formatting</span></summary>
          <div className="runnable-code__format-body">
            <div className="runnable-code__format-toolbar">
              <label className="runnable-code__target" title="Indentation width used by the formatter.">
                <span>Indent</span>
                <select value={indentWidth} onChange={(event) => { setIndentWidth(Number(event.target.value)); setFormatMessage(''); }} aria-label="Indent width">
                  {[2, 3, 4].map((width) => <option key={width} value={width}>{width} spaces</option>)}
                </select>
              </label>
              <button type="button" className="runnable-code__button" onClick={formatCurrentCode} title="Format the editor using these rules">Format code</button>
              <button type="button" className="runnable-code__button" onClick={() => { setFormatRules((current) => current.trim() ? '' : getSampleFormatRules()); setFormatMessage(''); }} title={formatRules.trim() ? 'Clear custom rules' : 'Restore the sample rules'}>
                {formatRules.trim() ? 'Clear rules' : 'Sample rules'}
              </button>
            </div>
            <label className="runnable-code__rules-label" htmlFor={`format-rules-${formatRulesId}`}>Format rules (JSON)</label>
            <textarea
              id={`format-rules-${formatRulesId}`}
              className="runnable-code__rules-area"
              value={formatRules}
              onChange={(event) => { setFormatRules(event.target.value); setFormatMessage(''); }}
              spellCheck={false}
              rows={5}
              placeholder="Enter formatter options as a JSON object."
            />
            <p className="runnable-code__format-hint">{language === 'kotlin' ? 'Kotlin formatting currently normalizes existing block indentation; it does not rewrite expressions or line breaks.' : <>Rules are applied locally. Common options: <code>singleQuote</code>, <code>semi</code>, <code>printWidth</code>, <code>clangStyle</code>, and <code>pythonQuoteStyle</code>.</>}</p>
            {formatMessage && <p className={`runnable-code__format-message${formatMessage.startsWith('Format failed:') ? ' is-error' : ''}`} role="status">{formatMessage}</p>}
          </div>
        </details>
      )}

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
          {isPlayground && (
            <div className="runnable-code__editor-head">
              <span className="runnable-code__editor-title">Input</span>
              <div className="runnable-code__editor-tools">
                <button type="button" className="runnable-code__icon-button" onClick={clearOrSampleCode} title={code ? 'Clear code' : 'Load sample code'} aria-label={code ? 'Clear code' : 'Load sample code'}>
                  {code ? <ClearIcon /> : <SampleIcon />}
                </button>
                <button type="button" className="runnable-code__icon-button" onClick={() => downloadTextFile(displayName, code)} title={`Download ${displayName}`} aria-label={`Download ${displayName}`}><SaveIcon /></button>
                <button type="button" className={`runnable-code__icon-button${copied.code ? ' is-copied' : ''}`} onClick={copyCode} title="Copy input code" aria-label={copied.code ? 'Copied input code' : 'Copy input code'}>{copied.code ? <CheckIcon /> : <CopyIcon />}</button>
                <button type="button" className="runnable-code__icon-button" onClick={formatCurrentCode} title="Format input code" aria-label="Format input code"><FormatIcon /></button>
                <button type="button" className="runnable-code__icon-button" onClick={resetCode} title="Reset code to sample" aria-label="Reset code to sample"><ResetIcon /></button>
              </div>
            </div>
          )}
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
              {timeText && <span className="runnable-code__stat" title={isKotlin || isJava ? 'Round trip, including compilation on the remote service' : 'Execution time of your code'}>Time: {timeText}</span>}
              {memoryText && <span className="runnable-code__stat" title="Peak JavaScript heap while the code ran (Chromium browsers)">Memory: {memoryText}</span>}
            </div>
            <button
              type="button"
              className={`runnable-code__icon-button${copied.output ? ' is-copied' : ''}`}
              onClick={copyOutput}
              disabled={logs.length === 0}
              title="Copy to clipboard"
              aria-label={copied.output ? "Copied to clipboard" : "Copy output"}
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
          {isJava && <div className="runnable-code__footer">Compiled and run by {JAVA_APIS[javaApi].label} · {JAVA_APIS[javaApi].description}</div>}
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
