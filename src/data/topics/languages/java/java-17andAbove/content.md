# Java 17 and above: LTS foundations and continuing evolution

Java 17 is a major long-term-support baseline. Later releases continue the six-month feature cadence: some changes become permanent quickly, while others spend one or more releases as preview or incubator features. Read the release number and the feature status together; code that uses a preview feature is not the same as ordinary Java source.

---

This page covers Java 17 through the Java 25 language updates documented by Oracle. Java 17, 21, and 25 are LTS milestones in the modern release model. Java 18–20 and 22–24 contain important previews, runtime improvements, and APIs that influenced later permanent features.

A preview feature normally requires `--enable-preview` at compile and run time, together with the correct `--release` or JDK version. Do not publish preview syntax as if it were a stable cross-version API.

<details><summary>Java version - list all the feature in detail with examples</summary>

## Java 17: the LTS baseline

### Sealed hierarchies and exhaustive domain models

Java 17 permanently supports sealed classes and interfaces:

```java
sealed interface Result<T> permits Success, Failure {}
record Success<T>(T value) implements Result<T> {}
record Failure<T>(String message) implements Result<T> {}

static String describe(Result<?> result) {
    return switch (result) {
        case Success<?> success -> "value=" + success.value();
        case Failure<?> failure -> "error=" + failure.message();
    };
}
```

The example combines a sealed hierarchy, records, and pattern matching. Depending on the exact switch feature and JDK release, pattern matching in `switch` may require a later release or preview flag; always compile with the language level you target.

### Strong encapsulation and migration

JDK internals are no longer safely accessible through casual reflection. Libraries that depend on `sun.*` or other non-exported internals should migrate to supported APIs. Temporary `--add-opens` or `--add-exports` flags can help a controlled migration, but they should not hide an unresolved production dependency forever.

Java 17 also includes enhanced pseudo-random number generators, context-specific deserialization filters, foreign-function work, and continued improvements to G1, ZGC, startup, and class-data sharing.

## Java 18

Java 18 made UTF-8 the default charset for standard Java APIs on most platforms, reducing differences between machines but exposing code that silently depended on a local legacy encoding. Be explicit at file and network boundaries when the protocol defines a charset:

```java
Files.readString(path, StandardCharsets.UTF_8);
new InputStreamReader(input, StandardCharsets.UTF_8);
```

Java 18 also added a simple web server for local testing, finalized the second incubator of the Foreign Function & Memory API, and continued preview work for pattern matching and vector operations.

## Java 19–20: concurrency previews and structured APIs

### Virtual threads

Virtual threads are lightweight threads designed for large numbers of mostly waiting tasks. They preserve the thread-per-request programming model without requiring one expensive platform thread per request:

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    Future<String> first = executor.submit(() -> fetch("/first"));
    Future<String> second = executor.submit(() -> fetch("/second"));
    System.out.println(first.get() + second.get());
}
```

Virtual threads are not faster CPU cores. They help when tasks spend time waiting on network, database, or other interruptible I/O. Avoid pinning them with long synchronized blocks or native calls, and continue to limit downstream resources such as database connections.

### Structured concurrency

Structured concurrency treats related concurrent tasks as one lifetime: start them in a scope, cancel siblings when one fails, and join before leaving the scope. It was previewed in this period and evolved in later releases. The design goal is observable ownership and predictable cancellation rather than untracked background tasks.

### Record patterns

Record patterns destructure record components while checking the record type:

```java
record Point(int x, int y) {}

