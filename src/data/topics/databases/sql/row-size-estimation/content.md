# Estimate field and row sizes

Estimating a row is useful when choosing a schema, checking a row-size limit, sizing a page cache, or explaining why a table's average size differs from a schema's declared limits. It is also easy to overstate what a simple arithmetic formula proves.

This lesson separates three different questions:

1. **What is the largest value payload permitted by the declaration?**
2. **How many bytes can a particular value contribute?**
3. **How many bytes does an engine allocate for a record, its indexes, and its pages?**

Those are related, but they are not interchangeable. The calculations below are planning estimates unless an engine-specific storage-format analysis is explicitly stated.

## 1. Start with the right byte vocabulary

For a character column, a length in characters is not necessarily a length in bytes.

- `CHARACTER_MAXIMUM_LENGTH` is a character count for character columns.
- `CHARACTER_OCTET_LENGTH` is the declared maximum number of bytes for the character or binary value. It is generally the safer metadata value to use when the question is “how many bytes can this declaration represent?” [2]
- `DATALENGTH` in SQL Server and `length(CAST(value AS BLOB))` in SQLite measure the bytes of a particular value, not the declared maximum.

For example, assuming the column's character set has the usual maximum widths:

```text
VARCHAR(50) CHARACTER SET utf8mb3
  maximum character payload: 50 × 3 = 150 bytes
  rough VARCHAR length prefix: 1 byte
  rough field contribution: 151 bytes

VARCHAR(50) CHARACTER SET utf8mb4
  maximum character payload: 50 × 4 = 200 bytes
  rough VARCHAR length prefix: 1 byte
  rough field contribution: 201 bytes
```

The `N × bytes-per-character + 1` expression is **only a rough case**. It assumes a `VARCHAR`, a one-byte length field, and a character set whose maximum width is known. It is not a general row-size formula:

- `utf8mb3` and `utf8mb4` are different MySQL character sets; the latter can use four bytes per character at the maximum.
- Actual encoded values may use fewer bytes than the maximum. A string containing mostly ASCII characters is not automatically `N × 4` bytes in `utf8mb4`.
- A `VARCHAR` length field can require two bytes when the declared byte maximum is large enough.
- `CHAR`, `TEXT`, `BLOB`, national-character types, binary types, and JSON do not all use the same representation.
- A nullable value can have no value payload while still consuming a NULL-bitmap bit and record metadata.

When possible, read `CHARACTER_OCTET_LENGTH` from metadata rather than multiplying a character count by a guessed factor.

## 2. Declared maximum payload versus actual allocated row size

A useful conceptual diagram is:

```text
Declared maximum payload
  ├─ fixed-width value bytes
  └─ maximum variable value bytes
       (not necessarily present in every row)

Physical clustered/table record
  = value bytes that are actually present
  + variable-length-field length entries
  + NULL bitmap
  + record header and engine metadata
  + row-format-specific details
  + possible overflow/off-page pointers or prefixes

Table footprint
  = clustered/table records
  + secondary-index records (often including a primary-key copy)
  + page headers, directory/free-space overhead, and unused page space
  + transaction/version information and engine bookkeeping
  + effects of compression, encryption, and allocation granularity
```

Thus, a sum such as `4 + 201 + 201 + 201 = 607` for an `INT` and three `VARCHAR(50)` columns under `utf8mb4` is a **declared maximum field estimate** (including one rough prefix per `VARCHAR`). It is not a promise that every record occupies 607 bytes, and it is not a measurement of a table's allocated disk space.

Actual values matter. A row with a short name, a NULL email, and a short department has a much smaller value payload than the declaration permits. Conversely, a table can consume more storage than the value-payload sum because of record headers, NULL maps, page structures, indexes, and free space.

## 3. MySQL: inspect column metadata first

The following is **MySQL syntax**. It is not a portable SQL query and should not be pasted unchanged into SQLite or SQL Server.

