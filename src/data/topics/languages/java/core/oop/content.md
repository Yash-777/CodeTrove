# Object-Oriented Programming in Java

Object-oriented programming organizes software around objects that combine state and behavior. In Java, a class defines a type, an object is an instance of it, and methods express behavior. The dedicated [Class & Object lesson](/content/tree/languages/java/core/oop/class-object) and [Interface & Abstract Class lesson](/content/tree/languages/java/core/oop/interface-abstract-class) cover those building blocks in detail. This page gives the whole picture: the building blocks, the four pillars, how Java's type system and casting support them, how objects relate to each other, and where they live at runtime.

<img class="markdown-image" loading="lazy" src="/images/Java-OOP-Infographic@2x.png" alt="Object-Oriented Programming in Java: classes, objects, the 4 pillars and object relationships" width="900px" height="1000px">

*One-picture summary of this page.*

## Building blocks: classes and objects

- **Class:** a logical blueprint that defines the fields and methods common to a type of entity.
- **Object:** a concrete instance of a class, created in memory with the `new` keyword. `Car` is a class; a specific red Toyota is an object.

```java
class Car {
    String color;
    void drive() { }
}

Car myCar = new Car();
myCar.color = "red";
myCar.drive();
```

See [Class & Object](/content/tree/languages/java/core/oop/class-object).

## The four pillars

### 1. Encapsulation

Protect state behind a small, valid public API. Keep fields `private` and let methods enforce rules such as "balance cannot become negative."

```java
class BankAccount {
    private double balance; // hidden state

    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("amount must be positive");
        balance += amount;
    }

    public double getBalance() {
        return balance;
    }
}
```

### 2. Inheritance

Use `extends` when a subtype truly satisfies the parent type's contract (an **is-a** relationship). A Java class has one direct superclass, and constructors are not inherited; a subclass calls the parent's with `super(...)`.

```java
class Animal {
    void eat() { System.out.println("Eating..."); }
}

class Dog extends Animal {   // Dog is-an Animal
    void bark() { System.out.println("Woof!"); }
}
```

### 3. Polymorphism

Write code against a parent type or interface and let the runtime pick the right override.

| Type | Also called | Resolved by |
|------|-------------|-------------|
| Compile-time | Method **overloading**: same name, different parameters | The compiler |
| Runtime | Method **overriding**: a subclass replaces an inherited method | The JVM, from the object's actual type |

Only instance methods are overridden; `static`, `private` and `final` methods are not.

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

`AlertService` depends on the `Notifier` contract, not on `EmailNotifier`. Another implementation, or a test double, can be supplied without changing the service.

### 4. Abstraction

Hide complex details and expose only the essentials.

- **Abstract classes:** partial abstraction. They can mix abstract and concrete methods and hold state.
- **Interfaces:** a contract of what a type can do. Since Java 8 they may also contain `default` and `static` methods, so they are no longer strictly "100% abstract."

```java
abstract class Shape {
    abstract double area(); // no body
}

class Circle extends Shape {
    private final double r;
    Circle(double r) { this.r = r; }

    @Override
    double area() { return Math.PI * r * r; }
}
```

See [Interface & Abstract Class](/content/tree/languages/java/core/oop/interface-abstract-class), [Encapsulation](/content/tree/languages/java/core/oop/encapsulation), [Inheritance](/content/tree/languages/java/core/oop/inheritance) and [Polymorphism](/content/tree/languages/java/core/oop/polymorphism).

## Everything is an `Object`

`java.lang.Object` is the root superclass of every Java class, predefined or user-defined. A class with no `extends` clause implicitly extends `Object`.

- **Predefined:** `Number` (an abstract class) is the parent of `Byte`, `Short`, `Integer`, `Long`, `Float` and `Double`. `String`, `Character` and `Boolean` extend `Object` directly.
- **User-defined:** `class Parent { }` is the same as `class Parent extends Object { }`.
- **Inherited by all:** `toString()`, `equals()`, `hashCode()`, `getClass()`, `clone()`, `wait()` and `notify()`.

```java
class Parent { }                  // implicitly: extends Object
Object o = new Parent();          // every object is an Object
System.out.println(o.getClass()); // class Parent
```

## Type conversion and casting

Polymorphism relies on **reference casting**. Java also converts between primitive types and between primitives and wrappers.

### Reference types: upcasting and downcasting

| Cast | Direction | Rules |
|------|-----------|-------|
| **Upcasting** | child to parent | Implicit and always safe |
| **Downcasting** | parent to child | Explicit; throws `ClassCastException` if the real type does not match |

```java
Number n = Integer.valueOf(10);   // upcast
Integer i = (Integer) n;          // downcast

Object o = "CodeTrove";           // upcast
String s = (String) o;            // downcast

Parent p = new Child();           // upcast
Child c = (Child) p;              // downcast

if (o instanceof String str) {    // safe check and cast (Java 16+)
    System.out.println(str.length());
}
```

### Primitives: widening and narrowing

- **Widening** is implicit and safe: `byte → short → int → long → float → double`, and `char → int`. Going to `float` or `double` can lose precision for very large `long` values.
- **Narrowing** needs an explicit cast and can lose data. `boolean` cannot be converted to or from any other primitive.

