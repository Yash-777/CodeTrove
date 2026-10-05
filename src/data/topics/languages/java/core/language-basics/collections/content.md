# Java Collections

The Collections Framework provides standard interfaces and implementations for common data structures. Choose according to lookup patterns, ordering, uniqueness, concurrency needs, and expected scale.

- `ArrayList`: fast indexed access and append; middle insertion shifts elements.
- `HashMap` / `HashSet`: average constant-time lookup with correct `equals` and `hashCode`.
- `TreeMap` / `TreeSet`: sorted values with logarithmic operations.
- `ArrayDeque`: efficient queue and stack operations.

```java
Map<String, Integer> counts = new HashMap<>();
counts.merge("api", 1, Integer::sum);
```

Most standard collections are not thread-safe. `ConcurrentHashMap` protects individual operations, not a multi-step business invariant. Use immutable snapshots or explicit synchronization when needed.

**Interview points:** cover hashing, collisions, resizing, iteration ordering, fail-fast iterators, and complexity assumptions.

**Related:** [Generics](/content/tree/languages/java/core/language-basics/generics), [Synchronization](/content/tree/languages/java/core/concurrency/synchronization).
