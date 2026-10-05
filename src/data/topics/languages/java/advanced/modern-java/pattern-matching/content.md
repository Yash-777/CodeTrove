# Pattern Matching in Java

Pattern matching combines a type or structural test with extraction of the matched value, reducing repetitive casts and making branching clearer. Modern Java supports type patterns for `instanceof` and pattern matching in `switch` (available in current LTS-era JDKs).

```java
if (value instanceof String text) {
	return text.strip();
}
```

Pattern variables are in scope only where the compiler can prove the match succeeded. Switch pattern matching can improve exhaustive handling when paired with sealed hierarchies, but null behavior and guards must be explicit.

**Pitfalls:** assuming syntax is supported by the project's configured source level, and building deeply nested patterns that are harder to understand than ordinary methods.

**Interview points:** explain flow-scoped variables, exhaustive switches, and how language level is controlled by build configuration.

**Related:** [Sealed Classes](/content/tree/languages/java/advanced/modern-java/sealed-classes), [Polymorphism](/content/tree/languages/java/core/oop/polymorphism).
