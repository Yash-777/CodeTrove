/**
 * src/utils/javaApi.js
 * ------------------------------------------------------------------
 * Client for Wandbox (https://wandbox.org, open source: github.com/melpon/wandbox),
 * a public "social compilation" service that runs real OpenJDK builds. It plays
 * the same role for `java runnable` boxes that api.kotlinlang.org plays for
 * Kotlin (utils/kotlinApi.js): Java cannot be compiled in the browser, so the
 * snippet is sent to the service, compiled with the selected JDK and executed.
 *
 *   GET  /api/list.json     -> every compiler; we keep language "Java" and use
 *                              the entries as the runtime-version dropdown
 *   POST /api/compile.json  -> { code, compiler, stdin, options, save:false }
 *                              <- { status, compiler_error, program_output,
 *                                   program_error, program_message, ... }
 *
 * Plain CORS requests, no API key, nothing to host yourself - works on GitHub
 * Pages. The Run button sends `compiler` (the selected runtime id) and the
 * STDIN text in the payload. `save` is always false so nothing is stored as a
 * permalink.
 *
 * Privacy note: the snippet text and STDIN are sent to wandbox.org.
 * To use another Wandbox-compatible server, change JAVA_SERVER.
 */

export const JAVA_SERVER = 'https://wandbox.org';
export const JAVA_FILE_NAME = 'Main.java';
// Wandbox saves the source as prog.java; show the editor's file name instead.
const SERVICE_FILE = 'prog.java';

// Only used if the list cannot be loaded (offline / blocked); Run will fail
// with a clear message in that case anyway.
const FALLBACK_RUNTIMES = [{ id: 'openjdk-jdk-21+35', label: 'Java 21', major: 21 }];

let runtimesPromise = null;

function toRuntime(item) {
  const name = String(item.name || '');
  const major = Number((/jdk-?(\d+)/i.exec(name) || /^(\d+)/.exec(String(item.version || '')) || [])[1]) || 0;
  const detail = item.version ? ` · ${item.version}` : '';
  return { id: name, label: major ? `Java ${major}${detail}` : `${item['display-name'] || name}${detail}`, major };
}

/** Runtime versions for the dropdown: [{ id, label, major }], newest first. */
export function getJavaRuntimes() {
  if (!runtimesPromise) {
    runtimesPromise = fetch(`${JAVA_SERVER}/api/list.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((list) => {
        const runtimes = list
          .filter((item) => String(item.language).toLowerCase() === 'java' && !/head|raw/i.test(item.name))
          .map(toRuntime)
          .sort((a, b) => b.major - a.major);
        return runtimes.length ? runtimes : FALLBACK_RUNTIMES;
      })
      .catch(() => {
        runtimesPromise = null; // retry next time
        return FALLBACK_RUNTIMES;
      });
  }
  return runtimesPromise;
}

/** Preferred default: the newest LTS (21, then 17, then 11), else the newest. */
export function pickDefaultRuntime(runtimes) {
  for (const major of [21, 17, 11]) {
    const found = runtimes.find((item) => item.major === major);
    if (found) return found.id;
  }
  return runtimes[0]?.id;
}

/**
 * The service saves the source as prog.java, so javac rejects a top-level
 * `public class Main` ("class Main is public, should be declared in a file named
 * prog.java"). The editor keeps the conventional `public class Main` / Main.java;
 * only the copy sent to the service drops `public` from top-level types. It is
 * replaced by blanks of the same length, so error line/column numbers still match
 * the editor. Nested and indented declarations are left alone.
 */
export function toServiceSource(code) {
  return code.replace(
    /^public[ \t]+(?=(?:(?:final|abstract|sealed|non-sealed|strictfp)[ \t]+)*(?:class|interface|enum|record|@interface)\b)/gm,
    (match) => ' '.repeat(match.length)
  );
}

const rename = (text) => String(text).replace(/prog\.java/g, JAVA_FILE_NAME);

/**
 * Parse javac diagnostics:
 *   Main.java:5: error: ';' expected
 *       int x = 1
 *                ^
 * into editor ranges so the same problems can be underlined.
 */
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
    diagnostics.push({
      from,
      to: Math.min(from + (word ? word[0].length : 1), code.length),
      severity: match[2],
      message: match[3],
      line: lineNo,
      column: column + 1,
    });
  }
  return diagnostics;
}

/**
 * Compile and run with the chosen runtime.
 * Returns { lines, hasErrors, diagnostics }: javac errors when the code does not
 * compile, otherwise warnings, program output (stdout), then stderr / exit status.
 */
export async function runJava(code, signal, { stdin = '', compiler } = {}) {
  const response = await fetch(`${JAVA_SERVER}/api/compile.json`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      code: toServiceSource(code),
      compiler,
      stdin,
      options: '',
      'compiler-option-raw': '',
      'runtime-option-raw': '',
      save: false,
    }),
  });
  if (!response.ok) throw new Error(`Java service responded with HTTP ${response.status}`);
  const data = await response.json();

  const compilerText = rename(data.compiler_error || data.compiler_message || '').replace(/\s+$/, '');
  const diagnostics = parseJavacDiagnostics(compilerText, code);
  const toLines = (type, text) => (text ? rename(text).replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').map((line) => ({ type, text: line })) : []);

  const stdout = data.program_output || '';
  const stderr = data.program_error || '';
  const exitStatus = String(data.status ?? '0');
  const compileFailed = compilerText !== '' && !stdout && !stderr && (exitStatus !== '0' || diagnostics.some((d) => d.severity === 'error'));

  if (compileFailed) {
    return { hasErrors: true, diagnostics, lines: toLines('error', compilerText) };
  }

  const lines = [...toLines('warn', compilerText), ...toLines('log', stdout), ...toLines('error', stderr)];
  if (exitStatus !== '0' && !stderr) {
    lines.push({ type: 'error', text: data.signal ? `Terminated by signal ${data.signal}` : `Process exited with status ${exitStatus}` });
  }
  return { hasErrors: false, diagnostics, lines };
}
