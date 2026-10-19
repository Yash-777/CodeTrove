# Index fundamentals and query plans

Indexes are one of the main ways a database avoids reading every row for every query. They are not magic switches, however: an optimizer chooses among scans, index access paths, joins, and sorts using estimates about data distribution, page reads, and CPU work. A good lesson therefore needs two skills together:

1. **Designing an index that matches a real workload.**
2. **Reading a plan well enough to test whether the index helped.**

The examples below use a table called `feature` and a column called `name`. Replace those names with objects in your own schema. Unless a block is explicitly labeled otherwise, SQL is **MySQL 8.x syntax**.

## 1. Table versus index

A table is the logical collection of rows and columns that your query returns. An index is a separate, database-managed access structure containing key values in an order that makes certain predicates, joins, or orderings cheaper. An index does not create a second user-facing table that you should query with `SELECT * FROM index_name`.

A simplified picture is:

```text
Table: feature
+----+------------+----------+
| id | name       | payload  |
+----+------------+----------+
|  1 | Cart View  | ...      |
|  2 | Home       | ...      |
|  3 | Cart View  | ...      |
+----+------------+----------+

Index on name (simplified B-tree leaf order)
Cart View  -> row locator for id 1
Cart View  -> row locator for id 3
Home      -> row locator for id 2
```

The real representation contains page and record metadata, and the row locator depends on the engine. SQLite describes table and index B-trees as page-based structures with interior and leaf pages [1] [2]. In MySQL InnoDB, a primary key is the clustered index when one exists; a secondary-index record includes the primary-key value used to reach the clustered row [3]. If an InnoDB table has no primary key, InnoDB chooses a suitable `UNIQUE NOT NULL` index or creates a hidden clustered index named `GEN_CLUST_INDEX`; defining an intentional primary key is clearer and usually preferable [3]. InnoDB row formats also affect the physical representation of records and large values [9].

A secondary index can therefore reduce the search for `name = 'Cart View'`, but a `SELECT *` may still require a second lookup to fetch columns that are not stored in that secondary index. An index containing every column needed by a query is sometimes called a **covering index**; coverage can avoid that extra table-row lookup, but it increases index width and write/storage cost.

### Engine terminology is not interchangeable

- **MySQL/InnoDB:** “clustered index” means the table records are stored in the leaf pages of the primary-key B-tree. It does not mean rows have an immutable physical position. Secondary indexes point through the primary key.
- **SQLite:** tables and indexes are B-trees in the database file; the rowid table and index B-trees have engine-specific details. Do not copy InnoDB clustered-index rules into SQLite [1] [2] [4].
- **MariaDB:** InnoDB commonly has the same primary-key/secondary-key model described above, but optimizer output and available features depend on MariaDB version and storage engine [5].
- **SQL Server:** a clustered index defines the table’s leaf-level row organization, and a table has at most one. A heap has RID locators; a nonclustered index on a heap uses a RID, while a nonclustered index on a clustered table generally uses the clustered key as its row locator. “Clustered” here is SQL Server terminology and is not a portable `CREATE INDEX` clause.

## 2. Scan, lookup, seek, and what the row counts mean

A **table scan** reads table pages broadly and evaluates the predicate as it goes. It is often the right plan when the query needs most rows, the table is tiny, the predicate is not selective, or reading the table sequentially is cheaper than traversing an index.

An **index lookup** (also called a seek or a point/range access path in different engines) navigates an index to a key or key range. It may then fetch rows from the table or clustered index. A lookup is not necessarily one row: `name = 'Cart View'` can find five matching index entries, and a range predicate can find thousands.

Keep these quantities separate:

- **Rows examined/scanned:** how much work an access path considered.
- **Rows returned:** rows that survive the predicate and are passed upward.
- **Estimated rows:** the optimizer’s prediction before execution.
- **Actual rows:** what execution observed in an actual plan.
- **Cost:** an engine-specific estimate used to compare alternatives, not a promise of milliseconds.

An index can be used even when the plan still reads many entries. Conversely, a full scan can be efficient when the data is already cached or the result is large. Indexes improve access to suitable data; they do not make every query faster.

## 3. Choosing an index from query shape

Start with the workload, not with a rule such as “index every column.” Candidates commonly come from columns used in:

- equality predicates in `WHERE` clauses;
- join conditions, especially foreign-key sides that are searched frequently;
- range predicates such as dates or numeric intervals;
- `ORDER BY` and `GROUP BY` expressions when the same query shape is frequent;
- uniqueness constraints, where the index also enforces data integrity.

