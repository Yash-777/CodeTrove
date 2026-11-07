# Java 8–17: functional style and modern language design

Java 8 changed everyday Java more than any release since Java 5. Lambdas, method references, default interface methods, streams, `Optional`, and `java.time` made APIs more expressive. Java 9–17 then added modules, local type inference, switch expressions, text blocks, records, pattern matching, and sealed classes.

This page groups releases by the concepts developers use in real applications. Preview features are called out because preview syntax must be enabled explicitly and may change before becoming permanent.

---

Java 8 is still a common compatibility baseline for libraries and enterprise systems. Java 11 and Java 17 are long-term-support milestones in many production environments. Java 9–16 introduced the language and runtime steps that culminated in the permanent records, pattern matching, and sealed-class features of Java 16–17.

<details open><summary>Java version - list all the feature in detail with examples</summary>

## Java 8

### Lambda expressions and functional interfaces

A lambda is an implementation of a functional interface: an interface with one abstract method. It lets behavior be passed as a value.

```java
List<String> names = Arrays.asList("Mina", "Ada", "Lin");
names.sort((left, right) -> left.compareToIgnoreCase(right));
names.forEach(name -> System.out.println(name));
```

Use standard interfaces such as `Predicate<T>` for a boolean test, `Function<T,R>` for a transformation, `Consumer<T>` for an action, and `Supplier<T>` for lazy creation:

```java
Predicate<String> longName = name -> name.length() >= 4;
Function<String, String> normalized = String::trim;
System.out.println(longName.test(normalized.apply(" Ada ")));
```

A lambda captures local variables only when they are final or effectively final. It does not create a new scope with a new `this`; `this` refers to the enclosing object.

### Method references

A method reference is shorthand when an existing method already has the required shape:

```java
names.stream()
     .map(String::toUpperCase)
     .forEach(System.out::println);
```

The four common forms are `Type::staticMethod`, `object::instanceMethod`, `Type::instanceMethod`, and `Type::new`.

### Default and static interface methods

Interfaces can provide default behavior without forcing every existing implementation to add a method. This supports compatible API evolution:

```java
interface Auditable {
    default String auditLabel() {
        return "unclassified";
    }

    static boolean valid(String value) {
        return value != null && !value.isBlank();
    }
}
```

If two interfaces provide the same default method, the implementing class must resolve the conflict, often with `InterfaceName.super.method()`. Static interface methods are called through the interface name and are not inherited by implementing classes.

### Streams: a pipeline, not a collection

A stream describes a computation over a source. Intermediate operations such as `filter` and `map` are lazy; a terminal operation such as `collect`, `count`, or `reduce` starts the pipeline.

```java
Map<String, Long> counts = names.stream()
    .map(String::toLowerCase)
    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
```

Streams do not automatically make code faster. Parallel streams use a shared pool by default and can be harmful for blocking I/O, small inputs, shared mutable state, or order-sensitive work.

### `Optional`

`Optional<T>` models a value that may be absent at an API boundary. It is most useful as a return type, not as every field or method parameter:

```java
Optional<String> findUserName(long id) {
    return id == 7 ? Optional.of("Ada") : Optional.empty();
}

String display = findUserName(7).orElse("Guest");
```

Prefer `map`, `flatMap`, `filter`, `orElseGet`, and `orElseThrow` over calling `get()` without checking. `orElse` evaluates its argument immediately; `orElseGet` evaluates lazily.

### `java.time`: immutable date and time

The Java 8 time API is immutable and thread-safe. Choose the type according to the domain:

```java
LocalDate birthday = LocalDate.of(1990, 5, 12);
Instant eventTime = Instant.now();
ZonedDateTime inLondon = eventTime.atZone(ZoneId.of("Europe/London"));
DateTimeFormatter format = DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm z");
System.out.println(format.format(inLondon));
```

Use `LocalDate` for a date without a zone, `Instant` for a machine timestamp, and `ZonedDateTime` when a named time zone is part of the business meaning. A time zone is not the same as a fixed offset; daylight-saving transitions make the distinction important.

### Repeating/type annotations and improved inference

Java 8 allows annotations on type uses and supports repeating annotations. It also improves target typing for generic method calls and provides method-parameter reflection when code is compiled with `javac -parameters`.