static int distanceManhattan(Object value) {
    if (value instanceof Point(int x, int y)) return Math.abs(x) + Math.abs(y);
    return 0;
}
```

The exact pattern syntax and availability depends on the targeted release. Treat preview examples as learning material until the feature is permanent in your chosen JDK.

## Java 21: the next LTS milestone

### Virtual threads become permanent

Java 21 finalized virtual threads. Use `Executors.newVirtualThreadPerTaskExecutor()` for many independent, blocking tasks, but still apply back-pressure around databases, remote services, queues, and memory-heavy work.

### Pattern matching for `switch`

Java 21 finalized pattern matching for `switch`:

```java
static String format(Object value) {
    return switch (value) {
        case null -> "null";
        case Integer number when number > 0 -> "positive integer: " + number;
        case Integer number -> "integer: " + number;
        case String text -> "text: " + text;
        default -> "other";
    };
}
```

A guarded case uses a `when` clause in modern Java syntax. Pattern dominance matters: a broad pattern placed before a narrower pattern makes the narrower case unreachable. The compiler checks exhaustiveness for suitable sealed hierarchies.

### Record patterns become permanent

Nested records can be unpacked directly:

```java
record Address(String city) {}
record Customer(String name, Address address) {}

if (value instanceof Customer(String name, Address(String city))) {
    System.out.println(name + " lives in " + city);
}
```

### Sequenced collections

Java 21 adds interfaces that express a well-defined first and last element, including `SequencedCollection`, `SequencedSet`, and `SequencedMap`:

```java
SequencedSet<String> set = new LinkedHashSet<>(List.of("first", "second"));
System.out.println(set.getFirst());
System.out.println(set.getLast());
System.out.println(set.reversed());
```

This makes encounter order part of the type contract instead of requiring collection-specific guesses.

### String templates and unnamed classes status

Several features appeared as previews around Java 21 and later changed or were withdrawn. String templates were previewed but should not be treated as a stable feature in general teaching material. Unnamed classes and instance `main` methods also evolved through preview rounds before later release decisions. Always check the targeted JDK documentation before using a preview feature.

## Java 22–24

### Unnamed variables and patterns

When a value must be matched but will not be used, `_` can express that intent in releases where the feature is enabled and supported:

```java
// Availability depends on the targeted release and preview status.
if (value instanceof Map.Entry(String key, _)) {
    System.out.println(key);
}
```

The purpose is not to create a variable named underscore. It explicitly documents that the value is intentionally ignored and avoids misleading names.

### Foreign Function and Memory API

The Foreign Function and Memory API provides a safer, structured way to interact with native memory and foreign functions than unsupported internal APIs. Native interop remains advanced: define ownership, lifetime, bounds, thread confinement, and failure behavior before exposing it to application code.

### Stream gatherers

Stream gatherers allow custom intermediate operations that can maintain state, emit zero or more values, and define finish behavior. They are useful for reusable transformations that do not fit `map`, `filter`, `flatMap`, or standard collectors. They should be used when a named reusable operation is clearer than an ad-hoc loop, not merely because the API is newer.

### Class-File API and launch improvements

Later releases introduced a standard Class-File API for parsing and transforming class files, a command-line launcher for multi-file source-code programs, and continuing improvements to the Foreign Function and Memory API, vector API, garbage collectors, and startup performance.

## Java 25: current language direction

Oracle's Java 25 language summary lists these permanent additions:

- Module import declarations, which can import packages exported by a module.
- Compact source files and instance `main` methods, designed to reduce ceremony for small educational programs.
- Flexible constructor bodies, allowing statements that do not reference the instance before the explicit constructor invocation.

Illustrative compact source syntax is intentionally different from the classic class-based style:

```java
// Availability requires a JDK that supports compact source files.
void main() {
    System.out.println("Hello, Java");
}
```

Flexible constructor bodies help validate or normalize arguments before calling `super(...)` when those statements do not access the object being constructed:

```java
class User extends Person {
    User(String name) {
        super(normalize(name));
    }

