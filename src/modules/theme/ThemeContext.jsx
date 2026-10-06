/**
 * src/modules/theme/ThemeContext.jsx
 * ------------------------------------------------------------------
 * Theme Context for light/dark mode management.
 * Stores preference in localStorage and applies to <html> element.
 */

import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'codetrove_theme';
const ThemeContext = createContext(null);
const VALID_THEMES = ['light', 'dark', 'system'];

function getStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return VALID_THEMES.includes(stored) ? stored : 'system';
}

function resolveTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-theme', resolveTheme(theme));

    if (theme !== 'system') return undefined;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => document.documentElement.setAttribute('data-theme', resolveTheme('system'));
    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, [theme]);

  function setTheme(nextTheme) {
    if (!VALID_THEMES.includes(nextTheme)) return;
    setThemeState(nextTheme);
  }

  function cycleTheme() {
    const next = { light: 'dark', dark: 'system', system: 'light' };
    setTheme(next[theme]);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, mode: theme, setMode: setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
