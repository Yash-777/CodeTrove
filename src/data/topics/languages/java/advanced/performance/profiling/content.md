# Java Profiling

Profiling measures where an application spends CPU, allocates memory, blocks, or contends for locks. It turns a performance hypothesis into evidence; it does not replace representative load tests or production telemetry.

Start with low-overhead sampling to find hot methods and allocation sources. Use tracing or instrumentation when call-level detail is needed, and compare profiles before and after a change under the same workload. Check profiler overhead and JVM/JIT warm-up.

**Pitfalls:** optimizing a synthetic microbenchmark, treating correlation as causation, or focusing on a hot method that is not material to end-to-end latency.

**Interview points:** explain how you would identify CPU versus I/O versus allocation bottlenecks, validate a fix, and protect p95/p99 latency while measuring throughput.

**Related:** [Heap Dumps](/content/tree/languages/java/advanced/performance/heap-dumps), [Thread Dumps](/content/tree/languages/java/advanced/performance/thread-dumps), [JVM Tuning](/content/tree/languages/java/core/jvm/jvm-tuning).
