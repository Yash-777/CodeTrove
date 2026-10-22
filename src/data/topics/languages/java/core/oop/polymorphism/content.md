# Java Polymorphism

**Polymorphism** means “many forms.” In Java, one shared type can refer to objects of different concrete classes, and an operation can produce behavior appropriate to the actual object.

```java
interface Payment {
    void pay(double amount);
}

final class CardPayment implements Payment {
    public void pay(double amount) {
        System.out.println("Paid by card: " + amount);
    }
}

final class CashPayment implements Payment {
    public void pay(double amount) {
        System.out.println("Paid by cash: " + amount);
    }
}

static void checkout(Payment payment) {
    payment.pay(100); // implementation is selected from the runtime object
}

checkout(new CardPayment());
checkout(new CashPayment());
```

The `checkout` method depends on the `Payment` contract, not on a particular payment class. This makes implementations interchangeable and supports extension without rewriting the caller.

## Reference type versus object type

```java
Payment payment = new CardPayment();
```

There are two important types here:

- **Reference type:** `Payment`, known to the compiler. It controls which members may be called and which overload is selected.
- **Runtime object type:** `CardPayment`, created by `new`. It controls which overridable instance method implementation runs.

```java
payment.pay(100); // CardPayment.pay at runtime
```

The reference type must contain the method declaration. The runtime object must provide the implementation selected by dynamic dispatch. The reverse assignment is not automatically safe:

```java
Payment payment = new CardPayment();
// CardPayment card = payment; // compile error: reference type is only Payment

if (payment instanceof CardPayment card) {
    card.pay(100);
}
```

Use polymorphism instead of downcasting when the shared abstraction already provides the behavior the caller needs.

## Types of Java polymorphism

### 1. Compile-time polymorphism: overloading

Compile-time polymorphism is commonly called **static polymorphism**. It is implemented with method overloading. Multiple methods use the same name but have different parameter lists. The compiler selects one method from the declared argument types and count.

```java
class Printer {
    void print(String value) {
        System.out.println("Text: " + value);
    }

    void print(int value) {
        System.out.println("Number: " + value);
    }

    void print(String value, int copies) {
        for (int i = 0; i < copies; i++) {
            System.out.println(value);
        }
    }
}

Printer printer = new Printer();
printer.print("Hello"); // print(String)
printer.print(42);      // print(int)
```

The runtime object does not choose between overloads. The compiler performs overload resolution before the program runs.

### 2. Runtime polymorphism: overriding

Runtime polymorphism is commonly called **dynamic method dispatch**. A subclass overrides an inherited instance method, and Java selects the implementation based on the runtime object.

```java
class Animal {
    void speak() {
        System.out.println("Some sound");
    }
}

class Dog extends Animal {
    @Override
    void speak() {
        System.out.println("Bark");
    }
}

class Cat extends Animal {
    @Override
    void speak() {
        System.out.println("Meow");
    }
}

Animal first = new Dog();
Animal second = new Cat();
first.speak();   // Bark
second.speak();  // Meow
```

The reference type is `Animal`, but the JVM invokes the override belonging to `Dog` or `Cat`.

## Method declaration versus method signature

A method declaration can look like this:

```java
public static <T extends Number> String convert(T value, int radix)
                                throws IllegalArgumentException {
    return value.toString();
}
```

It contains modifiers, type parameters, return type, name, formal parameters, a `throws` clause, and a body. These pieces do not all form the **method signature**.

According to the Java Language Specification, a method signature consists of:

1. The **method name**.
2. The method's **type parameters**, if any.
3. The formal parameter types, after the applicable generic type adaptation.


What is NOT Part of a Method Signature?

It is a common point of confusion, but the following elements are completely excluded from the method signature:
 * ❌ Return type (e.g., int, void)
 * ❌ Access modifiers (e.g., public, private)
 * ❌ Non-access modifiers (e.g., static, final)
 * ❌ Parameter names (only the data types matter)
 * ❌ Thrown exceptions list

<table>
<thead><tr><td>ordinary example</td><td>Signatures are conceptually</td></tr></thead>
<tbody><tr><td>

