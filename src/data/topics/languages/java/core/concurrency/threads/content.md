# Java Threads and Concurrency

A **thread** is an independent path of execution inside a Java program. A process owns resources such as memory and open files; its threads share that process memory while each thread has its own call stack and execution state.

Threads are useful when work can overlap, such as handling many web requests, reading files while another task performs computation, or keeping a user interface responsive. Concurrency means tasks make progress during the same period. Parallelism means tasks actually run at the same time on different CPU cores. A concurrent program still needs correct coordination when threads share mutable data.

> A thread is a lightweight unit of execution, not a replacement for a process. It shares heap objects with other threads in the same JVM, so shared state must be designed carefully.

## Start a thread: `start()` versus `run()`

`run()` is the task body. Calling it directly is an ordinary method call on the current thread. Calling `start()` asks the JVM to schedule a new thread, which later invokes `run()` on that new execution path.

```java
public class StartVsRun {
    public static void main(String[] args) throws InterruptedException {
        Thread worker = new Thread(() ->
            System.out.println("running on " + Thread.currentThread().getName())
        );

        worker.run();    // normal call: runs on main

        Thread second = new Thread(() ->
            System.out.println("running on " + Thread.currentThread().getName())
        );
        second.start();  // schedules a separate thread
        second.join();   // wait for it to finish
    }
}
```

A `Thread` object can be started only once. A second call to `start()` throws `IllegalThreadStateException`; a terminated thread cannot be returned to `NEW`.

```java
Thread thread = new Thread(() -> System.out.println("work"));
thread.start();
thread.join();
// thread.start(); // IllegalThreadStateException

// Create a new Thread object when the work must run again.
new Thread(() -> System.out.println("new execution")).start();
```

The JVM starts the new thread and the caller continue independently. The order of their output is not a reliable ordering contract.

## Creating a task: `Thread` or `Runnable`?

`Thread` implements `Runnable`, but the two types represent different responsibilities:

| Type | Responsibility | Typical use |
| --- | --- | --- |
| `Runnable` | A unit of work with `void run()` | The preferred way to describe a task |
| `Callable<T>` | A task that returns a value and may throw checked exceptions | Work submitted to an executor |
| `Thread` | An execution resource that can run a task | Direct control or special thread configuration |

Implementing `Runnable` is usually better than extending `Thread`. Java permits a class to extend only one class. If a task extends `Thread`, it cannot extend another application class. If it implements `Runnable`, it can extend another class and the same task can be submitted to different execution mechanisms.

```java
class ReportTask implements Runnable {
    @Override
    public void run() {
        System.out.println("building report on "
            + Thread.currentThread().getName());
    }
}

class ReportJob extends SomeApplicationBase implements Runnable {
    @Override
    public void run() {
        System.out.println("the job can still extend SomeApplicationBase");
    }
}

new Thread(new ReportTask(), "report-worker").start();
```

This is not valid Java because a class cannot extend two classes:

```java
// class MyTask extends Thread, SomeApplicationBase { } // does not compile
```

Extending `Thread` is still possible, but it couples the task to one execution object and is less flexible for applications that use executors.

## Naming, joining, and interruption

Names make thread dumps and logs understandable. `join()` waits for another thread to terminate. `interrupt()` is a cooperative cancellation signal; it does not forcibly kill the thread.

```java
Thread worker = new Thread(() -> {
    try {
        while (!Thread.currentThread().isInterrupted()) {
            doSmallUnitOfWork();
            Thread.sleep(100);
        }
    } catch (InterruptedException interrupted) {
        // Restore the flag so higher-level code can observe cancellation.
        Thread.currentThread().interrupt();
    }
}, "poller");

worker.start();
// Later:
worker.interrupt();
worker.join();
```

A blocking method such as `sleep`, `wait`, or `join` commonly responds to interruption by throwing `InterruptedException` and clearing the interrupted flag. Catch it, clean up, and usually restore the flag unless the method is deliberately consuming cancellation.

