# Java: Interface & Abstract Class

An **interface** describes a contract: what an implementing type can do. An **abstract class** is a partially implemented class that cannot be instantiated directly. Both support abstraction, but they solve different design problems.

## Interface: a behavior contract

```java
interface Payable {
    Receipt pay(int cents);

    default String currency() {
        return "INR";
    }
}

final class CardPayment implements Payable {
    @Override
    public Receipt pay(int cents) {
        return new Receipt(cents, currency());
    }
}

record Receipt(int cents, String currency) { }
```

A class that implements an interface must provide the required methods unless the class is abstract. Interface fields are implicitly `public static final`; interface methods can be abstract, default, static, or private according to the Java version and declaration rules. A class can implement multiple interfaces:

```java
final class OnlinePayment implements Payable, java.io.Serializable { }
```

Interfaces are useful when unrelated classes share a capability or when callers should depend on a stable contract rather than one implementation.

## Abstract class: shared base behavior

```java
abstract class Shape {
    protected final String color;

    protected Shape(String color) {
        this.color = color;
    }

    protected abstract double area();

    public String description() {
        return color + " shape with area " + area();
    }
}

final class Circle extends Shape {
    private final double radius;

    Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }

    @Override
    protected double area() {
        return Math.PI * radius * radius;
    }
}
```

`Shape` cannot be instantiated because it is abstract. It can contain constructors, instance fields, static fields, concrete methods, and abstract methods. A concrete subclass must implement every inherited abstract method or remain abstract.

## Interface versus abstract class

| Question | Interface | Abstract class |
|---|---|---|
| Main purpose | Define a capability or contract. | Share a common base type and implementation. |
| Can it be instantiated? | No. | No. |
| Can it have instance fields? | No ordinary mutable instance fields; fields are `public static final`. | Yes, including `private`, `protected`, and mutable fields. |
| Can it contain implemented behavior? | Yes: default, static, and private methods have rules-based implementations. | Yes, any concrete method permitted to a class. |
| How many can a class use? | A class can implement multiple interfaces. | A class can extend only one class. |
| Does it have a constructor? | No constructor for interface instances. | Yes; subclasses call it with `super(...)`. |
| Best fit | Shared behavior contract across unrelated types. | Closely related types that share state and implementation. |

These features are not mutually exclusive. A common design is an abstract class that implements an interface and leaves some methods abstract for concrete subclasses.

## Calling through the abstraction

```java
static void printReceipt(Payable payment) {
    Receipt receipt = payment.pay(500);
    System.out.println(receipt);
}

printReceipt(new CardPayment());
```

The caller knows only `Payable`. The concrete class can change from `CardPayment` to `BankTransfer` without changing `printReceipt`. This is polymorphism: the interface reference can refer to different implementing objects.

## Common questions

### Can an abstract class implement an interface?

Yes. It may implement all, some, or none of the interface methods. If any required method remains unimplemented, the abstract class is allowed to remain abstract. A concrete descendant must complete the contract.

### Can an interface extend another interface?

Yes. An interface may extend one or more interfaces:

```java
interface Auditable { void audit(); }
interface SecurePayable extends Payable, Auditable { }
```

A class still extends at most one class, whether that superclass is abstract or concrete.

### Can an abstract class have a `main` method?

Yes. `main` is a static method, so the launcher can call it through the class even though the class cannot be instantiated. An interface can also declare static methods, but those are utility methods on the interface and are not inherited as instance methods.

### What happens if two interfaces have the same default method?

The implementing class must resolve the conflict by overriding the method, or it can explicitly call one parent default when the language rules allow it:

```java
interface A { default String name() { return "A"; } }
interface B { default String name() { return "B"; } }

class C implements A, B {
    @Override
    public String name() {
        return A.super.name();
    }
}
```

### When should I choose each?

Choose an interface when the important idea is a capability or contract and implementations may be unrelated. Choose an abstract class when descendants share meaningful state, protected behavior, construction rules, or invariants. Prefer composition when inheritance would create a fragile or artificial hierarchy.

## References

- [Oracle Abstract Methods and Classes](https://docs.oracle.com/javase/tutorial/java/IandI/abstract.html)
- [Oracle Interfaces and Inheritance](https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html)
- [dev.java Object-Oriented Programming](https://dev.java/learn/oop/)
