# Programs

<details><summary>Java always passes arguments by value, including object references.</summary>

### Interviewer perspective
This is a classic question that tests whether you understand how Java handles memory and method calls, not just syntax. Many candidates say "primitives are passed by value and objects are passed by reference," which is wrong. The interviewer wants to see that you can:

- Distinguish a **reference** from the **object** it points to.
- Predict the output of code that reassigns a parameter versus code that mutates the object it points to.
- Explain *why*, not just state the rule.

### Answer
Java is **strictly pass-by-value**. There is no pass-by-reference.

- **Primitives:** the value itself is copied into the parameter.
- **Objects:** the *value of the reference* (the memory address) is copied into the parameter. The caller's variable and the method's parameter are two separate variables that initially point to the same object.

This has two consequences:

1. **Mutating the object through the parameter is visible to the caller**, as long as the parameter still points to the caller's object. Both variables hold the same address, so a change to the object's state is seen through either one.
2. **Reassigning the parameter is not visible to the caller.** `a = new Student()` only changes the method's local copy of the reference. Anything done through `a` afterwards, such as `a.id = 5`, affects the new object, not the caller's.

If Java were truly pass-by-reference, reassigning `a` would also change the caller's variable. It doesn't.

### Example
```java runnable
class Student {
    int id;
}

public class Main {

    public static void main(String[] args) {
        // Case 1: reassigning the parameter
        Student std = new Student();
        std.id = 1;

        fun(std);

        System.out.println(std.id); // prints 1

        // Case 2: mutating the object through the parameter
        Student stdMutate = new Student();
        stdMutate.id = 1;

        mutate(stdMutate);

        System.out.println(stdMutate.id); // prints 5
    }

    private static void fun(Student a) {
        Student student = new Student();
        student.id = 2;

        a = student; // only the local copy of the reference is redirected

        a.id = 5;    // modifies the NEW object, not the caller's
    }

    private static void mutate(Student a) {
        a.id = 5;    // 'a' still points to the caller's object
    }
}
```

**Output:**
```
1
5
```

**Walkthrough of `fun(std)`:**
1. `main` creates `Student@A` with `id = 1`, and `std` holds its reference.
2. The reference is copied into `a`, so `std` and `a` both point to `Student@A`.
3. Inside `fun`, a new `Student@B` (`id = 2`) is created, and `a = student` makes `a` point to `Student@B`.
4. `a.id = 5` sets `Student@B`'s id to `5`. `Student@A` is untouched.
5. Back in `main`, `std` still points to `Student@A`, so `std.id` is `1`.

**Walkthrough of `mutate(stdMutate)`:**
1. `main` creates `Student@C` with `id = 1`, and `stdMutate` holds its reference.
2. The reference is copied into `a`, so both variables point to `Student@C`.
3. `a.id = 5` follows that address and changes `Student@C` itself.
4. Back in `main`, `stdMutate` points to the same object, so `stdMutate.id` is `5`.

**Key takeaway:** both methods received a *copy* of the reference. Mutating through the copy changes the shared object (`5`), but redirecting the copy to another object has no effect on the caller's variable (`1`).

</details>

<details><summary>Java picks overloads by phase and specificity: number(5) prints "int", numberVarArgs(5) prints "long" (varargs is last), and nullable(null) with String and Integer overloads is ambiguous.</summary>

### Interviewer perspective
This question tests three things:

- **Exact match beats widening.** For `number(5)`, both `int` and `long` are applicable, and the more specific `int` wins.
- **Varargs is always the last resort.** For `numberVarArgs(5)`, many candidates pick `int...` because it "looks like an exact match" for `int`. The interviewer wants to hear that widening to `long` happens in an earlier phase, so `long` wins.
- **`null` has no type of its own.** It is applicable to every reference type, so Java picks the **most specific** one. When two candidates are unrelated (`String` and `Integer`), the call is **ambiguous** and the code doesn't compile.

### Answer
**Case 1: `number(5)`.** The literal `5` is an `int`.

- Phase 1 (strict, no boxing or varargs): `number(int)` and `number(long)` are both applicable.
- `int` is more specific than `long`, so **`int` wins**.

