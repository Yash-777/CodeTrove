# Composite indexes and leftmost-prefix behavior

A **composite index** (also called a multi-column index) stores one ordered key made from two or more columns. It is one structure, not several unrelated single-column indexes. The order of the key columns is part of the index definition and determines which searches, orderings, and groupings can use its leading portion efficiently.

This lesson uses an orders table and the index:

```sql
-- The syntax is accepted by MySQL, MariaDB, SQLite, and SQL Server.
CREATE INDEX ix_orders_customer_created_status
    ON orders (customer_id, created_at, status);
```

The examples use `created_at` as a timestamp and `status` as a short state such as `paid` or `cancelled`. Adapt data types and schema names to the target engine.

> **Learning goal:** understand exactly what the ordered key `(customer_id, created_at, status)` can do, what it cannot promise, and how to validate a plan in the database engine that will run the query.

## 1. How an ordered composite key is laid out

A B-tree index compares complete keys lexicographically: it compares `customer_id` first, then `created_at` when the customer is equal, and finally `status` when both earlier values are equal. A simplified leaf-level picture looks like this:

```text
(customer_id, created_at, status)

(101, 2025-01-02 09:00, paid)
(101, 2025-01-02 09:00, shipped)
(101, 2025-01-04 12:30, paid)
(101, 2025-01-05 08:10, cancelled)
(102, 2025-01-01 14:00, paid)
(102, 2025-01-03 16:45, shipped)
(103, 2025-01-01 10:00, paid)
```

The first useful contiguous prefixes are:

```text
(customer_id)
(customer_id, created_at)
(customer_id, created_at, status)
```

These are the **leftmost prefixes**. A predicate on `created_at` alone does not describe a contiguous starting section of this ordering, because rows for every customer are interleaved before the desired timestamp values can be found. A predicate on `status` alone is even farther from the left edge.

This is a rule about the ordering of a B-tree, not a guarantee that every optimizer will use an index whenever a leftmost prefix exists. The optimizer estimates cost, row counts, available statistics, sort cost, and table size. It may choose a scan when that is cheaper. SQLite documents `SCAN` versus `SEARCH` and covering-index choices in its high-level plan output, and warns that the output format can change between versions [1] [2].

## 2. Reading the leftmost-prefix rule

For the index `(customer_id, created_at, status)`, these patterns are usually natural matches:

```sql
-- Uses the one-column prefix.
SELECT order_id, created_at, status
FROM orders
WHERE customer_id = 101;

-- Uses the first two columns as an equality-plus-range search.
SELECT order_id, created_at, status
FROM orders
WHERE customer_id = 101
  AND created_at >= '2025-01-01 00:00:00'
  AND created_at <  '2025-02-01 00:00:00';

-- Can constrain all three key columns.
SELECT order_id
FROM orders
WHERE customer_id = 101
  AND created_at = '2025-01-02 09:00:00'
  AND status = 'paid';
```

These patterns generally do **not** form the same leftmost search:

```sql
-- No predicate on customer_id: not normally a seek through this prefix.
SELECT order_id
FROM orders
WHERE created_at >= '2025-01-01 00:00:00';

-- status is not the first key column.
SELECT order_id
FROM orders
WHERE status = 'paid';
```

The last two queries might still use the index for a scan, a covering read, an engine-specific skip strategy, or another reason. That is different from saying that the index provides a narrow left-to-right seek on `created_at` or `status`. Do not infer a plan from the index definition alone; inspect the target engine's plan and actual row counts.

A missing middle predicate deserves special care:

```sql
-- customer_id is constrained, but created_at is not.
SELECT order_id
FROM orders
WHERE customer_id = 101
  AND status = 'paid';
```

The index can usually locate the `customer_id = 101` region, but `status` values are not globally adjacent within that region because `created_at` comes first. The engine may scan that customer's portion and filter `status`, or choose a different index. The exact details are engine- and statistics-dependent.

## 3. Equality, range, ordering, and grouping together

A common workload has an equality condition followed by a time window:

```sql
SELECT order_id, created_at, status, total_amount
FROM orders
WHERE customer_id = 101
  AND created_at >= '2025-01-01 00:00:00'
  AND created_at <  '2025-02-01 00:00:00'
ORDER BY created_at;
```

The equality narrows the search to one customer's section. The range then selects a contiguous time interval in that section. Because the index is ordered by `created_at` after the fixed customer value, the engine may be able to read rows in the requested order without a separate sort. That is a useful shape, but it remains a plan choice: selected columns, direction, null ordering, residual filters, and estimated cost can change the result.

A range is often a boundary in the usable search key. For example:

```sql
SELECT order_id
FROM orders
WHERE customer_id = 101
  AND created_at >= '2025-01-01 00:00:00'
  AND created_at <  '2025-02-01 00:00:00'
  AND status = 'paid';
```

The engine can seek by customer and time range. `status = 'paid'` may be applied while reading index entries, as a residual predicate, or after fetching table rows. Do not promise that `status` becomes a third independent seek range after a broad `created_at` range. Some engines have additional optimizations; the portable lesson is that the leading equality and the next range are the clear part of the ordered search.

With equality on the earlier columns, later columns are more useful for ordering or grouping:

```sql
-- The fixed customer makes created_at the next varying order.
SELECT order_id, created_at, status
FROM orders
WHERE customer_id = 101
ORDER BY created_at, status;

-- The index order can be useful for grouping by the leading columns.
SELECT customer_id, created_at, COUNT(*) AS order_count
FROM orders
GROUP BY customer_id, created_at;
```

The grouping example can still require a sort or temporary structure if the engine chooses a different plan, if expressions are involved, or if the query needs data outside the index. SQLite's query-planner documentation explains that multi-column indexes can satisfy lookup and ordering work, while its plan documentation exposes temporary sorting structures when one is needed [1] [2]. MariaDB's indexing guidance similarly recommends starting from the query's equality conditions and then considering range, grouping, and ordering requirements—not applying one fixed column-order formula to every query [3].

A query that orders by a non-prefix sequence is not automatically supported by this key:

```sql
-- The requested order starts with created_at, not customer_id.
SELECT order_id, customer_id, created_at
FROM orders
ORDER BY created_at;
```

The optimizer may scan and sort, use another index, or choose an engine-specific strategy. If this ordering is important, test a separately designed index against the real workload rather than adding one by habit.

## 4. Column order: a workload decision, not a universal slogan

There is no universal rule such as “always put the most selective column first” or “always put the date first.” A useful design process is:

1. List the important query shapes, including equality predicates, ranges, joins, ordering, grouping, and projections.
2. Identify which predicates need a contiguous prefix and which columns should provide the output order.
3. Compare estimated and actual plans on representative data.
4. Account for write frequency, index size, statistics quality, and other indexes already present.

For a workload dominated by `WHERE customer_id = ?` plus a time range, `(customer_id, created_at, status)` is a plausible candidate. For a workload dominated by a global time feed, `(created_at, customer_id, status)` might be more appropriate. For a workload that always groups by status first, a different ordering may win. None of these is universally best.

**Selectivity** describes how much a predicate reduces the candidate set; **cardinality** usually describes the number of distinct values, or an optimizer's estimate of that number. A unique customer identifier is often more selective than a two-value status, but a low-cardinality column can still be useful when combined with other columns, when it supports ordering, or when a query reads a large portion of a covering index. Conversely, a high-cardinality column may be a poor first key when the workload cannot use it as a prefix or when the table is tiny enough that a scan is cheaper.

Composite statistics are about distributions, not just separate column counts. If almost every order for a customer has the same status, the pair `(customer_id, status)` may filter less than independent-cardinality arithmetic suggests. Refresh statistics using the engine's supported mechanism and verify plans after significant data changes.

## 5. Covering indexes: avoiding a base-row lookup

An index is **covering** for a query when the index entries contain every value needed to return the result and evaluate its relevant predicates. The engine may then avoid fetching the base table row for each match. This can reduce random I/O, but it increases index width and write/maintenance cost.

For example, an index whose key includes all selected columns can cover a narrow report:

```sql
-- This is a separate design example, not a recommendation to add it blindly.
CREATE INDEX ix_orders_customer_created_status_total
    ON orders (customer_id, created_at, status, total_amount);

SELECT created_at, status, total_amount
FROM orders
WHERE customer_id = 101
  AND created_at >= '2025-01-01 00:00:00'
  AND created_at <  '2025-02-01 00:00:00';
```

Engine details matter:

- **SQLite:** `EXPLAIN QUERY PLAN` can report `USING COVERING INDEX`. SQLite's planner documentation describes covering indexes as a way to avoid an additional table lookup [1] [2].
- **MySQL/InnoDB:** a secondary index record includes the primary-key value, so a query that selects the primary key plus indexed columns may be covered; selecting another non-key column usually requires reaching the clustered primary-key record. The InnoDB documentation describes this secondary-key behavior [4]. Use `EXPLAIN` and, where supported, `EXPLAIN ANALYZE` to confirm [5].
- **MariaDB/InnoDB:** the same InnoDB primary-key locator consideration applies. MariaDB's guidance also emphasizes the storage and update cost of adding index columns [3].
- **SQL Server:** a nonclustered index can keep search/order columns as key columns and add projected columns with `INCLUDE`, for example:

  ```sql
  -- SQL Server only: INCLUDE is not portable SQL.
  CREATE INDEX IX_orders_customer_created
      ON dbo.orders (customer_id, created_at)
      INCLUDE (status, total_amount);
  ```

  `INCLUDE` can make a query covered without changing key ordering, but it still consumes storage and must be maintained.

