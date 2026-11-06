/**
 * src/pages/Preferences.jsx
 * ------------------------------------------------------------------
 * Route: /preferences - reached via the gear icon in the Header.
 * Deliberately minimal for now: a couple of real, useful settings
 * stored in localStorage, following the same pattern as
 * utils/recentTopics.js. Add more settings here later the same way -
 * one useState + one localStorage.setItem per setting.
 */

import { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { useViewMode } from '../context/ViewModeContext.jsx';
import './Preferences.css';

const DEFAULT_CATEGORY_KEY = 'codetrove:default-category';

export default function Preferences() {
  const { mode, setMode } = useTheme();
  const { viewMode, setViewMode } = useViewMode();
  const [defaultCategory, setDefaultCategory] = useState(
    () => localStorage.getItem(DEFAULT_CATEGORY_KEY) || ''
  );

  function handleChange(event) {
    const value = event.target.value;
    setDefaultCategory(value);
    localStorage.setItem(DEFAULT_CATEGORY_KEY, value);
  }

  return (
    <div className="content-page">
      <h1>Preferences</h1>
      <p style={{ color: 'var(--color-muted)', maxWidth: '60ch' }}>
        Stored locally in your browser - clearing site data resets these.
      </p>

      <section className="preferences__section" aria-labelledby="view-mode-heading">
        <h2 id="view-mode-heading">Application view</h2>
        <p className="preferences__hint">
          Auto follows the available screen width. Choose Desktop, Tablet, or Mobile to keep or preview
          that layout even when you are accessing CodeTrove from a lower-resolution screen.
        </p>
        <label className="preferences__field">
          <span>View mode</span>
          <select value={viewMode} onChange={(event) => setViewMode(event.target.value)}>
            <option value="auto">Auto — follow screen size</option>
            <option value="desktop">Desktop — wide workspace</option>
            <option value="tablet">Tablet — compact workspace</option>
            <option value="mobile">Mobile — single-column workspace</option>
          </select>
        </label>
      </section>

      <label className="preferences__field">
        <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Theme</span>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">Match system</option>
        </select>
      </label>

      <label className="preferences__field">
        <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
          Default category key (used by future "jump to my language" shortcuts)
        </span>
        <input
          value={defaultCategory}
          onChange={handleChange}
          placeholder="e.g. java"
        />
      </label>
    </div>
  );
}
