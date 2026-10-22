# Inspect duplicate and redundant indexes (index-analysis)

Indexes are separate access structures maintained beside table data. They can turn a selective lookup into a short B-tree traversal, but every additional index also consumes storage and must be maintained during `INSERT`, `UPDATE`, and `DELETE`. The goal of an index audit is therefore not “remove as many indexes as possible”; it is to identify **candidates**, understand what each key supports, and make a reviewed change only when workload evidence supports it.

> **Safety rule:** This lesson produces reports. It does not automatically drop anything. A duplicate-looking index may be required by a constraint, a different access path, a foreign key, a filter/predicate, included columns, collation, prefix length, or an operational convention.

## 1. What counts as duplicate or redundant?

Use these terms precisely:

- **Exact duplicate candidate:** two indexes on the same table have the same ordered key definition and relevant properties, but different names. “Same columns” alone is not enough: order, prefix length, sort direction, collation, uniqueness, index type, filters, included columns, and expressions can matter.
- **Leftmost-prefix redundant candidate:** one composite index begins with the complete key sequence of another. For example, `(tenant_id, email)` begins with `(tenant_id)`. The shorter key may be redundant for some workloads, but the longer index is not automatically a replacement: the shorter index may be smaller, cheaper to maintain, or uniquely constrained.
- **Overlapping but useful indexes:** `(tenant_id, email)` and `(tenant_id, status)` share a prefix but serve different predicates. They are not duplicates.

A B-tree ordering can be pictured as:

```text
index (tenant_id, email, created_at)
          ^          ^          ^
          |          |          +-- third key part
          |          +------------- second key part
          +------------------------ leftmost key part

Useful leading seeks commonly begin with:
  (tenant_id)
  (tenant_id, email)
  (tenant_id, email, created_at)

Not the same ordering:
  (email, tenant_id)       -- different leading key
  (created_at, tenant_id)  -- different leading key
```

The optimizer may still choose a scan or another index. An index definition describes possible ordering; it is not a promise that every query will use it. SQLite documents this distinction through `SCAN` versus `SEARCH` in `EXPLAIN QUERY PLAN` output [4] [5]. MySQL similarly estimates alternatives from statistics and cost, and `EXPLAIN ANALYZE` can compare estimates with observed execution for supported statements [2].

## 2. MySQL and MariaDB: start with `SHOW INDEXES`

### MySQL / MariaDB syntax

`SHOW INDEXES` (also accepted as `SHOW INDEX`) is a convenient table-level inventory. It is **not portable SQL**.

```sql
-- MySQL and MariaDB: read-only inspection
SHOW INDEXES FROM app.orders;

-- Limit the output to one database object where supported by the dialect.
SHOW INDEXES FROM orders FROM app;
```

Useful fields include:

- `Key_name`: the index or constraint-backed key name.
- `Seq_in_index`: the one-based position of a key part. Ordering by this field is essential for composite keys.
- `Column_name`: the indexed column; a functional/expression index may be represented differently by version.
- `Non_unique`: `0` for a unique key and `1` for a non-unique key.
- `Cardinality`: an optimizer estimate of distinct values, not a guaranteed exact count.
- `Sub_part`: a prefix length where a string key indexes only a prefix.
- `Index_type`: for example, `BTREE` (engine and version determine available types).
- `Collation`: key sort direction/ordering information where reported.

`Cardinality` should be treated as a statistic that can be stale or approximate. MySQL documents `INFORMATION_SCHEMA.STATISTICS` as metadata with estimated cardinality and notes that statistics may be cached [1]. MariaDB likewise recommends considering selectivity/cardinality and query shape rather than creating indexes mechanically [6].

### MySQL / MariaDB `INFORMATION_SCHEMA.STATISTICS`

For repeatable reporting, query the metadata view instead of parsing human-oriented output:

```sql
-- MySQL and MariaDB: one row per index key part
SELECT
    TABLE_SCHEMA,
    TABLE_NAME,
    INDEX_NAME,
    NON_UNIQUE,
    SEQ_IN_INDEX,
    COLUMN_NAME,
    SUB_PART,
    COLLATION,
    CARDINALITY,
    INDEX_TYPE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'orders'
ORDER BY TABLE_SCHEMA, TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
```

The important interpretation is:

```text
one index name
  -> SEQ_IN_INDEX = 1, 2, 3, ...
       -> ordered COLUMN_NAME values
```