## Thread lifecycle and states

Java exposes six `Thread.State` values. `RUNNABLE` covers both ready-to-run and currently running from the JVM’s point of view; Java does not expose a separate `RUNNING` enum value.

```text
NEW → RUNNABLE → TERMINATED
       ↓   ↑
    BLOCKED
       ↓
 WAITING / TIMED_WAITING
```

| State | Meaning | Common transition or example |
| --- | --- | --- |
| `NEW` | The object exists, but `start()` has not been called | `new Thread(task)` |
| `RUNNABLE` | Eligible to run or currently executing | `thread.start()` |
| `BLOCKED` | Waiting to enter a `synchronized` monitor held by another thread | Waiting for `synchronized (lock)` |
| `WAITING` | Waiting indefinitely for another thread’s action | `wait()`, `join()`, `LockSupport.park()` |
| `TIMED_WAITING` | Waiting for a maximum duration | `sleep(1000)`, `wait(1000)`, `join(1000)` |
| `TERMINATED` | `run()` completed or ended with an uncaught exception | The thread cannot be restarted |

Inspect a state while diagnosing a program:

```java
System.out.println(worker.getState());
System.out.println(worker.isAlive());
```

A thread can be `BLOCKED` while trying to acquire a monitor. A thread that called `wait()` releases that monitor and becomes `WAITING`; after notification it must reacquire the monitor before continuing.

## `sleep`, `wait`, `notify`, and `notifyAll`

These methods solve different problems:

| Method | Owner | Releases a monitor? | Purpose |
| --- | --- | --- | --- |
| `Thread.sleep` | `Thread` | No | Pause the current thread for a duration |
| `Object.wait` | The shared monitor object | Yes | Wait for a condition while releasing that monitor |
| `Object.notify` | The shared monitor object | The awakened thread must reacquire it | Wake one waiter |
| `Object.notifyAll` | The shared monitor object | The awakened threads must reacquire it | Wake every waiter so each can re-check its condition |
| `Thread.join` | The target thread | The caller’s own monitors are not automatically released | Wait for another thread to finish |

`wait`, `notify`, and `notifyAll` must be called while holding the same object’s monitor. Otherwise Java throws `IllegalMonitorStateException`.

```java
final Object lock = new Object();
final boolean[] dataReady = { false };

Thread consumer = new Thread(() -> {
    synchronized (lock) {
        while (!dataReady[0]) {
            try {
                lock.wait();       // releases lock while waiting
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                return;
            }
        }
        System.out.println("consumer processes the data");
    }
}, "consumer");

consumer.start();

synchronized (lock) {
    dataReady[0] = true;
    lock.notify();                 // correct: called while holding lock
}
consumer.join();
```

Always wait in a `while` loop, not an `if`, because a thread may wake without the condition being true or another thread may consume the condition first. Prefer higher-level blocking queues, latches, or futures when they express the problem more clearly.

### Complete producer-consumer state example

```java
public class WaitNotifyLifecycle {
    private static final Object LOCK = new Object();
    private static boolean dataReady;

    public static void main(String[] args) throws InterruptedException {
        Thread child = new Thread(() -> {
            synchronized (LOCK) {
                try {
                    while (!dataReady) {
                        System.out.println("child: " + Thread.currentThread().getState());
                        LOCK.wait();
                    }
                    System.out.println("child: data is ready");
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                }
            }
        }, "child");

        System.out.println("before start: " + child.getState()); // NEW
        child.start();
        Thread.sleep(100); // demonstration only; do not use as synchronization

        synchronized (LOCK) {
            dataReady = true;
            LOCK.notify();
        }
        child.join();
        System.out.println("after join: " + child.getState()); // TERMINATED
    }
}
```

`interrupt()` and `notify()` are not interchangeable. `notify()` signals a condition protected by a monitor. `interrupt()` requests cancellation or wakes a thread that is blocked in an interruptible method.

## Synchronization and shared state