**Case 2: `numberVarArgs(5)`.** The candidates are `numberVarArgs(int...)` and `numberVarArgs(long)`.

1. **Phase 1 (strict):** `numberVarArgs(long)` is applicable through widening (`int → long`). `int...` is **not** applicable here, because a varargs method can only be invoked in phase 3.
2. Phase 1 found a match, so Java stops. **`long` wins**, and the varargs method is never considered.
3. `numberVarArgs(int...)` would only run if `numberVarArgs(long)` didn't exist.

**Case 3: `nullable(null)`.**

- `String`, `Integer`, and `Object` are all applicable to `null`.
- `Object` is less specific than both `String` and `Integer`, so it loses.
- `String` and `Integer` are **unrelated** (neither is a subtype of the other), so neither is more specific.
- Result: **compile error** (`reference to nullable is ambiguous`).
- It is fixed by a cast, or by removing one of the competing overloads.

### Example
```java runnable
public class OverloadTrap {

    // Case 1: primitive overloads (exact match vs widening)
    static void number(int i)     { out("int"); }
    static void number(long i)    { out("long"); }

    // Case 2: widening vs varargs
    static void numberVarArgs(int... i) { out("int var args"); }
    static void numberVarArgs(long i)   { out("long"); }

    // Case 3: reference types only
    static void nullable(String s)  { out("String"); }
    static void nullable(Integer i) { out("Integer"); }
    static void nullable(Object o)  { out("Object"); }

    static void out(String s) {
        System.out.println("Result: " + s);
    }

    public static void main(String[] args) {
        number(5);                       // Result: int
        numberVarArgs(5);                // Result: long

        // nullable(null);               // COMPILE ERROR: ambiguous (String vs Integer)
        nullable((String) null);         // Result: String
        nullable((Integer) null);        // Result: Integer
        nullable((Object) null);         // Result: Object
    }
}
```

**Output:**
```
Result: int
Result: long
Result: String
Result: Integer
Result: Object
```

**What happens to `number(5)` as you change overloads:**

| Overloads present | `number(5)` prints | Reason |
|---|---|---|
| `int`, `long` | `int` | phase 1: exact match is more specific than widening |
| `long` only | `long` | phase 1: widening |

**What happens to `numberVarArgs(5)` as you change overloads:**

| Overloads present | `numberVarArgs(5)` prints | Reason |
|---|---|---|
| `int...`, `long` | `long` | phase 1: widening beats varargs |
| `int...` only | `int var args` | phase 3: the only applicable method |
| `int...`, `Integer` | `Integer` | phase 2: boxing beats varargs |

**What happens to `nullable(null)` as you change overloads:**

| Overloads present | `nullable(null)` | Reason |
|---|---|---|
| `String`, `Integer`, `Object` | compile error | `String` and `Integer` are unrelated, so the call is ambiguous |
| `String`, `Object` | `String` | `String` is more specific than `Object` |
| `Integer`, `Object` | `Integer` | `Integer` is more specific than `Object` |
| `Object` only | `Object` | the only applicable method |

**Key takeaway:** primitives follow the phase order (exact or widening, then boxing, then varargs), so `numberVarArgs(5)` prints `long`. `null` follows the **most specific type** rule, and if there is no single most specific type, the code doesn't compile.

</details>

<details><summary>The + operator evaluates left to right, so 10 + 20 + "Java" prints "30Java" while "Java" + 10 + 20 prints "Java1020".</summary>

### Interviewer perspective
This question tests whether you know that `+` is **left-associative** and that its meaning depends on the operand types at each step. Many candidates say both lines print `30Java` or both print `Java1020`. The interviewer wants to see that you can:

- Evaluate the expression **one operator at a time**, left to right.
- Explain that `int + int` is **addition**, but `String + anything` is **concatenation**.
- Show how parentheses change the result.

### Answer
Java evaluates `a + b + c` as `(a + b) + c`. At each step, if either operand is a `String`, the result is a `String` made by concatenation. Otherwise it is numeric addition.

