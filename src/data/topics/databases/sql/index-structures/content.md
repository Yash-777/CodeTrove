# B-tree pages and clustered/nonclustered indexes

An index is a search structure maintained by a database engine. It can turn a predicate such as `WHERE customer_id = 42` into a small number of page reads instead of checking every row. That speed is not free: each index consumes storage, must be maintained by writes, and can become a poor choice when statistics or query patterns change.

This lesson focuses on **B-tree page structure** and the meaning of a row locator in **SQL Server** and **MySQL InnoDB**. The word “clustered” is not a portable promise across database products: it describes different implementation details in different engines.

## 1. What a B-tree page does

A B-tree is a balanced, ordered tree. “Balanced” means that searches descend through approximately the same number of levels, whether the requested key is near the beginning or end. A database stores each node in a fixed-size page (the exact page format and size are engine-specific).

A B-tree has three useful page roles:

- **Root page** — the top directory. It contains key boundaries and child-page references. A very small tree can have a root that is also its only leaf.
- **Intermediate pages** — directory pages between the root and leaves. Each entry routes a key range to a lower-level page. A large tree can have several intermediate levels.
- **Leaf pages** — the bottom level, in key order. Leaf contents depend on the index and engine: they may be complete table records or index records containing a key and a locator.

A lookup follows the key from root to intermediate pages and then to a leaf. A range lookup can continue through neighboring leaf pages, which is why an index whose key order matches a range or sort can avoid extra work. B-tree files can also contain non-tree pages such as overflow or freelist pages; those are not ordinary root, intermediate, or leaf nodes. SQLite documents separate table/index interior and leaf page types explicitly [1].

A compact conceptual view is:

```text
                 root page
              [10 | 40 | 80]
              /      |      \
             /       |       \
     intermediate  intermediate  intermediate
       [1..9]       [40..79]       [80..]
          |             |             |
       leaf pages    leaf pages    leaf pages
      [1, 3, 9]   [40, 51, 79]  [80, 91, 105]
          |             |             |
       payload       payload       payload
```

The keys shown here are separators, not necessarily every key stored in the tree. A page split may create a new page and promote a separator upward; an engine may also merge or redistribute pages during maintenance. Do not infer physical disk adjacency from the drawing.

## 2. Index leaf pages versus data leaf pages

The phrase **leaf page** alone is incomplete. Ask: *what is the payload at the leaf?*

- A **data leaf** stores the table row itself (or the engine’s row record). Following a key to this leaf can finish the lookup.
- An **index leaf** stores index key columns plus a locator, and may store included/covering columns. It does not necessarily contain the rest of the base-table row. A query that needs other columns may perform a second lookup through that locator.

This distinction is central to SQL Server:

- A **clustered index** is the table’s row storage organized by the clustered key. Its leaf level contains the data rows (often described as data pages), so there is no separate heap holding the same table rows.
- A **nonclustered index** is a separate B-tree. Its leaf level contains index pages: indexed key values, optional included columns, and a locator for the corresponding row. The underlying table rows are not reordered by this nonclustered key.
- A **heap** is a table with no clustered index. Its data rows live on heap data pages, and a nonclustered index points to those rows with a RID.

“Physically ordered” should be read carefully. A clustered key defines the logical order of rows in the clustered B-tree and affects page organization; it does not mean every row is permanently adjacent on disk or that an insertion cannot cause fragmentation.

## 3. SQL Server: clustered and nonclustered locators

The following terminology is specifically **Microsoft SQL Server** terminology.

### Heap table: RID locator

If a SQL Server table is a heap, a nonclustered leaf entry identifies the base row with a **RID (row identifier)**. Conceptually, a RID contains:

```text
(file ID, data-page number, slot number)
```

A query that finds qualifying entries in the nonclustered index can use that RID for a **RID Lookup** into the heap. The lookup is often useful for a small result, but many lookups can cost more than a scan.

### Table with a clustered index: clustered-key locator

If the table has a clustered index, SQL Server uses the **clustered index key** as the row locator in nonclustered indexes, rather than a heap RID. The nonclustered leaf therefore carries enough clustered-key information to navigate to the clustered leaf and retrieve columns not present in the nonclustered index.