```java
void save(String value) { }
void save(int value) { }
void save(String value, int count) { }
```

</td><td>

```java
save(String)
save(int)
save(String, int)
```

</td></tbody></table>

### What is not part of a method signature?

| Element | Part of method signature? | Explanation |
|---|---:|---|
| Method name | Yes | `save` identifies the method name. |
| Number of parameters | Indirectly yes | It is part of the formal parameter list. |
| Parameter types | Yes | `save(String)` and `save(int)` differ. |
| Parameter variable names | No | `save(String value)` and `save(String text)` have the same signature. |
| Return type | No | Return type alone cannot distinguish overloads. |
| `throws` clause | No | Checked exceptions do not distinguish overloads. |
| `public`, `private`, `static` | No | Modifiers affect access or dispatch, not the signature itself. |
| Method body | No | The body is the implementation. |

This is illegal because only the return type differs:

```java
int getValue() { return 1; }
// String getValue() { return "one"; } // compile error
```

This is also illegal because only the `throws` clause differs:

```java
void read() throws java.io.IOException { }
// void read() throws java.sql.SQLException { } // compile error
```

The `throws` clause is part of a method declaration, but not its signature.

---


The Core Rule for Overriding

When a subclass overrides a method declared in a superclass:
 * Allowed: The overriding method can throw the same checked exception, a subclass (sublevel) of that exception, or no exception at all.
 * Not Allowed: The overriding method cannot throw a broader checked exception or a same-level sibling checked exception that wasn't declared by the parent.


> Case A: Parent throws IOException ➡️ Child throws FileNotFoundException (ALLOWED)

Because FileNotFoundException extends IOException Oracle Java SE Docs, it is a sublevel exception. This is completely legal.
```java
class Parent {
    void read() throws java.io.IOException { }
}

class Child extends Parent {
    @Override
    void read() throws java.io.FileNotFoundException { } // ✅ Allowed! Subclass exception.
}
```

> Case B: Parent throws FileNotFoundException ➡️ Child throws IOException (COMPILATION ERROR)

You cannot throw a broader (parent) exception in the subclass method.
```java
class Parent {
    void read() throws java.io.FileNotFoundException { }
}

class Child extends Parent {
    @Override
    void read() throws java.io.IOException { } // ❌ Exception IOException is not compatible...
}
```


> Case C: Same-Level / Sibling Exceptions (COMPILATION ERROR)

If the parent throws FileNotFoundException, the child cannot throw a sibling exception like EOFException (which also extends IOException). Even though they are at the "same level" in the hierarchy, a sibling exception introduces a completely new checked exception that the calling code isn't prepared to catch.

```java
class Parent {
    void read() throws java.io.FileNotFoundException { }
}

class Child extends Parent {
    @Override
    void read() throws java.io.EOFException { } // ❌ Exception EOFException is not compatible...
}
```

Constructors also have signatures based on the constructor name and formal parameter types, but constructors do not have a return type and are not methods.

## Rules for method overloading

Methods are overloaded when they have the same name in the same class or inherited method context but different formal parameter lists.

```java
class Calculator {
    int add(int a, int b) {
        return a + b;
    }

    long add(long a, long b) {
        return a + b;
    }

    int add(int a, int b, int c) {
        return a + b + c;
    }
}
```

Important rules:

- The method name must match.
- The formal parameter list must differ by count, type, or type-parameter structure.
- Return type alone is not enough.
- `throws` clauses alone are not enough.
- Changing only parameter variable names is not enough.
- Overload selection happens at compile time.
- Inheritance can add overloads from a superclass, and a subclass can declare new overloads.

### Overloading and automatic conversions

The compiler may use widening conversions, boxing, unboxing, and varargs when selecting an overload. It generally prefers a more specific applicable method.

```java
class Demo {
    void show(int value) { System.out.println("int"); }
    void show(long value) { System.out.println("long"); }
    void show(Integer value) { System.out.println("Integer"); }
}

Demo demo = new Demo();
demo.show(1);       // int: exact match
demo.show(1L);      // long: exact match
Integer boxed = 1;
demo.show(boxed);   // Integer: exact reference match
```