**Line 1: `10 + 20 + "Java"`**
1. `10 + 20` is `int + int`, so it is **addition**, giving `30`.
2. `30 + "Java"` has a `String` operand, so it is **concatenation**, giving `"30Java"`.

**Line 2: `"Java" + 10 + 20`**
1. `"Java" + 10` has a `String` operand, so it is **concatenation**, giving `"Java10"`.
2. `"Java10" + 20` is still a `String` operand, so it is **concatenation**, giving `"Java1020"`.

Once a `String` appears in the chain, every later `+` is concatenation.

### Example
```java runnable
public class StringConcatenation {
    public static void main(String[] args) {
        System.out.println(10 + 20 + "Java");    // 30Java
        System.out.println("Java" + 10 + 20);    // Java1020
    }
}
```

**Output:**
```
30Java
Java1020
```

**Note on the original code:** `print1n` (digit one) and `printIn` (capital i) are typos for `println`, which causes a compile error (`cannot find symbol`). I also renamed the class from `StringConcatination` to `StringConcatenation`. That is only a spelling fix and doesn't affect behavior.

**What happens as you change the expression:**

| Expression | Result | Reason |
|---|---|---|
| `10 + 20 + "Java"` | `30Java` | add first, then concatenate |
| `"Java" + 10 + 20` | `Java1020` | concatenate at every step |
| `"Java" + (10 + 20)` | `Java30` | parentheses force addition first |
| `10 + "Java" + 20` | `10Java20` | `String` appears after the first operand, so both `+` are concatenation |
| `"" + 10 + 20` | `1020` | the empty string forces concatenation from the start |
| `1 + 2 + 'a'` | `0` + ... see note | `int + char` is numeric (`3 + 97 = 100`), not a `String` |

**Key takeaway:** `+` is evaluated left to right, and it concatenates only when at least one operand is a `String`. Everything to the left of the first `String` is added numerically, and everything after it is concatenated.

</details>

<details><summary>Integer == compares references, and autoboxing caches values in the byte range (-128 to 127), so 127 == 127 is true but 128 == 128 is false.</summary>

### Interviewer perspective
This question tests whether you know that `==` on wrapper objects compares **references**, not values. Many candidates say both comparisons are `true` because the numbers are equal. The interviewer wants to see that you can:

- Explain that autoboxing calls `Integer.valueOf()`, which reuses cached objects for **-128 to 127**.
- Connect that range to the `byte` data type.
- Explain why `new Integer(127)` is different from `Integer a = 127`.
- Say that `equals()` is the correct way to compare wrapper values.

### Answer
**The cache range comes from `byte`.**
- `byte` is an 8-bit signed two's complement integer. Its range is **-128 to 127** (inclusive).
- `Integer.valueOf()` keeps a cache of `Integer` objects for exactly this range.

**Case 1: `Integer a = 127; Integer b = 127;`**
1. Autoboxing compiles to `Integer.valueOf(127)`.
2. 127 is inside the byte range, so both calls return the **same cached object**.
3. `System.identityHashCode(a)` and `System.identityHashCode(b)` print the **same number**, and `a == b` is **true**.

**Case 2: `Integer c = 128; Integer d = 128;`**
1. 128 is **outside the byte range**, so it is not cached. It needs a wider type (`short`, `int`, `long`).
2. Each `valueOf(128)` call creates a **new object**, so `c` and `d` point to different objects.
3. Their identity hash codes **differ**, and `c == d` is **false**.
4. `c.equals(d)` is **true**, because `equals` compares the values.

**Case 3: `new Integer(127)`**
1. `new` always creates a **new object on the heap**, even for values in the cache range.
2. `aRef` and `bRef` are two separate objects with different identity hash codes, so `aRef == bRef` is **false**.
3. `aRef.equals(bRef)` is **true**, because both hold `127`.

