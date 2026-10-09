/**
 * src/utils/tsCompiler.js
 * ------------------------------------------------------------------
 * In-browser TypeScript type-checking + transpiling for runnable
 * ```ts runnable``` code boxes (no server needed - works on GitHub
 * Pages).
 *
 * - The `typescript` package (Apache-2.0) is loaded with a dynamic
 *   import, so it is a separate lazy chunk that is only downloaded the
 *   first time a TypeScript box is shown.
 * - TypeScript needs its standard library typings (lib.*.d.ts) to know
 *   what `string`, `Array`, `Promise` ... are. They are bundled lazily
 *   by Vite (import.meta.glob ?raw) instead of being fetched from a CDN.
 * - Only ES libs are loaded (no DOM), so snippets are checked against the
 *   same environment they run in (a Web Worker with console + timers).
 */

const libLoaders = import.meta.glob(
  '/node_modules/typescript/lib/lib.{es5,es2015*,es2016*,es2017*,es2018*,es2019*,es2020*,decorators*}.d.ts',
  { query: '?raw', import: 'default' }
);

/* Typings for the few globals the runner provides. */
const GLOBALS_D_TS = `
interface ConsoleLike {
  log(...data: any[]): void;
  info(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
}
declare var console: ConsoleLike;
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearTimeout(id: number | undefined): void;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearInterval(id: number | undefined): void;
declare function structuredClone<T>(value: T): T;
`;

const MAIN_FILE = 'main.ts';
const GLOBALS_FILE = 'globals.d.ts';

let tsPromise = null;
const libSourceCache = new Map(); // fileName -> SourceFile (parsed once, reused)

async function loadTypeScript() {
  if (!tsPromise) {
    tsPromise = (async () => {
      const [tsModule, libEntries] = await Promise.all([
        import('typescript'),
        Promise.all(
          Object.entries(libLoaders).map(async ([path, load]) => [path.split('/').pop(), await load()])
        ),
      ]);
      const ts = tsModule.default || tsModule;
      return { ts, libs: new Map(libEntries) };
    })();
    tsPromise.catch(() => { tsPromise = null; }); // allow retry after a network failure
  }
  return tsPromise;
}

/** Start downloading the compiler early (e.g. when a TS box mounts). */
export function preloadTypeScript() {
  return loadTypeScript();
}

const OPTIONS = (ts) => ({
  target: ts.ScriptTarget.ES2020,
  lib: ['lib.es2020.d.ts'],
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  types: [],
  noResolve: true,
});

/**
 * Type-check `code` and transpile it to JavaScript.
 * Returns { diagnostics, js } - `js` is only meaningful when there are
 * no error diagnostics.
 *
 * diagnostics: [{ from, to, line, column, code, message }] (0-based
 * offsets for the editor, 1-based line/column like the tsc CLI).
 */
export async function compileTypeScript(code) {
  const { ts, libs } = await loadTypeScript();

  // Appending `export {};` makes the file a module: top-level names never
  // clash with globals and top-level `await` is allowed. It is added at the
  // END, so every reported position still matches the user's text.
  const checkedText = `${code}\nexport {};\n`;
  const options = OPTIONS(ts);

  const files = new Map([
    [MAIN_FILE, checkedText],
    [GLOBALS_FILE, GLOBALS_D_TS],
  ]);

  const host = {
    getSourceFile(fileName, languageVersion) {
      const base = fileName.split('/').pop();
      if (files.has(base)) {
        return ts.createSourceFile(base, files.get(base), languageVersion, true);
      }
      if (libs.has(base)) {
        if (!libSourceCache.has(base)) {
          libSourceCache.set(base, ts.createSourceFile(base, libs.get(base), languageVersion, false));
        }
        return libSourceCache.get(base);
      }
      return undefined;
    },
    getDefaultLibFileName: () => 'lib.es2020.d.ts',
    getDefaultLibLocation: () => '',
    writeFile: () => {},
    getCurrentDirectory: () => '',
    getDirectories: () => [],
    getCanonicalFileName: (name) => name,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    fileExists: (name) => files.has(name.split('/').pop()) || libs.has(name.split('/').pop()),
    readFile: (name) => files.get(name.split('/').pop()) ?? libs.get(name.split('/').pop()),
  };

  const program = ts.createProgram([MAIN_FILE, GLOBALS_FILE], options, host);
  const raw = [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ];

  const sourceFile = program.getSourceFile(MAIN_FILE);
  const diagnostics = raw
    .filter((d) => d.file && d.file.fileName.endsWith(MAIN_FILE) && d.category === ts.DiagnosticCategory.Error)
    .map((d) => {
      const start = Math.min(d.start ?? 0, code.length);
      const end = Math.min(start + Math.max(d.length ?? 1, 1), Math.max(code.length, start));
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(d.start ?? 0);
      return {
        from: start,
        to: Math.max(end, start),
        line: line + 1,
        column: character + 1,
        code: d.code,
        message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
      };
    });

  let js = '';
  if (diagnostics.length === 0) {
    js = ts.transpileModule(code, {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, isolatedModules: true },
    }).outputText;
  }

  return { diagnostics, js };
}

/** "main.ts(2,1): error TS2322: Type 'string' is not assignable to type 'number'." */
export function formatDiagnostic(d) {
  return `${MAIN_FILE}(${d.line},${d.column}): error TS${d.code}: ${d.message}`;
}
