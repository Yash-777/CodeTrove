# Design, monitor, and maintain indexes

Indexes are **access paths**, not a second copy of a table that users query directly. An index stores keys in an ordered or otherwise searchable structure plus enough row-location information for the engine to find matching rows. That extra structure can turn a large scan into a narrow lookup, but it also consumes storage and must be updated when indexed data changes.

A good index is therefore not “an index on every column.” It is a tested response to a real workload, with a lifecycle:

```text
observe workload
    ↓
choose candidate access paths
    ↓
create the smallest useful index
    ↓
compare estimates and actual execution
    ↓
refresh statistics and watch usage/cost
    ↓
maintain only when evidence justifies it
    ↓
retire safely, then re-evaluate as the workload changes
```

> **Engine rule:** SQL syntax and index behavior are not interchangeable. Every command below is labeled **MySQL**, **MariaDB**, **SQLite**, or **SQL Server**. Do not copy an engine-specific statement into another database and assume it is portable.

## I. Planning and Design (Before Creation)

### Start with the query workload

Begin with the queries that matter: production traces, slow-query logs, API endpoints, reports, batch jobs, and write-heavy paths. Record more than the SQL text:

- How often does the query run, and how much latency does it contribute?
- Is it a point lookup, a small range, a join, an ordered feed, an aggregation, or a large export?
- How many rows does it usually read and return? How does that change at peak and over time?
- Is the table read-mostly, or are inserts, updates, and deletes latency-sensitive?
- Are predicates stable, or are users applying many optional filters?
- Which columns are returned? Could a narrow covering index avoid extra table lookups, and is the extra index width worth its write cost?

An index should be justified by a query shape and a measurable problem. A column that is “important” to the business is not automatically a useful index key.

### Identify candidates by query clause

#### `WHERE` predicates

Columns used in equality and range predicates are common candidates:

```sql
-- A likely candidate is tenant_id plus the selective status/time shape.
SELECT order_id, created_at, total_amount
FROM orders
WHERE tenant_id = 42
  AND status = 'open'
  AND created_at >= '2026-01-01'
ORDER BY created_at DESC;
```

A possible composite design is `(tenant_id, status, created_at)`, but it is not automatically correct. Test the actual data distribution and query mix. A function or expression around a column may prevent an ordinary index from being used; use an engine-supported expression/generated-column strategy only after checking that engine's rules.

Do not treat `NULL` as a universal reason to reject an index. Whether nulls are useful depends on the predicate, distribution, and optimizer. Test `IS NULL`, `IS NOT NULL`, and mixed predicates rather than applying a slogan.

#### `JOIN` predicates and foreign keys

Join keys often benefit from indexes on both sides, especially the child-side foreign key used to find rows for a parent:

```sql
SELECT p.parent_id, c.child_id
FROM parent AS p
JOIN child AS c ON c.parent_id = p.parent_id
WHERE p.parent_id = 42;
```

A primary key or unique key on the parent is usually already indexed. Verify the child side instead of assuming that declaring a foreign key created the desired access path. Foreign-key indexing and automatic index creation differ by engine and configuration; the constraint's integrity guarantee is not the same thing as a workload-appropriate composite index.

#### `ORDER BY`

An index can provide rows in key order and avoid a separate sort when the query's predicates and ordering align with the index. Direction is engine-dependent in detail: modern MySQL, MariaDB, SQLite, and SQL Server support descending key definitions in some form, but optimizer and storage behavior differ. Test the plan rather than expecting every `ASC`/`DESC` variation to be interchangeable.

#### `GROUP BY`

Grouping can benefit when rows arrive in a useful grouping order, but an index is not a promise that no temporary structure will be needed. A selective `WHERE` predicate, grouping columns, joins, and required output columns must be considered together.

### Cardinality, selectivity, and data shape

**Cardinality** is the number of distinct values (or, in plan discussions, sometimes the estimated number of matching rows). **Selectivity** describes how narrowly a predicate reduces the input. A unique identifier is usually highly selective; a boolean or a flag with two values is often not. But a low-cardinality column can still be useful when a filtered/partial index stores only a small subset, when the table is physically large, or when it is the leading part of a useful composite access path.

The optimizer compares an index traversal plus row lookups with a scan. On a two-row table, scanning both rows can be cheaper than traversing an index. On a very large table, the same predicate may justify an index. There is no universal row-count threshold: cache state, row width, clustering, selectivity, and requested columns all matter. SQLite's planner documentation likewise describes indexes as a way to narrow searches and notes that statistics help choose among alternatives [1].

