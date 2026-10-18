# Java: Class & Object

A **class** is a type definition that groups state and behavior. It can declare fields, methods, constructors, nested types, and initialization blocks. An **object** is a runtime instance of a class with its own identity and instance state. A class is not an object: it is the description used to create and work with objects.

## A complete example

```java
public class Main {
    static String classLabel = "shared by the class"; // static field
    private final int id;                              // instance field

    static {                                           // static initializer
        System.out.println("1. class initialization");
    }

    {                                                   // instance initializer
        System.out.println("3. instance initializer");
    }

    Main(int id) {                                      // constructor
        this.id = id;
        System.out.println("4. constructor body: " + id);
    }

    void printId() {                                    // instance method
        System.out.println("instance method: " + id);
    }

    static void printClassLabel() {                     // static method
        System.out.println(classLabel);
    }

    public static void main(String[] args) {
        System.out.println("2. main starts");
        Main first = new Main(10);
        Main second = new Main(20);
        first.printId();
        second.printId();
        Main.printClassLabel();
    }
}
```

Typical output is:

```text
1. class initialization
2. main starts
3. instance initializer
4. constructor body: 10
3. instance initializer
4. constructor body: 20
instance method: 10
instance method: 20
shared by the class
```

The exact JVM memory layout is implementation-dependent, but this model is useful:

| Item | Belongs to | Conceptual storage/lifetime |
|---|---|---|
| `classLabel` | Class | One shared class-level value after class initialization. |
| `id` | Each object | A separate value in each `Main` instance. `first.id` and `second.id` are different. |
| `first` and `second` | `main` stack frame | Local reference variables. They refer to objects; they are not the objects themselves. |
| Method bytecode and class metadata | Loaded class | Runtime structures managed by the JVM; exact placement is JVM-specific. |
| Object fields | Object instance | Storage allocated for that object, normally associated with the heap in the usual JVM model. |

The Java Language Specification defines behavior and initialization order, not a universal physical heap/stack diagram. A JIT compiler may optimize allocations when observable behavior is preserved.

## Class initialization and object initialization order

For a first active use, the JVM initializes the class: static fields and static initializer blocks execute in textual order. When `new Main(10)` is evaluated, the JVM allocates space for the object and gives fields default values first. Constructor processing then follows the superclass chain, executes instance field initializers and instance initializer blocks in source order, and finally executes the constructor body.

For a subclass, the practical order is:

1. Initialize the superclass class if it has not already been initialized.
2. Initialize the subclass class if it has not already been initialized.
3. Allocate the new object and assign default values (`0`, `false`, and `null`).
4. Run the superclass constructor, including its instance initialization.
5. Run the subclass instance field initializers and instance blocks in textual order.
6. Run the subclass constructor body.

Do not call overridable instance methods from constructors. Dynamic dispatch can call a subclass override before the subclass fields have been initialized.

## Fields, blocks, constructors, and methods

- **Static field:** one value associated with the class. Access it through the class name, such as `Main.classLabel`.
- **Instance field:** one value per object. It needs no `static` modifier and is accessed through an object, such as `first.id` when visibility allows.
- **Static block:** runs once when the class is initialized.
- **Instance initializer block:** runs for each object after the superclass constructor and before the constructor body.
- **Constructor:** initializes a new object. It has the class name and no return type.
- **Instance method:** can read or change the receiver object's state.
- **Static method:** belongs to the class and should be called through the class name. It has no implicit `this` object.

## Constructors and the compiler-provided default constructor

A constructor is not a normal method. It is selected by `new`, can be overloaded, and cannot be inherited or called like `object.constructor()`.

If a class declares **no constructor at all**, the compiler supplies a no-argument default constructor with the same access level as the class. It implicitly calls `super()`.

If you declare any constructor, the compiler does **not** add a no-argument constructor. Code that calls `new MyApp()` then fails unless you declare one yourself.

### Side-by-side source and commands

| File | Source | Command and result |
|---|---|---|
| `MyApp.java` | `class MyApp { int port; }` | `javac MyApp.java` creates `MyApp.class`. The compiler behaves as if a no-argument constructor `MyApp() { super(); }` existed. |
| `MyApp.java` | `class MyApp { int port; MyApp(int port) { this.port = port; } }` | `javac MyApp.java` succeeds, but `new MyApp()` is a compile error because only the parameterized constructor exists. |
| `Main.java` | `public class Main { public static void main(String[] args) { new MyApp(8080); } }` | `javac Main.java MyApp.java`, then `java Main` loads `Main` and calls its `main` method. |
| Compiled class | Bytecode and metadata | `javap -c -p MyApp` disassembles the class file; it does not recreate the original Java source exactly. |

