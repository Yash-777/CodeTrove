# Java Threads

A thread is an independently scheduled execution path that shares the process heap with other threads. Threads can overlap work, but shared mutable state requires coordination and blocking consumes resources.

Prefer submitting tasks to a managed `ExecutorService` rather than creating unbounded threads. Handle interruption cooperatively: if a method cannot propagate `InterruptedException`, restore the interrupt flag before returning.

Virtual threads (Java 21+) reduce the cost of large numbers of blocking tasks, but do not make CPU-bound work faster or remove database and remote-service capacity limits.

**Pitfalls:** unbounded thread creation, lost interrupts, data races, and blocking an event-loop thread.

**Interview points:** distinguish concurrency from parallelism; discuss scheduling, visibility, thread safety, and why pools need bounded queues and explicit shutdown.

**Related:** [Executors](/content/tree/languages/java/core/concurrency/executors), [Synchronization](/content/tree/languages/java/core/concurrency/synchronization), [Virtual Threads](/content/tree/languages/java/advanced/modern-java/virtual-threads).