### Example
```java runnable
public class Test {
    public static void main(String[] args) {

        // Case 1: inside the byte range (cached)
        Integer a = 127;
        Integer b = 127;

        System.out.println(a == b);  // true
        System.out.println(System.identityHashCode(a) + "==" + System.identityHashCode(b)); // same number (same object)

        // Case 2: outside the byte range (not cached)
        Integer c = 128;
        Integer d = 128;

        System.out.println(c == d);  // false
        System.out.println(System.identityHashCode(c) + "==" + System.identityHashCode(d)); // different numbers (different objects)
        System.out.println(c.equals(d)); // true

        // Case 3: new always creates separate objects
        Integer aRef = new Integer(127);   // deprecated for removal, compiles with a warning
        Integer bRef = new Integer(127);

        System.out.println(aRef == bRef);      // false
        System.out.println(System.identityHashCode(aRef) + "==" + System.identityHashCode(bRef)); // different numbers
        System.out.println(aRef.equals(bRef)); // true
    }
}
```

**Output** (the hash numbers are illustrative and change from run to run; what matters is whether the two numbers match):
```
true
1163157884==1163157884
false
1956725890==356573597
true
false
1735600054==21685669
true
```

### Why `new Integer(127)` should not be used
`new Integer(127)` was deprecated in Java 9.

```java
Integer aRef = new Integer(127);
```

| Version | Status |
|---|---|
| Java 9 | Constructor deprecated |
| Java 16 | Deprecated for removal (JEP 390) |
| Java 21 and later | Still available, but produces a removal warning |
| Future versions | May be removed in a future release |

**Recommended alternatives:**

```java
Integer aRef = Integer.valueOf(127); // Preferred
```

or

```java
Integer aRef = 127; // Autoboxing (compiles to Integer.valueOf(127))
```

**Note:** `Integer.valueOf()` is preferred because it can reuse cached `Integer` instances, particularly for values from `-128` to `127`. The constructor always allocates a new object, which wastes memory and breaks `==` comparisons.

**What happens as you change the code:**

| Expression | Result | Reason |
|---|---|---|
| `Integer a = 127, b = 127; a == b` | `true` | same cached object |
| `Integer c = 128, d = 128; c == d` | `false` | outside the byte range, so two objects |
| `c.equals(d)` (both 128) | `true` | `equals` compares values |
| `new Integer(127) == new Integer(127)` | `false` | `new` creates two heap objects |
| `new Integer(127).equals(new Integer(127))` | `true` | same value |
| `Integer.valueOf(127) == Integer.valueOf(127)` | `true` | both return the cached object |
| `Integer.valueOf(127) == new Integer(127)` | `false` | one cached object, one new object |
| `c == 128` | `true` | `c` is unboxed because the other operand is a primitive `int` |

**Key takeaway:** use `equals()` (or unbox to primitives) to compare wrapper values. `==` on `Integer` only works for values in the cache range (-128 to 127), and never with `new`. The upper bound of the cache can even be changed with `-XX:AutoBoxCacheMax`, so relying on it is fragile.

</details>

<details><summary>== compares references: literals share one String Constant Pool object, new String() creates a separate heap object, and StringBuilder/StringBuffer do not override equals(), so equals() is false.</summary>

### Interviewer perspective
This question tests whether you understand **where strings live** and **what `==` and `equals()` compare**. Many candidates say `new String("Java") == "Java"` is `true`, or that two `StringBuilder`s with the same text are `equals`. The interviewer wants to see that you can:

- Explain the **String Constant Pool (SCP)** and why identical literals are the same object.
- Explain that `new String("Java")` always creates a **new heap object**.
- Explain what `intern()` does.
- Explain why `StringBuilder.equals()` and `StringBuffer.equals()` return `false`, and how to compare their content.

### Answer
**Case 1: literals (String Constant Pool)**
- `String s1 = "Java"; String s11 = "Java";`
- The first literal puts `"Java"` in the SCP. The second finds the existing entry and reuses it.
- `s1` and `s11` point to the **same object**, so `s1 == s11` is **true**.
- Since Java 7 the SCP lives in the **heap** (not PermGen), but it is still a separate, shared area from ordinary `new` objects.

**Case 2: `new String("Java")`**
- `new` always creates a **new object on the heap**, even if `"Java"` is already in the SCP.
- `s2` and `s22` are two separate objects, so `s2 == s22` is **false**, and `s1 == s2` is **false**.
- `s1.equals(s2)` is **true**, because `String.equals()` compares content.

