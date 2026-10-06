# JVM Runtime Memory

The JVM specification defines runtime areas rather than one undifferentiated heap. Each thread has a JVM stack and program counter; objects are typically allocated in the shared heap. HotSpot commonly stores class metadata in Metaspace and compiled code in a code cache.

`OutOfMemoryError` can come from heap, Metaspace, direct buffers, or native thread resources. Increasing `-Xmx` is not a universal fix and can exceed a container's memory limit when native allocations are ignored.

**Diagnosis:** correlate heap usage and allocation rate with GC pauses, inspect heap dumps for retaining paths, and measure native memory and thread counts separately.

**Interview points:** distinguish stack and heap, explain reachability from GC roots, and outline evidence-driven diagnosis of memory pressure.

**Related:** [Garbage Collection](/content/tree/languages/java/core/jvm/garbage-collection), [Heap Dumps](/content/tree/languages/java/advanced/performance/heap-dumps).
