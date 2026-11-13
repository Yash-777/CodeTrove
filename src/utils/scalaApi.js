/**
 * Browser client for the public Scastie Scala playground.
 *
 * Scastie accepts an SbtInputs payload, then streams SnippetProgress
 * records over Server-Sent Events. The editor keeps the transport details
 * here so RunnableCode can present Scala like the other remote compilers.
 */
export const SCALA_SERVER = 'https://scastie.scala-lang.org';
export const SCALA_DOCS = 'https://scala-lang.org/';
export const DEFAULT_SCALA_VERSION = '3.7.3';
export const SCALA_FILE_NAME = 'Main.scala';
const DEFAULT_SBT_CONFIG_EXTRA = `scalacOptions ++= Seq(
  "-deprecation",
  "-encoding", "UTF-8",
  "-feature",
  "-unchecked"
)`;
const DEFAULT_SBT_PLUGINS_CONFIG = 'addSbtPlugin("org.scastie" % "sbt-scastie" % "1.0.0-SNAPSHOT")';

function lineStartOffsets(code) {
  const starts = [0];
  for (let i = 0; i < code.length; i += 1) if (code[i] === '\n') starts.push(i + 1);
  return starts;
}

function diagnosticsFrom(progress, code) {
  const starts = lineStartOffsets(code);
  const diagnostics = [];
  (progress?.compilationInfos || []).forEach((item) => {
    const line = Math.max(1, Number(item.line || 1));
    const column = Math.max(1, Number(item.startColumn || 1));
    const endColumn = Math.max(column, Number(item.endColumn || column));
    const lineStart = starts[Math.min(line - 1, starts.length - 1)];
    const from = Math.min(lineStart + column - 1, code.length);
    diagnostics.push({
      from,
      to: Math.min(Math.max(from + 1, lineStart + endColumn - 1), code.length),
      severity: String(item.severity || '').toLowerCase().includes('warning') ? 'warning' : 'error',
      message: String(item.message || 'Scala compiler diagnostic'),
      line,
      column,
    });
  });
  return diagnostics;
}

function outputLines(progress) {
  const lines = [];
  const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);
  const add = (type, output) => {
    if (!output) return;
    const text = typeof output === 'string' ? output : output.line;
    if (text === undefined || text === null) return;
    String(text).replace(/\r\n/g, '\n').split('\n').forEach((line) => {
      if (line !== '') lines.push({ type, text: line });
    });
  };
  asList(progress?.buildOutput).forEach((output) => add('error', output));
  asList(progress?.userOutput).forEach((output) => {
    const kind = typeof output?.tpe === 'string' && output.tpe.toLowerCase().includes('err') ? 'error' : 'log';
    add(kind, output);
  });
  (progress?.compilationInfos || []).forEach((item) => {
    const severity = String(item.severity || '').toLowerCase();
    add(severity.includes('warning') ? 'warn' : 'error', `${SCALA_FILE_NAME}:${item.line || 1}:${item.startColumn || 1}: ${item.message || ''}`);
  });
  if (progress?.runtimeError) {
    add('error', progress.runtimeError.message || 'Scala runtime error');
    if (progress.runtimeError.fullStack) add('error', progress.runtimeError.fullStack);
  }
  if (progress?.isTimeout) add('error', 'Scastie terminated the run because it exceeded the execution limit.');
  if (progress?.isSbtError && lines.length === 0) add('error', 'Scastie could not build the Scala project.');
  return lines;
}

export function buildScalaRequest(code, scalaVersion = DEFAULT_SCALA_VERSION) {
  return {
    SbtInputs: {
      isWorksheetMode: true,
      code,
      target: { Scala3: { scalaVersion } },
      libraries: [],
      librariesFromList: [],
      sbtConfigExtra: DEFAULT_SBT_CONFIG_EXTRA,
      sbtConfigSaved: `scalaVersion := "${scalaVersion}"\nlibraryDependencies += "org.scastie" %% "runtime-scala" % "1.0.0-SNAPSHOT"`,
      sbtPluginsConfigExtra: '',
      sbtPluginsConfigSaved: DEFAULT_SBT_PLUGINS_CONFIG,
      isShowingInUserProfile: false,
      forked: null,
    },
  };
}

/** Compile and run Scala in Scastie; returns the RunnableCode result shape. */
export function runScala(code, signal, { version = DEFAULT_SCALA_VERSION } = {}) {
  return new Promise((resolve, reject) => {
    let stream;
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', abort);
      stream?.close();
      resolve(value);
    };
    const abort = () => {
      stream?.close();
      if (!settled) {
        settled = true;
        reject(new DOMException('The Scala run was cancelled.', 'AbortError'));
      }
    };
    signal?.addEventListener('abort', abort, { once: true });
    fetch(`${SCALA_SERVER}/api/run`, {
      method: 'POST',
      signal,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(buildScalaRequest(code, version)),
    }).then(async (response) => {
      if (!response.ok) throw new Error(`Scastie responded with HTTP ${response.status}`);
      const snippet = await response.json();
      const id = snippet?.base64UUID;
      if (!id) throw new Error('Scastie did not return a snippet identifier.');
      stream = new EventSource(`${SCALA_SERVER}/api/progress-sse/${encodeURIComponent(id)}`);
      let latest = null;
      stream.onmessage = (event) => {
        try {
          latest = JSON.parse(event.data);
          if (latest?.isDone) {
            const diagnostics = diagnosticsFrom(latest, code);
            finish({
              hasErrors: diagnostics.some((item) => item.severity === 'error') || Boolean(latest.isSbtError || latest.runtimeError || latest.isTimeout),
              diagnostics,
              lines: outputLines(latest),
            });
          }
        } catch (error) {
          finish({ hasErrors: true, diagnostics: [], lines: [{ type: 'error', text: `Invalid Scastie response: ${error.message}` }] });
        }
      };
      stream.onerror = () => {
        if (!settled) finish({ hasErrors: true, diagnostics: [], lines: [{ type: 'error', text: 'Scastie closed the compiler stream before returning a result.' }] });
      };
    }).catch((error) => {
      if (settled || error?.name === 'AbortError') return;
      reject(error);
    });
  });
}
