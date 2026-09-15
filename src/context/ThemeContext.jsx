/**
 * src/context/ThemeContext.jsx
 * ------------------------------------------------------------------
 * Three theme options: "light", "dark", "system" (follows the OS/
 * browser preference via the prefers-color-scheme media query).
 * The chosen mode is saved to localStorage so it persists across
 * visits.
 *
 * HOW THE ACTUAL COLOR SWITCH WORKS:
 * We set a `data-theme="dark"` (or "light") attribute on the <html>
 * element. src/index.css has a `[data-theme="dark"] { ... }` block
 * that overrides the same CSS variables (--color-bg, --color-text,
 * etc.) used everywhere else in the app - so every component that
 * already uses `var(--color-bg)` etc. gets dark mode for free, with
 * no per-component changes needed.
 */

import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'codetrove:theme-mode';
const ThemeContext = createContext(null);

function resolveMode(mode) {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || 'system');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    const applied = resolveMode(mode);
    document.documentElement.setAttribute('data-theme', applied);

    // If following "system", keep listening for OS-level changes
    // (e.g. the OS switches to dark mode at sunset) while this mode
    // is selected.
    if (mode === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => document.documentElement.setAttribute('data-theme', resolveMode('system'));
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, [mode]);

  return <ThemeContext.Provider value={{ mode, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
