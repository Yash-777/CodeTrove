import { useMemo, useState } from 'react';
import { Check, Copy, Sparkles, Trash2 } from 'lucide-react';
import { copyToClipboard } from '../../utils/textActions.js';
import { applyRegexReplacement, createRegex, findRegexMatches, renderHighlightedSegments } from '../../utils/regexMatcher.js';
import './RegexMatchPage.css';

const SAMPLE_PATTERN = String.raw`^(\h*)(\d+\.)`;
const SAMPLE_FLAGS = 'gm';
const SAMPLE_REPLACEMENT = ' $0';
const SAMPLE_INPUT = `1. Line1
2. Line2
3. Line3`;

function HighlightedInput({ value, matches, onChange }) {
  const segments = useMemo(() => renderHighlightedSegments(value, matches), [value, matches]);
  return (
    <div className="regex-editor-shell">
      <pre className="regex-highlight" aria-hidden="true">
        {segments.map((segment, index) => segment.type === 'match'
          ? <mark key={`${segment.index}-${index}`} title={`Match ${segment.index + 1}`}>{segment.value}</mark>
          : <span key={`text-${index}`}>{segment.value}</span>)}
        {!value && <span className="regex-highlight__placeholder">Paste or type text to inspect matches…</span>}
      </pre>
      <textarea
        className="regex-editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Regular expression input text"
        spellCheck="false"
      />
    </div>
  );
}

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!text) return;
    if (await copyToClipboard(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  };
  return <button type="button" className="regex-icon-button" onClick={copy} disabled={!text} title={label} aria-label={copied ? `${label} — copied` : label}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>;
}

function MatchSummary({ matches }) {
  if (matches.length === 0) return <p className="regex-empty-result">No matches found for the current pattern.</p>;
  return (
    <div className="regex-match-list">
      {matches.slice(0, 100).map((match, index) => (
        <div className="regex-match-row" key={`${match.index}-${index}`}>
          <span className="regex-match-number">{index + 1}</span>
          <code>{match.text || '∅'}</code>
          <span className="regex-match-position">index {match.index}</span>
        </div>
      ))}
      {matches.length > 100 && <p className="regex-muted">Showing the first 100 matches.</p>}
    </div>
  );
}

