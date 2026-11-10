# Garbage Collection

Garbage collection reclaims heap objects that are no longer reachable from live references. The JVM identifies roots such as active thread frames, static references, and runtime structures, then traces the object graph from those roots.

## Allocation and reclamation

```java
void process() {
    byte[] buffer = new byte[1024];
    use(buffer);
} // after the call returns, buffer may become unreachable
```

Becoming unreachable does not trigger immediate collection, and collection does not guarantee an immediate return of memory to the operating system. The collector decides when and how to reclaim space according to its algorithm and current pressure.

Generational collectors commonly separate short-lived allocations from longer-lived objects. Survivors may be copied or promoted after several collections. Region-based collectors use different terminology and policies, so interpret metrics in the context of the selected collector.

## Collector trade-offs

Collectors balance throughput, pause time, CPU overhead, heap footprint, and predictability. A collector that is effective for a large service heap may be a poor choice for a small command-line process or a latency-sensitive application.

A minor collection is not automatically harmless, and a full collection is not automatically the cause of every latency spike. Measure pause duration, concurrent work, allocation rate, promotion behavior, and application response time together.

## Leak versus high allocation

A memory leak in Java usually means objects remain strongly reachable even though the application no longer needs them. A stable live set with frequent collections can instead indicate high allocation churn. Common retention causes include unbounded caches, listener registrations, static collections, thread-local values, and class loaders retained by long-lived threads.

Use a heap dump to inspect retaining paths and compare snapshots after a full collection where appropriate. Use allocation profiling and GC logs to distinguish retained objects from short-lived churn.

## Production guidance

Start with the JDK version, selected collector, heap limits, container limit, and service objective. Enable supported GC logging and monitor pause time, allocation rate, live-set size, promotion, and process memory. Change one setting at a time and keep a rollback plan.

Avoid treating `System.gc()` as a production tuning strategy. It is only a request and may introduce an unexpected pause. Also avoid increasing the heap without accounting for Metaspace, direct buffers, thread stacks, JIT code, and other native allocations.

**Related:** [JVM Memory](/content/tree/languages/java/core/jvm/jvm-memory), [JVM Tuning](/content/tree/languages/java/core/jvm/jvm-tuning), [Profiling](/content/tree/languages/java/advanced/performance/profiling).
