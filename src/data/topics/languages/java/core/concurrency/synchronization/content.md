# Java Synchronization and Visibility

Synchronization coordinates shared state. A monitor lock provides mutual exclusion and a happens-before relationship: writes before releasing a lock become visible to a thread that later acquires the same lock.

```java
final class Counter {
	private long value;
	synchronized long incrementAndGet() { return ++value; }
}
```

`volatile` provides visibility and ordering for reads and writes to a variable, but does not make compound operations such as `count++` atomic. Prefer immutability, thread confinement, or higher-level concurrency utilities when they clarify ownership.

**Pitfalls:** races, lock-order deadlocks, holding locks during I/O, and locking on publicly accessible objects. Keep critical sections small and lock ordering consistent.

**Interview points:** distinguish atomicity from visibility, explain happens-before, and why a thread-safe collection does not make a sequence of operations atomic.

**Related:** [Locks](/content/tree/languages/java/core/concurrency/locks), [Collections](/content/tree/languages/java/core/language-basics/collections).
