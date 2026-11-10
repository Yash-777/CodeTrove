# JVM Runtime Memory

The JVM specification describes runtime data areas rather than one universal physical memory layout. Some areas are shared by all threads, while others are created and destroyed with an individual thread.

## Shared areas

The **heap** stores class instances and arrays. It is managed by the garbage collector and may be configured with a fixed or variable committed size. A collector may divide the heap into regions or generations, but application code should reason primarily about reachability and allocation behavior rather than a particular collector layout.

The **method area** stores per-class structures such as method and field metadata, runtime constant-pool information, and method code. In HotSpot, class metadata is commonly stored in native **Metaspace**. Metaspace replaced PermGen in Java 8 and grows from native memory subject to its configured limits.

JIT-compiled machine code is stored in an implementation-specific **code cache**. Direct byte buffers, native libraries, garbage-collector structures, and other runtime services also consume native memory outside the Java heap.

## Per-thread areas

Each Java thread has a **program counter** identifying the current bytecode position, except when the thread is executing native code. Its **JVM stack** contains frames for active method calls. A frame holds local variables, an operand stack, and data needed for method return and dynamic linking.

```java
static int multiply(int left, int right) {
    int result = left * right; // locals and operands belong to this call frame
    return result;
}
```

A deep or unbounded call chain can produce `StackOverflowError`. Creating too many threads can fail with native-memory pressure even when the Java heap has free space, because each thread needs native stack resources.

## Heap generations and modern collectors

Many collectors exploit the observation that most objects become unreachable soon after allocation. A generational collector may use an allocation area for new objects and promote survivors into longer-lived regions. Other collectors use region-based designs and concurrent phases. The names and behavior depend on the collector and JDK version.

Do not use an old generation diagram as a promise about every JVM. Confirm the selected collector and runtime version when interpreting logs or sizing regions.

## Diagnosing memory pressure

First classify the pressure:

- Heap exhaustion: inspect the live set, retaining paths, and allocation rate.
- Metaspace exhaustion: inspect class loading, generated classes, and class-loader lifetimes.
- Native or direct-memory pressure: inspect buffers, thread counts, code cache, and process RSS.
- Stack exhaustion: inspect recursion and per-thread stack sizing.

A heap dump explains retained Java objects, but it does not account for every native allocation. Combine heap data, GC logs, native-memory measurements, thread metrics, and the exact JVM version before changing limits.

**Related:** [Garbage Collection](/content/tree/languages/java/core/jvm/garbage-collection), [JVM Tuning](/content/tree/languages/java/core/jvm/jvm-tuning), [Heap Dumps](/content/tree/languages/java/advanced/performance/heap-dumps).
