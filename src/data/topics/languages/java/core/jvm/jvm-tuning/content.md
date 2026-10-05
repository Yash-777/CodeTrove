# JVM Tuning

Tune against a measured objective such as request latency, throughput, startup time, or memory ceiling. Establish a representative baseline, change one variable at a time, and keep a rollback path.

Inspect runtime version, container-aware sizing, heap and native memory, GC behavior, allocation rate, thread count, and CPU saturation. Leave room for Metaspace, direct buffers, thread stacks, JIT code, and other native allocations within the container limit.

**Pitfalls:** copying flags from unrelated workloads, optimizing average latency while tail latency regresses, and benchmarking without realistic warm-up or load shape. Prefer supported defaults unless measurements identify a specific issue.

**Interview points:** describe a hypothesis-driven tuning loop and tie changes to an SLO and observable evidence.

**Related:** [Garbage Collection](/content/tree/languages/java/core/jvm/garbage-collection), [Performance Tuning](/content/tree/languages/java/advanced/performance/performance-tuning).
