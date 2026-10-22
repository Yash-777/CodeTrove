# SQL–NoSQL Interview Guide

This page combines relational SQL, indexing, query-writing, transactions, and NoSQL design. Use the expandable questions as interview practice: answer the definition first, show the sample, then explain the trade-off and production concern.

## 1. Database foundations

<details><summary>What is a database, and what is the difference between an RDBMS and a NoSQL database?</summary>

### Answer
A database stores and retrieves structured information. An RDBMS stores data in tables with rows and columns and uses relationships, constraints, and SQL. NoSQL is a family of database models that commonly includes document, key-value, wide-column, and graph databases. “NoSQL” does not mean that SQL is forbidden; it means the storage model and scaling approach are not limited to the traditional relational model.

### Example
A relational order model may use separate `customers`, `orders`, and `order_items` tables joined by keys:

```sql
CREATE TABLE customers (
    customer_id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE orders (
    order_id BIGINT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);
```

A document database could store an order read model as one document:

```json
{
  "_id": "order-1001",
  "customerId": "customer-7",
  "customerName": "Alice",
  "items": [{ "sku": "keyboard", "quantity": 1, "price": 400 }],
  "status": "PAID"
}
```

### Interviewer perspective
Do not answer “SQL is vertical scaling and NoSQL is horizontal scaling” as an absolute rule. Modern relational databases can scale out, and NoSQL systems can scale vertically. Choose based on access patterns, consistency, transaction boundaries, query flexibility, operational maturity, and team skills.
</details>

<details><summary>When should you choose SQL instead of NoSQL?</summary>

### Answer
Choose SQL when relationships, joins, constraints, ad-hoc reporting, and multi-row transactions are central. Choose NoSQL when a known access pattern benefits from denormalized documents or key-based distribution, very high write/read scale, flexible attributes, or independent partitioning.

### Example
Use SQL for money transfers because the debit, credit, and audit record need one well-defined transaction. A document store may be appropriate for a product catalog whose attributes vary by category and is mostly read by product ID.

### Interviewer perspective
A strong answer starts with queries and invariants, not the popularity of a product. Explain what becomes harder after choosing the model: joins and cross-document transactions in many NoSQL designs, or partitioning and schema evolution in a relational design.
</details>

## 2. SQL schema and data changes

<details><summary>What do CREATE, ALTER, DROP, DELETE, and TRUNCATE do?</summary>

### Answer
`CREATE` defines a database object. `ALTER` changes its structure. `DROP` removes the object itself. `DELETE` removes selected rows and can use `WHERE`. `TRUNCATE` removes all rows efficiently in systems that support it, but its transaction, trigger, identity-reset, and rollback behavior is database-specific.

### Example
```sql
CREATE TABLE companies (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP NOT NULL
);

ALTER TABLE companies ADD COLUMN phone VARCHAR(30);
ALTER TABLE companies RENAME COLUMN phone TO contact_phone;

DELETE FROM companies WHERE id = 10;
TRUNCATE TABLE companies;
-- DROP TABLE companies; -- removes the table definition and data
```

### Interviewer perspective
Always ask which database engine is being used before promising exact syntax or rollback behavior. Treat `DROP`, `TRUNCATE`, and unqualified `DELETE` as destructive operations requiring safeguards.
</details>

<details><summary>What is the difference between INSERT, UPDATE, and UPSERT?</summary>

### Answer
`INSERT` creates rows. `UPDATE` changes existing rows selected by a predicate. An upsert inserts when a key is absent and updates when the key already exists. Upsert syntax is database-specific.

### Example
```sql
INSERT INTO customers (customer_id, name, email)
VALUES (7, 'Alice', 'alice@example.com');

UPDATE customers
SET email = 'alice@example.org'
WHERE customer_id = 7;

-- PostgreSQL-style upsert
INSERT INTO customers (customer_id, name, email)
VALUES (7, 'Alice', 'alice@example.org')
ON CONFLICT (customer_id)
DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
```

