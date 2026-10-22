# Java Inheritance

**Inheritance** is a Java mechanism in which a subclass derives from a superclass. The subclass receives the superclass's accessible behavior and type relationship, then can add new members or override inherited instance methods.

A class derived from another class is called a **subclass**, **derived class**, **extended class**, or **child class**. The class from which it is derived is called a **superclass**, **base class**, or **parent class**.

```java
class Vehicle {                         // superclass
    protected int speed;

    void move() {
        System.out.println("Vehicle is moving");
    }
}

class Car extends Vehicle {             // subclass
    void honk() {
        System.out.println("Beep");
    }
}
```

`Car` has the inherited `speed` field and `move()` method, plus its own `honk()` method. Java classes have one direct superclass. If no superclass is written, the class implicitly extends `Object`, except for `Object` itself.

## Why use inheritance?

Inheritance can provide the following benefits when the relationship is genuinely a subtype relationship:

1. **Reuse:** common fields and methods can be implemented once in a superclass.
2. **Extension:** a subclass can add behavior to an existing type.
3. **Method overriding:** a subclass can provide specialized behavior for an inherited instance method.
4. **Polymorphism:** code can use a superclass reference while the runtime selects a subclass override.
5. **Shared abstraction:** an abstract superclass can define common state and behavior for related concrete classes.

Inheritance is not required for every benefit listed above. Interfaces can provide abstraction and polymorphism without sharing class state. Composition often provides reuse with less coupling. Use inheritance when the child truly satisfies the parent's contract, not merely because the parent has convenient code.

## Basic example

```java
class Bicycle {
    protected int cadence;
    protected int gear;
    protected int speed;

    Bicycle(int cadence, int speed, int gear) {
        this.cadence = cadence;
        this.speed = speed;
        this.gear = gear;
    }

    void speedUp(int increment) {
        speed += increment;
    }

    void applyBrake(int decrement) {
        speed -= decrement;
    }
}

class MountainBike extends Bicycle {
    private int seatHeight;

    MountainBike(int seatHeight, int cadence, int speed, int gear) {
        super(cadence, speed, gear);
        this.seatHeight = seatHeight;
    }

    void setSeatHeight(int seatHeight) {
        this.seatHeight = seatHeight;
    }
}

MountainBike bike = new MountainBike(20, 60, 10, 2);
bike.speedUp(5);       // inherited method
bike.setSeatHeight(25); // subclass method
```

`MountainBike` inherits the accessible fields and methods of `Bicycle`, adds `seatHeight`, and calls the superclass constructor with `super(...)`.

## What is inherited?

A subclass inherits the accessible members of its superclass. Java members include fields, methods, and nested classes. Constructors are declared in a class, but they are **not members**, so constructors are not inherited.

| Superclass item | Inherited? | Explanation |
|---|---:|---|
| `public` field or method | Yes | It is accessible according to normal access rules. |
| `protected` field or method | Yes | A subclass can access it, subject to package and inheritance rules. |
| Package-private field or method | Only in the same package | It is not accessible to a subclass in a different package merely because of inheritance. |
| `private` field or method | No | The superclass owns it; the subclass cannot access it directly. Public/protected methods can expose or operate on it. |
| Constructor | No | Constructors initialize their own class and are not inherited. |
| Static method | Available through the type, but hidden rather than overridden | Static dispatch is based on the reference/type used at compile time. |
| Instance method | Yes, if accessible | A subclass can inherit it or override it. |
| Nested class | Accessible if its access rules allow it | A nested class can indirectly work with private members of its enclosing class. |

A subclass object still contains superclass state, but private superclass members are not directly accessible as inherited members. The superclass's methods remain responsible for maintaining that private state.

## Is a constructor a member of a class?

**No. In Java language terminology, a constructor is not a member.** A constructor is declared inside a class and initializes instances of that class, but the Java Language Specification treats constructors separately from fields and methods. This explains why:

- Constructors are not inherited.
- Constructors cannot be overridden.
- Constructors cannot be `static`, `abstract`, or `final`.
- A subclass must declare its own constructor if it needs custom initialization.
- A subclass constructor can invoke a superclass constructor with `super(...)`.

