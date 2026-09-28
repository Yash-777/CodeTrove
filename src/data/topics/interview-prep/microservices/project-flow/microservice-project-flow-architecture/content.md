# Java Senior Engineer — Microservice Project Flow & Architecture

This page is the **end-to-end interview map** for a typical Java/Spring microservice system. Replace the examples with the architecture of the project you actually discuss in interviews.

## Reference architecture

```text
Client / Mobile / Web
        |
        v
   API Gateway
        |
   Load Balancer
        |
   +----+------------------------------+
   | Service Registry / Discovery       |
   | Config Server + Vault              |
   +----+------------------------------+
        |
  +-----+---------+----------+----------------+
  |               |          |                |
Order Service  Payment    User/Auth       Notification
  |               |          |
  +-------+-------+----------+
          |
    DB / Cache / Kafka
          |
   Observability stack
 Logs + Metrics + Traces
```

For framework-specific diagrams, prefer the official Spring documentation, especially [Spring Microservices](https://spring.io/microservices), [Spring Cloud](https://spring.io/projects/spring-cloud), and the relevant component documentation.

## Project request flow

1. Client sends an HTTPS request.
2. Edge/API Gateway performs routing, authentication/token checks, request correlation, rate limiting, and basic protection.
3. Load balancing selects a healthy service instance.
4. Service discovery resolves service instances when dynamic discovery is used.
5. Spring Security filters authenticate and authorize the request.
6. Servlet container and Spring MVC route the request through `DispatcherServlet` to the controller.
7. Interceptors/aspects apply cross-cutting concerns where appropriate.
8. Controller validates the request and delegates to the application/service layer.
9. Service layer performs business validation and transaction orchestration.
10. Spring Data/JPA accesses the database; cache is checked before expensive reads when appropriate.
11. Events are published to Kafka for asynchronous workflows.
12. Downstream calls use timeouts, retries, circuit breakers, bulkheads, and idempotency where appropriate.
13. Global exception handling converts known failures into stable API error contracts.
14. Logs, metrics, and traces carry the same correlation/trace identifiers across services.
15. Response travels back through the gateway to the client.

## Senior-engineer interview questions

<details>
<summary>API Gateway — why do you need it if services already expose REST APIs?</summary>

### Answer
An API Gateway provides a controlled edge for routing and cross-cutting concerns such as authentication, rate limiting, request shaping, TLS termination, observability, and sometimes aggregation. It should not become a second monolith containing business rules.

### Follow-up
What belongs at the gateway versus inside the service? What happens when the gateway is unavailable? How do you prevent a single gateway from becoming a bottleneck?

> **Note — what the interviewer is expecting:**
> Clear separation of edge concerns from domain/business logic, plus availability and scaling considerations.
</details>

<details>
<summary>Load balancer — client-side or server-side?</summary>

### Answer
Server-side load balancing places routing behind a load-balancing component. Client-side load balancing lets the caller choose an instance, often using service-discovery information. Discuss health checks, connection reuse, retries, zone/region awareness, and failure handling.

> **Note — what the interviewer is expecting:**
> Explain the request path and why a chosen strategy fits the deployment topology.
</details>

<details>
<summary>Spring Security filters vs interceptors — what is the difference?</summary>

### Answer
Spring Security's filter chain operates around servlet requests and is the normal place for authentication/authorization concerns. Spring MVC interceptors operate around controller handling and are useful for MVC-specific cross-cutting concerns. They are not interchangeable.

> **Note — what the interviewer is expecting:**
> Know where a request enters each mechanism and avoid putting security logic in an inappropriate layer.
</details>

<details>
<summary>What does DispatcherServlet do?</summary>

### Answer
`DispatcherServlet` is the central Spring MVC front controller. It receives the servlet request, resolves the handler/controller, invokes it through the configured handler infrastructure, and coordinates response rendering/message conversion and exception handling.

> **Note — what the interviewer is expecting:**
> Explain the request lifecycle rather than simply saying “it calls the controller.”
</details>

<details>
<summary>Explain the Spring bean lifecycle.</summary>

### Answer
Discuss instantiation, dependency injection, awareness callbacks when applicable, bean post-processors, initialization callbacks such as `@PostConstruct`, use of the bean, and destruction callbacks such as `@PreDestroy`. Exact lifecycle details depend on bean scope and container configuration.

> **Note — what the interviewer is expecting:**
> Understand where initialization logic belongs and how post-processors affect framework-managed objects.
</details>

<details>
<summary>How do you implement global exception handling?</summary>

### Answer
Use `@RestControllerAdvice` / `@ControllerAdvice` with `@ExceptionHandler` methods for stable error contracts. Map validation errors, domain errors, authentication/authorization failures, dependency failures, and unexpected errors separately. Never expose stack traces or internal infrastructure details to clients.

> **Note — what the interviewer is expecting:**
> Consistent API contracts, observability, correct HTTP semantics, and safe error handling.
</details>

<details>
<summary>How would you implement Kafka transaction management?</summary>

### Answer
Explain producer transactions, transaction boundaries, consumer offset handling, delivery semantics, idempotent producers, and the limitations of distributed transactions. For a database-to-Kafka workflow, discuss an outbox pattern when atomic DB + Kafka publication is required without relying on a distributed XA transaction.

> **Note — what the interviewer is expecting:**
> Distinguish Kafka's transaction semantics from end-to-end business transaction atomicity.
</details>

<details>
<summary>What does `@PreAuthorize` solve?</summary>

### Answer
`@PreAuthorize` enables method-level authorization expressions, for example checking roles or permissions before a method executes. It should complement authentication and broader request security rather than replace secure endpoint configuration.

> **Note — what the interviewer is expecting:**
> Understand authentication versus authorization and explain where authorization rules belong.
</details>

<details>
<summary>Where would you use Hazelcast caching?</summary>

### Answer
Use a distributed cache for data that is expensive to compute/read and can tolerate the cache's consistency model. Discuss TTL, eviction, serialization, cluster topology, cache stampede protection, invalidation, and what happens when a node leaves the cluster.

> **Note — what the interviewer is expecting:**
> Start with the consistency and failure model, not simply “cache makes it faster.”
</details>

<details>
<summary>How do database indexes work and when can an index hurt performance?</summary>

### Answer
Indexes reduce lookup work for suitable predicates/orderings but consume storage and add write/update maintenance. Explain selectivity, composite-index column order, covering indexes, query plans, and why indexing every column is not a good strategy.

> **Note — what the interviewer is expecting:**
> Connect indexes to actual query patterns and execution plans.
</details>

<details>
<summary>Normalization vs denormalization?</summary>

### Answer
Normalization reduces duplication and update anomalies. Denormalization can improve read performance or simplify access patterns at the cost of duplicated data and more complex consistency. Choose based on workload and consistency requirements.

> **Note — what the interviewer is expecting:**
> Explain the trade-off instead of treating either approach as universally correct.
</details>

<details>
<summary>SQL vs NoSQL — how do you decide?</summary>

### Answer
Compare transaction requirements, relationships, query flexibility, consistency, scaling model, data shape, operational maturity, and access patterns. Choose the database from business and workload requirements rather than popularity.

> **Note — what the interviewer is expecting:**
> Requirements-driven database selection.
</details>

<details>
<summary>S3/object storage vs Firestore for files?</summary>

### Answer
Object storage such as S3 is designed for blobs/files with metadata and durable storage semantics. Firestore is a document database, not a general-purpose object store; when using Firebase, Cloud Storage for Firebase is the file-storage service. Keep metadata/references in a database and binary objects in object storage when that model fits.

> **Note — what the interviewer is expecting:**
> Correctly separate document data from binary object storage and discuss access control, lifecycle, cost, and consistency.
</details>

<details>
<summary>Threads vs requests — how do you reason about concurrency?</summary>

### Answer
A request is an application-level unit of work; a thread is an execution resource. Explain thread pools, blocking I/O, CPU-bound work, asynchronous processing, back-pressure, and the effect of concurrency on downstream databases and services.

> **Note — what the interviewer is expecting:**
> Avoid equating “one request = one permanently dedicated thread” with a universal architecture rule.
</details>

<details>
<summary>How do you make an API idempotent?</summary>

### Answer
For operations that may be retried, use an idempotency key or deterministic business key, persist the operation/result state, and make repeated requests return the same business outcome without duplicating side effects.

> **Note — what the interviewer is expecting:**
> Explain where the idempotency state lives and how it behaves across service restarts and retries.
</details>

<details>
<summary>How do you design rate limiting and protect against DoS?</summary>

### Answer
Use layered controls: CDN/WAF or edge controls, gateway limits, per-client/user/API-key quotas, concurrency limits, timeouts, payload limits, connection controls, and monitoring. Distributed rate limiting may require a shared store or gateway infrastructure.

> **Note — what the interviewer is expecting:**
> Treat DoS protection as a layered availability problem, not only a counter in application memory.
</details>

<details>
<summary>Explain Eureka server and Eureka client.</summary>

### Answer
The registry maintains service-instance information; clients register and discover instances. Discuss heartbeats, lease expiry, caching of registry information, failure behavior, and whether the deployment platform already provides service discovery.

> **Note — what the interviewer is expecting:**
> Understand discovery under failure and avoid assuming the registry itself removes every networking problem.
</details>

<details>
<summary>Maven vs Gradle and where Flyway fits?</summary>

### Answer
Maven/Gradle manage builds, dependencies, plugins, tests, and packaging. Flyway is a database schema migration tool and belongs to database lifecycle management rather than Java compilation itself.

> **Note — what the interviewer is expecting:**
> Separate application build lifecycle from database schema lifecycle.
</details>

<details>
<summary>How do you release a new version of a microservice without breaking consumers?</summary>

### Answer
Prefer backward-compatible API/event changes, explicit versioning where needed, consumer contract tests, additive schema changes, feature flags, rolling/canary deployment, observability, and a rollback plan. For events, retain compatibility with existing consumers during migration.

> **Note — what the interviewer is expecting:**
> Demonstrate compatibility strategy and operational rollout thinking.
</details>

<details>
<summary>What are SQL data pages and why should a backend engineer care?</summary>

### Answer
Relational databases generally store table/index data in fixed-size or engine-defined pages/blocks. Query performance is affected by how many pages must be read, cached, or written. Explain buffer pools, sequential versus random access, and how indexes reduce page reads.

> **Note — what the interviewer is expecting:**
> Understand the storage-engine reason behind query performance, not only SQL syntax.
</details>

<details>
<summary>Postman vs Swagger/OpenAPI?</summary>

### Answer
OpenAPI describes an API contract and can drive documentation, client generation, and validation. Postman is a testing/workflow client for sending requests, collections, environments, and automated checks. They complement each other.

> **Note — what the interviewer is expecting:**
> Distinguish API contract/documentation from an API client/testing workflow.
</details>

<details>
<summary>What do SonarQube, linting, coverage, and unit tests each tell you?</summary>

### Answer
Linting catches style/static patterns, SonarQube performs broader static analysis and quality/security checks, coverage measures which code paths tests execute, and unit tests validate behavior at a small isolation boundary. None alone proves production correctness.

> **Note — what the interviewer is expecting:**
> Understand the limits of each quality signal.
</details>

<details>
<summary>Optimistic vs pessimistic locking?</summary>

### Answer
Optimistic locking detects conflicting updates, commonly with a version column, and is useful when conflicts are relatively rare. Pessimistic locking acquires database locks to prevent conflicting work while the transaction is active. Discuss contention, deadlocks, transaction duration, and throughput.

> **Note — what the interviewer is expecting:**
> Select the strategy from contention and consistency requirements.
</details>

<details>
<summary>How do you diagnose a deadlock?</summary>

### Answer
Use database deadlock reports/diagnostics, identify the lock graph and transaction order, keep transactions short, access shared resources in a consistent order, and retry safely when appropriate. Application-level thread deadlocks require thread dumps and lock analysis.

> **Note — what the interviewer is expecting:**
> Distinguish database deadlocks from JVM thread deadlocks.
</details>

<details>
<summary>How do entity joins and fetch strategies affect Hibernate performance?</summary>

### Answer
Explain entity relationships, join fetching, lazy/eager loading, the N+1 query problem, pagination limitations with collection joins, and the importance of measuring generated SQL.

> **Note — what the interviewer is expecting:**
> Be able to reason from object mappings to actual SQL and database load.
</details>

<details>
<summary>Config Server vs Vault?</summary>

### Answer
A configuration server centralizes non-secret application configuration. Vault is designed for secrets management, access control, leasing/rotation, and secure secret retrieval. Do not treat a general config store as a secret manager.

> **Note — what the interviewer is expecting:**
> Separate configuration management from secret management.
</details>

<details>
<summary>What does a circuit breaker protect?</summary>

### Answer
It stops repeatedly calling a failing dependency after configured failure conditions, allowing the system to fail fast and recover. Discuss closed/open/half-open states, timeouts, retries, fallbacks, and why retries plus circuit breakers must be tuned together.

> **Note — what the interviewer is expecting:**
> Understand cascading failure and dependency protection.
</details>

<details>
<summary>What is distributed tracing and where does Sleuth fit?</summary>

### Answer
Distributed tracing propagates trace/span context across service boundaries so one logical request can be followed through multiple components. Explain correlation IDs, trace IDs, spans, sampling, and the observability platform receiving trace data. For modern Spring stacks, verify the tracing library/version used by the project because the ecosystem has evolved beyond older Sleuth-based setups.

> **Note — what the interviewer is expecting:**
> Know the concept independently of a particular library/version.
</details>

<details>
<summary>What metrics would you expose for a production microservice?</summary>

### Answer
Start with request rate, latency, errors, saturation, dependency latency/errors, JVM/GC, thread pools, database pools, cache hit rate, Kafka consumer lag, and business-critical counters. Define alerts around symptoms and service-level objectives rather than every metric.

> **Note — what the interviewer is expecting:**
> Connect metrics to reliability and diagnosis.
</details>

<details>
<summary>How do you scale a microservice up or down?</summary>

### Answer
Horizontal scaling adds instances and is usually preferred for stateless services. Vertical scaling increases resources per instance. Discuss autoscaling signals, startup time, connection pools, downstream capacity, partitioning, sticky sessions, graceful shutdown, and safe scale-in.

> **Note — what the interviewer is expecting:**
> Scaling one service must not simply move the bottleneck to the database, cache, broker, or another dependency.
</details>

<details>
<summary>What do you do beyond assigned Jira tickets?</summary>

### Answer
Senior-engineer impact can include PR reviews, design reviews, performance investigations, incident response, security/vulnerability remediation, refactoring, documentation, test strategy, developer tooling, mentoring, operational improvements, and identifying recurring sources of engineering toil.

> **Note — what the interviewer is expecting:**
> Evidence of ownership and engineering leverage, not a claim that you “do everything.”
</details>

## Production-readiness checklist

- [ ] Authentication and authorization are explicit.
- [ ] API contracts and backward compatibility are documented.
- [ ] Idempotency exists for retryable side effects.
- [ ] Timeouts exist for every remote dependency.
- [ ] Retries are bounded and coordinated with circuit breakers.
- [ ] Rate limiting and payload/concurrency protection exist.
- [ ] Database indexes are justified by query plans.
- [ ] Transactions and locking strategy are explicit.
- [ ] Kafka delivery/transaction semantics are documented.
- [ ] Cache invalidation and stale-data behavior are understood.
- [ ] Secrets are kept out of source control.
- [ ] Vulnerability scanning and dependency upgrades are part of CI/CD.
- [ ] Unit, integration, contract, and API tests cover appropriate boundaries.
- [ ] Logs, metrics, traces, health checks, and alerts exist.
- [ ] Deployment supports rollback and compatibility.

## Cross references

<a href="/content/tree/interview-prep/microservices/messaging/kafka/kafka-transactions" target="_blank" rel="noopener noreferrer">Open Kafka transaction interview topic ↗</a>

<a href="/content/tree/databases/sql/indexes" target="_blank" rel="noopener noreferrer">Open database indexes ↗</a>

<a href="/content/tree/backend/spring-security/preauthorize" target="_blank" rel="noopener noreferrer">Open @PreAuthorize in Spring Security ↗</a>

<a href="https://spring.io/microservices" target="_blank" rel="noopener noreferrer">Spring Microservices documentation ↗</a>
