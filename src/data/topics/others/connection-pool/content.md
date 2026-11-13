# Connection Pool

A connection pool keeps a managed set of database connections so requests can borrow and return them instead of opening a new network connection for every query. Pooling reduces handshake and authentication overhead, but it does not create unlimited database capacity.

## Lifecycle

1. The application starts the pool and creates connections lazily or up to its minimum size.
2. A request acquires a connection, usually through a `DataSource`.
3. The request performs short database work and returns the connection in a `finally` block or transaction boundary.
4. The pool validates, retires, or replaces connections as they age or fail.
5. Shutdown closes the pool after in-flight work has drained.

```java
try (Connection connection = dataSource.getConnection();
     PreparedStatement statement = connection.prepareStatement("select id from orders where id = ?")) {
    statement.setLong(1, orderId);
    // use the connection briefly; try-with-resources returns it to the pool
}
```

## HikariCP and Spring Boot

Spring Boot commonly uses HikariCP when it is available. Typical properties include:

```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=3000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.leak-detection-threshold=2000
```

These are starting points, not universal values. Size the pool from database limits, instance count, query latency, and concurrency. If ten application instances each open twenty connections, the database sees up to two hundred connections.

## Failure modes

| Symptom | Likely cause | First check |
|---|---|---|
| Timeout acquiring connection | Pool exhaustion or slow queries | Active, idle, pending, and query-duration metrics |
| Many idle connections | Pool is oversized or traffic is bursty | Database connection limit and pool configuration |
| Stale/broken connections | Network or database closes idle sessions | Validation, max lifetime, and database timeout alignment |
| Memory or transaction leaks | Connection or transaction not closed | Try-with-resources, transaction boundaries, leak logs |
| Database overload | Too much concurrency, not too little pooling | Query plans, locks, CPU, I/O, and database limits |

A pool timeout is a back-pressure signal. Increasing the maximum blindly can move the queue into the database and make the incident worse. Fix long transactions, unbounded concurrency, missing indexes, and connection leaks first.

## Observability checklist

Monitor pool active, idle, total, pending, acquire time, timeout count, and connection creation failures. Correlate them with request latency, database CPU, slow queries, lock waits, and error rates. Enable leak detection temporarily when diagnosing ownership; it is not a substitute for correct resource management.

> **Sizing principle:** a pool should be large enough to keep useful work flowing, but small enough that the database can serve every connection well.