Example:

```java
class MyApp {
    int port;
    // No constructor is written, so the compiler supplies MyApp().
}
```

The supplied constructor is conceptually similar to:

```java
MyApp() {
    super();
}
```

It is not a “default constructor” if you wrote a no-argument constructor yourself; that is a user-declared no-argument constructor.

## Five practical ways to create objects

| Technique | Example | Important corner case |
|---|---|---|
| `new` expression | `User user = new User("A");` | Constructor access, arguments, validation, and `OutOfMemoryError` can matter. |
| Reflection | `User user = User.class.getDeclaredConstructor(String.class).newInstance("A");` | Checked reflection exceptions, access restrictions, and constructor exceptions are wrapped in reflective exceptions. |
| `clone()` | `User copy = (User) original.clone();` | The class must support cloning; the default operation is shallow and `CloneNotSupportedException` may occur. Prefer copy constructors or factories for clear semantics. |
| Deserialization | `ObjectInputStream in = ...; User user = (User) in.readObject();` | The normal constructor path is special for `Serializable`; untrusted input can execute dangerous logic. Validate and avoid unsafe deserialization. |
| Factory or library method | `Path path = Path.of("notes.txt");` or `User.create("A")` | The method may cache, return a subtype, return `null` only by poor design, or reject invalid input. The caller need not know which constructor runs. |

Other language features can also create objects indirectly. Boxing, string concatenation, lambdas, method references, and framework proxies may allocate objects. `Unsafe.allocateInstance` is not a normal construction technique and bypasses constructors; application code should not use it.

## Access modifiers

| Modifier | Same class | Same package | Subclass in another package | Unrelated class in another package |
|---|---:|---:|---:|---:|
| `private` | Yes | No | No | No |
| package-private (no modifier) | Yes | Yes | Only through package rules, not as general access | No |
| `protected` | Yes | Yes | Yes through inheritance rules | No |
| `public` | Yes | Yes | Yes | Yes |

Use the narrowest visibility that preserves the public contract. Private fields plus validated methods or constructors protect invariants better than public mutable fields.

## Association, aggregation, and composition

**Association** means that two classes know about or use one another. A `Teacher` can be associated with a `Course` without owning its lifetime.

- **Aggregation:** a “has-a” relationship where the parts can exist independently. A `Team` may refer to `Player` objects that can also exist outside the team.
- **Composition:** stronger ownership where the part's lifecycle is controlled by the whole. A `House` may create and own its `Room` objects in a model where rooms do not have an independent lifecycle.

These are design relationships, not special Java keywords. They are commonly represented with fields, constructor parameters, and interfaces.

## More class questions

### What does `final class` mean?

A `final` class cannot be extended. It can still be instantiated unless its constructor is inaccessible. `final` does not make referenced objects immutable:

```java
final class Settings {
    private final java.util.List<String> names = new java.util.ArrayList<>();
    void add(String name) { names.add(name); }
}
```

The reference `names` cannot be reassigned, but the list can still change. A final class can implement interfaces, extend `Object`, declare constructors, fields, blocks, and methods, and be used as a normal type.

### Can a class extend or implement another type?

A class can `extend` one direct superclass and `implement` zero or more interfaces:

```java
class Report extends Document implements Printable, Auditable { }
```

An interface can extend multiple interfaces. A class cannot extend two classes. An abstract class can implement an interface without implementing every method; it must remain abstract until a concrete subclass completes the contract.

### What if the constructor is private?

Code outside the allowed scope cannot call `new` directly. Private constructors are useful for factories, singletons with careful lifecycle control, utility classes, and classes that restrict instances. Reflection may sometimes bypass access checks, but module boundaries and security policy can prevent that, and bypassing a constructor can violate invariants.

```java
final class Token {
    private Token() { }

    static Token create() {
        return new Token();
    }
}
```

### What happens with a parameterized constructor?

The arguments are evaluated first. Java selects a matching constructor by signature, initializes the new object's fields according to the object-initialization rules, and then runs the constructor body. If validation throws an exception, construction completes abruptly and the reference is not returned.

## References

- [Oracle Java Classes and Objects](https://docs.oracle.com/javase/tutorial/java/javaOO/classes.html)
- [Oracle Java Defining Methods](https://docs.oracle.com/javase/tutorial/java/javaOO/methods.html)
- [Java Language Specification §12: Execution](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html)
- [Oracle Java launcher](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)
- [dev.java: Objects, Classes, Interfaces, Packages, and Inheritance](https://dev.java/learn/oop/)
