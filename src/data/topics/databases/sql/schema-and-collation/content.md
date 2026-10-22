# Inspect schema, character sets, and collations

When a query behaves unexpectedly, begin by inspecting what the database actually knows about a table. A column declaration, an index, a table default, and a comparison rule are related, but they are not the same thing. This lesson uses an `Employees` table to inspect those layers safely and to compare metadata between databases.

> **Scope:** The main walkthrough is **MySQL**. Every engine-specific command below is labeled. MariaDB is similar for many `SHOW` and `INFORMATION_SCHEMA` examples, but it is not interchangeable with MySQL in every version or default. SQLite and SQL Server use different metadata interfaces and have different charset/collation models.

## 1. Confirm the engine and version first

### MySQL

```sql
-- MySQL: returns the server's version string.
SELECT VERSION();
```

The result is important context for later examples: available collations, `EXPLAIN ANALYZE` behavior, metadata details, and defaults can vary by release. Record the complete value rather than assuming that a client label such as “MySQL” identifies one exact server version.

### MariaDB

```sql
-- MariaDB: also supports VERSION(), but its version string identifies MariaDB.
SELECT VERSION();
```

Do not infer that a MySQL 8.x feature or collation name exists on the MariaDB server just because both products accept many of the same statements.

### SQLite

```sql
-- SQLite: this is SQLite's version function, not MySQL VERSION().
SELECT sqlite_version();
```

### SQL Server

```sql
-- SQL Server: the following returns the product version text.
SELECT @@VERSION;
```

The four statements are not portable substitutes; use the one for the engine you are connected to.

## 2. A small Employees schema to inspect

The following definition is intentionally explicit about the table defaults. A column can override those defaults, so inspection is still necessary after reading the `CREATE TABLE` statement.

### MySQL / MariaDB

```sql
-- MySQL / MariaDB: creates a UTF-8 table with an explicit comparison rule.
CREATE TABLE Employees (
    Id         INT NOT NULL AUTO_INCREMENT,
    Name       VARCHAR(50) NOT NULL,
    Email      VARCHAR(254) NOT NULL,
    Department VARCHAR(50) NULL,
    CONSTRAINT pk_employees PRIMARY KEY (Id),
    CONSTRAINT uq_employees_email UNIQUE (Email),
    KEY ix_employees_department (Department)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
```

