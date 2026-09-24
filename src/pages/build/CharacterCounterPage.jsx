import { useMemo, useState } from 'react';
import './CharacterCounterPage.css';

function countStats(text, includeSpaces) {
  const characters = includeSpaces ? text.length : text.replace(/\s/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = (text.match(/[.!?]+/g) || []).length;
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).length : 0;
  const lines = text.split(/\n/).length;
  const spaces = (text.match(/ /g) || []).length + (text.match(/\t/g) || []).length;
  const charsWithoutSpaces = text.replace(/\s/g, '').length;
  const emojis = (text.match(/\p{Extended_Pictographic}/gu) || []).length;
  const symbols = (text.match(/[^\p{L}\p{N}\s\p{Extended_Pictographic}]/gu) || []).length;
  const numbers = (text.match(/\d/g) || []).length;
  return { characters, words, sentences, paragraphs, lines, spaces, charsWithoutSpaces, emojis, symbols, numbers };
}

export default function CharacterCounterPage() {
  const [text, setText] = useState('');
  const [includeSpaces, setIncludeSpaces] = useState(true);

  const stats = useMemo(() => countStats(text, includeSpaces), [text, includeSpaces]);

  return (
    <div className="cc-page">
      <header className="cc-intro">
        <div className="cc-kicker">Build / Tools / Character Counter</div>
        <h1>Character Counter</h1>
        <p>Use this free character counter to count characters, words, spaces, and more. Type or paste text below, and the counts update automatically.</p>
      </header>

      <div className="cc-workspace">
        <main className="cc-main">
          <label className="cc-checkbox"><input type="checkbox" checked={includeSpaces} onChange={(e) => setIncludeSpaces(e.target.checked)} /> Include spaces in character count</label>
          <textarea className="cc-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the text to count" spellCheck="false" />
        </main>
        <aside className="cc-side">
          <table className="cc-stats">
            <tbody>
              <tr><td>Characters</td><td>{stats.characters}</td></tr>
              <tr><td>Words</td><td>{stats.words}</td></tr>
              <tr><td>Sentences</td><td>{stats.sentences}</td></tr>
              <tr><td>Paragraphs</td><td>{stats.paragraphs}</td></tr>
              <tr><td>Lines</td><td>{stats.lines}</td></tr>
              <tr><td>Spaces</td><td>{stats.spaces}</td></tr>
              <tr><td>Characters Without Spaces</td><td>{stats.charsWithoutSpaces}</td></tr>
              <tr><td>Emojis</td><td>{stats.emojis}</td></tr>
              <tr><td>Symbols</td><td>{stats.symbols}</td></tr>
              <tr><td>Numbers</td><td>{stats.numbers}</td></tr>
            </tbody>
          </table>

          <section className="cc-limits">
            <h3>Common Character Limits</h3>
            <table>
              <tbody>
                <tr><td>X/Twitter post</td><td>280</td></tr>
                <tr><td>Instagram caption</td><td>2200</td></tr>
                <tr><td>LinkedIn post</td><td>3000</td></tr>
                <tr><td>YouTube title</td><td>100</td></tr>
                <tr><td>YouTube description</td><td>5000</td></tr>
                <tr><td>Text Message (SMS)</td><td>160</td></tr>
                <tr><td>Meta description</td><td>About 150–160</td></tr>
              </tbody>
            </table>
          </section>
        </aside>
      </div>
    </div>
  );
}