```sql
-- MySQL: column metadata for one table.
SELECT
    ORDINAL_POSITION,
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    CHARACTER_SET_NAME,
    COLLATION_NAME,
    CHARACTER_MAXIMUM_LENGTH,
    CHARACTER_OCTET_LENGTH,
    NUMERIC_PRECISION,
    NUMERIC_SCALE,
    DATETIME_PRECISION,
    IS_NULLABLE,
    COLUMN_KEY,
    EXTRA
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Employees'
ORDER BY ORDINAL_POSITION;
```

`COLUMN_KEY` is useful schema metadata, but it needs careful interpretation. `PRI` indicates a primary-key column, `UNI` a unique key, and `MUL` a nonunique key. An empty value does not always prove that the column is unindexed: a column can be a later part of a nonunique composite key and still have an empty `COLUMN_KEY` in this view. Inspect the index metadata when the distinction matters. [2]

For a quick MySQL table-level overview:

```sql
-- MySQL: estimates and allocation statistics maintained by the engine.
SHOW TABLE STATUS LIKE 'Employees';
```

Values such as `Avg_row_length` and `Data_length` are useful signals, but they are engine statistics and allocation measurements, not a byte-perfect reconstruction of every row. Treat them as observations to compare with a schema estimate, not as the definition of a row format.

## 4. MySQL 8: a charset-aware per-column estimate and total

The next script is deliberately more conservative than a large `CASE` expression that pretends every MySQL type has one universal byte size. It uses `CHARACTER_OCTET_LENGTH` for character/binary declarations, preserves the `utf8mb3`/`utf8mb4` distinction through the metadata, and reports columns it cannot safely model instead of silently assigning them zero bytes.

This is **MySQL 8 syntax**. It produces one per-column result set followed by a total result set. The total is the sum of modeled maximum field contributions; it is not an InnoDB physical-row measurement.

