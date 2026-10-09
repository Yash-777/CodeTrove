import { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import ts from 'typescript';
import { oneDark } from '@codemirror/theme-one-dark';
import './RunnableCode.css';

function buildDocument(code, id) {
  // Escape '<' so user code cannot terminate the generated script element.
  const serializedCode = JSON.stringify(code).replace(/</g, '\\u003c');
  const serializedId = JSON.stringify(id);

  return `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
(() => {
  const id = ${serializedId};
  const send = (type, text) => parent.postMessage({ source: 'codetrove-runner', id, type, text }, '*');
  const format = (value) => {
    if (typeof value === 'string') return value;
    try { return value !== null && typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value); }
    catch { return String(value); }
  };
  ['log', 'info', 'warn', 'error'].forEach((level) => {
    console[level] = (...args) => send(level, args.map(format).join(' '));
  });
  window.addEventListener('error', (event) => send('error', event.message || 'Unknown runtime error'));
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    send('error', 'Unhandled promise rejection: ' + (reason && reason.message ? reason.message : format(reason)));
  });
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  (async () => {
    try { await new AsyncFunction(${serializedCode})(); }
    catch (error) { send('error', (error.name || 'Error') + ': ' + error.message); }
  })();
})();
<\/script></body></html>`;
}

/** Editable JavaScript playground whose code executes in a sandboxed iframe. */
export default function RunnableCode({ initial = '', language = 'javascript' }) {
  const [code, setCode] = useState(initial);
  const [logs, setLogs] = useState([]);
  const [execution, setExecution] = useState({ key: 0, document: null });
  const frameRef = useRef(null);
  const instanceId = useRef(`runner-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    const onMessage = (event) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.source !== 'codetrove-runner' || event.data?.id !== instanceId) return;
      if (!['log', 'info', 'warn', 'error'].includes(event.data.type)) return;
      setLogs((current) => [...current, { type: event.data.type, text: String(event.data.text ?? '') }]);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [instanceId]);

  const runCode = () => {
    setLogs([]);
    let executableCode = code;

    if (language === 'typescript') {
      try {
        const result = ts.transpileModule(code, {
          reportDiagnostics: true,
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.None,
            strict: true,
          },
        });
        const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
        if (errors.length > 0) {
          setLogs(errors.map((diagnostic) => ({
            type: 'error',
            text: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
          })));
          stopCode();
          return;
        }
        executableCode = result.outputText;
      } catch (error) {
        setLogs([{ type: 'error', text: `TypeScript transpilation failed: ${error.message}` }]);
        stopCode();
        return;
      }
    }

    setExecution((current) => ({ key: current.key + 1, document: buildDocument(executableCode, instanceId) }));
  };

  const stopCode = () => setExecution((current) => ({ ...current, document: null }));
  const resetCode = () => {
    setCode(initial);
    setLogs([]);
    stopCode();
  };

  return (
    <section className="runnable-code" aria-label={`Runnable ${language === 'typescript' ? 'TypeScript' : 'JavaScript'} example`}>
      <div className="runnable-code__editor">
        <CodeMirror
          value={code}
          extensions={[javascript({ typescript: language === 'typescript' })]}
          theme={oneDark}
          onChange={setCode}
          basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
          aria-label={`${language === 'typescript' ? 'TypeScript' : 'JavaScript'} code editor`}
        />
      </div>
      <div className="runnable-code__toolbar">
        <button type="button" className="runnable-code__button runnable-code__button--run" onClick={runCode}>▶ Run</button>
        <button type="button" className="runnable-code__button" onClick={stopCode}>■ Stop</button>
        <button type="button" className="runnable-code__button" onClick={resetCode}>Reset</button>
      </div>
      <div className="runnable-code__output" aria-live="polite">
        <div className="runnable-code__output-title">Output</div>
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
          title={`${language === 'typescript' ? 'TypeScript' : 'JavaScript'} execution sandbox`}
          sandbox="allow-scripts"
          srcDoc={execution.document}
          className="runnable-code__frame"
        />
      )}
    </section>
  );
}
