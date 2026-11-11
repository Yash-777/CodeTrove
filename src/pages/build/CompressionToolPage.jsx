import ToolBackLink from '../../components/ToolBackLink.jsx';
import { useMemo, useRef, useState } from 'react';
import { Check, Clipboard, Download, FileArchive, FileText, Info, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { copyToClipboard } from '../../utils/textActions.js';
import {
  COMPRESSION_ALGORITHMS,
  COMPRESSION_LEVELS,
  SAMPLE_TEXT,
  base64ToBytes,
  bytesToBase64,
  bytesToText,
  compressBytes,
  compressionRatio,
  decompressBytes,
  formatBytes,
  textToBytes,
} from '../../utils/compressionTool.js';
import './CompressionToolPage.css';

const SAMPLE_FILENAME = 'codetrove-compression-sample.txt';

function downloadBytes(bytes, filename, type = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function CopyButton({ value, label = 'Copy output' }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!value) return;
    if (await copyToClipboard(value)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  };
  return <button type="button" className="compression-tool__icon-button" onClick={copy} disabled={!value} title={copied ? 'Copied' : label} aria-label={copied ? 'Copied' : label}>{copied ? <Check size={16} /> : <Clipboard size={16} />}</button>;
}

function Metric({ label, value, accent = false }) {
  return <div className={`compression-tool__metric${accent ? ' is-accent' : ''}`}><span>{label}</span><strong>{value}</strong></div>;
}

export default function CompressionToolPage() {
  const fileInputRef = useRef(null);
  const [operation, setOperation] = useState('compress');
  const [inputType, setInputType] = useState('text');
  const [algorithm, setAlgorithm] = useState('gzip');
  const [level, setLevel] = useState('medium');
  const [text, setText] = useState(SAMPLE_TEXT);
  const [encodedInput, setEncodedInput] = useState('');
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [outputText, setOutputText] = useState('');
  const [outputBytes, setOutputBytes] = useState(null);
  const [outputName, setOutputName] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  const algorithmDetails = COMPRESSION_ALGORITHMS[algorithm];
  const inputValue = operation === 'compress' ? text : encodedInput;
  const copyValue = outputText;
  const levelDetails = COMPRESSION_LEVELS[level];
  const isTextOutput = inputType === 'text';
  const canProcess = inputType === 'text' ? Boolean(inputValue) : Boolean(fileBytes);
  const inputBytesLabel = useMemo(() => {
    if (inputType === 'file') return file ? `${file.name} · ${formatBytes(file.size)}` : 'No local file selected';
    return `${formatBytes(textToBytes(operation === 'compress' ? text : encodedInput).length)} in the input box`;
  }, [encodedInput, file, inputType, operation, text]);

  const resetOutput = () => { setOutputText(''); setOutputBytes(null); setOutputName(''); setMetrics(null); };
  const clear = () => {
    setText(''); setEncodedInput(''); setFile(null); setFileBytes(null); resetOutput(); setStatus({ type: 'idle', message: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const loadSample = () => {
    setOperation('compress'); setInputType('text'); setText(SAMPLE_TEXT); setEncodedInput(''); setFile(null); setFileBytes(null); resetOutput();
    setStatus({ type: 'ok', message: 'Sample text loaded. It contains repeated phrases so the size change is easy to inspect.' });
  };
  const changeOperation = (next) => { setOperation(next); resetOutput(); setStatus({ type: 'idle', message: '' }); };
  const changeInputType = (next) => { setInputType(next); resetOutput(); setStatus({ type: 'idle', message: '' }); };
  const loadFile = async (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    try {
      setFile(nextFile); setFileBytes(new Uint8Array(await nextFile.arrayBuffer())); resetOutput();
      setStatus({ type: 'ok', message: `${nextFile.name} loaded locally. Nothing was uploaded.` });
    } catch (error) { setStatus({ type: 'error', message: error.message || 'Could not read that file.' }); }
  };

  const process = () => {
    if (!canProcess) { setStatus({ type: 'error', message: operation === 'compress' ? 'Enter text or choose a file first.' : 'Paste Base64 compressed data or choose a compressed file first.' }); return; }
    try {
      const sourceBytes = inputType === 'file'
        ? fileBytes
        : operation === 'compress' ? textToBytes(text) : base64ToBytes(encodedInput);
      const resultBytes = operation === 'compress' ? compressBytes(sourceBytes, algorithm, level) : decompressBytes(sourceBytes, algorithm);
      if (operation === 'compress') {
        setOutputBytes(resultBytes);
        setOutputText(inputType === 'text' ? bytesToBase64(resultBytes) : '');
        setOutputName(`${(file?.name || 'codetrove-output').replace(/\.[^.]+$/, '')}.${algorithm === 'gzip' ? 'gz' : algorithm === 'deflate' ? 'deflate' : algorithm === 'zip' ? 'zip' : 'cth'}`);
        setMetrics({ original: sourceBytes.length, compressed: resultBytes.length });
        setStatus({ type: 'ok', message: `${COMPRESSION_ALGORITHMS[algorithm].label} compression complete. The result is ready to copy or download.` });
      } else {
        setOutputBytes(resultBytes);
        if (inputType === 'text') setOutputText(bytesToText(resultBytes));
        else setOutputText('');
        setOutputName(`${(file?.name || 'codetrove-output').replace(/\.(gz|deflate|zip|cth|bin)$/i, '')}-decompressed${algorithm === 'zip' ? '.bin' : '.txt'}`);
        setMetrics({ original: sourceBytes.length, compressed: resultBytes.length });
        setStatus({ type: 'ok', message: `${COMPRESSION_ALGORITHMS[algorithm].label} decompression complete. The original bytes were reconstructed locally.` });
      }
    } catch (error) { resetOutput(); setStatus({ type: 'error', message: error.message || 'Could not process this input.' }); }
  };

  return (
    <main className="compression-tool-page">
      <ToolBackLink />
      <header className="compression-tool__intro">
        <span className="compression-tool__eyebrow">BUILD / TOOLS / DATA &amp; DOCUMENTS</span>
        <h1>Compression Tool</h1>
        <p>Compress or decompress text and local files in your browser. Compare the original and compressed byte sizes, choose a compression level, and inspect the exact reversible output without uploading your data.</p>
        <div className="compression-tool__privacy"><Info size={16} /> Processing is local. Your text and files stay in this browser.</div>
      </header>

      <section className="compression-tool__workspace" aria-label="Compression workspace">
        <div className="compression-tool__tabs" role="tablist" aria-label="Compression operation">
          <button type="button" role="tab" aria-selected={operation === 'compress'} className={operation === 'compress' ? 'is-active' : ''} onClick={() => changeOperation('compress')}>Compress</button>
          <button type="button" role="tab" aria-selected={operation === 'decompress'} className={operation === 'decompress' ? 'is-active' : ''} onClick={() => changeOperation('decompress')}>Decompress</button>
          <span className="compression-tool__tabs-spacer" />
          <button type="button" className="compression-tool__button" onClick={loadSample}><Sparkles size={15} /> Sample</button>
          <button type="button" className="compression-tool__button" onClick={clear}><Trash2 size={15} /> Clear</button>
        </div>

        <div className="compression-tool__controls">
          <div className="compression-tool__control-group" aria-label="Input type">
            <span className="compression-tool__control-label">Compression Type</span>
            <div className="compression-tool__segmented">
              <button type="button" className={inputType === 'text' ? 'is-active' : ''} onClick={() => changeInputType('text')}><FileText size={15} /> Text</button>
              <button type="button" className={inputType === 'file' ? 'is-active' : ''} onClick={() => changeInputType('file')}><FileArchive size={15} /> File</button>
            </div>
          </div>
          <label className="compression-tool__select"><span>Select Compression Algorithm</span><select value={algorithm} onChange={(event) => { setAlgorithm(event.target.value); resetOutput(); }}><option value="gzip">GZIP</option><option value="deflate">Deflate</option><option value="zip">ZIP</option><option value="huffman">Huffman (text / bytes)</option></select></label>
          <label className="compression-tool__select"><span>Compression level</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option value="low">Low · faster</option><option value="medium">Medium · balanced</option><option value="high">High · smaller</option></select></label>
        </div>
        <p className="compression-tool__algorithm-note"><strong>{algorithmDetails.label}:</strong> {algorithmDetails.description} <span>{levelDetails.description}</span></p>

        <div className="compression-tool__panes">
          <label className="compression-tool__pane">
            <span className="compression-tool__pane-heading">{operation === 'compress' ? (inputType === 'text' ? 'Plain text input' : 'File input') : (inputType === 'text' ? 'Compressed Base64 input' : 'Compressed file input')}</span>
            {inputType === 'text' ? <textarea value={inputValue} onChange={(event) => { operation === 'compress' ? setText(event.target.value) : setEncodedInput(event.target.value); resetOutput(); }} spellCheck="false" placeholder={operation === 'compress' ? 'Enter text to compress…' : 'Paste the Base64 output from the Compress tab…'} /> : <div className="compression-tool__file-drop"><FileArchive size={28} /><strong>{file ? file.name : 'Choose a local file'}</strong><span>{file ? formatBytes(file.size) : 'Any file type is accepted; processing stays local.'}</span><input ref={fileInputRef} type="file" onChange={loadFile} aria-label="Choose file" /></div>}
            <small>{inputBytesLabel}</small>
          </label>
          <div className="compression-tool__pane">
            <div className="compression-tool__pane-heading"><span>{operation === 'compress' ? (inputType === 'text' ? 'Compressed output · Base64' : 'Compressed file result') : (inputType === 'text' ? 'Decompressed text output' : 'Decompressed file result')}</span><CopyButton value={copyValue} label="Copy output" /></div>
            {inputType === 'text' ? <textarea value={outputText} readOnly aria-label="Compression output" placeholder={operation === 'compress' ? 'Base64 output appears here…' : 'Decompressed text appears here…'} /> : <div className="compression-tool__file-result">{outputBytes ? <><FileArchive size={32} /><strong>{outputName}</strong><span>{formatBytes(outputBytes.length)} ready to download</span></> : <><Download size={28} /><span>Run the tool to prepare a downloadable result.</span></>}</div>}
            <small>{outputBytes ? `${formatBytes(outputBytes.length)} output` : 'No output yet'}</small>
          </div>
        </div>

        <div className="compression-tool__actions">
          <button type="button" className="compression-tool__primary" onClick={process}>{operation === 'compress' ? 'Compress' : 'Decompress'}</button>
          <button type="button" className="compression-tool__button" onClick={loadSample}><RotateCcw size={15} /> Load sample</button>
          {outputBytes && <button type="button" className="compression-tool__button" onClick={() => downloadBytes(outputBytes, outputName)}><Download size={15} /> Download result</button>}
        </div>
        <div className={`compression-tool__status${status.type === 'error' ? ' is-error' : status.type === 'ok' ? ' is-ok' : ''}`} role="status" aria-live="polite">{status.message || 'Choose an operation and run it when you are ready.'}</div>

        {metrics && <div className="compression-tool__metrics"><Metric label={operation === 'compress' ? 'Original size' : 'Compressed input'} value={formatBytes(metrics.original)} /><Metric label={operation === 'compress' ? 'Compressed size' : 'Decompressed size'} value={formatBytes(metrics.compressed)} accent={operation === 'compress'} /><Metric label={operation === 'compress' ? 'Output / original' : 'Size change'} value={compressionRatio(metrics.original, metrics.compressed)} /></div>}
      </section>

      <section className="compression-tool__about" aria-labelledby="compression-about-title">
        <span className="compression-tool__eyebrow">HOW IT WORKS</span>
        <h2 id="compression-about-title">What happens when data is compressed?</h2>
        <p>Compression looks for repeated or predictable byte patterns and represents them with fewer bits. The compressed result also carries the information needed to reverse the transformation. With lossless compression, decompression reconstructs the original bytes exactly; no characters or file content are intentionally removed.</p>
        <div className="compression-tool__info-grid">
          <article><h3>GZIP and Deflate</h3><p>Deflate combines dictionary-style back-references for repeated sequences with Huffman coding for frequent symbols. GZIP wraps Deflate with metadata and a checksum. The selected level changes how much work the compressor spends searching for smaller representations.</p></article>
          <article><h3>ZIP</h3><p>ZIP is an archive container. This tool writes one file entry named <code>codetrove-input.bin</code>, compresses that entry with Deflate, and stores the directory metadata needed to extract it again.</p></article>
          <article><h3>Huffman</h3><p>The educational Huffman mode counts byte frequencies, builds a binary prefix tree, gives frequent bytes shorter codes, and stores a compact frequency table beside the encoded bit stream. The table makes decoding deterministic and lossless.</p></article>
        </div>
        <h3>Size example</h3>
        <div className="compression-tool__example"><code>500 KB plain text → roughly 50 KB compressed</code><span>The result depends on repetition, language, file format, and algorithm. Small or already-compressed files can become larger because headers and metadata also take space.</span></div>
        <details className="compression-tool__details"><summary>Choosing an algorithm</summary><ul><li><strong>GZIP:</strong> a practical choice for HTTP payloads, logs, and text files.</li><li><strong>Deflate:</strong> useful when a raw zlib/Deflate stream is the format you need.</li><li><strong>ZIP:</strong> convenient when the result should behave like a downloadable archive.</li><li><strong>Huffman:</strong> useful for learning how frequency tables, prefix codes, and bit packing work.</li></ul></details>
      </section>
    </main>
  );
}
