import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const sourceMapArg = args.find((arg) => /^generate_sourcemap=(true|false)$/i.test(arg));
const generateSourceMap = sourceMapArg ? sourceMapArg.split('=')[1].toLowerCase() === 'true' : true;
const viteArgs = ['--config', path.join(root, 'vite.config.js')];

if (sourceMapArg) {
  process.env.VITE_GENERATE_SOURCEMAP = String(generateSourceMap);
}
console.info(`[CodeTrove] Starting Vite with local test authentication; source maps ${generateSourceMap ? 'enabled' : 'disabled'} for configured transforms/builds.`);

const viteBin = process.platform === 'win32' ? 'vite.cmd' : 'vite';
const child = spawn(viteBin, viteArgs, { cwd: root, env: process.env, stdio: 'inherit', shell: process.platform === 'win32' });
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