```sql
-- MySQL 8: choose the table to inspect.
SET @schema_name = DATABASE();
SET @table_name = 'Employees';

-- MySQL 8: per-column declared maximum/payload estimate.
WITH estimates AS (
    SELECT
        ORDINAL_POSITION,
        COLUMN_NAME,
        DATA_TYPE,
        COLUMN_TYPE,
        CHARACTER_SET_NAME,
        IS_NULLABLE,
        CHARACTER_OCTET_LENGTH,
        CASE
            -- Common fixed-width planning values.
            WHEN DATA_TYPE = 'tinyint'   THEN 1
            WHEN DATA_TYPE = 'smallint'  THEN 2
            WHEN DATA_TYPE = 'mediumint' THEN 3
            WHEN DATA_TYPE IN ('int', 'integer') THEN 4
            WHEN DATA_TYPE = 'bigint'    THEN 8
            WHEN DATA_TYPE = 'float'     THEN 4
            WHEN DATA_TYPE IN ('double', 'real') THEN 8
            WHEN DATA_TYPE = 'date'      THEN 3
            WHEN DATA_TYPE = 'year'      THEN 1
            WHEN DATA_TYPE = 'bit'
                 AND NUMERIC_PRECISION IS NOT NULL
                THEN CEIL(NUMERIC_PRECISION / 8)

            -- This uses the metadata's byte maximum, not N × a guessed charset width.
            WHEN DATA_TYPE IN (
                'char', 'varchar', 'binary', 'varbinary',
                'tinytext', 'text', 'mediumtext', 'longtext',
                'tinyblob', 'blob', 'mediumblob', 'longblob'
            ) THEN CHARACTER_OCTET_LENGTH

            -- DECIMAL, temporal fractional precision, JSON, spatial, and other
            -- types need additional type/format-specific treatment here.
            ELSE NULL
        END AS declared_max_payload_bytes,
        CASE
            -- A rough length-entry estimate for variable-length declarations.
            WHEN DATA_TYPE IN ('varchar', 'varbinary') THEN
                CASE
                    WHEN CHARACTER_OCTET_LENGTH <= 255 THEN 1
                    ELSE 2
                END
            WHEN DATA_TYPE IN ('tinytext', 'tinyblob') THEN 1
            WHEN DATA_TYPE IN ('text', 'blob') THEN 2
            WHEN DATA_TYPE IN ('mediumtext', 'mediumblob') THEN 3
            WHEN DATA_TYPE IN ('longtext', 'longblob') THEN 4
            ELSE 0
        END AS length_bytes_estimate
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = @table_name
)
SELECT
    ORDINAL_POSITION,
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    CHARACTER_SET_NAME,
    IS_NULLABLE,
    CHARACTER_OCTET_LENGTH,
    declared_max_payload_bytes,
    length_bytes_estimate,
    CASE
        WHEN declared_max_payload_bytes IS NULL THEN NULL
        ELSE declared_max_payload_bytes + length_bytes_estimate
    END AS estimated_max_field_bytes,
    CASE
        WHEN declared_max_payload_bytes IS NULL
            THEN 'not modeled: add type-specific rules before using in a total'
        WHEN length_bytes_estimate > 0
            THEN 'rough variable-length estimate; not physical row bytes'
        ELSE 'fixed or metadata-based planning estimate'
    END AS estimate_note
FROM estimates
ORDER BY ORDINAL_POSITION;

-- MySQL 8: total of modeled fields plus a NULL-bitmap planning hint.
WITH estimates AS (
    SELECT
        IS_NULLABLE,
        CASE
            WHEN DATA_TYPE = 'tinyint'   THEN 1
            WHEN DATA_TYPE = 'smallint'  THEN 2
            WHEN DATA_TYPE = 'mediumint' THEN 3
            WHEN DATA_TYPE IN ('int', 'integer') THEN 4
            WHEN DATA_TYPE = 'bigint'    THEN 8
            WHEN DATA_TYPE = 'float'     THEN 4
            WHEN DATA_TYPE IN ('double', 'real') THEN 8
            WHEN DATA_TYPE = 'date'      THEN 3
            WHEN DATA_TYPE = 'year'      THEN 1
            WHEN DATA_TYPE = 'bit'
                 AND NUMERIC_PRECISION IS NOT NULL
                THEN CEIL(NUMERIC_PRECISION / 8)
            WHEN DATA_TYPE IN (
                'char', 'varchar', 'binary', 'varbinary',
                'tinytext', 'text', 'mediumtext', 'longtext',
                'tinyblob', 'blob', 'mediumblob', 'longblob'
            ) THEN CHARACTER_OCTET_LENGTH
            ELSE NULL
        END AS payload_bytes,
        CASE
            WHEN DATA_TYPE IN ('varchar', 'varbinary') THEN
                CASE WHEN CHARACTER_OCTET_LENGTH <= 255 THEN 1 ELSE 2 END
            WHEN DATA_TYPE IN ('tinytext', 'tinyblob') THEN 1
            WHEN DATA_TYPE IN ('text', 'blob') THEN 2
            WHEN DATA_TYPE IN ('mediumtext', 'mediumblob') THEN 3
            WHEN DATA_TYPE IN ('longtext', 'longblob') THEN 4
            ELSE 0
        END AS length_bytes
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = @table_name
)
SELECT
    SUM(
        CASE WHEN payload_bytes IS NULL
             THEN 0
             ELSE payload_bytes + length_bytes
        END
    ) AS modeled_max_field_bytes,
    SUM(CASE WHEN payload_bytes IS NULL THEN 1 ELSE 0 END)
        AS unmodeled_columns,
    SUM(CASE WHEN IS_NULLABLE = 'YES' THEN 1 ELSE 0 END)
        AS nullable_columns,
    CEIL(
        SUM(CASE WHEN IS_NULLABLE = 'YES' THEN 1 ELSE 0 END) / 8
    ) AS null_bitmap_bytes_approx,
    'Modeled fields only; add record headers, row format, indexes, pages, and overflow effects separately.'
        AS interpretation
FROM estimates;
```

