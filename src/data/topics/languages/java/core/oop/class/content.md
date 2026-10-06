# Java Classes

A class defines a type's state, behavior, constructors, and access rules. It is a blueprint; an object is a runtime instance. Classes should protect invariants and keep related data and behavior together.

```java
final class Money {
	private final long cents;
	Money(long cents) { this.cents = cents; }
	long cents() { return cents; }
}
```

Prefer cohesive classes, explicit construction, and narrow visibility. `final` prevents subclassing or reassignment, but does not make referenced objects immutable. Use a record for simple data carriers when its value semantics fit.

**Trade-offs:** inheritance can reuse behavior but couples subclasses to base-class assumptions; composition usually makes dependencies more explicit. Avoid turning classes into unrelated utility buckets.

**Interview points:** distinguish a class from an object and a record, explain identity versus value, and describe how constructors and visibility preserve invariants.

**Related:** [Objects](/content/tree/languages/java/core/oop/object), [Encapsulation](/content/tree/languages/java/core/oop/encapsulation), [Records](/content/tree/languages/java/core/language-basics/records).
