const KEY = 'codetrove.tableTheme';

export const TABLE_PRESETS = [
  { name: 'Blue',   color: '#4472c4' },
  { name: 'Light Blue',   color: '#6793e1' },
  { name: 'Orange', color: '#ed7d31' },
  { name: 'Gray',   color: '#7f7f7f' },
  { name: 'Gold',   color: '#ffc000' },
  { name: 'Green',  color: '#70ad47' },
];

export const DEFAULT_TABLE_COLOR = TABLE_PRESETS[1].color;

// Pick black or white header text for readable contrast
function headText(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) > 160 ? '#1f1f1f' : '#ffffff';
}

export function applyTableColor(hex) {
  const root = document.documentElement.style;
  root.setProperty('--tbl-color', hex);
  root.setProperty('--tbl-head-text', headText(hex));
}

export function getSavedTableColor() {
  try { return localStorage.getItem(KEY) || DEFAULT_TABLE_COLOR; }
  catch { return DEFAULT_TABLE_COLOR; }
}

export function saveTableColor(hex) {
  try { localStorage.setItem(KEY, hex); } catch { /* ignore */ }
  applyTableColor(hex);
}

export function resetTableColor() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  applyTableColor(DEFAULT_TABLE_COLOR);
}

export function initTableTheme() {
  applyTableColor(getSavedTableColor());
}
