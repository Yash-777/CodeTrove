# Threads, Executors, and CompletableFuture — Interview Q&A

<details><summary>What is the difference between `run()` and `start()`?</summary>

### Answer
Calling `run()` is an ordinary method call on the current thread. Calling `start()` asks the JVM to create/schedule a new thread that eventually invokes `run()`. A thread object may be started only once; starting it again throws `IllegalThreadStateException`.

### Example
```java
Thread task = new Thread(() -> System.out.println(Thread.currentThread().getName()));
task.run();   // current thread
Thread next = new Thread(task);
next.start(); // another thread
```

### Interviewer perspective
Mention that task code should generally be represented by `Runnable` or `Callable` and executed by an `ExecutorService`, not by creating an unbounded thread per request.
</details>

<details><summary>Why prefer Runnable or Callable over extending Thread?</summary>

### Answer
Java classes can extend only one class. Implementing `Runnable` keeps the task separate from the thread mechanism and leaves the class free to extend another class. `Callable<V>` is useful when a task returns a result or throws an exception.

### Example
```java
class ExportTask extends ReportJob implements Runnable {
    public void run() { export(); }
}
```

### Interviewer perspective
The best design separates work from execution policy. That makes testing easier and allows the same task to run in a pool, scheduler, virtual-thread executor, or direct test call.
</details>

<details><summary>What are the important Thread states?</summary>

### Answer
The Java API exposes `NEW`, `RUNNABLE`, `BLOCKED`, `WAITING`, `TIMED_WAITING`, and `TERMINATED`. “Running” is not a separate `Thread.State`; a runnable thread may be executing or waiting for CPU time. `BLOCKED` means waiting to enter a monitor; `WAITING` means waiting indefinitely for another action.

### Example
```java
Thread thread = new Thread(() -> {});
System.out.println(thread.getState()); // NEW
thread.start();
```

### Interviewer perspective
Use a thread dump to distinguish blocked monitors, timed waits, deadlocks, and CPU-bound runnable threads. State transitions are observations, not a scheduling guarantee.
</details>

<details><summary>What is a deadlock and how do you prevent it?</summary>

### Answer
A deadlock occurs when threads hold resources while waiting for one another in a cycle. The most common prevention is a global lock order: every path acquires `firstLock` before `secondLock`. Other techniques include reducing nested locks, using timed `tryLock`, immutable messages, and higher-level concurrency utilities.

### Example
```java
synchronized (firstLock) {
    synchronized (secondLock) {
        updateBothResources();
    }
}
```

### Interviewer perspective
A `sleep` does not release a monitor, so sleeping while holding a lock can make contention and deadlocks worse. Mention `jstack`, JConsole, VisualVM, or JVM deadlock detection during diagnosis.
</details>

<details><summary>How do wait, notify, notifyAll, and interrupt work?</summary>

### Answer
`wait`, `notify`, and `notifyAll` operate on an object's monitor and must be called while owning that monitor. `wait` releases the monitor and waits; after notification, the thread must reacquire the monitor. Always wait in a loop that checks a condition. `interrupt` is a cooperative cancellation signal and may cause `InterruptedException` in interruptible methods.

### Example
```java
synchronized (lock) {
    while (!ready) lock.wait();
}

synchronized (lock) {
    ready = true;
    lock.notifyAll();
}
```

### Interviewer perspective
Calling `notify` outside a synchronized block throws `IllegalMonitorStateException`. When catching `InterruptedException`, restore the interrupt flag or propagate the exception rather than silently swallowing cancellation.
</details>

<details><summary>Why use ExecutorService?</summary>

### Answer
`ExecutorService` manages worker threads, task queues, shutdown, and result tracking. It bounds concurrency and avoids creating a new thread for every unit of work.

### Example
```java
try (ExecutorService pool = Executors.newFixedThreadPool(4)) {
    Future<Integer> result = pool.submit(() -> calculate());
    System.out.println(result.get());
}
```

### Interviewer perspective
Choose the pool size from workload and capacity, not a universal number. Set queue and rejection policies where needed, propagate context intentionally, and shut down executors so applications can terminate.
</details>

<details><summary>How does CompletableFuture differ from Future?</summary>

### Answer
`Future` represents a result that can be queried, but composition is awkward. `CompletableFuture` supports non-blocking composition, transformation, combination, exception handling, and explicit completion.

### Example
```java
CompletableFuture<String> answer = fetchUser()
    .thenCompose(user -> fetchOrders(user.id()))
    .thenApply(List::size)
    .exceptionally(error -> 0);
```

### Interviewer perspective
Distinguish `thenApply` from `thenCompose`: the latter flattens a nested future. Discuss the executor used, timeouts, cancellation, exception propagation, and the danger of blocking the common pool.
</details>

<details><summary>What does `volatile` guarantee and what does it not guarantee?</summary>

### Answer
A volatile write is visible to subsequent reads of that variable across threads and establishes ordering guarantees around that variable. It does not make compound operations such as `count++` atomic. Use atomic classes or locks for read-modify-write invariants.

### Example
```java
private volatile boolean running = true;
while (running) { poll(); }
```

### Interviewer perspective
Ask whether multiple fields must change consistently. If yes, a volatile flag alone is insufficient; use a lock, an atomic state object, or an appropriate concurrent abstraction.
</details>

## References

- [Thread.State API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.State.html)
- [ExecutorService API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html)
- [CompletableFuture API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html)
