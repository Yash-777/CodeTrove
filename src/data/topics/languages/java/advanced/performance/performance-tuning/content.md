# Java Performance Tuning

Performance tuning improves a measured service objective: latency, throughput, resource cost, or capacity. Begin with a representative workload, define the target (including tail latency), and identify the dominant bottleneck before changing code or JVM flags.

Measure end-to-end behavior, then profile CPU, allocation, locks, I/O, and database calls. Change one factor at a time and compare under equivalent load. A faster local operation may worsen total latency by increasing contention or downstream work.

**Pitfalls:** premature optimization, unrepresentative benchmarks, ignoring p95/p99, and optimizing code whose contribution is negligible. Keep correctness tests and rollback options alongside performance checks.

**Interview points:** explain the measurement loop, how you separate CPU-bound from I/O-bound behavior, and how you verify that a gain persists at production scale.

**Related:** [Profiling](/content/tree/languages/java/advanced/performance/profiling), [JVM Tuning](/content/tree/languages/java/core/jvm/jvm-tuning), [Thread Dumps](/content/tree/languages/java/advanced/performance/thread-dumps).