If two overloads are equally applicable, the call may be ambiguous:

```java
class Ambiguous {
    void call(String value) { }
    void call(Integer value) { }
}

// new Ambiguous().call(null); // compile error: both overloads match
```

## Rules for method overriding

Overriding occurs when a subclass or implementing class provides an instance method that corresponds to an inherited method.

```java
class Document {
    String format() {
        return "plain";
    }
}

class HtmlDocument extends Document {
    @Override
    String format() {
        return "html";
    }
}

Document document = new HtmlDocument();
System.out.println(document.format()); // html
```

The main overriding rules are:

1. The method name must match.
2. The parameter types must match according to the overriding/subsignature rules.
3. The overriding method cannot reduce visibility.
4. The return type must be the same or covariant—a subtype of the original return type.
5. The overriding method cannot declare broader checked exceptions.
6. A method that is `final` cannot be overridden.
7. A `private` method is not inherited, so it cannot be overridden.
8. A static method is not overridden; it is hidden.
9. Use `@Override` so the compiler checks your intention.

### Access cannot become narrower

```java
class Parent {
    protected void work() { }
}

class Child extends Parent {
    @Override
    public void work() { } // valid: public is more accessible

    // private void work() { } // invalid: would reduce access
}
```

An overriding method may increase visibility but may not reduce it.

### Covariant return types

An overriding method may return a subtype of the original return type.

```java
class Animal { }
class Dog extends Animal { }

class AnimalFactory {
    Animal create() {
        return new Animal();
    }
}

class DogFactory extends AnimalFactory {
    @Override
    Dog create() { // Dog is a subtype of Animal
        return new Dog();
    }
}
```

Primitive return types cannot be covariant. They must match exactly.

## The `throws` clause and overriding

The `throws` clause is **not part of the method signature**, but it still affects whether an overriding declaration is legal.

The key rule is about **checked exceptions**:

- If the parent method declares a checked exception, the child may declare the same checked exception, a narrower subtype, or no checked exception.
- The child may not declare a broader checked exception or an unrelated checked exception.
- If the parent method declares no checked exception, the child cannot add a new checked exception.
- Unchecked exceptions (`RuntimeException` and its subclasses) are not restricted by this overriding rule.
- Errors are also unchecked and are not restricted by the checked-exception rule, although declaring them is usually poor API design.

### Same checked exception: valid

```java
class Parent {
    void read() throws java.io.IOException { }
}

class Child extends Parent {
    @Override
    void read() throws java.io.IOException { } // valid
}
```

### Narrower checked exception: valid

```java
class Parent {
    void load() throws java.io.IOException { }
}

class Child extends Parent {
    @Override
    void load() throws java.io.FileNotFoundException { }
}
```

`FileNotFoundException` is a subclass of `IOException`, so callers using a `Parent` reference remain safe.

### No checked exception: valid

```java
class Child extends Parent {
    @Override
    void read() { } // valid: declares less
}
```

### Broader checked exception: invalid

```java
class Parent {
    void save() throws java.io.FileNotFoundException { }
}

class Child extends Parent {
    // @Override
    // void save() throws java.io.IOException { }
    // compile error: IOException is broader than FileNotFoundException
}
```

### Unrelated checked exception: invalid

```java
class Parent {
    void connect() throws java.io.IOException { }
}

class Child extends Parent {
    // @Override
    // void connect() throws java.sql.SQLException { }
    // compile error: SQLException is not allowed by the parent contract
}
```

### Parent has no checked exception

```java
class Parent {
    void close() { }
}

class Child extends Parent {
    @Override
    void close() throws IllegalStateException { } // valid: unchecked

    // void close() throws java.io.IOException { } // invalid: new checked exception
}
```

The child method may catch a checked exception internally or convert it to an unchecked exception. Its declaration still cannot expose a new checked exception to callers using the parent type.

### What if the parent throws an unchecked exception?

There is no narrowing requirement for unchecked exceptions:

```java
class Parent {
    void run() throws IllegalStateException { }
}

class Child extends Parent {
    @Override
    void run() throws NullPointerException { } // valid: unchecked exception
}
```

