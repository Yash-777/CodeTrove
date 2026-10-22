# Batch-load data and diagnose long inserts

Bulk loading is not just an `INSERT`-syntax problem. It is a coordination problem between the database engine, transaction log, locks, client driver, proxy, and server. This lesson uses a deliberately measurable **MySQL/InnoDB** seed: an `Employees` table with **200,000 rows**, loaded in **10,000-row batches**. The same experiment can be adapted to other engines, but the syntax and timeout behavior are not portable.

> **Goal:** make progress durable and observable, then determine whether a failure is caused by SQL work, transaction pressure, or a connection path that gives up while the server is still working.

## 1. What the experiment is—and what it is not

The source experiment creates rows like these:

```text
Id       Name       Email                 Department
1        ABC 1      abc1@example.test     Dept 1
2        ABC 2      abc2@example.test     Dept 2
...
200000   ABC 200000 abc200000@example.test Dept 200000
```

The important invariants are:

- The target is **200,000 rows**, not “about 200,000.”
- A batch is **10,000 rows**. This gives 20 commit boundaries.
- A **0.5-second pause is optional**. It is a pacing experiment, not a timeout fix.
- A final `COUNT(*)` is authoritative for the rows that committed; a progress message seen by the client is not.
- A connection error such as **MySQL error 2013, “Lost connection to MySQL server during query,”** does not by itself prove that no rows were committed.

InnoDB uses the primary key as its clustered index. If a table has no primary key, InnoDB may use a suitable `UNIQUE NOT NULL` index or create a hidden `GEN_CLUST_INDEX`; declaring the primary key explicitly gives the load a predictable row locator. [1]

## 2. MySQL preflight: inspect before loading

The following statements are **MySQL syntax**, not portable SQL. Run them in the intended schema and record the output before changing anything:

```sql
-- MySQL: version and current schema
SELECT VERSION();
SELECT DATABASE();

-- MySQL: inspect the existing definition and indexes
SHOW CREATE TABLE Employees;
DESCRIBE Employees;
SHOW INDEXES FROM Employees;

-- MySQL: exact current count and a useful identity check
SELECT COUNT(*) AS exact_rows, MIN(Id) AS first_id, MAX(Id) AS last_id
FROM Employees;

-- MySQL: the row-count and size summary is useful, but treat InnoDB
-- estimates as estimates; COUNT(*) is the verification query.
SHOW TABLE STATUS LIKE 'Employees';

-- MySQL: inspect timeout and packet settings that may matter.
SHOW VARIABLES WHERE Variable_name IN
  ('max_allowed_packet', 'net_read_timeout', 'net_write_timeout',
   'wait_timeout', 'interactive_timeout');
```

`DESCRIBE` and `INFORMATION_SCHEMA.COLUMNS` expose type, character length, nullability, defaults, `EXTRA`, and `COLUMN_KEY` metadata. `PRI`, `UNI`, and `MUL` are useful hints, but an empty `COLUMN_KEY` should not be overinterpreted: a column can be a later part of a non-unique composite key without being shown as the leading key column. Inspect `SHOW INDEXES` for the complete ordered definition. [3] [4]

For a metadata-oriented check:

```sql
-- MySQL: metadata for this table only
SELECT
    ORDINAL_POSITION,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    NUMERIC_PRECISION,
    NUMERIC_SCALE,
    IS_NULLABLE,
    COLUMN_KEY,
    COLUMN_DEFAULT,
    EXTRA
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Employees'
ORDER BY ORDINAL_POSITION;
```

### Row-size estimates are not a storage measurement

For `INT` plus three `VARCHAR(50)` columns under `utf8mb4`, a simple maximum-field estimate is:

```text
INT:                 4 bytes
VARCHAR(50):        50 × 4 + length prefix = about 201 bytes each
Three strings:       603 bytes
Simple field total:  607 bytes
```

