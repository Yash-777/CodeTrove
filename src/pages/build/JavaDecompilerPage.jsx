import ToolBackLink from '../../components/ToolBackLink.jsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StreamLanguage } from '@codemirror/language';
import { java } from '@codemirror/legacy-modes/mode/clike';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { Check, ChevronRight, Copy, Download, FileArchive, FileCode2, FolderOpen, LoaderCircle, RotateCcw } from 'lucide-react';
import { zipSync, strToU8 } from 'fflate';
import { copyToClipboard } from '../../utils/textActions.js';
import { MAX_ARCHIVE_BYTES, MAX_CLASS_BYTES, safeJavaSourcePath } from '../../utils/javaDecompiler.js';
import '../../components/CodeRunner/RunnableCode.css';
import './CompilerPage.css';
import './JavaDecompilerPage.css';

const JAVA_MODE = StreamLanguage.define(java);
const MAX_SELECTED_CLASSES = 500;
const SAMPLE_OPTIONS = [
  { value: 'java8', label: 'Java 8 · class · List and string concatenation', path: 'examples/java-decompiler/java8/Java8Sample.class', filename: 'Java8Sample.class' },
  { value: 'java11', label: 'Java 11 · class · List.of and static methods', path: 'examples/java-decompiler/java11/Java11Sample.class', filename: 'Java11Sample.class' },
  { value: 'java17', label: 'Java 17 · class · record and pattern matching', path: 'examples/java-decompiler/java17/Java17Sample.class', filename: 'Java17Sample.class' },
  { value: 'java21', label: 'Java 21 · class · pattern switch', path: 'examples/java-decompiler/java21/Java21Sample.class', filename: 'Java21Sample.class' },
  { value: 'jar', label: 'Mixed Java 8 / 11 / 17 / 21 · sample JAR', path: 'examples/java-decompiler/java-samples.jar', filename: 'java-samples.jar' },
];

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

function filenameToJavaPath(name) {
  return safeJavaSourcePath(String(name || 'Decompiled.class').split(/[\\/]/).pop());
}

function makeDistinctResults(results) {
  const counts = new Map();
  return results.map((item, index) => {
    let path = safeJavaSourcePath(item.path);
    const count = (counts.get(path.toLowerCase()) || 0) + 1;
    counts.set(path.toLowerCase(), count);
    if (count > 1) path = path.replace(/\.java$/i, `-${count}.java`);
    if (!path) path = `Decompiled-${index + 1}.java`;
    return { ...item, path };
  });
}

function getVersionSummary(results) {
  return [...new Set(results.map((item) => item.javaVersion))].join(', ');
}

