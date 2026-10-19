# Streams and Functional Java — Interview Q&A

<details><summary>What is the difference between a collection and a stream?</summary>

### Answer
A collection stores data; a stream describes a pipeline for processing data. Streams are lazy until a terminal operation runs, do not normally mutate the source, and can be sequential or parallel.

### Example
```java
List<Integer> result = numbers.stream()
    .filter(n -> n > 10)
    .map(n -> n * 2)
    .toList();
```

### Interviewer perspective
A stream is single-use. After a terminal operation, create a new stream. State whether an operation is intermediate or terminal and identify where side effects would make a pipeline unsafe.
</details>

<details><summary>What are intermediate and terminal operations?</summary>

### Answer
Intermediate operations such as `filter`, `map`, `sorted`, and `distinct` return a stream and are lazy. Terminal operations such as `collect`, `toList`, `reduce`, `count`, `findFirst`, and `forEach` trigger evaluation and produce a result or side effect.

### Example
```java
long count = names.stream()
    .filter(name -> name.startsWith("A"))
    .count();
```

### Interviewer perspective
Explain short-circuiting: `findFirst`, `anyMatch`, and `limit` can stop before consuming the entire source. Do not assume `sorted` can short-circuit because it generally needs all input.
</details>

<details><summary>Why do primitive streams exist?</summary>

### Answer
`IntStream`, `LongStream`, and `DoubleStream` avoid repeated boxing when processing primitive values. Convert with `boxed()` when an object stream is needed, and use `mapToInt`, `mapToLong`, or `mapToDouble` in the opposite direction.

### Example
```java
int[] values = {1, 2, 3};
List<Integer> boxed = IntStream.of(values).boxed().toList();
int[] primitive = boxed.stream().mapToInt(Integer::intValue).toArray();
```

### Interviewer perspective
`Stream<Integer>` is not equivalent in allocation cost to `IntStream`. Choose based on the data type and measure before claiming a performance improvement.
</details>

<details><summary>When should `toMap` use a merge function?</summary>

### Answer
`Collectors.toMap(keyMapper, valueMapper)` throws if two input elements produce the same key. A merge function defines how duplicate keys combine, such as keeping the first, keeping the last, or summing values.

### Example
```java
Map<String, Long> totals = orders.stream().collect(Collectors.toMap(
    Order::customerId,
    Order::amount,
    Long::sum
));
```

### Interviewer perspective
Ask whether duplicate keys indicate valid aggregation or bad input. A merge function can hide data errors if the business rule actually requires uniqueness.
</details>

<details><summary>When should `groupingBy` be used instead of `toMap`?</summary>

### Answer
Use `groupingBy` when one key naturally owns multiple values or when a downstream collector is needed. Use `toMap` when there should be one final value per key and collisions have an explicit merge rule.

### Example
```java
Map<String, List<Order>> byCustomer = orders.stream()
    .collect(Collectors.groupingBy(Order::customerId));

Map<String, Long> countByCustomer = orders.stream()
    .collect(Collectors.groupingBy(Order::customerId, Collectors.counting()));
```

### Interviewer perspective
Mention map choice, ordering, null keys, and memory usage. For a large data set, a grouping operation can materialize many lists and should be bounded or replaced with a database aggregation when appropriate.
</details>

<details><summary>How do you count duplicates in a stream?</summary>

### Answer
Group values by identity and count them, then filter counts greater than one. Preserve the distinction between duplicate values and duplicate object instances by defining the key.

### Example
```java
Map<String, Long> occurrences = values.stream()
    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
Map<String, Long> duplicates = occurrences.entrySet().stream()
    .filter(entry -> entry.getValue() > 1)
    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
```

### Interviewer perspective
Discuss case normalization, null handling, ordering, and whether counting should happen in SQL or a map when the input is large.
</details>

<details><summary>Are parallel streams always faster?</summary>

### Answer
No. Parallel streams use the common `ForkJoinPool`, divide work, and combine results. They can help with large, CPU-bound, associative operations, but overhead, contention, ordering, blocking I/O, shared mutable state, and small inputs can make them slower or incorrect.

### Example
```java
long total = values.parallelStream()
    .mapToLong(Item::cost)
    .sum();
```

### Interviewer perspective
Never use a parallel stream merely because the machine has many CPUs. Explain pool interference, ordering, thread safety, and benchmarking with production-like data.
</details>

<details><summary>What are Predicate, Function, Consumer, Supplier, and method references?</summary>

### Answer
`Predicate<T>` returns a boolean, `Function<T,R>` transforms a value, `Consumer<T>` performs an action, and `Supplier<T>` creates or supplies a value without input. A method reference such as `System.out::println` is shorthand for a compatible lambda.

### Example
```java
Predicate<Integer> positive = n -> n > 0;
Function<User, String> name = User::name;
Consumer<String> print = System.out::println;
Supplier<Instant> clock = Instant::now;
```

### Interviewer perspective
Ask whether the lambda is pure, whether it can throw, and whether it captures mutable state. Side effects inside `map` or `filter` make reasoning and parallel execution harder.
</details>

## References

- [Stream API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html)
- [Collectors API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Collectors.html)
- [Functional interfaces](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/package-summary.html)