**Case 3: `intern()`**
- `s2.intern()` looks for `"Java"` in the SCP. It is found (it's `s1`'s object), so `intern()` **returns the pool reference**.
- After `s2 = s2.intern();`, `s2` points to the pool object, so `s1 == s2` is **true**.
- `s22` was not interned, so `s1 == s22` is still **false**.

**Case 4: `StringBuilder` and `StringBuffer`**
- `StringBuilder` and `StringBuffer` do **not override** `equals()`, so they inherit `Object.equals()`, which is the same as `==`.
- `sb1` and `sb2` are two different objects, so `sb1.equals(sb2)` is **false**, even though both contain `"Java"`.
- To compare content, use `sb1.toString().equals(sb2.toString())`, `sb1.compareTo(sb2) == 0` (Java 11+), or `String.contentEquals(sb)`.
- `StringBuffer` behaves the same way. The only difference is that its methods are **synchronized** (thread-safe), while `StringBuilder` is not.

### Example
```java runnable
public class StringPoolDemo {
    public static void main(String[] args) {

        // Case 1: literals are stored in the String Constant Pool
        String s1 = "Java";
        String s11 = "Java";
        System.out.println(s1 == s11);        // true (same pool object)

        // Case 2: new always creates a heap object
        String s2 = new String("Java");
        String s22 = new String("Java");
        System.out.println(s1 == s2);         // false
        System.out.println(s2 == s22);        // false
        System.out.println(s1.equals(s2));    // true (content is the same)

        // Case 3: intern() returns the pool reference
        s2 = s2.intern();
        System.out.println(s1 == s2);         // true
        System.out.println(s1 == s22);        // false (s22 was not interned)

        // Case 4: StringBuilder does not override equals()
        StringBuilder sb1 = new StringBuilder("Java");
        StringBuilder sb2 = new StringBuilder("Java");
        System.out.println(sb1.equals(sb2));                         // false (reference comparison)
        System.out.println(sb1.toString().equals(sb2.toString()));   // true
        System.out.println(sb1.compareTo(sb2) == 0);                 // true (Java 11+)

        // Case 5: StringBuffer behaves the same way
        StringBuffer sf1 = new StringBuffer("Java");
        StringBuffer sf2 = new StringBuffer("Java");
        System.out.println(sf1.equals(sf2));                         // false (reference comparison)
        System.out.println(sf1.toString().equals(sf2.toString()));   // true
        System.out.println("Java".contentEquals(sf1));               // true
    }
}
```

**Note on the original code:** `print1n` is a typo for `println`, and `s1`/`s2` were declared twice in the same method, which is a compile error (`variable s1 is already defined`).

**What happens as you change the code:**

| Expression | Result | Reason |
|---|---|---|
| `"Java" == "Java"` | `true` | same SCP object |
| `new String("Java") == "Java"` | `false` | heap object vs pool object |
| `new String("Java").equals("Java")` | `true` | content comparison |
| `new String("Java").intern() == "Java"` | `true` | `intern()` returns the pool reference |
| `"Ja" + "va" == "Java"` | `true` | compile-time constant, folded into the literal `"Java"` |
| `String a = "Ja"; (a + "va") == "Java"` | `false` | runtime concatenation creates a new heap object |
| `final String a = "Ja"; (a + "va") == "Java"` | `true` | `a` is a compile-time constant |
| `new StringBuilder("Java").equals(new StringBuilder("Java"))` | `false` | `equals()` is not overridden, so it compares references |
| `new StringBuffer("Java").equals(new StringBuffer("Java"))` | `false` | same reason |
| `"Java".contentEquals(new StringBuilder("Java"))` | `true` | compares content with any `CharSequence` |

**StringBuilder vs StringBuffer:**

| Feature | `StringBuilder` | `StringBuffer` |
|---|---|---|
| Thread safety | Not synchronized | Synchronized |
| Speed | Faster | Slower (locking overhead) |
| `equals()` | Reference comparison | Reference comparison |
| Introduced | Java 5 | Java 1.0 |
| Use when | Single thread (the usual case) | Shared between threads |

