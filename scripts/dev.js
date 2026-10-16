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

// Invoke Vite's JavaScript CLI through the current Node executable instead of
// spawning `vite.cmd` through a shell. This works from PowerShell, cmd.exe,
// Git Bash, and npm because it does not depend on shell PATH/batch-file rules.
const viteCli = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const child = spawn(process.execPath, [viteCli, ...viteArgs], { cwd: root, env: process.env, stdio: 'inherit', shell: false });
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