Both are `RuntimeException` subclasses. Whether this is good API design depends on the contract and meaning of the method.

## Static methods: overloading and hiding

### Can static methods be overloaded?

Yes. Static methods can be overloaded when their parameter lists differ. Overload selection is still compile-time behavior.

```java
class MathTools {
    static int max(int a, int b) {
        return Math.max(a, b);
    }

    static double max(double a, double b) {
        return Math.max(a, b);
    }
}

MathTools.max(1, 2);
MathTools.max(1.5, 2.5);
```

### Can static methods be overridden?

No. A static method belongs to the class, so it is resolved by the class/reference type rather than dynamically dispatched by the object. A same-signature static method in a subclass **hides** the superclass method.

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
value.identify(); // Parent: reference type controls static method lookup
Child.identify(); // Child
```

Call static methods through the class name, not through an object reference:

```java
Parent.identify();
Child.identify();
```

| Parent method | Child method with same signature | Result |
|---|---|---|
| Instance | Instance | Overrides |
| Static | Static | Hides |
| Instance | Static | Compile-time error |
| Static | Instance | Compile-time error |

## Constructors and polymorphism

### Can constructors be overloaded?

Yes. Constructors can be overloaded because a class may provide multiple construction signatures.

```java
class User {
    private final String name;
    private final int age;

    User() {
        this("Unknown", 0);
    }

    User(String name) {
        this(name, 0);
    }

    User(String name, int age) {
        this.name = name;
        this.age = age;
    }
}
```

The compiler selects a constructor at compile time based on the arguments passed to `new`.

### Can constructors be overridden?

No. Constructors belong to the class that declares them, are not inherited, and do not participate in runtime dispatch. A subclass declares its own constructors and may invoke a superclass constructor with `super(...)`.

```java
class Parent {
    Parent(String value) { }
}

class Child extends Parent {
    Child() {
        super("created by Child");
    }
}
```

A constructor call is not polymorphic. The class named after `new` determines which class is being created, and constructor chaining proceeds from the superclass toward the subclass.

## Can final and private methods be overridden?

### `final` methods

No. A `final` method is deliberately closed to overriding.

```java
class Template {
    final void validate() {
        System.out.println("Always use this validation");
    }
}

class SpecialTemplate extends Template {
    // void validate() { } // compile error: cannot override final method
}
```

A `final` class cannot be subclassed at all.

### `private` methods

No. A private method is not inherited, so a same-named method in a child is a new method rather than an override.

```java
class Parent {
    private void audit() {
        System.out.println("Parent audit");
    }

    void run() {
        audit();
    }
}

class Child extends Parent {
    private void audit() {
        System.out.println("Child audit");
    }
}

new Child().run(); // Parent audit
```

The call inside `Parent.run()` is bound to `Parent.audit()`. The child method does not replace it.

## Interface polymorphism and default methods

A class can implement multiple interfaces. Interface instance methods participate in polymorphism. If two direct interfaces provide conflicting default methods, the class must resolve the conflict.

```java
interface A {
    default void show() {
        System.out.println("A");
    }
}

interface B {
    default void show() {
        System.out.println("B");
    }
}

class C implements A, B {
    @Override
    public void show() {
        A.super.show();
    }
}
```

Interface static methods are not inherited and are called through the interface name:

```java
interface Tools {
    static void help() {
        System.out.println("Help");
    }
}

Tools.help();
```

## Overloading versus overriding

| Feature | Overloading | Overriding |
|---|---|---|
| Main idea | Same name, different parameter list | Child replaces inherited instance behavior |
| Main time | Compile time/static polymorphism | Runtime/dynamic polymorphism |
| Requires inheritance? | No | Yes, or an interface implementation |
| Parameters | Must differ | Must match according to override rules |
| Return type | Cannot be the only difference | Same or covariant subtype |
| `throws` clause | Does not distinguish overloads | Checked exceptions must be same or narrower |
| `static` method | Can be overloaded | Cannot be overridden; it is hidden |
| `private` method | Same name may be declared independently | Cannot be overridden |
| `final` method | Can be overloaded with another parameter list | Cannot be overridden |
| Constructor | Can be overloaded | Cannot be overridden |
| Selection | Declared argument types | Runtime object for instance methods |

## Complete example

```java
import java.io.FileNotFoundException;
import java.io.IOException;

