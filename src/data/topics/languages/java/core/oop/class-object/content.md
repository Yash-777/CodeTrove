# Java: Class & Object

#### Classs

A **class** is a user-defined `blueprint`/`template` for creating objects. It groups related data (variables) and behaviors (methods) together, so each **object** created from it encapsulates both state and behavior. It can also contain constructors, nested types, and initialization blocks.

**Parts of a Class Declaration**
 1. **Class name**: the name of the class. By convention, the initial letter is capitalized (e.g., Car, Bike).
 2. **Class body**: the members of the class, surrounded by braces **`{}`**.
 3. **Members**: a class body can contain:
    * **Fields (variables)** that hold data
    * **Methods** that define behavior
    * **Constructors** for initializing `new` objects created from the class
    * Nested types and initialization blocks

#### Object

An object is a runtime instance of a class. It has identity, state, and behavior.
 * **Identity**: its own location in memory
 * **State**: its own field values
 * **Behavior**: the methods defined by its class

#### Constructor

A constructor is a special member of a class used to initialize an object when it is created.
 * Its name must match the class name.
 * It has no return type, not even void.
 * It is called automatically when an object is created with **`new`**.
 * It can accept parameters to set the object’s initial state.
 * Constructor`s are not inherited and cannot be static, abstract, or final.

#### Reference Variable

A reference variable holds a reference to an object. It is not the object itself.

How They Work Together

| Concept | Meaning |
|---|---|
| `class` keyword | Declares the blueprint |
| `new` keyword | Creates the object in memory |
| Constructor | Initializes the newly created object |
| Reference variable | Points to the object |

> Summary: A class defines it, `new` creates it, and the constructor sets it up.

## Class, object, constructor, and method

```java
class Car {
    private final String color; // field: object state

    Car(String color) {          // constructor: initializes a new object
        this.color = color;
    }

    void start() {               // instance method: object behavior
        System.out.println(color + " car started");
    }
}

public class Main {
    public static void main(String[] args) {
        Car car1 = new Car("Red");
        Car car2 = new Car("Blue");

        car1.start();
        car2.start();
    }
}
```

`Car` is the class. `car1` and `car2` are reference variables. `new Car("Red")` creates one object and invokes the matching constructor. The two objects use the same method definition but have different `color` state.

| Concept | Meaning | Example |
|---|---|---|
| Class | Definition of a type | `class Car { ... }` |
| Object | Runtime instance of a class | `new Car("Red")` |
| Field | Data held by a class or object | `private final String color` |
| Constructor | Special member used during object creation | `Car(String color)` |
| Method | Named behavior | `car1.start()` |
| Reference variable | Variable that refers to an object | `Car car1` |
| Identity | The fact that an object is a distinct instance | `car1 != car2` |

## Static and instance members

A **static member** belongs to the class. There is one class-level value or method, and it is normally accessed using the class name. An **instance member** belongs to an individual object. Each object has its own instance fields, while instance methods operate on the receiver object.

```java
class Employee {
    static String company = "CodeTrove"; // one shared field
    private final String name;            // one field per object

    static {                              // runs when the class initializes
        System.out.println("Employee class initialized");
    }

    {                                      // runs for every object
        System.out.println("Preparing an Employee object");
    }

    Employee(String name) {
        this.name = name;
    }

    static void showCompany() {
        System.out.println(company);
    }

    void display() {
        System.out.println(name + " works at " + company);
    }
}

Employee.showCompany();
Employee first = new Employee("Ravi");
Employee second = new Employee("Priya");
first.display();
second.display();
```

| Feature | Static | Instance |
|---|---|---|
| Belongs to | Class | Individual object |
| Field storage model | One shared class-level value | Separate field in each object |
| Method call | `Employee.showCompany()` | `first.display()` |
| Has implicit `this`? | No | Yes, in an instance context |
| Can directly access instance fields? | No; it needs an object reference | Yes |
| Initialization | Static fields and static blocks, once per class initialization | Instance fields, instance blocks, and constructor for each object |

A static method may be called through an object by Java syntax, but use the class name because it communicates that no object state is required:

```java
Employee.showCompany(); // preferred
// first.showCompany(); // compiles, but is misleading
```

## Initialization order

The exact physical JVM memory layout is implementation-dependent. The following model is useful for learning:

- Class metadata and method bytecode are managed by the JVM after the class is loaded.
- A static field belongs to the class and is shared by objects.
- An instance field is part of each object.
- A local variable such as `first` is a reference stored in a method's execution frame. It points to an object.
- Objects are commonly described as heap allocations, but the Java specification defines behavior rather than a universal heap diagram. A JIT compiler can optimize allocations when the observable behavior remains correct.

For a first active use, the JVM initializes the class. Static field initializers and static blocks run once in source order. When an object is created, instance fields first receive default values. Then the superclass constructor chain runs, followed by instance field initializers and instance blocks in source order, and finally the constructor body.

```java
class Demo {
    static String staticField = print("1. static field initializer");