Two threads are safe only when their shared-state protocol is safe. A race condition occurs when the result depends on timing between unsynchronized reads and writes.

```java
class Counter {
    private int value;

    synchronized void increment() {
        value++;
    }

    synchronized int value() {
        return value;
    }
}
```

`synchronized` gives mutual exclusion for the protected region and establishes visibility at monitor boundaries. Other options include:

- `volatile` for visibility of a simple independent value, not for compound actions such as `count++`.
- `AtomicInteger`, `AtomicReference`, and related classes for lock-free atomic updates.
- `ConcurrentHashMap` for concurrent map operations.
- Immutable objects and thread confinement to avoid sharing mutable state.
- `ThreadLocal` when each thread genuinely needs an independent value.

```java
import java.util.concurrent.atomic.AtomicInteger;

AtomicInteger completed = new AtomicInteger();
completed.incrementAndGet();
System.out.println(completed.get());
```

Do not use `volatile` as a replacement for a lock when several operations must be treated as one transaction.

## Deadlock

A deadlock occurs when threads wait forever for one another. A common shape is circular lock ordering:

```text
Thread A: holds firstLock  → waits for secondLock
Thread B: holds secondLock → waits for firstLock
```

### Reproducible deadlock pattern

```java
public class DeadlockExample {
    private static final Object FIRST = new Object();
    private static final Object SECOND = new Object();

    private static class FirstThenSecond implements Runnable {
        @Override
        public void run() {
            synchronized (FIRST) {
                pauseBriefly();
                synchronized (SECOND) {
                    System.out.println("first then second");
                }
            }
        }
    }

    private static class SecondThenFirst implements Runnable {
        @Override
        public void run() {
            synchronized (SECOND) {
                pauseBriefly();
                synchronized (FIRST) {
                    System.out.println("second then first");
                }
            }
        }
    }

    private static void pauseBriefly() {
        try {
            Thread.sleep(100);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
    }

    public static void main(String[] args) {
        new Thread(new FirstThenSecond(), "first-worker").start();
        new Thread(new SecondThenFirst(), "second-worker").start();
        // Both can wait forever after acquiring one lock each.
    }
}
```

### Ways to prevent or diagnose deadlock

**Use one global lock order.** Every path must acquire `FIRST` before `SECOND`:

```java
Runnable safeTask = () -> {
    synchronized (FIRST) {
        doWorkWithFirst();
        synchronized (SECOND) {
            doWorkWithBoth();
        }
    }
};
```

**Avoid nested locking when possible.** Acquire, do the smallest safe operation, and release one resource before acquiring the next:

```java
Thread worker = new Thread(() -> {
    synchronized (FIRST) {
        updateFirstResource();
    }
    synchronized (SECOND) {
        updateSecondResource();
    }
});
```

This is not automatically safe if the two updates must be atomic together; in that case use a consistent lock order or a transaction-style design.

**Use timed lock acquisition.** `ReentrantLock.tryLock` can abandon a lock attempt instead of waiting forever:

```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

ReentrantLock first = new ReentrantLock();
ReentrantLock second = new ReentrantLock();

if (first.tryLock(50, TimeUnit.MILLISECONDS)) {
    try {
        if (second.tryLock(50, TimeUnit.MILLISECONDS)) {
            try {
                System.out.println("acquired both locks");
            } finally {
                second.unlock();
            }
        } else {
            System.out.println("could not acquire second lock; retry later");
        }
    } finally {
        first.unlock();
    }
}
```

Always unlock in `finally`. A timed attempt can still fail and must be handled.

**Use higher-level utilities.** `ExecutorService`, `BlockingQueue`, `CountDownLatch`, `Semaphore`, `Phaser`, and concurrent collections are easier to reason about than manually coordinating many `Thread` objects.

**Diagnose production deadlocks.** JConsole and VisualVM can inspect thread dumps and report monitor cycles. A JVM thread dump also shows threads waiting to enter locks and the locks they hold.

## ExecutorService: manage a pool of workers