```java
class Parent {
    Parent(int value) {
        System.out.println("Parent: " + value);
    }
}

class Child extends Parent {
    Child() {
        super(10); // invokes Parent(int); it does not inherit that constructor
    }
}
```

If a subclass constructor does not explicitly call `this(...)` or `super(...)`, Java inserts `super()` as the first constructor invocation. Therefore, the superclass must have an accessible no-argument constructor, or the subclass will not compile.

## The `super` keyword

`super` refers to the superclass part of the current object. It has three common uses.

### Invoke a superclass constructor

`super(arguments)` must be the first statement in a constructor. It selects a matching superclass constructor.

```java
class Account {
    protected final String owner;

    Account(String owner) {
        this.owner = owner;
    }
}

class SavingsAccount extends Account {
    private final double interestRate;

    SavingsAccount(String owner, double interestRate) {
        super(owner); // must be first
        this.interestRate = interestRate;
    }
}
```

A constructor cannot directly call both `this(...)` and `super(...)`. It can call another constructor in the same class with `this(...)`; that constructor eventually delegates to a superclass constructor.

### Access a superclass field

Use `super.field` when a subclass field hides a field with the same name. Field access is not polymorphic, so field hiding is usually less clear than using private fields and methods.

```java
class Parent {
    String label = "parent";
}

class Child extends Parent {
    String label = "child";

    void printLabels() {
        System.out.println(label);       // child field
        System.out.println(super.label); // parent field
    }
}
```

### Invoke a superclass method

Use `super.method(arguments)` to invoke the superclass implementation of an accessible instance method that the subclass overrides.

```java
class Logger {
    void write(String message) {
        System.out.println("LOG: " + message);
    }
}

class AuditLogger extends Logger {
    @Override
    void write(String message) {
        super.write("AUDIT " + message); // call the parent implementation
        System.out.println("Saved audit record");
    }
}
```

## Can `super` call a superclass method from an overloaded method?

Yes, but the wording matters. `super()` and `super(arguments)` are constructor invocations and can be used only inside a constructor. `super.method(arguments)` invokes an accessible superclass **method** from any appropriate instance method, including an overloaded method.

```java
class Printer {
    void print(String message) {
        System.out.println("Parent text: " + message);
    }

    void print(int number) {
        System.out.println("Parent number: " + number);
    }
}

class ChildPrinter extends Printer {
    void print(String message, int copies) { // overload: different parameters
        super.print(message);                // calls the superclass String method
        System.out.println("Copies: " + copies);
    }

    @Override
    void print(String message) {
        super.print(message);                // calls the overridden parent method
    }
}
```

Overloading means the method name is the same but the parameter list differs. Overriding means a subclass supplies a new implementation for an inherited instance method with a compatible signature. `super.print(...)` bypasses the subclass override for that call and selects the superclass implementation after compile-time overload resolution.

## Method overriding and method hiding

An instance method is overridden when the subclass method has a compatible signature and the superclass method is accessible for overriding. Use `@Override` so the compiler can detect a spelling or signature mistake.

```java
class Payment {
    void process() {
        System.out.println("Generic payment");
    }
}

class CardPayment extends Payment {
    @Override
    void process() {
        System.out.println("Process card payment");
    }
}

Payment payment = new CardPayment();
payment.process(); // Process card payment: runtime polymorphism
```

Static methods are hidden, not overridden:

```java
class Parent {
    static void identify() {
        System.out.println("Parent");
    }
}

class Child extends Parent {
    static void identify() {
        System.out.println("Child");
    }
}

Parent value = new Child();
value.identify(); // Parent: selected from the reference type
Child.identify(); // Child
```

Fields are also hidden rather than overridden. Prefer private fields with methods when polymorphic behavior is required.

## IS-A versus HAS-A

### IS-A: inheritance or interface implementation

“`Child` **is a** `Parent`” means a `Child` can safely be used wherever a `Parent` is expected.

```java
class Animal {
    void eat() {
        System.out.println("Eating");
    }
}

class Dog extends Animal {
    void bark() {
        System.out.println("Barking");
    }
}

Animal animal = new Dog(); // Dog IS-A Animal
animal.eat();
```

A class implementing an interface also has an IS-A type relationship:

