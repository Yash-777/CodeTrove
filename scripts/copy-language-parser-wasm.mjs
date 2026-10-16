import { mkdir, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = resolve(projectRoot, 'public', 'code-parsers');
await mkdir(destination, { recursive: true });

const copies = [
  [resolve(projectRoot, 'node_modules', 'web-tree-sitter', 'web-tree-sitter.wasm'), resolve(projectRoot, 'public', 'web-tree-sitter.wasm')],
  ...['java', 'c', 'cpp', 'python'].map((language) => [
    resolve(projectRoot, 'node_modules', '@repomix', 'tree-sitter-wasms', 'out', `tree-sitter-${language}.wasm`),
    resolve(destination, `${language}.wasm`),
  ]),
];

await Promise.all(copies.map(([source, target]) => copyFile(source, target)));
console.log(`Prepared ${copies.length - 1} language grammars and the tree-sitter runtime.`);