`SEQ_IN_INDEX` is not a row identifier and not a selectivity rank; it is the position of the key part. `NON_UNIQUE` describes uniqueness of the index as a whole, not whether an individual column happens to contain duplicates. `CARDINALITY` is an estimate for the index/key part and can differ from a `COUNT(DISTINCT ...)` taken at query time. Refreshing statistics can change estimates without changing the index definition [1] [2].

A compact readable inventory can be built with `GROUP_CONCAT`:

```sql
-- MySQL / MariaDB: display each key in declared column order
SELECT
    TABLE_SCHEMA,
    TABLE_NAME,
    INDEX_NAME,
    NON_UNIQUE,
    INDEX_TYPE,
    GROUP_CONCAT(
        CONCAT(
            SEQ_IN_INDEX, ':', COLUMN_NAME,
            CASE WHEN SUB_PART IS NULL THEN ''
                 ELSE CONCAT('(prefix ', SUB_PART, ')') END
        )
        ORDER BY SEQ_IN_INDEX
        SEPARATOR ', '
    ) AS ordered_key_parts,
    MAX(CARDINALITY) AS reported_cardinality
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'orders'
GROUP BY TABLE_SCHEMA, TABLE_NAME, INDEX_NAME, NON_UNIQUE, INDEX_TYPE
ORDER BY INDEX_NAME;
```

Do not infer that an index exists merely because a column is mentioned in an application query. Check the actual ordered key parts. Also, a MySQL `PRIMARY` key is not interchangeable with an ordinary secondary index in InnoDB: the primary key is the clustered row organization; secondary records carry primary-key values used to locate the clustered row [3]. An ordinary secondary key on the same primary-key column can therefore add maintenance and storage without adding a useful lookup path.

## 3. Exact duplicate candidate report (MySQL 8.0.13+)

The following is a **read-only candidate report** for MySQL 8.0.13+. It groups indexes by table, uniqueness, index type, and an ordered signature containing the column or functional expression, prefix length, and collation. It deliberately reports candidates instead of issuing `DROP` statements.

```sql
-- MySQL 8.0.13+: report exact-definition candidates; no changes are made.
WITH index_signatures AS (
    SELECT
        TABLE_SCHEMA,
        TABLE_NAME,
        INDEX_NAME,
        NON_UNIQUE,
        INDEX_TYPE,
        GROUP_CONCAT(
            CONCAT(
                SEQ_IN_INDEX, ':',
                COALESCE(EXPRESSION, COLUMN_NAME, '<expression>'), ':',
                COALESCE(CAST(SUB_PART AS CHAR), 'FULL'), ':',
                COALESCE(COLLATION, '-')
            )
            ORDER BY SEQ_IN_INDEX
            SEPARATOR '|'
        ) AS ordered_signature,
        COUNT(*) AS key_part_count
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA NOT IN
          ('information_schema', 'mysql', 'performance_schema', 'sys')
    GROUP BY
        TABLE_SCHEMA, TABLE_NAME, INDEX_NAME,
        NON_UNIQUE, INDEX_TYPE
)
SELECT
    TABLE_SCHEMA,
    TABLE_NAME,
    NON_UNIQUE,
    INDEX_TYPE,
    ordered_signature,
    key_part_count,
    COUNT(*) AS candidate_count,
    GROUP_CONCAT(INDEX_NAME ORDER BY INDEX_NAME SEPARATOR ', ') AS candidate_indexes
FROM index_signatures
GROUP BY
    TABLE_SCHEMA, TABLE_NAME, NON_UNIQUE,
    INDEX_TYPE, ordered_signature, key_part_count
HAVING COUNT(*) > 1
 ORDER BY TABLE_SCHEMA, TABLE_NAME, candidate_indexes;
```

`GROUP_CONCAT` can truncate unusually long signatures at the session's configured `group_concat_max_len`. Check that setting or compare the full key-part rows before accepting any reported match.

How to read the result:

1. `candidate_indexes` contains two or more differently named keys with the same reported definition.
2. `NON_UNIQUE = 0` means the keys are unique; that does **not** prove that one unique constraint is semantically replaceable by another. Primary-key rules, nullable columns, foreign keys, replication conventions, and application expectations still require review.
3. A prefix index such as `email(20)` is not the same definition as a full `email` key; the `SUB_PART` component keeps those cases separate.
4. The query includes MySQL 8.0.13+ `EXPRESSION` metadata for functional key parts. Verify the actual DDL with `SHOW CREATE TABLE` before treating a row as an exact duplicate.
5. The query does not account for every engine-specific feature, such as SQL Server included columns or filtered predicates. Do not run it against another engine.

For a single table, verify the report with:

```sql
-- MySQL / MariaDB: inspect the authoritative DDL before any change
SHOW CREATE TABLE app.orders;
SHOW INDEXES FROM app.orders;
```