Refresh or inspect statistics before drawing conclusions from a plan. Stale statistics can make a good index look unused or make a poor index look attractive.

### Select the right index shape and type

#### Single-column versus composite

A composite index is ordered by its key sequence. For an index on `(tenant_id, status, created_at)`, the leading `tenant_id` is considered first, then `status`, then `created_at` within matching prefixes. This is often called the **leftmost-prefix** principle:

```text
(tenant_id, status, created_at)
 └──────────────┘ useful prefix for tenant + status
 └───────┘       useful prefix for tenant alone
```

The index may be useful for `tenant_id = ?`, and often for `tenant_id = ? AND status = ?`. It is not generally a substitute for an index beginning with `status` when the query has no usable condition on `tenant_id`. A range on an earlier key can also limit how much later ordering/filtering the optimizer can exploit. Column order is a workload decision, not a rule to put the most selective column first in every situation.

Before creating `(a, b)`, check whether an existing `(a, b, c)` already supplies the needed leftmost prefix. The longer index is not always a drop-in replacement: a shorter index may be substantially cheaper to maintain, and a covering requirement may differ. Compare widths, usage, and plans.

#### Unique indexes

A unique index both enforces a data rule and supplies an access path. Use it when the model requires uniqueness, not merely because uniqueness might make a lookup fast. In MySQL and MariaDB, a primary key or unique `NOT NULL` key is central to InnoDB clustering; if no suitable key exists, InnoDB can create a hidden clustered key (`GEN_CLUST_INDEX`). Secondary entries include the primary-key value used to locate the clustered row [5].

#### Clustered and nonclustered terminology

**SQL Server:** A table can have at most one clustered index; its leaf level contains the table rows. A heap has no clustered index, and a nonclustered index uses a row identifier (RID) to locate heap rows. If the table has a clustered index, nonclustered entries use the clustered key as the locator; a nonunique clustered key can require a hidden uniqueifier. Nonclustered indexes have their own leaf index pages.

**MySQL/MariaDB with InnoDB:** The primary key is the clustered index. A secondary index is a separate B-tree-like structure whose entries carry the primary-key value, not SQL Server's RID terminology [5]. Do not write `CLUSTERED` or `NONCLUSTERED` in MySQL/MariaDB `CREATE INDEX` syntax.

**SQLite:** Ordinary rowid tables and their indexes have SQLite-specific B-tree and rowid behavior. A SQLite index is not a SQL Server-style clustered index, and SQLite does not accept SQL Server's clustered-index syntax. SQLite's file format distinguishes table and index B-tree pages, along with overflow and freelist pages [3].

#### Filtered, partial, covering, and specialized indexes

- **SQL Server filtered index:** indexes rows matching a `WHERE` filter in the index definition.
- **SQLite partial index:** indexes only rows satisfying its `WHERE` clause.
- **MySQL/MariaDB:** do not assume SQL Server filtered-index syntax is available. Use supported generated-column, prefix, functional, full-text, or other engine-specific features when appropriate, and verify the version.
- **Covering index:** contains all columns needed by a query, allowing an index-only plan in favorable circumstances. It can reduce table lookups but increases index width and write work.
- **Full-text, spatial, XML, and similar specialized indexes:** are purpose-built features with engine-specific syntax and limitations; they are not interchangeable with an ordinary B-tree.

### Estimate storage without mistaking a maximum for reality

Schema metadata can show declared maximum lengths, character sets, nullability, and key flags. For **MySQL**, this is a useful inspection query:

```sql
SELECT
    ORDINAL_POSITION,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    NUMERIC_PRECISION,
    NUMERIC_SCALE,
    IS_NULLABLE,
    COLUMN_KEY,
    EXTRA
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'orders'
ORDER BY ORDINAL_POSITION;
```

`COLUMN_KEY` values such as `PRI`, `UNI`, and `MUL` are useful clues, but an empty value does not always prove that a column is absent from every index: MySQL documents cases where a column is only a later part of a nonunique composite key [7]. Inspect the complete index metadata too.

A simple calculation such as `VARCHAR(50) × 4 bytes` for `utf8mb4` is a **maximum payload estimate**, not an exact InnoDB row size. Real storage includes record headers, null maps, length fields, page overhead, and possible off-page storage for large variable values [9]. Compare it with observed `AVG_ROW_LENGTH` and `DATA_LENGTH` rather than claiming that the arithmetic is the allocated row size.

### Find duplicates and redundant prefixes before adding anything

**MySQL/MariaDB:** inspect definitions before creating an index:

