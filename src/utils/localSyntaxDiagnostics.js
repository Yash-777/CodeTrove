const grammarNames = { java: 'java', c: 'c', cpp: 'cpp', python: 'python' };
let parserApiPromise;
const parserCache = new Map();

function utf8ByteToUtf16Index(source, byteOffset) {
  let bytes = 0;
  let utf16 = 0;
  for (const character of source) {
    if (bytes >= byteOffset) break;
    const point = character.codePointAt(0);
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
    utf16 += character.length;
  }
  return utf16;
}

async function getParser(language) {
  const grammar = grammarNames[language];
  if (!grammar) return null;
  if (!parserApiPromise) {
    parserApiPromise = import('web-tree-sitter').then(async ({ Parser, Language }) => {
      const base = new URL(import.meta.env.BASE_URL, window.location.origin);
      await Parser.init({ locateFile: (fileName) => new URL(fileName, base).href });
      return { Parser, Language, base };
    }).catch((error) => {
      parserApiPromise = null;
      throw error;
    });
  }
  const api = await parserApiPromise;
  if (!parserCache.has(grammar)) {
    const promise = api.Language.load(new URL(`code-parsers/${grammar}.wasm`, api.base).href)
      .then((languageDefinition) => {
        const parser = new api.Parser();
        parser.setLanguage(languageDefinition);
        return parser;
      }).catch((error) => {
        parserCache.delete(grammar);
        throw error;
      });
    parserCache.set(grammar, promise);
  }
  return parserCache.get(grammar);
}

export async function getLocalSyntaxDiagnostics(language, source) {
  const parser = await getParser(language);
  if (!parser || !source.trim()) return [];
  const tree = parser.parse(source);
  const diagnostics = [];
  const visit = (node) => {
    if (diagnostics.length >= 30) return;
    if (node.isError || node.isMissing) {
      const from = utf8ByteToUtf16Index(source, node.startIndex);
      const to = Math.max(from + 1, utf8ByteToUtf16Index(source, node.endIndex));
      diagnostics.push({
        from,
        to: Math.min(to, source.length),
        severity: 'error',
        message: node.isMissing ? `Expected ${node.type}.` : `Unexpected ${node.type} syntax.`,
        source: 'Tree-sitter',
      });
      return;
    }
    for (const child of node.children) visit(child);
  };
  visit(tree.rootNode);
  tree.delete();
  return diagnostics;
}