That is an upper-bound teaching estimate for the declared fields, not an exact InnoDB record size. Actual records include record metadata, null maps, length fields, page overhead, and index entries; large variable-length values may be stored partly off-page. [5] Compare it with `SHOW TABLE STATUS` and measured data, but do not infer an exact transaction-log size from the 607-byte figure.

## 3. A safe MySQL seed schema

This is the **MySQL/InnoDB** schema used by the lesson. `CREATE TABLE IF NOT EXISTS` avoids replacing an existing table. The loader below also refuses to load into a non-empty table, so a previously completed 200,000-row seed is preserved.

```sql
-- MySQL/InnoDB only
CREATE TABLE IF NOT EXISTS Employees (
    Id INT NOT NULL AUTO_INCREMENT,
    Name VARCHAR(50) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Department VARCHAR(50) NOT NULL,
    PRIMARY KEY (Id)
) ENGINE = InnoDB;
```

The source example uses shorter email declarations; the `VARCHAR(100)` above leaves room for the generated address without relying on truncation. Match this definition to your existing schema rather than silently changing a production table.

## 4. MySQL pattern: commit each 10,000-row batch

This is an intentionally explicit **MySQL stored-procedure** pattern. It inserts one row at a time inside a batch transaction so the transaction boundaries are easy to see. A production loader would normally use a multi-row `INSERT`, `LOAD DATA`, or an application bulk API, but it should still make an intentional decision about batch size and commit frequency.

```sql
-- MySQL client delimiter commands are client instructions, not SQL syntax.
DELIMITER //

CREATE PROCEDURE LoadEmployees(
    IN p_batch_size INT,
    IN p_total_rows INT,
    IN p_sleep_seconds DECIMAL(4,1)
)
BEGIN
    DECLARE v_existing BIGINT DEFAULT 0;
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_i INT DEFAULT 0;

    -- Roll back only the currently active batch if an insert fails.
    -- Earlier batches remain committed and can be counted.
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_batch_size <= 0 OR p_total_rows <= 0
       OR p_batch_size > p_total_rows
       OR p_sleep_seconds < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
              'Use positive sizes; sleep seconds must be zero or greater';
    END IF;

    SELECT COUNT(*) INTO v_existing FROM Employees;
    IF v_existing <> 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
              'Employees is not empty; refusing to duplicate the seed';
    END IF;

    WHILE v_done < p_total_rows DO
        START TRANSACTION;
        SET v_i = 0;

        WHILE v_i < p_batch_size AND v_done < p_total_rows DO
            INSERT INTO Employees (Name, Email, Department)
            VALUES (
                CONCAT('ABC ', v_done + 1),
                CONCAT('abc', v_done + 1, '@example.test'),
                CONCAT('Dept ', v_done + 1)
            );

            SET v_i = v_i + 1;
            SET v_done = v_done + 1;
        END WHILE;

        -- The durable boundary: exactly one commit per batch.
        COMMIT;

        -- This result set is progress, not the final verification.
        SELECT
            v_done AS rows_committed_by_this_call,
            p_total_rows AS target_rows,
            (SELECT COUNT(*) FROM Employees) AS rows_visible_now;

        -- Optional pacing. Set p_sleep_seconds to 0 for no delay.
        IF p_sleep_seconds > 0 THEN
            DO SLEEP(p_sleep_seconds);
        END IF;
    END WHILE;
END//

DELIMITER ;

-- MySQL: 20 batches × 10,000 rows = 200,000 rows.
-- The final argument is optional pacing, not a timeout setting.
CALL LoadEmployees(10000, 200000, 0.5);

-- MySQL: exact post-load checks
SELECT COUNT(*) AS exact_rows,
       MIN(Id) AS first_id,
       MAX(Id) AS last_id
FROM Employees;
```

A successful clean run should report `exact_rows = 200000`, `first_id = 1`, and `last_id = 200000` for an empty, newly created table. If the connection fails after several progress results, run the count query in a new connection. Since each batch was committed independently, the count may be a multiple of 10,000; however, do not assume that the client saw every result before disconnecting. The server may have committed a batch before the response was lost.

