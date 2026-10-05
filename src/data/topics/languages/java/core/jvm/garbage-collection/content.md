# Garbage Collection

Garbage collection reclaims objects that are no longer reachable from GC roots. Collectors trade throughput, pause time, and memory footprint; choose against latency objectives, heap size, allocation patterns, and the deployed JVM version.

A rising live set may signal retention or a leak; high allocation with a stable live set can cause frequent collection without a leak. Combine GC logs and metrics with allocation profiling and heap analysis before changing flags.

**Pitfalls:** tuning from one pause, treating `System.gc()` as a fix, or increasing heap without checking container memory. Collector behavior is version- and workload-dependent.

**Interview points:** explain reachability, pause-versus-throughput goals, and what evidence supports a collector or heap change.

**Related:** [JVM Memory](/content/tree/languages/java/core/jvm/jvm-memory), [Profiling](/content/tree/languages/java/advanced/performance/profiling).
