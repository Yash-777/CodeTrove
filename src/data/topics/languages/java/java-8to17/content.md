# Java 8–17: functional style and modern language design

Java 8 changed everyday Java more than any release since Java 5. Lambdas, method references, default interface methods, streams, `Optional`, and `java.time` made APIs more expressive. Java 9–17 then added modules, local type inference, switch expressions, text blocks, records, pattern matching, and sealed classes.


---

Java 8 is still a common compatibility baseline for libraries and enterprise systems. Java 11 and Java 17 are long-term-support (LTS) milestones in many production environments. Java 9–15 introduced the language and runtime steps that culminated in the permanent records (16), pattern matching for `instanceof` (16), and sealed classes (17).

<details open><summary>Release overview (8 → 17)</summary>

| Version | Type | Headline features (easy to remember) |
|---|---|---|
| **8** | **LTS** | Lambda, Streams, Functional Interfaces, Optional, Date-Time API, Default methods |
| **9** | Feature | Modules (JPMS), `List.of()`, private interface methods, JShell |
| **10** | Feature | `var` (local variable type inference) |
| **11** | **LTS** | New `String` methods, `var` in lambda, standard `HttpClient`, run `.java` directly |
| **12** | Feature | `Collectors.teeing()`, `String.indent()`, switch expression (preview) |
| **13** | Feature | Text blocks (preview), `yield` (preview) |
| **14** | Feature | **Switch expressions (final)**, Records (preview), Helpful NPE messages |
| **15** | Feature | **Text blocks (final)**, Sealed classes (preview), Nashorn removed |
| **16** | Feature | **Records (final)**, **`instanceof` pattern matching (final)**, `Stream.toList()` |
| **17** | **LTS** | **Sealed classes (final)**, `RandomGenerator`, strong encapsulation of JDK internals |

> **Interview tip:** Only **8, 11, 17** (and 21) are LTS in this range.

</details>

<details open><summary>Java version - list all the feature in detail with examples</summary>

## Java 8

<details><summary>Lambda expressions</summary>

### Simple explanation

A **lambda expression** (also called an *anonymous function*, or loosely a *closure*) is a **short, nameless method** that you write exactly where you need it. It is a shorter replacement for an anonymous inner class, and it works only with a **functional interface** (an interface with one abstract method).

**One-line version:** *Lambda = a function without a name, used like a value.* (*"Lambda means function used as data".*)

**Easy to remember: P-A-B**

| Letter | Part | Meaning |
|---|---|---|
| **P** | **P**arameters | What goes in |
| **A** | **A**rrow `->` | "Goes to" |
| **B** | **B**ody | What it does or returns |

```java
(a, b)   -> a + b
 └─P─┘  └A┘ └B┘
```

**Why do we need it?**

| Problem before Java 8 | Lambda solution |
|---|---|
| To pass a small piece of logic you had to write a full class or an anonymous class | Write it in one line |
| Too many lines for a tiny task (the "vertical problem") | Short, focused code |
| An extra class for every anonymous class | No extra class is written; it runs through `invokedynamic`, which has less overhead |
| Hard to run work in parallel | Lambdas make `stream().parallel()` natural |

### Syntax rules

```java
(parameters) -> expression
(parameters) -> { statements; }
```

| Rule | Simple explanation | Example |
|---|---|---|
| No parameters | Empty `()` is **required** | `() -> System.out.println("Hi")` |
| One parameter | `()` is **optional** if you skip the type | `name -> name.length()` |
| Many parameters | `()` is **required**, comma separated | `(a, b) -> a + b` |
| Parameter types | Optional; Java **infers** them from context | `(a, b)` or `(int a, int b)` |
| One-expression body | No `{}`, no `return`; the value is returned automatically | `x -> x * 2` |
| Block body | Needs `{}`; use `return` if a value is expected | `x -> { return x * 2; }` |
| `void` method | Body returns nothing; `return` not needed | `s -> System.out.println(s)` |

> The lambda's parameters and result must **match** the single method of the functional interface.

### Common forms

```java
() -> System.out.println("Hello World")          // no parameters
name -> System.out.println("Hello " + name)      // single parameter, type inferred
(String name) -> name.length()                   // single parameter, explicit type
(a, b) -> a + b                                  // multiple parameters, single expression
(a, b) -> {                                      // multiple lines with explicit return
    int sum = a + b;
    return sum;
}
```

### Before vs after

| | Anonymous inner class (before) | Lambda (Java 8) |
|---|---|---|
| Code | `Runnable r = new Runnable() {`<br>`  public void run() {`<br>`    System.out.println("Running");`<br>`  }`<br>`};` | `Runnable r = () -> System.out.println("Running");` |
| Lines | 5 | 1 |
| Interface name written? | Yes (`new Runnable()`) | No; Java finds it from context |
| `this` means | The anonymous object itself | The **enclosing class** |
| New scope? | Yes | **No**, same scope as the surrounding code |
| Can be used with | Any class or interface | **Functional interfaces only** |

### Target type: "which interface is this lambda for?"

A lambda has **no interface name written**, so Java works it out from the **context**. That interface is the **target type**, and it must be a functional interface.

| Where the lambda is used | Example |
|---|---|
| Variable declaration | `Runnable r = () -> {};` |
| Assignment | `r = () -> {};` |
| `return` statement | `return () -> {};` |
| Array initializer | `new Callable[]{ () -> "a", () -> "b" }` |
| Method or constructor argument | `new Thread(() -> {...})` |
| Inside another lambda | `Callable<Runnable> c = () -> () -> {};` |
| Ternary `? :` | `flag ? (() -> "T") : (() -> "F")` |
| Cast | `(Runnable) () -> {}` |

> **Memory hook:** *No target type, no lambda.*

### Important rules (interview favourites)

| # | Rule | Simple explanation | Example |
|---|---|---|---|
| 1 | Only functional interfaces | Exactly one abstract method; `Object` methods like `equals` don't count | `Runnable`, `Callable`, `Comparator` |
| 2 | Return must match | `void` method → body returns nothing. `String` method → body must return a `String` | `Callable<String> c = () -> "Hi";` |
| 3 | Signature must match | Same number and types of parameters as the interface method | `() -> ...` for a 2-parameter method is a compile error |
| 4 | Effectively final | A local variable used inside a lambda can't be changed | `int i = 5; r = () -> i++;` ❌ |
| 5 | No new scope | A lambda parameter can't reuse a name from the enclosing method | `(e1, e2) -> ...` when `e1`, `e2` exist ❌ |
| 6 | `this` = outer class | `this` and `super` refer to the enclosing object | `() -> System.out.println(this)` |
| 7 | Exceptions | A lambda can throw only what the interface method declares | `Callable.call()` allows `Exception`; `Runnable.run()` does not |
| 8 | Poly expression | The same lambda can have different types in different contexts | Works with two interfaces that share a method signature |
| 9 | No generic lambdas | A lambda cannot declare its own type variables | `<T> (T t) -> ...` ❌ |
| 10 | Ambiguity → cast | If two interfaces fit, cast to choose one | `(PrivilegedAction<String>) () -> ...` |

### Examples

```java
// 1) Anonymous inner class  vs  Lambda
Runnable r = new Runnable() {
    public void run() { System.out.println("Anonymous InnerClass"); }
};
new Thread(r).start();

Runnable r2 = () -> System.out.println("Runnable using Lambda expression.");
new Thread(r2).start();
```

```java
// 2) Iterating a collection: for-each loop vs lambda
List<String> stringList = new ArrayList<String>();
stringList.add("Yash");
stringList.add("M");

for (String string : stringList) {
    System.out.println("Contents of List : " + string);
}
stringList.stream().forEach(string -> System.out.println("Contents : " + string));
```

```java
// 3) Lambda is an object: store it in a variable, pass it, return it
@FunctionalInterface
interface TaskComparator {
    boolean compareTasks(int a1, int a2);
}

public class TaskComparatorImpl {
    public static void main(String[] args) {
        TaskComparator myTaskComparator = (int a1, int a2) -> { return a1 > a2; };
        System.out.println(myTaskComparator.compareTasks(5, 2));   // true
        System.out.println(myTaskComparator.compareTasks(5, 10));  // false
    }
}

static Runnable getRunnable() {               // returning a lambda
    return () -> System.out.println("Hello from a thread");
}
```

```java
// 4) Custom functional interface (Addable)
interface Addable {
    int add(int a, int b);        // single abstract method
    // int deleted(int a);        // ❌ a second abstract method breaks lambda usage
}

Addable ad1 = (a, b) -> (a + b);                       // without return keyword
Addable ad2 = (int a, int b) -> { return a + b; };     // with return keyword
System.out.println(ad1.add(10, 20));                   // 30
System.out.println(ad2.add(100, 200));                 // 300

List<Integer> list = Arrays.asList(0, 1, 2, 5, 4, 5, 8, 1, 7, 4, 1, 9, 5, 0);
list.forEach(n -> System.out.println(n));              // lambda inside forEach
```

```java
// 5) Runnable (void) vs Callable (returns a value) and a custom service
new Thread(() -> System.out.println("Hello from a thread")).start();

Callable<String> c = () -> "Hello from Callable";
System.out.println(c.call());                          // Hello from Callable

interface HelloService { String hello(String firstname, String lastname); }
HelloService hs = (String firstname, String lastname) -> {
    String msg = "Hello " + firstname + " " + lastname;
    return msg;                                        // must be a String
};
System.out.println(hs.hello("Yash", "M"));
```

```java
// 6) Sorting: anonymous class vs lambda
Collections.sort(personList, new Comparator<Person>() {
    public int compare(Person p1, Person p2) {
        return p1.getSurName().compareTo(p2.getSurName());
    }
});
Collections.sort(personList, (p1, p2) -> p1.getSurName().compareTo(p2.getSurName()));
Collections.sort(productList, (p1, p2) -> p1.name.compareTo(p2.name));

Comparator<Integer> comparator = (a, b) -> Integer.compare(a, b);
Comparator<Integer> comparable = (i, j) -> i.compareTo(j);
// Comparable<Integer> c = (i, j) -> i.compareTo(j);  // ❌ compareTo takes ONE argument
```