function CopySourceButton({ source, disabled }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    const success = await copyToClipboard(source);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return (
    <button type="button" className={`runnable-code__icon-button${copied ? ' is-copied' : ''}`} onClick={onCopy} disabled={disabled} title={copied ? 'Copied' : 'Copy Java source'} aria-label={copied ? 'Copied to clipboard' : 'Copy Java source'}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}

function buildSourceTree(results) {
  const root = { folders: new Map(), files: [] };
  results.forEach((item) => {
    const parts = item.path.split('/').filter(Boolean);
    const filename = parts.pop() || item.path;
    let folder = root;
    parts.forEach((part) => {
      if (!folder.folders.has(part)) folder.folders.set(part, { folders: new Map(), files: [] });
      folder = folder.folders.get(part);
    });
    folder.files.push({ ...item, filename });
  });
  return root;
}

function SourceTreeNode({ node, selectedPath, onSelect }) {
  const folders = [...node.folders.entries()];
  return (
    <>
      {folders.map(([name, child]) => (
        <li className="jd-tree__folder" key={name}>
          <details open>
            <summary><ChevronRight size={13} /><FolderOpen size={14} /><span>{name}</span></summary>
            <ul><SourceTreeNode node={child} selectedPath={selectedPath} onSelect={onSelect} /></ul>
          </details>
        </li>
      ))}
      {node.files.map((item) => (
        <li key={item.path}>
          <button type="button" className={`jd-tree__file${selectedPath === item.path ? ' is-active' : ''}`} onClick={() => onSelect(item.path)} aria-current={selectedPath === item.path ? 'page' : undefined} title={`${item.path} · ${item.javaVersion}`}>
            <FileCode2 size={14} /><span>{item.filename}</span><small>{item.javaVersion.replace('Java ', 'J')}</small>
          </button>
        </li>
      ))}
    </>
  );
}

function SourceTree({ results, selectedPath, onSelect }) {
  const tree = useMemo(() => buildSourceTree(results), [results]);
  return (
    <nav className="jd-tree" aria-label="Decompiled source files">
      <div className="jd-tree__heading"><FolderOpen size={15} /> Decompiled files <span>{results.length}</span></div>
      <ul className="jd-tree__list"><SourceTreeNode node={tree} selectedPath={selectedPath} onSelect={onSelect} /></ul>
    </nav>
  );
}

export default function JavaDecompilerPage() {
  const fileInputRef = useRef(null);
  const workerRef = useRef(null);
  const requestIdRef = useRef(0);
  const [sampleKey, setSampleKey] = useState('');
  const [engine, setEngine] = useState('jsd');
  const [inputLabel, setInputLabel] = useState('No file selected');
  const [results, setResults] = useState([]);
  const [selectedPath, setSelectedPath] = useState('');
  const [errors, setErrors] = useState([]);
  const [status, setStatus] = useState({ type: 'idle', message: 'Choose a Java class or JAR, or load a sample.' });
  const [progress, setProgress] = useState(null);

  const selectedResult = useMemo(() => results.find((item) => item.path === selectedPath) || results[0] || null, [results, selectedPath]);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const resetResult = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    requestIdRef.current += 1;
    setResults([]);
    setSelectedPath('');
    setErrors([]);
    setProgress(null);
    setStatus({ type: 'idle', message: 'Choose a Java class or JAR, or load a sample.' });
    return requestIdRef.current;
  };

  const runBuffers = (items, archive = null, label = 'Local input') => {
    resetResult();
    setInputLabel(label);
    setStatus({ type: 'loading', message: 'Starting the local Java decompiler…' });
    const id = requestIdRef.current;
    const worker = new Worker(new URL('../../workers/javaDecompiler.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (event) => {
      const message = event.data || {};
      if (message.id !== id) return;
      if (message.type === 'progress') {
        setProgress({ completed: message.completed, total: message.total });
        setStatus({ type: 'loading', message: `Decompiling class ${message.completed} of ${message.total} locally…` });
      } else if (message.type === 'result') {
        const nextResults = makeDistinctResults(message.results || []);
        setResults(nextResults);
        setSelectedPath(nextResults[0]?.path || '');
        setErrors(message.errors || []);
        setProgress(null);
        setStatus({
          type: message.errors?.length ? 'warning' : 'success',
          message: `${nextResults.length} class${nextResults.length === 1 ? '' : 'es'} decompiled · ${getVersionSummary(nextResults)} · processed in this browser.`,
        });
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
      } else if (message.type === 'error') {
        setProgress(null);
        setStatus({ type: 'error', message: message.message || 'The decompiler could not read this input.' });
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
      }
    };
    worker.onerror = (event) => {
      if (requestIdRef.current !== id) return;
      setProgress(null);
      setStatus({ type: 'error', message: event.message || 'The local decompiler worker stopped unexpectedly.' });
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
    const transfer = [];
    const files = items.map(({ name, bytes }) => {
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      transfer.push(buffer);
      return { name, bytes: buffer };
    });
    let archiveBuffer = null;
    if (archive) {
      archiveBuffer = archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength);
      transfer.push(archiveBuffer);
    }
    worker.postMessage({ type: 'decompile', id, files, archive: archiveBuffer }, transfer);
  };

  const readSelectedFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const selectionId = resetResult();
    const jars = files.filter((file) => file.name.toLowerCase().endsWith('.jar'));
    const classes = files.filter((file) => file.name.toLowerCase().endsWith('.class'));
    if (jars.length + classes.length !== files.length || (jars.length && (jars.length > 1 || classes.length))) {
      setStatus({ type: 'error', message: 'Choose one .jar archive or one or more .class files at a time.' });
      return;
    }
    if (classes.length > MAX_SELECTED_CLASSES) {
      setStatus({ type: 'error', message: `Choose no more than ${MAX_SELECTED_CLASSES} class files at a time.` });
      return;
    }
    const maxSize = jars.length ? MAX_ARCHIVE_BYTES : MAX_CLASS_BYTES;
    const tooLarge = files.find((file) => file.size > maxSize);
    if (tooLarge) {
      setStatus({ type: 'error', message: `${tooLarge.name} is larger than the ${maxSize / (1024 * 1024)} MB limit.` });
      return;
    }
    try {
      setInputLabel(files.length === 1 ? files[0].name : `${files.length} class files`);
      setStatus({ type: 'loading', message: 'Reading selected files in this browser…' });
      if (jars.length) {
        const bytes = new Uint8Array(await jars[0].arrayBuffer());
        if (requestIdRef.current !== selectionId) return;
        runBuffers([], bytes, jars[0].name);
      } else {
        const items = await Promise.all(classes.map(async (file) => ({ name: filenameToJavaPath(file.name).replace(/\.java$/i, '.class'), bytes: new Uint8Array(await file.arrayBuffer()) })));
        if (requestIdRef.current !== selectionId) return;
        runBuffers(items, null, files.length === 1 ? files[0].name : `${files.length} class files`);
      }
    } catch (error) {
      if (requestIdRef.current !== selectionId) return;
      setProgress(null);
      setStatus({ type: 'error', message: error?.message || 'Could not read the selected files.' });
    } finally {
      if (requestIdRef.current === selectionId && fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const loadSample = async () => {
    const sample = SAMPLE_OPTIONS.find((option) => option.value === sampleKey);
    if (!sample) {
      setStatus({ type: 'error', message: 'Select a Java-version sample first.' });
      return;
    }
    const selectionId = resetResult();
    setInputLabel(sample.filename);
    setStatus({ type: 'loading', message: `Loading the ${sample.label} from CodeTrove’s bundled sample files…` });
    try {
      const url = `${import.meta.env.BASE_URL}${sample.path}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not load bundled sample (${response.status}).`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (requestIdRef.current !== selectionId) return;
      if (sample.value === 'jar') runBuffers([], bytes, sample.filename);
      else runBuffers([{ name: sample.filename, bytes }], null, sample.filename);
    } catch (error) {
      if (requestIdRef.current !== selectionId) return;
      setProgress(null);
      setStatus({ type: 'error', message: error?.message || 'Could not load this sample.' });
    }
  };

  const downloadSource = () => {
    if (!selectedResult) return;
    downloadBlob(new Blob([selectedResult.source], { type: 'text/x-java-source;charset=utf-8' }), selectedResult.path.split('/').pop());
  };

  const downloadAll = () => {
    if (!results.length) return;
    const files = Object.fromEntries(results.map((item) => [item.path, strToU8(item.source)]));
    const archive = zipSync(files, { level: 6 });
    downloadBlob(new Blob([archive], { type: 'application/zip' }), `${inputLabel.replace(/\.(jar|class)$/i, '') || 'decompiled-sources'}-sources.zip`);
  };

  return (
    <div className="java-decompiler-page">
      <ToolBackLink />
      <header className="java-decompiler-page__heading">
        <div>
          <p className="java-decompiler-page__eyebrow">Java tools</p>
          <h1>Java Decompiler</h1>
          <p>Inspect compiled Java bytecode as readable source. Open a <code>.class</code> file or browse a <code>.jar</code> locally.</p>
        </div>
        <div className="java-decompiler-page__privacy"><span aria-hidden="true">●</span> Runs locally · files are not uploaded</div>
      </header>

      <section className="jd-workspace" aria-label="Java decompiler workspace">
        <div className="jd-toolbar">
          <div className="jd-toolbar__left">
            <input ref={fileInputRef} className="jd-file-input" type="file" accept=".class,.jar" multiple aria-label="Choose Java class or JAR files" onChange={(event) => readSelectedFiles(event.target.files)} />
            <button type="button" className="runnable-code__button" onClick={() => fileInputRef.current?.click()}><FolderOpen size={15} /> Open .class / .jar</button>
            <label className="jd-select-label">Sample
              <select value={sampleKey} onChange={(event) => setSampleKey(event.target.value)} aria-label="Java version sample">
                <option value="">Choose a Java version</option>
                {SAMPLE_OPTIONS.map((sample) => <option key={sample.value} value={sample.value}>{sample.label}</option>)}
              </select>
            </label>
            <button type="button" className="runnable-code__button" onClick={loadSample} disabled={!sampleKey}>Load sample</button>
          </div>
          <div className="jd-toolbar__right">
            <label className="jd-select-label">Decompiler
              <select value={engine} onChange={(event) => setEngine(event.target.value)} aria-label="Select decompiler engine">
                <option value="jsd">JSD · browser · Java through 25</option>
                <optgroup label="Open-source desktop engines · not run in browser">
                  <option value="cfr" disabled>CFR · Java runtime</option>
                  <option value="vineflower" disabled>Vineflower · Java runtime</option>
                  <option value="procyon" disabled>Procyon / Luyten · desktop</option>
                </optgroup>
              </select>
            </label>
            <button type="button" className="runnable-code__button" onClick={resetResult} disabled={!results.length && !errors.length && status.type === 'idle'} title="Clear current result"><RotateCcw size={15} /> Clear</button>
          </div>
        </div>

        <div className="jd-input-summary">
          <div className="jd-input-summary__name"><FileArchive size={16} /><strong>{inputLabel}</strong></div>
          <span>Choose files from your device. Processing happens in a separate browser worker.</span>
        </div>

        <div className="jd-results">
          <aside className="jd-results__sidebar">
            {results.length ? <SourceTree results={results} selectedPath={selectedResult?.path} onSelect={setSelectedPath} /> : (
              <div className="jd-empty-tree"><FileCode2 size={24} /><strong>No decompiled files yet</strong><span>Open a class/JAR or choose one of the Java-version samples.</span></div>
            )}
            {errors.length > 0 && <div className="jd-file-errors" role="status"><strong>Skipped files ({errors.length})</strong>{errors.map((error) => <p key={`${error.path}:${error.message}`}><code>{error.path}</code>: {error.message}</p>)}</div>}
          </aside>

          <section className="jd-source" aria-label="Decompiled Java source">
            <div className="jd-source__bar">
              <div className="jd-source__filename"><FileCode2 size={15} /><span>{selectedResult?.path || 'Decompiled source'}</span>{selectedResult && <small>{selectedResult.javaVersion}</small>}</div>
              <div className="runnable-code__actions">
                <CopySourceButton source={selectedResult?.source || ''} disabled={!selectedResult} />
                <button type="button" className="runnable-code__icon-button" onClick={downloadSource} disabled={!selectedResult} title="Download this Java source" aria-label="Download this Java source"><Download size={16} /></button>
                <button type="button" className="runnable-code__button" onClick={downloadAll} disabled={!results.length} title="Download every decompiled source as a ZIP"><Download size={15} /> Download sources ZIP</button>
              </div>
            </div>
            {selectedResult ? (
              <CodeMirror value={selectedResult.source} theme={oneDark} extensions={[JAVA_MODE]} readOnly height="min(64vh, 680px)" basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: false }} aria-label={`Decompiled source: ${selectedResult.path}`} />
            ) : <pre className="jd-source__empty">Decompiled Java source appears here.</pre>}
          </section>
        </div>

        <div className={`jd-status jd-status--${status.type}`} role="status" aria-live="polite">
          {status.type === 'loading' && <LoaderCircle size={15} className="jd-status__spinner" />}
          {progress && <span className="jd-status__progress">{progress.completed}/{progress.total}</span>}
          <span>{status.message}</span>
        </div>
        <p className="jd-local-note"><strong>Privacy:</strong> selected files are read and processed in this browser tab. CodeTrove does not upload the class or JAR bytes to a decompiler service.</p>
      </section>

      <section className="jd-about" aria-labelledby="jd-about-heading">
        <h2 id="jd-about-heading">About Java decompilation</h2>
        <p>A Java compiler turns source code into JVM bytecode stored in <code>.class</code> files. A JAR is a ZIP-based package that can contain many class files and resources. A decompiler analyzes accessible bytecode and reconstructs a Java-like source view; it cannot guarantee the original formatting, comments, or local variable names will be recovered.</p>
        <h3>Java-version samples</h3>
        <p>The bundled samples cover Java 8, Java 11, Java 17 records and pattern matching, and Java 21 pattern switches. The mixed-version sample JAR lets you browse several source files together. These are compiled fixtures, not prewritten output, so they exercise class-file reading and decompilation in the tool.</p>
        <h3>Protected or obfuscated files</h3>
        <p>Some applications use obfuscation, packed or encrypted class payloads, licensing checks, or runtime-only keys. A normal Java decompiler can inspect only class bytes that are available in readable class-file form. If code is encrypted or transformed until runtime, the JAR may still run through its intended loader but may not contain ordinary decompilable classes. This tool does not discover keys, decrypt protected payloads, bypass access controls, or remove licensing restrictions.</p>
        <h3>Open-source engine</h3>
        <p>The selected engine is <a href="https://github.com/jar-analyzer/jsd" target="_blank" rel="noreferrer">JSD</a>, an MIT-licensed JavaScript decompiler that runs locally and documents support through Java 25. It is the only engine enabled in this browser-only tool. Other open-source tools such as <a href="https://github.com/leibnitz27/cfr" target="_blank" rel="noreferrer">CFR</a> and <a href="https://github.com/Vineflower/vineflower" target="_blank" rel="noreferrer">Vineflower</a> require a JVM and are shown as desktop-only choices, not remotely called services. For a desktop GUI, see <a href="https://github.com/deathmarine/Luyten" target="_blank" rel="noreferrer">Luyten</a>, an open-source GUI for Procyon. Results vary by compiler, obfuscation, debug metadata, and bytecode features.</p>
      </section>
    </div>
  );
}