Creating one OS thread for every task does not scale:

```java
for (int i = 0; i < 1000; i++) {
    new Thread(() -> doWork()).start();
}
```

An `ExecutorService` separates task submission from worker management. A pool reuses a bounded group of threads:

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

ExecutorService executor = Executors.newFixedThreadPool(10);
try {
    for (int i = 0; i < 1000; i++) {
        executor.submit(() -> doWork());
    }
} finally {
    executor.shutdown(); // finish submitted work; reject new work
}
```

Think of the executor as a kitchen manager: tasks are orders, and the worker pool is the team of chefs. The application should own the pool’s lifecycle and shut it down.

### Common pool types

| Factory | Behavior | Typical fit |
| --- | --- | --- |
| `newFixedThreadPool(n)` | Reuses a fixed number of workers | Bounded CPU or service work |
| `newCachedThreadPool()` | Creates workers as needed and reuses idle workers | Many short tasks when growth is acceptable |
| `newSingleThreadExecutor()` | One worker, sequential execution | Ordered background work |
| `newScheduledThreadPool(n)` | Delayed and periodic tasks | Timers and scheduled maintenance |
| `newWorkStealingPool()` | Uses a work-stealing pool | Many independent tasks |

A pool size is a capacity decision, not a magic performance setting. CPU-heavy work is usually bounded near available processors; blocking I/O may need a different design. Measure the application.

### Scheduled task

```java
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
scheduler.schedule(() -> System.out.println("runs after three seconds"),
    3, TimeUnit.SECONDS);
scheduler.shutdown();
```

### Graceful shutdown

`shutdown()` rejects new submissions but lets accepted tasks finish. `shutdownNow()` attempts to stop active tasks by interrupting workers and returns queued tasks; it is not a guaranteed force-kill.

```java
static void shutdownAndAwait(ExecutorService pool)
        throws InterruptedException {
    pool.shutdown();
    if (!pool.awaitTermination(60, TimeUnit.SECONDS)) {
        pool.shutdownNow();
        if (!pool.awaitTermination(60, TimeUnit.SECONDS)) {
            System.err.println("pool did not terminate");
        }
    }
}
```

If the shutdown method itself is interrupted, call `shutdownNow()` and restore the interrupt flag:

```java
catch (InterruptedException interrupted) {
    pool.shutdownNow();
    Thread.currentThread().interrupt();
}
```

## Callable and Future

`Runnable` returns no result. `Callable<T>` returns a value and can throw an exception. `submit` returns a `Future<T>` that represents the pending result.

```java
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

ExecutorService executor = Executors.newFixedThreadPool(3);
try {
    List<Future<Integer>> futures = new ArrayList<>();
    for (int i = 1; i <= 5; i++) {
        int number = i;
        Callable<Integer> square = () -> {
            Thread.sleep(100);
            return number * number;
        };
        futures.add(executor.submit(square));
    }

    for (Future<Integer> future : futures) {
        try {
            System.out.println(future.get()); // blocks until this result is ready
        } catch (ExecutionException failedTask) {
            System.err.println("task failed: " + failedTask.getCause());
        }
    }
} finally {
    executor.shutdown();
}
```

Useful `Future` operations include `get()`, timed `get`, `isDone()`, `cancel(true)`, and `isCancelled()`. Calling `get()` in submission order can hide a result that is ready later in the list; `ExecutorCompletionService` can be useful when results should be consumed as tasks finish.

## CompletableFuture (Java 8+)

`CompletableFuture<T>` implements both `Future<T>` and `CompletionStage<T>`. It represents a result that can be completed later and lets dependent stages be composed without manually blocking each step.

```java
import java.util.concurrent.CompletableFuture;

CompletableFuture<String> user = CompletableFuture.supplyAsync(
    () -> "alice");

CompletableFuture<String> greeting = user
    .thenApply(name -> "Hello, " + name)
    .exceptionally(error -> "fallback greeting");