### Interviewer perspective
The conflict key must be protected by a unique constraint. An application-side “check then insert” can race; use a database constraint and an atomic statement or transaction.
</details>

## 3. Filtering, ordering, and pagination

<details><summary>How do WHERE, IN, BETWEEN, LIKE, and NULL predicates work?</summary>

### Answer
`WHERE` filters rows before grouping. `IN` matches a set of values, `BETWEEN` expresses an inclusive range in common SQL engines, and `LIKE` supports pattern matching with `%` for zero or more characters and `_` for one character. `NULL` represents an unknown or absent value and must be tested with `IS NULL` or `IS NOT NULL`; `= NULL` never means “is null.”

### Example
```sql
SELECT customer_id, name
FROM customers
WHERE country IN ('US', 'UK')
  AND name LIKE 'A%';

SELECT order_id, amount
FROM orders
WHERE amount BETWEEN 300 AND 500;

SELECT customer_id
FROM customers
WHERE email IS NULL;
```

### Interviewer perspective
Explain three-valued logic: a comparison with `NULL` produces `UNKNOWN`, so `NOT IN` can produce surprising results if its subquery contains `NULL`. Prefer `NOT EXISTS` when nullable subquery values are possible.
</details>

<details><summary>How do ORDER BY, LIMIT, and OFFSET implement pagination?</summary>

### Answer
`ORDER BY` defines deterministic result order. `LIMIT` bounds the number of rows, and `OFFSET` skips rows in engines that support that syntax. Offset pagination becomes slower and less stable at large offsets because the database still has to walk past skipped rows and concurrent inserts can shift pages.

### Example
```sql
SELECT order_id, created_at
FROM orders
ORDER BY created_at DESC, order_id DESC
LIMIT 20 OFFSET 40;
```

Keyset pagination is usually more stable for large feeds:

```sql
SELECT order_id, created_at
FROM orders
WHERE (created_at, order_id) < (:last_created_at, :last_order_id)
ORDER BY created_at DESC, order_id DESC
LIMIT 20;
```

### Interviewer perspective
Always include a unique tie-breaker in the order. Ask whether a matching composite index exists and whether the endpoint requires a consistent snapshot while the data changes.
</details>

<details><summary>How do you find the second-highest salary correctly?</summary>

### Answer
First clarify whether “second highest” means the second distinct value or the second row after sorting. For the second distinct salary, use `DENSE_RANK`, a distinct ordered subquery, or a maximum below the maximum. Window functions are expressive and handle ties explicitly.

### Example
```sql
-- Second distinct salary
SELECT salary
FROM (
    SELECT salary,
           DENSE_RANK() OVER (ORDER BY salary DESC) AS rank_no
    FROM employees
) ranked
WHERE rank_no = 2;

-- Portable-style alternative
SELECT MAX(salary) AS second_highest_salary
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```

### Interviewer perspective
Mention the no-result case and duplicate salaries. `LIMIT 1 OFFSET 1` is not equivalent unless the business definition and tie handling are already clear.
</details>

## 4. Aggregation, grouping, and joins

<details><summary>How do aggregate functions, GROUP BY, HAVING, and ORDER BY work together?</summary>

### Answer
Aggregate functions such as `COUNT`, `SUM`, `AVG`, `MIN`, and `MAX` reduce multiple rows to values. `GROUP BY` creates one result group per key. `WHERE` filters input rows before grouping; `HAVING` filters groups after aggregation; `ORDER BY` sorts the final result.

### Example
```sql
SELECT department_id,
       COUNT(*) AS employee_count,
       MAX(salary) AS highest_salary,
       AVG(salary) AS average_salary
FROM employees
WHERE active = TRUE
GROUP BY department_id
HAVING COUNT(*) >= 3
ORDER BY highest_salary DESC;
```

### Interviewer perspective
`COUNT(*)` counts rows, while `COUNT(column)` ignores nulls and `COUNT(DISTINCT column)` counts distinct non-null values. Every selected non-aggregate column generally must be grouped, subject to engine-specific functional-dependency rules.
</details>