```java
// 7) Effectively final, 'this', and overload resolution
int base = 10;
Function<Integer, Integer> add = x -> x + base;   // ✅ base is never changed
// base = 20;                                     // ❌ would break the lambda

public class HelloLambda {
    Runnable r = () -> System.out.println(this);  // prints the enclosing object
    public String toString() { return "Hello from Class HelloLambda"; }
}

static String hello(Runnable r)  { return "Runnable"; }
static String hello(Callable c)  { return "Callable"; }
hello(() -> "Hi");   // "Callable": the lambda returns a value, so Runnable can't fit
```

### Common mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| Lambda on an interface with 2+ abstract methods | Not a functional interface | Keep one abstract method |
| Changing a local variable inside a lambda | Must be effectively final | Use `AtomicInteger` or an array holder |
| Missing `return` in a block body | Interface expects a value | Add `return value;` |
| Same name as an outer variable | Lambda has no new scope | Rename the lambda parameter |
| Checked exception in `Runnable` | `run()` has no `throws` | Use try/catch or use `Callable` |

> **Interview tip:** Use a lambda when the body is short. If it only calls an existing method, prefer a **method reference** (`Person::getSurName`).

</details>

<details><summary>Closure (JavaScript idea → Java lambda)</summary>

### Simple explanation

A **closure** is a function that **remembers the variables from the place where it was created**, even after that outer place has finished running. Oracle calls Java lambdas "closures" for this reason.

**One-line version:** *Closure = function + the variables it carries in its backpack.* 🎒

| Idea | Meaning |
|---|---|
| Function | A person leaving a house |
| Outer variables | Things in the house |
| Closure | The person takes a backpack of those things; even after the house is gone, they can still use them |

### JavaScript, step by step

```javascript
// Step 1: an inner function can see outer variables
function outer() {
  let name = "Yash";
  function inner() { console.log(name); }
  inner();
}
outer();   // Yash

// Step 2: return the inner function -> this is the closure
function outer2() {
  let name = "Yash";
  return function () { console.log(name); };
}
const fn = outer2();   // outer2() has FINISHED running
fn();                  // Yash  <- still remembers 'name'

// Step 3: private state
function makeCounter() {
  let count = 0;                 // nobody outside can touch it
  return function () { count++; return count; };
}
const counter1 = makeCounter();
console.log(counter1());   // 1
console.log(counter1());   // 2
const counter2 = makeCounter();   // new closure, own backpack
console.log(counter2());   // 1
```

| Concept | Simple definition | Example |
|---|---|---|
| Closure | Inner function that keeps access to outer variables after the outer function ends | `return function() { count++ }` |
| Lexical scope | A function uses the variables from **where it was written**, not where it is called | inner sees outer's `name` |
| Private variable | Data hidden inside the closure | `count` in `makeCounter` |
| Own copy per call | Each outer call creates a new closure | `counter1` vs `counter2` |
| Reference, not copy | The closure keeps the variable itself, so changes are visible | `count++` |

| Real use | Why closure helps | Example |
|---|---|---|
| Counter / private state | Hides data | `makeCounter()` |
| Function factory | Create customised functions | `makeMultiplier(2)` |
| Callbacks / event handlers | Handler remembers its surroundings | `button.onclick = () => log(userId)` |
| `setTimeout` / async | Delayed code still sees its variables | `setTimeout(() => log(msg), 1000)` |

```javascript
function makeMultiplier(x) { return (n) => n * x; }
const double = makeMultiplier(2);
const triple = makeMultiplier(3);
console.log(double(5));   // 10
console.log(triple(5));   // 15

// Classic trap: var in a loop
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 100);   // 3, 3, 3  (one shared i)
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i), 100);   // 0, 1, 2  (new i per round)
```

### Java lambda vs JavaScript closure

| | JavaScript closure | Java lambda |
|---|---|---|
| Uses outer variables | ✅ Yes | ✅ Yes |
| Can **change** the outer variable | ✅ Yes | ❌ No, must be *final or effectively final* |
| What it captures | The variable itself | A **copy of the value** |
| Private mutable state | `let count` | `AtomicInteger`, an array, or a class field |

```java
int count = 0;
Runnable r = () -> count++;        // ❌ must be final or effectively final

AtomicInteger counter = new AtomicInteger();                      // ✅ workaround 1
Runnable r1 = () -> System.out.println(counter.incrementAndGet());
r1.run();   // 1
r1.run();   // 2

static Function<Integer, Integer> makeMultiplier(int x) {         // ✅ workaround 2: factory
    return n -> n * x;               // lambda captures x
}
System.out.println(makeMultiplier(3).apply(5));   // 15
```

> **Interview tip:** In Java, a lambda that uses a surrounding variable is a closure. It captures the **value**, which is why that variable can never change.

</details>

<details><summary>Functional interfaces</summary>

### Simple explanation

*Any interface with a **single abstract method (SAM)** is a functional interface.* Since there is only one abstract method, there is no confusion about which method the lambda implements. Annotate it with **`@FunctionalInterface`** (recommended: the compiler errors if the rule is broken).

| Rule | Explanation | Example |
|---|---|---|
| Exactly one abstract method | `default` and `static` methods **do not count** | `interface A { void f(); default void g(){} }` ✅ |
| `Object` methods don't count | Abstract methods matching public `java.lang.Object` methods are ignored | `boolean equals(Object o);` `String toString();` `int hashCode();` |
| Not allowed | `protected` or `final` Object methods | `clone()`, `notify()` |
| Inheritance | Can extend another interface **only if it adds no extra abstract method** | see below |
| Annotation optional | The compiler treats any interface meeting the definition as functional | – |

Instances can be created with **lambda expressions, method references, or constructor references**.

```java
// Without annotation (still functional)
interface Addable {
    int add(int a, int b);
    boolean equals(Object obj);   // Object method - does not count
}

// With annotation
@FunctionalInterface
interface Sayable {
    void say(String msg);         // abstract method
    int hashCode();               // Object method - does not count
    String toString();            // Object method - does not count
}

// ❌ Invalid: Saydoit has TWO abstract methods (say + doIt)
@FunctionalInterface
interface Saydoit extends Sayable {
    void doIt();                  // compile-time error
}
```

```java
// Where functional interface instances can be created
Predicate<String> p = String::isEmpty;               // assignment context
stream.filter(e -> e.getSize() > 10);                // method invocation context
stream.map((ToIntFunction<Emp>) e -> e.getSize());   // cast context

// JDK example: BiFunction (abstract apply + default andThen)
@FunctionalInterface
public interface BiFunction<T, U, R> {
    R apply(T t, U u);
    default <V> BiFunction<T, U, V> andThen(Function<? super R, ? extends V> after) {
        Objects.requireNonNull(after);
        return (T t, U u) -> after.apply(apply(t, u));
    }
}
```

### Built-in functional interfaces (`java.util.function`)

| Interface | Method | Takes → returns | Simple meaning | Example |
|---|---|---|---|---|
| `Function<T,R>` | `apply` | 1 arg → result | Transform a value | `Function<Integer,Integer> f = x -> x + 10;` |
| `Consumer<T>` | `accept` | 1 arg → nothing | Do a side effect | `Consumer<String> c = System.out::println;` |
| `Supplier<T>` | `get` | nothing → result | Produce a value | `Supplier<Double> s = Math::random;` |
| `Predicate<T>` | `test` | 1 arg → boolean | Test a condition | `Predicate<Integer> even = v -> v % 2 == 0;` |
| `BiFunction<T,U,R>` | `apply` | 2 args → result | Combine two values | `BiFunction<Integer,Integer,Integer> add = (a,b) -> a+b;` |
| `BiPredicate<T,U>` | `test` | 2 args → boolean | Test two values | `BiPredicate<Integer,Integer> div = (a,b) -> a % b == 0;` |
| `UnaryOperator<T>` | `apply` | 1 arg → same type | `Function<T,T>` | `UnaryOperator<String> up = String::toUpperCase;` |
| `BinaryOperator<T>` | `apply` | 2 args → same type | `BiFunction<T,T,T>` | `BinaryOperator<Integer> mul = (a,b) -> a*b;` |
| `Runnable` | `run` | nothing → nothing | Run a task | `Runnable r = () -> {};` |
| `Callable<V>` | `call` | nothing → result (may throw) | Task with result | `Callable<String> c = () -> "ok";` |

```java
Predicate<Integer> isEven    = value -> value % 2 == 0;
Predicate<Integer> isNotZero = value -> value != 0;
BiPredicate<Integer, Integer> isDivisible = (a, b) -> a % b == 0;

Predicate<Integer> isEven2 = value -> {          // exception handling inside a lambda
    try { return value % 2 == 0; }
    catch (Exception e) { /* handle */ }
    return false;
};

Predicate<String> longName = name -> name.length() >= 4;
Function<String, String> normalized = String::trim;
System.out.println(longName.test(normalized.apply(" Ada ")));
```

</details>

<details><summary>Method references</summary>

### Simple explanation

A method reference points to a method **by name** using the `::` (double colon). Use it when a lambda **only calls an existing method**; it is shorter and more readable. *They are compact, easy-to-read lambda expressions for methods that already have a name.*

| Kind | Syntax | Simple meaning | Example |
|---|---|---|---|
| Static method | `ContainingClass::staticMethodName` | Refer to a `static` method | `Integer::parseInt` |
| Instance method of a particular object | `containingObject::instanceMethodName` | Method on an **existing object** | `System.out::println`, `myApp::appendStrings2` |
| Instance method of an arbitrary object of a type | `ContainingType::methodName` | First lambda argument becomes the receiver | `String::compareToIgnoreCase`, `String::concat` |
| Constructor | `ClassName::new` | Create objects | `HashSet::new`, `Integer[]::new` |

> `System.out::println`: `out` is a static `PrintStream` field of `System`; `println` is an instance method on it.

```java
// Reference class
public class LambdaExpression {
    public static int add(int a, int b)   { return a + b; }
    public static int add10(int a)        { return a + 10; }
    public static void printVlaue(int a)  { System.out.println("accepts a single input argument and returns no result." + a); }
    public void printVlaue_obj(int a)     { System.out.println("OBJ « accepts a single input argument and returns no result." + a); }
}
```

