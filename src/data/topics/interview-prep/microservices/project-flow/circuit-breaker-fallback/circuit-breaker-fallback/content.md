# Circuit Breaker & Fallback

Circuit breakers protect a service from repeatedly calling an unhealthy dependency and help prevent cascading failures.

## State screen

```text
             failures / threshold
 CLOSED ----------------------------> OPEN
   ^                                   |
   |                                   | fail fast
   | success                           v
   +----------------------------- HALF-OPEN
                                      |
                               trial request(s)
                                      |
                           success ---+--- failure
                             CLOSED        OPEN
```

<details>
<summary>What problem does a circuit breaker solve?</summary>

### Answer
When a dependency is failing or timing out, continuing to send requests can consume threads, connections, queues, and CPU in the caller and amplify the outage. A circuit breaker opens after configured failure conditions, fails fast, and later permits controlled probes to determine whether the dependency recovered.

> **Note — what the interviewer is expecting:**
> Explain cascading failure, state transitions, timeouts, retries, and recovery rather than saying only “it improves availability.”

</details>

<details>
<summary>Is a fallback always the correct response when the circuit opens?</summary>

### Answer
No. A fallback must be semantically safe. Returning stale cached data may be valid for a read, while silently accepting a payment or order operation may be dangerous. Sometimes the correct fallback is a clear error, queued asynchronous work, or a degraded read-only response.

> **Note — what the interviewer is expecting:**
> Fallback is a business decision, not a generic “return default value” technique.

</details>

<details>
<summary>How do retries interact with circuit breakers?</summary>

### Answer
Unbounded or aggressive retries can make an outage worse. Use bounded retries with backoff and jitter, appropriate timeouts, and a circuit breaker tuned to the same failure model. Idempotency is required before retrying side effects safely.

> **Note — what the interviewer is expecting:**
> Discuss the complete resilience policy rather than configuring each mechanism independently.

</details>

<a href="/content/tree/distributed-systems/resilience/circuit-breaker" target="_blank" rel="noopener noreferrer">Open CodeTrove Circuit Breaker ↗</a>
