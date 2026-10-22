# Programming Languages

A programming language gives us rules for expressing data, decisions, repetition, and reusable behavior. CodeTrove's **Compiler** tab supports the languages below. Open [Build → Compiler](#/build/compiler) to edit and run examples.

## Compiler languages and entry points

The **entry point** is the place where execution begins for the selected execution model. Not every language uses a method named `main`.

| Language | File shown in CodeTrove | Main entry point | What starts execution |
|---|---|---|---|
| Java | `Main.java` | `public static void main(String[] args)` | The JVM launcher loads the selected class and calls its static `main` method. |
| Kotlin | `Main.kt` | `fun main()` or `fun main(args: Array<String>)` | The Kotlin compiler/runtime calls the top-level `main` function. |
| C | `main.c` | `int main(void)` or `int main(int argc, char** argv)` | The C runtime calls `main` after startup code prepares the process. |
| C++ | `main.cpp` | `int main()` or `int main(int argc, char** argv)` | The C++ runtime calls `main` after global/static initialization. |
| JavaScript | `index.js` | No required `main` method | The runtime evaluates the module/script from the first executable statement. |
| TypeScript | `index.ts` | No required `main` method | TypeScript is checked/transpiled first; the resulting JavaScript starts at its first executable statement. |
| Python | `main.py` | No required `main` method | The interpreter executes top-level statements from top to bottom. A project may choose `if __name__ == "__main__":` as a convention. |

A function named `main` is a convention or runtime contract, not a universal rule. For example, Java requires a launcher-compatible static method, while Python can run a file without defining any function.

### Examples

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Java starts here");
    }
}
```

```javascript
function greet() {
    console.log("JavaScript starts by evaluating this file");
}

greet();
```

```python
print("Python starts at the first top-level statement")

if __name__ == "__main__":
    print("This block is a common script-entry convention")
```

## Why do we need variables?

A **variable** is a named place for a value that a program needs to read, update, or pass to another operation. Without names, a program would have to repeat unexplained literals and could not conveniently keep track of changing state.

```java
int quantity = 3;
quantity = quantity + 1;
System.out.println(quantity); // 4
```

The name `quantity` communicates intent. The value can change, while the declaration also tells the compiler what kind of value is allowed. A variable may hold a primitive value, an object reference, a function, or another language-specific value.

## Why do we need data types?

A **data type** describes what values are valid and what operations make sense for them. Types help a compiler or runtime interpret bits, reject invalid operations early, choose useful APIs, and document the programmer's intent.

```java
int age = 30;          // whole number
String name = "Alice"; // text
boolean active = true; // true or false
```

Statically typed languages such as Java, C, C++, and TypeScript check many type rules before execution. Dynamically typed languages such as JavaScript and Python still have types, but the runtime checks more of those rules while the program runs. Static typing does not make a program automatically correct, and dynamic typing does not mean “no types.”

## Functions and methods

A **function** is a reusable callable unit. A **method** is a function associated with a class, object, or other type. The terms overlap: in Java, executable behavior is declared as methods; in JavaScript, a function stored as an object property is commonly called a method.

| Question | Function | Method |
|---|---|---|
| Where is it defined? | As a standalone callable unit, depending on the language. | Inside or associated with a class/object/type. |
| How is it called? | By its name or a function value, according to the language's scope rules. | Through an object/class/type, or through a language-supported method reference. |
| Does it need an object? | Often no. A standalone function can be called without creating an object. | An instance method usually needs an object; a static/class method is called through the type and does not need an instance. |
| Does it access object state? | It can use arguments and captured/global state. | It can also access the receiver's fields/state, commonly through `this` or an equivalent. |
| Example | `double square(double x)` | `account.deposit(100)` |

“Callable from anywhere” is too broad: a function must still be visible in its scope, exported/imported when necessary, and callable with valid arguments. Likewise, a method is not always inaccessible without an object: Java `static` methods are called through the class, and JavaScript methods can be called with an explicit receiver.

```java
class Account {
    private int balance;

    void deposit(int amount) { // instance method: uses this object's state
        balance += amount;
    }

    static int add(int left, int right) { // static method: no Account object needed
        return left + right;
    }
}

Account account = new Account();
account.deposit(100);
int total = Account.add(2, 3);
```

```javascript
function add(left, right) { // standalone function
    return left + right;
}

const calculator = {
    add(left, right) { // method associated with calculator
        return left + right;
    }
};
```

## Related concepts

- [Java Class & Object](#/content/tree/languages/java/core/class-object)
- [Java Interface & Abstract Class](#/content/tree/languages/java/core/interface-abstract-class)
- [Java Object-Oriented Programming](#/content/tree/languages/java/core/oop)
- [Compiler playground](#/build/compiler)

Further reading: [dev.java language learning](https://dev.java/learn/language/), [Oracle Java classes and objects](https://docs.oracle.com/javase/tutorial/java/javaOO/classes.html), [Oracle Java launcher](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html), [MDN functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions), and [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html).