### Test a smaller load first

Before attempting the full seed, use a **separate scratch table or schema** and call the same loader with a small target:

```sql
-- MySQL, scratch table only: 10 batches of 100 rows.
CALL LoadEmployees(100, 1000, 0.0);
SELECT COUNT(*) AS exact_rows FROM Employees;
```

Do not run this test against the table that must remain the exact 200,000-row seed: the procedure intentionally refuses a non-empty table, and combining a test load with the real load makes diagnosis ambiguous. A small-batch test checks permissions, procedure syntax, data lengths, triggers, constraints, and the client’s ability to consume progress results before a long run consumes resources.

## 5. Why `SLEEP(0.5)` is not a timeout solution

The source experiment adds `DO SLEEP(0.5)` and describes it as preventing a timeout. That claim needs qualification:

1. `SLEEP` only makes the server-side routine wait between batches. It does not increase the client read timeout, proxy idle timeout, load-balancer timeout, `net_read_timeout`, `net_write_timeout`, or any external connection limit.
2. A stored procedure call can still look like one long request to a driver or proxy. Whether intermediate result sets reset an intermediary’s timer depends on the protocol path and client behavior; do not assume that a `SELECT` progress result reaches the client immediately.
3. Twenty batches with a 0.5-second pause add at least **10 seconds** to the run, before insert and commit time. It can therefore increase total runtime and make a fixed overall request deadline more likely to expire.
4. Error 2013 is a symptom of a lost connection, not a diagnosis. Check server error logs, restarts, resource pressure, proxy/client logs, and the exact statement duration. A timeout setting may be too low, but an OOM kill, network interruption, oversized packet, lock wait, or server failure can produce a similar user-visible failure.

Use `0.0` for a baseline, then test `0.5` only if pacing is useful for reducing contention. If the actual requirement is to allow longer work, fix the relevant timeout at the layer that owns it and make the job resumable; do not use an arbitrary sleep as a substitute.

## 6. Transactions, logs, locks, and batch-size trade-offs

A batch is a resource boundary as well as a progress boundary:

- **Transaction log / redo and undo:** one enormous transaction can generate a large amount of undo, retain old versions longer, delay purge, and require a long rollback after failure. Smaller committed transactions reduce the rollback scope, but they still generate log traffic.
- **Commit cost:** each `COMMIT` may require durable log synchronization. Very small batches increase commit overhead; very large batches reduce commit overhead but increase failure and resource blast radius.
- **Locks and visibility:** a batch holds locks until its commit. Ten thousand rows can block conflicting work longer than one hundred rows. The exact lock set depends on the table, indexes, isolation level, uniqueness checks, foreign keys, and concurrent statements.
- **Autocommit:** do not assume that a loop is one transaction. In MySQL, explicitly use `START TRANSACTION` and `COMMIT` as shown. If an application has autocommit enabled and issues one insert per round trip, it may commit every row, which is usually much slower.
- **Resumption:** after a disconnect, count committed rows and resume from a deliberate checkpoint. Do not blindly call the same non-idempotent loader again, or it may duplicate data. For real jobs, use a deterministic source key and an idempotency strategy such as a unique constraint plus an engine-appropriate upsert policy.

Start with a small batch, measure commit latency and lock impact, then increase gradually. Ten thousand is a teaching value, not a universal optimum.

## 7. Index timing: load first or maintain indexes during the load?

Indexes speed reads by providing alternate access paths, but every inserted row may also require index-page changes. MariaDB’s indexing guidance similarly starts with the equality predicates and query shape, then considers range, grouping, ordering, cardinality, and write cost. [6]

For this `Employees` seed:

- The primary key is part of the table’s storage organization in InnoDB and should normally exist during the load.
- If a secondary index is required to enforce a uniqueness rule or a foreign-key-related invariant, create it before loading and accept its maintenance cost.
- If a secondary index is only for post-load reporting, loading first and creating it afterward can be faster for a large one-time load—but the later index build still needs CPU, disk space, log capacity, and possibly significant locking or metadata coordination.
- If the table is serving production traffic, postponing an index may make reads slow during the load; coordinate the change rather than optimizing only the batch duration.
- Do not create two indexes with the same ordered columns merely because their names differ. They add write and storage work without adding a new access path.