Selectivity matters. An index on a flag with two values may be unattractive if nearly half of the table matches either value. A low-cardinality index can still be useful for a highly skewed distribution, a selective combined predicate, or a covering access path. MariaDB’s indexing guidance recommends considering equality columns first, then range, grouping, and ordering needs, while accounting for index maintenance on writes [5].

### Column order and the leftmost prefix

For this MySQL example:

```sql
-- MySQL: one composite index, ordered from left to right.
CREATE INDEX idx_orders_customer_status_created
    ON orders (customer_id, status, created_at);
```

The index is naturally useful for `customer_id = 42`, and often for `customer_id = 42 AND status = 'open'`. It is generally not a substitute for an index beginning with `status` when the query filters only on `status`; the optimizer cannot usually jump directly into the middle of the ordered key. Range conditions and ordering interactions can make the details more complex, so verify with a plan rather than relying on a slogan.

Avoid redundant indexes. For example, `(customer_id, status)` may make a separate `(customer_id)` index unnecessary for many workloads, but constraints, covering needs, sort order, and actual queries still matter. Inspect usage and plans before removing anything.

Indexes have costs: extra storage, extra pages to read, and maintenance during `INSERT`, `UPDATE`, and `DELETE`. A wide index is especially expensive when its columns change frequently. Revisit indexes as query patterns and data distributions evolve.

## 4. Creating and inspecting indexes in MySQL

### Create an index

```sql
-- MySQL: ordinary non-unique secondary index.
CREATE INDEX idx_feature_name ON feature (name);

-- MySQL: uniqueness is both a data-integrity rule and an access path.
CREATE UNIQUE INDEX uq_feature_external_key
    ON feature (external_key);
```

MySQL’s `CREATE INDEX` syntax is not the generic SQL Server form: do not add `CLUSTERED` or `NONCLUSTERED` to a MySQL statement. In InnoDB, whether an index is clustered follows the table’s primary-key design, not a MySQL `CLUSTERED` keyword [3].

### Inspect the table and its indexes

```sql
-- MySQL: server version and table definition.
SELECT VERSION();
SHOW CREATE TABLE feature\G

-- MySQL: one row per indexed column, including sequence and cardinality estimate.
SHOW INDEX FROM feature;

-- MySQL: a report that preserves composite-index column order.
SELECT
    INDEX_NAME,
    SEQ_IN_INDEX,
    COLUMN_NAME,
    NON_UNIQUE,
    CARDINALITY,
    COLLATION,
    INDEX_TYPE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'feature'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;
```

`SHOW INDEX` and `INFORMATION_SCHEMA.STATISTICS` describe definitions and estimates; they are not a direct measure of whether a specific production query used an index. `CARDINALITY` is an estimate and can be stale until statistics are refreshed [6].

For column metadata, MySQL’s `INFORMATION_SCHEMA.COLUMNS` exposes type, length, character set, nullability, and `COLUMN_KEY` [7]. `COLUMN_KEY` values such as `PRI`, `UNI`, and `MUL` are useful clues, but an empty value should not be overinterpreted: a column can be a later part of a composite non-unique index and still have an empty `COLUMN_KEY` in some metadata presentations [7].

### Refresh MySQL statistics

```sql
-- MySQL: collects or refreshes optimizer statistics for the table.
ANALYZE TABLE feature;
```

`ANALYZE TABLE` does not create an index. It refreshes statistics that influence row-count and cost estimates, so a plan can change after substantial data changes even when the schema did not. Re-check the plan after running it; the newest statistics are estimates, not a guarantee of a faster result [6] [8].

## 5. Before and after: reading a MySQL plan

The following is a compact teaching example. It intentionally shows **1,182 rows scanned versus 5 rows matched**. The costs and timings are **illustrative only**: actual output depends on MySQL version, data, indexes, statistics, hardware, cache state, and concurrent load.

### Before the index

```sql
-- MySQL: this statement is run only when using EXPLAIN ANALYZE; see the next section.
EXPLAIN ANALYZE
SELECT *
FROM feature
WHERE name = 'Cart View';
```

A representative shape could be:

```text
-> Filter: (feature.name = 'Cart View')
      (cost=121 rows=5) (actual time=0.14..1.35 rows=5 loops=1)
    -> Table scan on feature
          (cost=121 rows=1182) (actual time=0.13..1.35 rows=1182 loops=1)
```

Read it from the bottom upward:

1. The table scan considered all 1,182 rows.
2. The filter retained 5 rows.
3. `cost=121` is an optimizer cost unit, not 121 milliseconds.
4. The `actual time` values are sample measurements, not a promise for your machine.