### Why can same-column keys exist under different names?

An index name is an object identifier, not a content-based global checksum. MySQL and MariaDB can permit two separately named indexes with the same ordered key parts; SQLite also allows separately named indexes unless a schema rule or name conflict prevents creation. A migration may create one key, a later migration may create another under a new name, or a constraint and a manually created index may overlap. The database generally cannot assume that removing one is safe because the names can be referenced by tooling, migrations, hints, monitoring, or administrative procedures.

Also distinguish these cases:

```text
PRIMARY KEY (id)                    -- row identity and uniqueness semantics
UNIQUE KEY uq_customer_id (id)      -- uniqueness constraint semantics
KEY ix_customer_id (id)              -- ordinary non-unique access path
KEY ix_customer_id_status (id,status)
```

Even when the first three have the same visible key column, they do not have the same constraint meaning. In InnoDB, the primary key also determines clustered row organization [3]. A report is evidence for review, not permission to remove a key.

## 4. Leftmost-prefix redundancy: useful test, not automatic verdict

For an ordered composite index `A(a, b, c)`, an index `B(a)` is a leftmost prefix of `A`; `B(a, b)` is also a leftmost prefix. The reverse is not true. A typical equality/range ordering is:

```text
A: (account_id, state, created_at)

prefixes of A:
  (account_id)
  (account_id, state)
  (account_id, state, created_at)

not prefixes of A:
  (state)
  (created_at)
  (state, account_id)
```

A longer index can often support a predicate on its leading columns, but “can support” is not “is always better.” The shorter index may:

- be materially smaller and cheaper to maintain;
- be the only key enforcing a required uniqueness rule;
- have different prefix length, collation, sort direction, or visibility;
- serve a covering query more efficiently in a particular workload;
- be required by a foreign-key or migration convention;
- behave differently under the engine’s optimizer and statistics.

MariaDB’s index guidance starts with equality predicates and then considers range, grouping, ordering, selectivity, and write cost [6]. SQLite similarly explains that multi-column indexes depend on their column order and that a covering index can avoid an additional table lookup [4]. Therefore, a leftmost-prefix report should be reviewed against real plans and workload history, not used as a drop generator.

A simple MySQL/MariaDB prefix report can find possible relationships among non-unique, non-primary indexes. It is intentionally conservative and does not claim that every reported shorter key is redundant:

```sql
-- MySQL / MariaDB: possible leftmost-prefix relationships.
-- Review uniqueness, constraints, prefixes, and workload separately.
WITH key_parts AS (
    SELECT
        TABLE_SCHEMA,
        TABLE_NAME,
        INDEX_NAME,
        NON_UNIQUE,
        GROUP_CONCAT(
            CONCAT(COLUMN_NAME, ':', COALESCE(CAST(SUB_PART AS CHAR), 'FULL'))
            ORDER BY SEQ_IN_INDEX SEPARATOR '|'
        ) AS signature,
        COUNT(*) AS part_count
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND INDEX_NAME <> 'PRIMARY'
    GROUP BY TABLE_SCHEMA, TABLE_NAME, INDEX_NAME, NON_UNIQUE
)
SELECT
    short_key.TABLE_SCHEMA,
    short_key.TABLE_NAME,
    short_key.INDEX_NAME AS shorter_index,
    short_key.signature AS shorter_signature,
    long_key.INDEX_NAME AS longer_index,
    long_key.signature AS longer_signature
FROM key_parts AS short_key
JOIN key_parts AS long_key
  ON long_key.TABLE_SCHEMA = short_key.TABLE_SCHEMA
 AND long_key.TABLE_NAME = short_key.TABLE_NAME
 AND long_key.INDEX_NAME <> short_key.INDEX_NAME
 AND long_key.part_count > short_key.part_count
 AND long_key.signature LIKE CONCAT(short_key.signature, '|%')
ORDER BY
    short_key.TABLE_SCHEMA,
    short_key.TABLE_NAME,
    short_key.INDEX_NAME,
    long_key.INDEX_NAME;
```

The `LIKE` comparison is a screening shortcut, not a complete proof for every unusual identifier or expression. For a production audit, compare normalized key-part rows by `SEQ_IN_INDEX`, including all properties relevant to your engine. Always inspect `SHOW CREATE TABLE`, constraints, and execution plans before proposing a change.

## 5. Refresh statistics before judging a candidate

### MySQL / MariaDB

`ANALYZE TABLE` refreshes optimizer statistics. It does **not** remove duplicate keys and it does not prove that an index is used or unused.

