import { useMemo, useState } from 'react';
import { copyToClipboard } from '../../utils/textActions.js';
import './StringUtilitiesPage.css';

const SAMPLE_TEXT = '  Hello   world!\t\t\n\n\nThis is   copied from AI.  \n\nThis is   copied from AI.  \nCafé déjà vu — naïve façade.';
const SAMPLES = {
  spaces: '  Hello   world!\t\t\n\n\nThis is   copied from AI.  \n',
  duplicates: 'apple\n  banana\nApple\norange\nbanana\npear',
  accents: 'Café déjà vu — naïve façade.\nCrème brûlée and piñata.'
};

function removeAccents(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function minifyText(text, options) {
  let result = text;
  if (options.removeTabs) result = result.replace(/\t+/g, '');
  if (options.removeSpaces) result = result.replace(/ +/g, '');
  if (options.removeEmptyLines) result = result.split(/\r?\n/).filter((line) => line.trim() !== '').join('\n');
  if (options.singleSpace) result = result.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return result;
}

function removeDuplicateLines(text, options) {
  const seen = new Set();
  return text.split(/\r?\n/).filter((line) => {
    if (options.removeEmptyLines && !line.trim()) return false;
    const cleanedLine = options.trimLines ? line.trim() : line;
    const comparable = options.ignoreCase ? cleanedLine.toLocaleLowerCase() : cleanedLine;
    if (seen.has(comparable)) return false;
    seen.add(comparable);
    return true;
  }).map((line) => options.trimLines ? line.trim() : line).join('\n');
}

const MODES = [
  { id: 'spaces', label: 'Remove Extra Spaces', short: 'Text Minifier', description: 'Clean up extra spaces, tabs, and blank lines often introduced when copying text from AI, documents, or websites.' },
  { id: 'duplicates', label: 'Remove Duplicate Lines', short: 'Duplicate Line Remover', description: 'Keep the first occurrence of each line and remove repeated lines from lists, logs, or pasted text.' },
  { id: 'accents', label: 'Remove Accents', short: 'Accent Remover', description: 'Convert accented letters to their closest basic Latin equivalents, useful for slugs, search terms, and data cleanup.' },
];

export default function StringUtilitiesPage() {
  const [mode, setMode] = useState('spaces');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [notice, setNotice] = useState('');
  const [spaceOptions, setSpaceOptions] = useState({ removeSpaces: false, removeTabs: false, removeEmptyLines: true, singleSpace: true });
  const [duplicateOptions, setDuplicateOptions] = useState({ trimLines: true, ignoreCase: false, removeEmptyLines: false });
  const selectedMode = MODES.find((item) => item.id === mode) || MODES[0];
  const inputStats = useMemo(() => ({ chars: input.length, lines: input ? input.split(/\r?\n/).length : 0 }), [input]);

  const convert = () => {
    if (!input) { setOutput(''); setNotice('Enter or paste some text first.'); return; }
    const result = mode === 'spaces' ? minifyText(input, spaceOptions) : mode === 'duplicates' ? removeDuplicateLines(input, duplicateOptions) : removeAccents(input);
    setOutput(result);
    setNotice('Conversion complete. Review the result, then copy it when ready.');
  };
  const loadSample = () => {
    setInput(SAMPLES[mode]); setOutput(''); setNotice('Sample loaded. Select options if needed, then run the conversion.');
  };
  const clearAll = () => { setInput(''); setOutput(''); setNotice(''); };
  const handleInputUtility = () => { if (input) clearAll(); else loadSample(); };
  const copyInput = async () => {
    if (!input) { setNotice('There is no input to copy yet.'); return; }
    const copied = await copyToClipboard(input);
    setNotice(copied ? 'Input copied to clipboard.' : 'Could not access the clipboard. Select and copy the input manually.');
  };
  const copyOutput = async () => {
    if (!output) { setNotice('There is no output to copy yet. Run the conversion first.'); return; }
    const copied = await copyToClipboard(output);
    setNotice(copied ? 'Output copied to clipboard.' : 'Could not access the clipboard. Select and copy the output manually.');
  };
  const toggleSpace = (key) => setSpaceOptions((current) => ({ ...current, [key]: !current[key] }));
  const toggleDuplicate = (key) => setDuplicateOptions((current) => ({ ...current, [key]: !current[key] }));

  return (
    <div className="su-page">
      <header className="su-intro">
        <div className="su-kicker">Build / Tools / Text</div>
        <h1>String Utilities</h1>
        <p>Clean up pasted text with focused, browser-based utilities. Choose a conversion, configure its options, and preview the result before copying it.</p>
      </header>

      <section className="su-tool-card" aria-label="String conversion workspace">
        <div className="su-tool-heading">
          <div><label htmlFor="su-mode">Conversion</label><select id="su-mode" value={mode} onChange={(event) => { setMode(event.target.value); setOutput(''); setNotice(''); }}>
            {MODES.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select></div>
          <div className="su-mode-description"><strong>{selectedMode.short}</strong><p>{selectedMode.description}</p></div>
        </div>

        {mode === 'spaces' && <fieldset className="su-options"><legend>Minifier options</legend>
          <label><input type="checkbox" checked={spaceOptions.removeSpaces} onChange={() => toggleSpace('removeSpaces')} /> Remove spaces</label>
          <label><input type="checkbox" checked={spaceOptions.removeTabs} onChange={() => toggleSpace('removeTabs')} /> Remove tabs</label>
          <label><input type="checkbox" checked={spaceOptions.removeEmptyLines} onChange={() => toggleSpace('removeEmptyLines')} /> Remove empty lines</label>
          <label><input type="checkbox" checked={spaceOptions.singleSpace} onChange={() => toggleSpace('singleSpace')} /> Minify to single space</label>
          <p className="su-option-hint">“Remove spaces” deletes ordinary space characters; “single space” collapses whitespace and joins non-empty lines. Use them separately or together.</p>
        </fieldset>}
        {mode === 'duplicates' && <fieldset className="su-options"><legend>Duplicate detection options</legend>
          <label><input type="checkbox" checked={duplicateOptions.trimLines} onChange={() => toggleDuplicate('trimLines')} /> Trim leading/trailing spaces</label>
          <label><input type="checkbox" checked={duplicateOptions.ignoreCase} onChange={() => toggleDuplicate('ignoreCase')} /> Ignore letter case</label>
          <label><input type="checkbox" checked={duplicateOptions.removeEmptyLines} onChange={() => toggleDuplicate('removeEmptyLines')} /> Remove empty lines too</label>
          <p className="su-option-hint">The first matching line is kept. Comparison options do not change the spacing or case of retained lines.</p>
        </fieldset>}
        {mode === 'accents' && <div className="su-info-note"><strong>What changes?</strong> Accented Latin characters are normalized (for example, “Café” becomes “Cafe”). Punctuation, emojis, and line breaks are kept. Some letters such as “ø” or “ł” do not have a combining accent and may remain unchanged.</div>}

        <div className="su-editors">
          <section className="su-editor-panel"><div className="su-editor-title"><label htmlFor="su-input">Input text</label><span>{inputStats.chars} characters · {inputStats.lines} lines</span></div>
            <div className="su-textarea-wrap"><textarea id="su-input" value={input} onChange={(event) => { setInput(event.target.value); setNotice(''); }} placeholder="Paste or type your text here…" spellCheck="false" />
              <div className="su-editor-toolbar"><button type="button" className="su-button su-button--secondary" onClick={handleInputUtility}>{input ? 'Clear' : 'Sample'}</button><button type="button" className="su-button su-button--secondary" onClick={copyInput}>Copy</button></div>
            </div>
          </section>
          <section className="su-editor-panel"><div className="su-editor-title"><label htmlFor="su-output">Output</label><span>{output.length} characters</span></div>
            <div className="su-textarea-wrap"><textarea id="su-output" value={output} onChange={(event) => setOutput(event.target.value)} placeholder="Your converted text will appear here…" spellCheck="false" />
              <div className="su-editor-toolbar"><button type="button" className="su-button su-button--secondary" onClick={copyOutput}>Copy</button><button type="button" className="su-button su-button--primary" onClick={convert}>{mode === 'spaces' ? 'Convert / Minify' : 'Convert'}</button></div>
            </div>
          </section>
        </div>
        {notice && <p className="su-notice" role="status">{notice}</p>}
      </section>

      <section className="su-reference">
        <div className="su-section-heading"><span className="su-kicker">QUICK REFERENCE</span><h2>What’s covered in String Utilities?</h2><p>Choose the right cleanup operation for the text you have pasted.</p></div>
        <div className="su-table-wrap"><table><thead><tr><th>Utility</th><th>Options</th><th>Sample input</th><th>Sample output</th><th>Best for</th></tr></thead><tbody>
          <tr><th>Remove Extra Spaces</th><td>Remove spaces, remove tabs, remove empty lines, collapse whitespace to a single space</td><td><code>{'  Hello   world!\n\nAI text  '}</code></td><td><code>Hello world! AI text</code></td><td>Cleaning AI responses and copied text</td></tr>
          <tr><th>Remove Duplicate Lines</th><td>Trim leading/trailing spaces, ignore case, remove empty lines</td><td><code>{'apple\n  banana\nApple\norange\nbanana\npear'}</code></td><td><code>{'apple\nbanana\nApple\norange\npear'}</code></td><td>Deduplicating lists, names, and logs</td></tr>
          <tr><th>Remove Accents</th><td>Unicode accent normalization</td><td><code>Café déjà vu</code></td><td><code>Cafe deja vu</code></td><td>Search-friendly text and basic Latin output</td></tr>
        </tbody></table></div>
        <p className="su-privacy-note">All conversions run locally in your browser; the text you enter is not uploaded by this tool.</p>
      </section>
    </div>
  );
}