A covering plan is an optimization, not a semantic requirement. Avoid putting large text or rarely selected columns into a composite index solely to chase an “index-only” label.

## 6. Functions, expressions, and search patterns

An ordinary index on a column is ordered by the stored column value. Wrapping that column in a function can prevent the engine from using the ordinary ordering as a narrow search:

```sql
-- MySQL/MariaDB/SQLite-style example; SQL Server uses a different expression.
-- Often prevents a simple index on created_at from being a direct range seek.
SELECT COUNT(*)
FROM orders
WHERE DATE(created_at) = '2025-01-15';
```

A portable rewrite for a timestamp column is a half-open range:

```sql
SELECT COUNT(*)
FROM orders
WHERE created_at >= '2025-01-15 00:00:00'
  AND created_at <  '2025-01-16 00:00:00';
```

Engine-specific alternatives exist, but they are not interchangeable:

- **MySQL:** a functional index can be created for supported expressions using MySQL's expression-index syntax. Verify version, expression restrictions, and the exact expression match before relying on it.
- **MariaDB:** a virtual or persistent generated column can expose a normalized expression, and an index can be placed on that column. This is MariaDB-specific DDL and should be tested with the target version.
- **SQLite:** an expression index can index a deterministic expression. The query expression must match the indexed expression closely enough for SQLite's planner to recognize it.
- **SQL Server:** a computed column can be indexed when the expression and required SET options meet SQL Server's rules.

These features solve different problems and have different determinism, collation, and maintenance rules. Label migrations and examples for the engine instead of presenting one as portable.

Leading-wildcard searches have a similar issue:

```sql
-- An ordinary B-tree usually cannot seek to the first character of the value.
SELECT order_id
FROM orders
WHERE customer_note LIKE '%late%';

-- A prefix pattern can sometimes be converted into a range by the optimizer.
SELECT order_id
FROM orders
WHERE customer_note LIKE 'late%';
```

`LIKE 'late%'` is often index-friendly, subject to data type, collation, escape rules, and engine settings. `LIKE '%late%'` has no known starting key for an ordinary B-tree and commonly requires scanning many entries. MySQL, MariaDB, SQLite, and SQL Server each have their own collations, pattern optimizations, and full-text/search features; inspect the plan rather than treating either pattern as an unconditional promise.

## 7. Overlapping prefixes and redundant indexes

Because `(customer_id, created_at, status)` begins with `(customer_id)` and `(customer_id, created_at)`, indexes with those exact leading sequences overlap:

```text
ix_customer                 (customer_id)
ix_customer_created         (customer_id, created_at)
ix_customer_created_status  (customer_id, created_at, status)
```

The longest index may often satisfy a query that only needs the shorter prefix, but “often” is not “always.” A shorter index may be substantially smaller, cheaper to maintain, or better for a very frequent lookup. A unique constraint, a filtered/partial definition, included columns, collation, sort direction, clustering, or engine-specific storage behavior can make two apparently similar indexes serve different purposes.

Exact duplicates are stronger redundancy candidates:

```text
ix_a (customer_id, created_at)
ix_b (customer_id, created_at)
```

Different names do not make identical key definitions different access paths. Still, inspect constraints, included columns, predicates, and deployment history before removing anything. Inventory indexes using the target engine's metadata, group columns in `SEQ_IN_INDEX`/equivalent order, and compare the result with real query plans and write workload. MySQL exposes ordered index-column metadata and estimated cardinality through `INFORMATION_SCHEMA.STATISTICS` [6].

> **Warning — destructive operation:** the following statements remove schema objects. Do not run them in production from a lesson. First confirm ownership, constraints, dependencies, backup/recovery procedures, and measured plan impact in a staging environment; then use a reviewed migration.
>
> ```sql
> -- MySQL/MariaDB syntax; review before executing.
> DROP INDEX ix_customer ON orders;
>
> -- SQLite syntax; review before executing.
> DROP INDEX ix_customer;
>
> -- SQL Server syntax; review before executing.
> DROP INDEX IX_orders_customer ON dbo.orders;
> ```
>
> In SQL Server, a constraint-backed index may need the constraint handled through the appropriate migration rather than `DROP INDEX`. In all engines, dropping an index can affect uniqueness, foreign-key support, plans, and concurrency—not only speed.