```sql
-- MySQL / MariaDB: syntax and locking behavior depend on engine/version.
-- Run in a maintenance-aware window and consult the version manual.
ANALYZE TABLE app.orders;

-- MySQL: compare estimated and, where supported, observed plans.
EXPLAIN
SELECT order_id
FROM app.orders
WHERE account_id = 42 AND state = 'open';

EXPLAIN ANALYZE
SELECT order_id
FROM app.orders
WHERE account_id = 42 AND state = 'open';
```

`EXPLAIN` is an estimate; `EXPLAIN ANALYZE` executes the statement and reports actual iterator timing/rows for supported statements [2]. A plan changing after `ANALYZE TABLE` may mean stale statistics were the problem, not that an index is redundant.

### SQLite

SQLite uses `ANALYZE` to collect statistics for its query planner; the inspection syntax is different from MySQL/MariaDB:

```sql
-- SQLite: read-only index inventory for one table
PRAGMA index_list('orders');

-- SQLite: key parts for a named index
PRAGMA index_info('idx_orders_account_state');
PRAGMA index_xinfo('idx_orders_account_state');

-- SQLite: refresh planner statistics, if appropriate for the database lifecycle
ANALYZE;

-- SQLite: high-level plan inspection; output format may vary by version
EXPLAIN QUERY PLAN
SELECT order_id
FROM orders
WHERE account_id = 42 AND state = 'open';
```

SQLite’s `PRAGMA index_list` output can identify whether an index is associated with a unique constraint, while `index_info`/`index_xinfo` expose ordered key details. `EXPLAIN QUERY PLAN` is intended for interactive/debugging use and its output format can change between SQLite versions [5]. Do not paste `SHOW INDEXES`, `INFORMATION_SCHEMA.STATISTICS`, or `ANALYZE TABLE` into SQLite.

### SQL Server

SQL Server has no `SHOW INDEXES` or MySQL `INFORMATION_SCHEMA.STATISTICS` equivalent for this purpose. Use catalog views and engine-specific plan/statistics tooling:

```sql
-- SQL Server: read-only index inventory for one table.
SELECT
    s.name AS schema_name,
    t.name AS table_name,
    i.name AS index_name,
    i.type_desc,
    i.is_unique,
    i.is_primary_key,
    i.is_unique_constraint,
    ic.key_ordinal,
    c.name AS column_name,
    ic.is_descending_key,
    ic.is_included_column
FROM sys.tables AS t
JOIN sys.schemas AS s
  ON s.schema_id = t.schema_id
JOIN sys.indexes AS i
  ON i.object_id = t.object_id
LEFT JOIN sys.index_columns AS ic
  ON ic.object_id = i.object_id
 AND ic.index_id = i.index_id
LEFT JOIN sys.columns AS c
  ON c.object_id = ic.object_id
 AND c.column_id = ic.column_id
WHERE s.name = N'dbo'
  AND t.name = N'Orders'
ORDER BY i.name, ic.key_ordinal, ic.index_column_id;
```

In SQL Server, `key_ordinal` is the ordered key position; `is_included_column = 1` identifies included (non-key) columns, which are not part of the seek ordering. A nonclustered index’s row locator differs for a heap versus a clustered table, and a clustered index changes the storage/locator design; consequently, same key columns do not establish equivalence. SQL Server plans and usage statistics must be reviewed with the appropriate server tooling. Do not use the MySQL report against SQL Server.

## 6. Engine-specific syntax and behavior at a glance

### MySQL

- Inspect with `SHOW INDEXES`, `SHOW CREATE TABLE`, or `INFORMATION_SCHEMA.STATISTICS`.
- InnoDB uses the primary key as the clustered index; if no suitable primary/unique key exists, InnoDB can create a hidden clustered index [3].
- Refresh statistics with `ANALYZE TABLE`; inspect estimates with `EXPLAIN` and observed execution with supported `EXPLAIN ANALYZE` [2].
- A secondary index includes primary-key values for the row lookup in InnoDB [3].

### MariaDB

- `SHOW INDEX`/`SHOW INDEXES` and `INFORMATION_SCHEMA.STATISTICS` are MariaDB syntax, not portable syntax.
- InnoDB/XtraDB behavior and available optimizer features depend on the MariaDB release and storage engine. Confirm `SHOW CREATE TABLE`, engine, version, and documentation before comparing keys.
- Use `ANALYZE TABLE` for MariaDB statistics refresh, and use the MariaDB-specific `EXPLAIN` features supported by the installed release [6].

### SQLite