abstract class Report {
    abstract String render() throws IOException;

    void print() throws IOException {
        System.out.println(render());
    }
}

final class TextReport extends Report {
    @Override
    String render() throws FileNotFoundException {
        return "text report";
    }
}

final class HtmlReport extends Report {
    @Override
    String render() {
        return "<p>html report</p>";
    }
}

class ReportPrinter {
    void print(Report report) throws IOException {
        report.print();
    }

    void print(String text) {
        System.out.println(text);
    }
}

ReportPrinter printer = new ReportPrinter();
printer.print(new TextReport());
printer.print(new HtmlReport());
printer.print("A plain message");
```

`Report.render()` declares `IOException`. `TextReport.render()` narrows that checked exception to `FileNotFoundException`, while `HtmlReport.render()` declares none. Both are legal overrides. `ReportPrinter.print(Report)` and `print(String)` are overloads selected at compile time.

## Practical design guidance

Polymorphism works best when the parent type describes a meaningful contract and every implementation can honor it. If callers must repeatedly ask the runtime type with `instanceof`, the abstraction may be incomplete or the design may need composition.

Prefer interfaces for capabilities, abstract classes when related types share state or construction rules, composition when one type uses another, `@Override` on every intended override, private state, and `final` methods or classes when extension would be unsafe.

## Quick interview questions

<details><summary><strong>Does a method signature include the return type?</strong></summary>

No. A method signature contains the method name, type parameters, and formal parameter types. Return type, parameter variable names, access modifiers, `static`, and the `throws` clause are not part of the signature. Two methods cannot be overloaded only by changing return type.
</details>

<details><summary><strong>Does a method signature include `throws`?</strong></summary>

No. `throws` is part of the method declaration, not the method signature. However, checked exceptions constrain overriding: a child can declare the same checked exception, a subtype, or no checked exception, but not a broader or unrelated checked exception.
</details>

<details><summary><strong>If the parent throws an exception, what can the child throw?</strong></summary>

For checked exceptions, the child can throw the same exception, a subclass, or none. If the parent throws no checked exception, the child cannot add one. Unchecked exceptions are not restricted by this narrowing rule.
</details>

<details><summary><strong>Can static methods be overloaded and overridden?</strong></summary>

Static methods can be overloaded because different parameter lists create different signatures. They cannot be overridden. A same-signature static method in a subclass hides the parent method and is selected using the class or reference type.
</details>

<details><summary><strong>Why can constructors be overloaded but not overridden?</strong></summary>

Constructors can be overloaded because a class can expose several parameter lists. They cannot be overridden because constructors are not inherited and are tied to the class being created. A child constructor can only invoke a parent constructor with `super(...)`.
</details>

<details><summary><strong>Can a private or final method be overridden?</strong></summary>

A private method is not inherited, so a same-named child method is new rather than an override. A final method is inherited but explicitly cannot be overridden. `@Override` helps reveal accidental assumptions.
</details>

<details><summary><strong>Which method runs: the reference type or the object type?</strong></summary>

For an overridden instance method, the runtime object's implementation runs. For an overloaded method, the compiler uses declared argument types. For a static method, the class or reference type controls the selection.
</details>

## References

- [Java Language Specification §8.4: Method Declarations](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4)
- [Java Language Specification §8.4.2: Method Signature](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.2)
- [Java Language Specification §8.4.8: Inheritance, Overriding, and Hiding](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8)
- [Java Language Specification §8.4.6: Method Throws](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.6)
- [dev.java: Polymorphism](https://dev.java/learn/language/oop/inheritance/polymorphism/)
- [Oracle Java Tutorial: Overriding and Hiding Methods](https://docs.oracle.com/javase/tutorial/java/IandI/override.html)
- [Oracle Java Tutorial: Polymorphism](https://docs.oracle.com/javase/tutorial/java/IandI/polymorphism.html)
