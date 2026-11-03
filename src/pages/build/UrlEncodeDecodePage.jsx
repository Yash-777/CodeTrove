import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '../../utils/textActions.js';
import {
  RESERVED_CHARACTERS,
  UNRESERVED_CHARACTERS,
  URL_CHARACTER_TABLE,
  decodeUrlText,
  deriveAutoSelectedCharacters,
  encodeUrlText,
  getDetectedCharacters,
  replacementFor,
} from '../../utils/urlEncoding.js';
import './UrlEncodeDecodePage.css';

const SAMPLE_INPUT = 'https://example.com/search?q=hello world&tag=Java';
const TABLE_GROUPS = ['Reserved', 'Unreserved', 'Common encoded'];

function displayCharacter(character) {
  if (character === ' ') return 'space';
  if (character === '\n') return 'newline';
  if (character === '\\') return '\\';
  return character;
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!value) return;
    if (await copyToClipboard(value)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  };
  return <button type="button" className="url-tool__icon-button" onClick={copy} disabled={!value} aria-label={copied ? 'Copied output' : 'Copy output'} title={copied ? 'Copied' : 'Copy output'}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>;
}

function CharacterTable({ group, rows, selected, onToggle }) {
  return (
    <section className="url-character-group" aria-labelledby={`url-group-${group.replaceAll(' ', '-').toLowerCase()}`}>
      <h3 id={`url-group-${group.replaceAll(' ', '-').toLowerCase()}`}>{group}</h3>
      <div className="url-character-table-wrap">
        <table className="url-character-table">
          <thead><tr><th>Select</th><th>Character</th><th>Percent replacement</th></tr></thead>
          <tbody>
            {rows.map(({ character }) => {
              const isSelected = selected.has(character);
              return <tr className={isSelected ? 'is-selected' : ''} key={`${group}-${character}`}>
                <td><input type="checkbox" checked={isSelected} onChange={() => onToggle(character)} aria-label={`Include ${displayCharacter(character)}`} /></td>
                <td><code>{displayCharacter(character)}</code></td>
                <td><code>{replacementFor(character)}</code></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function UrlEncodeDecodePage() {
  const [mode, setMode] = useState('encode');
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [selected, setSelected] = useState(() => deriveAutoSelectedCharacters(SAMPLE_INPUT, 'encode'));
  const [notice, setNotice] = useState('');

  const detectedCharacters = useMemo(() => getDetectedCharacters(input, mode), [input, mode]);
  const rows = useMemo(() => [
    ...URL_CHARACTER_TABLE,
    ...detectedCharacters.map((character) => ({ character, group: 'Detected in input' })),
  ], [detectedCharacters]);
  const output = useMemo(() => {
    try {
      return { value: mode === 'encode' ? encodeUrlText(input, selected) : decodeUrlText(input, selected), error: '' };
    } catch (error) {
      return { value: '', error: error.message || 'Unable to process the URL.' };
    }
  }, [input, mode, selected]);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setSelected(deriveAutoSelectedCharacters(input, nextMode));
    setNotice('');
  };
  const updateInput = (event) => {
    const value = event.target.value;
    setInput(value);
    setSelected(deriveAutoSelectedCharacters(value, mode));
    setNotice('');
  };
  const toggleCharacter = (character) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(character)) next.delete(character); else next.add(character);
      return next;
    });
    setNotice('Character selection updated.');
  };
  const selectInvolved = () => { setSelected(deriveAutoSelectedCharacters(input, mode)); setNotice('Characters involved in the current input are selected.'); };
  const selectAll = () => { setSelected(new Set(rows.map(({ character }) => character))); setNotice('All listed characters selected.'); };
  const clearSelection = () => { setSelected(new Set()); setNotice('Character selection cleared. Unselected characters are preserved as text.'); };
  const loadSample = () => { setInput(SAMPLE_INPUT); setSelected(deriveAutoSelectedCharacters(SAMPLE_INPUT, mode)); setNotice('Sample URL loaded.'); };
  const clear = () => { setInput(''); setSelected(new Set()); setNotice(''); };

  return (
    <main className="url-tool-page">
      <header className="url-tool__intro">
        <span className="url-tool__eyebrow">BUILD / TOOLS / CRYPTOGRAPHY</span>
        <h1>URL (Encode ⇄ Decode)</h1>
        <p>Percent-encode or decode URL text locally in your browser. The character map below shows which characters are selected, which replacement value is used, and how RFC 3986 reserved and unreserved characters differ.</p>
        <div className="url-tool__links" aria-label="URL encoding references">
          <a href="https://www.urlencoder.org/" target="_blank" rel="noreferrer">URL Encoder ↗</a>
          <a href="https://www.urlencoder.io/" target="_blank" rel="noreferrer">urlencoder.io ↗</a>
          <a href="https://www.calculator.net/url-encode-decode.html" target="_blank" rel="noreferrer">Calculator.net reference ↗</a>
          <a href="https://www.w3schools.com/tags/ref_urlencode.asp" target="_blank" rel="noreferrer">W3Schools reference ↗</a>
        </div>
      </header>

      <section className="url-tool__workspace" aria-label="URL encoding workspace">
        <div className="url-tool__tabs" role="tablist" aria-label="URL operation">
          <button type="button" role="tab" aria-selected={mode === 'encode'} className={mode === 'encode' ? 'is-active' : ''} onClick={() => changeMode('encode')}>Encode</button>
          <button type="button" role="tab" aria-selected={mode === 'decode'} className={mode === 'decode' ? 'is-active' : ''} onClick={() => changeMode('decode')}>Decode</button>
          <span className="url-tool__tabs-spacer" />
          <button type="button" className="url-tool__button" onClick={loadSample}>Sample</button>
          <button type="button" className="url-tool__button" onClick={clear}>Clear</button>
        </div>
        <div className="url-tool__editors">
          <label className="url-tool__editor"><span>{mode === 'encode' ? 'Text / URL to encode' : 'Percent-encoded URL to decode'}</span><textarea value={input} onChange={updateInput} spellCheck="false" placeholder={mode === 'encode' ? 'Enter a URL or text…' : 'Paste percent-encoded text…'} /></label>
          <div className="url-tool__editor"><div className="url-tool__editor-heading"><span>{mode === 'encode' ? 'Encoded output' : 'Decoded output'}</span><CopyButton value={output.value} /></div><textarea value={output.error || output.value} readOnly aria-label={`${mode === 'encode' ? 'Encoded' : 'Decoded'} output`} className={output.error ? 'has-error' : ''} /></div>
        </div>
        <div className={`url-tool__status${output.error ? ' is-error' : ''}`} role="status" aria-live="polite">{output.error || notice || `${selected.size} character${selected.size === 1 ? '' : 's'} selected · ${mode === 'encode' ? 'RFC 3986-style percent encoding' : 'selected percent sequences decoded'}`}</div>

        <details className="url-tool__details">
          <summary>Character selection controls</summary>
          <p>Characters found in the input are selected automatically and highlighted with the accent color. Click any row or checkbox to include or exclude it. In Encode mode, unreserved characters remain readable; selected reserved, whitespace, and Unicode characters are percent-encoded. In Decode mode, only selected decoded characters are changed.</p>
          <div className="url-tool__selection-actions">
            <button type="button" className="url-tool__button" onClick={selectInvolved}>Select involved characters</button>
            <button type="button" className="url-tool__button" onClick={selectAll}>Select all listed</button>
            <button type="button" className="url-tool__button" onClick={clearSelection}>Clear selection</button>
          </div>
        </details>

        <div className="url-tool__character-heading"><div><span className="url-tool__eyebrow">CHARACTER MAP</span><h2>Characters and replacement values</h2></div><p>Selected rows use a color highlight; unselected rows remain neutral.</p></div>
        <div className="url-tool__character-grid">
          {TABLE_GROUPS.map((group) => <CharacterTable key={group} group={group} rows={rows.filter((row) => row.group === group)} selected={selected} onToggle={toggleCharacter} />)}
          {detectedCharacters.length > 0 && <CharacterTable group="Detected in input" rows={rows.filter((row) => row.group === 'Detected in input')} selected={selected} onToggle={toggleCharacter} />}
        </div>
      </section>

      <section className="url-tool__description" aria-labelledby="url-description-title">
        <span className="url-tool__eyebrow">QUICK REFERENCE</span>
        <h2 id="url-description-title">How URL percent-encoding works</h2>
        <p>URI characters are either <strong>reserved</strong>, <strong>unreserved</strong>, or part of a percent-encoding. Reserved characters can have structural meaning: for example, <code>/</code> separates path segments, <code>?</code> begins a query, and <code>&amp;</code> separates query parameters. Unreserved characters have no special URI meaning and are safe to leave readable.</p>
        <div className="url-tool__info-table-wrap"><table className="url-tool__info-table"><thead><tr><th>Category</th><th>Characters</th><th>Meaning in a URL</th><th>Example replacement</th></tr></thead><tbody>
          <tr><th>Reserved · RFC 3986 §2.2</th><td><code>{RESERVED_CHARACTERS}</code></td><td>May delimit or structure a URI. Encode them when they are data inside a component.</td><td><code>! → %21</code>, <code>/ → %2F</code>, <code>? → %3F</code></td></tr>
          <tr><th>Unreserved · RFC 3986 §2.3</th><td><code>{UNRESERVED_CHARACTERS}</code></td><td>Letters, digits, hyphen, underscore, period, and tilde are safe and remain readable.</td><td><code>A → A</code>, <code>- → -</code>, <code>~ → ~</code></td></tr>
          <tr><th>Common encoded input</th><td><code>space newline &quot; % &lt; &gt; \\ ^ ` &#123; | &#125;</code></td><td>These characters commonly need percent-encoding when included as data.</td><td><code>space → %20</code>, <code>newline → %0A</code>, <code>% → %25</code></td></tr>
        </tbody></table></div>
        <h3>Percent-encoding examples</h3>
        <div className="url-tool__examples"><code>hello world → hello%20world</code><code>q=a&amp;b → q%3Da%26b</code><code>/api/items?id=10 → %2Fapi%2Fitems%3Fid%3D10</code></div>
        <h3>Encode versus decode</h3>
        <ol><li>In <strong>Encode</strong>, each selected character is converted to one or more UTF-8 bytes written as <code>%</code> followed by two hexadecimal digits.</li><li>In <strong>Decode</strong>, valid percent-byte sequences are converted back only when their decoded characters are selected.</li><li>For a complete URL, encode the individual path segment or query value rather than blindly encoding separators that your URL needs for structure.</li></ol>
        <details className="url-tool__details"><summary>RFC 3986 reserved character table</summary><p>Reserved characters after percent-encoding:</p><div className="url-tool__compact-table"><table><tbody><tr>{Array.from(RESERVED_CHARACTERS, (character) => <td key={character}><code>{character}</code></td>)}</tr><tr>{Array.from(RESERVED_CHARACTERS, (character) => <td key={`${character}-encoded`}><code>{replacementFor(character)}</code></td>)}</tr></tbody></table></div></details>
      </section>
      <p className="url-tool__privacy">Runs locally in your browser. No URL or text is sent to the linked reference sites or to a CodeTrove backend.</p>
    </main>
  );
}
