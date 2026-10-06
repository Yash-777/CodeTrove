# Explicit Locks

`java.util.concurrent.locks` offers timed and interruptible acquisition, optional fairness, and multiple conditions. `ReentrantLock` must be released in a `finally` block.

```java
lock.lock();
try {
	updateSharedState();
} finally {
	lock.unlock();
}
```

Use an explicit lock when timed acquisition, interruptibility, or multiple wait conditions materially help. For simple mutual exclusion, `synchronized` is less error-prone and releases automatically on exceptions. Fair locks can reduce starvation in some cases but may reduce throughput.

**Pitfalls:** forgotten unlocks, inconsistent lock order, and awaiting a condition without checking its predicate in a loop. Consider atomics, semaphores, or concurrent collections when their semantics fit better.

**Interview points:** compare monitors and `ReentrantLock`, explain `tryLock`, and discuss deadlock prevention with lock ordering or timeouts.

**Related:** [Synchronization](/content/tree/languages/java/core/concurrency/synchronization), [Executors](/content/tree/languages/java/core/concurrency/executors).