    private static String normalize(String value) {
        return value == null ? "Guest" : value.trim();
    }
}
```

The second example also works on older Java versions because it uses an ordinary static helper. The new rule concerns what statements are allowed before an explicit constructor invocation, not a requirement to use a new keyword.

Java 25 also documents primitive types in patterns, `instanceof`, and `switch` as preview work. Preview and incubator APIs must be isolated from stable compatibility claims.

## Choosing a release for a project

Use Java 17 when your organization needs a mature LTS baseline with sealed classes, records, pattern matching for `instanceof`, strong tooling, and broad library support. Use Java 21 when virtual threads, record patterns, pattern matching for `switch`, or sequenced collections provide measurable value and your dependencies support the runtime. Evaluate Java 25 when you control the deployment JDK and want its latest permanent language improvements.

For libraries, compile with the lowest supported `--release` and test on newer runtimes. For services, pin the JDK distribution and patch cadence, test container images, verify TLS and charset behavior, inspect native/JNI integrations, and measure memory and throughput rather than assuming a newer JDK is automatically faster.

Useful commands:

```bash
java -version
javac --release 17 -d out src/Main.java
javac --enable-preview --release 21 -d out src/PreviewExample.java
java --enable-preview -cp out PreviewExample
jdeps --multi-release 17 --summary out/app.jar
```

The `--enable-preview` flag must match the release used to compile the preview source. `jdeps` helps find dependencies on JDK internals and module relationships.

<details><summary>Concept-wise interview questions and answers</summary>

<details><summary>Are virtual threads faster than platform threads for CPU work?</summary>

No. Virtual threads improve scalability for tasks that spend time waiting, because many virtual threads can be multiplexed over fewer carrier threads. CPU-bound work is still limited by available processor capacity. A virtual-thread design must still control concurrency and downstream capacity.

</details>

<details><summary>What is pinning in a virtual thread?</summary>

Pinning occurs when a virtual thread cannot be cheaply unmounted from its carrier, such as during certain synchronized blocks or native operations. A pinned virtual thread can reduce scalability. Keep critical sections short, prefer modern lock designs where appropriate, and inspect thread behavior with profiling and JDK diagnostics.

</details>

<details><summary>What makes a switch exhaustive?</summary>

A switch is exhaustive when every possible selector value is covered by labels or a default. Enums and sealed hierarchies give the compiler a finite set of known alternatives. Exhaustiveness makes refactoring safer because adding a permitted subtype can force a compiler error at incomplete switches.

</details>

<details><summary>Why does pattern order matter?</summary>

Patterns are tested top to bottom. A broad pattern such as `Object object` dominates a narrower `String text` pattern placed after it, making the narrower case unreachable. Put specific cases before general cases and let the compiler identify dominance errors.

</details>

<details><summary>Are records deeply immutable?</summary>

No. A record prevents reassignment of its component fields after construction, but a component can refer to a mutable object. Use defensive copies, immutable collections, and immutable component types when deep immutability is required.

</details>

<details><summary>What is the difference between a preview and an incubator feature?</summary>

A preview feature changes the Java language or JVM specification and requires explicit opt-in. An incubator feature is an API or tool exposed for experimentation in a module such as `jdk.incubator.*`. Both can change or disappear, so production code should isolate and track them deliberately.

</details>

<details><summary>How should a Java 8 application migrate to Java 17 or 21?</summary>

First make the application pass tests on the newer runtime without changing source. Then remove illegal reflective access, replace JDK-internal APIs, update dependencies, check modules and serialization, verify TLS and charset assumptions, and migrate syntax incrementally. Use `--release` for compilation compatibility and measure startup, memory, garbage collection, and latency before and after.

</details>

<details><summary>Why is `--release` better than only `-source` and `-target`?</summary>

`-source` controls source syntax and `-target` controls class-file generation, but they do not by themselves prevent accidental use of newer platform APIs. `--release 8` couples the language level, class-file target, and documented API surface for that release.

</details>

</details>
</details>

## References

[Oracle Java language changes summary](https://docs.oracle.com/en/java/javase/25/language/java-language-changes-summary.html) · [Oracle Java language changes by release](https://docs.oracle.com/en/java/javase/25/language/java-language-changes-release.html) · [OpenJDK JEP index](https://openjdk.org/jeps/0) · [JEP 444: Virtual Threads](https://openjdk.org/jeps/444) · [JEP 441: Pattern Matching for switch](https://openjdk.org/jeps/441) · [JEP 440: Record Patterns](https://openjdk.org/jeps/440)