The repeated CTE is intentional: in MySQL, a common table expression belongs to the single statement that follows it. The query's `NULL` result for an unmodeled type is safer than reporting a false exact total. If your table uses `DECIMAL`, `TIME`, `DATETIME` with fractional seconds, `JSON`, spatial types, generated values, or unusual collations, extend the rules only after checking the relevant engine documentation and row format.

### Why the metadata query is better than hard-coding `utf8mb4`

Suppose `Employees.Name` is `VARCHAR(50)` with `utf8mb3` and `Employees.Email` is `VARCHAR(50)` with `utf8mb4`. The query reads their separate `CHARACTER_OCTET_LENGTH` values rather than applying one table-wide multiplier. A table default does not necessarily describe every column: a column can have its own character set, and binary columns have no character set. The result is therefore a field-wise estimate.

For a simple all-`utf8mb4` example:

```text
Id           INT              4 bytes
Name         VARCHAR(50)      200-byte max payload + rough 1-byte length entry
Email        VARCHAR(50)      200-byte max payload + rough 1-byte length entry
Department   VARCHAR(50)      200-byte max payload + rough 1-byte length entry

Modeled maximum field contribution: 4 + 201 + 201 + 201 = 607 bytes
```

Again, 607 is not “allocated row size.” It leaves out the physical record's metadata and says nothing about secondary indexes or page allocation.

## 5. MySQL InnoDB: what the physical estimate must add

**MySQL InnoDB behavior is engine-specific.** InnoDB uses the primary key as its clustered index. If no primary key exists, it can use a suitable `UNIQUE NOT NULL` index; otherwise it creates a hidden clustered index named `GEN_CLUST_INDEX`. Secondary-index records include the primary-key values needed to find the clustered record. [3]

That means the same logical column can contribute to storage more than once:

```text
Clustered record:
  primary-key value + other row values + InnoDB record metadata

Secondary index on (Email):
  Email key value + primary-key value + secondary-record metadata

Another secondary index on (Department):
  Department key value + primary-key value + secondary-record metadata
```

A physical estimate must also account for the following, whose exact sizes depend on the version, page size, row format, and data:

- **Length entries:** variable-length fields need metadata describing the stored length. A one-byte or two-byte planning guess is not a complete InnoDB record-layout calculation.
- **NULL bitmap:** nullable columns need presence information. A rough planning hint is one bit per nullable column, rounded up to bytes; the exact record layout and placement are row-format details.
- **Record headers and hidden metadata:** InnoDB records have headers and may carry transaction/version information. These bytes are not represented by the sum of declared column payloads.
- **Row format:** `COMPACT`, `DYNAMIC`, and other InnoDB formats do not have identical handling of variable-length and large values. InnoDB documentation specifically describes record metadata, NULL maps, length fields, and large-value handling. [1]
- **Overflow/off-page storage:** large `TEXT`, `BLOB`, and long variable values may not fit entirely in the clustered record. The record can contain a pointer and/or a prefix while the remainder occupies overflow pages. “Off-page” does not mean “free”: it changes where the bytes and I/O live.
- **Primary-key copies in secondary indexes:** a wide primary key can make every secondary index substantially larger. A narrow, stable primary key is often relevant to storage as well as lookup design.
- **Page and allocation effects:** rows live in pages, not as individually allocated files. Page headers, record directories, free space, splits, and partially filled pages mean that summing row estimates will not equal `Data_length` exactly.
- **Compression:** page compression or compressed row formats can reduce allocated bytes, but the result depends on page contents and compression behavior. Compression is not a fixed discount that can be subtracted from each row.

Use the row-size estimate to identify risk and compare alternatives. Use engine metrics and a representative dataset to measure actual storage.

## 6. Compare a declaration with real values

A maximum estimate answers “what could be stored?” A value-length query answers “what is stored in these rows?” The following is **MySQL syntax** and measures value bytes for a sample of rows; it does not measure record headers or pages.

