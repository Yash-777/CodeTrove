import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const testMode = args.some((arg) => arg === 'test' || arg === '--mode=test');
const sourceMapArg = args.find((arg) => /^generate_sourcemap=(true|false)$/i.test(arg));
const generateSourceMap = sourceMapArg ? sourceMapArg.split('=')[1].toLowerCase() === 'true' : true;
const viteArgs = ['--config', path.join(root, 'vite.config.js'), ...(testMode ? ['--mode', 'test'] : [])];

if (sourceMapArg) {
  process.env.VITE_GENERATE_SOURCEMAP = String(generateSourceMap);
}
if (testMode) {
  process.env.CODETROVE_TEST_AUTH = 'true';
  console.warn('[CodeTrove] TEST AUTH MODE: CSV users are local UI fixtures only; never use these credentials in production.');
}
console.info(`[CodeTrove] Starting Vite (${testMode ? 'test' : 'Firebase'} auth mode); source maps ${generateSourceMap ? 'enabled' : 'disabled'} for configured transforms/builds.`);

const viteBin = process.platform === 'win32' ? 'vite.cmd' : 'vite';
const child = spawn(viteBin, viteArgs, { cwd: root, env: process.env, stdio: 'inherit', shell: process.platform === 'win32' });
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
