# Executors and Thread Pools

Executors separate task submission from thread creation and lifecycle. A bounded pool limits concurrent work; an unbounded queue can turn overload into rising latency and memory pressure.

```java
ExecutorService pool = new ThreadPoolExecutor(
	8, 16, 30, TimeUnit.SECONDS,
	new ArrayBlockingQueue<>(500),
	new ThreadPoolExecutor.CallerRunsPolicy()
);
```

Size pools for workload and downstream capacity. CPU-bound tasks often start near available processors; blocking I/O can need more concurrency, constrained by databases and remote services. Define rejection behavior, metrics, context propagation, and graceful shutdown. Separate pools can isolate unrelated workloads.

**Trade-offs:** caller-runs supplies backpressure but may add latency to request threads. Larger pools help only until contention or downstream saturation dominates.

**Interview points:** explain queueing, saturation, rejection, sizing, and how to monitor queue depth and task wait time.

**Related:** [Threads](/content/tree/languages/java/core/concurrency/threads), [CompletableFuture](/content/tree/languages/java/core/concurrency/completable-future).
