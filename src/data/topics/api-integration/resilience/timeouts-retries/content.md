# Timeouts and Retries

A timeout bounds how long a caller waits for a downstream operation. Set connection and response deadlines within an end-to-end request deadline so work cannot consume capacity indefinitely.

Retry only plausibly transient failures, with a bounded attempt count, exponential backoff, and jitter. Respect the remaining deadline and avoid retries at every layer, which multiply traffic during outages. A retry is safe only when the operation is idempotent or protected by an idempotency mechanism.

**Pitfalls:** no timeout, synchronized retry bursts, retrying validation failures, and retrying after a write may have committed but its response was lost.

**Interview points:** explain deadline propagation, retry budgets, backoff, and the relationship between retries, idempotency, circuit breakers, and load shedding.

**Related:** [Idempotency](/content/tree/api-integration/resilience/idempotency), [Rate Limiting](/content/tree/api-integration/resilience/rate-limiting), [Circuit Breaker](/content/tree/distributed-systems/resilience/circuit-breaker).