**Key takeaway:** `==` compares references and `equals()` compares content, but only for classes that override it. `String` does, `StringBuilder` and `StringBuffer` don't. Literals share one pool object, `new` always creates a new one, and `intern()` brings you back to the pool object.

</details>

<details><summary>finally always runs, even when an exception is thrown, so with a nested try the output is "Inner Finally", then "Handled", then "Outer Finally".</summary>

### Interviewer perspective
This question tests whether you know the **structure** of try/catch/finally and the **order of execution** when an exception propagates through nested blocks. Many candidates write `try-finally-catch` or expect `Handled` to print first. The interviewer wants to see that you can:

- State the legal order: `try`, then zero or more `catch`, then at most one `finally`.
- Explain that a `try` must have at least one `catch` or a `finally`.
- Explain that the inner `finally` runs **before** the exception reaches the outer `catch`, because the stack unwinds from the inside out.
- Explain that `finally` runs whether or not an exception occurs.

### Answer
**Why the original doesn't compile**
- `try { } finally { } catch { } finally { }` is invalid. A `try` statement can have only **one** `finally`, and it must be last.
- The fix is to nest the blocks so each `try` has its own handlers.

**Execution order of the corrected code**
1. `10 / 0` throws `ArithmeticException` inside the inner `try`.
2. The inner `try` has no `catch`, so the exception can't be handled there. Before it leaves the block, the inner `finally` runs and prints **`Inner Finally`**.
3. The exception then propagates to the outer `try`, where `catch (ArithmeticException e)` matches it and prints **`Handled`**.
4. The outer `finally` runs last and prints **`Outer Finally`**.

### Example
```java runnable
public class TryFinallyDemo {
    public static void main(String[] args) {
        try {
            try {
                int x = 10 / 0;                       // throws ArithmeticException
            } finally {
                System.out.println("Inner Finally");  // runs first
            }
        } catch (ArithmeticException e) {
            System.out.println("Handled");            // runs second
        } finally {
            System.out.println("Outer Finally");      // runs last
        }
    }
}
```

**Output:**
```
Inner Finally
Handled
Outer Finally
```

**Note on the original code:** `catch` after `finally` is a compile error, `print1n` is a typo for `println`, and the code needs a class and `main` method. The version above fixes all three.

**What happens as you change the code:**

| Change | Output | Reason |
|---|---|---|
| Inner `try` also has `catch (ArithmeticException e)` printing `"Inner Handled"` | `Inner Handled`, `Inner Finally`, `Outer Finally` | the inner catch handles it, so the outer `catch` never runs |
| Inner `try` has only `catch (NullPointerException e)` | `Inner Finally`, `Handled`, `Outer Finally` | no match, so the exception propagates outward |
| Replace `10 / 0` with `10 / 2` | `Inner Finally`, `Outer Finally` | no exception, but `finally` blocks still run |
| `System.exit(0)` placed before `10 / 0` | nothing printed | the JVM stops, so no `finally` runs |
| `return` inside the inner `finally` (in a method) | `Inner Finally`, `Outer Finally` | `return` in `finally` discards the exception, so `Handled` never prints (avoid this) |
| Inner `finally` throws a new exception | `Handled` for the new exception | the new exception replaces the original one |

**Legal and illegal forms:**

| Form | Valid? |
|---|---|
| `try { } catch (E e) { }` | yes |
| `try { } finally { }` | yes |
| `try { } catch (E e) { } finally { }` | yes |
| `try { } finally { } catch (E e) { }` | no, `catch` can't follow `finally` |
| `try { } finally { } finally { }` | no, only one `finally` per `try` |
| `try { }` | no, needs `catch` or `finally` |

**Key takeaway:** `finally` runs on the way out of its own `try`, so in nested blocks the inner `finally` always runs before the outer `catch`. The only common cases where `finally` doesn't run are `System.exit()`, a JVM crash, or a thread that never finishes the `try` block (for example, an infinite loop).

</details>