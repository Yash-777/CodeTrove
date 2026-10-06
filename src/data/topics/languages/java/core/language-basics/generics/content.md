# Java Generics

Generics parameterize classes, interfaces, and methods to provide compile-time type safety and reduce casts. Java implements most generics with type erasure, so parameterized type arguments are generally unavailable at runtime.

```java
static <T> T first(List<T> values) {
	if (values.isEmpty()) throw new NoSuchElementException();
	return values.get(0);
}
```

Use `? extends T` when reading from a producer and `? super T` when writing to a consumer (PECS). `List<Integer>` is not a subtype of `List<Number>`, despite `Integer` extending `Number`.

**Pitfalls:** raw types, unchecked casts, generic arrays, and expecting `new T()` or `instanceof List<String>` to work after erasure.

**Interview points:** explain erasure, bounds, wildcards, and why `List<? extends Number>` can safely produce `Number` values but cannot accept an arbitrary `Number`.

**Related:** [Collections](/content/tree/languages/java/core/language-basics/collections), [Streams](/content/tree/languages/java/core/language-basics/streams).