```java
// 1) Static method references
Random random = new Random();
random.ints().limit(10).forEach(System.out::println);

BiFunction<Integer, Integer, Integer> args2WithReturnVal = LambdaExpression::add;
System.out.println(args2WithReturnVal.apply(10, 20));            // 30  (two args -> result)

Function<Integer, Integer> args1WithReturnVal = LambdaExpression::add10;
System.out.println(args1WithReturnVal.apply(10));                // 20  (one arg -> result)

Consumer<Integer> args1WithNoReturnVal = LambdaExpression::printVlaue;
args1WithNoReturnVal.accept(10);                                 // one arg -> no result

// 2) Instance method reference (particular object)
Consumer<Integer> objRef = new LambdaExpression()::printVlaue_obj;
objRef.accept(20);

// 3) Constructor / array constructor reference
Stream<Integer> intStream = Stream.of(1, 2, 3, 4);
Integer[] intArray = intStream.toArray(Integer[]::new);

// 4) Method reference to your own static method
class Method_References {
    public static void main(String[] a) {
        BiFunction<Integer, Integer, Integer> adder = Method_References::add;
        System.out.println("Apply : " + adder.apply(10, 20));
    }
    public static int add(int a, int b) { return a + b; }
}
```

```java
// Replacing a lambda with a method reference (Oracle's Employee sort)
Collections.sort(list, (x, y) -> x.getLastName().compareTo(y.getLastName()));
Collections.sort(list, Employee::compareByLastName);       // static method
Employee employee = new Employee();
Collections.sort(list, employee::compareByLastName);       // instance method of a particular object
Collections.sort(stringList, String::compareTo);           // arbitrary object of a type

// Constructor reference as a Supplier
Multimaps.newListMultimap(Maps.<ImageTypeEnum, Collection<String>> newHashMap(), ArrayList<String>::new);
```

</details>

<details><summary>Default and static interface methods</summary>

### Simple explanation

A **default method** has a body inside an interface. It lets you add new methods to old interfaces **without breaking** existing implementing classes (*interface evolution*). Oracle calls these *virtual extension methods*. A **static method** belongs to the interface itself and is called as `InterfaceName.method()`; it is not inherited.

| Feature | Simple definition | Example |
|---|---|---|
| `default` method | Inherited by implementing classes; can be overridden | `default void print() { ... }` |
| `static` method | Not inherited; called via the interface name | `I1.i1();` |
| Diamond problem | Two interfaces with the same default method → class **must override** | `I1.super.print();` |
| Fields | Interface fields are `final`, so a default method cannot assign them | – |
| No body? | A method marked `default` must have an implementation | – |

```java
interface Auditable {
    default String auditLabel() { return "unclassified"; }
    static boolean valid(String value) { return value != null && !value.isBlank(); }
}

// JDK uses default methods to evolve interfaces
public interface Iterable<T> {
    default void forEach(Consumer<? super T> action) {
        Objects.requireNonNull(action);
        for (T t : this) action.accept(t);
    }
    default Spliterator<T> spliterator() {
        return Spliterators.spliteratorUnknownSize(iterator(), 0);
    }
}
// Added to List in 1.8: replaceAll(UnaryOperator<E>), sort(Comparator<? super E>)
```

**Multiple inheritance: same default method in two interfaces**

```java
interface I1 {
    static void i1() { System.out.println("I1 static function"); }
    default void print() { System.out.println("I1 print"); }
}
interface I2 {
    static void i2() { System.out.println("I2 static function"); }
    default void print() { System.out.println("I2 print"); }
}
public class MultipleInheritance implements I1, I2 {
    public static void main(String[] args) {
        new MultipleInheritance().print();   // I1 print
    }
    @Override
    public void print() {
        I1.super.print();   // explicitly choose I1's version (resolves the conflict)
    }
}
```

**Virtual extension methods (Oracle `EmployeeDefault`)**: an implementing class does not have to override defaults.

```java
public interface EmployeeDefault {
    String name = "John Smith";
    String title = "PHP Developer";
    String dept = "PHP";

    default void setName(String name) { System.out.println(name); }
    default String getName()          { return name; }
    default String getTitle()         { return title; }
    default String getDept()          { return dept; }
}

public class EmployeeDefaultImpl implements EmployeeDefault {     // overrides nothing
    public static void main(String[] args) {
        EmployeeDefaultImpl e = new EmployeeDefaultImpl();
        System.out.println(e.getName());    // John Smith
        System.out.println(e.getTitle());   // PHP Developer
    }
}
```

`Map` in Java 8 gained many defaults: `getOrDefault`, `forEach`, `replaceAll`, `putIfAbsent`, `remove(key, value)`, `replace`, `computeIfAbsent`, `computeIfPresent`, `compute`, `merge`. A class implementing `Map` only needs the abstract ones.

</details>

<details><summary>Stream API: pipeline, not a collection</summary>

### Simple explanation

A **Stream** is *"a sequence of elements from a source that supports aggregate operations."* It describes a computation over a source. It is **not** a collection or data structure: it does not store data, and elements are computed on demand. Intermediate operations such as `filter` and `map` are lazy; a terminal operation such as `collect`, `count`, or `reduce` starts the pipeline.

> **3 parts of every pipeline:** ① a data source → ② zero or more intermediate operations → ③ exactly one terminal operation.

| Concept | Simple definition | Example |
|---|---|---|
| Data source | Where elements come from (collection, array, I/O) | `list.stream()` |
| Intermediate operation | Returns another stream; **lazy** | `filter`, `map`, `sorted`, `distinct`, `limit`, `flatMap` |
| Terminal operation | Triggers the pipeline and produces the result; the stream is then **closed** | `collect`, `forEach`, `reduce`, `count`, `min`, `max` |
| Pipelining | Chain operations to form a query (enables laziness and short-circuiting) | `.filter().map().collect()` |
| Internal iteration | The stream iterates for you (vs an external `for` loop) | `forEach(...)` |
| Sequential vs parallel | `stream()` is single-thread, `parallelStream()` uses multiple cores | `list.parallelStream()` |
| Reuse | A stream **cannot be reused** → `IllegalStateException: stream has already been operated upon or closed` | – |

```java
Stream.of(1, 2, 3, 4, 5)             // source
      .filter(x -> x % 2 == 0)       // intermediate
      .collect(Collectors.toList()); // terminal  -> [2, 4]
```

```java
// for-each loop  vs  stream pipeline
for (Person p : roster) {
    if (p.getGender() == Person.Sex.MALE) System.out.println(p.getName());
}
roster.stream()
      .filter(e -> e.getGender() == Person.Sex.MALE)
      .forEach(e -> System.out.println(e.getName()));
```

> *The Streams API will internally decompose your query to leverage the multiple cores on your computer.* Streams do not automatically make code faster. Parallel streams use a shared pool by default and can hurt blocking I/O, small inputs, shared mutable state, or order-sensitive work.

```java
// Stream examples (Oracle article)
List<Integer> transactionsIds = transactions.stream()
    .filter(t -> t.getType() == Transaction.GROCERY)
    .sorted(comparing(Transaction::getValue).reversed())
    .map(Transaction::getId)
    .collect(toList());

Files.lines(Paths.get("stuff.txt"))      // unique words in a file
     .map(line -> line.split("\\s+"))    // Stream<String[]>
     .flatMap(Arrays::stream)            // Stream<String>
     .distinct()
     .forEach(System.out::println);

Map<Currency, List<Transaction>> byCurrency =
    transactions.stream().collect(groupingBy(Transaction::getCurrency));
```

</details>

<details><summary>Stream operations: filter, map, sorted, reduce, count, min, max, distinct</summary>

### Simple explanation

| Operation | Type | Simple definition | Example | Result |
|---|---|---|---|---|
| `filter(Predicate)` | Intermediate | Keep elements matching a condition | `list.stream().filter(isEven)` | `[0, 2, 4, 8, 4, 0]` |
| `map(Function)` | Intermediate | Transform each element | `.map(String::toUpperCase)` | `[A, B, C, D]` |
| `sorted()` | Intermediate | Sort (natural order or a Comparator) | `.sorted(Comparator.reverseOrder())` | `[5,4,3,2,1]` |
| `distinct()` | Intermediate | Remove duplicates (uses `equals()`, stateful) | `.distinct()` | `[A,B,C,D,F]` |
| `flatMap` | Intermediate | Flatten streams of streams | `.map(l -> l.split("\\s+")).flatMap(Arrays::stream)` | words |
| `mapToInt/Double/Long` | Intermediate | Convert to a primitive stream | `.mapToInt(i -> i).sum()` | `27` |
| `count()` | Terminal | Number of elements | `list.stream().count()` | `7` |
| `reduce(identity, op)` | Terminal | Combine all into one value | `.reduce(0, Integer::sum)` | `27` |
| `min/max(Comparator)` | Terminal | Smallest/largest as `Optional` | `.max(Integer::compare).get()` | `9` |
| `collect(Collector)` | Terminal | Gather into List/Set/Map | `.collect(Collectors.toList())` | `List` |
| `forEach(Consumer)` | Terminal | Perform an action on each element | `.forEach(System.out::println)` | – |
| `forEachOrdered` | Terminal | `forEach` that keeps order in parallel | `parallelStream().forEachOrdered(...)` | ordered |

| processElements action | Aggregate operation |
|---|---|
| Obtain a source of objects | `Stream stream()` |
| Filter objects that match a `Predicate` | `Stream filter(Predicate<? super T> predicate)` |
| Map objects to another value via a `Function` | `Stream map(Function<? super T,? extends R> mapper)` |
| Perform an action via a `Consumer` | `void forEach(Consumer<? super T> action)` |