```java
interface Flyable {
    void fly();
}

class Bird implements Flyable {
    public void fly() {
        System.out.println("Flying");
    }
}
```

`Bird` IS-A `Flyable`, even though `Flyable` is an interface rather than a superclass.

### HAS-A: composition or aggregation

“`Car` **has an** `Engine`” means the car uses an engine; it does not mean a car is a kind of engine.

```java
final class Engine {
    void start() {
        System.out.println("Engine started");
    }
}

final class Car {
    private final Engine engine = new Engine(); // composition

    void start() {
        engine.start();
    }
}
```

Use composition when the relationship is “uses a”, when the part can be replaced, or when independent lifecycles are important. Use inheritance when substituting the child for the parent is correct and meaningful.

| Relationship | Java expression | Example | Lifecycle |
|---|---|---|---|
| IS-A | `extends` or `implements` | `Dog extends Animal` | Child is a specialized form of parent. |
| HAS-A composition | Field owned by the class | `Car` creates its `Engine` | Whole commonly controls the part. |
| HAS-A aggregation | Field refers to an external object | `Team` refers to `Player` objects | Part can exist independently. |

## Types of class inheritance in Java

### Single inheritance

One subclass extends one superclass.

```java
class Vehicle { }
class Car extends Vehicle { }
```

### Multilevel inheritance

A class extends a class that already extends another class.

```java
class LivingThing { }
class Animal extends LivingThing { }
class Dog extends Animal { }
```

`Dog` is descended from both `Animal` and `LivingThing`.

### Hierarchical inheritance

Multiple subclasses extend the same superclass.

```java
class Shape { }
class Circle extends Shape { }
class Rectangle extends Shape { }
```

### Multiple inheritance of classes

Java does **not** allow a class to extend two classes:

```java
// class FlyingCar extends Car, Aircraft { } // compile error
```

The main problem is ambiguity when both parent classes provide the same state or method. Java supports multiple inheritance of **type** through interfaces:

```java
interface Flyable {
    void fly();
}

interface Drivable {
    void drive();
}

class FlyingCar implements Flyable, Drivable {
    public void fly() { System.out.println("Fly"); }
    public void drive() { System.out.println("Drive"); }
}
```

If two interfaces provide conflicting default methods, the class must resolve the conflict explicitly:

```java
interface A {
    default void show() { System.out.println("A"); }
}

interface B {
    default void show() { System.out.println("B"); }
}

class C implements A, B {
    @Override
    public void show() {
        A.super.show(); // explicit conflict resolution
    }
}
```

### Hybrid inheritance

A hybrid structure combines inheritance forms. Java does not support a hybrid structure that requires multiple inheritance of classes. Similar designs can be created safely by combining one class hierarchy with multiple interfaces and composition.

## Casting and `instanceof`

Upcasting from a subclass to a superclass is safe and implicit:

```java
Dog dog = new Dog();
Animal animal = dog; // upcasting: every Dog is an Animal
```

Downcasting from a superclass reference to a subclass requires an explicit cast and can fail at runtime:

```java
Animal animal = new Dog();
Dog dog = (Dog) animal; // safe because the object really is a Dog
```

The variable's declared type is not enough. The object created at runtime determines whether the cast succeeds:

```java
Animal animal = new Animal();
Dog dog = (Dog) animal; // ClassCastException
```

Use `instanceof` before a downcast when the type is genuinely uncertain. It returns `false` for `null`.

```java
Animal animal = getAnimal();

if (animal instanceof Dog dog) { // pattern variable; Java 16+
    dog.bark();
} else if (animal == null) {
    System.out.println("No animal was supplied");
} else {
    animal.eat();
}
```

The older equivalent is:

```java
if (animal instanceof Dog) {
    Dog dog = (Dog) animal;
    dog.bark();
}
```

Use polymorphism and overriding instead of repeated type checks when the behavior belongs naturally to the types. `instanceof` is useful at boundaries such as plugin APIs, heterogeneous collections, parsers, and framework callbacks.

The reflection equivalent is:

```java
boolean compatible = Animal.class.isInstance(animal);
boolean assignable = Animal.class.isAssignableFrom(Dog.class);
```

