const FORMAT_RULES_SAMPLE = `{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100,
  "clangStyle": "Google",
  "pythonQuoteStyle": "double"
}`;

let prettierPromise;
let clangPromise;
let ruffPromise;

function loadPrettier() {
  if (!prettierPromise) {
    prettierPromise = Promise.all([
      import('prettier/standalone'),
      import('prettier/plugins/babel'),
      import('prettier/plugins/typescript'),
      import('prettier/plugins/estree'),
    ]).then(([prettier, babel, typescript, estree]) => ({
      format: prettier.format,
      babel: babel.default || babel,
      typescript: typescript.default || typescript,
      estree: estree.default || estree,
    })).catch((error) => {
      prettierPromise = null;
      throw error;
    });
  }
  return prettierPromise;
}

function loadClang() {
  if (!clangPromise) {
    clangPromise = import('@wasm-fmt/clang-format/vite').then(async (module) => {
      await module.default();
      return module;
    }).catch((error) => {
      clangPromise = null;
      throw error;
    });
  }
  return clangPromise;
}

function loadRuff() {
  if (!ruffPromise) {
    ruffPromise = import('@wasm-fmt/ruff_fmt/vite').then(async (module) => {
      await module.default();
      return module;
    }).catch((error) => {
      ruffPromise = null;
      throw error;
    });
  }
  return ruffPromise;
}

function formatKotlinIndentation(source, width) {
  const indent = ' '.repeat(width);
  let depth = 0;
  let inBlockComment = false;
  return source.split(/\r?\n/).map((rawLine) => {
    const line = rawLine.trim();
    if (!line) return '';
    const closesBlock = /^\}/.test(line);
    const lineDepth = Math.max(0, depth - (closesBlock ? 1 : 0));
    let quote = '';
    let escaped = false;
    let opens = 0;
    let closes = 0;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      if (inBlockComment) {
        if (char === '*' && next === '/') { inBlockComment = false; i += 1; }
        continue;
      }
      if (quote) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === quote) quote = '';
        continue;
      }
      if (char === '/' && next === '*') { inBlockComment = true; i += 1; continue; }
      if (char === '/' && next === '/') break;
      if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
      if (char === '{') opens += 1;
      else if (char === '}') closes += 1;
    }
    depth = Math.max(0, depth + opens - closes);
    return `${indent.repeat(lineDepth)}${line}`;
  }).join('\n') + (source.endsWith('\n') ? '\n' : '');
}

export function getSampleFormatRules() {
  return FORMAT_RULES_SAMPLE;
}

export async function formatSource(language, source, { indentWidth = 2, rulesText = FORMAT_RULES_SAMPLE } = {}) {
  if (!Number.isInteger(indentWidth) || indentWidth < 2 || indentWidth > 4) {
    throw new Error('Indent width must be 2, 3, or 4 spaces.');
  }
  let rules;
  try {
    rules = rulesText.trim() ? JSON.parse(rulesText) : {};
  } catch (error) {
    throw new Error(`Format rules must be valid JSON: ${error.message}`);
  }
  if (!rules || Array.isArray(rules) || typeof rules !== 'object') {
    throw new Error('Format rules must be a JSON object.');
  }
  const width = indentWidth;
  const common = {
    tabWidth: width,
    printWidth: Number.isInteger(rules.printWidth) ? rules.printWidth : 100,
    singleQuote: typeof rules.singleQuote === 'boolean' ? rules.singleQuote : true,
    semi: typeof rules.semi === 'boolean' ? rules.semi : true,
    trailingComma: ['all', 'es5', 'none'].includes(rules.trailingComma) ? rules.trailingComma : 'all',
  };

  if (language === 'javascript' || language === 'typescript') {
    const prettier = await loadPrettier();
    const parser = language === 'typescript' ? 'typescript' : 'babel';
    const plugins = language === 'typescript'
      ? [prettier.typescript, prettier.estree]
      : [prettier.babel, prettier.estree];
    return prettier.format(source, { ...common, parser, plugins });
  }

  if (language === 'java' || language === 'c' || language === 'cpp') {
    const clang = await loadClang();
    const filename = language === 'java' ? 'Main.java' : language === 'c' ? 'main.c' : 'main.cpp';
    const style = JSON.stringify({
      BasedOnStyle: ['LLVM', 'GNU', 'Google', 'Chromium', 'Microsoft', 'Mozilla', 'WebKit'].includes(rules.clangStyle) ? rules.clangStyle : 'Google',
      IndentWidth: width,
      ColumnLimit: Number.isInteger(rules.printWidth) ? rules.printWidth : 100,
    });
    return clang.format(source, filename, style);
  }

  if (language === 'python') {
    const ruff = await loadRuff();
    return ruff.format(source, 'main.py', {
      indent_style: 'space',
      indent_width: width,
      line_width: Number.isInteger(rules.printWidth) ? rules.printWidth : 100,
      quote_style: ['single', 'double', 'preserve'].includes(rules.pythonQuoteStyle) ? rules.pythonQuoteStyle : 'double',
      magic_trailing_comma: 'respect',
    });
  }

  if (language === 'kotlin') return formatKotlinIndentation(source, width);
  throw new Error(`No browser formatter is configured for ${language}.`);
}