    static {
        print("2. static block");
    }

    String instanceField = print("4. instance field initializer");

    {
        print("5. instance block");
    }

    Demo() {
        print("6. constructor body");
    }

    static String print(String message) {
        System.out.println(message);
        return message;
    }

    public static void main(String[] args) {
        print("3. main starts");
        new Demo();
        new Demo();
    }
}
```

Typical output:

```text
1. static field initializer
2. static block
3. main starts
4. instance field initializer
5. instance block
6. constructor body
4. instance field initializer
5. instance block
6. constructor body
```

For inheritance, class initialization follows the superclass before the subclass. Object construction runs the superclass constructor before subclass instance initialization and the subclass constructor body. Do not call overridable instance methods from a constructor because dynamic dispatch can call a subclass method before the subclass fields are initialized.

## Constructors

A constructor is a special class member used to initialize an object. Its name matches the class name, it has no return type, and it is selected by the `new` expression. Constructors are not inherited and cannot be `static`, `abstract`, or `final`.

### Compiler-provided default constructor

If a class declares no constructor, the compiler supplies a no-argument constructor with the same access level as the class. It implicitly calls `super()`.

```java
class MyApp {
    int port;
    // The compiler supplies something similar to:
    // MyApp() { super(); }
}

MyApp app = new MyApp();
```

The compiler stops supplying that constructor as soon as you declare any constructor:

```java
class Server {
    private final int port;

    Server(int port) {
        this.port = port;
    }
}

// Server server = new Server(); // compile error: no matching constructor
Server server = new Server(8080);
```

A **no-argument constructor** may be compiler-provided or explicitly declared. A **parameterized constructor** accepts values. Java does not automatically provide a copy constructor; a copy constructor is a programmer-defined pattern.

### Constructor overloading

Constructor overloading means declaring multiple constructors with different parameter lists. Java chooses the matching signature at compile time.

```java
class Car {
    private final String color;
    private final int speed;

    Car() {
        this("Black", 0);
    }

    Car(String color) {
        this(color, 0);
    }

    Car(String color, int speed) {
        this.color = color;
        this.speed = speed;
    }

    void print() {
        System.out.println(color + " " + speed);
    }
}

public class Main {
    public static void main(String[] args) {
        new Car().print();
        new Car("Red").print();
        new Car("Blue", 100).print();
    }
}
```

Output:

```text
Black 0
Red 0
Blue 100
```

`this(...)` calls another constructor in the same class and must be the first statement in the constructor. `super(...)` calls a superclass constructor and must also be the first constructor-invocation statement. A constructor cannot call both `this(...)` and `super(...)` directly; the delegated constructor eventually calls `super(...)`.

## The `this` keyword

Inside an instance context, `this` refers to the current object. It is commonly used to distinguish a field from a parameter, delegate to another constructor, or pass the current object to another method.

```java
class User {
    private final String name;

    User(String name) {
        this.name = name; // field on this object = parameter value
    }

    User withPrefix(String prefix) {
        return new User(prefix + this.name);
    }
}
```

There is no `this` reference in a static method because a static method is not invoked on a particular instance.

## Object state, identity, references, and default values

```java
class Counter {
    int value; // instance fields receive 0 by default
}

Counter first = new Counter();
Counter second = new Counter();
Counter alias = first;