- Inspect with `PRAGMA index_list`, `PRAGMA index_info`, and `PRAGMA index_xinfo`; inspect plans with `EXPLAIN QUERY PLAN` [5].
- SQLite has table and index B-trees in its page-based file format; its rowid/table organization is not the same as InnoDB or SQL Server [4].
- Use `ANALYZE`, not `ANALYZE TABLE`.
- `CREATE INDEX` names and SQLite schema constraints must be evaluated from `sqlite_schema` and the PRAGMA output; do not assume MySQL index metadata columns exist.

### SQL Server

- Inspect with `sys.indexes`, `sys.index_columns`, `sys.columns`, and related catalog views.
- Clustered and nonclustered indexes have SQL Server-specific storage and locator semantics; heaps use RID locators, while clustered tables use the clustered key as the locator for nonclustered entries. Included columns and filtered indexes also affect equivalence.
- Use SQL Server’s statistics/plan tooling and version-appropriate statistics maintenance commands. `ANALYZE TABLE`, `SHOW INDEXES`, and MySQL `INFORMATION_SCHEMA.STATISTICS` are not SQL Server statements.

## 7. A safe review workflow

1. **Choose scope.** Start with one schema/table or a bounded set of high-write tables. Record engine, version, storage engine, and deployment context.
2. **Inventory definitions.** Capture `SHOW CREATE TABLE` plus `SHOW INDEXES` for MySQL/MariaDB, PRAGMA output for SQLite, or catalog-view output for SQL Server. Preserve ordered key parts, uniqueness, prefixes, included columns, filters, expressions, and index type.
3. **Refresh or verify statistics.** Use the engine’s statistics command only after checking its operational impact. A stale cardinality estimate can make a sound index look useless or make a redundant one look attractive.
4. **Generate candidates.** Run the exact-duplicate report and, separately, a leftmost-prefix screen. Treat every row as “investigate,” never “drop.”
5. **Check semantics.** Identify whether a key backs a primary key, unique constraint, foreign key, replication requirement, partitioning rule, filtered/partial predicate, expression, collation, or prefix. Check application migrations and any index hints by name.
6. **Check workload evidence.** Compare representative `EXPLAIN`/actual plans, query latency, rows examined, write rates, and index usage history. Test both read queries and write-heavy paths. A small table may correctly use a scan; forcing an index is diagnostic, not routine tuning.
7. **Estimate trade-offs.** Removing a duplicate may save space and write work, but it can affect plan choice, covering behavior, lock/maintenance operations, and future migrations. Keep a rollback plan.
8. **Make one reviewed change.** If approved, use the syntax for that engine and version, preferably through a migration or controlled maintenance procedure. Do not combine an audit with automatic DDL.
9. **Re-measure.** Re-run representative plans and write tests after the change. Monitor errors, latency, storage, and optimizer choices before considering another change.

### Destructive DDL warning

The following statements are **examples only** and are intentionally commented out. Do not run them from a generated report or copy them without an explicit review, backup/rollback plan, dependency check, and engine/version confirmation:

```sql
-- EXPLICIT WARNING: destructive schema change. Review first; do not auto-run.
-- MySQL / MariaDB:
-- ALTER TABLE app.orders DROP INDEX ix_orders_account;
-- (Equivalent MySQL form: DROP INDEX ix_orders_account ON app.orders;)

-- EXPLICIT WARNING: destructive schema change. Review first; do not auto-run.
-- SQLite:
-- DROP INDEX IF EXISTS ix_orders_account;

-- EXPLICIT WARNING: destructive schema change. Review first; do not auto-run.
-- SQL Server:
-- DROP INDEX ix_orders_account ON dbo.Orders;
```

The syntax is deliberately labeled because these are not portable statements. Even when two keys look identical, retain the one with the required constraint or operational role and verify that removing the other does not change a plan or break a migration. If uncertainty remains, keep both and gather better evidence.

## References

[1]: https://dev.mysql.com/doc/refman/8.4/en/information-schema-statistics-table.html "MySQL 8.4 Reference Manual: The INFORMATION_SCHEMA STATISTICS Table"
[2]: https://dev.mysql.com/doc/refman/8.4/en/explain.html "MySQL 8.4 Reference Manual: EXPLAIN Statement"
[3]: https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html "MySQL 8.4 Reference Manual: InnoDB Index Types"
[4]: https://www.sqlite.org/queryplanner.html "SQLite Query Planning"
[5]: https://www.sqlite.org/eqp.html "SQLite EXPLAIN QUERY PLAN"
[6]: https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/building-the-best-index-for-a-given-select "MariaDB: Building the Best Index for a Given SELECT"
