# Java Heap Dumps

A heap dump captures objects and references at a point in time. It helps identify unexpectedly retained objects, dominant object types, and paths from GC roots that keep memory alive.

Capture only when operationally safe: dumps can pause an application, consume substantial disk space, and contain credentials or personal data. Analyze dominator trees, retained size, and reference paths; shallow object size alone can mislead.

**Workflow:** record heap and GC metrics, capture the dump with the approved JVM tooling, analyze it offline, and compare against a healthy baseline. Secure and delete artifacts under the organization's data-handling policy.

**Pitfalls:** taking a dump after the relevant state has disappeared, storing sensitive dumps in shared locations, or increasing heap before identifying the retaining path.

**Interview points:** distinguish shallow from retained size and explain how a GC-root path demonstrates retention.

**Related:** [JVM Memory](/content/tree/languages/java/core/jvm/jvm-memory), [Profiling](/content/tree/languages/java/advanced/performance/profiling).
