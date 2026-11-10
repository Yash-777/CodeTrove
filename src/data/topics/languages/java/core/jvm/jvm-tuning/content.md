# JVM Tuning

JVM tuning is a measured change to improve a defined objective such as throughput, tail latency, startup time, or memory usage. There is no universally optimal set of flags; workload, JDK version, collector, container limits, and hardware all matter.

## Establish a baseline

Record the exact Java version and vendor, selected garbage collector, CPU and memory limits, heap settings, thread count, workload shape, warm-up period, request rate, error rate, and latency percentiles. Capture GC pauses, allocation rate, live-set size, process RSS, and CPU saturation during the same test.

A representative baseline matters more than a single local benchmark. Warm up JIT compilation and repeat the test enough times to separate normal variation from a real change.

## Memory sizing

`-Xms` controls the initial heap size and `-Xmx` controls the maximum heap size. These settings describe the Java heap, not the complete process footprint. Leave headroom for Metaspace, direct buffers, thread stacks, JIT code, native libraries, and the JVM itself.

In containers, compare total process memory with the container limit. A larger heap can reduce collection frequency while increasing pause work or causing the process to be killed by the operating system.

## A hypothesis-driven loop

1. Define the symptom and success threshold.
2. Identify evidence that connects the symptom to allocation, GC, threads, CPU, or class loading.
3. Change one supported setting or code path.
4. Re-run the same workload and compare percentiles, not only averages.
5. Keep the change only when the objective improves without violating memory, CPU, or reliability limits.

Prefer current JVM defaults unless measurements show a problem. Collector behavior and ergonomics change across JDK releases, so copy-pasting flags from an older deployment can disable useful defaults or produce warnings.

## Useful diagnostics

Use GC logs for pause and allocation behavior, thread dumps for blocked or contended threads, heap dumps for retained-object paths, and native-memory or process metrics for off-heap pressure. Class-loading logs help diagnose generated classes, duplicate dependencies, and loader leaks. Treat `OutOfMemoryError` messages as classifications, not as a complete diagnosis.

Avoid tuning around a code defect. An unbounded cache, accidental synchronization, blocking I/O on a shared pool, or excessive object creation can overwhelm any flag configuration.

**Related:** [JVM Memory](/content/tree/languages/java/core/jvm/jvm-memory), [Garbage Collection](/content/tree/languages/java/core/jvm/garbage-collection), [Performance Tuning](/content/tree/languages/java/advanced/performance/performance-tuning).
