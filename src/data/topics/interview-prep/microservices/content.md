Microservices – Scenario-Based Architecture Questions

<details>
<summary>1. An Order Service calls Payment Service. Payment Service is down. How do you handle this?</summary>

Configure connection and response timeouts, Circuit Breaker, bounded retries with exponential backoff, and fallback behavior.

For payment processing, never assume a timeout means payment failure. Check transaction status or reconcile using a payment identifier before retrying.

</details>

<details>
<summary>2. How do you process 10,000 records received from another microservice?</summary>

Use pagination or chunk-based processing, validate records, process them in manageable batches, and use batch database operations.

For asynchronous processing, Kafka or another message broker can distribute the workload.

</details>

<details>
<summary>3. How do you handle partial failure while processing 10,000 records?</summary>

Use chunk-level transactions, track successful and failed records, maintain processing status, and retry only failed records when safe.

</details>

<details>
<summary>4. How do you scale a microservice when request volume increases?</summary>

Use horizontal scaling by adding more application instances, load balancing, stateless application design, database optimization, caching, and asynchronous processing.

</details>

<details>
<summary>5. How do you prevent duplicate event processing in Kafka?</summary>

Use event IDs, idempotent consumers, unique database constraints, and transactional processing of business changes and processed-event records.

</details>

<details>
<summary>6. How do you handle communication when a service is temporarily unavailable?</summary>

For synchronous communication, use timeouts and Circuit Breaker. For asynchronous communication, use message retention, retries, dead-letter topics, and idempotent consumers.

</details>

<details> <summary>7. How do you maintain consistency when multiple microservices update data?</summary>

Use Saga orchestration or choreography with compensating transactions. Use the Outbox pattern for reliable event publishing and design for eventual consistency.

</details>

<details> <summary>8. How do you monitor microservices in production?</summary>

Use centralized logs, application metrics, distributed tracing, health checks, dashboards, and alerts.

Examples: Grafana, Prometheus, OpenTelemetry, and ELK.

</details>