If the clustered index is not unique, duplicate clustered-key values need a tie-breaker. SQL Server adds a hidden four-byte **uniqueifier** for duplicate rows. In practical terms, a nonclustered locator for such a table is the clustered key plus the uniqueifier needed to identify one row among duplicates. A declared `UNIQUE` clustered key avoids this particular duplicate-key ambiguity, although it does not remove all costs of a wide key.

```text
SQL Server nonclustered leaf
  [nonclustered key | included columns | locator]
                                      |
                     +----------------+----------------+
                     | heap: RID      | clustered table:
                     | (file,page,slot)| clustered key [+ uniqueifier]
```

A nonclustered index can be **covering** for a query if its key and included columns provide every requested value. In that case the engine may not need a RID Lookup or Key Lookup. Coverage is query- and plan-dependent; it is not a guarantee that an index is always used.

SQL Server examples (syntax is **not** portable to MySQL, SQLite, or MariaDB):

```sql
-- SQL Server: clustered key and a separate nonclustered access path.
CREATE TABLE dbo.OrderLine
(
    OrderLineId bigint NOT NULL,
    OrderId     bigint NOT NULL,
    ProductId   bigint NOT NULL,
    Quantity    int    NOT NULL,
    CONSTRAINT PK_OrderLine PRIMARY KEY CLUSTERED (OrderLineId)
);

CREATE NONCLUSTERED INDEX IX_OrderLine_OrderId
    ON dbo.OrderLine (OrderId)
    INCLUDE (ProductId, Quantity);

-- SQL Server: inspect an estimated plan without executing the statement.
SET SHOWPLAN_TEXT ON;
GO
SELECT ProductId, Quantity
FROM dbo.OrderLine
WHERE OrderId = 42;
GO
SET SHOWPLAN_TEXT OFF;
GO
```

`SET SHOWPLAN_TEXT` changes the session to plan-only behavior and must be used according to SQL Server’s batch rules. Use an actual execution plan or runtime statistics when measuring a real workload; an estimate is not a measurement.

## 4. MySQL InnoDB: clustered primary data and secondary indexes

The following section is specifically **MySQL 8.x using the InnoDB storage engine**. Do not generalize it to every MySQL storage engine.

InnoDB stores a table as a clustered index:

1. If the table declares a `PRIMARY KEY`, that key is the clustered index.
2. If there is no primary key, InnoDB chooses the first suitable `UNIQUE NOT NULL` index.
3. If neither exists, InnoDB creates a hidden six-byte row identifier and a generated clustered index commonly shown as `GEN_CLUST_INDEX`.

The first two choices are preferable because the application controls the identifier and can use it consistently. The hidden fallback is an implementation detail, not a column that application SQL can use as a normal primary key. These selection rules and the secondary-index behavior are documented by MySQL [5].

An InnoDB clustered leaf contains the full row record together with the clustered key. A **secondary index** contains its secondary key columns plus a copy of the clustered key. A secondary lookup therefore has two conceptual steps:

```text
InnoDB secondary leaf
  [status, created_at | primary-key columns]
                              |
                              v
       clustered B-tree leaf [primary key | complete row]
```

That copied primary key is not a SQL Server RID. It is the clustered-key value used to find the complete row. A long composite primary key consequently makes every secondary index wider, which can increase storage and I/O.

MySQL examples (syntax and behavior are **InnoDB-specific** where noted):

```sql
-- MySQL + InnoDB: the PRIMARY KEY is the clustered index.
CREATE TABLE orders
(
    order_id    BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    status      VARCHAR(20) NOT NULL,
    created_at  DATETIME NOT NULL,
    PRIMARY KEY (order_id),
    KEY ix_orders_customer_date (customer_id, created_at)
) ENGINE = InnoDB;

-- MySQL: inspect indexes and the optimizer's estimate.
SHOW INDEX FROM orders;
EXPLAIN SELECT order_id, status
FROM orders
WHERE customer_id = 42
  AND created_at >= '2026-01-01';

-- MySQL 8.x: execute and report iterator timing/actual row counts.
EXPLAIN ANALYZE
SELECT order_id, status
FROM orders
WHERE customer_id = 42
  AND created_at >= '2026-01-01';
```