```sql
-- MySQL: actual encoded byte lengths for present values.
SELECT
    COUNT(*) AS sampled_rows,
    AVG(CHAR_LENGTH(Name)) AS avg_name_characters,
    AVG(OCTET_LENGTH(Name)) AS avg_name_bytes,
    MAX(OCTET_LENGTH(Name)) AS max_name_bytes,
    AVG(OCTET_LENGTH(Email)) AS avg_email_bytes,
    MAX(OCTET_LENGTH(Email)) AS max_email_bytes,
    AVG(OCTET_LENGTH(Department)) AS avg_department_bytes,
    MAX(OCTET_LENGTH(Department)) AS max_department_bytes
FROM Employees;
```

`OCTET_LENGTH` returns the bytes of the value in MySQL, while `CHAR_LENGTH` returns characters. NULL values are ignored by the aggregate functions. Compare these measurements with the metadata query, and then compare both with engine-level statistics such as `SHOW TABLE STATUS`.

For repeatable testing, use data that resembles production: character distributions, NULL frequency, long-value frequency, primary-key width, and index definitions all affect storage. A synthetic test containing only short ASCII strings can make a `utf8mb4` design look smaller than its worst-case payload.

> **Warning:** Do not run `DROP TABLE`, `TRUNCATE`, `DELETE`, or index-removal statements merely to measure size. If a destructive test is necessary, use a disposable database and an explicit backup/rollback plan.

## 7. SQLite: declared types and file pages are different concepts

**SQLite behavior is not MySQL behavior.** SQLite does not provide MySQL's `INFORMATION_SCHEMA.COLUMNS`, and a declaration such as `VARCHAR(50)` does not impose MySQL-style character-length enforcement. SQLite uses dynamic typing and stores values in records using serial-type information; table and index B-trees are stored in fixed-size pages, and large records can use overflow pages. [4]

Use SQLite's own metadata and byte functions instead:

```sql
-- SQLite: declared table metadata; not INFORMATION_SCHEMA.
PRAGMA table_info('employees');

-- SQLite: actual UTF-8 byte lengths of values in this result set.
SELECT
    COUNT(*) AS rows_seen,
    AVG(length(CAST(name AS BLOB))) AS avg_name_bytes,
    MAX(length(CAST(name AS BLOB))) AS max_name_bytes,
    AVG(length(CAST(email AS BLOB))) AS avg_email_bytes,
    MAX(length(CAST(email AS BLOB))) AS max_email_bytes
FROM employees;

-- SQLite: database/page allocation signals, not a per-row size.
PRAGMA page_size;
PRAGMA page_count;
```

`length(CAST(value AS BLOB))` measures the bytes of the value currently returned by SQLite. `page_size × page_count` is a coarse database-file allocation signal; it includes page structures, indexes, freelist effects, and other objects. It is not the sum of row payloads. SQLite's query-plan inspection is also dialect-specific; `EXPLAIN QUERY PLAN` reports a high-level `SCAN`/`SEARCH` description and its output format can change between versions. [5]

## 8. MariaDB: label the dialect and check the storage engine

**MariaDB syntax and behavior are explicitly MariaDB-specific**, even where a query resembles MySQL. MariaDB provides `INFORMATION_SCHEMA.COLUMNS`, and `CHARACTER_OCTET_LENGTH` is the appropriate metadata concept for declared byte capacity. Adapt the MySQL 8 CTE to the MariaDB version in use rather than assuming every MySQL 8 expression or type rule is identical.

```sql
-- MariaDB: metadata query; do not treat this as SQLite or SQL Server syntax.
SELECT
    ORDINAL_POSITION,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_SET_NAME,
    CHARACTER_MAXIMUM_LENGTH,
    CHARACTER_OCTET_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'employees'
ORDER BY ORDINAL_POSITION;
```

If the table uses InnoDB, the physical questions remain engine questions: row format, off-page values, clustered records, secondary-index key copies, and page allocation all matter. MariaDB's indexing guidance also emphasizes that secondary InnoDB keys carry primary-key values and that index maintenance adds write cost. [6] Do not call a metadata sum an allocated-row measurement merely because the column query succeeded.

