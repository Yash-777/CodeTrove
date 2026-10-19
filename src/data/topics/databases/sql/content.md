# SQL and database indexing

SQL describes the questions and changes an application asks of a relational database. The database does not normally read every row for every query. It parses the statement, considers available access paths and statistics, chooses a plan, then reads the pages needed to produce the requested result. Indexes are one of those access paths: they can reduce the rows searched, but they consume storage and add work to inserts, updates and deletes.

This section starts with index fundamentals, then moves through B-tree structures, composite keys, data pages, schema inspection, row-size estimates, index audits, maintenance and bulk loading. Examples identify their database engine. SQL syntax that works in the local SQLite playground is not automatically valid in MySQL, MariaDB or SQL Server.

## A query's path through the database

```text
Application sends SQL
        │
        ▼
Parser checks syntax and resolves tables/columns
        │
        ▼
Optimizer compares possible scans, indexes, joins and sorts
        │
        ├── selective access path ──► traverse index pages ──► fetch matching rows
        │
        └── scan is cheaper ───────► read table pages and filter rows
        │
        ▼
Return the requested result set
```

The optimizer is allowed to choose a table scan. That is often correct for a tiny table, a query that returns a large fraction of rows, or an index whose key order does not match the query. An index is not a command to skip work in every case. Compare plans and measure the real workload rather than judging by whether an index exists.[SQLite query planner][1] [SQLite EXPLAIN QUERY PLAN][2]

## What an index contains

An index is a database-managed structure ordered by one or more key values. A B-tree keeps a search path from a root through intermediate pages to leaf entries. A leaf entry either contains the row data or enough information to locate it, depending on the storage engine and index type. A secondary lookup can therefore involve an index search followed by a second lookup in the table's clustered structure.

In InnoDB, the primary key is normally the clustered index and its leaf pages contain the row. Secondary index entries carry the primary-key value used to reach that row. SQL Server uses its own clustered/nonclustered terminology and row locators. These are related ideas, but the physical rules and syntax are engine-specific.[MySQL InnoDB indexes][3] [MariaDB index design][4]

```text
query: WHERE department = 'Engineering'
               │
               ▼
        root index page
               │
        intermediate page
               │
               ▼
         matching leaf entries
               │
       row locator / primary key
               │
               ▼
        row-bearing data page
```

Creating an index does not create a table that should be queried directly. It adds another structure that the optimizer may choose. That structure needs disk space and must be maintained as indexed values change. Choose indexes from actual query patterns, then check whether the plan uses them effectively.[SQLite query planner][1] [MariaDB index design][4]

## Learning path

1. [Index fundamentals and query plans](#/content/tree/databases/sql/indexes) explains scans, lookups, plan output and the read/write trade-off.
2. [B-tree pages and clustered/nonclustered indexes](#/content/tree/databases/sql/index-structures) compares the storage paths used by different engines.
3. [Composite indexes and leftmost-prefix behavior](#/content/tree/databases/sql/composite-indexes) shows how key order changes which queries can use an index.
4. [Database data pages and B-tree storage](#/content/tree/databases/sql/sql-data-pages) follows a row from an index page to the data it references.
5. [Inspect schema, character sets and collations](#/content/tree/databases/sql/schema-and-collation) uses MySQL metadata commands to compare tables and index-related column properties.
6. [Estimate field and row sizes](#/content/tree/databases/sql/row-size-estimation) calculates declared payload bounds and explains why they are not exact disk allocation.
7. [Inspect duplicate and redundant indexes](#/content/tree/databases/sql/index-analysis) builds a safe inventory and candidate report before considering removal.
8. [Design, monitor and maintain indexes](#/content/tree/databases/sql/index-design-maintenance) covers index selection and the lifecycle after deployment.
9. [Batch-load data and diagnose long inserts](#/content/tree/databases/sql/bulk-inserts) discusses the 200,000-row example, chunk boundaries and lost-connection errors.

The existing [relational model](#/content/tree/databases/sql/relational-model), [normalization](#/content/tree/databases/sql/normalization), [joins](#/content/tree/databases/sql/joins), [transactions](#/content/tree/databases/sql/transactions) and [deadlocks](#/content/tree/databases/sql/deadlocks) pages provide the surrounding SQL concepts.

## Try the SQL examples

Open the [SQL playground](#/build/compiler?lang=sql) to edit and execute the SQLite examples in this section. The editor uses an open-source SQLite WebAssembly build inside a browser worker; it does not connect to a MySQL server or submit your statements to a remote SQL service. The database is temporary and held in memory. Use the engine-specific pages when you need commands such as `SHOW INDEX`, `INFORMATION_SCHEMA`, stored procedures or MySQL's `EXPLAIN ANALYZE`.[SQL.js][5] [CodeMirror SQL support][6]

For a fair index comparison, create a representative dataset, run the same query before and after an index, inspect the plan, and compare the number of rows visited as well as elapsed time. Repeat the test with representative values and data volume. A tiny sample can produce a different plan from production because an optimizer's decision depends on table size, value distribution, statistics, query shape and engine version.[SQLite query planner][1] [MySQL EXPLAIN][7]

## Scope note

The supplied source page also appends an unrelated AI-product and company list naming Apple, Microsoft/Azure/OpenAI, Google/Gemini, Meta, xAI/Grok, Blackbox.ai and Z AI. Those items are not database or indexing concepts, so they are recorded here rather than mixed into the SQL learning sequence.

## References

[1]: https://www.sqlite.org/queryplanner.html "SQLite query planner"
[2]: https://www.sqlite.org/eqp.html "SQLite EXPLAIN QUERY PLAN"
[3]: https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html "MySQL InnoDB clustered and secondary indexes"
[4]: https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/building-the-best-index-for-a-given-select "MariaDB index design from query patterns"
[5]: https://github.com/sql-js/sql.js "SQL.js browser WebAssembly engine"
[6]: https://github.com/codemirror/lang-sql "CodeMirror SQL language support"
[7]: https://dev.mysql.com/doc/refman/8.4/en/explain.html "MySQL EXPLAIN and EXPLAIN ANALYZE"