alias.value = 10;
System.out.println(first.value);  // 10
System.out.println(second.value); // 0
System.out.println(first == alias);  // true: same object
System.out.println(first == second); // false: different objects
```

`first` and `alias` refer to the same object. `second` refers to another object with its own `value`. A reference can also be `null`, which means it refers to no object.

| Field type | Default value for a field |
|---|---|
| `byte`, `short`, `int`, `long` | `0` |
| `float`, `double` | `0.0` |
| `char` | `\u0000` |
| `boolean` | `false` |
| Reference types | `null` |

Local variables do not receive these defaults automatically. They must be definitely assigned before use.

## Object creation techniques

| Technique | Example | Notes |
|---|---|---|
| `new` | `new User("Alice")` | Normal construction; access and constructor validation apply. |
| Reflection | `User.class.getDeclaredConstructor().newInstance()` | Can throw checked reflection exceptions and may be restricted by access/module rules. |
| Factory method | `Path.of("notes.txt")` or `User.create("Alice")` | Can return a cached object, subtype, or validated result without exposing a constructor. |
| Copy constructor | `new User(existing)` | A clear programmer-defined copying pattern; Java does not generate it automatically. |
| `clone()` | `existing.clone()` | Often shallow and awkward; `CloneNotSupportedException` can occur. Prefer an explicit copy method when possible. |
| Deserialization | `ObjectInputStream.readObject()` | Reconstructs an object through serialization rules. Never deserialize untrusted input without a safe design. |

Do not use `Unsafe.allocateInstance` as ordinary construction. It can create an object without running its constructor and can violate class invariants.

## Encapsulation and access modifiers

Encapsulation keeps an object's state protected and exposes operations that preserve valid state:

```java
final class BankAccount {
    private long balanceCents;

    BankAccount(long openingBalanceCents) {
        if (openingBalanceCents < 0) {
            throw new IllegalArgumentException("Opening balance cannot be negative");
        }
        this.balanceCents = openingBalanceCents;
    }

    void deposit(long cents) {
        if (cents <= 0) {
            throw new IllegalArgumentException("Deposit must be positive");
        }
        balanceCents += cents;
    }

    long balanceCents() {
        return balanceCents;
    }
}
```

| Modifier | Same class | Same package | Subclass in another package | Unrelated class in another package |
|---|---:|---:|---:|---:|
| `private` | Yes | No | No | No |
| package-private | Yes | Yes | No | No |
| `protected` | Yes | Yes | Yes, subject to inheritance access rules | No |
| `public` | Yes | Yes | Yes | Yes |

Prefer the narrowest visibility that preserves the API. A `final` field cannot be reassigned after initialization, but if it refers to a mutable object, that object can still change. Immutability requires protecting the object's observable state, not only marking references `final`.

## Inheritance, association, aggregation, and composition

A class can extend one direct superclass and implement multiple interfaces:

```java
class Report extends Document implements Printable, Auditable {
}
```

**Association** means two classes know about or use one another. **Aggregation** is a has-a relationship where the parts can exist independently, such as a team referring to players. **Composition** is stronger ownership where the whole controls the part's lifecycle, such as an object creating private helper objects that have no independent meaning.

These are design relationships, not Java keywords. They are represented with fields, constructor parameters, and method calls. Prefer composition when a type uses another type rather than truly being a subtype.

## Nested classes, records, and enums

A class can contain other types when the nested type belongs conceptually to its enclosing class:

```java
class Parser {
    static class Result {
        final boolean valid;

        Result(boolean valid) {
            this.valid = valid;
        }
    }
}

Parser.Result result = new Parser.Result(true);
```

A non-static inner class also carries an enclosing-instance reference and normally requires an outer object:

```java
class House {
    class Room { }
}

House house = new House();
House.Room room = house.new Room();
```

A record is a compact class for transparent data carriers, and an enum is a class with a fixed set of instances:

```java
record Point(int x, int y) { }
enum Status { NEW, RUNNING, DONE }
```

Records still have constructors and methods. Enums can have fields, constructors, and methods, but their instances are declared by the enum type.

## `final` classes and private constructors

A `final` class cannot be extended, but it can still be instantiated unless its constructor is inaccessible. A private constructor prevents callers outside the allowed scope from using `new` directly:

```java
final class Token {
    private Token() { }

    static Token create() {
        return new Token();
    }
}

Token token = Token.create();
```

Private constructors are useful for factories and utility-style classes. They do not automatically make a class a safe singleton, and reflection or serialization can require additional design controls.

## Useful commands

```bash
# Compile source files
javac Main.java

# Run the class containing the main method
java Main

# Inspect fields, constructors, methods, and bytecode
javap -p -c Main