```java
// map: lazy intermediate operation
List<Integer> list = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));
List<Integer> ans = list.stream().map(value -> value * 10).collect(Collectors.toList());
// [10, 20, 30, 40, 50]

List<String> alpha = Arrays.asList("a", "b", "c", "d");
List<String> upper = alpha.stream().map(String::toUpperCase).collect(Collectors.toList()); // [A, B, C, D]

// sorted
List<Integer> nums = new ArrayList<>(Arrays.asList(5, 1, 3, 4, 2));
nums.stream().sorted().forEach(System.out::println);                          // ascending
nums.stream().sorted(Comparator.reverseOrder()).forEach(System.out::println); // descending

// filter with Predicate
Predicate<Integer> isEven = value -> value % 2 == 0;
List<Integer> evenList = list.stream().filter(isEven).collect(Collectors.toList());

List<String> listItems = Arrays.asList("Lambdas", "Default Method", "Stream API", "Date API", "Lambdas");
Predicate<String> startsWithD = names -> names.startsWith("D");
listItems.stream().filter(startsWithD).forEach(System.out::println);   // Default Method, Date API
```

```java
// reduce / sum / count
List<Integer> list2 = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5, 6, 6));

int sum = 0;                                       // the loop that reduce replaces
for (int x : list2) { sum += x; }                  // two parameters: initial value (0) and the operation (+)

int reduceSum  = list2.stream().reduce(0, (value, acc) -> acc += value);   // 27
int reduceSum2 = list2.stream().reduce(0, Integer::sum);                   // 27
int mapSum     = list2.stream().mapToInt(i -> i).sum();                    // 27
long count     = list2.stream().count();                                   // 7

String lastItem = Stream.of(str.split("-")).reduce((first, last) -> last).get();   // last item

Integer[] intArray = {1, 2, 3, 4, 5, 6, 7, 8};
List<Integer> listOfIntegers = new ArrayList<>(Arrays.asList(intArray));
System.out.println("Sum of integers: " + listOfIntegers.stream().reduce(Integer::sum).get());
```

```java
// min / max
List<Integer> data = Arrays.asList(0, 1, 2, 5, 4, 5, 8, 1, 7, 4, 1, 9, 5, 0);
Integer maxVal = data.stream().max((i, j) -> i.compareTo(j)).get();        // 9
Integer minVal = data.stream().min((a, b) -> Integer.compare(a, b)).get(); // 0
int maxValue = data.stream().reduce(1, Integer::max);
int minValue = data.stream().reduce(1, Integer::min);
// ⚠ the identity (1) takes part: if every value were above 1, minValue would wrongly be 1

// distinct
List<String> letters = new ArrayList<>(Arrays.asList("A","B","C","D","A","B","C","A","F","C"));
List<String> unique = letters.stream().distinct().collect(Collectors.toList());

// numeric ranges: range (exclusive) / rangeClosed (inclusive)
IntStream oddNumbers = IntStream.rangeClosed(10, 30).filter(n -> n % 2 == 1);

// Optional avoids an NPE when the list itself may be null
Optional.ofNullable(list).orElseGet(ArrayList::new).stream();

// Stream components: source -> intermediate -> terminal
Stream.of(1, 2, 3, 4, 5).filter(x -> x % 2 == 0).collect(Collectors.toList());
```

</details>

<details><summary>Parallel streams and Spliterator</summary>

### Simple explanation

A **parallel stream** splits the work across several threads. Create it with `parallelStream()` on a collection or `.parallel()` on a stream. A **Spliterator** is a special `Iterator` that can **traverse and partition** a source to support parallel traversal; it does not provide the parallelism itself.

| Concept | Simple definition | Example output |
|---|---|---|
| `forEach` on parallel | Order **not guaranteed** | `7 4 1 0 9 1 1 2 8 4 5 5 0 5` |
| `forEachOrdered` on parallel | Keeps original order | `0 1 2 5 4 5 8 1 7 4 1 9 5 0` |
| When to use | Many independent tasks / large data; has overhead for splitting, scheduling and merging | – |

```java
List<Integer> list = Arrays.asList(0, 1, 2, 5, 4, 5, 8, 1, 7, 4, 1, 9, 5, 0);

list.parallelStream().forEach(i -> System.out.print(" " + i));        // random order
list.parallelStream().forEachOrdered(i -> System.out.print(" " + i)); // 0 1 2 5 4 5 8 ...
list.stream().forEach(i -> System.out.print(" " + i));                // sequential, in order
list.stream().parallel().forEach(i -> System.out.print(" " + i));     // random order
```

```java
// Spliterator and the single-use rule
List<String> stringList = new ArrayList<String>();
stringList.add("Yash"); stringList.add("M");

Stream<String> stream = stringList.stream();
stream.forEach(string -> System.out.println("Contents : " + string));
// stream.forEach(...) again -> IllegalStateException: stream has already been operated upon or closed

Spliterator<String> splitIttr = stringList.spliterator();
System.out.println("Spliterator Char : " + splitIttr.characteristics());

// How the JDK wires it (Java 8)
public interface Collection<E> extends Iterable<E> {
    @Override default Spliterator<E> spliterator() { return Spliterators.spliterator(this, 0); }
}
public interface List<E> extends Collection<E> {
    @Override default Spliterator<E> spliterator() { return Spliterators.spliterator(this, Spliterator.ORDERED); }
}
public class ArrayList<E> ... {
    @Override public Spliterator<E> spliterator() { return new ArrayListSpliterator<>(this, 0, -1, 0); }
}
```

</details>

<details><summary>Collectors: toList, groupingBy, toMap, counting</summary>

### Simple explanation

`java.util.stream.Collectors` provides ready-made terminal collectors: `toList()`, `toSet()`, `toMap()`, `groupingBy()`, `counting()`, `joining()`, `partitioningBy()`.

| Collector | Simple definition | Example |
|---|---|---|
| `toList()` / `toSet()` | Collect into a `List` / `Set` | `.collect(Collectors.toList())` |
| `groupingBy(f)` | Group elements by key → `Map<K, List<T>>` | `groupingBy(Emp::getCountry)` |
| `groupingBy(f, downstream)` | Nested or grouped result | `groupingBy(Emp::getCountry, groupingBy(Emp::getState))` |
| `counting()` | Count per group | `groupingBy(identity(), counting())` |
| `toMap(k, v, merge)` | Build a map; the merge function resolves duplicate keys | `toMap(identity(), v -> 1L, Long::sum)` |

```java
@lombok.Data @lombok.AllArgsConstructor
class Emp { String name; int age; String country, state, district; }

public class Test4 {
    public static void main(String[] args) {
        List<Emp> empList = Arrays.asList(
            new Emp("A", 19, "IND", "TS", "HYD"),
            new Emp("B",  9, "IND", "TS", "KNR"),
            new Emp("AC",21, "IND", "TS", "PDPL"),
            new Emp("Ay",21, "IND", "AP", "VZG"),
            new Emp("C", 21, "IND", "AP", "KRNL"),
            new Emp("Cg",21, "IND", "UP", "MP"),
            new Emp("yC",21, "IND", "KL", "TRNPM"),
            new Emp("po",21, "IND", "TN", "CN"),
            new Emp("yt",21, "US",  "NC", "NC"));

        Map<String, List<Emp>> res = empList.stream()
                .collect(Collectors.groupingBy(Emp::getCountry));

        Map<String, Map<String, List<Emp>>> res2 = empList.stream()
                .collect(Collectors.groupingBy(Emp::getCountry,
                         Collectors.groupingBy(Emp::getState)));
        // {US={NC=[...]}, IND={KL=[...], TN=[...], UP=[...], AP=[...], TS=[...]}}
    }
}
```

Output of the first grouping (HashMap order may differ):

```text
{US=[Emp(name=yt, age=21, country=US, state=NC, district=NC)], IND=[Emp(name=A, ...), Emp(name=B, ...), ... 8 employees]}
```

</details>

<details><summary>Finding duplicates and counting occurrences</summary>

### Simple explanation

| Approach | Simple definition | Example |
|---|---|---|
| `groupingBy + counting` | Count of each element | `groupingBy(Function.identity(), Collectors.counting())` |
| `toMap` with merge | Same result using `toMap` | `toMap(Function.identity(), v -> 1L, Long::sum)` |
| `Collections.frequency` | Keep elements whose frequency is above 1 | `filter(i -> Collections.frequency(list, i) > 1)` |
| `Set.add()` trick | `add()` returns `false` if already present → duplicate | `filter(n -> !seen.add(n))` |

```java
int[] arr = {10, 40, 10, 30, 30, 20};
// ❌ Arrays.asList(arr) gives List<int[]> (wrong). Box first:
List<Integer> listBoxed = Arrays.stream(arr).boxed().collect(Collectors.toList());

// 1) Count occurrences
Map<Integer, Long> map = listBoxed.stream()
    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
// {20=1, 40=1, 10=2, 30=2}

Map<Integer, Long> map2 = Arrays.stream(arr).boxed()
    .collect(Collectors.toMap(Function.identity(), v -> 1L, Long::sum));

// 2) Duplicates using Collections.frequency
Set<Integer> repeatedSet = listBoxed.stream()
    .filter(i -> Collections.frequency(listBoxed, i) > 1)   // stream -> [10, 10, 30, 30]
    .collect(Collectors.toSet());                           // Set removes duplicates -> [10, 30]

List<Integer> repeatedList = listBoxed.stream()
    .filter(i -> Collections.frequency(listBoxed, i) > 1)
    .distinct()                                             // -> [10, 30]
    .collect(Collectors.toList());

// 3) Duplicates using Set.add()
Set<Integer> seen = new HashSet<>();
System.out.println(seen.add(777));   // true : element added
System.out.println(seen.add(777));   // false: already in the set
List<Integer> duplicates = listBoxed.stream()
    .filter(n -> !seen.add(n))                              // -> [10, 30]
    .collect(Collectors.toList());

// 4) Same idea with forEach
Set<Integer> seen2 = new HashSet<>();
Set<Integer> dups = new HashSet<>();
Arrays.stream(arr).forEach(n -> { if (!seen2.add(n)) dups.add(n); });
```

</details>

<details><summary>Comparator and sorting enhancements</summary>

### Simple explanation

`Comparable.compareTo(obj)` gives **one natural sort order** (inside the class). `Comparator.compare(o1, o2)` gives **many sort orders** (outside the class) and is a `@FunctionalInterface` since Java 8.