```java
int i = 100;
long l = i;                 // widening
double d = l;               // widening
int n = (int) 3.99;         // narrowing -> 3
byte b = (byte) 130;        // overflow -> -126
```

| Type | `byte` | `short` | `int` | `long` | `float` | `double` | `char` | `boolean` |
|------|--------|---------|-------|--------|---------|----------|--------|-----------|
| Size | 1 byte | 2 bytes | 4 bytes | 8 bytes | 4 bytes | 8 bytes | 2 bytes | not precisely defined by the JVM |

### Primitives and wrappers: boxing and unboxing

```java
Integer a = 10;                 // autoboxing, same as Integer.valueOf(10)
int b = a;                      // unboxing, same as a.intValue()
```

Unboxing a `null` wrapper throws `NullPointerException`. Compare wrapper values with `equals()`, not `==`.

<img class="markdown-image" loading="lazy" src="/images/Java-Type-Conversion-and-Casting@2x.png" alt="Java type conversion: widening, narrowing, boxing, unboxing, upcasting and downcasting" width="1000px" height="800px">

## Object relationships

Beyond inheritance (**is-a**), classes interact through:

| Relationship | Strength | Meaning | Example |
|--------------|----------|---------|---------|
| **Association** | Weakest | A general connection between two independent classes | A `Teacher` teaches a `Student` |
| **Aggregation** | Weak **has-a** | One class contains another, but both exist independently | A `Department` has `Teacher`s |
| **Composition** | Strong **part-of** | The part cannot exist without the whole | A `House` and its `Room`s |

```java
class Department {                // aggregation
    List<Teacher> teachers;
}

class House {                     // composition
    private final Room room = new Room();
}
```

### Prefer composition when it communicates ownership better

Inheritance reuses a type relationship, but it also couples the child to assumptions in the parent. Composition stores collaborators as fields and delegates work to them. Prefer composition when the relationship is "uses a" rather than "is a," or when the lifecycle and behavior should remain independent.

## Where objects live: JVM memory

`new` allocates the object on the **heap**, while the reference to it sits in a **stack** frame. The pieces fit together like this:

- **JDK** = JRE + development tools (`javac`, `jar`, `jdb`, `jshell`, `javadoc`).
- **JRE** = JVM + core class libraries.
- **JVM** = class loader, runtime data areas and execution engine.

| Runtime data area | Holds | Scope |
|-------------------|-------|-------|
| **Heap** | Objects and arrays. Young generation (Eden, S0, S1) for new objects, old generation for long-lived ones | Shared by all threads |
| **String Pool** | Reused string literals, stored once (inside the heap since Java 7) | Shared |
| **Stack** | Frames with local variables and the operand stack | Per thread |
| **PC Register** | Current instruction | Per thread |
| **Native Method Stack** | Native method calls | Per thread |
| **Metaspace** | Class metadata, in native memory (replaced PermGen in Java 8) | Shared |

- **Class loader:** loading, then linking (verify, prepare, resolve), then initialization, through the Bootstrap, Platform and Application loaders.
- **Execution engine:** the interpreter runs bytecode line by line, the JIT compiler (C1, C2) turns hot code into native code, and the garbage collector reclaims unreachable objects.
- **JNI** is the bridge from the JVM to native libraries (`.dll`, `.so`, `.dylib`), which live outside the JVM.

<img class="markdown-image" loading="lazy" src="/images/JDK,%20JRE%20and%20JVM%20Architecture@2x.png" alt="JDK, JRE and JVM architecture" width="1000px" height="1400px">

## A complete example

```java
// Abstraction and encapsulation
abstract class Animal {
    private final String name;           // encapsulated data

    protected Animal(String name) { this.name = name; }
    public String getName() { return name; }

    public abstract void makeSound();    // abstract method
}

// Inheritance
class Dog extends Animal {
    public Dog(String name) { super(name); }

    // Polymorphism (method overriding)
    @Override
    public void makeSound() {
        System.out.println(getName() + " says: Woof!");
    }
}

public class Main {
    public static void main(String[] args) {
        Animal myDog = new Dog("Buddy"); // object creation and upcast
        myDog.makeSound();               // Output: Buddy says: Woof!
    }
}
```

## Questions to ask during design

1. Which state must remain valid at all times?
2. Which operations are part of the public contract?
3. Is the relationship genuinely an `is-a` relationship, or would a field be clearer?
4. Can the caller depend on an interface rather than a concrete class?
5. Would a value object or record express the data more clearly than a mutable entity?

## In short

OOP helps you write modular, reusable and easy-to-maintain code by modelling real-world entities as classes and objects.

## Related lessons

- [Class & Object](/content/tree/languages/java/core/oop/class-object)
- [Interface & Abstract Class](/content/tree/languages/java/core/oop/interface-abstract-class)
- [Encapsulation](/content/tree/languages/java/core/oop/encapsulation)
- [Inheritance](/content/tree/languages/java/core/oop/inheritance)
- [Polymorphism](/content/tree/languages/java/core/oop/polymorphism)

References: [dev.java Object-Oriented Programming](https://dev.java/learn/oop/) and [Oracle Object-Oriented Programming Concepts](https://docs.oracle.com/javase/tutorial/java/concepts/index.html).