# Show verbose class-file metadata
javap -p -v Main
```

`javap` disassembles bytecode and metadata; it cannot restore the exact original Java source file.

## Quick Interview Notes with examples

<details><summary><strong>ClassNotFoundException: explicit class loading failed</strong></summary>

`ClassNotFoundException` is a checked exception and extends `ReflectiveOperationException`. It occurs when code explicitly asks a class loader to load a class by name, but no definition can be found.

```java
try {
    Class.forName("com.example.plugins.PaymentPlugin");
} catch (ClassNotFoundException ex) {
    System.err.println("Optional plugin is not installed: " + ex.getMessage());
}
```

A real scenario is a plugin system reading a class name from configuration. The application may still start without that optional plugin, so it can catch the exception and show a useful configuration message. It is different from `NoClassDefFoundError`: this is an expected checked failure from an explicit loading request.
</details>

<details><summary><strong>NoClassDefFoundError: class was available during compilation but unavailable at runtime</strong></summary>

`NoClassDefFoundError` is an unchecked `Error`. A common scenario is compiling an application with `payments-client.jar` present, then deploying it to another system where that JAR is missing or where a required transitive dependency is absent.

```text
Compile machine:  javac -cp payments-client.jar Checkout.java  # succeeds
Runtime machine:  java Checkout                                # fails if the JAR is absent
```

The JVM needs a class definition while loading or linking code, but it cannot find it in the runtime class path or module path. Fix the deployment dependency, class path, module path, or packaging; do not normally catch this error as business logic.
</details>

<details><summary><strong>ClassCastException: the runtime type is incompatible with the cast</strong></summary>

`ClassCastException` is an unchecked exception. It occurs when an object exists, but its actual runtime type is not compatible with the requested cast.

```java
Object value = Integer.valueOf(42);
String text = (String) value; // ClassCastException
```

A real scenario is reading a heterogeneous list or an unvalidated value from a legacy API. Prefer generics, pattern matching, or a type check when the type is genuinely uncertain:

```java
if (value instanceof String text) {
    System.out.println(text.length());
}
```
</details>

<details><summary><strong>NullPointerException: an operation used a null reference</strong></summary>

`NullPointerException` is an unchecked exception. It occurs when code dereferences `null`, calls an instance method through `null`, accesses an instance field through `null`, or performs another operation requiring an object.

```java
String email = null;
System.out.println(email.trim()); // NullPointerException
```

A real scenario is a request object whose optional customer field was not populated. Validate at the boundary, use a clear invariant, or model optional data explicitly. Do not hide every null problem with a broad catch; find which reference was allowed to be null.
</details>

<details><summary><strong>IllegalStateException: the object exists but is not ready for this operation</strong></summary>

`IllegalStateException` is an unchecked exception. It means the receiver is in an inappropriate state for the requested operation, even though the method arguments may be valid.

```java
final class Job {
    private boolean started;