`EXPLAIN` is an estimate; `EXPLAIN ANALYZE` executes supported statements and reports runtime observations. Refreshing statistics with `ANALYZE TABLE orders;` can change optimizer choices, but it does not create an index and does not force one to be used [6] [8].

## 5. MariaDB: similar InnoDB idea, separately labeled

**MariaDB** is a separate product and has version- and engine-specific behavior. For MariaDB tables using **InnoDB**, secondary keys carry the primary-key value to reach the clustered row, much like MySQL InnoDB. Do not silently substitute MySQL 8.x syntax or optimizer output for MariaDB output.

```sql
-- MariaDB + InnoDB: explicitly label the storage engine.
CREATE TABLE invoice
(
    invoice_id  BIGINT NOT NULL,
    account_id  BIGINT NOT NULL,
    issued_on   DATE NOT NULL,
    total_cents INT NOT NULL,
    PRIMARY KEY (invoice_id),
    INDEX ix_invoice_account_date (account_id, issued_on)
) ENGINE=InnoDB;

-- MariaDB: review the access path; output is version-dependent.
EXPLAIN
SELECT invoice_id, total_cents
FROM invoice
WHERE account_id = 7
  AND issued_on >= '2026-01-01';

SHOW INDEX FROM invoice;
```

MariaDB’s index-selection guidance starts with equality predicates, then considers range predicates and the query’s `GROUP BY`/`ORDER BY` shape. A low-cardinality flag by itself is often a weak index candidate, and every maintained index adds write work [4]. Validate with the MariaDB version’s `EXPLAIN`, data distribution, and workload rather than copying a rule mechanically.

## 6. SQLite: B-tree terminology without SQL Server clustering

**SQLite** has its own file format and planner. A rowid table and an index are separate B-trees: table B-tree leaves hold table records, while index B-tree leaves hold indexed keys and row references. SQLite’s file-format documentation distinguishes table interior/leaf pages from index interior/leaf pages [1]. SQLite does **not** use SQL Server’s clustered/nonclustered index and RID vocabulary as a portable semantic model.

```sql
-- SQLite: rowid table plus an ordinary index.
CREATE TABLE customer
(
    customer_id INTEGER PRIMARY KEY,
    email       TEXT NOT NULL,
    name        TEXT NOT NULL
);

CREATE INDEX ix_customer_email ON customer(email);

-- SQLite: high-level plan inspection; output format may vary by version.
EXPLAIN QUERY PLAN
SELECT name
FROM customer
WHERE email = 'ana@example.test';
```

`INTEGER PRIMARY KEY` has special rowid behavior in SQLite rowid tables; that is not the same statement as “SQLite has a SQL Server-style clustered index.” `WITHOUT ROWID` tables use a different B-tree layout and should be studied separately. `EXPLAIN QUERY PLAN` reports high-level `SCAN` versus `SEARCH`, and may identify covering-index use; SQLite warns that its displayed format can change between releases [3]. The query planner’s goal is to improve lookup work without changing query results [2].

## 7. Reading the diagram across engines

The same conceptual tree can represent different payloads:

```text
                         ROOT
              separators + child-page IDs
                              |
                     INTERMEDIATE PAGES
              more separators + child-page IDs
                              |
                         LEAF PAGES
       +----------------------+----------------------+
       | SQL Server clustered | SQL Server nonclustered|
       | complete data rows   | key + RID or clustered |
       |                      | key [+ uniqueifier]   |
       +----------------------+----------------------+
       | InnoDB clustered     | InnoDB secondary       |
       | complete row         | secondary key + PK     |
       +----------------------+----------------------+
       | SQLite table B-tree  | SQLite index B-tree    |
       | record + rowid key   | index key + rowid      |
       +----------------------+----------------------+
```

The diagram is a teaching model, not a promise that each engine uses identical page headers, separator duplication, sibling links, compression, or split policy. In particular, SQL Server’s heap data pages are not the leaves of a clustered B-tree, while an InnoDB table without an explicit primary key still has a hidden clustered-index fallback.

