# OOP and Object Contracts — Interview Q&A

<details><summary>What is encapsulation and how is it more than private fields?</summary>

### Answer
Encapsulation keeps state and the operations that protect its invariants behind one abstraction. `private` fields help, but real encapsulation also validates state, avoids exposing mutable internals, and exposes behavior rather than allowing arbitrary writes.

### Example
```java
final class BankAccount {
    private long cents;
    void deposit(long amount) {
        if (amount <= 0) throw new IllegalArgumentException("amount must be positive");
        cents += amount;
    }
    long balance() { return cents; }
}
```

### Interviewer perspective
Ask whether a getter that returns a mutable list breaks encapsulation. A strong answer mentions an unmodifiable view or defensive copy and explains the ownership decision.
</details>

<details><summary>What is polymorphism, and how do overloading and overriding differ?</summary>

### Answer
Overloading uses the same method name with different parameter lists and is selected at compile time. Overriding replaces an inherited instance method with the same signature and is selected at runtime from the actual object. The return type is not part of an overload signature; an override may use a covariant return type.

### Example
```java
Animal reference = new Dog();
reference.sound(); // Dog implementation: runtime dispatch

void print(String value) {}
void print(int value) {} // overload: compile-time selection
```

### Interviewer perspective
The method signature includes the name and parameter types, not return type, access modifier, or `throws` clauses. An overriding method cannot reduce visibility or throw broader checked exceptions.
</details>

<details><summary>Can static, private, final methods, or constructors be overridden?</summary>

### Answer
Static methods are hidden, not overridden, because they belong to the class. Private methods are not inherited and therefore cannot be overridden. Final methods prohibit overriding. Constructors are not inherited and cannot be overridden, although constructors can be overloaded.

### Example
```java
class Parent { static void kind() {} final void lock() {} }
class Child extends Parent { static void kind() {} } // hides kind()
```

### Interviewer perspective
`Parent p = new Child(); p.kind()` resolves using the reference type, while `p.instanceMethod()` can dispatch to `Child`. Calling a static method through an object reference is legal but misleading.
</details>

<details><summary>Why must `equals` and `hashCode` agree?</summary>

### Answer
If two objects are equal according to `equals`, they must return the same `hashCode`. Hash-based collections use the hash to find a bucket and then `equals` to find the matching key. Unequal objects may share a hash; equal objects may not have different hashes.

### Example
```java
record UserId(String value) {}
Set<UserId> ids = new HashSet<>();
ids.add(new UserId("u-1"));
System.out.println(ids.contains(new UserId("u-1"))); // true
```

### Interviewer perspective
Mutable fields used in equality must not change while an object is a key in a hash map. Also distinguish `==` identity from `equals` logical equality and mention symmetry, transitivity, consistency, and non-nullity.
</details>

<details><summary>What changed when interfaces gained default, static, and private methods?</summary>

### Answer
Default methods provide an implementation so an interface can evolve without breaking every existing implementer. Static interface methods belong to the interface and are called through its name. Private interface methods share implementation between default or static methods and are not visible to implementers.

### Example
```java
interface Auditable {
    default String label() { return normalize("default"); }
    private String normalize(String value) { return value.trim().toLowerCase(); }
    static boolean supported() { return true; }
}
```

### Interviewer perspective
If two interfaces provide conflicting defaults, the implementing class must resolve the conflict. A class implementation wins over an interface default, and static interface methods are not inherited as instance methods.
</details>

<details><summary>How does Java resolve an overloaded call with `null`?</summary>

### Answer
`null` can match any reference type. The compiler chooses the most specific applicable overload. If two unrelated types are equally specific, the call is ambiguous and requires an explicit cast.

### Example
```java
void greet(Object value) {}
void greet(String value) {}
greet(null); // String is more specific

void use(Integer value) {}
void use(Long value) {}
// use(null); // compile-time ambiguity
use((Integer) null);
```

### Interviewer perspective
This is a compile-time rule, not runtime overload selection. Include primitive overloads and autoboxing in a careful explanation because they can change the selected method.
</details>

## References

- [JLS classes and members](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html)
- [Object equals and hashCode contracts](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html)
- [Dev.java object-oriented programming](https://dev.java/learn/language/oop/)