```sql
SHOW INDEX FROM orders;
SHOW CREATE TABLE orders;

SELECT
    TABLE_SCHEMA,
    TABLE_NAME,
    INDEX_NAME,
    NON_UNIQUE,
    SEQ_IN_INDEX,
    COLUMN_NAME,
    CARDINALITY
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'orders'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;
```

The statistics view exposes ordered columns, uniqueness, and estimated cardinality; those estimates can be cached until statistics are refreshed [8]. Group index rows by `(TABLE_SCHEMA, TABLE_NAME, INDEX_NAME)` to reconstruct each ordered key. A report can flag exact duplicate definitions and shorter indexes subsumed by a longer leftmost prefix, but it cannot prove that an index is safe to remove. A shorter index may be narrower, may support a different included/covering requirement, or may be used by a constraint or operational query.

Creating two indexes with different names but identical key definitions does not create two useful access paths. It creates extra storage and extra write maintenance. A secondary index on an InnoDB primary-key column is usually redundant for the same reason: the clustered primary key already supplies that key lookup. Confirm constraints and plans before removing it.

## II. Creation of Indexes

Create the smallest index that supports a demonstrated query shape. Name it consistently, record its owner/query rationale, and schedule large builds so their locking, logging, disk, and replication effects are understood.

### MySQL

```sql
-- Secondary index for a tested access path.
CREATE INDEX ix_orders_tenant_status_created
    ON orders (tenant_id, status, created_at DESC);

-- Use only when the business rule requires uniqueness.
CREATE UNIQUE INDEX ux_users_email
    ON users (email);
```

InnoDB stores the primary key in secondary-index records, so a wide primary key makes every secondary index more expensive than the visible key list suggests [5]. MySQL index creation options and online behavior vary by version and table operation; check the version-specific manual before a production build.

### MariaDB

```sql
CREATE INDEX ix_orders_tenant_status_created
    ON orders (tenant_id, status, created_at);

CREATE UNIQUE INDEX ux_users_email
    ON users (email);
```

MariaDB's index guidance starts with equality predicates, then considers range, grouping, and ordering in the context of the complete query. It specifically cautions that low-cardinality flag-only indexes are often poor choices and that every index adds update cost [4]. Treat that as a design heuristic, not an automatic rejection.

### SQLite

```sql
CREATE INDEX ix_orders_tenant_status_created
    ON orders (tenant_id, status, created_at DESC);

CREATE UNIQUE INDEX ux_users_email
    ON users (email);

-- Partial index: SQLite-specific form.
CREATE INDEX ix_orders_open
    ON orders (tenant_id, created_at DESC)
    WHERE status = 'open';
```

SQLite's `EXPLAIN QUERY PLAN` can report `SCAN`, `SEARCH`, covering-index use, and temporary sort structures, but its output is a high-level debugging format that may change between versions [2]. A partial index is only useful when the query predicate and SQLite's rules allow the planner to infer that the indexed subset applies.

### SQL Server

```sql
CREATE NONCLUSTERED INDEX IX_Orders_Tenant_Status_Created
    ON dbo.Orders (tenant_id, status, created_at DESC)
    INCLUDE (order_id, total_amount);

CREATE UNIQUE NONCLUSTERED INDEX UX_Users_Email
    ON dbo.Users (email);

-- SQL Server-specific filtered index.
CREATE INDEX IX_Orders_Open
    ON dbo.Orders (tenant_id, created_at DESC)
    WHERE status = 'open';
```

`CLUSTERED` and `NONCLUSTERED` are SQL Server terms. A clustered build can affect the table's storage organization and can be more disruptive than a nonclustered build; consult the supported online/resumable options for the installed edition and version.

### Validate creation with a controlled experiment

Use the same representative query before and after creation. Capture estimated and actual rows, reads, elapsed time, plan shape, and returned results. Avoid comparing one lucky warm-cache run with one cold-cache run. Test both the target read and important writes because a read improvement can be unacceptable if it harms ingest or update latency.

For a MySQL example:

```sql
ANALYZE TABLE orders;
EXPLAIN
SELECT order_id, created_at, total_amount
FROM orders
WHERE tenant_id = 42 AND status = 'open'
ORDER BY created_at DESC
LIMIT 50;

-- This executes the SELECT and reports iterator estimates and actuals.
EXPLAIN ANALYZE
SELECT order_id, created_at, total_amount
FROM orders
WHERE tenant_id = 42 AND status = 'open'
ORDER BY created_at DESC
LIMIT 50;
```

MySQL documents `EXPLAIN` as an estimate and `EXPLAIN ANALYZE` as an execution that reports iterator timing and rows; `ANALYZE TABLE` refreshes statistics that influence plan choices [6]. Run `EXPLAIN ANALYZE` only for statements whose execution is safe and acceptable in the test environment.

