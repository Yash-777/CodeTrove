# Java 5–7: the language foundation

Java 5 through Java 7 established most of the syntax and APIs that older enterprise Java code still uses. Java 5 introduced generics, annotations, enums, autoboxing, varargs, enhanced `for`, and static imports. Java 6 improved tooling and platform integration. Java 7 made resource handling, exception handling, literals, and NIO much more practical.

The code examples below are deliberately small. They show the reason for a feature, not only its syntax.

<details open><summary>Java version - list all the feature in detail with examples</summary>

## Java 5 / J2SE 5.0

### Generics: type safety at compile time

Generics let a collection describe the type it accepts. The compiler catches an invalid value before the program runs, and callers do not need most casts.

```java
import java.util.ArrayList;
import java.util.List;

class GenericExample {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>();
        names.add("Ada");
        // names.add(42); // compile-time error
        String first = names.get(0);
        System.out.println(first);
    }
}
```

Use bounded type parameters when an algorithm needs a capability rather than one concrete class:

```java
static <T extends Number> double sum(T left, T right) {
    return left.doubleValue() + right.doubleValue();
}
```

`List<? extends Number>` is useful for reading numbers from an unknown subtype. `List<? super Integer>` is useful when writing integers. A practical rule is **PECS**: Producer Extends, Consumer Super.

### Enhanced `for` and varargs

The enhanced loop reads arrays and `Iterable` values without index bookkeeping:

```java
for (String name : names) {
    System.out.println(name);
}
```

Varargs let a method accept zero or more values. The compiler creates an array at the call site:

```java
static int maximum(int... values) {
    if (values.length == 0) throw new IllegalArgumentException("at least one value is required");
    int result = values[0];
    for (int value : values) result = Math.max(result, value);
    return result;
}
```

For generic varargs, the created array can have a non-reifiable component type. Treat `@SafeVarargs` as a promise that the method does not perform unsafe writes or expose the array.

### Enums

An enum is a closed set of named instances. It can have fields, methods, and behavior, so it is safer than integer constants:

```java
enum Status {
    NEW, PAID, CANCELLED;

    boolean canShip() {
        return this == PAID;
    }
}
```

Enum values are singletons within the class loader. Do not compare them with user input using `==`; convert text with `Status.valueOf(text.toUpperCase(Locale.ROOT))` and handle `IllegalArgumentException`.

### Annotations and metadata

Annotations attach metadata to declarations or types. The compiler, tools, frameworks, or runtime reflection can read them:

```java
@Override
public String toString() {
    return "Order";
}
```

`@Override` is valuable because the compiler verifies that a method really overrides a superclass or interface method. Custom annotations can use `@Retention` and `@Target` to define where and how long metadata exists.

### Autoboxing, unboxing, and static import

Autoboxing converts between primitives and wrappers when the context requires it:

```java
Integer count = 10; // int -> Integer
int next = count + 1; // Integer -> int
```

Unboxing a `null` wrapper throws `NullPointerException`, and `Integer` identity must not be tested with `==` for values outside the cache range. Use `equals` for wrapper values.

Static imports reduce repetition for carefully chosen constants or utility methods:

```java
import static java.lang.Math.PI;
import static java.lang.Math.cos;

class Circle {
    static double x(double radians) { return cos(radians) * PI; }
}
```

Do not statically import many methods with the same names; readability is more important than saving a qualifier.

### Covariant returns and concurrency utilities

An overriding method may return a more specific type than the method it overrides:

```java
class Animal {}
class Dog extends Animal {}
class Kennel {
    Animal adopt() { return new Animal(); }
}
class DogKennel extends Kennel {
    @Override Dog adopt() { return new Dog(); }
}
```

Java 5 also introduced `java.util.concurrent`, including `ExecutorService`, locks, atomics, concurrent collections, and synchronizers. Prefer an executor over manually creating a thread for every request:

```java
ExecutorService pool = Executors.newFixedThreadPool(2);
try {
    Future<Integer> result = pool.submit(() -> 20 + 22);
    System.out.println(result.get());
} finally {
    pool.shutdown();
}
```

### Important Java 5 APIs and platform changes

Java 5 added the `java.util.concurrent` package, `java.lang.instrument`, improved monitoring and management APIs, formatted I/O, and updates to JDBC and XML tooling. These are platform additions rather than new keywords, but they changed how production applications were designed.

## Java 6 / Java SE 6

Java 6 focused less on new syntax and more on libraries, tools, performance, and integration. Important additions include:

- JDBC 4.0, including automatic driver discovery through the service-provider mechanism.
- The Compiler API, so applications can invoke a Java compiler programmatically.
- The `javax.annotation.processing` API for compile-time annotation processors.
- The Scripting API for interoperating with supported scripting engines.
- Improvements to desktop, web-service, XML, monitoring, and management APIs.
- JVM and startup performance improvements.

A JDBC 4 application can often discover a driver without explicitly calling `Class.forName`, although the driver and connection configuration still must be present:

```java
try (Connection connection = DriverManager.getConnection(url, user, password)) {
    // JDBC 4 drivers can be discovered through ServiceLoader metadata.
}
```

The exact driver behavior depends on the driver version. Do not treat automatic discovery as a replacement for correct dependency or classpath configuration.

## Java 7 / Java SE 7

### Diamond operator

The compiler can infer constructor type arguments from the target type:

```java
Map<String, List<Integer>> scores = new HashMap<>();
```

The diamond is not magic runtime typing. The object still has a concrete generic type after compilation, and it cannot be used when the compiler cannot infer a safe type.

### Strings in `switch`

A `String` can be used as a switch selector:

```java
static int httpStatus(String word) {
    switch (word) {
        case "ok": return 200;
        case "created": return 201;
        default: return 400;
    }
}
```

The comparison is based on string values, not object identity. A `null` selector still causes `NullPointerException`.

### Binary literals and underscores

Binary literals make bit masks clearer, and underscores group digits:

```java
int permissions = 0b101_101;
long accountNumber = 1234_5678_9012L;
```

Underscores may not appear at the beginning or end of a literal, next to a decimal point, or directly before a suffix.

### Try-with-resources

A resource that implements `AutoCloseable` is closed automatically, even when the body throws:

```java
try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
    System.out.println(reader.readLine());
}
```

If both the body and `close()` throw, the close exception becomes a suppressed exception. Inspect `exception.getSuppressed()` when diagnosing resource failures.

Java 7 also supports multiple resources in one header and, in later maintenance updates, an already-final or effectively-final variable can be used as a resource:

```java
final BufferedReader reader = Files.newBufferedReader(path);
try (reader) {
    System.out.println(reader.readLine());
}
```

### Multi-catch and precise rethrow

Related exception types can share one handler:

```java
try {
    parseAndWrite(input);
} catch (IOException | NumberFormatException ex) {
    log(ex);
    throw new IllegalStateException("Input processing failed", ex);
}
```

The alternatives cannot have a subtype relationship. Java 7 also performs more precise analysis for rethrowing exceptions caught in a `catch` block, which can allow a narrower `throws` declaration than older compilers.

### NIO.2: modern file operations

`java.nio.file.Path`, `Files`, file attributes, directory walking, symbolic links, and file-system providers replaced many verbose `java.io.File` use cases:

```java
Path source = Paths.get("input.txt");
Path backup = Paths.get("input.txt.bak");
Files.copy(source, backup, StandardCopyOption.REPLACE_EXISTING);
```

`Path` is a description of a location; it does not prove that a file exists. Validate with `Files.exists`, and handle `IOException` and permission errors.

### Fork/Join and `invokedynamic`

The Fork/Join framework supports divide-and-conquer tasks that recursively split work and use work stealing. It is useful for CPU-bound tasks with enough independent work, not for every asynchronous operation.

Java 7 also introduced the `invokedynamic` bytecode instruction, which gives language runtimes a flexible linkage mechanism. It is important to JVM language implementers and later supports efficient dynamic-language and lambda implementations, even though ordinary application developers rarely write it directly.

## Compatibility and migration

Source compatibility asks whether old source still compiles. Binary compatibility asks whether old class files still link. Behavioral compatibility asks whether the program still behaves as expected. A migration can preserve one and break another, especially when code uses deprecated APIs, internal `sun.*` classes, reflection, serialization, or unspecified behavior.

Compile with an explicit target when maintaining an older runtime. Modern JDKs support `--release`, for example `javac --release 7 Example.java`, which checks both language level and public APIs available in that release.

<details><summary>Concept-wise interview questions and answers</summary>

<details><summary>Why are generics erased?</summary>

Java uses type erasure for source compatibility with pre-generics bytecode. Most generic type arguments are removed from runtime signatures, so `List<String>` and `List<Integer>` share the same raw runtime class. This is why `new T()` and `new List<String>[10]` are not generally allowed and why `instanceof List<String>` is illegal.

</details>

<details><summary>What is the difference between an enum and constants?</summary>

An enum is a type with a compiler-known finite set of instances. It can carry behavior and works naturally with `switch`. Integer constants have no type-level restriction and can accidentally accept unrelated values. Enum serialization and persistence still need an explicit strategy; storing `name()` is usually more stable than storing `ordinal()`.

</details>

<details><summary>What is the difference between `final`, effectively final, and immutable?</summary>

A `final` variable can be assigned once. An effectively-final variable is not declared `final` but is assigned only once, so Java can use it in a closure or resource statement. Neither word makes the referenced object immutable: a `final List` can still have elements added.

</details>

<details><summary>Why can a multi-catch parameter not be reassigned?</summary>

The parameter represents several possible exception types. Reassigning it would make its static type ambiguous and could weaken the compiler's flow analysis, so a multi-catch parameter is implicitly final.

</details>

<details><summary>How are suppressed exceptions different from the cause?</summary>

The cause explains why an exception was created or wrapped. A suppressed exception is an additional failure, commonly from closing a resource after the main body already failed. Use `getCause()` and `getSuppressed()` for different diagnostic questions.

</details>

<details><summary>When should `ExecutorService` be shut down?</summary>

When the application no longer accepts work from that executor, call `shutdown()` and wait for existing tasks. Use `shutdownNow()` only when interruption and cancellation are part of the design. A forgotten executor can keep non-daemon worker threads alive and prevent a process from exiting.

</details>

</details>
</details>

## References

[Java SE 5.0 overview](https://www.oracle.com/java/technologies/javase/j2se5.0.html) · [Java SE 8 language enhancements, including Java 7](https://docs.oracle.com/javase/8/docs/technotes/guides/language/enhancements.html) · [Java SE 7 compatibility](https://www.oracle.com/java/technologies/compatibility.html)
