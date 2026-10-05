# Bulkheads

Bulkheads isolate resource pools so one slow dependency or workload cannot consume capacity needed by unrelated work. Isolation can use separate bounded thread pools, connection pools, semaphores, queues, or deployment resources.

For example, payment calls and report generation should not share an unbounded executor if reports can block for a long time. Size each pool against downstream capacity and define explicit rejection or fallback behavior; isolation without limits only moves overload elsewhere.

**Trade-offs:** bulkheads improve failure containment but consume additional resources and require capacity planning. Too many small pools can reduce utilization and complicate operations.

**Pitfalls:** unbounded queues, silently dropping critical work, and fallbacks that overload another dependency.

**Interview points:** identify shared bottlenecks, select an isolation mechanism, and explain how saturation and rejected work are measured.

**Related:** [Timeouts and Retries](/content/tree/api-integration/resilience/timeouts-retries), [Rate Limiting](/content/tree/api-integration/resilience/rate-limiting), [Circuit Breaker](/content/tree/distributed-systems/resilience/circuit-breaker).
