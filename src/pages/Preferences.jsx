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

const DEFAULT_CATEGORY_KEY = 'codetrove:default-category';

export default function Preferences() {
  const { mode, setMode } = useTheme();
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

      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxWidth: '320px', marginTop: '1.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Theme</span>
        <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ padding: '0.5rem 0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">Match system</option>
        </select>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxWidth: '320px', marginTop: '1.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
          Default category key (used by future "jump to my language" shortcuts)
        </span>
        <input
          value={defaultCategory}
          onChange={handleChange}
          placeholder="e.g. java"
          style={{ padding: '0.5rem 0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}
        />
      </label>
    </div>
  );
}
