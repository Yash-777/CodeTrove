/**
 * src/utils/kotlinApi.js
 * ------------------------------------------------------------------
 * Client for JetBrains' public Kotlin compiler service
 * (https://api.kotlinlang.org) - the same backend that powers
 * play.kotlinlang.org and the official `kotlin-playground` widget.
 *
 * Kotlin cannot be compiled in the browser, so `kotlin runnable` code boxes
 * send the snippet to that service:
 *   GET  /versions                          -> pick the latest stable compiler
 *   POST /api/<version>/compiler/highlight  -> diagnostics while typing
 *   POST /api/<version>/compiler/run        -> compile + run on the JVM
 * The calls are plain CORS requests, so they work from GitHub Pages.
 * Request/response shapes follow the open-source kotlin-playground client
 * (Apache-2.0): files[{name,text,publicId}], confType "java", and a result
 * with { errors: { "File.kt": [...] }, text: "<outStream>..</outStream>",
 * exception }.
 *
 * Privacy note: the snippet text is sent to api.kotlinlang.org.
 */

export const KOTLIN_SERVER = 'https://api.kotlinlang.org';
const FALLBACK_VERSION = '2.2.20';
const FILE_NAME = 'File.kt';

let versionPromise = null;

/** Latest stable Kotlin compiler version offered by the service. */
export function getKotlinVersion() {
  if (!versionPromise) {
    versionPromise = fetch(`${KOTLIN_SERVER}/versions`)
      .then((response) => response.json())
      .then((list) => {
        const stable = list.find((item) => item.latestStable)
          || [...list].reverse().find((item) => !item.obsolete);
        return stable?.version || FALLBACK_VERSION;
      })
      .catch(() => {
        versionPromise = null; // retry next time (offline, blocked, ...)
        return FALLBACK_VERSION;
      });
  }
  return versionPromise;
}

async function post(path, code, signal, args = '') {
  const version = await getKotlinVersion();
  const response = await fetch(`${KOTLIN_SERVER}/api/${version}/compiler/${path}`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      args,
      files: [{ name: FILE_NAME, text: code, publicId: '' }],
      confType: 'java',
    }),
  });
  if (!response.ok) throw new Error(`Kotlin compiler service responded with HTTP ${response.status}`);
  return response.json();
}

/** The service HTML-escapes messages and program output. */
export function decodeEntities(text = '') {
  return String(text)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&');
}

function lineStartOffsets(code) {
  const starts = [0];
  for (let i = 0; i < code.length; i += 1) if (code[i] === '\n') starts.push(i + 1);
  return starts;
}

/** Convert the service's {line, ch} diagnostics (0-based) to editor offsets. */
function normalizeDiagnostics(raw, code) {
  const starts = lineStartOffsets(code);
  const toOffset = (pos) => {
    const lineStart = starts[Math.min(Math.max(pos?.line ?? 0, 0), starts.length - 1)];
    return Math.min(lineStart + (pos?.ch ?? 0), code.length);
  };
  return (raw || [])
    .filter((item) => item && item.message)
    .map((item) => {
      const from = toOffset(item.interval?.start);
      const to = Math.max(toOffset(item.interval?.end), from);
      return {
        from,
        to,
        severity: String(item.severity).toUpperCase() === 'ERROR' ? 'error' : 'warning',
        message: decodeEntities(item.message),
        line: (item.interval?.start?.line ?? 0) + 1,
        column: (item.interval?.start?.ch ?? 0) + 1,
      };
    });
}

/** Diagnostics for the editor squiggles (no execution). */
export async function highlightKotlin(code, signal) {
  const data = await post('highlight', code, signal);
  return normalizeDiagnostics(data?.[FILE_NAME], code);
}

/**
 * Turn "<outStream>..</outStream><errStream>..</errStream>" into output
 * lines. Adjacent chunks of the same stream are joined first, so `print()`
 * calls without a newline stay on one line.
 */
export function parseProgramOutput(text = '') {
  const segments = [];
  const add = (type, chunk) => {
    if (!chunk) return;
    const last = segments[segments.length - 1];
    if (last && last.type === type) last.text += chunk;
    else segments.push({ type, text: chunk });
  };

  const pattern = /<(outStream|errStream)>([\s\S]*?)<\/\1>/g;
  let cursor = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor && text.slice(cursor, match.index).trim()) add('log', text.slice(cursor, match.index));
    add(match[1] === 'errStream' ? 'error' : 'log', match[2]);
    cursor = pattern.lastIndex;
  }
  if (cursor < text.length && text.slice(cursor).trim()) add('log', text.slice(cursor));

  return segments.flatMap(({ type, text: chunk }) => {
    const decoded = decodeEntities(chunk).replace(/\r\n/g, '\n').replace(/\n$/, '');
    return decoded.split('\n').map((line) => ({ type, text: line }));
  });
}

function formatException(exception) {
  if (!exception) return [];
  const lines = [`${exception.fullName || 'Exception'}${exception.message ? `: ${decodeEntities(exception.message)}` : ''}`];
  (exception.stackTrace || []).slice(0, 8).forEach((frame) => {
    lines.push(`    at ${frame.className}.${frame.methodName}(${frame.fileName}:${frame.lineNumber})`);
  });
  return lines.map((text) => ({ type: 'error', text }));
}

/**
 * Compile and run on the JVM. `args` is the program-arguments string passed to
 * main(args); `displayName` is the editor's file name (e.g. Main.kt) used in
 * messages instead of the service's internal File.kt.
 * Returns { lines, hasErrors, diagnostics }: compiler errors
 * (File.kt:2:5: error: ...) when the code does not compile, otherwise warnings
 * followed by the program output. `diagnostics` (with editor offsets) lets the
 * editor underline the same problems.
 */
export async function runKotlin(code, signal, { args = '', displayName = FILE_NAME } = {}) {
  const data = await post('run', code, signal, args);
  // The service always sees "File.kt"; show the name of the file in the editor.
  const rename = (text) => String(text).replace(/FileKt/g, displayName.replace(/\.kt$/, 'Kt')).replace(/File\.kt/g, displayName);
  const all = Object.values(data?.errors || {}).flatMap((list) => normalizeDiagnostics(list, code));
  const errors = all.filter((item) => item.severity === 'error');
  const warnings = all.filter((item) => item.severity !== 'error');

  const format = (item) => `${displayName}:${item.line}:${item.column}: ${item.severity === 'error' ? 'error' : 'warning'}: ${item.message}`;

  if (errors.length > 0) {
    return { hasErrors: true, diagnostics: all, lines: errors.map((item) => ({ type: 'error', text: format(item) })) };
  }

  const lines = warnings.map((item) => ({ type: 'warn', text: format(item) }));
  const output = parseProgramOutput(data?.text || '').map((line) => ({ ...line, text: rename(line.text) }));
  const outputMentionsException = data?.exception?.fullName
    && output.some((line) => line.text.includes(data.exception.fullName));
  lines.push(...output);
  if (data?.exception && !outputMentionsException) lines.push(...formatException(data.exception).map((line) => ({ ...line, text: rename(line.text) })));
  return { hasErrors: false, diagnostics: all, lines };
}
