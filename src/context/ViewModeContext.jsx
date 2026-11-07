import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const VIEW_MODE_KEY = 'codetrove:view-mode';
const VALID_VIEW_MODES = ['auto', 'desktop', 'tablet', 'mobile'];

const ViewModeContext = createContext(null);

function readStoredMode() {
  if (typeof window === 'undefined') return 'auto';
  const stored = window.localStorage.getItem(VIEW_MODE_KEY);
  return VALID_VIEW_MODES.includes(stored) ? stored : 'auto';
}

export function ViewModeProvider({ children }) {
  const [viewMode, setViewModeState] = useState(readStoredMode);

  function setViewMode(nextMode) {
    const normalized = VALID_VIEW_MODES.includes(nextMode) ? nextMode : 'auto';
    setViewModeState(normalized);
    window.localStorage.setItem(VIEW_MODE_KEY, normalized);
  }

  useEffect(() => {
    document.documentElement.dataset.viewMode = viewMode;
    return () => {
      delete document.documentElement.dataset.viewMode;
    };
  }, [viewMode]);

  const value = useMemo(() => ({ viewMode, setViewMode, viewModes: VALID_VIEW_MODES }), [viewMode]);
  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) throw new Error('useViewMode must be used within ViewModeProvider');
  return context;
}
