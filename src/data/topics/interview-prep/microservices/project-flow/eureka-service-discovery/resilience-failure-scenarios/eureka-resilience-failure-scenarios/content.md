# Eureka — Resilience & Failure Scenarios

The interview discussion should move from discovery mechanics to what happens when discovery, networking, or a target service fails.

<details>
<summary>What if Eureka itself becomes unavailable?</summary>

### Answer
A robust client should not immediately make every existing call fail merely because the registry is unavailable. Existing discovery information can remain available locally for a period, while new topology changes may become stale. Calls still need bounded timeouts, retries with backoff, circuit breakers, and observability. The exact behavior depends on the Eureka client and Spring Cloud version used by the project.

> **Note — what the interviewer is expecting:**
> Explain graceful degradation, stale data, failure detection, and the difference between control-plane failure and data-plane traffic.

</details>

<details>
<summary>What if Eureka says an instance is healthy but the instance cannot serve requests?</summary>

### Answer
Discovery metadata is not a substitute for end-to-end health. Use meaningful health checks, service-level readiness, connection timeouts, circuit breakers, and application metrics. A request should fail fast when the selected instance cannot respond rather than waiting indefinitely.

> **Note — what the interviewer is expecting:**
> Demonstrate layered health and failure protection rather than trusting one registry flag.

</details>