export default function RegexMatchPage() {
  const [pattern, setPattern] = useState(SAMPLE_PATTERN);
  const [flags, setFlags] = useState(SAMPLE_FLAGS);
  const [replacement, setReplacement] = useState(SAMPLE_REPLACEMENT);
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [notice, setNotice] = useState('');

  const analysis = useMemo(() => {
    if (!pattern) return { regex: null, matches: [], output: input, error: 'Enter a regular expression pattern.' };
    try {
      const regex = createRegex(pattern, flags);
      const matches = findRegexMatches(input, regex);
      return { regex, matches, output: replacement === '' ? input : applyRegexReplacement(input, regex, replacement), error: '' };
    } catch (error) {
      return { regex: null, matches: [], output: input, error: error.message || 'Invalid regular expression.' };
    }
  }, [pattern, flags, input, replacement]);

  const loadSample = () => {
    setPattern(SAMPLE_PATTERN);
    setFlags(SAMPLE_FLAGS);
    setReplacement(SAMPLE_REPLACEMENT);
    setInput(SAMPLE_INPUT);
    setNotice('Numbered-list sample loaded. Matches are highlighted in the input.');
  };
  const clear = () => {
    setPattern('');
    setFlags('gm');
    setReplacement('$0');
    setInput('');
    setNotice('Regex workspace cleared.');
  };
  const update = (setter) => (event) => {
    setter(event.target.value);
    setNotice('');
  };

  return (
    <main className="regex-page">
      <header className="regex-intro">
        <div className="regex-kicker">Build / Tools / Text</div>
        <h1>Regular Expression Match</h1>
        <p>Find, inspect, extract, and replace text with JavaScript regular expressions. Everything runs locally in your browser; your text is not uploaded.</p>
        <div className="regex-links" aria-label="External regex references">
          <a href="https://regex101.com/extraction" target="_blank" rel="noreferrer">Regex101 extraction ↗</a>
          <a href="https://regexr.com/" target="_blank" rel="noreferrer">RegExr ↗</a>
        </div>
      </header>

      <section className="regex-card" aria-label="Regular expression workspace">
        <div className="regex-controls">
          <label className="regex-field regex-field--pattern" htmlFor="regex-pattern">
            <span>Regular expression</span>
            <input id="regex-pattern" value={pattern} onChange={update(setPattern)} placeholder="e.g. ([A-Z])\\w+" spellCheck="false" />
          </label>
          <label className="regex-field regex-field--flags" htmlFor="regex-flags">
            <span>Flags</span>
            <input id="regex-flags" value={flags} onChange={update(setFlags)} placeholder="gm" maxLength="7" spellCheck="false" />
          </label>
          <label className="regex-field regex-field--replacement" htmlFor="regex-replacement">
            <span>Replace with <small>(optional)</small></span>
            <input id="regex-replacement" value={replacement} onChange={update(setReplacement)} placeholder="$0 or $1-$9" spellCheck="false" />
          </label>
          <div className="regex-actions">
            <button type="button" className="regex-button regex-button--primary" onClick={loadSample}><Sparkles size={15} aria-hidden="true" /> Sample</button>
            <button type="button" className="regex-button" onClick={clear}><Trash2 size={15} aria-hidden="true" /> Clear</button>
          </div>
        </div>

        <div className={`regex-status${analysis.error ? ' regex-status--error' : ' regex-status--ok'}`} role="status" aria-live="polite">
          {analysis.error ? analysis.error : `${analysis.matches.length.toLocaleString()} match${analysis.matches.length === 1 ? '' : 'es'} · flags /${flags || '∅'}`}
        </div>

        <div className="regex-panes">
          <section className="regex-pane" aria-labelledby="regex-before-title">
            <div className="regex-pane__bar"><h2 id="regex-before-title">Before — input and matches</h2><span className="regex-pane__hint">Highlighted matches</span></div>
            <HighlightedInput value={input} matches={analysis.matches} onChange={(value) => { setInput(value); setNotice(''); }} />
          </section>
          <section className="regex-pane" aria-labelledby="regex-after-title">
            <div className="regex-pane__bar"><h2 id="regex-after-title">After — replacement output</h2><CopyButton text={analysis.output} label="Copy replacement output" /></div>
            <textarea className="regex-output" value={analysis.output} onChange={() => {}} readOnly aria-label="Regular expression replacement output" />
          </section>
        </div>
        {notice && <p className="regex-notice" role="status">{notice}</p>}

        <details className="regex-details">
          <summary>Replacement tokens and capture groups</summary>
          <p>Replacement text follows JavaScript's replacement syntax. This tool also accepts <code>$0</code> as an alias for the complete match, which is the same idea as <code>$&amp;</code> in JavaScript. Leaving the replacement field empty keeps the output unchanged.</p>
          <ul>
            <li><code>$0</code> or <code>$&amp;</code> — the complete match.</li>
            <li><code>$1</code>, <code>$2</code> … — the corresponding numbered capture group.</li>
            <li><code>$&lt;name&gt;</code> — a named capture group such as <code>(?&lt;name&gt;...)</code>.</li>
            <li><code>$$</code> — a literal dollar sign.</li>
          </ul>
        </details>
      </section>

      <section className="regex-results" aria-labelledby="regex-results-title">
        <div className="regex-section-heading"><div><span className="regex-kicker">MATCH INSPECTOR</span><h2 id="regex-results-title">Matches and capture groups</h2></div><p>Use the match list to check offsets and extraction results before changing your text.</p></div>
        <MatchSummary matches={analysis.matches} />
        {analysis.matches[0]?.groups?.length > 0 && (
          <div className="regex-groups">
            <h3>Capture groups from the first match</h3>
            <div className="regex-group-grid">
              {analysis.matches[0].groups.map((group, index) => <div className="regex-group" key={index}><span>Group ${index + 1}</span><code>{group ?? 'undefined'}</code></div>)}
            </div>
          </div>
        )}
      </section>

      <section className="regex-description" aria-labelledby="regex-description-title">
        <span className="regex-kicker">REGEX QUICK REFERENCE</span>
        <h2 id="regex-description-title">Regular expression patterns explained</h2>
        <p>A regular expression is a pattern for finding character combinations. The pattern is compiled as a JavaScript <code>RegExp</code>, so the flags and replacement tokens on this page follow browser JavaScript behavior.</p>
        <h3>Example: add indentation before numbered lists</h3>
        <p><code>^(\h*)(\d+\.)</code> with <code>gm</code> finds the numbering at the start of every line. Replacing with <code> $0</code> adds one space before the complete match while retaining the original numbering.</p>
        <ul className="regex-explanation-list">
          <li><code>^</code> — start of a line when the <code>m</code> flag is enabled.</li>
          <li><code>(\h*)</code> — zero or more horizontal spaces or tabs.</li>
          <li><code>(\d+\.)</code> — one or more digits followed by a literal period, such as <code>1.</code>, <code>2.</code>, or <code>10.</code>.</li>
          <li><code>$0</code> — the complete match in this tool; JavaScript's native token is <code>$&amp;</code>.</li>
          <li><code>gm</code> — global matching plus line-by-line anchors.</li>
        </ul>
        <h3>Example: uppercase word extraction</h3>
        <p><code>/([A-Z])\w+/g</code> finds words that begin with an uppercase ASCII letter. The capture group <code>([A-Z])</code> remembers the first letter, <code>[A-Z]</code> is a case-sensitive range, and <code>\w</code> matches an ASCII word character: a letter, digit, or underscore.</p>
        <table className="regex-reference-table">
          <thead><tr><th>Pattern</th><th>Meaning</th><th>Pattern</th><th>Meaning</th><th>Pattern</th><th>Meaning</th></tr></thead>
          <tbody>
            <tr><td><code>[abc]</code></td><td>One character: a, b, or c</td><td><code>.</code></td><td>Any character except a line break by default</td><td><code>(...)</code></td><td>Capture the enclosed text</td></tr>
            <tr><td><code>[^abc]</code></td><td>One character except a, b, or c</td><td><code>\s</code></td><td>Whitespace</td><td><code>a|b</code></td><td>a or b</td></tr>
            <tr><td><code>[a-z]</code></td><td>One character in the range a–z</td><td><code>\d</code></td><td>Digit</td><td><code>a?</code></td><td>Zero or one a</td></tr>
            <tr><td><code>[a-zA-Z]</code></td><td>One character in either range</td><td><code>\D</code></td><td>Non-digit</td><td><code>a*</code></td><td>Zero or more a characters</td></tr>
            <tr><td><code>^</code></td><td>Start of line with m, otherwise start of input</td><td><code>\w</code></td><td>ASCII word character</td><td><code>a+</code></td><td>One or more a characters</td></tr>
            <tr><td><code>$</code></td><td>End of line with m, otherwise end of input</td><td><code>\W</code></td><td>Non-word character</td><td><code>a&#123;3&#125;</code></td><td>Exactly three a characters</td></tr>
            <tr><td><code>\A</code></td><td>Not a JavaScript anchor; use <code>^</code> for input start</td><td><code>\b</code></td><td>Word boundary</td><td><code>a&#123;3,&#125;</code></td><td>Three or more a characters</td></tr>
            <tr><td><code>\z</code></td><td>Not a JavaScript anchor; use <code>$</code> for input end</td><td><code>\n</code></td><td>Line-feed character</td><td><code>a&#123;3,6&#125;</code></td><td>Between three and six a characters</td></tr>
          </tbody>
        </table>
        <h3>Useful flags</h3>
        <p><code>g</code> finds every match, <code>i</code> ignores case, <code>m</code> makes <code>^</code> and <code>$</code> work per line, <code>s</code> lets <code>.</code> match line breaks, <code>u</code> enables Unicode mode, <code>y</code> enables sticky matching, and <code>d</code> exposes match indices in JavaScript APIs.</p>
        <p className="regex-source-note">Sources: <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp" target="_blank" rel="noreferrer">MDN RegExp reference ↗</a>, <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace" target="_blank" rel="noreferrer">MDN String.replace replacement patterns ↗</a>, and <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Groups_and_backreferences" target="_blank" rel="noreferrer">MDN groups and backreferences ↗</a>.</p>
      </section>
      <p className="regex-note">Runs locally in your browser. No input is sent to Regex101, RegExr, Rubular, or a CodeTrove backend.</p>
    </main>
  );
}
