/**
 * Judge0 runtime discovery and execution for C, C++, and Python.
 * The compiler UI keeps the selected language/runtime separate from the
 * provider-specific request and response details in this module.
 */

export const JUDGE0_SERVER = 'https://ce.judge0.com';

const LANGUAGE_CONFIG = {
  c: {
    label: 'C',
    fileName: 'main.c',
    match: /^C \(/i,
    fallback: [
      { id: '103', label: 'C · GCC 14.1.0', version: '14.1.0' },
      { id: '104', label: 'C · Clang 18.1.8', version: '18.1.8' },
      { id: '48', label: 'C · GCC 7.4.0', version: '7.4.0' },
    ],
  },
  cpp: {
    label: 'C++',
    fileName: 'main.cpp',
    match: /^C\+\+ \(/i,
    fallback: [
      { id: '105', label: 'C++ · GCC 14.1.0', version: '14.1.0' },
      { id: '76', label: 'C++ · Clang 7.0.1', version: '7.0.1' },
      { id: '52', label: 'C++ · GCC 7.4.0', version: '7.4.0' },
    ],
  },
  python: {
    label: 'Python',
    fileName: 'main.py',
    match: /^Python \(/i,
    fallback: [
      { id: '109', label: 'Python · 3.13.2', version: '3.13.2' },
      { id: '100', label: 'Python · 3.12.5', version: '3.12.5' },
      { id: '92', label: 'Python · 3.11.2', version: '3.11.2' },
    ],
  },
};

const runtimesPromises = new Map();

function parseVersion(name) {
  const match = /\((?:[^0-9]*)(\d+(?:\.\d+)+)/.exec(String(name));
  return match ? match[1] : '';
}

function toRuntime(item) {
  const name = String(item.name || '');
  const version = parseVersion(name);
  return {
    id: String(item.id),
    label: `${LANGUAGE_CONFIG[item.language]?.label || ''} · ${version || name}`.replace(/^ · /, ''),
    version,
  };
}

export function getNativeLanguageConfig(language) {
  return LANGUAGE_CONFIG[language] || null;
}

export function getNativeFileName(language) {
  return LANGUAGE_CONFIG[language]?.fileName || 'main.txt';
}

export function isNativeLanguage(language) {
  return Boolean(LANGUAGE_CONFIG[language]);
}

export function getNativeRuntimes(language) {
  const config = LANGUAGE_CONFIG[language];
  if (!config) return Promise.resolve([]);
  if (!runtimesPromises.has(language)) {
    const promise = fetch(`${JUDGE0_SERVER}/languages`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((list) => list
        .filter((item) => config.match.test(String(item.name || '')))
        .map((item) => ({ ...toRuntime({ ...item, language }), id: String(item.id) }))
        .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }) || a.label.localeCompare(b.label)))
      .then((runtimes) => runtimes.length ? runtimes : config.fallback)
      .catch(() => config.fallback);
    runtimesPromises.set(language, promise);
  }
  return runtimesPromises.get(language);
}

export function pickNativeRuntime(runtimes) {
  return runtimes[0]?.id || '';
}

function renameDiagnostics(text, fileName) {
  return String(text).replace(/(?:main|Main)\.(?:c|cpp|py)/g, fileName);
}

function parseDiagnostics(text, code, fileName) {
  const lines = String(text).split('\n');
  const codeLines = code.split('\n');
  const diagnostics = [];
  for (const line of lines) {
    const match = new RegExp(`${fileName.replace('.', '\\.')}:(\\d+)(?::(\\d+))?:\\s*(error|warning):\\s*(.*)`, 'i').exec(line);
    if (!match) continue;
    const lineNo = Number(match[1]);
    const column = Math.max(Number(match[2] || 1) - 1, 0);
    let from = 0;
    for (let i = 0; i < Math.min(lineNo - 1, codeLines.length); i += 1) from += codeLines[i].length + 1;
    from = Math.min(from + column, code.length);
    diagnostics.push({ from, to: Math.min(from + 1, code.length), severity: match[3].toLowerCase(), message: match[4], line: lineNo, column: column + 1 });
  }
  return diagnostics;
}

const toLines = (type, text, fileName) => (text
  ? renameDiagnostics(text, fileName).replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').map((line) => ({ type, text: line }))
  : []);

export async function runNative(code, signal, { language, compiler, stdin = '' } = {}) {
  const fileName = getNativeFileName(language);
  const response = await fetch(`${JUDGE0_SERVER}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_code: code,
      language_id: Number(compiler),
      stdin,
      cpu_time_limit: 5,
      wall_time_limit: 10,
      memory_limit: 256000,
    }),
  });
  if (!response.ok) throw new Error(`Judge0 service responded with HTTP ${response.status}`);
  const data = await response.json();
  const compilerText = data.compile_output || '';
  const diagnostics = parseDiagnostics(compilerText, code, fileName);
  const lines = [
    ...toLines('error', compilerText, fileName),
    ...toLines('log', data.stdout || '', fileName),
    ...toLines('error', data.stderr || '', fileName),
  ];
  if (data.status?.id > 3) lines.push({ type: 'error', text: data.status.description || `Execution status: ${data.status.id}` });
  return { hasErrors: Boolean(compilerText || data.status?.id > 3), diagnostics, lines };
}
