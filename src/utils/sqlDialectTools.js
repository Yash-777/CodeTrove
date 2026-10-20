const DIALECTS = {
  sqlite: {
    id: 'sqlite',
    label: 'SQLite',
    parserModule: 'sqlite',
    parserDatabase: 'Sqlite',
    formatterLanguage: 'sqlite',
    execution: 'local',
  },
  mysql: {
    id: 'mysql',
    label: 'MySQL',
    parserModule: 'mysql',
    parserDatabase: 'MySQL',
    formatterLanguage: 'mysql',
    execution: 'syntax-only',
  },
  postgresql: {
    id: 'postgresql',
    label: 'PostgreSQL',
    parserModule: 'postgresql',
    parserDatabase: 'Postgresql',
    formatterLanguage: 'postgresql',
    execution: 'syntax-only',
  },
  sqlserver: {
    id: 'sqlserver',
    label: 'Microsoft SQL Server (T-SQL)',
    parserModule: 'transactsql',
    parserDatabase: 'TransactSQL',
    formatterLanguage: 'transactsql',
    execution: 'syntax-only',
  },
  mariadb: {
    id: 'mariadb',
    label: 'MariaDB',
    parserModule: 'mariadb',
    parserDatabase: 'MariaDB',
    formatterLanguage: 'mariadb',
    execution: 'syntax-only',
  },
};

export const SQL_DIALECTS = Object.values(DIALECTS);
export const DEFAULT_SQL_DIALECT = 'sqlite';

const RULES_BY_DIALECT = {
  sqlite: {
    keywordCase: 'upper',
    dataTypeCase: 'upper',
    functionCase: 'preserve',
    linesBetweenQueries: 1,
    logicalOperatorNewline: 'before',
  },
  mysql: {
    keywordCase: 'upper',
    dataTypeCase: 'upper',
    functionCase: 'upper',
    linesBetweenQueries: 1,
    logicalOperatorNewline: 'before',
  },
  postgresql: {
    keywordCase: 'upper',
    dataTypeCase: 'upper',
    functionCase: 'upper',
    identifierCase: 'preserve',
    linesBetweenQueries: 1,
    logicalOperatorNewline: 'before',
  },
  sqlserver: {
    keywordCase: 'upper',
    dataTypeCase: 'upper',
    functionCase: 'upper',
    identifierCase: 'preserve',
    linesBetweenQueries: 1,
    logicalOperatorNewline: 'before',
  },
  mariadb: {
    keywordCase: 'upper',
    dataTypeCase: 'upper',
    functionCase: 'upper',
    linesBetweenQueries: 1,
    logicalOperatorNewline: 'before',
  },
};

const parserPromises = new Map();
let parserLoadQueue = Promise.resolve();
let formatterPromise;

export function getSqlDialect(dialectId) {
  return DIALECTS[dialectId] || DIALECTS[DEFAULT_SQL_DIALECT];
}

export function getSampleSqlFormatRules(dialectId) {
  return JSON.stringify(RULES_BY_DIALECT[dialectId] || RULES_BY_DIALECT[DEFAULT_SQL_DIALECT], null, 2);
}

function parseRules(rulesText) {
  let rules;
  try {
    rules = rulesText.trim() ? JSON.parse(rulesText) : {};
  } catch (error) {
    throw new Error(`Format rules must be valid JSON: ${error.message}`);
  }
  if (!rules || Array.isArray(rules) || typeof rules !== 'object') {
    throw new Error('Format rules must be a JSON object.');
  }

  const result = {};
  for (const key of ['keywordCase', 'dataTypeCase', 'functionCase', 'identifierCase']) {
    if (rules[key] !== undefined) {
      if (!['upper', 'lower', 'preserve'].includes(rules[key])) {
        throw new Error(`${key} must be "upper", "lower", or "preserve".`);
      }
      result[key] = rules[key];
    }
  }
  if (rules.linesBetweenQueries !== undefined) {
    if (!Number.isInteger(rules.linesBetweenQueries) || rules.linesBetweenQueries < 0 || rules.linesBetweenQueries > 4) {
      throw new Error('linesBetweenQueries must be an integer from 0 to 4.');
    }
    result.linesBetweenQueries = rules.linesBetweenQueries;
  }
  if (rules.logicalOperatorNewline !== undefined) {
    if (!['before', 'after'].includes(rules.logicalOperatorNewline)) {
      throw new Error('logicalOperatorNewline must be "before" or "after".');
    }
    result.logicalOperatorNewline = rules.logicalOperatorNewline;
  }
  if (rules.expressionWidth !== undefined) {
    if (!Number.isInteger(rules.expressionWidth) || rules.expressionWidth < 20 || rules.expressionWidth > 200) {
      throw new Error('expressionWidth must be an integer from 20 to 200.');
    }
    result.expressionWidth = rules.expressionWidth;
  }
  if (rules.useTabs !== undefined) {
    if (typeof rules.useTabs !== 'boolean') throw new Error('useTabs must be true or false.');
    result.useTabs = rules.useTabs;
  }
  if (rules.denseOperators !== undefined) {
    if (typeof rules.denseOperators !== 'boolean') throw new Error('denseOperators must be true or false.');
    result.denseOperators = rules.denseOperators;
  }
  if (rules.newlineBeforeSemicolon !== undefined) {
    if (typeof rules.newlineBeforeSemicolon !== 'boolean') throw new Error('newlineBeforeSemicolon must be true or false.');
    result.newlineBeforeSemicolon = rules.newlineBeforeSemicolon;
  }
  return result;
}

