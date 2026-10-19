import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const MAX_ROWS_PER_RESULT = 200;
let SQLModule;
let database;

async function ensureDatabase() {
  if (!SQLModule) {
    SQLModule = await initSqlJs({ locateFile: () => sqlWasmUrl });
  }
  if (!database) database = new SQLModule.Database();
  return database;
}

self.onmessage = async ({ data }) => {
  const { type, id, sql: source } = data;

  try {
    if (type === 'init') {
      const db = await ensureDatabase();
      const version = db.exec('SELECT sqlite_version()')[0]?.values?.[0]?.[0] || '';
      self.postMessage({ type: 'ready', id, version });
      return;
    }

    if (type === 'reset') {
      const db = await ensureDatabase();
      db.close();
      database = new SQLModule.Database();
      self.postMessage({ type: 'reset', id });
      return;
    }

    if (type === 'run') {
      const db = await ensureDatabase();
      const resultSets = db.exec(source).map((result) => ({
        columns: result.columns,
        rows: result.values.slice(0, MAX_ROWS_PER_RESULT),
        totalRows: result.values.length,
        truncated: result.values.length > MAX_ROWS_PER_RESULT,
      }));
      self.postMessage({ type: 'result', id, resultSets });
    }
  } catch (error) {
    self.postMessage({ type: 'error', id, message: error instanceof Error ? error.message : String(error) });
  }
};
