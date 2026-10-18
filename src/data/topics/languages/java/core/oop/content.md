# Object-Oriented Programming in Java

Object-oriented programming organizes software around objects that combine state and behavior. In Java, a class defines a type, an object is an instance, and methods express behavior. The dedicated [Class & Object lesson](/content/tree/languages/java/core/oop/class-object) and [Interface & Abstract Class lesson](/content/tree/languages/java/core/oop/interface-abstract-class) cover those building blocks in detail. This page focuses on the design principles that use them.

## The remaining core principles

- **Encapsulation:** protect state behind a small, valid public API. Keep fields private and let methods enforce rules such as “balance cannot become negative.”
- **Inheritance:** use `extends` when a subtype truly satisfies the parent type's contract. Java allows one direct superclass.
- **Polymorphism:** write code against a parent type or interface and let the runtime select the appropriate override.

```java
interface Notifier {
    void send(String message);
}

final class EmailNotifier implements Notifier {
    @Override
    public void send(String message) {
        System.out.println("Email: " + message);
    }
}

final class AlertService {
    private final Notifier notifier;

    AlertService(Notifier notifier) {
        this.notifier = notifier;
    }

    void alert(String message) {
        notifier.send(message); // polymorphic call
    }
}
```

`AlertService` is coupled to the `Notifier` contract, not to `EmailNotifier`. A different implementation can be supplied without changing the service. This also makes testing easier because a test double can implement the same interface.

## Prefer composition when it communicates ownership better

Inheritance reuses a type relationship, but it also couples the child to assumptions in the parent. Composition stores collaborators as fields and delegates work to them. Prefer composition when the relationship is “uses a” rather than “is a,” or when the lifecycle and behavior should remain independent.

## Questions to ask during design

1. Which state must remain valid at all times?
2. Which operations are part of the public contract?
3. Is the relationship genuinely an `is-a` relationship, or would a field be clearer?
4. Can the caller depend on an interface rather than a concrete class?
5. Would a value object or record express the data more clearly than a mutable entity?

## Related lessons

- [Class & Object](/content/tree/languages/java/core/oop/class-object)
- [Interface & Abstract Class](/content/tree/languages/java/core/oop/interface-abstract-class)
- [Encapsulation](/content/tree/languages/java/core/oop/encapsulation)
- [Inheritance](/content/tree/languages/java/core/oop/inheritance)
- [Polymorphism](/content/tree/languages/java/core/oop/polymorphism)

References: [dev.java Object-Oriented Programming](https://dev.java/learn/oop/) and [Oracle Object-Oriented Programming Concepts](https://docs.oracle.com/javase/tutorial/java/concepts/index.html).
