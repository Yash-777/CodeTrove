import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { decompileClassFile } from '@jar-analyzer/jsd';
import { unzipSync } from 'fflate';
import {
  describeJavaVersion,
  javaVersionFromClassBytes,
  readClassMajorVersion,
  safeJavaSourcePath,
} from '../src/utils/javaDecompiler.js';

const root = process.cwd();
const sampleRoot = resolve(root, 'public/examples/java-decompiler');
const versions = [8, 11, 17, 21];
const expectedMajors = new Map([[8, 52], [11, 55], [17, 61], [21, 65]]);

for (const version of versions) {
  const bytes = new Uint8Array(await readFile(resolve(sampleRoot, `java${version}/Java${version}Sample.class`)));
  assert.equal(readClassMajorVersion(bytes), expectedMajors.get(version), `Java ${version} class-file major`);
  assert.equal(javaVersionFromClassBytes(bytes), `Java ${version}`, `Java ${version} version label`);
  const result = decompileClassFile(bytes);
  assert.equal(typeof result.source, 'string', `Java ${version} source result`);
  assert.match(result.source, new RegExp(`Java${version}Sample`), `Java ${version} class name recovered`);
}

const jarBytes = new Uint8Array(await readFile(resolve(sampleRoot, 'java-samples.jar')));
const jarEntries = unzipSync(jarBytes);
const classEntries = Object.entries(jarEntries).filter(([path]) => path.endsWith('.class'));
assert.equal(classEntries.length, 4, 'sample JAR includes one class for each Java release');
for (const [path, bytes] of classEntries) {
  const output = decompileClassFile(bytes);
  assert.ok(output.source.includes(path.split('/').pop().replace('.class', '')), `${path} decompiles`);
}

assert.equal(describeJavaVersion(69), 'Java 25');
assert.equal(describeJavaVersion(70), 'Java 26 (newer than the bundled engine’s verified range)');
assert.throws(() => readClassMajorVersion(new Uint8Array([1, 2, 3])), /not a valid Java/);
assert.equal(safeJavaSourcePath('../../pkg\\Sample.class'), 'pkg/Sample.java');
assert.equal(safeJavaSourcePath('module-info.class'), 'module-info.java');

const router = await readFile(resolve(root, 'src/App.jsx'), 'utf8');
const registry = await readFile(resolve(root, 'src/data/topics/index.js'), 'utf8');
assert.match(router, /path="\/build\/tools\/java-decompiler" element=\{<JavaDecompilerPage \/>\}/);
assert.match(registry, /name: 'Java Decompiler'.*internalTool: 'java-decompiler'/);

const workerMessages = [];
globalThis.self = { postMessage: (message) => workerMessages.push(message) };
await import('../src/workers/javaDecompiler.worker.js');
const workerHandler = globalThis.self.onmessage;
await workerHandler({ data: { type: 'decompile', id: 1, files: [], archive: jarBytes.buffer } });
const jarResponse = workerMessages.find((message) => message.id === 1 && message.type === 'result');
assert.ok(jarResponse, 'worker decompiles a JAR archive');
assert.equal(jarResponse.results.length, 4);
workerMessages.length = 0;
const java8Bytes = new Uint8Array(await readFile(resolve(sampleRoot, 'java8/Java8Sample.class')));
await workerHandler({ data: { type: 'decompile', id: 2, files: [{ name: 'Java8Sample.class', bytes: java8Bytes.buffer }] } });
const classResponse = workerMessages.find((message) => message.id === 2 && message.type === 'result');
assert.ok(classResponse, 'worker decompiles a standalone class file');
assert.equal(classResponse.results[0].javaVersion, 'Java 8');

console.log('Java Decompiler tests passed: Java 8/11/17/21 fixtures, class/JAR decompilation, safe paths, and route/card registration.');
