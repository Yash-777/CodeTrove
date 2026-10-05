# Functional Programming in Java

Functional programming emphasizes values, functions, composition, and avoiding unintended mutation. Java supports this style through lambdas, functional interfaces, streams, and immutable data types; it remains interoperable with object-oriented design.

```java
var activeNames = users.stream()
	.filter(User::isActive)
	.map(User::name)
	.toList();
```

Use pure transformations for logic that benefits from local reasoning and testing. Keep side effects at clear boundaries such as persistence, messaging, or HTTP calls. Streams are lazy until a terminal operation and should not be used to obscure simple control flow.

**Trade-offs:** immutable pipelines can simplify concurrency but may allocate intermediate values or become difficult to debug when over-chained.

**Interview points:** explain side effects, referential transparency, composition, and why parallel streams are not automatically faster or appropriate for blocking I/O.

**Related:** [Streams](/content/tree/languages/java/core/language-basics/streams), [Collections](/content/tree/languages/java/core/language-basics/collections), [CompletableFuture](/content/tree/languages/java/core/concurrency/completable-future).
