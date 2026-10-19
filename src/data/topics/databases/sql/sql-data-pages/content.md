# Database data pages and B-tree storage

A SQL index is not a magical “fast column.” It is a storage structure made from pages (or page-like blocks) that lets an engine narrow a search before it reads every row. The exact pages, record layout, row locator, and page size depend on the database engine, storage engine, version, and configuration. This lesson builds a portable mental model first, then makes the important differences explicit for **MySQL/InnoDB**, **MariaDB**, **SQL Server**, and **SQLite**.

> **Learning goal:** trace a lookup from a search key through B-tree pages to the requested row, and explain why the same SQL idea is stored differently by different engines.

## 1. Pages, records, and B-trees

A **page** is a fixed-size unit that a database reads from storage and usually caches in memory as a unit. A page contains a header, slot or directory information, records, free space, and sometimes links to neighboring or child pages. “Fixed-size” does not mean “one row per page”: a page normally holds many variable-sized records.

An index is commonly organized as a balanced tree. The word **B-tree** is used broadly here; some products implement a B+tree-like variant in which the useful records are at the leaves and internal pages primarily guide navigation.

```text
                         root page
                 [  40  |  80  |  120  ]
                  /          |       \
                 /           |        \
        internal page   internal page   internal page
          [10|25|35]      [55|65]          [95|110]
             |               |                |
        leaf pages       leaf pages        leaf pages
      [ ... 25 ... ]   [40 ... 65 ...]   [95 ... 120 ...]
```

A lookup generally follows this route:

1. Read or find the **root** page in the buffer pool.
2. Compare the search key with separator keys and choose a child page.
3. Repeat through zero or more **internal** levels.
4. Reach a **leaf** page, where the engine finds an index entry or the row itself.
5. If the leaf stores only a locator, follow that locator to the table row (a **lookup**, sometimes called a bookmark lookup or row lookup).

The tree is kept balanced as rows are inserted, deleted, and updated. A split can allocate a new page and promote a separator key upward; a merge or redistribution can happen after deletes. Consequently, “the row is physically next to the other rows with nearby keys” is a useful approximation for some clustered layouts, not a promise that never changes.

### Seek, scan, and lookup are different operations

- A **seek** navigates the tree using a predicate such as `id = 42` or a usable range such as `created_at >= ...`.
- A **scan** reads many or all leaf/table pages, possibly because there is no useful index or because the optimizer estimates that most rows will qualify.
- A **covering index** contains every value needed by a query, so the engine can stop at the index leaf without fetching the base row.
- A **non-covering** index finds candidate rows, then performs one or more row lookups to obtain columns not present in the index.

An index can therefore reduce comparisons while adding page reads. On a two-row table, a table scan can be cheaper than touching an index and then performing lookups. A plan that scans is not automatically a defect; compare estimated and actual work.

## 2. InnoDB (MySQL): the clustered leaf is the row

The following statements are **MySQL/InnoDB syntax and behavior**, not a portable definition of “primary key storage.” InnoDB chooses its clustered index in this order:

1. The declared `PRIMARY KEY`.
2. Otherwise, the first `UNIQUE` index whose columns are all `NOT NULL`.
3. Otherwise, an internal hidden clustered key named `GEN_CLUST_INDEX` (its name is an implementation detail).

The InnoDB documentation describes this choice and the important consequence: a secondary-index record carries the secondary key plus the primary-key value needed to reach the clustered record. [4]

```text
InnoDB clustered index on PRIMARY KEY (employee_id)

root/internal pages:   employee_id separators + child-page pointers
                              |
clustered leaf page:   employee_id, name, email, profile_text, ...
                       (the row record, subject to row-format details)

secondary index on email

root/internal pages:   email separators + child-page pointers
                              |
secondary leaf page:   email + employee_id
                              |
                              +--> clustered B-tree lookup by employee_id
```

This is why a secondary index is not just a pointer to a stable disk address. If a row moves as pages split or records are reorganized, the secondary entry can still find it through the primary-key value. It also means a wide primary key is repeated in every secondary index entry, increasing secondary-index size and lookup I/O.

