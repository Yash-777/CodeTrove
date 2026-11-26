// GitHub Pages serves this project below /, while local Vite serves
// it at /. Strip Vite's public/ source-directory prefix and resolve the asset
// against the configured base so the same Markdown works in both environments.
const BASE = "/CodeTrove/"; // or import.meta.env.BASE_URL in the real app
// JUST GitHub Pages base is '/CodeTrove/' else '/'
function resolveMarkdownImageSrc(src) {
  if (typeof src !== 'string') return src;

// const normalizedSrc = src.trim();
// if (!normalizedSrc || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(normalizedSrc)) {
//   return normalizedSrc;
// }
  // 1. Trim and convert Windows backslashes -> forward slashes
  let normalizedSrc = src.trim().replace(/\\/g, '/');

  // 2. Leave empty, hash, scheme (https:, data:, mailto:) and real
  //    protocol-relative URLs (//cdn.example.com/x.png) alone.
  //    "//svg/x.svg" has no dot in the first segment, so it is NOT external.
  if (
    !normalizedSrc ||
    /^(?:[a-z][a-z\d+.-]*:|#)/i.test(normalizedSrc) ||
    /^\/\/[^/]+\.[^/]+/.test(normalizedSrc)
  ) {
    return normalizedSrc;
  }

  // 3. Collapse leading repeated slashes: //svg/a.svg -> /svg/a.svg
  normalizedSrc = normalizedSrc.replace(/^\/{2,}/, '/');

  // const base = import.meta.env.BASE_URL || '/';
  // Works in Vite (BASE_URL) and in plain Node (falls back to your GitHub Pages base)
  const base = (
    (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || BASE // JUST GitHub Pages base is '/CodeTrove/' else '/'
  ).replace(/\/?$/, '/');
  console.log("resolveMarkdownImageSrcNew: base =", base);

// Base without leading/trailing slashes: "/CodeTrove/" -> "CodeTrove", "/" -> ""
const prefix = base.replace(/^\/+|\/+$/g, '');
// Already prefixed with the deploy base -> return it without the leading "/"
if (prefix && normalizedSrc.replace(/^\/+/, '').startsWith(prefix + '/')) {
  return normalizedSrc.replace(/^\/+/, '');
}
  // // Already prefixed with the deploy base (e.g. /svg/JVM.svg)
  // if (base !== '/' && normalizedSrc.startsWith(base)) {
  //   return normalizedSrc;
  // }

  // Strip Vite's public/ source prefix and any leading slashes or ./
  const publicPath = normalizedSrc
    .replace(/^\.?\/?public\//, '')
    .replace(/^\.?\/+/, '');

  // Root-relative, public/-prefixed, or a bare svg/... path -> resolve against base
  if (
    normalizedSrc.startsWith('/') ||
    publicPath !== normalizedSrc ||
    /^(svg|images?|assets)\//i.test(publicPath)
  ) {
    //return `${base.replace(/\/?$/, '/')}${publicPath}`;
    console.log("resolveMarkdownImageSrc: root-relative or public/ or bare asset folder, prefixing with base:", base, publicPath);
    // No leading "/" in the result
    return prefix ? `${prefix}/${publicPath}` : publicPath;
  }
console.log("resolveMarkdownImageSrc: genuinely relative path, leaving as is:", normalizedSrc);
  return normalizedSrc;
}

function resolveMarkdownImageSrcNew(src) {
  if (typeof src !== 'string') return src;

  // 1. Normalize Windows backslashes
  let s = src.trim().replace(/\\/g, '/');
  if (!s) return s;

  // 2. Leave real external / special URLs alone
  if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(s)) return s;       // https:, data:, mailto:, #hash
  if (/^\/\/[^/]+\.[^/]+/.test(s)) return s;                // //cdn.example.com/x.png

  // Vite base, always ending with a single "/" (e.g. "/")
  const base = (import.meta.env?.BASE_URL || '/').replace(/\/?$/, '/');
  console.log("resolveMarkdownImageSrcNew: base =", base);

  // Was this meant to be a site-root path?
  const startedAtRoot = /^[./]*\//.test(s) && /^(?:\.?\/)+/.test(s);

  // Strip leading ./ and / (any number)
  s = s.replace(/^(?:\.?\/+)+/, '');

  // Strip an already-present base (e.g. "CodeTrove/svg/x.svg")
  const baseNoSlashes = base.replace(/^\/|\/$/g, '');
  if (baseNoSlashes && (s === baseNoSlashes || s.startsWith(baseNoSlashes + '/'))) {
    s = s.slice(baseNoSlashes.length).replace(/^\/+/, '');
  }

  // Strip Vite's public/ source folder
  const hadPublic = /^public\//i.test(s);
  s = s.replace(/^public\//i, '');

  // Collapse accidental double slashes
  s = s.replace(/\/{2,}/g, '/');

  // Prefix base for root-relative, public/, or well-known asset folders
  if (startedAtRoot || hadPublic || /^(svg|images?|assets)\//i.test(s)) {
    return base + s;
  }

  return s; // genuinely relative path (e.g. "diagram.png") – leave as is
}

// Tests (with base = "/")
console.log("SVG:", resolveMarkdownImageSrc("\\svg\\java-source-to-output.svg"));
// -> /svg/java-source-to-output.svg
console.log("SVG:", resolveMarkdownImageSrc("//svg/jdk-jre-jvm-architecture.svg"));
// -> /svg/jdk-jre-jvm-architecture.svg
console.log("IMG:", resolveMarkdownImageSrc("/images/Java-OOP-Infographic@2x.png"));
// -> /images/Java-OOP-Infographic@2x.png
console.log("IMG:", resolveMarkdownImageSrc("/public/images/URL%20Structure%20Explained.png"));
// -> /images/URL%20Structure%20Explained.png
console.log("SVG:", resolveMarkdownImageSrc("/svg/JVM.svg"));
// -> /svg/JVM.svg (not double-prefixed)

console.log("SVG:", resolveMarkdownImageSrc("\svg\java-source-to-output.svg"));
//  \s -> s     \j -> j     (unknown escapes just drop the backslash)
// the function receives: "svgjava-source-to-output.svg"

// Use String.raw, which keeps backslashes exactly as typed:
console.log("SVG:", resolveMarkdownImageSrc(String.raw`\svg\java-source-to-output.svg`));
// -> SVG: /svg/java-source-to-output.svg

/*
There are three separate bugs behind your two broken URLs.

Backslashes: Windows-style \svg\... ends up in the URL as %5Csvg%5C.... Convert \ to / first. (In a JS string literal, "\svg\java" silently becomes "svgjava", so use / or \\ in your test strings.)
Double slash: CodeTrove//svg/... comes from a source like //svg/x.svg. Your ^\/\/ check treats it as a protocol-relative URL and returns it untouched. Only treat //host.tld/... as external, and collapse repeated slashes in everything else.
base is undefined: the const base = ... line is commented out. Uncomment it, but use ?. so it doesn’t crash outside Vite.
*/


// ---------------- Test harness ----------------
let passed = 0;
let failed = 0;

// Expected values are written as "/svg/a.svg" or "/CodeTrove/svg/a.svg".
// 1. If it doesn't start with BASE, prepend BASE
// 2. Then drop the leading "/" (the function returns paths without it)
function normalizeExpected(expected) {
  // Leave non-strings, empty strings, URLs, data URIs, #hash and
  // plain relative paths ("diagram.png") alone
  if (typeof expected !== 'string' || !expected) return expected;
  if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(expected)) return expected;
  if (/^\/\/[^/]+\.[^/]+/.test(expected)) return expected; // //cdn.example.com/x.png
  if (!expected.startsWith('/')) return expected;

  const withBase = expected.startsWith(BASE)
    ? expected
    : BASE + expected.replace(/^\/+/, '');

  return withBase.replace(/^\/+/, ''); // remove starting "/"
}

function test(name, input, expected) {
  const actual = resolveMarkdownImageSrc(input);
  const exp = normalizeExpected(expected);
  const ok = Object.is(actual, exp);
  ok ? passed++ : failed++;
  console.log(`${ok ? '✅ PASS' : '❌ FAIL'}  ${name}`);
  if (!ok) {
    console.log(`     input   : ${JSON.stringify(input)}`);
    console.log(`     expected: ${JSON.stringify(exp)}`);
    console.log(`     actual  : ${JSON.stringify(actual)}`);
  }
}

// --- Root-relative paths ---
test('root-relative svg',        '/svg/jdk-jre-jvm-architecture.svg',  '/svg/jdk-jre-jvm-architecture.svg');
test('root-relative png (@2x)',  '/images/Java-OOP-Infographic@2x.png', '/images/Java-OOP-Infographic@2x.png');
test('surrounding whitespace',   '  /svg/a.svg  ',                      '/svg/a.svg');

// --- public/ prefixes ---
test('/public/ prefix',          '/public/images/URL%20Structure%20Explained.png', '/images/URL%20Structure%20Explained.png');
test('public/ (no slash)',       'public/images/a.png',                '/images/a.png');
test('./public/ prefix',         './public/svg/a.svg',                 '/svg/a.svg');

// --- Bare / relative asset folders ---
test('bare svg/ path',           'svg/a.svg',                          '/svg/a.svg');
test('bare images/ path',        'images/a.png',                       '/images/a.png');
test('bare assets/ path',        'assets/a.png',                       '/assets/a.png');
test('./svg/ path',              './svg/a.svg',                        '/svg/a.svg');

// --- Already prefixed with base ---
test('already has base',         '/svg/JVM.svg',             '/svg/JVM.svg');
test('similar prefix, not base', '/CodeTroveX/a.png',                  '/CodeTroveX/a.png');

// --- Should be left alone ---
test('https URL',                'https://example.com/a.png',          'https://example.com/a.png');
test('http URL',                 'http://example.com/a.png',           'http://example.com/a.png');
test('data URI',                 'data:image/png;base64,AAAA',         'data:image/png;base64,AAAA');
test('hash link',                '#section',                           '#section');
test('protocol-relative CDN',    '//cdn.example.com/a.png',            '//cdn.example.com/a.png');
test('plain relative file',      'diagram.png',                        'diagram.png');
test('empty string',             '',                                   '');
test('whitespace only',          '   ',                                '');
test('undefined',                undefined,                            undefined);
test('null',                     null,                                 null);
test('number',                   42,                                   42);

// --- Windows backslashes (String.raw keeps the backslashes) ---
test('backslash path',           String.raw`\svg\java-source-to-output.svg`, '/svg/java-source-to-output.svg');
test('backslash public path',    String.raw`\public\images\a.png`,     '/images/a.png');

// --- Double slash typo ---
test('double slash //svg/...',   '//svg/jdk-jre-jvm-architecture.svg', '/svg/jdk-jre-jvm-architecture.svg');

console.log(`\nResult: ${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;