### Interface and collection API improvements

Interfaces such as `Comparator`, `Collection`, `Map`, and `Iterable` gained default methods including `sort`, `removeIf`, `stream`, `forEach`, `computeIfAbsent`, and `merge`:

```java
Map<String, Integer> visits = new HashMap<>();
visits.merge("/home", 1, Integer::sum);
visits.computeIfAbsent("/docs", key -> 0);
```

### CompletableFuture

`CompletableFuture` composes asynchronous stages:

```java
CompletableFuture.supplyAsync(() -> loadUser())
    .thenApply(User::email)
    .thenAccept(this::sendEmail)
    .exceptionally(error -> { log(error); return null; });
```

The default executor is not always appropriate for blocking work. Supply an executor when workload isolation matters.

## Java 9

### The Java Platform Module System

A module is a named component that declares dependencies and exported packages. A minimal `module-info.java` looks like this:

```java
module com.example.orders {
    requires java.sql;
    exports com.example.orders.api;
}
```

`exports` controls compile-time and runtime access to public types. `opens` grants reflective access to a package, which is often needed by serialization or dependency-injection frameworks. A module can require another module without exporting its own internal packages.

Java 9 also added private interface methods, improved try-with-resources, `List.of`/`Set.of`/`Map.of`, the HTTP/2-oriented incubating HTTP client, and a modular runtime-image model.

## Java 10

### Local variable type inference with `var`

`var` asks the compiler to infer the local variable's static type from a non-null initializer:

```java
var names = List.of("Ada", "Lin"); // inferred type: List<String>
var stream = names.stream();        // inferred type: Stream<String>
```

`var` is not dynamic typing. It cannot be used for fields, method parameters, return types, or a variable without an initializer. Use it when the initializer makes the type obvious; avoid it when the type is important to understand the code.

Java 10 also introduced container-aware garbage collection improvements and application class-data sharing enhancements.

## Java 11

Java 11 made local-variable syntax available in implicitly typed lambda parameters:

```java
(var left, var right) -> left.compareToIgnoreCase(right)
```

The same lambda must use `var` consistently if annotations are needed. Java 11 also finalized the standard HTTP Client:

```java
HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder(URI.create("https://example.com"))
    .GET()
    .build();
HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
```

Other useful additions include `String.isBlank`, `lines`, `strip`, `repeat`, `Files.readString`, and `Files.writeString`. Java 11 removed or deprecated several older Java EE and CORBA modules from the JDK, so applications should declare replacement dependencies explicitly.

## Java 12–14

### Switch expressions

Switch expressions return a value and arrow labels avoid accidental fall-through:

```java
int days = switch (month) {
    case 1, 3, 5, 7, 8, 10, 12 -> 31;
    case 4, 6, 9, 11 -> 30;
    case 2 -> 28;
    default -> throw new IllegalArgumentException("month");
};
```

When a block needs multiple statements, use `yield`:

```java
String label = switch (status) {
    case 200 -> "ok";
    case 404 -> { logMissing(); yield "missing"; }
    default -> "other";
};
```

Switch expressions became permanent in Java 14. Pattern matching for `instanceof`, records, and text blocks began as preview features in Java 13–14.

## Java 15–16

### Text blocks

Text blocks make multiline JSON, SQL, HTML, and test fixtures easier to read:

```java
String json = """
    {
      "name": "Ada",
      "active": true
    }
    """;
```

The compiler normalizes incidental indentation. Use `\\s` when trailing whitespace is significant and use `stripIndent` or `translateEscapes` when formatting needs to be explicit.

### Records

A record is a compact data carrier. The compiler supplies accessors, a canonical constructor, `equals`, `hashCode`, and `toString`:

```java
record User(String name, int age) {
    User {
        if (age < 0) throw new IllegalArgumentException("age must be non-negative");
        name = name.trim();
    }
}
```

Records are shallowly immutable. A record component that refers to a mutable list does not copy or freeze that list automatically. Records cannot extend another class, but they can implement interfaces.

### Pattern matching for `instanceof`

Pattern matching combines the type test and cast:

```java
if (value instanceof String text && !text.isBlank()) {
    System.out.println(text.length());
}
```

