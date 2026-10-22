import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const destination = join(projectRoot, 'public', 'sql-parsers');
const dialects = ['sqlite', 'mysql', 'postgresql', 'transactsql', 'mariadb'];

mkdirSync(destination, { recursive: true });
for (const dialect of dialects) {
  const source = require.resolve(`node-sql-parser/umd/${dialect}.umd.js`);
  copyFileSync(source, join(destination, `${dialect}.umd.js`));
}

console.log(`Prepared ${dialects.length} local SQL dialect parser assets in ${dirname(destination)}/sql-parsers.`);