### InnoDB row layout and long values

A maximum declared row size is not the same thing as the bytes occupied by an actual row. InnoDB records include internal metadata, null information, variable-length fields, and length information. Large variable-length columns can have part of their value stored on overflow pages, with information in the row record that leads to the off-page data. The details depend on row format, column type, value length, page size, and version; do not infer exact physical size by simply adding `VARCHAR(N)` maxima. [5]

```text
clustered leaf record
+---------------------------------------------------+
| record metadata | null/length info | local fields |
|                 |                  | prefix/refs  |-----> overflow page(s)
+---------------------------------------------------+          |
                                                            long value
```

“Off-page” does **not** mean every `TEXT`, `BLOB`, or long `VARCHAR` value is always external. Short values may fit locally, and row-format rules determine what is retained in the clustered record. A row can therefore require additional reads even after the correct clustered leaf page has been found.

### MySQL inspection example

```sql
-- MySQL/InnoDB: read-only schema and index inspection.
SELECT VERSION();
SHOW CREATE TABLE employees;
DESCRIBE employees;
SHOW INDEX FROM employees;

-- MySQL 8.0+: estimated plan, then an executing plan where supported.
EXPLAIN SELECT employee_id, name
FROM employees
WHERE email = 'ana@example.test';

EXPLAIN ANALYZE
SELECT employee_id, name
FROM employees
WHERE email = 'ana@example.test';
```

`EXPLAIN` reports optimizer estimates; `EXPLAIN ANALYZE` executes a supported statement and reports observed iterator timing and row counts. `ANALYZE TABLE` refreshes statistics that can affect the choice between a scan and an index access path. [6] Treat `EXPLAIN ANALYZE` as an executing command: use it only when running the statement is safe and acceptable in the target environment.

For metadata, `INFORMATION_SCHEMA.COLUMNS` exposes declared type, character and byte-length metadata, nullability, and `COLUMN_KEY`; an empty `COLUMN_KEY` is not a universal proof that a column is unindexed because a column can be a later component of a non-unique composite key. [7] `INFORMATION_SCHEMA.STATISTICS` exposes ordered index columns, uniqueness, and estimated cardinality; statistics can be cached, so inspect or refresh them before drawing conclusions. [8]

## 3. MariaDB: similar InnoDB ideas, explicit version and engine boundaries

The following is **MariaDB syntax**. MariaDB commonly uses InnoDB, and its indexing advice is similar for that engine: start with equality predicates, then consider range, grouping, ordering, and the actual query shape. Low-cardinality indexes, such as a flag with only two values, may not reduce enough work to justify their maintenance cost. [9]

```sql
-- MariaDB: a read-only plan check.
EXPLAIN
SELECT order_id, total_amount
FROM orders
WHERE customer_id = 17
  AND order_date >= '2026-01-01';

-- MariaDB: index syntax; verify the storage engine and version first.
CREATE INDEX ix_orders_customer_date
    ON orders (customer_id, order_date);
```

The leftmost order matters: `(customer_id, order_date)` can usually narrow by `customer_id` and then use the date range, whereas an index beginning with `order_date` has a different set of useful predicates. This is a property of ordered key navigation, not a guarantee that every optimizer version will choose the index.

Do not silently transfer InnoDB details to every MariaDB storage engine. A MariaDB table using a different engine can have different row and index structures. Also distinguish MariaDB from MySQL when using diagnostic syntax or optimizer features; check the product and version shown by `SELECT VERSION()`.

## 4. SQL Server: clustered and nonclustered rowstore leaves

The following terminology and commands are **SQL Server**, not MySQL or SQLite syntax. In an ordinary SQL Server rowstore table:

- A **clustered index** is a B-tree whose leaf level contains the table’s data rows. A table can have at most one clustered ordering because the row data cannot have two independent leaf orderings.
- A table without a clustered index is a **heap**. Its rows live in data pages without a clustered B-tree ordering.
- A **nonclustered index** has index records at its leaf level. Those records contain the nonclustered key plus a row locator and may contain included columns.
- For a heap, the locator is a **RID** (row identifier containing file/page/slot-style location information).
- For a table with a clustered index, the locator is the clustered key. If the clustered key is not unique, SQL Server can add a hidden uniqueifier to distinguish duplicate clustered-key rows in nonclustered indexes.

```text
SQL Server clustered index (rowstore)

root -> intermediate pages -> leaf pages
                                  |
                         complete data rows

SQL Server nonclustered index on a clustered table

root -> intermediate pages -> leaf index pages
                                  |
                    (search_key, clustered_key, included values)
                                  |
                                  +--> clustered B-tree row lookup

SQL Server nonclustered index on a heap

root -> intermediate pages -> leaf index pages
                                  |
                         (search_key, RID)
                                  |
                                  +--> heap data-page lookup
```

The phrase “clustered rows are physically sorted forever” is misleading. The clustered key defines the logical B-tree order and leaf organization; page splits, free space, fragmentation, partitioning, and maintenance affect physical placement. A nonclustered index is not equivalent to an InnoDB secondary index: SQL Server’s locator is a RID or clustered key, while InnoDB secondary entries carry the InnoDB primary-key value to the clustered index. The lookup shape may look similar, but the storage contract is different.

```sql
-- SQL Server: explicitly labeled, non-destructive index creation.
CREATE CLUSTERED INDEX CX_orders_order_id
    ON dbo.orders (order_id);

CREATE NONCLUSTERED INDEX IX_orders_customer_date
    ON dbo.orders (customer_id, order_date)
    INCLUDE (total_amount);

-- SQL Server: inspect I/O for a test query; capture plans in a safe environment.
SET STATISTICS IO ON;
SELECT order_id, total_amount
FROM dbo.orders
WHERE customer_id = 17
  AND order_date >= '2026-01-01';
SET STATISTICS IO OFF;
```

A nonclustered leaf that includes all requested columns can make the query covering and avoid a key lookup. Adding included columns can improve reads but increases index storage and write/maintenance work. A clustered key is also copied into nonclustered locators, so an unnecessarily wide clustered key has a system-wide cost.

## 5. SQLite: page types in a single database file

SQLite stores a database as fixed-size pages in one file. The page size is part of the database format and is configurable within SQLite’s supported range; page 1 also contains the database header. SQLite distinguishes B-tree table and index pages, interior and leaf pages, and separate overflow and freelist pages. [1]

The key B-tree page-type values in SQLite’s file format are:

- `0x05`: table B-tree interior page.
- `0x0d`: table B-tree leaf page.
- `0x02`: index B-tree interior page.
- `0x0a`: index B-tree leaf page.

```text
SQLite rowid table

schema/root page -> table interior pages -> table leaf pages
                                             |
                                      (rowid, record payload)

SQLite ordinary index

schema/root page -> index interior pages -> index leaf pages
                                             |
                                      (indexed key, rowid)
                                             |
                                             +--> table B-tree by rowid
```

The payload may use overflow pages when it does not fit locally. A rowid table’s table B-tree leaf stores the record payload keyed by rowid; an ordinary index leaf stores index keys and enough information to identify the table row. `WITHOUT ROWID` tables use a different table representation, so do not assume the rowid diagram applies to every SQLite table.

SQLite’s query planner documentation explains the general benefit of a B-tree index: searching an ordered structure can avoid examining every row, while a covering index can satisfy a query directly from index content. [2] Use the SQLite-specific diagnostic command below; its output is a high-level interactive format and can change between SQLite versions. [3]

```sql
-- SQLite: read-only plan inspection.
EXPLAIN QUERY PLAN
SELECT name
FROM employees
WHERE email = 'ana@example.test';
```

A result containing `SEARCH ... USING INDEX` indicates index-assisted access; `SCAN` indicates a scan of the named table or index. The detail is not a stable machine-readable API, and it is not interchangeable with MySQL or SQL Server `EXPLAIN` output.

