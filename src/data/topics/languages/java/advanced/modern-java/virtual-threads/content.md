# Java Virtual Threads

Virtual threads are lightweight JVM-managed threads intended to make thread-per-task code practical for large numbers of mostly blocking tasks. They preserve familiar synchronous control flow while the runtime schedules them over a smaller set of platform threads.

They are most useful for blocking I/O workloads. They do not accelerate CPU-bound work, increase database connection capacity, or remove the need for admission control and deadlines.

**Production considerations:** test library compatibility and pinning behavior on the deployed JDK; measure throughput, memory, and tail latency. Avoid pooling virtual threads as if they were scarce platform threads; bound the scarce resource instead (for example, database permits).

**Interview points:** compare virtual and platform threads, explain the workload fit, and discuss backpressure and downstream limits.

**Related:** [Threads](/content/tree/languages/java/core/concurrency/threads), [Executors](/content/tree/languages/java/core/concurrency/executors), [Concurrency](/content/tree/languages/java/core/concurrency/synchronization).
