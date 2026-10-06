# Polymorphism

Polymorphism lets code use a shared type while runtime implementations provide different behavior. Overridden instance methods use dynamic dispatch. Overloading is different: the compiler chooses a method using declared argument types.

```java
interface Notifier { void send(String message); }
void alert(Notifier notifier) { notifier.send("ready"); }
```

This supports interchangeable implementations and avoids type-switch logic. Implementations should honor the shared contract's preconditions and postconditions (the Liskov Substitution Principle). Prefer composition when inheritance would expose fragile assumptions.

**Trade-offs:** polymorphism improves extensibility but can make control flow harder to trace when implementations proliferate. Use it where variation is real, not to replace every conditional.

**Interview points:** contrast compile-time overloading with runtime overriding and explain substitutability with a concrete example.

**Related:** [Abstraction](/content/tree/languages/java/core/oop/abstraction), [Classes](/content/tree/languages/java/core/oop/class).