## 6. Real lookup walk-through: from email to a long profile

Assume this **MySQL/InnoDB** schema:

```sql
-- MySQL/InnoDB example. This creates only a test table; use a test schema.
CREATE TABLE employees (
    employee_id BIGINT NOT NULL,
    email       VARCHAR(320) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    profile     MEDIUMTEXT NULL,
    PRIMARY KEY (employee_id),
    UNIQUE KEY uq_employees_email (email)
) ENGINE = InnoDB;
```

Now consider:

```sql
SELECT employee_id, name, profile
FROM employees
WHERE email = 'ana@example.test';
```

A realistic route is:

1. The optimizer estimates the predicate’s selectivity from index statistics and chooses the unique secondary index when it expects that to be cheaper than scanning. The `UNIQUE` constraint means at most one matching key should be returned, but the optimizer still has to execute the access path.
2. The engine reads the root page of `uq_employees_email` and compares `'ana@example.test'` with separator keys.
3. It follows the selected child pointer through any intermediate page to the leaf page containing the email entry.
4. The secondary leaf entry contains the email key and `employee_id`; it does not contain the complete `profile` value merely because `profile` is in the table.
5. The engine uses `employee_id` to navigate the clustered primary-key B-tree and finds the clustered leaf record containing the row’s local fields and any off-page reference for `profile`.
6. Because `profile` is selected, the engine may read overflow page(s) holding the long value. If the query selected only `employee_id` and `name`, the clustered record might be enough; if an index contained every requested value, a secondary lookup could potentially be covering.
7. The result row is assembled and returned. The pages may already be in the buffer pool, so a logical read need not be a physical disk read.

```text
email predicate
     |
     v
secondary root -> secondary internal -> secondary leaf
                                      (email, employee_id)
                                                 |
                                                 v
primary-key root -> primary internal -> clustered leaf
                                      (employee_id, email, name,
                                       profile metadata/local bytes)
                                                 |
                                                 v
                                      overflow page(s), if needed
```

This walk-through also explains two practical trade-offs. First, a secondary index makes the first part of the search cheap but may add a clustered lookup. Second, the primary-key width affects every secondary entry. A narrow, stable primary key is often easier on storage, but the right design still depends on the workload and data model.

## 7. Why page layouts and page sizes differ

There is no universal “SQL page.” Engines make different choices because they have different file formats, concurrency models, index semantics, recovery designs, and compatibility goals.

- **Storage architecture:** InnoDB stores a clustered row representation plus secondary trees; SQL Server separates heap/clustered data organization from nonclustered leaf entries; SQLite places table and index B-trees in a self-contained database file.
- **Locator policy:** InnoDB secondary keys carry primary-key values; SQL Server uses a RID for heaps or a clustered key for clustered tables; SQLite ordinary indexes commonly lead back through a rowid, with a different representation for `WITHOUT ROWID` tables.
- **Payload policy:** InnoDB and SQLite can use overflow pages for payloads that do not fit comfortably on a B-tree page. The local prefix, pointer metadata, and thresholds are engine- and format-specific.
- **Page-size choices:** Typical installations may use different defaults (for example, InnoDB is commonly configured with a 16 KiB page and SQL Server commonly uses 8 KiB data pages), while SQLite’s database page size is configurable. These are typical settings, not a portable promise; verify the actual database and version before doing capacity math.
- **Version and configuration:** Page formats, row formats, compression, encryption, partitioning, collations, alignment, and maximum key limits can vary by release or configuration. A diagram is a conceptual map, not a byte-for-byte parser.

For that reason, a calculation such as `VARCHAR(50) × 4 + 1` is at most a rough maximum for a character field under a particular MySQL character set. It omits record headers, null maps, alignment, actual string length, index copies, compression, and possible off-page storage. Prefer measured metadata, page/space tools appropriate to the engine, and representative data.

## 8. Practical diagnosis and safe experimentation