## 9. SQL Server: use byte metadata and T-SQL functions

**SQL Server behavior is separate from MySQL, MariaDB, and SQLite.** SQL Server exposes column metadata through catalog views rather than `INFORMATION_SCHEMA.COLUMNS` as used above. `sys.columns.max_length` is measured in bytes; for `nvarchar`, it is the byte maximum rather than the character count, and `-1` denotes a large-value type such as `varchar(max)` or `nvarchar(max)`.

```sql
-- SQL Server: catalog metadata, including declared byte maximum.
SELECT
    c.column_id,
    c.name AS column_name,
    t.name AS data_type,
    c.max_length,
    c.is_nullable,
    c.is_computed
FROM sys.columns AS c
JOIN sys.types AS t
  ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID(N'dbo.Employees')
ORDER BY c.column_id;

-- SQL Server: actual bytes in values, not declared maximum and not row allocation.
SELECT
    AVG(CAST(DATALENGTH(Name) AS decimal(19,4))) AS avg_name_bytes,
    MAX(DATALENGTH(Name)) AS max_name_bytes,
    AVG(CAST(DATALENGTH(Email) AS decimal(19,4))) AS avg_email_bytes,
    MAX(DATALENGTH(Email)) AS max_email_bytes
FROM dbo.Employees;

-- SQL Server: object-level allocation summary; not a per-row formula.
EXEC sys.sp_spaceused N'dbo.Employees';
```

A SQL Server row can include a record header, a NULL bitmap, a variable-column offset array, and row-overflow or large-object storage. A clustered index and its nonclustered indexes add separate structures; a heap uses a different row locator from a clustered table. Therefore, do not port an InnoDB formula into SQL Server. Use SQL Server's catalog and space-usage tools, then validate with representative data.

## 10. A practical estimation workflow

1. **Identify the engine and version.** MySQL InnoDB, MariaDB InnoDB, SQLite, and SQL Server have different record formats and metadata APIs.
2. **Read per-column metadata.** Capture type, declared character length, `CHARACTER_OCTET_LENGTH` or engine equivalent, nullability, generated status, and collation/character set where applicable.
3. **Compute declared maximum payload.** Keep `utf8mb3` and `utf8mb4` field-wise. Do not assume the table default applies to every column.
4. **Add a clearly labeled variable-length estimate.** Length fields are overhead, not payload. Mark one-byte/two-byte rules as rough unless you are calculating a documented engine format.
5. **Count nullable columns.** Use the count only as a rough NULL-bitmap planning hint; do not present it as the complete record header.
6. **Inventory indexes.** Include the clustered record and secondary index entries. In InnoDB, secondary entries carry primary-key values. [3]
7. **Check large values and row format.** Determine whether values can move off-page or into overflow/Large Object storage, and whether compression is enabled.
8. **Measure representative data.** Compare actual value byte lengths with engine statistics and object/page allocation. Include NULLs, non-ASCII text, long values, and production-like key widths.
9. **Treat limits separately from averages.** A declared maximum helps test worst-case constraints; an average helps estimate workload storage. Neither alone describes every physical row.
10. **Document uncertainty.** Record which types were modeled, which were not, and which overheads were measured rather than guessed.

## References

[1]: https://dev.mysql.com/doc/refman/8.4/en/innodb-row-format.html "MySQL 8.4 Reference Manual: InnoDB Row Formats"

[2]: https://dev.mysql.com/doc/refman/8.4/en/information-schema-columns-table.html "MySQL 8.4 Reference Manual: The INFORMATION_SCHEMA COLUMNS Table"

[3]: https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html "MySQL 8.4 Reference Manual: InnoDB Index Types"

[4]: https://www.sqlite.org/fileformat2.html "SQLite File Format: Record Format, B-Tree Pages, and Overflow Pages"

[5]: https://www.sqlite.org/eqp.html "SQLite EXPLAIN QUERY PLAN"

[6]: https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/building-the-best-index-for-a-given-select "MariaDB: Building the Best Index for a Given SELECT"