| Comparator method (Java 8) | Simple definition | Example |
|---|---|---|
| `Comparator.naturalOrder()` | Ascending natural order | `sorted(Comparator.naturalOrder())` |
| `Comparator.reverseOrder()` | Descending natural order | `sorted(Comparator.reverseOrder())` |
| `Comparator.comparing(keyFn)` | Sort by an extracted key | `comparing(Student::getName)` |
| `comparingInt/Long/Double` | Avoids boxing for primitive keys | `comparingInt(Student::getAge)` |
| `.reversed()` | Reverse any comparator | `comparing(...).reversed()` |
| `.thenComparing(...)` | Tie-breaker / multi-key sort | `comparing(Emp::getCreationTime).thenComparing(Emp::getName)` |

```java
// Comparable: single sort sequence (since 1.2)
public interface Comparable<T> { int compareTo(T o); }

// Comparator: functional, with Java 8 additions
@FunctionalInterface
public interface Comparator<T> {
    int compare(T o1, T o2);
    boolean equals(Object obj);        // does not count toward the abstract method count

    default Comparator<T> reversed() { return Collections.reverseOrder(this); }
    default Comparator<T> thenComparing(Comparator<? super T> other) {
        Objects.requireNonNull(other);
        return (Comparator<T> & Serializable) (c1, c2) -> {
            int res = compare(c1, c2);
            return (res != 0) ? res : other.compare(c1, c2);
        };
    }
    // static: reverseOrder(), naturalOrder(), comparing(), comparingInt(), comparingLong(), comparingDouble()
}
```

```java
// Comparable with lambda on Strings and Integers (they already implement Comparable)
List<String> names = Arrays.asList("Banana", "Apple", "Mango", "Cherry");
Collections.sort(names, (s1, s2) -> s1.compareTo(s2));      // [Apple, Banana, Cherry, Mango]

Collections.sort(empList, Comparator.comparing(Employee::getCreationTime)
                                    .thenComparing(Employee::getName));

// Primitive array -> boxed list, ascending / descending
int[] arr = {10, 40, 10, 30, 30, 20};
List<Integer> boxed = Arrays.stream(arr).boxed().collect(Collectors.toList());
List<Integer> asc  = boxed.stream().sorted(Comparator.naturalOrder()).collect(Collectors.toList());
List<Integer> desc = boxed.stream().sorted(Comparator.reverseOrder()).collect(Collectors.toList());
// ⚠ (a, b) -> a - b can overflow; prefer Integer.compare / naturalOrder
```

```java
@Data @AllArgsConstructor
class Student {
    String name; int age;
    public String toString() { return name + "-" + age; }
}
List<Student> students = Arrays.asList(
    new Student("Ravi", 25), new Student("Amit", 19), new Student("Zara", 20),
    new Student("Amit", 25), new Student("Zara", 18));

students.stream().sorted((s1, s2) -> s2.name.compareTo(s1.name)).collect(Collectors.toList());
// name desc: [Zara-20, Zara-18, Ravi-25, Amit-19, Amit-25]
students.stream().sorted((s1, s2) -> Integer.compare(s2.age, s1.age)).collect(Collectors.toList());
// age desc: [Ravi-25, Amit-25, Zara-20, Amit-19, Zara-18]  (int is primitive: use Integer.compare)

students.stream().sorted(Comparator.comparing(s -> s.name)).collect(Collectors.toList());
// name asc: [Amit-19, Amit-25, Ravi-25, Zara-20, Zara-18]
students.stream().sorted(Comparator.comparing((Student s) -> s.name).reversed()).collect(Collectors.toList());
// explicit type needed before .reversed(); otherwise "Cannot infer type argument(s)"
```

| Multi-key sort | Code | Result |
|---|---|---|
| name asc → age asc | `comparing((Student s) -> s.name).thenComparing(s -> s.age)` | `[Amit-19, Amit-25, Ravi-25, Zara-18, Zara-20]` |
| name asc → age desc | `comparing((Student s) -> s.name).thenComparing(comparing((Student s) -> s.age).reversed())` | `[Amit-25, Amit-19, Ravi-25, Zara-20, Zara-18]` |
| name desc → age asc | `comparing((Student s) -> s.name).reversed().thenComparing(s -> s.age)` | `[Zara-18, Zara-20, Ravi-25, Amit-19, Amit-25]` |
| name desc → age desc | `comparing((Student s) -> s.name).reversed().thenComparing(comparing((Student s) -> s.age).reversed())` | `[Zara-20, Zara-18, Ravi-25, Amit-25, Amit-19]` |

> `char` and `int` are primitives and have no `.compareTo()`. Use `Character.compare(c1, c2)` / `Integer.compare(a, b)`.

</details>

<details><summary>Optional</summary>

### Simple explanation

`Optional<T>` models a value that may be absent, mostly as a **return type** at an API boundary. It is a container that may or may not hold a non-null value, and it forces you to handle "missing" explicitly.

| Method | Simple definition | Example |
|---|---|---|
| `Optional.of(v)` | Wrap a non-null value (NPE if null) | `Optional.of("A")` |
| `Optional.ofNullable(v)` | Wrap a value that may be null | `Optional.ofNullable(name)` |
| `Optional.empty()` | Empty optional | `Optional.empty()` |
| `isPresent()` | Is a value present? | `opt.isPresent()` |
| `get()` | Get the value (throws if empty; avoid) | `opt.get()` |
| `orElse(x)` | Default if empty (**always evaluated**) | `opt.orElse("NA")` |
| `orElseGet(supplier)` | Default via supplier (**lazy**) | `opt.orElseGet(ArrayList::new)` |
| `orElseThrow(...)` | Throw if empty | `opt.orElseThrow(() -> new RuntimeException())` |
| `ifPresent(consumer)` | Run code only if present | `opt.ifPresent(System.out::println)` |
| `map / flatMap / filter` | Transform / chain / test inside the Optional | `opt.map(String::length)` |

```java
Optional<String> findUserName(long id) {
    return id == 7 ? Optional.of("Ada") : Optional.empty();
}
String display = findUserName(7).orElse("Guest");

String name = null;
String result = Optional.ofNullable(name).map(String::toUpperCase).orElse("UNKNOWN");

// Null-safe stream over a possibly-null list
Optional.ofNullable(list).orElseGet(ArrayList::new).stream().forEach(System.out::println);
```

> Prefer `map`, `flatMap`, `filter`, `orElseGet`, and `orElseThrow` over `get()` without checking. Don't use `Optional` for fields or parameters.

</details>

<details><summary>java.time: immutable date and time</summary>

### Simple explanation

The `java.time` package is **immutable**, **thread-safe** and Joda-Time inspired. It replaces `Date`, `Calendar` and `SimpleDateFormat`. Choose the type by the domain.

| Class | Simple definition | Example |
|---|---|---|
| `LocalDate` | Date only (day, month, year) | `LocalDate.now()` |
| `LocalTime` | Time of day only | `LocalTime.now()` |
| `LocalDateTime` | Date + time | `LocalDateTime.now()` |
| `ZonedDateTime` | Date + time + named timezone | `ZonedDateTime.now(ZoneId.of("Asia/Kolkata"))` |
| `Instant` | A point on the timeline (machine time) | `Instant.now()` |
| `Duration` | **Time-based** amount (e.g. 34.5 seconds) | `Duration.between(start, end)` |
| `Period` | **Date-based** amount (e.g. 2 years, 3 months, 4 days) | `Period.between(d1, d2)` |
| `DateTimeFormatter` | Thread-safe formatting/parsing | `DateTimeFormatter.ofPattern("dd-MM-yyyy")` |

> A time zone is not the same as a fixed offset; daylight-saving transitions make the difference matter.

```java
// Prior to Java 8
Date startDate = Calendar.getInstance().getTime();
System.out.println("Calendar : " + startDate);   // Thu Apr 26 15:42:03 IST 2018

// Java 8
LocalTime java8 = LocalTime.now();
System.out.println("Java 8 : " + java8);          // 15:42:04.080

LocalDate birthday = LocalDate.of(1990, 5, 12);
Instant eventTime = Instant.now();
ZonedDateTime inLondon = eventTime.atZone(ZoneId.of("Europe/London"));
DateTimeFormatter format = DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm z");
System.out.println(format.format(inLondon));

// Measure method execution time (Instant + Duration)
Instant start = Instant.now();
Thread.sleep(5000);
Instant end = Instant.now();
System.out.println(Duration.between(start, end)); // PT5S

LocalDate currentDate = LocalDate.now();          // core classes: LocalDate, LocalTime, LocalDateTime
LocalTime currentTime = LocalTime.now();
```

</details>

<details><summary>StringJoiner</summary>

### Simple explanation

`java.util.StringJoiner` (a final class) builds a string separated by a **delimiter**, with optional **prefix** and **suffix**.

```java
StringJoiner joinNames = new StringJoiner(",", "[", "]");   // delimiter, prefix, suffix
joinNames.add("Yash");
joinNames.add("Yash777");

StringJoiner joinNames2 = new StringJoiner(":", "[", "]");
joinNames2.add("Yash7");
joinNames2.add("Yash777");

System.out.println(joinNames);   // [Yash,Yash777]
System.out.println(joinNames2);  // [Yash7:Yash777]

StringJoiner merge = joinNames.merge(joinNames2);
System.out.println(merge);       // [Yash,Yash777,Yash7:Yash777]
```

Related Java 8 helpers: `String.join(",", list)` and `Collectors.joining(",", "[", "]")`.

</details>

<details><summary>Nashorn JavaScript engine</summary>

### Simple explanation

**Nashorn** is a JavaScript engine written in Java by Oracle (based on the Da Vinci Machine / `invokedynamic`). It shipped with Java 8 to replace **Rhino**. It was *deprecated in 11 and removed in 15*.

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");

