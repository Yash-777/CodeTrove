# Java SE Fundamentals — Interview Q&A

<details><summary>What is the difference between widening and narrowing primitive casts?</summary>

### Answer
Widening converts a smaller range to a larger range, such as `int` to `long` or `float` to `double`, and normally happens implicitly. Narrowing converts a larger type to a smaller type and requires an explicit cast because precision or range can be lost. The common widening order is `byte → short → int → long → float → double`; `char` participates in numeric promotion but is an unsigned UTF-16 code unit.

### Example
```java
int count = 42;
double wide = count;       // implicit widening
 double price = 42.9;
int narrow = (int) price;   // 42: fractional part is discarded
```

### Interviewer perspective
Ask what happens with overflow: `(byte) 130` wraps according to two's-complement conversion rather than throwing. Also distinguish primitive casts from reference casts; `Dog` to `Animal` is upcasting, while `Animal` to `Dog` needs a runtime-safe check.
</details>

<details><summary>What are upcasting, downcasting, boxing, and unboxing?</summary>

### Answer
Upcasting assigns a child object to a parent reference and is safe. Downcasting narrows a reference and can throw `ClassCastException` unless the object really has that runtime type. Boxing wraps a primitive in its wrapper type; unboxing extracts the primitive and can throw `NullPointerException` when the wrapper is `null`.

### Example
```java
Animal value = new Dog();       // upcast
Dog dog = (Dog) value;           // safe here
Integer boxed = 10;              // boxing
int number = boxed;              // unboxing
```

### Interviewer perspective
Mention `instanceof` before a downcast and explain that `Integer a = 127; Integer b = 127;` may compare with `==` because of caching, but object identity is not value equality. Use `equals` for wrapper values.
</details>

<details><summary>How are `if`, the ternary operator, and `switch` different?</summary>

### Answer
`if` handles arbitrary boolean expressions, ranges, and compound conditions. The ternary operator is an expression for choosing between two values and should stay readable. `switch` compares one selector with fixed case labels and is clearer for enums, strings, and discrete values. Traditional `switch` can fall through without `break`; switch expressions can return a value and use `yield` in block cases.

### Example
```java
String grade = marks >= 90 ? "A" : marks >= 75 ? "B" : "C";
String label = switch (status) {
    case ACTIVE -> "ready";
    case BLOCKED -> "stop";
    default -> "unknown";
};
```

### Interviewer perspective
Explain why a range check belongs in `if`, why `switch` on a `null` selector fails unless handled first, and why nested ternaries are often a readability defect.
</details>

<details><summary>How do arrays and lists differ?</summary>

### Answer
An array has a fixed length and can store primitives or references. A `List` is a collection of references with an API for adding, removing, searching, and resizing. `array.length` is a field; `list.size()` is a method. `Arrays.asList(array)` creates a fixed-size list backed by an object array and is not a general-purpose mutable `ArrayList`.

### Example
```java
int[] values = {3, 1, 2};
Arrays.sort(values);
List<Integer> mutable = new ArrayList<>(List.of(3, 1, 2));
mutable.add(4);
```

### Interviewer perspective
Call out the primitive-array trap: `Arrays.asList(new int[]{1, 2})` produces a one-element list containing the `int[]`. Use `IntStream.of(values).boxed().toList()` or an explicit loop when a `List<Integer>` is required.
</details>

<details><summary>What did Java 8 add that commonly appears in interviews?</summary>

### Answer
Java 8 introduced lambdas, functional interfaces, the Stream API, `Optional`, default and static interface methods, `java.time`, improved `Map` methods, Base64, and parallel array sorting. These features reduce boilerplate, but they do not automatically make code faster or safer.

### Example
```java
Map<String, Integer> counts = new HashMap<>();
counts.merge("java", 1, Integer::sum);
String encoded = Base64.getEncoder().encodeToString("hi".getBytes());
LocalDate today = LocalDate.now();
```

### Interviewer perspective
Separate language syntax from library APIs and explain that `Optional` is primarily a return-type communication tool, not a field replacement or a guarantee that null disappears.
</details>

<details><summary>What is a functional interface?</summary>

### Answer
A functional interface has exactly one abstract method. It can have any number of default and static methods. A lambda is compatible with its target functional-interface type, such as `Predicate<T>`, `Function<T,R>`, `Consumer<T>`, `Supplier<T>`, or `Comparator<T>`.

### Example
```java
@FunctionalInterface
interface Validator<T> { boolean isValid(T value); }
Validator<String> nonEmpty = text -> !text.isBlank();
```

### Interviewer perspective
The target type matters: a lambda is not an untyped function value in Java. Explain checked exceptions, captured variables needing to be effectively final, and why method references are only shorthand for compatible lambdas.
</details>

<details><summary>How should `Optional` be used?</summary>

### Answer
`Optional<T>` represents a value that may be present. `of` rejects null, `ofNullable` accepts null by producing an empty value, and `orElse`, `orElseGet`, `map`, and `flatMap` express fallback and transformation. Calling `get()` on an empty value throws `NoSuchElementException`.

### Example
```java
String displayName = Optional.ofNullable(user)
    .map(User::name)
    .filter(name -> !name.isBlank())
    .orElse("Guest");
```

### Interviewer perspective
`orElse` evaluates its fallback eagerly; use `orElseGet` when fallback work is expensive. Avoid `Optional` for entity fields, serialization models, and method parameters unless a framework contract specifically supports it.
</details>

<details><summary>Why are `java.time` classes preferred over `Date` and `Calendar`?</summary>

### Answer
The `java.time` API uses immutable, thread-safe value types such as `Instant`, `LocalDate`, `LocalDateTime`, `ZonedDateTime`, and `Duration`. A `LocalDateTime` has no time-zone meaning, while an `Instant` represents a point on the UTC timeline.

### Example
```java
Instant createdAt = Instant.now();
ZonedDateTime inIndia = createdAt.atZone(ZoneId.of("Asia/Kolkata"));
```

### Interviewer perspective
Ask which type belongs in a database or event payload. Usually store an `Instant` or an offset-aware value, and use a `ZoneId` only when the user's civil-time zone matters.
</details>

<details><summary>What are varargs and what restriction do they have?</summary>

### Answer
Varargs let a method accept zero or more arguments of one type. The compiler represents them as an array, so the varargs parameter must be the last parameter and there can be only one. Generic varargs can create heap-pollution warnings.

### Example
```java
static int total(int first, int... rest) {
    return first + Arrays.stream(rest).sum();
}
```

### Interviewer perspective
Overloads involving `null` and varargs can be ambiguous. Prefer a collection parameter when the API needs a named, validated set of values or when exposing varargs would create confusing overload resolution.
</details>

## References

- [JLS type conversions](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html)
- [Optional API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html)
- [java.time API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/package-summary.html)
