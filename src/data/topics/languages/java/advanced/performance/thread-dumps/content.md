# Java Thread Dumps

A thread dump records thread states, stack traces, and monitor information at capture time. It can reveal deadlocks, blocked pools, lock contention, stuck requests, and executor saturation.

Take several dumps a short interval apart during the symptom. A single `RUNNABLE` stack is not proof of CPU saturation, and a `WAITING` thread is not automatically unhealthy. Correlate thread states and stacks with CPU, request latency, queue depth, and pool metrics.

**Pitfalls:** capturing after the incident, overlooking repeated identical stacks, or sharing dumps that expose request data. Use the JVM-supported capture tools and follow production access controls.

**Interview points:** describe how to distinguish deadlock from pool starvation and how repeated thread dumps plus metrics narrow the cause.

**Related:** [Threads](/content/tree/languages/java/core/concurrency/threads), [Executors](/content/tree/languages/java/core/concurrency/executors), [Profiling](/content/tree/languages/java/advanced/performance/profiling).