engine.put("strJS", str);   // expose a Java object as a script variable
engine.eval("print('Script Variables « expose java objects as variable to script.', strJS)");
```

</details>

<details><summary>CompletableFuture</summary>

### Simple explanation

`CompletableFuture` lets you build **asynchronous steps** and chain them: do this, then that, then handle errors. The default executor is not always right for blocking work; pass your own executor when workload isolation matters.

```java
CompletableFuture.supplyAsync(() -> loadUser())
    .thenApply(User::email)
    .thenAccept(this::sendEmail)
    .exceptionally(error -> { log(error); return null; });

CompletableFuture<Integer> cf = CompletableFuture
        .supplyAsync(() -> 10)
        .thenApply(x -> x * 2)
        .thenCombine(CompletableFuture.supplyAsync(() -> 5), Integer::sum);
System.out.println(cf.get());  // 25
```

</details>

<details><summary>Collection and Map API improvements</summary>

### Simple explanation

Existing interfaces gained default methods so everyday tasks became one-liners.

| Method | Simple definition | Example |
|---|---|---|
| `Map.getOrDefault` | Value or a default | `map.getOrDefault("k", 0)` |
| `Map.putIfAbsent` | Put only if key is missing | `map.putIfAbsent("k", 1)` |
| `Map.computeIfAbsent` | Create the value if missing | `map.computeIfAbsent("k", k -> new ArrayList<>())` |
| `Map.merge` | Combine old and new value | `map.merge(w, 1, Integer::sum)` |
| `Map.forEach` | Iterate key/value with a lambda | `map.forEach((k, v) -> ...)` |
| `Collection.removeIf` | Remove by predicate | `list.removeIf(x -> x < 0)` |
| `List.replaceAll` | Replace each element | `list.replaceAll(String::toUpperCase)` |
| `List.sort` | Sort with a Comparator | `list.sort(Comparator.naturalOrder())` |

```java
Map<String, Integer> visits = new HashMap<>();
visits.merge("/home", 1, Integer::sum);
visits.computeIfAbsent("/docs", key -> 0);

Map<String, Integer> count = new HashMap<>();
for (String w : words) count.merge(w, 1, Integer::sum);     // word count

Map<String, List<String>> m = new HashMap<>();
m.computeIfAbsent("k", k -> new ArrayList<>()).add("v");    // multi-value map
```

</details>

<details><summary>Other Java 8 additions (annotations, Base64, parallelSort, parameter names)</summary>

### Simple explanation

| Feature | Simple definition | Example |
|---|---|---|
| Repeating annotations | Same annotation more than once (`@Repeatable`) | `@Role("A") @Role("B") class X {}` |
| Type annotations | Annotations anywhere a type is used | `List<@NonNull String> l;` |
| Improved type inference | Better target typing for generic method calls | `List<String> l = Collections.emptyList();` |
| `Base64` | Built-in encoder/decoder | `Base64.getEncoder().encodeToString("hi".getBytes())` |
| `Arrays.parallelSort` | Parallel sorting of arrays | `Arrays.parallelSort(arr)` |
| `String.join` | Join with a delimiter | `String.join("-", "a", "b")` |
| `Objects.requireNonNull` | Null-check helper | `Objects.requireNonNull(after)` |
| Parameter names | Compile with `javac -parameters` to read names by reflection | `Method.getParameters()` |

</details>

<details><summary>MetaSpace vs PermGen</summary>

### Simple explanation

Before Java 8, class metadata lived in **PermGen** (fixed size, inside the heap). From Java 8 it lives in **MetaSpace** in native memory, which can grow dynamically.

| | **PermGen** (before 8) | **MetaSpace** (8+) |
|---|---|---|
| Stores | Class metadata | Class metadata |
| Location | Contiguous **Java heap** memory | **Native memory** (outside the heap) |
| Size | Fixed, cannot be resized dynamically → `OutOfMemoryError: PermGen space` | Grows dynamically (limit with `-XX:MaxMetaspaceSize`) |
| GC / tuning | Harder | Better garbage collection, auto-tuning, de-allocation of metadata |

</details>

## Java 9

<details><summary>Module system (JPMS / Jigsaw)</summary>

### Simple explanation

A **module** is a named component that declares its dependencies and the packages it exports. `exports` controls access to public types at compile time and runtime. `opens` grants reflective access to a package (needed by serialization and dependency-injection frameworks) without making it part of the normal API.

```java
module com.example.orders {
    requires java.sql;
    exports com.example.orders.api;
    // opens com.example.orders.model;   // allow deep reflection only
}
```

</details>

<details><summary>Private interface methods</summary>

### Simple explanation

Share code between default methods without exposing it.

```java
interface Logger {
    default void info(String m)  { print("INFO", m); }
    default void error(String m) { print("ERROR", m); }
    private void print(String lvl, String m) { System.out.println(lvl + ": " + m); }
}
```

</details>

<details><summary>Immutable collection factories: List.of, Set.of, Map.of</summary>

### Simple explanation

Create unmodifiable collections in one line. They reject `null`.

```java
List<String> list = List.of("A", "B", "C");
Set<Integer> set = Set.of(1, 2, 3);
Map<String, Integer> map = Map.of("one", 1, "two", 2);
Map<String, Integer> map2 = Map.ofEntries(Map.entry("a", 1));
// list.add("D");   // UnsupportedOperationException
// List.of(null);   // NullPointerException
```

</details>

<details><summary>Stream and Optional additions</summary>

### Simple explanation

| Feature | Simple definition | Example |
|---|---|---|
| `takeWhile` | Take elements while the condition is true | `Stream.of(1,2,3,4,1).takeWhile(x -> x < 3)` → `[1,2]` |
| `dropWhile` | Skip elements while the condition is true | `Stream.of(1,2,3,4,1).dropWhile(x -> x < 3)` → `[3,4,1]` |
| `iterate` (3-arg) | A `for` loop in stream form | `Stream.iterate(1, i -> i <= 5, i -> i + 1)` |
| `ofNullable` | Stream of 0 or 1 element | `Stream.ofNullable(null)` → empty |
| `Optional.ifPresentOrElse` | Do one thing if present, another if not | below |
| `Optional.or` | Fallback Optional | below |
| `Optional.stream` | Optional as a 0/1 element stream | `opt.stream()` |

```java
Stream.of(1, 2, 3, 4, 1, 2).takeWhile(x -> x < 4).forEach(System.out::print); // 123
Stream.of(1, 2, 3, 4, 1, 2).dropWhile(x -> x < 4).forEach(System.out::print); // 412

Optional.of("Yash").ifPresentOrElse(System.out::println, () -> System.out.println("empty"));
Optional<String> r = Optional.<String>empty().or(() -> Optional.of("fallback"));
```

</details>

<details><summary>Try-with-resources on an existing variable, diamond with anonymous classes</summary>

### Simple explanation

An effectively final variable can be used directly in try-with-resources, and `<>` now works with anonymous inner classes.

```java
BufferedReader br = new BufferedReader(new FileReader("a.txt"));
try (br) { System.out.println(br.readLine()); }

Comparator<String> c = new Comparator<>() {          // diamond with anonymous class
    public int compare(String a, String b) { return a.length() - b.length(); }
};
```

</details>

<details><summary>Other Java 9 additions (JShell, Process API, HttpClient incubator, helpers, G1)</summary>

### Simple explanation

| Feature | Simple definition | Example |
|---|---|---|
| JShell (REPL) | Interactive Java shell | `jshell> 2 + 3` |
| Process API | Info about and control of OS processes | `ProcessHandle.current().pid()` |
| `HttpClient` (incubator) | New HTTP/2 client; standard in 11 | `jdk.incubator.http` |
| `Objects` helpers | `requireNonNullElse`, `requireNonNullElseGet` | `Objects.requireNonNullElse(x, "def")` |
| `InputStream.transferTo` | Copy a stream to an `OutputStream` | `in.transferTo(out)` |
| G1 default GC | G1 replaces Parallel GC as the default | – |
| Multi-release JARs | One JAR with version-specific classes | `META-INF/versions/9/` |

</details>

## Java 10

<details><summary>Local variable type inference with var</summary>

### Simple explanation

`var` asks the compiler to infer a **local** variable's static type from a non-null initializer. It is **not** a keyword and **not** dynamic typing; the type is fixed at compile time. Use it when the initializer makes the type obvious.

```java
var name = "Yash";                         // String
var names = List.of("Ada", "Lin");         // List<String>
var stream = names.stream();               // Stream<String>
var map = new HashMap<String, Integer>();  // HashMap<String,Integer>
for (var n : names) System.out.println(n);

// ❌ Not allowed
// var x;                  // no initializer
// var y = null;           // cannot infer
// var f = () -> 1;        // lambda needs a target type
// class A { var f = 1; }  // not for fields, parameters or return types
```

</details>

<details><summary>copyOf, toUnmodifiable collectors, Optional.orElseThrow()</summary>

### Simple explanation

| Feature | Simple definition | Example |
|---|---|---|
| `List/Set/Map.copyOf()` | Immutable copy of a collection | `List<String> c = List.copyOf(src);` |
| `Collectors.toUnmodifiableList/Set/Map` | Collect into immutable collections | `.collect(Collectors.toUnmodifiableList())` |
| `Optional.orElseThrow()` | No-arg version of `get()` with a clearer name | `opt.orElseThrow()` |
| Parallel Full GC for G1 | Full GC is multi-threaded | – |
| Application Class-Data Sharing | Faster startup via shared class data | `-XX:ArchiveClassesAtExit` |
| Time-based release versioning | `$FEATURE.$INTERIM.$UPDATE.$PATCH` | `Runtime.version().feature()` |

</details>

## Java 11

<details><summary>New String methods</summary>

### Simple explanation

| Method | Simple definition | Example |
|---|---|---|
| `isBlank()` | True if empty or only whitespace | `"  ".isBlank()` → `true` |
| `lines()` | Split into `Stream<String>` by line terminators | `"a\nb".lines().count()` → `2` |
| `strip()/stripLeading()/stripTrailing()` | Unicode-aware trim | `"  hi ".strip()` → `"hi"` |
| `repeat(n)` | Repeat a string n times | `"ab".repeat(3)` → `"ababab"` |

```java
System.out.println("  ".isBlank());                    // true
"line1\nline2\nline3".lines().forEach(System.out::println);
System.out.println("  hello ".strip());                // hello
System.out.println("=".repeat(10));                    // ==========
```

</details>

<details><summary>var in lambda parameters</summary>

### Simple explanation

Implicitly typed lambda parameters can use `var`, which allows annotations on them. You cannot mix `var` with explicit or implicit types in the same lambda.

```java
(var left, var right) -> left.compareToIgnoreCase(right)
(@NonNull var a, var b) -> a + b
```

</details>

<details><summary>Standard HttpClient</summary>

### Simple explanation

HTTP/1.1 and HTTP/2 client, synchronous and asynchronous.

```java
HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder(URI.create("https://example.com"))
    .GET()
    .build();
HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.statusCode());
// async: client.sendAsync(request, BodyHandlers.ofString()).thenApply(HttpResponse::body)
```

</details>

<details><summary>Files.readString, Predicate.not, toArray, single-file launch and more</summary>

### Simple explanation

| Feature | Simple definition | Example |
|---|---|---|
| `Files.readString / writeString` | Read/write a whole file as a `String` | `Files.readString(Path.of("a.txt"))` |
| `Predicate.not()` | Negate a method reference | `.filter(Predicate.not(String::isBlank))` |
| `Collection.toArray(IntFunction)` | Cleaner typed array | `list.toArray(String[]::new)` |
| Run source file directly | Launch a single-file program without `javac` | `java Hello.java` |
| `Optional.isEmpty()` | Opposite of `isPresent()` | `opt.isEmpty()` |
| `Path.of()` | Shortcut for `Paths.get()` | `Path.of("a.txt")` |
| Nested-based access control | Nested classes access private members without bridge methods | – |
| Epsilon GC / ZGC (experimental) | No-op GC for tests / low-latency GC | `-XX:+UseEpsilonGC` |
| Removed / deprecated | Java EE and CORBA modules removed; Nashorn deprecated | add replacement dependencies explicitly |

```java
List<String> items = List.of("a", "", " ", "b");
items.stream().filter(Predicate.not(String::isBlank)).forEach(System.out::println); // a b

Path p = Path.of("note.txt");
Files.writeString(p, "Hello Java 11");
String content = Files.readString(p);
```

</details>

## Java 12–14

<details><summary>Switch expressions (preview 12–13, final in 14)</summary>

### Simple explanation

A switch expression **returns a value**. Arrow `->` labels have **no fall-through**, allow multiple labels (`case A, B ->`), and the switch must be **exhaustive** (cover all values or have `default`). Use `yield` to return a value from a block.

```java
// Old switch statement
String result;
switch (day) {
    case MONDAY: case FRIDAY: case SUNDAY: result = "6"; break;
    case TUESDAY: result = "7"; break;
    default: result = "unknown";
}

// Java 14 switch expression
int days = switch (month) {
    case 1, 3, 5, 7, 8, 10, 12 -> 31;
    case 4, 6, 9, 11 -> 30;
    case 2 -> 28;
    default -> throw new IllegalArgumentException("month");
};

String label = switch (status) {
    case 200 -> "ok";
    case 404 -> { logMissing(); yield "missing"; }     // yield returns from a block
    default -> "other";
};
```

</details>

<details><summary>Collectors.teeing, String.indent, String.transform (Java 12)</summary>

### Simple explanation

`teeing` runs **two collectors on the same stream** and merges the results in one pass.

```java
var result = Stream.of(5, 3, 9, 1)
    .collect(Collectors.teeing(
        Collectors.minBy(Integer::compare),
        Collectors.maxBy(Integer::compare),
        (min, max) -> "min=" + min.get() + ", max=" + max.get()));
System.out.println(result);   // min=1, max=9

double avg = Stream.of(1, 2, 3, 4).collect(Collectors.teeing(
    Collectors.summingInt(i -> i), Collectors.counting(), (s, c) -> (double) s / c)); // 2.5

System.out.println("abc".transform(s -> s + "!"));   // abc!
System.out.println("a\nb".indent(2));                // adds 2 leading spaces to each line
```

| Other Java 12 feature | Simple definition |
|---|---|
| `Files.mismatch()` | Position of first differing byte (−1 if same) |
| `CompactNumberFormat` | "1K", "1M" style numbers |
| Shenandoah GC (experimental) | Low-pause GC |
| Default CDS archives | Faster JDK startup by default |

</details>

<details><summary>Java 13 highlights: text blocks (preview), yield (preview)</summary>

### Simple explanation

| Feature | Simple definition |
|---|---|
| Text blocks (preview) | Multi-line string literal with `"""`; final in 15 |
| `yield` in switch (preview) | Return a value from a block inside a switch expression |
| Dynamic CDS archives | Archive app classes at exit |
| ZGC uncommit memory | ZGC returns unused memory to the OS |
| New Socket API | Re-implemented legacy `Socket` (`NioSocketImpl`) |

</details>

<details><summary>Java 14 highlights: helpful NullPointerException messages, records and pattern matching (preview)</summary>

### Simple explanation

The NPE message now tells you **which** variable or call was null.

```text
Cannot invoke "String.length()" because "s" is null
```

| Feature | Simple definition |
|---|---|
| Switch expressions (final) | See the switch expression block above |
| Records (preview) | Compact immutable data carrier; final in 16 |
| `instanceof` pattern (preview) | Test + cast in one step; final in 16 |
| Text blocks (2nd preview) | `\s` and line-continuation escapes added |
| NUMA-aware G1, ZGC on macOS/Windows | GC improvements |

</details>

## Java 15–16

<details><summary>Text blocks (final in 15)</summary>

### Simple explanation

Multi-line strings with `"""`. The compiler normalizes incidental indentation. Use `\s` when trailing whitespace matters, and `stripIndent` or `translateEscapes` for explicit formatting. `String.formatted()` is the instance version of `String.format`.

```java
// Before
String json = "{\n" +
              "  \"name\": \"Yash\",\n" +
              "  \"age\": 30\n" +
              "}";

// Text block
String json2 = """
        {
          "name": "Ada",
          "active": true
        }
        """;

String sql = """
        SELECT id, name
        FROM employee
        WHERE age > %d
        """.formatted(25);
```

</details>

<details><summary>Records (final in 16)</summary>

### Simple explanation

A **record** is a compact, **shallowly immutable** data carrier. The compiler supplies accessors (`name()`, not `getName()`), a canonical constructor, `equals`, `hashCode`, and `toString`. Records are `final`, implicitly extend `java.lang.Record`, can implement interfaces, cannot extend another class, and have `private final` fields. A mutable list inside a record is **not** copied or frozen automatically.

```java
record User(String name, int age) {
    User {                                             // compact constructor for validation
        if (age < 0) throw new IllegalArgumentException("age must be non-negative");
        name = name.trim();
    }
    public String greeting() { return "Hi " + name; }  // extra methods allowed; instance fields are not
}

User u = new User("Yash", 30);
System.out.println(u.name());   // accessor
System.out.println(u);          // User[name=Yash, age=30]
```

</details>

<details><summary>Pattern matching for instanceof (final in 16)</summary>

### Simple explanation

Check the type **and** bind a variable in one expression. The pattern variable is available only where the compiler can prove the match succeeded (flow scoping, not an unchecked cast).

```java
Object obj = "Hello";

// Before
if (obj instanceof String) {
    String s = (String) obj;
    System.out.println(s.length());
}

// Java 16
if (obj instanceof String s && !s.isBlank()) {
    System.out.println(s.toUpperCase());
}
```

</details>

<details><summary>Stream.toList and Stream.mapMulti (Java 16)</summary>

### Simple explanation

`Stream.toList()` is a shortcut for `collect(Collectors.toList())` and returns an **unmodifiable** list. `mapMulti` maps each element to 0..n elements imperatively.

```java
List<Integer> evens = Stream.of(1, 2, 3, 4).filter(i -> i % 2 == 0).toList();   // [2, 4], immutable

List<Integer> doubled = Stream.of(1, 2, 3)
    .<Integer>mapMulti((n, sink) -> { sink.accept(n); sink.accept(n * 10); })
    .toList();                                                                   // [1, 10, 2, 20, 3, 30]
```

| Other Java 15–16 feature | Simple definition |
|---|---|
| Sealed classes (preview 15–16) | Restrict who can extend; final in 17 |
| Hidden classes (15) | Classes for frameworks, not discoverable by other classes |
| ZGC and Shenandoah (production, 15) | Low-latency GCs are production-ready |
| Nashorn removed (15) | JavaScript engine removed from the JDK |
| `jpackage` (16) | Package an app as a native installer (exe/dmg/deb) |
| Unix-domain sockets (16) | `SocketChannel` for local IPC |
| Strong encapsulation (16) | JDK internals blocked by default |
| Vector API, Foreign Linker (incubator) | SIMD and native-call APIs |

</details>

## Java 17

<details><summary>Sealed classes and interfaces (final in 17)</summary>

### Simple explanation

A sealed type lists exactly **which classes may extend or implement it** with `permits`. Each permitted subtype must be `final`, `sealed`, or `non-sealed`. Sealing documents and enforces a controlled hierarchy, and is especially useful with pattern matching and exhaustive switches. It is not the same as making objects immutable.

```java
sealed interface Payment permits CardPayment, CashPayment {}
record CardPayment(String lastFour) implements Payment {}
record CashPayment(int cents) implements Payment {}

public sealed interface Shape permits Circle, Square, Rectangle {}
public final record Circle(double r) implements Shape {}
public final record Square(double side) implements Shape {}
public non-sealed class Rectangle implements Shape {}     // open for further extension