`PRIMARY KEY` makes `Id` the row identifier for an InnoDB clustered index. The unique constraint makes duplicate `Email` values unacceptable (subject to the engine's `NULL` rules; this example declares it `NOT NULL`). `Department` has a nonunique index, so repeated department values are allowed. InnoDB secondary-index records contain the primary-key value used to reach the clustered record. [2]

The statement is an example, not a recommendation to use this exact collation in every new system. Choose a collation that matches the application's language, case, accent, and sorting requirements, and test equality and ordering with representative data.

### SQLite

SQLite does not implement MySQL's `ENGINE`, `CHARACTER SET`, `COLLATE`-at-table-default, or `AUTO_INCREMENT` semantics. A comparable SQLite schema must be written in SQLite syntax, for example:

```sql
-- SQLite: separate dialect; INTEGER PRIMARY KEY has special rowid behavior.
CREATE TABLE Employees (
    Id         INTEGER PRIMARY KEY,
    Name       TEXT NOT NULL,
    Email      TEXT NOT NULL UNIQUE,
    Department TEXT
);
CREATE INDEX ix_employees_department ON Employees(Department);
```

SQLite has named collations such as `BINARY`, `NOCASE`, and `RTRIM` in its core, and applications can register more. A `COLLATE` clause belongs on an expression or column definition; there is no MySQL-style database character-set default. SQLite indexes are B-trees, and the query planner can choose a scan or an index search based on the available index and statistics. [6]

### SQL Server

```sql
-- SQL Server: explicitly labeled; syntax and type names differ from MySQL.
CREATE TABLE dbo.Employees (
    Id         int IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Employees PRIMARY KEY,
    Name       nvarchar(50) NOT NULL,
    Email      nvarchar(254) NOT NULL
        CONSTRAINT UQ_Employees_Email UNIQUE,
    Department nvarchar(50) NULL
);
CREATE INDEX IX_Employees_Department ON dbo.Employees(Department);
```

SQL Server uses collations at the server, database, column, or expression level. `nvarchar` stores Unicode text; it is not a MySQL `VARCHAR` alias. A SQL Server collation can encode sensitivity choices such as case or accent sensitivity, but the exact name and behavior come from that SQL Server installation.

## 3. `DESCRIBE`: a quick column-level view

### MySQL / MariaDB

```sql
-- MySQL / MariaDB: DESCRIBE is a metadata statement for one table.
DESCRIBE Employees;

-- Equivalent MySQL spelling:
SHOW COLUMNS FROM Employees;
```

Typical output contains `Field`, `Type`, `Null`, `Key`, `Default`, and `Extra`. It is a useful first pass, but it is not a complete schema dump: it does not show every index column in order, every constraint option, or all table options.

For a durable inspection report, query `INFORMATION_SCHEMA.COLUMNS`, which exposes positions, data types, character and byte lengths, character set, nullability, defaults, `COLUMN_KEY`, and extra/generated-column metadata. [1]

### SQLite

```sql
-- SQLite: no DESCRIBE statement. PRAGMA is SQLite-specific.
PRAGMA table_info('Employees');
PRAGMA table_xinfo('Employees'); -- includes hidden/generated columns when supported
```

`PRAGMA table_info` reports ordinary columns but is not a MySQL-compatible result shape. To see the stored table definition, use `sqlite_schema`:

```sql
-- SQLite: inspect the SQL text stored for the table.
SELECT type, name, tbl_name, sql
FROM sqlite_schema
WHERE type = 'table' AND name = 'Employees';
```

### SQL Server

```sql
-- SQL Server: common inspection commands; neither is MySQL DESCRIBE.
EXEC sys.sp_help @objname = N'dbo.Employees';

SELECT
    c.column_id,
    c.name,
    TYPE_NAME(c.user_type_id) AS data_type,
    c.max_length,
    c.is_nullable,
    c.collation_name
FROM sys.columns AS c
WHERE c.object_id = OBJECT_ID(N'dbo.Employees')
ORDER BY c.column_id;
```

## 4. Read the exact table definition with `SHOW CREATE TABLE`

### MySQL / MariaDB

```sql
-- MySQL / MariaDB: emits the server's reconstructible table definition.
SHOW CREATE TABLE Employees;
```

Look for the engine, table-level `DEFAULT CHARACTER SET`, table-level `COLLATE`, primary and unique constraints, secondary indexes, generated expressions, and other options. This is often more authoritative than a hand-written migration file because it shows what is actually present on the connected server.

A database default does not prove that every existing column uses that character set or collation. A table can inherit a default, and a column can override it. Check the columns directly when diagnosing comparison behavior.

### SQLite

```sql
-- SQLite: inspect sqlite_schema instead; SHOW CREATE TABLE is not SQLite syntax.
SELECT sql
FROM sqlite_schema
WHERE type = 'table' AND name = 'Employees';
```

### SQL Server

```sql
-- SQL Server: SHOW CREATE TABLE is not valid. Inspect catalog views instead.
SELECT
    s.name AS schema_name,
    t.name AS table_name,
    c.name AS column_name,
    c.collation_name
FROM sys.tables AS t
JOIN sys.schemas AS s ON s.schema_id = t.schema_id
JOIN sys.columns AS c ON c.object_id = t.object_id
WHERE s.name = N'dbo' AND t.name = N'Employees';
```

For a scripted definition, use the SQL Server tooling or catalog-based scripting appropriate to your deployment process; do not copy a MySQL `SHOW CREATE TABLE` command into SQL Server.

## 5. `SHOW TABLE STATUS`: useful summary, not a measurement instrument

### MySQL / MariaDB

```sql
-- MySQL / MariaDB: table-level summary; LIKE matches a table name pattern.
SHOW TABLE STATUS LIKE 'Employees';
```

Fields commonly include `Name`, `Engine`, `Rows`, `Avg_row_length`, `Data_length`, `Index_length`, `Data_free`, and `Collation`. Treat these values as engine- and version-dependent diagnostics:

- For InnoDB, `Rows` is commonly an estimate, not a guaranteed current `COUNT(*)`.
- `Avg_row_length`, `Data_length`, and `Index_length` describe storage estimates or allocated/managed structures, not a promise that every logical row occupies that many bytes.
- Statistics may be stale. `ANALYZE TABLE` can refresh optimizer statistics, but it does not turn all table-status values into exact byte accounting. [3]
- Actual InnoDB records include record metadata, null maps, length fields, and possible off-page storage for large variable values. A simple sum of declared maximums is therefore not an exact row-size calculation. [4]

For an exact logical count, run a count query (understanding its cost):

```sql
-- MySQL / MariaDB: exact at the statement's read view, but potentially expensive.
SELECT COUNT(*) AS employee_count
FROM Employees;
```

If you need physical disk usage, use engine- and server-specific instrumentation rather than interpreting `Avg_row_length` as a file-format guarantee.

## 6. Character set versus collation

A **character set** maps characters to encoded bytes. A **collation** supplies comparison and ordering rules for strings in that character set. The character set answers “how can this text be represented?”; the collation answers “how are these represented values compared and sorted?”

For example, two columns can both use `utf8mb4` while using different collations. They can then store the same range of Unicode characters but differ in whether comparisons treat some case or accent differences as equal. Suffixes are clues, not a universal grammar: `_ci` often denotes case-insensitive behavior, but consult the engine's documentation for the exact collation.

### MySQL / MariaDB inspection

```sql
-- MySQL / MariaDB: inspect table defaults and each column's effective text metadata.
SELECT
    TABLE_SCHEMA,
    TABLE_NAME,
    TABLE_COLLATION
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Employees';

SELECT
    ORDINAL_POSITION,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_SET_NAME,
    COLLATION_NAME,
    CHARACTER_MAXIMUM_LENGTH,
    CHARACTER_OCTET_LENGTH,
    IS_NULLABLE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Employees'
ORDER BY ORDINAL_POSITION;
```

`CHARACTER_MAXIMUM_LENGTH` is expressed in characters for character columns; `CHARACTER_OCTET_LENGTH` is expressed in bytes. For `utf8mb3`, a character can require up to 3 bytes; for `utf8mb4`, up to 4 bytes. Thus `VARCHAR(50)` has a larger possible encoded payload under `utf8mb4`, but its actual row contribution depends on the stored values and row-format overhead. Do not present `50 × 4 + 1` as an exact InnoDB size. [1] [4]

To inspect available MySQL collations rather than guessing a name:

```sql
-- MySQL / MariaDB: available names and properties vary by release/product.
SHOW CHARACTER SET;
SHOW COLLATION;
```

### SQLite

```sql
-- SQLite: list registered collations; this is not INFORMATION_SCHEMA.
PRAGMA collation_list;

-- SQLite: an explicit collation can be used in an expression.
SELECT Email
FROM Employees
ORDER BY Email COLLATE NOCASE;
```

SQLite does not have a MySQL-like `utf8mb4` table default. The database stores text according to SQLite's text representation, while comparison uses the selected collation sequence. Custom collations may be supplied by the host application.

### SQL Server

```sql
-- SQL Server: database and column collations are catalog metadata.
SELECT
    DB_NAME() AS database_name,
    DATABASEPROPERTYEX(DB_NAME(), 'Collation') AS database_collation;

SELECT
    s.name AS schema_name,
    t.name AS table_name,
    c.name AS column_name,
    c.collation_name
FROM sys.tables AS t
JOIN sys.schemas AS s ON s.schema_id = t.schema_id
JOIN sys.columns AS c ON c.object_id = t.object_id
WHERE s.name = N'dbo' AND t.name = N'Employees';
```

SQL Server's collation model is not a translation of MySQL's character-set/collation pair. Keep SQL Server identifiers, types, and catalog queries in SQL Server code.

## 7. Compare databases with `INFORMATION_SCHEMA`

### MySQL / MariaDB

`INFORMATION_SCHEMA` is a database-specific metadata interface. In MySQL and MariaDB, compare the same table across two databases with a fully qualified metadata query:

```sql
-- MySQL / MariaDB: compare column definitions in two databases.
SET @db_a = 'hr_dev';
SET @db_b = 'hr_test';
SET @table_name = 'Employees';

SELECT
    COALESCE(a.ORDINAL_POSITION, b.ORDINAL_POSITION) AS position,
    COALESCE(a.COLUMN_NAME, b.COLUMN_NAME) AS column_name,
    a.COLUMN_NAME IS NOT NULL AS present_in_a,
    b.COLUMN_NAME IS NOT NULL AS present_in_b,
    a.COLUMN_TYPE AS type_in_a,
    b.COLUMN_TYPE AS type_in_b,
    a.IS_NULLABLE AS nullable_in_a,
    b.IS_NULLABLE AS nullable_in_b,
    a.CHARACTER_SET_NAME AS charset_in_a,
    b.CHARACTER_SET_NAME AS charset_in_b,
    a.COLLATION_NAME AS collation_in_a,
    b.COLLATION_NAME AS collation_in_b,
    a.COLUMN_KEY AS key_in_a,
    b.COLUMN_KEY AS key_in_b
FROM INFORMATION_SCHEMA.COLUMNS AS a
LEFT JOIN INFORMATION_SCHEMA.COLUMNS AS b
  ON b.TABLE_SCHEMA = @db_b
 AND b.TABLE_NAME = @table_name
 AND b.ORDINAL_POSITION = a.ORDINAL_POSITION
WHERE a.TABLE_SCHEMA = @db_a
  AND a.TABLE_NAME = @table_name

UNION ALL

SELECT
    b.ORDINAL_POSITION,
    b.COLUMN_NAME,
    FALSE,
    TRUE,
    NULL,
    b.COLUMN_TYPE,
    NULL,
    b.IS_NULLABLE,
    NULL,
    b.CHARACTER_SET_NAME,
    NULL,
    b.COLLATION_NAME,
    NULL,
    b.COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS AS b
LEFT JOIN INFORMATION_SCHEMA.COLUMNS AS a
  ON a.TABLE_SCHEMA = @db_a
 AND a.TABLE_NAME = @table_name
 AND a.ORDINAL_POSITION = b.ORDINAL_POSITION
WHERE b.TABLE_SCHEMA = @db_b
  AND b.TABLE_NAME = @table_name
  AND a.ORDINAL_POSITION IS NULL
ORDER BY position;
```

For a broader audit, compare `INFORMATION_SCHEMA.TABLES` for table defaults and `INFORMATION_SCHEMA.STATISTICS` for indexes. `STATISTICS` exposes the index name, sequence within the index, column name, uniqueness, and estimated cardinality; group or order by `SEQ_IN_INDEX` so a composite index is read in its actual left-to-right order. Cardinality is an estimate and can be cached until statistics are refreshed. [3]

```sql
-- MySQL / MariaDB: compare ordered index metadata for one table.
SELECT
    TABLE_SCHEMA,
    INDEX_NAME,
    NON_UNIQUE,
    SEQ_IN_INDEX,
    COLUMN_NAME,
    COLLATION,
    CARDINALITY
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA IN ('hr_dev', 'hr_test')
  AND TABLE_NAME = 'Employees'
ORDER BY TABLE_SCHEMA, INDEX_NAME, SEQ_IN_INDEX;
```

Privileges affect which metadata a session can see. A “missing” object in an information schema query can mean that the object is absent, the filter is wrong, or the account cannot see it; verify permissions before declaring two databases different.

### SQLite

SQLite has no `INFORMATION_SCHEMA`. Compare its catalog explicitly:

```sql
-- SQLite: catalog query; attach the second database first if needed.
ATTACH DATABASE 'hr_test.db' AS test;

SELECT 'main' AS database_name, name, type, sql
FROM main.sqlite_schema
WHERE name = 'Employees'
UNION ALL
SELECT 'test', name, type, sql
FROM test.sqlite_schema
WHERE name = 'Employees';
```

`ATTACH` and the `main`/`test` schema names are SQLite-specific. `PRAGMA table_info` and `PRAGMA index_list` are better choices for structured column and index comparisons.

### SQL Server

SQL Server exposes catalog views and also an `INFORMATION_SCHEMA`, but the views are not the MySQL result model. For a SQL Server comparison, qualify the database and query `sys` views in each database (or use a controlled cross-database query):

```sql
-- SQL Server: catalog-view example, not portable INFORMATION_SCHEMA syntax.
SELECT
    DB_NAME() AS database_name,
    s.name AS schema_name,
    t.name AS table_name,
    c.column_id,
    c.name AS column_name,
    TYPE_NAME(c.user_type_id) AS data_type,
    c.max_length,
    c.is_nullable,
    c.collation_name
FROM sys.tables AS t
JOIN sys.schemas AS s ON s.schema_id = t.schema_id
JOIN sys.columns AS c ON c.object_id = t.object_id
WHERE s.name = N'dbo' AND t.name = N'Employees';
```

## 8. Understand `COLUMN_KEY`: `PRI`, `UNI`, `MUL`, and empty

### MySQL / MariaDB

In `INFORMATION_SCHEMA.COLUMNS`, `COLUMN_KEY` is a compact hint, not a substitute for the index inventory. Interpret it as follows:

- `PRI`: the column participates in a primary key.
- `UNI`: the column participates in a unique key and is not being reported as `PRI`.
- `MUL`: the column participates in a nonunique key in the metadata's summary.
- Empty: no qualifying key is reported at that column position, but **do not conclude automatically that the column is unindexed**.

The last rule matters for composite indexes. A nonunique index such as `(Department, Email)` can make `Department` the leading indexed column while `Email` is only a later component. Depending on the metadata presentation and version, the later component can have an empty `COLUMN_KEY`; inspect `INFORMATION_SCHEMA.STATISTICS` to prove whether it is indexed. The leftmost-prefix order also affects which predicates can efficiently use the composite index. [1] [3]

Use this pair of queries when an empty value is surprising:

```sql
-- MySQL / MariaDB: compact column summary.
SELECT COLUMN_NAME, COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Employees'
ORDER BY ORDINAL_POSITION;

-- MySQL / MariaDB: authoritative ordered index membership for this inspection.
SELECT INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Employees'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;
```

For the example schema, `Id` should report `PRI`, `Email` should report `UNI`, and `Department` should report `MUL`. A column such as `Name` that has no declared key may be empty. If you later add a composite key, do not use the `COLUMNS` summary alone to decide that a later component has no index.

### SQLite and SQL Server equivalents

SQLite does not expose MySQL's `COLUMN_KEY`. Use:

```sql
-- SQLite: index list and index columns are separate PRAGMAs.
PRAGMA index_list('Employees');
PRAGMA index_info('ix_employees_department');
```

SQL Server does not return `PRI`/`UNI`/`MUL` strings. Inspect primary-key, unique-constraint, and index catalog views such as `sys.indexes`, `sys.index_columns`, and `sys.key_constraints`:

```sql
-- SQL Server: identify indexes and their ordered columns.
SELECT
    i.name AS index_name,
    i.is_unique,
    i.is_primary_key,
    ic.key_ordinal,
    c.name AS column_name
FROM sys.indexes AS i
JOIN sys.index_columns AS ic
  ON ic.object_id = i.object_id AND ic.index_id = i.index_id
JOIN sys.columns AS c
  ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE i.object_id = OBJECT_ID(N'dbo.Employees')
ORDER BY i.name, ic.key_ordinal;
```

## 9. A careful inspection workflow

1. **Identify the engine and release.** Run the labeled version query; do not assume client tooling tells you the server version.
2. **Inspect the definition.** On MySQL/MariaDB, run `SHOW CREATE TABLE`, then `DESCRIBE`; on SQLite or SQL Server, use the labeled catalog alternatives.
3. **Inspect effective text metadata.** Check each text column's character set and collation, not only the database or table default.
4. **Inspect key order.** Use `INFORMATION_SCHEMA.STATISTICS` in MySQL/MariaDB, SQLite index pragmas, or SQL Server catalog views. This catches composite-key cases that `COLUMN_KEY` summarizes poorly.
5. **Treat estimates as estimates.** Table status, index cardinality, and optimizer row counts can be stale or approximate. `ANALYZE TABLE` in MySQL/MariaDB refreshes relevant statistics; SQLite's planner also relies on statistics and can report a high-level `SCAN` versus `SEARCH` plan through `EXPLAIN QUERY PLAN`. [3] [5] [7]
6. **Test comparison semantics.** Insert representative case, accent, Unicode, and whitespace values in a test environment, then run equality and `ORDER BY` queries under the intended collation. A collation change can alter uniqueness checks and ordering.
7. **Review before changing.** Schema changes can rebuild data or invalidate assumptions in applications. In production, use your migration and backup process.

> **Warning — destructive SQL:** Statements such as `DROP TABLE`, `DROP INDEX`, and some `ALTER TABLE` operations can destroy data, constraints, or query performance. Do not run them from this lesson against a production database. First capture `SHOW CREATE TABLE`/catalog output, confirm dependencies, test in a disposable copy, and use an approved migration with a rollback plan.

## References

[1]: https://dev.mysql.com/doc/refman/8.4/en/information-schema-columns-table.html "MySQL 8.4 Reference Manual: The INFORMATION_SCHEMA COLUMNS Table"
[2]: https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html "MySQL 8.4 Reference Manual: InnoDB Index Types"
[3]: https://dev.mysql.com/doc/refman/8.4/en/information-schema-statistics-table.html "MySQL 8.4 Reference Manual: The INFORMATION_SCHEMA STATISTICS Table"
[4]: https://dev.mysql.com/doc/refman/8.4/en/innodb-row-format.html "MySQL 8.4 Reference Manual: InnoDB Row Formats"
[5]: https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/building-the-best-index-for-a-given-select "MariaDB Documentation: Building the Best Index for a Given SELECT"
[6]: https://www.sqlite.org/queryplanner.html "SQLite Query Planning"
[7]: https://www.sqlite.org/eqp.html "SQLite EXPLAIN QUERY PLAN"