## 8. Choosing and checking an index

Start with the workload, not with the number of columns in a table:

1. Identify frequent, important `WHERE`, `JOIN`, `ORDER BY`, and `GROUP BY` shapes.
2. Prefer a key order that supports the predicates and useful ranges. For `(account_id, issued_on)`, a query constraining `account_id` can use the leftmost portion; a query only constraining `issued_on` may not receive the same benefit.
3. Check selectivity and data distribution. An index on a column with two values may be useful for a particular selective predicate, but a flag-only index is not automatically useful.
4. Consider covering columns carefully. They can avoid lookups, but make the index larger and more expensive to maintain.
5. Compare estimated plans with actual behavior. A small table may be faster to scan than to traverse through an index and fetch many rows.
6. Account for writes. `INSERT`, `UPDATE`, and `DELETE` operations may update several B-trees; wide or redundant indexes increase storage and maintenance costs.
7. Revisit indexes after data growth, schema changes, and query changes. Refresh statistics using the engine’s documented command before concluding that an index is ignored.

For MySQL, `INFORMATION_SCHEMA.COLUMNS` exposes metadata such as type, character length, charset, nullability, and `COLUMN_KEY` [7]. Treat a rough `VARCHAR(N)` byte calculation as a maximum estimate, not an exact InnoDB row size: record metadata, null maps, length fields, page overhead, and off-page storage matter [9]. Likewise, `COLUMN_KEY` is not a perfect per-column “is indexed” boolean: a column that appears only later in a nonunique composite index can have an empty value in that metadata view [7].

Index names do not make duplicate structures useful. Compare ordered key columns, uniqueness, included columns, predicates, and workload evidence before declaring two indexes redundant. Review an index-usage report and query plans before any cleanup.

> **Warning — destructive operation:** dropping an index changes future query plans and may remove a uniqueness constraint. Do not run a `DROP INDEX` or equivalent in production from a copied example. First verify dependencies, constraints, deployment rollback, workload usage, and a tested replacement; use the exact syntax for the target engine.

## 9. Portable ideas versus engine-specific facts

The portable idea is simple: an ordered access path can reduce search work, while maintaining that access path costs resources. The implementation is not portable:

- **SQL Server:** clustered leaf rows are the table’s data; nonclustered leaves use a heap RID or clustered-key locator, with a uniqueifier for duplicate clustered keys.
- **MySQL InnoDB:** the primary key (or the documented fallback) is clustered; secondary leaves copy the clustered key, not a SQL Server RID.
- **MariaDB InnoDB:** use MariaDB’s own documentation and plan output; secondary keys carry the primary key in this engine family.
- **SQLite:** table and index B-trees have SQLite-specific rowid/`WITHOUT ROWID` behavior; do not call an ordinary SQLite index “nonclustered” as though it were SQL Server syntax.

Keeping those labels attached prevents a diagram that is useful for learning from becoming a misleading claim about every database engine.

## References

[1]: https://www.sqlite.org/fileformat2.html "SQLite Database File Format"
[2]: https://www.sqlite.org/queryplanner.html "SQLite Query Planning"
[3]: https://www.sqlite.org/eqp.html "The SQLite Query Planner"
[4]: https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/building-the-best-index-for-a-given-select "MariaDB: Building the Best Index for a Given SELECT"
[5]: https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html "MySQL 8.4 Reference Manual: InnoDB Index Types"
[6]: https://dev.mysql.com/doc/refman/8.4/en/explain.html "MySQL 8.4 Reference Manual: EXPLAIN Statement"
[7]: https://dev.mysql.com/doc/refman/8.4/en/information-schema-columns-table.html "MySQL 8.4 Reference Manual: The INFORMATION_SCHEMA COLUMNS Table"
[8]: https://dev.mysql.com/doc/refman/8.4/en/information-schema-statistics-table.html "MySQL 8.4 Reference Manual: The INFORMATION_SCHEMA STATISTICS Table"
[9]: https://dev.mysql.com/doc/refman/8.4/en/innodb-row-format.html "MySQL 8.4 Reference Manual: InnoDB Row Formats"
