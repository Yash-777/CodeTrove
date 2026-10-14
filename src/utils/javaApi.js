/**
 * Java compiler clients.
 *
 * Wandbox is the default provider. Judge0 is supported through its public
 * Judge0 CE-compatible REST API and is useful for self-hosted deployments.
 * Both providers expose the same runtime and result shape to the editor.
 */

export const JAVA_APIS = {
  wandbox: {
    id: 'wandbox',
    label: 'Wandbox (wandbox.org)',
    description: 'Open-source public compilation service; no API key required.',
    server: 'https://wandbox.org',
  },
  judge0: {
    id: 'judge0',
    label: 'Judge0 (judge0.com)',
    description: 'REST API with resource limits; use a public or self-hosted endpoint.',
    server: 'https://ce.judge0.com',
  },
};

export const DEFAULT_JAVA_API = 'wandbox';
export const JAVA_SERVER = JAVA_APIS.wandbox.server;
export const JAVA_FILE_NAME = 'Main.java';
const SERVICE_FILE = 'prog.java';

const FALLBACK_RUNTIMES = [{ id: 'openjdk-jdk-21+35', label: 'Java 21', major: 21 }];
const FALLBACK_JUDGE0_RUNTIMES = [
  { id: '91', label: 'Java 17 (JDK 17.0.6)', major: 17 },
  { id: '62', label: 'Java 13 (OpenJDK 13.0.1)', major: 13 },
];

const runtimesPromises = new Map();

function parseJavaMajor(item) {
  const name = String(item.name || '');
  const version = String(item.version || '');
  const displayName = String(item['display-name'] || '');
  const text = `${name} ${displayName} ${version}`;
  const legacy = /(?:jdk|java)?[-_ ]*1\.(\d+)(?:[._+\-]|\b)/i.exec(text);
  if (legacy) return Number(legacy[1]);
  const modern = /(?:jdk|java)[-_ ]*(\d{1,2})(?:[.+_\-]|\b)/i.exec(text)
    || /^(\d{1,2})(?:[.+_\-]|\b)/.exec(version);
  return modern ? Number(modern[1]) : 0;
}

function toWandboxRuntime(item) {
  const name = String(item.name || '');
  const major = parseJavaMajor(item);
  const detail = item.version ? ` · ${item.version}` : '';
  const label = major ? `Java ${major}${detail}` : `${item['display-name'] || name}${detail}`;
  return { id: name, label, major };
}

function toJudge0Runtime(item) {
  const name = String(item.name || '');
  const match = /Java(?:FX)?\s*\((?:OpenJDK|JDK)\s*(\d+)/i.exec(name);
  const major = match ? Number(match[1]) : 0;
  return { id: String(item.id), label: major ? `Java ${major} · ${name}` : name, major };
}

/** Available Java runtimes advertised by the selected provider. */
export function getJavaRuntimes(api = DEFAULT_JAVA_API) {
  if (!runtimesPromises.has(api)) {
    const provider = JAVA_APIS[api] || JAVA_APIS[DEFAULT_JAVA_API];
    const promise = (api === 'judge0'
      ? fetch(`${provider.server}/languages`).then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      }).then((list) => list
        .filter((item) => /^Java(?:\s|FX)/i.test(String(item.name || '')) && !/JavaFX/i.test(item.name))
        .map(toJudge0Runtime)
        .filter((runtime) => runtime.major > 0)
        .sort((a, b) => b.major - a.major || a.label.localeCompare(b.label)))
      : fetch(`${provider.server}/api/list.json`).then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      }).then((list) => list
        .filter((item) => String(item.language).toLowerCase() === 'java' && !/head|raw/i.test(item.name))
        .map(toWandboxRuntime)
        .filter((runtime) => runtime.major >= 8 || runtime.major === 5)
        .sort((a, b) => b.major - a.major || a.label.localeCompare(b.label))))
      .then((runtimes) => runtimes.length ? runtimes : (api === 'judge0' ? FALLBACK_JUDGE0_RUNTIMES : FALLBACK_RUNTIMES))
      .catch(() => api === 'judge0' ? FALLBACK_JUDGE0_RUNTIMES : FALLBACK_RUNTIMES);
    runtimesPromises.set(api, promise);
  }
  return runtimesPromises.get(api);
}

