# JVM, Class Loading, and Garbage Collection — Interview Q&A

<details><summary>What happens to Java memory at a high level?</summary>

### Answer
The JVM has a heap for objects, thread stacks for frames and local variables, class metadata storage, and native areas. Exact layout and collector behavior are implementation-dependent. An object becomes collectible when it is no longer reachable from GC roots such as live threads, static fields, and JNI references.

### Example
```java
byte[] payload = new byte[10_000_000];
payload = null; // the array may become eligible if no other reference exists
```

### Interviewer perspective
Do not say `System.gc()` forces collection. It is only a request. Explain that a Java memory leak usually means objects are still reachable through an unintended reference.
</details>

<details><summary>What are young and old generations?</summary>

### Answer
Many generational collectors separate short-lived objects from objects that survive collections. Young collections can be frequent and relatively small; long-lived objects may be promoted to an old region. The exact regions and algorithm vary by collector and JDK version.

### Example
```text
request objects -> young region -> survive collections -> promotion -> old region
```

### Interviewer perspective
Avoid treating “minor GC” and “major GC” as universal guarantees across all collectors. Discuss observed pause time, allocation rate, heap occupancy, and collector configuration instead of relying only on labels.
</details>

<details><summary>What is the difference between ClassNotFoundException and NoClassDefFoundError?</summary>

### Answer
`ClassNotFoundException` is a checked exception commonly thrown when code explicitly loads a class by name and the class cannot be found. `NoClassDefFoundError` is an `Error` indicating that a class definition required during execution was unavailable or failed to initialize, even though compilation previously succeeded or the class was otherwise expected.

### Example
```java
Class.forName("com.example.Plugin"); // may throw ClassNotFoundException
```

### Interviewer perspective
Ask for the diagnostic path: inspect the runtime classpath, packaging, dependency scope, class-loader boundaries, and the first initialization failure. Do not “fix” an error by catching it and continuing with an invalid application state.
</details>

<details><summary>Why is finalize not a reliable cleanup mechanism?</summary>

### Answer
Finalization is deprecated and unreliable. The JVM does not guarantee when or whether a finalizer will run, and finalizers can delay reclamation and create performance and security problems. Use `AutoCloseable`, try-with-resources, explicit lifecycle methods, or `Cleaner` only for carefully designed fallback cleanup.

### Example
```java
try (InputStream input = Files.newInputStream(path)) {
    process(input);
} // deterministic close
```

### Interviewer perspective
Separate memory reclamation from external-resource release. File descriptors, sockets, database connections, and locks need deterministic cleanup.
</details>

<details><summary>How do you investigate an OutOfMemoryError?</summary>

### Answer
First classify the error: Java heap, metaspace, direct buffer, native thread, or another native allocation. Capture the error message, heap settings, allocation rate, GC logs, heap dump if available, thread count, and recent deployment/configuration changes. Look for retained objects, unbounded caches, large batches, listener leaks, and class-loader leaks.

### Example
```bash
jcmd <pid> GC.heap_info
jcmd <pid> GC.class_histogram
jcmd <pid> Thread.print
```

### Interviewer perspective
Increasing `-Xmx` can delay failure but does not fix a retention bug. State the safety impact of heap dumps and avoid collecting production dumps containing sensitive data without an approved process.
</details>

<details><summary>What are weak, soft, and phantom references used for?</summary>

### Answer
Reference types influence how the garbage collector treats reachable objects. A weak reference does not keep an object alive and is useful for metadata or canonical maps. Soft references were historically used for memory-sensitive caches but are not a dependable cache policy. Phantom references support post-mortem cleanup coordination with a `ReferenceQueue` and do not provide the referent directly.

### Interviewer perspective
A reference type is not a substitute for a bounded cache with an eviction policy. Prefer explicit ownership and observability for application-critical resources.
</details>

## References

- [JVM specification](https://docs.oracle.com/javase/specs/jvms/se21/html/)
- [Garbage collection tuning guide](https://docs.oracle.com/en/java/javase/21/gctuning/)
- [Class loading](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassLoader.html)