## III. Monitoring and Maintenance (After Creation)

### Monitor plans and actual usage

A plan that mentions an index is not automatically a win. Look for:

- a scan of a large table where a selective lookup was expected;
- a lookup that returns many rows and then performs expensive table/key lookups;
- a sort or temporary grouping structure that a tested ordering/grouping index could avoid;
- estimates that differ sharply from actual row counts;
- regressions after data growth, a schema change, or a statistics update.

**MySQL:** use `EXPLAIN`, `EXPLAIN ANALYZE`, `SHOW INDEX`, `INFORMATION_SCHEMA.STATISTICS`, and `ANALYZE TABLE`. `FORCE INDEX` is a diagnostic experiment, not routine tuning: it can demonstrate the cost of an alternative, but hard-coding a choice can become wrong as data changes.

**MariaDB:** use the MariaDB `EXPLAIN` variants and index metadata, then refresh statistics with the MariaDB-supported `ANALYZE TABLE` operation when distribution has changed. Confirm exact syntax and instrumentation for the installed release.

**SQLite:** use `EXPLAIN QUERY PLAN` and inspect `PRAGMA index_list('orders')` and `PRAGMA index_info('index_name')`. `SCAN` is not inherently bad: a small table or a query returning most rows may correctly scan. Run `ANALYZE` when planner statistics need refreshing, and remember that the EQP display is intended for interactive diagnosis rather than a stable application API [2].

**SQL Server:** inspect estimated and actual execution plans. SQL Server installations commonly use DMVs such as `sys.dm_db_index_usage_stats` for seek/scan/lookup/update activity and `sys.dm_db_index_physical_stats` for physical condition. DMV counters reset or change with events such as restart and failover, so correlate them with an observation window and workload history rather than treating a zero count as permanent proof of uselessness.

### Refresh statistics deliberately

Statistics describe row counts, distributions, and index properties used by the optimizer. They can become stale after bulk loads, deletes, skew changes, or major migrations. A stale estimate may cause a scan when a lookup would be better—or an index lookup followed by millions of row fetches when a scan would be cheaper.

- **MySQL/MariaDB:** `ANALYZE TABLE orders;` refreshes table/index statistics. It is not an index rebuild and should not be used as a substitute for physical maintenance.
- **SQLite:** `ANALYZE;` collects planner statistics. Follow with representative plan checks; SQLite's planner uses its statistics to choose among alternatives [1].
- **SQL Server:** automatic statistics may handle normal changes, while targeted `UPDATE STATISTICS` or a documented maintenance process may be appropriate after exceptional changes. Do not disable or force statistics behavior without measuring the consequence.

### Understand fragmentation before acting

Fragmentation is not a universal performance diagnosis. It can mean page splits, out-of-order leaf pages, free space, or internal page density, and its effect depends on access pattern, storage, cache, and scan size. A random-read workload may tolerate a condition that hurts a large ordered scan. Measure physical metrics and query performance together.

#### SQL Server: reorganize versus rebuild

**Reorganize** is an online, incremental operation that compacts/reorders leaf-level pages and is generally the lighter intervention. **Rebuild** creates a new index structure and is more intensive; it can refresh statistics as part of the operation depending on options, but it consumes resources and can require substantial space. Exact blocking and online behavior depend on edition, version, and options.

```sql
-- SQL Server-specific examples; inspect first and schedule carefully.
ALTER INDEX IX_Orders_Tenant_Status_Created
    ON dbo.Orders REORGANIZE;

ALTER INDEX IX_Orders_Tenant_Status_Created
    ON dbo.Orders REBUILD;
```

Do not select a fixed fragmentation percentage and rebuild every index on a schedule without workload evidence. A blanket rebuild can create avoidable I/O, log growth, blocking, replica lag, and plan churn.

#### MySQL and MariaDB: engine-specific operations

For InnoDB, the appropriate action may be no action, statistics refresh, or an engine-supported table optimization/rebuild. **MySQL/MariaDB `OPTIMIZE TABLE` is not a portable “reorganize index” command**: for transactional tables it can rebuild or recreate storage and may require substantial disk, time, locks, and replication capacity. Check the installed engine, version, and online DDL behavior before running it.

```sql
-- MySQL/MariaDB: potentially expensive; inspect and schedule first.
OPTIMIZE TABLE orders;
```

This command is intentionally shown behind a warning because it is not a harmless routine refresh. Do not run it on every table merely because an index exists.

#### SQLite: no blanket rebuild equivalent