System.out.println(greeting.join());
```

Important methods:

- `supplyAsync` starts work that returns a value; `runAsync` starts work with no value.
- `thenApply` transforms a result.
- `thenCompose` flattens a dependent asynchronous operation.
- `thenCombine` combines two independent results.
- `thenAccept` consumes a result without producing another value.
- `exceptionally`, `handle`, and `whenComplete` provide failure or completion handling.
- `allOf` waits for several futures; `anyOf` completes when one does.
- `join()` waits and wraps failures in `CompletionException`; `get()` uses checked exceptions.

```java
CompletableFuture<String> profile = loadProfile();
CompletableFuture<String> orders = loadRecentOrders();

CompletableFuture<String> page = profile.thenCombine(
    orders,
    (profileText, orderText) -> profileText + "\n" + orderText
).orTimeout(2, java.util.concurrent.TimeUnit.SECONDS);

page.thenAccept(System.out::println)
    .exceptionally(error -> {
        System.err.println("request failed: " + error);
        return null;
    });
```

Async methods without an explicit executor commonly use the common fork-join pool. Pass an application-owned executor when workload isolation, naming, capacity, or observability matters.

## Virtual threads (Java 21+)

Virtual threads are lightweight JVM-managed threads intended mainly for tasks that spend much of their time waiting for I/O. They are not a faster CPU core and should not be used to hide unbounded CPU work.

```java
Thread virtual = Thread.startVirtualThread(() -> {
    System.out.println("I/O-oriented task");
});
virtual.join();
```

An executor can create one virtual thread per submitted task:

```java
try (var executor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> callRemoteService());
}
```

Virtual threads do not remove the need for limits. Protect databases, remote services, file descriptors, and other scarce resources with connection pools, semaphores, timeouts, and back-pressure.

## Common mistakes checklist

- Calling `run()` when a new thread was intended.
- Starting the same `Thread` instance more than once.
- Sharing mutable data without a visibility or atomicity strategy.
- Assuming `volatile count++` is atomic.
- Calling `wait()` or `notify()` without owning the monitor.
- Waiting with `if` instead of re-checking a condition in a `while` loop.
- Ignoring `InterruptedException` or failing to restore the interrupt flag.
- Holding a lock while performing slow I/O.
- Acquiring multiple locks in inconsistent order.
- Creating an unbounded number of manual threads.
- Forgetting to shut down an executor.
- Calling `shutdownNow()` and assuming a task must stop immediately.
- Blocking the common pool with long-running or blocking work without considering a dedicated executor.

## Interview questions and answers

<details>
<summary>What is the difference between a process and a thread?</summary>

A process has its own address space and operating-system resources. Threads are execution paths within a process and normally share the process heap and file descriptors. Threads are cheaper to create and communicate through shared memory, but shared memory introduces races and coordination problems.
</details>

<details>
<summary>What is the difference between start() and run()?</summary>

`run()` is an ordinary method call on the current thread. `start()` transitions a new `Thread` into execution and the JVM later calls `run()` on a separate thread. Calling `start()` twice on one object throws `IllegalThreadStateException`.
</details>

<details>
<summary>Why prefer Runnable over extending Thread?</summary>

A task should describe work, while `Thread` represents an execution mechanism. Implementing `Runnable` leaves the class free to extend another class and allows the same task to run on a direct thread, an executor, or another scheduler. Java classes cannot extend both `Thread` and another superclass.
</details>

<details>
<summary>Can a terminated thread be restarted?</summary>

No. A `Thread` instance has one lifecycle. Starting it after completion throws `IllegalThreadStateException`. Create a new thread object or submit a new task to an executor.
</details>

<details>
<summary>What are the Java thread states?</summary>

`NEW`, `RUNNABLE`, `BLOCKED`, `WAITING`, `TIMED_WAITING`, and `TERMINATED`. `RUNNABLE` includes both ready-to-run and running from the JVM’s perspective. `BLOCKED` means waiting for a monitor; `WAITING` and `TIMED_WAITING` describe different forms of waiting.
</details>

<details>
<summary>Why must wait() be called inside a while loop?</summary>

A wake-up does not guarantee that the condition is true. Another thread may consume the condition first, or the wake-up may be spurious. Re-check the condition after reacquiring the monitor and wait again if necessary.
</details>

<details>
<summary>What happens if notify() is called outside synchronized?</summary>

The caller does not own the object monitor, so Java throws `IllegalMonitorStateException`. Call `wait`, `notify`, and `notifyAll` while synchronized on the same object used for coordination.
</details>

<details>
<summary>What is the difference between sleep(), wait(), and join()?</summary>

`sleep` pauses the current thread and does not release locks. `wait` releases the monitor of the object and waits for a condition signal. `join` makes the current thread wait for another thread to terminate. All can have timed forms, and all may be affected by interruption where their contracts allow it.
</details>

<details>
<summary>What is deadlock and how do you prevent it?</summary>

Deadlock is circular waiting: each thread holds a resource needed by another. Use a consistent global lock order, avoid unnecessary nested locks, use timed `tryLock`, keep critical sections small, and prefer higher-level concurrency utilities. Thread dumps, JConsole, and VisualVM help diagnose it.
</details>

<details>
<summary>Is a Runnable task itself a thread?</summary>

No. `Runnable` is a description of work. A `Thread`, executor worker, or another scheduler executes that work. This separation is why the same task can be reused with different execution policies.
</details>

<details>
<summary>What is the difference between Runnable and Callable?</summary>

`Runnable.run()` returns no value and cannot declare checked exceptions. `Callable.call()` returns a value and can throw checked exceptions. An executor returns a `Future` when a `Callable` is submitted.
</details>

<details>
<summary>What is the difference between shutdown() and shutdownNow()?</summary>

`shutdown()` stops new submissions and allows accepted tasks to finish. `shutdownNow()` attempts to interrupt running tasks and returns tasks that were waiting in the queue. Tasks must cooperate with interruption; `shutdownNow()` is not a guaranteed forceful termination.
</details>

<details>
<summary>What does volatile guarantee?</summary>

A write to a volatile field becomes visible to other threads that subsequently read it, and volatile access has ordering guarantees. It does not make compound operations such as `value++` atomic. Use synchronization or an atomic class for read-modify-write operations.
</details>

<details>
<summary>When should CompletableFuture be used?</summary>

Use it when asynchronous operations have results that need to be transformed, combined, timed out, or recovered from failure. Use an explicit executor when the work should not share the common pool. Do not build an unnecessarily complex callback chain when a simple synchronous method is clearer.
</details>

<details>
<summary>Are virtual threads suitable for every workload?</summary>

No. They are designed for large numbers of mostly blocking, I/O-oriented tasks. CPU-intensive work is still limited by available processors, and external resources such as databases still need bounded concurrency.
</details>

## Quick revision table

| Concept | One-line answer |
| --- | --- |
| Thread | Independent execution path inside a JVM process |
| `start()` | Schedules a new thread and invokes `run()` there |
| `run()` | The task body; direct call is synchronous |
| Runnable | Reusable task with no result |
| Callable | Task that returns a value or throws an exception |
| `join()` | Waits for another thread to terminate |
| `interrupt()` | Cooperative cancellation signal |
| `synchronized` | Mutual exclusion plus visibility at monitor boundaries |
| Deadlock | Threads wait forever in a cycle of held resources |
| ExecutorService | Manages worker threads and submitted tasks |
| Future | Handle for a pending result or cancellation |
| CompletableFuture | Composable asynchronous result pipeline |
| Virtual thread | Lightweight JVM-managed thread suited to blocking I/O |

## Official references

- [Java SE 21 `Thread` API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html)
- [Java SE 21 `ExecutorService` API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html)
- [Java SE 21 `CompletableFuture` API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html)
- [Java concurrency tutorial](https://docs.oracle.com/javase/tutorial/essential/concurrency/)
