# Microservice Architecture — Senior Java Interview Deep Dive

This guide is the **interview-first companion** to the end-to-end project flow. Use it to explain a production Java/Spring system from the first HTTP request through discovery, messaging, transactions, resilience, configuration, and observability.

## Architecture screen

```text
 Web / Mobile Client
        |
     HTTPS
        v
 +-------------------+
 | API Gateway        |  auth / routing / rate limit / idempotency
 +-------------------+
        |
   Load Balancer
        |
 +------+-------------------+
 | Service Registry / Eureka |
 +------+-------------------+
        |
  +-----+------+---------+----------------+
  |            |         |                |
Order       Payment     User         Notification
Service     Service     Service        Service
  |            |         |
  +------------+---------+
               |
       +-------+--------+
       |                |
   SQL / Cache       Kafka Broker
       |                |
       +--------+-------+
                |
       Observability
  Logs / Metrics / Traces
```

## How to answer architecture questions

<details>
<summary>Walk me through your project's request flow from the client to the database and back?</summary>

### Answer
Start at the edge: HTTPS reaches the load-balancer or gateway, the gateway applies edge policies and routes the request, discovery resolves the service instance, Spring Security authenticates and authorizes, `DispatcherServlet` selects the controller, validation and business logic execute, Spring Data/JPA performs persistence, and the response travels back through the same boundaries. Mention cache, Kafka, timeouts, circuit breakers, and observability only where they actually participate in that request.

> **Note — what the interviewer is expecting:**
> A senior engineer should explain the **runtime flow and ownership of each responsibility**, not list technologies from a resume.

</details>

<details>
<summary>Where would you draw the boundaries between API Gateway, service, database, Kafka, and cache?</summary>

### Answer
Keep edge concerns at the gateway, business invariants in the owning service, durable transactional state in the service's database, asynchronous integration events in Kafka, and derived/read-optimized data in cache. Avoid sharing databases or putting business workflows into the gateway merely because it is convenient.

> **Note — what the interviewer is expecting:**
> Explain ownership, coupling, consistency, failure isolation, and why the boundary exists.

</details>

## Deep-dive topics

- [API Gateway & Idempotency](../api-gateway-idempotency/content.md)
- [Eureka Service Discovery](../eureka-service-discovery/mechanics-client-lifecycle/content.md)
- [Zipkin & Sleuth](../zipkin-sleuth/content.md)
- [Kafka](../kafka/topic-partition-broker/content.md)
- [Saga — Choreography](../saga-pattern/choreography/content.md)
- [Saga — Orchestration](../saga-pattern/orchestration/content.md)
- [Config Server vs Vault](../config-server-vault/content.md)
- [Circuit Breaker & Fallback](../circuit-breaker-fallback/content.md)

## Official references

- [Spring Microservices](https://spring.io/microservices) — official Spring architecture starting point.
- [Spring Cloud](https://spring.io/projects/spring-cloud) — distributed-system building blocks.
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/) — broker, producer, consumer and transaction concepts.
- [Spring Cloud Netflix](https://spring.io/projects/spring-cloud-netflix) — Eureka integration documentation.