<details><summary>How do INNER, LEFT, RIGHT, and FULL OUTER JOIN differ?</summary>

### Answer
An inner join returns matching rows from both sides. A left join keeps every left-side row and fills unmatched right-side columns with `NULL`. A right join is the mirrored form. A full outer join keeps unmatched rows from both sides where the engine supports it.

### Example
```sql
SELECT c.customer_id, c.name, o.order_id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id;
```

Find customers without orders:

```sql
SELECT c.customer_id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL;
```

### Interviewer perspective
Putting a right-table predicate in `WHERE` can accidentally turn a left join into an inner join. Put the predicate in the `ON` clause when unmatched left rows must remain.
</details>

<details><summary>When should you use a subquery, a join, or a common table expression?</summary>

### Answer
A subquery expresses a nested calculation or existence test. A join combines related rows. A common table expression (CTE) names a query step and improves readability; recursive CTEs can traverse hierarchies. The optimizer may transform equivalent forms, so compare execution plans rather than assuming joins are always faster.

### Example
```sql
WITH department_totals AS (
    SELECT department_id, SUM(salary) AS total_salary
    FROM employees
    GROUP BY department_id
)
SELECT d.name, t.total_salary
FROM departments d
JOIN department_totals t ON t.department_id = d.department_id;
```

### Interviewer perspective
Use `EXISTS` when you only need to know whether a related row exists. Explain cardinality and duplicate multiplication when joining one-to-many tables.
</details>

<details><summary>What is the difference between UNION and UNION ALL?</summary>

### Answer
Both combine compatible result sets. `UNION` removes duplicate rows, which requires duplicate elimination. `UNION ALL` preserves duplicates and is usually faster. Each branch must return the same number of compatible columns, and output names come from the first query.

### Example
```sql
SELECT city FROM customers
UNION
SELECT city FROM suppliers;

SELECT city FROM customers
UNION ALL
SELECT city FROM suppliers;
```

### Interviewer perspective
Use `UNION ALL` when rows represent separate events or duplicates are meaningful. Do not add `UNION` merely to hide a join that is multiplying rows unexpectedly.
</details>

## 5. Indexes and query performance

<details><summary>What is an index and when can it hurt performance?</summary>

### Answer
An index is an auxiliary data structure that helps locate rows or satisfy ordering without scanning every table row. It consumes storage and must be maintained on writes, so too many indexes slow inserts, updates, deletes, and bulk loads. An index is useful only when its leading columns and selectivity match the query workload.

### Example
```sql
CREATE INDEX idx_orders_customer_created
ON orders (customer_id, created_at DESC);

EXPLAIN
SELECT order_id, created_at
FROM orders
WHERE customer_id = 7
ORDER BY created_at DESC
LIMIT 20;
```

### Interviewer perspective
Use `EXPLAIN` or the engine's actual execution-plan tool. An index is not automatically used: functions on columns, implicit casts, low selectivity, stale statistics, or a cheaper table scan can change the plan.
</details>

<details><summary>What is the leftmost-prefix rule for a composite index?</summary>

### Answer
For an index on `(col1, col2, col3)`, the database can generally use the leading prefix `(col1)`, `(col1, col2)`, or `(col1, col2, col3)` more directly than a predicate that starts only with `col2`. The exact optimizer behavior depends on the database engine, statistics, and query shape.

### Example
```sql
CREATE INDEX idx_events_tenant_time_type
ON events (tenant_id, occurred_at, event_type);

-- Good match for the leading prefix
SELECT * FROM events
WHERE tenant_id = :tenant
  AND occurred_at >= :from_time;

-- Does not begin with tenant_id; may need another index or a scan
SELECT * FROM events
WHERE event_type = 'LOGIN';
```

### Interviewer perspective
Column order follows real predicates and sort requirements. Equality columns often precede range columns, but validate the choice with representative data and execution plans.
</details>

