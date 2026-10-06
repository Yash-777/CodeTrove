# Java Objects

An object is a runtime instance with identity, state, and behavior. A reference variable refers to an object; it is not the object itself. Multiple references can alias one mutable object, so mutation through one reference is visible through the others.

```java
var first = new StringBuilder("order");
var alias = first;
alias.append("-42");
System.out.println(first); // order-42
```

Use `equals` for logical equality and implement `hashCode` consistently for value types. `==` compares reference identity for objects. Objects are generally heap allocated, although JIT optimizations can eliminate some allocations when safe.

**Pitfalls:** aliasing can leak mutable state and create race conditions when objects are shared across threads. Prefer immutable values or defensive copies at API boundaries.

**Interview points:** explain reference equality versus value equality, object identity, and how shared mutability affects concurrency.

**Related:** [Classes](/content/tree/languages/java/core/oop/class), [Encapsulation](/content/tree/languages/java/core/oop/encapsulation), [JVM Memory](/content/tree/languages/java/core/jvm/jvm-memory).