### Add the index and inspect again

```sql
-- MySQL: schema change; build time and locking behavior depend on the table and version.
CREATE INDEX idx_feature_name ON feature (name);

EXPLAIN ANALYZE
SELECT *
FROM feature
WHERE name = 'Cart View';
```

A representative post-index shape could be:

```text
-> Index lookup on feature using idx_feature_name (name='Cart View')
      (cost=1.75 rows=5) (actual time=0.095..0.099 rows=5 loops=1)
```

This plan navigates to the `name` key instead of scanning every table row. For `SELECT *`, InnoDB may use the secondary index’s primary-key value to fetch the full clustered row [3]. The example shows an estimated cost of `1.75` and five matching rows, but those numbers are illustrative; do not compare them as universal units across engines or servers. Also remember that an equality predicate returning a large fraction of the table may still make a scan cheaper.

## 6. `EXPLAIN` versus `EXPLAIN ANALYZE`

### MySQL

```sql
-- MySQL: estimated plan; it does not run the SELECT.
EXPLAIN
SELECT * FROM feature WHERE name = 'Cart View';

-- MySQL: estimated plan in JSON format; it does not run the SELECT.
EXPLAIN FORMAT=JSON
SELECT * FROM feature WHERE name = 'Cart View';

-- MySQL: executes the supported statement and reports iterator estimates plus actual timing/rows.
EXPLAIN ANALYZE
SELECT * FROM feature WHERE name = 'Cart View';
```

Plain `EXPLAIN` asks the optimizer what it plans to do. Its row counts and costs are estimates based on statistics; it is appropriate when you need a plan without running the query. MySQL `EXPLAIN ANALYZE` actually executes supported statement forms and reports observed iterator behavior, including timing and rows [8]. It is therefore **not** a dry run. Use it carefully with statements that could modify data, and prefer a read-only `SELECT` while learning. If your MySQL version does not support the statement form or `EXPLAIN ANALYZE`, use the version’s documented alternative.

A useful diagnostic sequence is:

```text
1. Run EXPLAIN and record access type, chosen index, estimated rows, and filtering.
2. Check statistics and data distribution.
3. Run EXPLAIN ANALYZE for a safe read-only query.
4. Compare estimated rows with actual rows.
5. Test representative parameter values, not only one lucky value.
```

A large estimate/actual mismatch can explain a poor index choice, but it does not by itself prove which index should be created. Check the predicate, correlation between columns, stale statistics, and whether the query returns too much data.

### MariaDB

MariaDB has its own plan syntax and version history. For MariaDB, label statements explicitly and consult the version you run; for example, MariaDB commonly uses:

```sql
-- MariaDB: actual statistics format; this is not MySQL syntax to assume blindly.
ANALYZE FORMAT=JSON
SELECT * FROM feature WHERE name = 'Cart View';
```

`EXPLAIN` is also available in MariaDB, but output fields and supported actual-analysis syntax are not identical to MySQL. MariaDB’s index advice and InnoDB behavior should be checked against MariaDB documentation [5].

### SQLite

```sql
-- SQLite: high-level plan; SCAN and SEARCH describe access choices.
EXPLAIN QUERY PLAN
SELECT * FROM feature WHERE name = 'Cart View';
```

SQLite’s `EXPLAIN QUERY PLAN` is an interactive/debugging format that commonly distinguishes `SCAN` from `SEARCH`, can identify an index or covering index, and can reveal temporary sorting structures [2]. It is not MySQL `EXPLAIN ANALYZE`, and its output format can change between SQLite versions. SQLite’s separate `EXPLAIN` command exposes virtual-machine bytecode rather than MySQL-style iterator timing [2].

### SQL Server

```sql
-- SQL Server: estimated plan only; the SELECT is not executed.
SET SHOWPLAN_TEXT ON;
GO
SELECT * FROM dbo.Feature WHERE name = N'Cart View';
GO
SET SHOWPLAN_TEXT OFF;
GO
```

`SET SHOWPLAN_TEXT` is SQL Server syntax and must not be sent to MySQL, MariaDB, or SQLite. SQL Server also has separate actual-plan/statistics mechanisms that execute the statement; choose those deliberately when you need runtime observations. SQL Server plan operators such as **Clustered Index Seek**, **Index Seek**, **Key Lookup**, and **Table Scan** have SQL Server-specific meanings. Do not infer that a MySQL `type` value or a SQLite `SEARCH` detail maps one-to-one to a SQL Server operator.

## 7. Why a small table may correctly scan

Suppose `company` contains only two rows:

```sql
-- MySQL: an index can exist and still be ignored.
CREATE INDEX idx_company_name ON company (name);
EXPLAIN SELECT * FROM company WHERE name = 'code';
```

The optimizer may choose a table scan because reading two nearby rows is cheaper than traversing an index and then fetching the matching row. This is not evidence that the index definition failed. It is a cost-based choice. There is no universal “use an index after N rows” threshold: page size, cache state, row width, selectivity, and query shape all matter. The same principle applies to SQLite, MariaDB, and SQL Server, although each engine estimates cost differently.

Avoid forcing an index merely because a plan says `SCAN`. First ask:

- Does the predicate return a substantial share of the table?
- Is the table small enough that a scan is cheaper?
- Are statistics stale?
- Is the query covered by the index, or does every match require a table lookup?
- Is the predicate written in a way that can use the key, rather than applying a function to the indexed column?

## 8. `FORCE INDEX` as a diagnostic, not routine tuning

MySQL lets you test a hypothesis by asking for a particular index:

```sql
-- MySQL: diagnostic experiment; not a general recommendation.
EXPLAIN ANALYZE
SELECT *
FROM company FORCE INDEX (idx_company_name)
WHERE name = 'code';
```

Compare this with the unforced plan. If the forced plan is better for representative data, investigate why the optimizer rejected the index: statistics may be stale, selectivity may be misestimated, or the unforced index may be a poor match. If it is worse, the optimizer’s scan choice may be sensible.

`FORCE INDEX` hard-codes an access-path preference and can become harmful as the table grows, data distribution changes, or a better index is added. Keep it as a controlled diagnostic or a carefully justified, monitored exception. It is MySQL syntax; do not present it as portable SQL. MariaDB has related index-hint syntax, while SQLite and SQL Server use different mechanisms and do not accept this exact clause.

## 9. Safe indexing workflow

1. **Capture a real query.** Include representative predicates, joins, ordering, and result columns.
2. **Inspect existing definitions.** In MySQL use `SHOW INDEX` or `INFORMATION_SCHEMA.STATISTICS`; in SQLite inspect the schema and use `EXPLAIN QUERY PLAN`; use the native catalog/plan tools for MariaDB or SQL Server.
3. **Record a baseline.** Save the estimated plan and, for a safe read-only query, actual observations.
4. **Check statistics.** Refresh them with the engine-specific command when justified by data changes.
5. **Create the narrowest useful index.** Put composite columns in an order that matches the workload; consider whether a covering index is worth its write cost.
6. **Test before and after.** Use more than one parameter value and include warm-cache and cold-ish operational conditions where practical.
7. **Measure write impact.** Inserts and updates now maintain another structure.
8. **Review redundant or unused indexes.** Do not remove one solely because a single query did not use it; another workload or a uniqueness constraint may depend on it.
9. **Re-evaluate over time.** Data growth and distribution changes can turn a good scan into a lookup opportunity—or make a once-useful index overhead.

> **Warning: destructive operation.** The following removes an index and can change performance or remove a uniqueness guarantee. Confirm dependencies, test in a non-production environment, and have a rollback plan before running it.
>
> ```sql
> -- MySQL: remove an index only after review.
> DROP INDEX idx_feature_name ON feature;
> ```

SQLite, MariaDB, and SQL Server have different index-drop forms and constraint behavior; do not copy the MySQL statement without labeling and checking the target engine.

## References

[1]: https://www.sqlite.org/queryplanner.html "SQLite Query Planning"
[2]: https://www.sqlite.org/eqp.html "SQLite EXPLAIN QUERY PLAN"
[3]: https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html "MySQL 8.4 Reference Manual: InnoDB Index Types"
[4]: https://www.sqlite.org/fileformat2.html "SQLite Database File Format"
[5]: https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/building-the-best-index-for-a-given-select "MariaDB: Building the Best Index for a Given SELECT"
[6]: https://dev.mysql.com/doc/refman/8.4/en/information-schema-statistics-table.html "MySQL 8.4 Reference Manual: The INFORMATION_SCHEMA STATISTICS Table"
[7]: https://dev.mysql.com/doc/refman/8.4/en/information-schema-columns-table.html "MySQL 8.4 Reference Manual: The INFORMATION_SCHEMA COLUMNS Table"
[8]: https://dev.mysql.com/doc/refman/8.4/en/explain.html "MySQL 8.4 Reference Manual: EXPLAIN Statement"
[9]: https://dev.mysql.com/doc/refman/8.4/en/innodb-row-format.html "MySQL 8.4 Reference Manual: InnoDB Row Formats"
