import { useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { html } from '@codemirror/legacy-modes/mode/xml';
import { css } from '@codemirror/legacy-modes/mode/css';
import { javascript } from '@codemirror/legacy-modes/mode/javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { Check, Clipboard, Code2, ExternalLink, Play, RefreshCw, RotateCcw, Settings2, Terminal, WandSparkles } from 'lucide-react';
import ToolBackLink from '../../components/ToolBackLink.jsx';
import './WebPlaygroundPage.css';

const DEFAULT_HTML = `<main class="card">
  <span class="eyebrow">CodeTrove playground</span>
  <h1>Build something small.</h1>
  <p>Edit the three panels and press <strong>Run</strong> to update this preview.</p>
  <button id="hello-button" type="button">Say hello</button>
  <p id="message" class="message" aria-live="polite"></p>
</main>`;
const DEFAULT_CSS = `:root {
  font-family: Inter, system-ui, sans-serif;
  color: #172033;
  background: #eef3fb;
}

* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 2rem; }
.card {
  width: min(100%, 32rem);
  padding: 2rem;
  border: 1px solid #d6e0f0;
  border-radius: 1.25rem;
  background: #fff;
  box-shadow: 0 1rem 3rem #263b5c1c;
}
.eyebrow { color: #3867d6; font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
h1 { margin: .55rem 0 .75rem; font-size: clamp(1.8rem, 4vw, 2.7rem); }
p { color: #60708b; line-height: 1.6; }
button { border: 0; border-radius: .65rem; padding: .7rem 1rem; background: #3867d6; color: white; font: inherit; font-weight: 700; cursor: pointer; }
button:hover { background: #2854bf; }
.message { min-height: 1.5rem; margin-bottom: 0; color: #3867d6; font-weight: 700; }`;
const DEFAULT_JS = `const button = document.querySelector('#hello-button');
const message = document.querySelector('#message');

button.addEventListener('click', () => {
  message.textContent = 'Hello from your JavaScript panel.';
  console.log('Button clicked at', new Date().toLocaleTimeString());
});

console.log('Preview ready');`;

const SAMPLES = {
  starter: { label: 'Starter card', html: DEFAULT_HTML, css: DEFAULT_CSS, js: DEFAULT_JS },
  counter: {
    label: 'Live character counter',
    html: `<section class="counter">
  <span class="eyebrow">Tiny interactive component</span>
  <h1>Character counter</h1>
  <textarea id="writer" maxlength="180" placeholder="Type something..."></textarea>
  <div class="meter"><span id="count">0 / 180</span><span id="remaining">180 remaining</span></div>
</section>`,
    css: `:root { font-family: system-ui, sans-serif; color: #18212f; background: #f7f5ff; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 2rem; }
.counter { width: min(100%, 35rem); padding: 2rem; border-radius: 1.25rem; background: white; box-shadow: 0 1rem 3rem #493d7d1c; }
.eyebrow { color: #7257d6; font-size: .75rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
h1 { margin: .5rem 0 1rem; }
textarea { width: 100%; min-height: 10rem; padding: 1rem; border: 2px solid #e5e0f7; border-radius: .8rem; resize: vertical; font: inherit; }
textarea:focus { outline: 3px solid #7257d633; border-color: #7257d6; }
.meter { display: flex; justify-content: space-between; margin-top: .7rem; color: #7257d6; font-size: .8rem; font-weight: 700; }`,
    js: `const writer = document.querySelector('#writer');
const count = document.querySelector('#count');
const remaining = document.querySelector('#remaining');

function updateCount() {
  const used = writer.value.length;
  count.textContent = used + ' / ' + writer.maxLength;
  remaining.textContent = (writer.maxLength - used) + ' remaining';
}
writer.addEventListener('input', updateCount);
updateCount();
console.log('Counter initialized');`,
  },
  gradient: {
    label: 'Gradient playground',
    html: `<section class="hero">
  <span class="badge">CSS experiment</span>
  <h1>Make the background do the talking.</h1>
  <p>Change the colors in the CSS panel, then run the preview.</p>
  <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/gradient" target="_blank" rel="noreferrer">Learn about gradients ↗</a>
</section>`,
    css: `:root { font-family: system-ui, sans-serif; color: white; background: #17152b; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 2rem; }
.hero { width: min(100%, 42rem); padding: clamp(2rem, 8vw, 5rem); border-radius: 2rem; background: linear-gradient(135deg, #ff7a59, #7c4dff 55%, #21d4fd); box-shadow: 0 2rem 5rem #0006; }
.badge { display: inline-block; padding: .35rem .65rem; border-radius: 99px; background: #ffffff2b; font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
h1 { max-width: 12ch; margin: 1rem 0; font-size: clamp(2.2rem, 7vw, 4.8rem); line-height: .98; }
p { max-width: 36rem; color: #fffddc; line-height: 1.6; }
a { color: white; font-weight: 800; }`,
    js: `const hero = document.querySelector('.hero');
hero.addEventListener('pointermove', (event) => {
  const x = Math.round((event.offsetX / hero.offsetWidth) * 100);
  const y = Math.round((event.offsetY / hero.offsetHeight) * 100);
  hero.style.background = \`radial-gradient(circle at \${x}% \${y}%, #21d4fd, #7c4dff 45%, #ff7a59)\`;
});
console.log('Move your pointer over the card');`,
  },
};

const EDITORS = [
  { key: 'html', label: 'HTML', file: 'index.html', mode: StreamLanguage.define(html), languageClass: 'playground-editor--html' },
  { key: 'css', label: 'CSS', file: 'styles.css', mode: StreamLanguage.define(css), languageClass: 'playground-editor--css' },
  { key: 'js', label: 'JavaScript', file: 'script.js', mode: StreamLanguage.define(javascript), languageClass: 'playground-editor--js' },
];

function buildPreview(html, cssText, jsText) {
  const consoleBridge = `<script>(function(){const send=(level,args)=>parent.postMessage({source:'codetrove-playground',level,args:args.map((value)=>{try{return typeof value==='string'?value:JSON.stringify(value)}catch{return String(value)}})},'*');['log','info','warn','error'].forEach(level=>{const original=console[level];console[level]=(...args)=>{send(level,args);original(...args)}})})();<\\/script>`;
  return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${cssText}</style></head><body>${html}${consoleBridge}<script>try{${jsText}}catch(error){window.parent.postMessage({source:'codetrove-playground',level:'error',args:[error.stack || error.message]},'*')}</script></body></html>`;
}

export default function WebPlaygroundPage() {
  const [sampleKey, setSampleKey] = useState('starter');
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [cssText, setCssText] = useState(DEFAULT_CSS);
  const [jsText, setJsText] = useState(DEFAULT_JS);
  const [preview, setPreview] = useState(() => buildPreview(DEFAULT_HTML, DEFAULT_CSS, DEFAULT_JS));
  const [autoRun, setAutoRun] = useState(true);
  const [activePanel, setActivePanel] = useState('html');
  const [consoleLines, setConsoleLines] = useState(['Preview console is ready.']);
  const [copied, setCopied] = useState('');
  const [notice, setNotice] = useState('Ready · edits are kept in this browser tab.');
  const debounceRef = useRef(null);
  const values = useMemo(() => ({ html, css: cssText, js: jsText }), [html, cssText, jsText]);

  const run = () => {
    setPreview(buildPreview(html, cssText, jsText));
    setConsoleLines(['Preview refreshed.']);
    setNotice('Preview updated locally.');
  };
  useEffect(() => {
    if (!autoRun) return undefined;
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setPreview(buildPreview(html, cssText, jsText)), 450);
    return () => window.clearTimeout(debounceRef.current);
  }, [autoRun, html, cssText, jsText]);
  useEffect(() => {
    const receive = (event) => {
      if (event.data?.source !== 'codetrove-playground') return;
      setConsoleLines((current) => [...current.slice(-19), `[${event.data.level}] ${(event.data.args || []).join(' ')}`]);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);
  const loadSample = (key) => {
    const sample = SAMPLES[key]; setSampleKey(key); setHtml(sample.html); setCssText(sample.css); setJsText(sample.js); setConsoleLines([`${sample.label} loaded.`]); setNotice(`${sample.label} loaded.`);
  };
  const reset = () => loadSample('starter');
  const update = (key, value) => { if (key === 'html') setHtml(value); else if (key === 'css') setCssText(value); else setJsText(value); setNotice('Unsaved editor changes.'); };
  const copy = async (key) => {
    try { await navigator.clipboard.writeText(values[key]); setCopied(key); setNotice(`${key.toUpperCase()} copied to clipboard.`); window.setTimeout(() => setCopied(''), 1400); }
    catch { setNotice('Clipboard access was blocked. Select the code and copy it manually.'); }
  };
  const openPreview = () => { const tab = window.open(); if (tab) { tab.document.write(preview); tab.document.close(); setNotice('Preview opened in a new tab.'); } };

  return (
    <main className="playground-page">
      <ToolBackLink />
      <header className="playground-intro"><div><span className="playground-eyebrow">WEB / BUILD TOOLS</span><h1>Web Playground</h1><p>Write HTML, CSS, and JavaScript together, then see the result instantly in a safe local preview.</p></div><div className="playground-intro__mark"><Code2 size={24} /><span>4 panes<br /><small>edit · run · learn</small></span></div></header>
      <section className="playground-workspace" aria-label="Web playground">
        <div className="playground-toolbar"><div className="playground-toolbar__group"><label className="playground-select"><span>Sample</span><select value={sampleKey} onChange={(event) => loadSample(event.target.value)}>{Object.entries(SAMPLES).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label><label className="playground-toggle"><input type="checkbox" checked={autoRun} onChange={(event) => setAutoRun(event.target.checked)} /> Auto-run</label></div><div className="playground-toolbar__group"><button type="button" className="playground-button playground-button--run" onClick={run}><Play size={15} /> Run</button><button type="button" className="playground-button" onClick={reset}><RotateCcw size={14} /> Reset</button><button type="button" className="playground-button" onClick={() => setConsoleLines(['Console cleared.'])}><Terminal size={14} /> Clear console</button></div></div>
        <div className="playground-mobile-tabs" role="tablist" aria-label="Playground panels">{[...EDITORS, { key: 'result', label: 'Result' }].map((panel) => <button key={panel.key} type="button" role="tab" aria-selected={activePanel === panel.key} className={activePanel === panel.key ? 'is-active' : ''} onClick={() => setActivePanel(panel.key)}>{panel.label}</button>)}</div>
        <div className="playground-grid">
          {EDITORS.map((editor) => <section key={editor.key} className={`playground-panel ${editor.languageClass} ${activePanel === editor.key ? 'is-mobile-active' : ''}`}><div className="playground-panel__head"><div><span className="playground-panel__dot" /><strong>{editor.label}</strong><code>{editor.file}</code></div><div><button type="button" className="playground-icon-button" onClick={() => copy(editor.key)} title={`Copy ${editor.label}`} aria-label={`Copy ${editor.label}`}>{copied === editor.key ? <Check size={15} /> : <Clipboard size={15} />}</button></div></div><CodeMirror value={values[editor.key]} onChange={(value) => update(editor.key, value)} theme={oneDark} extensions={[editor.mode]} height="330px" basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }} aria-label={`${editor.label} editor`} /><div className="playground-panel__foot"><span>{values[editor.key].length.toLocaleString()} chars</span><span>Local editor</span></div></section>)}
          <section className={`playground-panel playground-result ${activePanel === 'result' ? 'is-mobile-active' : ''}`}><div className="playground-panel__head"><div><span className="playground-panel__dot playground-panel__dot--result" /><strong>Result</strong><code>preview.html</code></div><div className="playground-result__actions"><button type="button" className="playground-icon-button" onClick={() => setPreview(buildPreview(html, cssText, jsText))} title="Refresh preview" aria-label="Refresh preview"><RefreshCw size={15} /></button><button type="button" className="playground-icon-button" onClick={openPreview} title="Open preview in a new tab" aria-label="Open preview in a new tab"><ExternalLink size={15} /></button></div></div><iframe key={preview} title="Web playground result" sandbox="allow-scripts allow-forms allow-modals" srcDoc={preview} /><div className="playground-console"><div><span><Terminal size={13} /> Console</span><small>{consoleLines.length} event{consoleLines.length === 1 ? '' : 's'}</small></div><pre>{consoleLines.join('\n')}</pre></div></section>
        </div>
        <div className="playground-status" role="status"><span className="playground-status__live" />{notice}<span className="playground-status__privacy">Browser-local · iframe sandbox</span></div>
      </section>
      <section className="playground-guide"><div><span className="playground-eyebrow">HOW TO USE IT</span><h2>A small loop for fast experiments</h2><p>Use the sample menu to start from a component, edit any of the three source panels, and run the preview. The Result pane is isolated in a sandboxed iframe, while the lightweight console shows logs and runtime errors from your JavaScript.</p></div><div className="playground-guide__steps"><article><span>01</span><strong>Structure</strong><p>Put markup in HTML.</p></article><article><span>02</span><strong>Style</strong><p>Shape it with CSS.</p></article><article><span>03</span><strong>Behavior</strong><p>Make it respond with JS.</p></article></div></section>
    </main>
  );
}