## 8. How to validate a composite-index decision

Use a representative data volume and parameter values. A plan that is good for one customer with ten orders may be poor for a customer with millions of orders.

### MySQL

```sql
-- MySQL only: refresh optimizer statistics for this table.
ANALYZE TABLE orders;

-- MySQL: inspect estimates.
EXPLAIN
SELECT order_id, created_at, status
FROM orders
WHERE customer_id = 101
  AND created_at >= '2025-01-01 00:00:00'
  AND created_at <  '2025-02-01 00:00:00'
ORDER BY created_at;

-- MySQL 8.0+: executes the statement and reports iterator timing/rows.
EXPLAIN ANALYZE
SELECT order_id, created_at, status
FROM orders
WHERE customer_id = 101
  AND created_at >= '2025-01-01 00:00:00'
  AND created_at <  '2025-02-01 00:00:00'
ORDER BY created_at;
```

`EXPLAIN` contains estimates; `EXPLAIN ANALYZE` executes supported statements and reports observed iterator behavior. MySQL documents both the distinction and the role of refreshed statistics [5]. Do not add `FORCE INDEX` as a routine fix: it can be useful as a diagnostic comparison, but it can become wrong as data and versions change.

### SQLite

```sql
-- SQLite: gather statistics after loading representative data.
ANALYZE;

EXPLAIN QUERY PLAN
SELECT order_id, created_at, status
FROM orders
WHERE customer_id = 101
  AND created_at >= '2025-01-01 00:00:00'
  AND created_at <  '2025-02-01 00:00:00'
ORDER BY created_at;
```

Look for a `SEARCH` using the intended index, and check whether SQLite reports a temporary sort or a covering index. Treat the textual format as diagnostic output, not a stable API [2].

### MariaDB

```sql
-- MariaDB: inspect the optimizer's chosen access path.
EXPLAIN
SELECT order_id, created_at, status
FROM orders
WHERE customer_id = 101
  AND created_at >= '2025-01-01 00:00:00'
  AND created_at <  '2025-02-01 00:00:00'
ORDER BY created_at;
```

MariaDB's documented index-design advice is a starting heuristic. Validate with the actual schema, distribution, version, and workload rather than assuming its suggested order is universal [3].

### SQL Server

```sql
-- SQL Server only: inspect the estimated plan in the client.
SELECT order_id, created_at, status
FROM dbo.orders
WHERE customer_id = 101
  AND created_at >= '2025-01-01T00:00:00'
  AND created_at <  '2025-02-01T00:00:00'
ORDER BY created_at;
```

Use SQL Server Management Studio or another supported client to compare the estimated and actual execution plans. A seek is not automatically faster than a scan: a scan can be the sensible choice for a small table or a predicate returning a large fraction of rows.

## 9. A compact design checklist

Before creating `(customer_id, created_at, status)`, ask:

- Does a real query constrain `customer_id`, the leftmost column?
- Is `created_at` normally an equality, a range, an ordering key, or a grouping key after that customer predicate?
- Is `status` selective enough, or is it mainly a residual filter or covering column?
- Will the index cover a high-value query without becoming unnecessarily wide?
- Are `customer_id` and `created_at` correlated in a way that makes separate cardinality estimates misleading?
- Does an existing longer index already provide the needed prefix?
- What write, storage, and maintenance cost will every insert, update, and delete pay?
- Have plans and actual row counts been checked in MySQL, SQLite, MariaDB, or SQL Server as appropriate?

The durable idea is simple: **a composite index is an ordered path through a workload, not a bag of independent indexes**. Design its left edge around the query shapes you need, preserve uncertainty where optimizer behavior is engine-dependent, and prove the result with plans and measurements.

## References

[1]: https://www.sqlite.org/queryplanner.html "SQLite Query Planning"

[2]: https://www.sqlite.org/eqp.html "SQLite EXPLAIN QUERY PLAN"

[3]: https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/building-the-best-index-for-a-given-select "MariaDB: Building the Best Index for a Given Select"

[4]: https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html "MySQL 8.4: InnoDB Index Types"

[5]: https://dev.mysql.com/doc/refman/8.4/en/explain.html "MySQL 8.4: EXPLAIN Statement"

[6]: https://dev.mysql.com/doc/refman/8.4/en/information-schema-statistics-table.html "MySQL 8.4: The INFORMATION_SCHEMA STATISTICS Table"
