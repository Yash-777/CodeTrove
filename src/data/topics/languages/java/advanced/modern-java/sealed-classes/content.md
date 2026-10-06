# Sealed Classes

Sealed classes and interfaces restrict which types may extend or implement them. The permits list makes a domain hierarchy explicit and enables exhaustive pattern matching when all permitted cases are known.

```java
sealed interface Result permits Success, Failure {}
record Success(String value) implements Result {}
record Failure(String message) implements Result {}
```

Permitted implementations must follow Java's `final`, `sealed`, or `non-sealed` rules. Sealing is useful for closed domain models, protocol states, and compiler-checked case handling; it is less suitable for extension points intended for external implementations.

**Trade-offs:** a closed set improves safety but makes adding implementations an intentional API change. Consider module and package constraints when defining permitted subclasses.

**Interview points:** compare sealed types with enums and open interfaces, and explain how sealed hierarchies help exhaustive switches.

**Related:** [Pattern Matching](/content/tree/languages/java/advanced/modern-java/pattern-matching), [Polymorphism](/content/tree/languages/java/core/oop/polymorphism).