`Class.isInstance` checks an object at runtime. `Class.isAssignableFrom` checks whether one class or interface type can accept values of another type.

## Access modifiers and inheritance

- `public` members are accessible wherever the declaring type is accessible.
- `protected` members are available in the same package and to subclasses under Java's protected-access rules.
- Package-private members are available only within the same package.
- `private` members are not inherited as accessible members. The superclass can expose controlled behavior through methods.
- A `final` class cannot be extended.
- A `final` instance method cannot be overridden.
- A `final` field cannot be assigned again after initialization.

```java
class Account {
    private int balance;

    protected int balanceForSubclass() {
        return balance;
    }
}

class SavingsAccount extends Account {
    void printBalance() {
        // balance is not directly accessible because it is private
        System.out.println(balanceForSubclass());
    }
}
```

Keep state private when possible. A protected mutable field exposes superclass implementation details to every subclass and can make future changes difficult.

## Abstract classes and inheritance

An abstract class can provide shared state and concrete methods while requiring subclasses to implement abstract methods:

```java
abstract class Report {
    protected final String title;

    protected Report(String title) {
        this.title = title;
    }

    abstract String render();

    void print() {
        System.out.println(title);
        System.out.println(render());
    }
}

final class TextReport extends Report {
    TextReport(String title) {
        super(title);
    }

    @Override
    String render() {
        return "Plain text";
    }
}
```

Inheritance is one way to implement abstraction. An interface can provide a contract without shared superclass state, and composition can hide implementation behind a field. Choose the least coupled design that expresses the domain correctly.

## Common interview questions

<details><summary><strong>Does a subclass inherit a superclass constructor?</strong></summary>

No. Constructors are not members and are not inherited. The subclass has its own constructors. A subclass constructor can invoke a superclass constructor with `super(...)`, and Java inserts `super()` when no constructor invocation is written. That implicit call fails if the superclass has no accessible no-argument constructor.
</details>

<details><summary><strong>Can a private method be overridden?</strong></summary>

No. A private method is not visible to the subclass and is not inherited. A same-named method in the subclass is a new, unrelated method. Use `@Override` to let the compiler confirm that a method really overrides a parent method.
</details>

<details><summary><strong>Can a static method be overridden?</strong></summary>

No. Static methods are hidden. The selected method depends on the reference or class used at compile time, not on the runtime object. Instance methods are overridden and selected polymorphically at runtime.
</details>

<details><summary><strong>Can Java support multiple inheritance?</strong></summary>

A class cannot extend multiple classes. A class can implement multiple interfaces. Interfaces provide multiple type contracts, and default-method conflicts must be resolved by the implementing class. Composition is often a better alternative to a complicated inheritance hierarchy.
</details>

<details><summary><strong>When should inheritance be avoided?</strong></summary>

Avoid it when the relationship is only code reuse, when the child cannot honor the parent's contract, when subclasses would need to disable inherited behavior, or when the hierarchy is likely to change independently. Use composition or interfaces when they communicate the design more clearly.
</details>

<details><summary><strong>What is the difference between `super()` and `super.method()`?</strong></summary>

`super()` or `super(arguments)` invokes a superclass constructor and is legal only as the first constructor invocation. `super.method(arguments)` invokes an accessible superclass instance method and can be used inside an instance method or constructor after the constructor invocation rules are satisfied.
</details>

## References

- [dev.java: What Is Inheritance?](https://dev.java/learn/language/oop/inheritance/what-is-inheritance/)
- [dev.java: Overriding and Hiding Methods](https://dev.java/learn/language/oop/inheritance/overriding/)
- [dev.java: Polymorphism](https://dev.java/learn/language/oop/inheritance/polymorphism/)
- [Oracle Java Tutorial: Inheritance](https://docs.oracle.com/javase/tutorial/java/IandI/subclasses.html)
- [Oracle Java Tutorial: Multiple Inheritance of State, Implementation, and Type](https://docs.oracle.com/javase/tutorial/java/IandI/multipleinheritance.html)
- [Java Language Specification: Class Members](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html)
- [Java Language Specification: Constructors](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.8)
- [Java `Class.isInstance` and `isAssignableFrom`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html)