SQLite has no SQL Server-style `ALTER INDEX ... REORGANIZE/REBUILD`. `REINDEX` rebuilds indexes associated with a collation or named index, but it is not a general fragmentation policy. `VACUUM` rewrites and compacts the database file; it is a database-file operation, not a drop-in index-maintenance command, and it needs planning for time and disk space. SQLite's page-oriented file format includes table/index B-trees, overflow pages, and freelist pages, so file size and free-page observations need to be interpreted in that context [3].

```sql
-- SQLite-specific and potentially expensive.
REINDEX ix_orders_tenant_status_created;

-- File rewrite/compaction, not a routine index rebuild.
VACUUM;
```

### Remove unused or redundant indexes safely

An index can be a candidate for removal when it is demonstrably unused over a representative observation period, duplicates another index, or costs more write/storage/maintenance resources than its benefits justify. Before removal:

1. Confirm the observation window included peak, scheduled, ad-hoc, reporting, and failover workloads.
2. Check application code, migrations, constraints, generated queries, and operational scripts.
3. Check whether the index enforces uniqueness or supports a foreign key/constraint.
4. Compare it with longer composite indexes, included columns, partial/filtered predicates, and leftmost prefixes.
5. Save its exact definition and capture baseline plans and write metrics.
6. Remove one index at a time, monitor, and be prepared to restore it.

> **Destructive SQL warning — review before executing:** The following statements permanently remove an index or can trigger a large storage rewrite. Run them only after confirming the object, dependencies, backup/rollback plan, maintenance window, and post-change checks.

```sql
-- MySQL/MariaDB
DROP INDEX ix_old_orders ON orders;

-- SQLite
DROP INDEX IF EXISTS ix_old_orders;

-- SQL Server
DROP INDEX IX_Old_Orders ON dbo.Orders;
```

Dropping an index is not the same as deleting table rows, but it can still cause severe query regressions or remove a uniqueness guarantee. Prefer a reversible deployment process where the old definition is recorded and recreation has been tested.

### Re-evaluate continuously

Index design is a feedback loop, not a one-time migration. Revisit it after:

- a major increase or shift in table cardinality;
- a new tenant, region, or status distribution;
- query or ORM changes;
- a new report, endpoint, or batch job;
- changed hardware, cache, storage, or replication topology;
- a plan regression or write-latency increase.

Keep a short index record: definition, engine/version, owning query or constraint, expected benefit, measured evidence, last review, and removal/rebuild notes. This makes future decisions safer than relying on index names or an old maintenance script.

## Practical checklist

```text
[ ] Capture representative reads, writes, parameters, and latency.
[ ] Inspect existing primary, unique, foreign-key, composite, and specialized indexes.
[ ] Check cardinality, skew, null behavior, row width, and table size.
[ ] Design key order around equality, range, join, order, group, and coverage needs.
[ ] Account for storage, write amplification, locking, logging, and replica impact.
[ ] Create an engine-labeled index in a controlled window.
[ ] Compare estimated and actual plans, rows, reads, and end-to-end latency.
[ ] Refresh statistics when distribution changes; do not confuse this with rebuilding.
[ ] Measure usage and physical condition over a representative period.
[ ] Reorganize, rebuild, optimize, reindex, or vacuum only when evidence and engine rules justify it.
[ ] Remove duplicates/unused indexes only after dependency and rollback review.
[ ] Re-test after data and workload changes.
```

## References

[1]: https://www.sqlite.org/queryplanner.html "SQLite Query Planning"
[2]: https://www.sqlite.org/eqp.html "SQLite EXPLAIN QUERY PLAN"
[3]: https://www.sqlite.org/fileformat2.html "SQLite Database File Format"
[4]: https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/building-the-best-index-for-a-given-select "MariaDB: Building the Best Index for a Given SELECT"
[5]: https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html "MySQL 8.4 Reference Manual: InnoDB Index Types"
[6]: https://dev.mysql.com/doc/refman/8.4/en/explain.html "MySQL 8.4 Reference Manual: EXPLAIN Statement"
[7]: https://dev.mysql.com/doc/refman/8.4/en/information-schema-columns-table.html "MySQL 8.4 Reference Manual: The INFORMATION_SCHEMA COLUMNS Table"
[8]: https://dev.mysql.com/doc/refman/8.4/en/information-schema-statistics-table.html "MySQL 8.4 Reference Manual: The INFORMATION_SCHEMA STATISTICS Table"
[9]: https://dev.mysql.com/doc/refman/8.4/en/innodb-row-format.html "MySQL 8.4 Reference Manual: InnoDB Row Formats"