The pattern variable is available only where the compiler can prove the match succeeded. This is flow scoping, not an unchecked cast.

## Java 17

### Sealed classes and interfaces

A sealed type lists the permitted direct subtypes:

```java
sealed interface Payment permits CardPayment, CashPayment {}
record CardPayment(String lastFour) implements Payment {}
record CashPayment(int cents) implements Payment {}
```

A permitted subtype must be `final`, `sealed`, or `non-sealed`. Sealing documents and enforces a controlled hierarchy, which becomes especially useful with pattern matching and exhaustive switches.

Java 17 also made strong encapsulation of JDK internals the default, added enhanced pseudo-random number generators, finalized pattern matching for `instanceof` and records, and continued improvements to the JVM, garbage collectors, and foreign-function work.

## Migration advice from Java 8 to 17

- Replace `Date`, `Calendar`, and `SimpleDateFormat` with the appropriate `java.time` type.
- Prefer `List.of` and unmodifiable factories when a collection should not be mutated.
- Use streams for clear data transformations, not as a mandatory replacement for every loop.
- Check reflective frameworks against modules and strong encapsulation.
- Compile with `--release 8` when producing Java 8-compatible artifacts; do not rely only on `-source` and `-target`.
- Test time-zone behavior, serialization, TLS defaults, garbage collection, and illegal reflective access during migration.

<details><summary>Concept-wise interview questions and answers</summary>

<details><summary>Is a lambda an object?</summary>

A lambda expression is converted to an instance of a target functional-interface type. It is not a class declaration and it has no independent target type without context. The compiler and runtime use an invokedynamic-based mechanism to create the functional object.

</details>

<details><summary>What is the difference between `map` and `flatMap`?</summary>

`map` transforms one value into one value, so a function returning `Optional<Address>` creates `Optional<Optional<Address>>` if used directly. `flatMap` applies a function that already returns a container and flattens one level. It is used to compose operations that may be absent or asynchronous.

</details>

<details><summary>Why are streams single-use?</summary>

A stream represents a traversal and computation pipeline over a source. After a terminal operation consumes it, its state cannot safely be reused. Create a new stream from the source for another traversal.

</details>

<details><summary>When should `Optional` not be used?</summary>

Avoid it for fields that complicate serialization, for method parameters where overloads or validation are clearer, and for collections where an empty collection already expresses absence. Do not call `get()` as a disguised null check.

</details>

<details><summary>What does `var` change at runtime?</summary>

Nothing. `var` is compile-time local-variable type inference. The bytecode still contains the inferred static type, and Java remains statically typed.

</details>

<details><summary>What is the difference between a record and an immutable class?</summary>

A record provides a standardized representation for shallowly immutable data with generated members and strong restrictions on inheritance. An immutable class can choose different invariants, defensive copying, caching, inheritance rules, and method names. A record is not automatically deeply immutable.

</details>

<details><summary>What problem do sealed classes solve?</summary>

They restrict who can extend or implement a type. This makes a domain model explicit, allows compilers to reason about an exhaustive hierarchy, and prevents accidental extension. It is not the same as making every object immutable.

</details>

<details><summary>What is the difference between `exports` and `opens` in a module?</summary>

`exports` makes public types accessible to ordinary compiled code. `opens` permits deep reflection on a package, usually for frameworks, without making the package part of the normal compile-time API. An `opens` package is not automatically exported.

</details>

<details><summary>Why can parallel streams be slower?</summary>

Parallel execution adds splitting, scheduling, merging, synchronization, and thread-management costs. It can also contend for the common pool or block worker threads. Measure with representative data and use a dedicated executor when the workload requires isolation.

</details>

</details>
</details>

## References

[Oracle Java language enhancements](https://docs.oracle.com/javase/8/docs/technotes/guides/language/enhancements.html) · [Oracle Java language changes by release](https://docs.oracle.com/en/java/javase/25/language/java-language-changes-release.html) · [Oracle Java language changes summary](https://docs.oracle.com/en/java/javase/25/language/java-language-changes-summary.html) · [Java 8 `java.time` API](https://docs.oracle.com/javase/8/docs/api/java/time/package-summary.html)