<details><summary>What is a covering index?</summary>

### Answer
A covering index contains all columns needed to filter, join, sort, and return a query, so the engine may answer it without visiting the base table. This can reduce I/O but makes the index larger and more expensive to maintain.

### Example
```sql
CREATE INDEX idx_customer_email_name
ON customers (email, customer_id, name);

SELECT customer_id, name
FROM customers
WHERE email = :email;
```

### Interviewer perspective
Do not add every selected column to every index. Consider write volume, index size, cache pressure, and whether the engine actually performs an index-only scan.
</details>

## 6. Transactions, locks, and deadlocks

<details><summary>What are ACID properties?</summary>

### Answer
Atomicity makes a transaction all-or-nothing. Consistency preserves declared invariants. Isolation controls how concurrent transactions observe each other's work. Durability means committed data survives the configured failure boundary. The exact isolation levels and guarantees vary by database.

### Example
```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
COMMIT;
-- ROLLBACK on failure instead of committing a partial transfer
```

### Interviewer perspective
ACID does not mean every query is globally serialized. Explain isolation anomalies such as dirty reads, non-repeatable reads, and phantoms, and identify the business invariant that needs protection.
</details>

<details><summary>What causes a database deadlock and how do you prevent it?</summary>

### Answer
A deadlock occurs when transactions hold locks while waiting for locks held by one another. Consistent resource ordering, short transactions, suitable indexes, and avoiding user/network work inside a transaction reduce the risk. Applications should handle a detected deadlock by rolling back and retrying only when the operation is safe and idempotent.

### Example
```text
Transaction A: locks account 1 → waits for account 2
Transaction B: locks account 2 → waits for account 1
```

Always lock accounts in a deterministic order:

```sql
-- For a transfer, lock the lower account_id first in every code path.
SELECT account_id, balance
FROM accounts
WHERE account_id IN (:from_id, :to_id)
ORDER BY account_id
FOR UPDATE;
```

### Interviewer perspective
A retry without rollback, an idempotency key, or a bounded retry policy can duplicate business effects. Include deadlock metrics and database diagnostics in the answer.
</details>

## 7. NoSQL models and trade-offs

<details><summary>What are the main NoSQL database models?</summary>

### Answer
Document databases store JSON-like documents; key-value stores map keys to opaque values; wide-column stores distribute rows by partition and clustering keys; graph databases model vertices and relationships. Each model optimizes different access patterns.

### Example

```text
Document:  product/{id} -> { name, category, attributes }
Key-value: session:{id} -> serialized session with expiry
Wide-column: orders_by_customer[customer_id, order_time] -> order
Graph:      (user)-[:FOLLOWS]->(user)
```

### Interviewer perspective
Do not describe NoSQL as schema-less. Most production systems still have an application schema, validation rules, indexes, partition keys, and migration strategy; the schema is often enforced differently.
</details>

<details><summary>What is denormalization in NoSQL and what problem does it solve?</summary>

### Answer
Denormalization stores data close to the read path, often duplicating fields or embedding child data. It reduces joins and round trips but creates write-amplification, consistency, document-size, and update-propagation concerns.

### Example
An order document may embed the product name used on the receipt. If the catalog name changes, decide whether historical orders should preserve the old name or whether a propagation job should update read models.

### Interviewer perspective
Design from access patterns: list the reads, partition key, item size, update frequency, and consistency requirement. “Embed everything” fails when child data grows without bound or changes independently.
</details>

<details><summary>What do consistency, availability, and partition tolerance mean in distributed databases?</summary>

### Answer
In the CAP discussion, when a network partition occurs, a distributed system must trade some availability for stronger consistency or return potentially stale data. CAP is about behavior during partitions, not a label that permanently classifies every database as only two letters.

### Example
A shopping cart may tolerate eventual consistency for a recommendation view, while an account balance requires a stronger consistency model and carefully defined write ownership.

