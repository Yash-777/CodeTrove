# Exceptions and Resource Safety — Interview Q&A

<details><summary>What is the difference between checked exceptions, unchecked exceptions, and Errors?</summary>

### Answer
Checked exceptions are subclasses of `Exception` other than `RuntimeException` and must be caught or declared. Unchecked exceptions are `RuntimeException` subclasses and usually indicate invalid state or input. `Error` represents serious JVM or linkage conditions that application code generally should not recover from blindly.

### Example
```java
void load() throws IOException { Files.readString(path); }
void requirePositive(int value) {
    if (value <= 0) throw new IllegalArgumentException("positive value required");
}
```

### Interviewer perspective
Do not catch `Throwable` or catch broad exceptions merely to log and continue. Catch at a boundary where you can add context, translate the error, retry safely, or return a meaningful response.
</details>

<details><summary>How are ClassNotFoundException, NoClassDefFoundError, ClassCastException, NullPointerException, and IllegalStateException different?</summary>

### Answer
`ClassNotFoundException` commonly comes from explicit class loading. `NoClassDefFoundError` indicates a required definition is unavailable or failed during runtime. `ClassCastException` means an object cannot be cast to the requested type. `NullPointerException` means a null reference was used. `IllegalStateException` means the operation is invalid for the object's current state.

### Example
```java
Object value = "text";
Integer number = (Integer) value; // ClassCastException
```

### Interviewer perspective
State whether the failure is caused by input, a programming defect, packaging, class-loader boundaries, or lifecycle misuse. The classification determines the correct repair.
</details>

<details><summary>What are ClassFormatError, LinkageError, ClassCircularityError, ReflectiveOperationException, IllegalClassFormatException, and UnmodifiableClassException?</summary>

### Answer
`ClassFormatError` means a class file has an invalid format. `LinkageError` covers failures linking a class, including incompatible or missing definitions; `ClassCircularityError` is a circular initialization/loading relationship. `ReflectiveOperationException` is the common checked base for reflective lookup/invocation failures. `IllegalClassFormatException` and `UnmodifiableClassException` belong to Java instrumentation and describe transformation or unsupported modification failures.

### Interviewer perspective
These are diagnostic categories, not normal business exceptions. Explain classpath, bytecode compatibility, agents, module boundaries, and startup validation when investigating them.
</details>

<details><summary>Why is try-with-resources preferred?</summary>

### Answer
A try-with-resources statement closes every `AutoCloseable` resource in reverse declaration order, even when the body throws. If closing also throws, the close failure becomes a suppressed exception attached to the primary failure.

### Example
```java
try (InputStream in = Files.newInputStream(path);
     BufferedReader reader = new BufferedReader(new InputStreamReader(in))) {
    return reader.readLine();
}
```

### Interviewer perspective
Explain ownership: the method that acquires a resource should normally close it unless it explicitly transfers ownership. Never hide suppressed exceptions when diagnosing production failures.
</details>

<details><summary>How should interruption be handled?</summary>

### Answer
Interruption is a cooperative request to stop or change work. Methods such as `sleep`, `wait`, and `Future.get` may throw `InterruptedException`. A method that cannot propagate the exception should usually restore the flag with `Thread.currentThread().interrupt()` and return or cancel safely.

### Example
```java
try {
    queue.take();
} catch (InterruptedException error) {
    Thread.currentThread().interrupt();
    return;
}
```

### Interviewer perspective
Clearing the flag and continuing an infinite loop is a common production bug. Ask how cancellation propagates through child tasks, network calls, and executor shutdown.
</details>

## References

- [Java exceptions API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Exception.html)
- [try-with-resources](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html)
- [Java instrumentation exceptions](https://docs.oracle.com/en/java/javase/21/docs/api/java.instrument/java/lang/instrument/package-summary.html)