/** Preferred default: newest LTS when available, otherwise newest runtime. */
export function pickDefaultRuntime(runtimes) {
  for (const major of [21, 17, 11]) {
    const found = runtimes.find((item) => item.major === major);
    if (found) return found.id;
  }
  return runtimes[0]?.id;
}

export function toServiceSource(code) {
  return code.replace(
    /^public[ \t]+(?=(?:(?:final|abstract|sealed|non-sealed|strictfp)[ \t]+)*(?:class|interface|enum|record|@interface)\b)/gm,
    (match) => ' '.repeat(match.length)
  );
}

const rename = (text) => String(text).replace(/prog\.java/g, JAVA_FILE_NAME);

export function parseJavacDiagnostics(text, code) {
  const lines = String(text).split('\n');
  const codeLines = code.split('\n');
  const starts = [0];
  codeLines.forEach((line) => starts.push(starts[starts.length - 1] + line.length + 1));
  const diagnostics = [];
  for (let i = 0; i < lines.length; i += 1) {
    const match = /^(?:prog|Main)\.java:(\d+): (error|warning): (.*)$/.exec(lines[i]);
    if (!match) continue;
    const lineNo = Number(match[1]);
    const caretLine = lines.slice(i + 1, i + 4).find((line) => /^\s*\^\s*$/.test(line));
    const column = caretLine ? caretLine.indexOf('^') : 0;
    const lineStart = starts[Math.min(Math.max(lineNo - 1, 0), starts.length - 1)];
    const from = Math.min(lineStart + column, code.length);
    const word = /^\w+/.exec(code.slice(from, from + 40));
    diagnostics.push({ from, to: Math.min(from + (word ? word[0].length : 1), code.length), severity: match[2], message: match[3], line: lineNo, column: column + 1 });
  }
  return diagnostics;
}

const toLines = (type, text) => (text ? rename(text).replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').map((line) => ({ type, text: line })) : []);

async function runWandbox(code, signal, compiler, stdin) {
  const response = await fetch(`${JAVA_APIS.wandbox.server}/api/compile.json`, {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ code: toServiceSource(code), compiler, stdin, options: '', 'compiler-option-raw': '', 'runtime-option-raw': '', save: false }),
  });
  if (!response.ok) throw new Error(`Java service responded with HTTP ${response.status}`);
  const data = await response.json();
  const compilerText = rename(data.compiler_error || data.compiler_message || '').replace(/\s+$/, '');
  const diagnostics = parseJavacDiagnostics(compilerText, code);
  const stdout = data.program_output || '';
  const stderr = data.program_error || '';
  const exitStatus = String(data.status ?? '0');
  const compileFailed = compilerText !== '' && !stdout && !stderr && (exitStatus !== '0' || diagnostics.some((d) => d.severity === 'error'));
  if (compileFailed) return { hasErrors: true, diagnostics, lines: toLines('error', compilerText) };
  const lines = [...toLines('warn', compilerText), ...toLines('log', stdout), ...toLines('error', stderr)];
  if (exitStatus !== '0' && !stderr) lines.push({ type: 'error', text: data.signal ? `Terminated by signal ${data.signal}` : `Process exited with status ${exitStatus}` });
  return { hasErrors: false, diagnostics, lines };
}

async function runJudge0(code, signal, compiler, stdin) {
  const endpoint = `${JAVA_APIS.judge0.server}/submissions?base64_encoded=false&wait=true`;
  const response = await fetch(endpoint, {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language_id: Number(compiler), source_code: code, stdin, cpu_time_limit: 5, wall_time_limit: 10, memory_limit: 256000 }),
  });
  if (!response.ok) throw new Error(`Judge0 service responded with HTTP ${response.status}`);
  const data = await response.json();
  const compilerText = data.compile_output || '';
  const diagnostics = parseJavacDiagnostics(compilerText, code);
  const lines = [...toLines('error', compilerText), ...toLines('log', data.stdout || ''), ...toLines('error', data.stderr || '')];
  if (data.status?.id > 3) lines.push({ type: 'error', text: data.status.description || `Execution status: ${data.status.id}` });
  return { hasErrors: Boolean(compilerText || data.status?.id > 3), diagnostics, lines };
}

/** Compile and run using the selected provider and runtime. */
export function runJava(code, signal, { stdin = '', compiler, api = DEFAULT_JAVA_API } = {}) {
  if (api === 'judge0') return runJudge0(code, signal, compiler, stdin);
  return runWandbox(code, signal, compiler, stdin);
}