Use the engine’s own plan and metadata tools, and label every command by engine:

- **MySQL:** `SHOW CREATE TABLE`, `SHOW INDEX`, `INFORMATION_SCHEMA.STATISTICS`, `EXPLAIN`, and supported `EXPLAIN ANALYZE`. Refresh statistics with `ANALYZE TABLE` when stale statistics are a plausible cause. [6] [8]
- **MariaDB:** `SHOW CREATE TABLE`, `SHOW INDEX`, `INFORMATION_SCHEMA`, and `EXPLAIN`; verify MariaDB version and storage engine before applying MySQL-specific assumptions. [9]
- **SQL Server:** actual or estimated execution plans, `SET STATISTICS IO`, and SQL Server catalog/DMV tooling; distinguish a key lookup from a RID lookup and check whether the index is covering.
- **SQLite:** `EXPLAIN QUERY PLAN`, then benchmark with representative data; distinguish `SCAN` from `SEARCH` and check for temporary sorting structures. [3]

A disciplined experiment changes one variable at a time: predicate shape, index column order, selected columns, data distribution, or statistics. Compare logical reads, actual rows, and elapsed time rather than trusting an index name or assuming that “seek” always means fast. An index that helps a read query also consumes space and must be maintained during inserts, updates, and deletes.

> **Destructive-operation warning:** Do not paste `DROP TABLE`, `DROP INDEX`, `TRUNCATE`, or bulk-delete statements into a production session while experimenting. Test in an isolated database, take an approved backup, confirm the target schema, and obtain a review before removing or changing an index. An index that looks redundant from a name or one query may support a different workload, constraint, or leftmost-prefix access path.

## 9. Common mistakes to avoid

- Calling every index leaf a “data page.” InnoDB clustered leaves contain row records, SQL Server clustered leaves contain table data rows, SQL Server nonclustered leaves contain index records, and SQLite has distinct table/index page types.
- Calling an InnoDB secondary entry a physical pointer. It carries the primary-key value used for the clustered lookup.
- Saying that a primary key always means clustered storage. That is a scoped InnoDB statement here; other engines and table organizations differ.
- Treating declared maximum sizes as measured row sizes. Actual values and internal metadata matter, and long values may use overflow pages.
- Assuming a scan means an index was ignored incorrectly. A scan can be cheaper for a small table or an unselective predicate.
- Assuming `COLUMN_KEY` empty means “definitely no index” in MySQL. Composite-key position and metadata semantics require checking the full index definition. [7]
- Using one engine’s `EXPLAIN` syntax in another engine. MySQL, MariaDB, SQL Server, and SQLite expose different commands and output formats.
- Thinking a clustered key’s logical order guarantees adjacent physical sectors or pages. Splits, free space, partitioning, and maintenance affect physical placement.

## References

[1]: https://www.sqlite.org/fileformat2.html "SQLite File Format"

[2]: https://www.sqlite.org/queryplanner.html "The SQLite Query Planner"

[3]: https://www.sqlite.org/eqp.html "EXPLAIN QUERY PLAN"

[4]: https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html "MySQL 8.4 Reference Manual: InnoDB Index Types"

[5]: https://dev.mysql.com/doc/refman/8.4/en/innodb-row-format.html "MySQL 8.4 Reference Manual: InnoDB Row Formats"

[6]: https://dev.mysql.com/doc/refman/8.4/en/explain.html "MySQL 8.4 Reference Manual: EXPLAIN Statement"

[7]: https://dev.mysql.com/doc/refman/8.4/en/information-schema-columns-table.html "MySQL 8.4 Reference Manual: The INFORMATION_SCHEMA COLUMNS Table"

[8]: https://dev.mysql.com/doc/refman/8.4/en/information-schema-statistics-table.html "MySQL 8.4 Reference Manual: The INFORMATION_SCHEMA STATISTICS Table"

[9]: https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/building-the-best-index-for-a-given-select "MariaDB: Building the Best Index for a Given SELECT"