async function loadFormatter() {
  if (!formatterPromise) {
    formatterPromise = import('sql-formatter').then((module) => module.format).catch((error) => {
      formatterPromise = null;
      throw error;
    });
  }
  return formatterPromise;
}

async function loadParser(dialectId) {
  const dialect = getSqlDialect(dialectId);
  if (!parserPromises.has(dialect.id)) {
    const promise = parserLoadQueue.then(() => new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `${import.meta.env.BASE_URL}sql-parsers/${dialect.parserModule}.umd.js`;
      script.dataset.sqlDialectParser = dialect.id;
      script.onload = () => {
        const Parser = window.Parser;
        if (typeof Parser !== 'function') {
          reject(new Error(`Could not load the ${dialect.label} SQL parser.`));
          return;
        }
        try {
          resolve(new Parser());
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = () => reject(new Error(`Could not download the local ${dialect.label} parser asset.`));
      document.head.appendChild(script);
    })).catch((error) => {
      parserPromises.delete(dialect.id);
      throw error;
    });
    parserLoadQueue = promise.catch(() => {});
    parserPromises.set(dialect.id, promise);
  }
  return parserPromises.get(dialect.id);
}

function getErrorDiagnostic(error, source, dialect) {
  const location = error?.location?.start;
  const length = source.length;
  const reportedOffset = Number.isInteger(location?.offset) ? location.offset : Math.max(0, length - 1);
  const from = Math.max(0, Math.min(reportedOffset >= length && length > 0 ? length - 1 : reportedOffset, length));
  const endOffset = error?.location?.end?.offset;
  const to = Math.min(length, Math.max(from + (length > 0 ? 1 : 0), Number.isInteger(endOffset) ? endOffset : from + 1));
  const line = Number.isInteger(location?.line) ? location.line : 1;
  const column = Number.isInteger(location?.column) ? location.column : from + 1;
  const found = error?.found;
  const token = found === undefined || found === null ? '' : ` ${JSON.stringify(String(found))}`;
  const message = found === undefined || found === null
    ? `${dialect.label} SQL syntax: ${String(error?.message || 'could not parse statement').split('\n')[0].slice(0, 220)}`
    : `Unexpected ${token.trim()} in ${dialect.label} SQL.`;

  return {
    from,
    to,
    severity: 'error',
    message,
    source: `${dialect.label} syntax`,
    line,
    column,
  };
}

export async function getSqlSyntaxDiagnostics(source, dialectId) {
  if (!source.trim()) return [];
  const dialect = getSqlDialect(dialectId);
  const parser = await loadParser(dialect.id);
  try {
    parser.astify(source, {
      database: dialect.parserDatabase,
      parseOptions: { includeLocations: true },
    });
    return [];
  } catch (error) {
    return [getErrorDiagnostic(error, source, dialect)];
  }
}

export async function formatSqlSource(source, dialectId, { indentWidth = 2, rulesText } = {}) {
  if (!Number.isInteger(indentWidth) || indentWidth < 2 || indentWidth > 4) {
    throw new Error('Indent width must be 2, 3, or 4 spaces.');
  }
  const dialect = getSqlDialect(dialectId);
  const rules = parseRules(rulesText ?? getSampleSqlFormatRules(dialect.id));
  const format = await loadFormatter();
  return format(source, {
    language: dialect.formatterLanguage,
    tabWidth: indentWidth,
    ...rules,
  });
}
