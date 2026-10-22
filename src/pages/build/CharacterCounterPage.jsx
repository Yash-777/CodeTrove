import { useMemo, useState } from 'react';
import { Check, Copy, Sparkles, Trash2 } from 'lucide-react';
import { copyToClipboard } from '../../utils/textActions.js';
import { analyzeCharacters, removeEmojis, toPlainText } from '../../utils/characterCounter.js';
import './CharacterCounterPage.css';

const SAMPLE_TEXT = 'I am, CodeTrove, online tool!\r\nTabs\tand spaces   count. Numbers: 2026 + 2026; letters: Café café.\r\n\r\nEmoji: 👩🏽‍💻 ✨ — symbols: @ # $ %.';
const formatPair = (total, unique) => `${total.toLocaleString()} (${unique.toLocaleString()})`;

const METRICS = [
  { label: 'Characters (Unique)', value: (stats) => formatPair(stats.totalCharacters, stats.uniqueCharacters), help: 'Total visible grapheme clusters, followed in parentheses by the number of distinct characters. A combined emoji or accented letter is treated as one character.' },
  { label: 'Characters Without Spaces', value: (stats) => stats.charactersWithoutSpaces.toLocaleString(), help: 'All characters except whitespace. This includes letters, numbers, punctuation, symbols, and emojis.' },
  { label: 'Spaces (all kinds)', value: (stats) => formatPair(stats.regularSpaces, stats.spaces), help: 'The first number is ordinary U+0020 spaces. The number in parentheses is all Unicode whitespace, including tabs, non-breaking spaces, and line breaks.' },
  { label: 'Symbols (Unique)', value: (stats) => formatPair(stats.totalSymbols, stats.uniqueSymbols), help: 'Total punctuation and symbol characters, followed in parentheses by the distinct count. Letters, numbers, whitespace, and emojis are excluded.' },
  { label: 'Numbers (Unique)', value: (stats) => formatPair(stats.totalNumbers, stats.uniqueNumbers), help: 'Total numeric characters, followed in parentheses by the number of distinct numeric characters.' },
  { label: 'Letters (Unique)', value: (stats) => formatPair(stats.totalLetters, stats.uniqueLetters), help: 'Total Unicode letters, followed in parentheses by the distinct count. This count is case-sensitive, so A and a are different.' },
  { label: 'Emojis (Unique)', value: (stats) => formatPair(stats.totalEmojis, stats.uniqueEmojis), help: 'Total emoji sequences, followed in parentheses by the distinct count. Joined, skin-tone, and flag emojis are each treated as one sequence.' },
  { label: 'Lines', value: (stats) => stats.lines.toLocaleString(), help: 'Non-empty text has one line plus each LF, CRLF, or CR line break. Empty input has zero lines.' },
  { label: 'Paragraphs', value: (stats) => stats.paragraphs.toLocaleString(), help: 'Groups of non-empty lines separated by one or more blank lines.' },
  { label: 'Words (Unique)', value: (stats) => formatPair(stats.totalWords, stats.uniqueWords), help: 'Total word tokens, followed in parentheses by the number of distinct words. Duplicate words are case-insensitive; punctuation is ignored.' },
  { label: 'Sentences', value: (stats) => stats.sentences.toLocaleString(), help: 'Counts text separated by . ! or ?. If there is no sentence-ending punctuation, comma- or semicolon-separated phrases are counted, matching examples such as “I am, CodeTrove, online tool”.' },
];