static double area(Shape s) {
    if (s instanceof Circle c)  return Math.PI * c.r() * c.r();
    if (s instanceof Square sq) return sq.side() * sq.side();
    return 0;
}
```

> Sealed + records + pattern matching = algebraic data types in Java.

</details>

<details><summary>Pattern matching for switch (preview in 17)</summary>

### Simple explanation

Use type patterns in `case` labels. In Java 17 it needs `--enable-preview`; it is final in Java 21.

```java
static String describe(Object o) {
    return switch (o) {
        case Integer i when i > 10 -> "big int " + i;
        case Integer i             -> "int " + i;
        case String s              -> "string " + s;
        case null                  -> "null!";
        default                    -> "other";
    };
}
```

</details>

<details><summary>Enhanced pseudo-random generators, HexFormat, InstantSource, strong encapsulation</summary>

### Simple explanation

| Feature | Simple definition | Example |
|---|---|---|
| `RandomGenerator` | New interface and algorithms (`L64X128MixRandom`) | `RandomGenerator.of("L64X128MixRandom").nextInt(1, 7)` |
| `HexFormat` | Hex encode/decode utility | `HexFormat.of().formatHex(bytes)` |
| `InstantSource` | Abstraction for a clock (good for tests) | `InstantSource.system()` |
| Strong encapsulation | `--illegal-access` removed; internals blocked unless `--add-opens` | – |
| Always-strict floating point | `strictfp` is now redundant | – |
| macOS Metal rendering | Swing/Java2D uses Metal | – |
| Deserialization filters | Safer `ObjectInputStream` | – |
| Deprecations / removals | Applet API and Security Manager deprecated for removal; RMI Activation removed | – |

```java
RandomGenerator rg = RandomGenerator.of("L64X128MixRandom");
int dice = rg.nextInt(1, 7);
```

</details>

## Migration advice from Java 8 to 17

- Replace `Date`, `Calendar`, and `SimpleDateFormat` with the appropriate `java.time` type.
- Prefer `List.of` and unmodifiable factories when a collection should not be mutated.
- Use streams for clear data transformations, not as a mandatory replacement for every loop.
- Check reflective frameworks against modules and strong encapsulation.
- Compile with `--release 8` when producing Java 8-compatible artifacts; do not rely only on `-source` and `-target`.
- Test time-zone behavior, serialization, TLS defaults, garbage collection, and illegal reflective access during migration.

<details><summary>Concept-wise interview questions and answers</summary>

<details><summary>What is a functional interface?</summary>

An interface with exactly one abstract method (SAM). Default, static and `Object` methods don't count. `@FunctionalInterface` makes the compiler enforce it.

</details>

<details><summary>What is a lambda expression, and is a lambda an object?</summary>

A lambda is a nameless function: `(params) -> body`. It is converted to an instance of a target functional-interface type; it is not a class declaration and has no type without context. The runtime uses an `invokedynamic`-based mechanism to create the functional object.

</details>

<details><summary>Lambda vs anonymous inner class?</summary>

A lambda has less code, no new scope (`this` is the enclosing object), no extra class file, and works only with functional interfaces. An anonymous class can implement many methods and has its own `this`.

</details>

<details><summary>What is a closure, and how does Java's version differ from JavaScript's?</summary>

A closure is a function that remembers the variables of the place where it was created. A Java lambda captures the **value** of surrounding variables, so they must be final or effectively final. JavaScript captures the variable itself and can change it.

</details>

<details><summary>What does "effectively final" mean?</summary>

A local variable that is never reassigned after its first assignment. Lambdas and inner classes may use only final or effectively final locals.

</details>

<details><summary>What are method references?</summary>

`::` shorthand for a lambda that only calls an existing method. Four kinds: static, bound instance (`obj::method`), unbound instance (`Type::method`), and constructor (`Type::new`).

</details>

<details><summary>What are default methods and why were they added?</summary>

Methods with a body in interfaces, added so APIs can evolve without breaking existing implementations. If two interfaces have the same default method, the class must override it, often with `InterfaceName.super.method()`.

</details>

<details><summary>What is the difference between intermediate and terminal operations?</summary>

Intermediate operations return a stream and are lazy (`filter`, `map`). Terminal operations produce a result and start execution (`collect`, `forEach`, `reduce`, `count`).

</details>

<details><summary>What are the main components of a Stream?</summary>

A data source, a set of intermediate operations, and a single terminal operation that produces the result.

</details>

<details><summary>Why are streams single-use?</summary>

A stream represents a traversal and computation pipeline over a source. After a terminal operation consumes it, its state cannot safely be reused (`IllegalStateException`). Create a new stream from the source for another traversal.

</details>

<details><summary>What is the difference between map and flatMap?</summary>

`map` transforms one value into one value, so a function returning `Optional<Address>` creates `Optional<Optional<Address>>` if used directly. `flatMap` applies a function that already returns a container and flattens one level. It is used to compose operations that may be absent or asynchronous, and to flatten streams of streams.

</details>

<details><summary>forEach vs forEachOrdered?</summary>

On a parallel stream `forEach` does not keep encounter order, while `forEachOrdered` does.

</details>

<details><summary>Why can parallel streams be slower?</summary>

Parallel execution adds splitting, scheduling, merging, synchronization, and thread-management costs. It can also contend for the common pool or block worker threads. Measure with representative data and use a dedicated executor when the workload requires isolation.

</details>

<details><summary>What is a Spliterator?</summary>

An iterator that can partition a source so a collection can be traversed in parallel. It does not itself provide parallelism.

</details>

<details><summary>Comparable vs Comparator?</summary>

`compareTo(T)` defines one natural order inside the class. `compare(T, T)` is external, allows many orders, and is functional with Java 8 helpers such as `comparing`, `thenComparing` and `reversed`.

</details>

<details><summary>What is Optional, and when should it not be used?</summary>

A container that may hold a value; it prevents NPEs and encourages explicit handling. Avoid it for fields that complicate serialization, for method parameters where overloads or validation are clearer, and for collections where an empty collection already expresses absence. Do not call `get()` as a disguised null check.

</details>

<details><summary>orElse vs orElseGet?</summary>

`orElse` evaluates its argument immediately every time; `orElseGet` evaluates the supplier only when the Optional is empty.

</details>

<details><summary>What are the core API classes for date and time in Java 8?</summary>

`LocalDate`, `LocalTime` and `LocalDateTime`, plus `ZonedDateTime`, `Instant`, `Duration` and `Period`. The API is immutable and thread-safe.

</details>

<details><summary>What is MetaSpace? How does it differ from PermGen?</summary>

PermGen was a fixed-size area inside the heap that held class metadata (removed in 8). MetaSpace holds metadata in native memory and grows dynamically, which improves garbage collection, auto-tuning, and de-allocation of metadata.

</details>

<details><summary>What does var change at runtime?</summary>

Nothing. `var` is compile-time local-variable type inference. The bytecode still contains the inferred static type, and Java remains statically typed.

</details>

<details><summary>List.of() vs Arrays.asList()?</summary>

`List.of` is fully immutable and rejects nulls. `Arrays.asList` is fixed-size, writes through to the array, allows `set()`, and allows nulls.

</details>

<details><summary>Switch expression vs switch statement?</summary>

An expression returns a value, uses `->` or `yield`, has no fall-through, and must be exhaustive (Java 14).

</details>

<details><summary>What is the difference between a record and an immutable class?</summary>

A record provides a standardized representation for shallowly immutable data with generated members and strong restrictions on inheritance. An immutable class can choose different invariants, defensive copying, caching, inheritance rules, and method names. A record is not automatically deeply immutable.

</details>

<details><summary>What problem do sealed classes solve?</summary>

They restrict who can extend or implement a type. This makes a domain model explicit, allows compilers to reason about an exhaustive hierarchy, and prevents accidental extension. It is not the same as making every object immutable.

</details>

<details><summary>What is the difference between exports and opens in a module?</summary>

`exports` makes public types accessible to ordinary compiled code. `opens` permits deep reflection on a package, usually for frameworks, without making the package part of the normal compile-time API. An `opens` package is not automatically exported.

</details>

<details><summary>Stream.toList() vs Collectors.toList()?</summary>

`Stream.toList()` (Java 16) returns an unmodifiable list. `Collectors.toList()` returns a mutable list with no guarantee about its type.

</details>

<details><summary>Which Java versions are LTS?</summary>

8, 11 and 17 in this range (and 21 after it).

</details>

</details>
</details>

---

Java 17 – Records and Sealed Classes

<details>
<summary>1. What is a Record in Java 17?</summary>

A Record is a special class designed to represent immutable-style data carriers with less boilerplate code.

It automatically generates a canonical constructor, accessors, equals(), hashCode(), and toString().

</details>

<details>
<summary>2. How do you use Records as REST API DTOs?</summary>

public record EmployeeRequest(
    String name,
    String email,
    double salary
) {}

Spring Boot can use records as request and response DTOs through Jackson serialization and deserialization.

</details>

<details>
<summary>3. Can Records contain methods and validation?</summary>

Yes. Records can contain custom methods, static members, and constructors, including compact constructors for validation.

</details>

<details>
<summary>4. What is a Sealed Class?</summary>

A sealed class restricts which classes can directly extend it using the permits keyword.

It is useful when a domain has a controlled set of possible subtypes.

</details>

<details>
<summary>5. Explain sealed, non-sealed, and final.</summary>

sealed: Restricts permitted subclasses.

final: Prevents inheritance.

non-sealed: Allows unrestricted inheritance by further subclasses.

</details>

<details>
<summary>6. Where can you use Sealed Classes in real-time applications?</summary>

They are useful for modeling restricted business types such as:

Payment types.

Order states.

Notification types.

Transaction results.

API response variants.

</details>

<details>
<summary>7. Can Records implement interfaces?</summary>

Yes. Records cannot extend another class because they implicitly extend java.lang.Record, but they can implement multiple interfaces.

</details>

## References

[Oracle Java language enhancements](https://docs.oracle.com/javase/8/docs/technotes/guides/language/enhancements.html) · [Oracle Java language changes by release](https://docs.oracle.com/en/java/javase/25/language/java-language-changes-release.html) · [Oracle Java language changes summary](https://docs.oracle.com/en/java/javase/25/language/java-language-changes-summary.html) · [Java 8 `java.time` API](https://docs.oracle.com/javase/8/docs/api/java/time/package-summary.html) · [Trying Out Lambda Expressions in the Eclipse IDE (Oracle)](https://www.oracle.com/technical-resources/articles/java/lambda.html) · [MyWorld Wiki: Java 8](https://github.com/Yash-777/MyWorld/wiki/Java-8)