After the load, refresh statistics and compare plans:

```sql
-- MySQL: refresh optimizer statistics after the bulk load.
ANALYZE TABLE Employees;

-- MySQL: estimated plan; this does not execute the SELECT.
EXPLAIN
SELECT Id, Name, Email, Department
FROM Employees
WHERE Name = 'ABC 7';

-- MySQL 8.0.18+: execute and report actual iterator timing/rows.
EXPLAIN ANALYZE
SELECT Id, Name, Email, Department
FROM Employees
WHERE Name = 'ABC 7';

-- MySQL: add an index only when the workload justifies it.
CREATE INDEX idx_employees_name ON Employees (Name);

ANALYZE TABLE Employees;
EXPLAIN ANALYZE
SELECT Id, Name, Email, Department
FROM Employees
WHERE Name = 'ABC 7';

SHOW INDEXES FROM Employees;
```

`EXPLAIN` reports optimizer estimates, while `EXPLAIN ANALYZE` executes supported statements and reports observed iterator timing and rows; `ANALYZE TABLE` refreshes statistics that influence plan choices. [2] A scan can still be the right plan for a small table or a query returning most rows. Use the measured plan, not the presence of an index, as the decision criterion.

## 8. Dialect boundaries: similar ideas, different engines

### MySQL

The main procedure, `START TRANSACTION`, `COMMIT`, `DO SLEEP()`, `SHOW`, `INFORMATION_SCHEMA`, `ANALYZE TABLE`, and `EXPLAIN ANALYZE` examples above are labeled **MySQL**. They assume a MySQL version that supports the shown procedure and explain features. Check the server version before copying them.

### MariaDB

**MariaDB** has similar stored-procedure and transaction concepts, and it has its own `SLEEP()` and `ANALYZE TABLE` behavior. Do not assume every MySQL 8.0 `EXPLAIN ANALYZE` detail, optimizer output field, system variable, or version requirement is identical. Port the procedure and verify it on the target MariaDB version; use MariaDB’s index guidance and plan tools for that server. [6]

A MariaDB-shaped transaction fragment is still explicitly MariaDB/MySQL-family syntax, not a universal loader:

```sql
-- MariaDB: illustrative transaction boundary; test on your version.
START TRANSACTION;
INSERT INTO Employees (Name, Email, Department)
VALUES ('ABC 1', 'abc1@example.test', 'Dept 1');
COMMIT;
```

### SQLite

**SQLite is an embedded database library, not a MySQL server.** There is no MySQL server connection, `SHOW TABLE STATUS`, MySQL stored-procedure language, `DO SLEEP()`, or MySQL `INFORMATION_SCHEMA` in SQLite. SQLite’s transaction syntax is compact, but its locking, journaling, and concurrency model differ:

```sql
-- SQLite: explicit transaction; not MySQL procedure syntax.
BEGIN;
INSERT INTO Employees (Name, Email, Department)
VALUES ('ABC 1', 'abc1@example.test', 'Dept 1');
COMMIT;

-- SQLite: plan inspection; output format is high-level and version-sensitive.
EXPLAIN QUERY PLAN
SELECT Id, Name FROM Employees WHERE Name = 'ABC 1';
```

SQLite documents `SCAN` versus `SEARCH`, covering-index use, and temporary sort structures through `EXPLAIN QUERY PLAN`. [7] [8] A delay must be implemented by the host application or an appropriate host API; do not paste `DO SLEEP(0.5)` into SQLite and call it equivalent.

### SQL Server

**SQL Server** uses different administration and bulk-load surfaces. Its explicit transaction spelling is:

```sql
-- SQL Server: illustrative syntax, not MySQL syntax.
BEGIN TRANSACTION;
INSERT INTO dbo.Employees (Name, Email, Department)
VALUES (N'ABC 1', N'abc1@example.test', N'Dept 1');
COMMIT TRANSACTION;
```

For SQL Server pacing, `WAITFOR DELAY '00:00:00.500'` is a SQL Server statement, not `SLEEP()`. It also adds time and does not change a client, proxy, or command timeout. Use SQL Server’s supported bulk-copy tools, transaction log guidance, lock monitoring, and execution-plan tools rather than MySQL `SHOW`, `INFORMATION_SCHEMA`, or `EXPLAIN` statements.

## 9. Safe cleanup and recovery

The original experiment begins by dropping `Employees` and later drops the procedure. That is acceptable only for an isolated disposable lab. It is unsafe as a default lesson command because it destroys the seed and any dependent objects.

> **WARNING — destructive SQL.** Run the following only after confirming the database, table, backups, dependencies, and exact recovery plan. Never use it as an automatic first step in a shared or production schema.
>
> ```sql
> -- MySQL: permanently deletes the table and its data.
> DROP TABLE IF EXISTS Employees;
> ```

> **WARNING — destructive reset.** `TRUNCATE TABLE` removes all rows and has engine-specific transactional/identity behavior. Verify the target before executing it.
>
> ```sql
> -- MySQL: destructive; use only for a disposable test table.
> TRUNCATE TABLE Employees;
> ```

> **WARNING — index removal.** Dropping an index can break a uniqueness guarantee, foreign-key requirement, or important query plan. First inventory it with `SHOW INDEXES`, check dependencies and workload, and capture a rollback plan.
>
> ```sql
> -- MySQL: destructive to an access path; review before running.
> ALTER TABLE Employees DROP INDEX idx_employees_name;
> ```

> **WARNING — routine removal.** Dropping a procedure removes its definition and can break callers. Prefer a new procedure name in a scratch schema; only remove an old routine after checking its callers.
>
> ```sql
> -- MySQL: destructive to the stored routine definition; review first.
> DROP PROCEDURE IF EXISTS LoadEmployees;
> ```

## 10. A compact runbook

```text
Inspect schema and exact count
          |
          v
Use an empty scratch target for the small-batch test
          |
          v
Run 10,000-row transactions with explicit COMMITs
          |
          v
Emit progress, but verify with COUNT(*) from a fresh connection
          |
          +--> error 2013? Check committed count, logs, proxy/client timeout,
          |                 server health, locks, packets, and resource pressure
          |
          v
Refresh statistics and compare measured plans
          |
          v
Add only workload-justified indexes; re-measure read and write cost
```

The durable lesson is not “add a sleep.” It is: **bound the transaction, make progress observable, verify what committed, diagnose the entire connection path, and treat engine-specific syntax as engine-specific.**

## References

[1]: https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html "MySQL 8.4 Reference Manual: InnoDB Index Types"
[2]: https://dev.mysql.com/doc/refman/8.4/en/explain.html "MySQL 8.4 Reference Manual: EXPLAIN Statement"
[3]: https://dev.mysql.com/doc/refman/8.4/en/information-schema-columns-table.html "MySQL 8.4 Reference Manual: The INFORMATION_SCHEMA COLUMNS Table"
[4]: https://dev.mysql.com/doc/refman/8.4/en/information-schema-statistics-table.html "MySQL 8.4 Reference Manual: The INFORMATION_SCHEMA STATISTICS Table"
[5]: https://dev.mysql.com/doc/refman/8.4/en/innodb-row-format.html "MySQL 8.4 Reference Manual: InnoDB Row Formats"
[6]: https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/building-the-best-index-for-a-given-select "MariaDB Documentation: Building the Best Index for a Given SELECT"
[7]: https://www.sqlite.org/queryplanner.html "SQLite Documentation: The Query Planner"
[8]: https://www.sqlite.org/eqp.html "SQLite Documentation: EXPLAIN QUERY PLAN"
