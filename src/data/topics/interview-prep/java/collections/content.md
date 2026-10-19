# Collections, Maps, and Comparators — Interview Q&A

<details><summary>How do `List`, `Set`, `Queue`, and `Map` differ?</summary>

### Answer
A `List` is ordered and permits duplicates. A `Set` models uniqueness. A `Queue` models processing order, such as FIFO or priority order. A `Map` associates keys with values and does not implement `Collection`.

### Example
```java
List<String> ordered = new ArrayList<>();
Set<String> unique = new HashSet<>();
Deque<String> work = new ArrayDeque<>();
Map<String, Integer> counts = new HashMap<>();
```

### Interviewer perspective
State the required semantics before naming an implementation. Ask whether ordering, duplicate handling, nulls, thread safety, lookup complexity, and memory cost matter.
</details>

<details><summary>When would you choose ArrayList, LinkedList, HashSet, LinkedHashSet, or TreeSet?</summary>

### Answer
`ArrayList` is the default list for indexed access and append-heavy work. `LinkedList` is rarely the best choice; a `Deque` is clearer for queue operations. `HashSet` provides hash-based uniqueness without order. `LinkedHashSet` preserves insertion order. `TreeSet` maintains sorted order using natural ordering or a comparator.

### Example
```java
Set<String> insertionOrder = new LinkedHashSet<>(List.of("b", "a", "b"));
Set<String> sorted = new TreeSet<>(insertionOrder);
```

### Interviewer perspective
Do not claim `HashSet` has a useful order. Explain that `TreeSet` uses comparison to determine equality, so an inconsistent comparator can make distinct objects disappear.
</details>

<details><summary>How do HashMap, LinkedHashMap, and TreeMap differ?</summary>

### Answer
`HashMap` provides expected constant-time lookup with no ordering guarantee. `LinkedHashMap` adds predictable insertion or access order. `TreeMap` keeps keys sorted and has logarithmic navigation operations. All are unsynchronized by default.

### Example
```java
Map<String, Integer> cache = new LinkedHashMap<>(16, .75f, true);
cache.put("a", 1); // access-order map can support simple LRU behavior
```

### Interviewer perspective
A `HashMap` is not a cache by itself. Discuss eviction, concurrency, capacity, load factor, and whether a production cache should use a dedicated bounded cache implementation.
</details>

<details><summary>What is fail-fast iteration?</summary>

### Answer
Many ordinary collection iterators detect structural modification after iterator creation and throw `ConcurrentModificationException`. This is a best-effort bug detector, not a synchronization guarantee. It does not mean every concurrent modification will be detected.

### Example
```java
for (String value : values) {
    if (value.isBlank()) values.remove(value); // unsafe
}
values.removeIf(String::isBlank);              // supported operation
```

### Interviewer perspective
Use `Iterator.remove`, `removeIf`, a copy, or a concurrent collection depending on the requirement. Do not catch `ConcurrentModificationException` as a normal control-flow mechanism.
</details>

<details><summary>Why does ConcurrentHashMap reject null keys and values?</summary>

### Answer
A concurrent map must let `get(key) == null` mean that no mapping is present. Allowing null values would make “absent” indistinguishable from “mapped to null” during concurrent operations. `ConcurrentHashMap` supports concurrent access with fine-grained coordination rather than one global application lock.

### Example
```java
ConcurrentHashMap<String, Long> counts = new ConcurrentHashMap<>();
counts.merge("java", 1L, Long::sum);
```

### Interviewer perspective
It is thread-safe for its documented operations, but a compound check-then-act sequence still needs an atomic map method or external coordination. It is not a replacement for a transaction.
</details>

<details><summary>What are `List.of` and `Arrays.asList` differences?</summary>

### Answer
`List.of` creates an unmodifiable list and rejects null elements. `Arrays.asList` creates a fixed-size, array-backed list: `set` works, but `add` and `remove` throw `UnsupportedOperationException`. Wrap either in `new ArrayList<>(...)` when mutation is required.

### Example
```java
List<String> immutable = List.of("a", "b");
List<String> fixed = Arrays.asList("a", "b");
List<String> mutable = new ArrayList<>(fixed);
```

### Interviewer perspective
Mention that unmodifiable does not necessarily mean deeply immutable: a mutable object stored inside the list can still change.
</details>

<details><summary>What is the difference between Comparable and Comparator?</summary>

### Answer
`Comparable<T>` defines a type's natural ordering through `compareTo`. `Comparator<T>` defines an external ordering and supports multiple views, such as name order and salary order. Comparators should be transitive and consistent with equality where sorted collections depend on them.

### Example
```java
Comparator<Employee> bySalaryThenName = Comparator
    .comparingInt(Employee::salary)
    .thenComparing(Employee::name);

employees.sort(bySalaryThenName.reversed());
```

### Interviewer perspective
A comparator returning `a.getId() - b.getId()` can overflow. Use `Comparator.comparingInt`. Explain that returning zero in a `TreeSet` means “same according to this ordering,” not necessarily `equals`.
</details>

## References

- [Collections Framework overview](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/doc-files/coll-overview.html)
- [HashMap API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)
- [ConcurrentHashMap API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html)
- [Comparator API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html)