    void start() {
        if (started) {
            throw new IllegalStateException("Job is already started");
        }
        started = true;
    }
}
```

A real scenario is calling `start()` twice, reading from a closed stream, or committing a transaction after it has already completed. Document the valid state transitions and make invalid transitions fail with a useful message.
</details>

<details><summary><strong>ClassFormatError: a class file has an invalid format</strong></summary>

`ClassFormatError` is an unchecked `LinkageError`. It indicates that the JVM found a class file but the bytes do not represent a valid class-file format. A corrupted JAR, an incomplete deployment, a broken bytecode generator, or a tool producing incompatible bytes can cause it.

```text
java.lang.ClassFormatError: Truncated class file
```

A real scenario is a CI artifact that was partially uploaded and then used by a production JVM. Replace the corrupted artifact and check build, packaging, and transfer integrity. This is not the same as an ordinary application exception.
</details>

<details><summary><strong>ClassCircularityError: circular class inheritance or initialization dependency</strong></summary>

`ClassCircularityError` is an unchecked `LinkageError`. It can occur when the JVM detects a circularity while loading a class hierarchy, such as invalid generated bytecode that creates a circular superclass relationship.

```text
A extends B, while B extends A  // illegal class-file relationship
```

Ordinary Java source prevents a class from directly extending itself, but bytecode generation, instrumentation, or a malformed class file can expose this failure. Fix the generated classes or instrumentation pipeline rather than catching the error.
</details>

<details><summary><strong>IllegalClassFormatException: an instrumentation transformer rejects class bytes</strong></summary>

`IllegalClassFormatException` is a checked exception in `java.lang.instrument`. A `ClassFileTransformer` can throw it when the class name, loader, or class-file bytes do not satisfy the transformer's expected format.

```java
public byte[] transform(
        ClassLoader loader,
        String className,
        Class<?> classBeingRedefined,
        java.security.ProtectionDomain domain,
        byte[] classfileBuffer) throws IllegalClassFormatException {
    if (className == null) {
        throw new IllegalClassFormatException("Missing class name");
    }
    return classfileBuffer;
}
```

A real scenario is a Java agent that transforms only classes with a known bytecode shape. The agent should validate its input and report the class name so the instrumentation configuration can be corrected.
</details>

<details><summary><strong>UnmodifiableClassException: instrumentation cannot redefine this class</strong></summary>

`UnmodifiableClassException` is a checked exception in `java.lang.instrument`. It is thrown when an instrumentation operation tries to redefine a class that the JVM or instrumentation environment marks as unmodifiable.

```java
try {
    instrumentation.redefineClasses(new ClassDefinition(target, newBytes));
} catch (java.lang.instrument.UnmodifiableClassException ex) {
    System.err.println("The JVM will not redefine " + target.getName());
}
```

A real scenario is a hot-reload or monitoring agent attempting to redefine a platform class or a class with unsupported structural changes. The agent should skip it or use a supported transformation strategy.
</details>

<details><summary><strong>ReflectiveOperationException: common checked superclass for reflection failures</strong></summary>

`ReflectiveOperationException` is a checked superclass for reflection failures, including `ClassNotFoundException`, `NoSuchMethodException`, and `NoSuchFieldException`.

```java
try {
    Class<?> type = Class.forName("com.example.User");
    Object user = type.getDeclaredConstructor().newInstance();
} catch (ReflectiveOperationException ex) {
    throw new IllegalStateException("Configured type cannot be created", ex);
}
```

Catch the common superclass when all reflection failures have the same recovery path. Catch the specific type when the user needs a different message or recovery action.
</details>

<details><summary><strong>RuntimeException: unchecked exception family</strong></summary>

`RuntimeException` is the common unchecked superclass for many programming and state failures, including `ClassCastException`, `NullPointerException`, and `IllegalStateException`. Java does not require callers to catch or declare unchecked exceptions.

Unchecked does not mean harmless. It means the compiler does not force a `try`/`catch` or `throws` declaration. Validate inputs, preserve object invariants, and handle failures at an appropriate application boundary.
</details>

## Exception versus error: interview comparison

| Type | Family | Checked? | Typical meaning | Usual response |
|---|---|---:|---|---|
| `ClassNotFoundException` | `ReflectiveOperationException` | Yes | Explicit class-by-name loading could not find a definition. | Fix configuration or handle an optional plugin. |
| `NoClassDefFoundError` | `LinkageError` | No | A required class definition is unavailable during runtime loading/linking. | Fix packaging, class path, module path, or deployment. |
| `ClassCastException` | `RuntimeException` | No | Actual runtime type is incompatible with a cast. | Fix type design, generics, or validation. |
| `NullPointerException` | `RuntimeException` | No | Code used a null reference where an object was required. | Enforce non-null invariants and fix the source of null. |
| `IllegalStateException` | `RuntimeException` | No | Operation is invalid for the object's current state. | Correct the state transition or API usage. |
| `ClassFormatError` | `LinkageError` | No | Class bytes are malformed or invalid. | Replace the artifact or fix bytecode generation. |
| `ClassCircularityError` | `LinkageError` | No | JVM detected an invalid circularity while loading classes. | Fix generated classes or instrumentation. |
| `IllegalClassFormatException` | `Exception` | Yes | Instrumentation transformer rejected class-file input. | Validate transformer input and configuration. |
| `UnmodifiableClassException` | `Exception` | Yes | Instrumentation cannot redefine the target class. | Skip the class or use a supported transformation. |
| `ReflectiveOperationException` | `Exception` | Yes | Common superclass for checked reflection failures. | Handle or translate the reflection failure. |
| `RuntimeException` | `Exception` | No | Common family for unchecked application/programming failures. | Prevent, validate, or handle at a suitable boundary. |

A useful rule is: **exceptions usually describe conditions an application may handle; errors usually describe JVM, linkage, format, or environment failures that application code should not normally recover from.** This is a guideline, not a substitute for reading the specific API contract.

## Official Java documentation

- [ClassCastException](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassCastException.html)
- [ClassNotFoundException](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassNotFoundException.html)
- [ReflectiveOperationException](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ReflectiveOperationException.html)
- [NoClassDefFoundError](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/NoClassDefFoundError.html)
- [ClassCircularityError](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassCircularityError.html)
- [ClassFormatError](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassFormatError.html)
- [LinkageError](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/LinkageError.html)
- [IllegalClassFormatException](https://docs.oracle.com/en/java/javase/21/docs/api/java.instrument/java/lang/instrument/IllegalClassFormatException.html)
- [UnmodifiableClassException](https://docs.oracle.com/en/java/javase/21/docs/api/java.instrument/java/lang/instrument/UnmodifiableClassException.html)
- [RuntimeException](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/RuntimeException.html)
- [Java Language Specification, execution and initialization](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html)
- [Shared class/object/constructor conversation](https://chatgpt.com/share/6ad4af55-ccb4-83ee-8741-7d6e6dd45331)