export default function CharacterCounterPage() {
  const [text, setText] = useState('');
  const [limit, setLimit] = useState('270');
  const [countSpaces, setCountSpaces] = useState(true);
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => analyzeCharacters(text), [text]);
  const activeLimit = limit.trim() === '' ? null : Number(limit);
  const limitCount = countSpaces ? stats.totalCharacters : stats.charactersWithoutSpaces;
  const hasLimit = activeLimit !== null && Number.isFinite(activeLimit) && activeLimit >= 0;
  const overLimit = hasLimit && limitCount > activeLimit;
  const progress = hasLimit && activeLimit > 0
    ? Math.min(100, (limitCount / activeLimit) * 100)
    : hasLimit && activeLimit === 0 && limitCount > 0 ? 100 : 0;

  const updateText = (nextText, message = '') => {
    setText(nextText);
    setNotice(message);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!text) {
      setNotice('There is no text to copy yet.');
      setCopied(false);
      return;
    }
    const success = await copyToClipboard(text);
    setCopied(success);
    setNotice(success ? 'Text copied to the clipboard.' : 'Could not access the clipboard. Select and copy the text manually.');
  };

  const transform = (operation) => {
    if (!text) {
      setNotice('Enter or sample some text before transforming it.');
      return;
    }
    const transformed = operation === 'upper'
      ? text.toUpperCase()
      : operation === 'lower'
        ? text.toLowerCase()
        : operation === 'remove-emojis'
          ? removeEmojis(text)
          : operation === 'plain-text'
            ? toPlainText(text)
            : text.replace(/\s+/gu, ' ').trim();
    const messages = {
      upper: 'Text converted to uppercase.',
      lower: 'Text converted to lowercase.',
      'single-space': 'Whitespace normalized to single spaces.',
      'remove-emojis': 'Emoji sequences removed.',
      'plain-text': 'Converted to plain ASCII text; accents were simplified and symbols, emojis, and non-ASCII characters removed.',
    };
    updateText(transformed, messages[operation]);
  };

  return (
    <main className="cc-page">
      <header className="cc-intro">
        <div className="cc-kicker">Build / Tools / Text</div>
        <h1>Character Counter</h1>
        <p>Count characters, distinct characters, letters, numbers, symbols, emojis, words, and lines. The counts update as you type, and all analysis stays in your browser.</p>
      </header>

      <section className="cc-card" aria-label="Character counter workspace">
        <div className="cc-settings">
          <label className="cc-toggle">
            <input type="checkbox" checked={countSpaces} onChange={(event) => setCountSpaces(event.target.checked)} />
            <span>Count spaces toward the limit</span>
          </label>
          <label className="cc-limit-field" htmlFor="cc-limit">
            <span>Set Character Limit <span className="cc-optional">(Optional)</span></span>
            <input id="cc-limit" type="number" min="0" step="1" value={limit} onChange={(event) => setLimit(event.target.value)} aria-describedby="cc-limit-help" />
          </label>
          <span id="cc-limit-help" className="cc-settings-help">Leave blank to turn the limit off. Default: 270.</span>
        </div>

        <div className="cc-editor-heading">
          <label htmlFor="cc-input">Text to count</label>
          <span className={overLimit ? 'cc-count-label cc-count-label--over' : 'cc-count-label'}>
            {limitCount.toLocaleString()} {hasLimit ? `/ ${activeLimit.toLocaleString()}` : ''} characters
            {overLimit ? ' · over limit' : ''}
          </span>
        </div>
        {hasLimit && activeLimit > 0 && <div className={`cc-progress${overLimit ? ' cc-progress--over' : ''}`} role="progressbar" aria-label="Character limit usage" aria-valuemin="0" aria-valuemax={activeLimit} aria-valuenow={Math.min(limitCount, activeLimit)}>
          <span style={{ width: `${progress}%` }} />
        </div>}

        <div className="cc-input-shell">
          <div className="cc-toolbar" aria-label="Text actions">
            <button type="button" className="cc-button cc-button--soft" onClick={() => updateText(SAMPLE_TEXT, 'Sample text loaded. It includes varied whitespace, repeated characters, numbers, symbols, and emojis.')}><Sparkles size={15} aria-hidden="true" /> Sample</button>
            <button type="button" className="cc-button cc-button--soft" onClick={() => updateText('', 'Text cleared.')} disabled={!text}><Trash2 size={15} aria-hidden="true" /> Clear</button>
            <button type="button" className="cc-button cc-button--soft" onClick={handleCopy} disabled={!text} aria-label={copied ? 'Copied text' : 'Copy text'}>{copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <textarea id="cc-input" className="cc-input" value={text} onChange={(event) => updateText(event.target.value)} placeholder="Type or paste text here to see the counts update…" spellCheck="false" />
        </div>

        <div className="cc-transform-row" aria-label="Text transformations">
          <span className="cc-transform-label">Transform text</span>
          <button type="button" className="cc-button cc-button--outline" onClick={() => transform('upper')}>UPPERCASE</button>
          <button type="button" className="cc-button cc-button--outline" onClick={() => transform('lower')}>lowercase</button>
          <button type="button" className="cc-button cc-button--outline" onClick={() => transform('single-space')}>Single Space</button>
          <button type="button" className="cc-button cc-button--outline" onClick={() => transform('remove-emojis')} title="Remove emoji sequences while keeping the rest of the text">Remove Emojis</button>
          <button type="button" className="cc-button cc-button--outline" onClick={() => transform('plain-text')} title="Simplify accents and remove emojis, symbols, and non-ASCII characters">Plain Text</button>
        </div>
        {notice && <p className="cc-notice" role="status">{notice}</p>}
      </section>

      <section className="cc-metrics-section" aria-labelledby="cc-metrics-title">
        <div className="cc-section-heading">
          <div><span className="cc-kicker">LIVE ANALYSIS</span><h2 id="cc-metrics-title">Text statistics</h2></div>
          <p>Hover or focus the help marker beside a metric for its counting rules.</p>
        </div>
        <div className="cc-metrics-grid">
          {METRICS.map((metric) => (
            <article className="cc-metric" key={metric.label}>
              <div className="cc-metric-label">
                <span>{metric.label}</span>
                <button type="button" className="cc-help" title={metric.help} aria-label={`${metric.label}: ${metric.help}`}>
                  <span aria-hidden="true">?</span>
                </button>
              </div>
              <strong className="cc-metric-value">{metric.value(stats)}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="cc-description" aria-labelledby="cc-description-title">
        <span className="cc-kicker">ABOUT THIS TOOL</span>
        <h2 id="cc-description-title">What Is a Character Counter?</h2>
        <p>A character counter is a tool that counts the characters in text, including letters, numbers, spaces, punctuation marks, symbols, emojis, and line breaks. Use the optional limit to check a post or message length; turn off “Count spaces toward the limit” when the target platform excludes whitespace.</p>
        <p>For metrics marked <strong>Unique</strong>, the first number is the total occurrences and the number in parentheses is the distinct count. Repeated characters, emoji sequences, symbols, numbers, and words therefore appear in the total but count once in the unique figure. Unique letters are case-sensitive; unique words are case-insensitive. For spaces, the first number counts ordinary spaces and the parenthetical number counts all whitespace kinds.</p>
        <p>Lines recognize LF, CRLF, and CR endings. Paragraphs are groups of non-empty lines separated by blank lines. The “Remove Emojis” transformation removes emoji sequences while preserving other text. “Plain Text” simplifies accents and removes non-ASCII characters and symbols while keeping basic letters, numbers, whitespace, and common punctuation. Nothing you enter is uploaded by this tool.</p>
      </section>
    </main>
  );
}