### Interviewer perspective
Ask “consistent for which operation?” Eventual consistency can be correct when the UI shows a last-updated time, retries are safe, and reconciliation exists. It is dangerous when applied to authorization, inventory reservation, or money without additional safeguards.
</details>

<details><summary>How do you model a NoSQL partition key?</summary>

### Answer
A partition key determines where data is stored and how requests distribute. A good key spreads load while supporting the most important query. A hot key concentrates traffic on one partition; a high-cardinality but unusable key may scatter data and make queries expensive.

### Example
For customer order history, a key such as `customerId` supports one customer's history, but a globally popular customer can become hot. A time bucket or sharded key may be required for unusually high write rates.

### Interviewer perspective
Include item size, sort/range key, expected read/write rate, tenant isolation, and retention policy. A partition key is a capacity and availability decision, not just a naming choice.
</details>

## 8. Practical interview query set

<details><summary>How do you find the highest salary in every department?</summary>

### Answer
Aggregate by department and take `MAX`, or use a window function when the complete employee row is required.

### Example
```sql
SELECT department_id, MAX(salary) AS highest_salary
FROM employees
GROUP BY department_id;

SELECT employee_id, department_id, salary
FROM (
    SELECT e.*,
           DENSE_RANK() OVER (
               PARTITION BY department_id ORDER BY salary DESC
           ) AS rank_no
    FROM employees e
) ranked
WHERE rank_no = 1;
```

### Interviewer perspective
`MAX` returns the value, while the window query returns all employees tied for the maximum. Ask which result the requirement actually needs.
</details>

<details><summary>How do you combine first, middle, and last names safely?</summary>

### Answer
Use the database's string functions while handling nullable parts. Concatenation behavior differs across engines, so use `COALESCE`, `CONCAT`, or a database-specific formatting function deliberately.

### Example
```sql
SELECT TRIM(CONCAT(
           first_name, ' ',
           COALESCE(middle_name || ' ', ''),
           last_name
       )) AS full_name
FROM employees
WHERE middle_name LIKE '%kumar%';
```

### Interviewer perspective
The `||` operator is not portable to every engine; MySQL commonly uses `CONCAT`. Explain parameterized queries and never build this predicate by string concatenation from user input.
</details>

<details><summary>How do you optimize a slow SQL query in production?</summary>

### Answer
Reproduce the query with realistic parameters, inspect the actual execution plan, measure rows examined versus rows returned, verify statistics and indexes, check locks and I/O, then change one factor at a time. Consider query shape, pagination, projections, join cardinality, and whether the work belongs in a precomputed read model.

### Example checklist

```text
1. Capture latency, frequency, parameters, and timeout rate.
2. Run EXPLAIN / EXPLAIN ANALYZE safely on representative data.
3. Check scans, join order, row estimates, sort/hash spills, and lock waits.
4. Add or reorder an index only when the workload justifies it.
5. Re-test correctness, p95/p99 latency, writes, and storage cost.
```

### Interviewer perspective
Never optimize only the average latency. A query that is fast for one tenant can be slow for a large tenant. Protect sensitive values in query logs and use a safe plan-capture process.
</details>

## Related Interview Prep sections

- [SQL and index fundamentals](/content/tree/databases/sql)
- [NoSQL data models](/content/tree/databases/nosql)
- [Transactions and locking](/content/tree/interview-prep/sql/transactions-and-locking)
- [Joins and indexes](/content/tree/interview-prep/sql/joins-and-indexes)
- [Query tuning](/content/tree/interview-prep/sql/query-tuning)

## Further reading

- [PostgreSQL SQL language](https://www.postgresql.org/docs/current/sql.html)
- [MySQL optimization and indexes](https://dev.mysql.com/doc/refman/8.4/en/optimization-indexes.html)
- [MongoDB data modeling](https://www.mongodb.com/docs/manual/core/data-modeling-introduction/)
- [Redis data types](https://redis.io/docs/latest/develop/data-types/)
- [Apache Cassandra data modeling](https://cassandra.apache.org/doc/latest/cassandra/data_modeling/)
