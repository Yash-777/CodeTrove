# Errors & Exceptions in Java

Java reports an abnormal situation by throwing an object from the `Throwable` hierarchy. The two main branches are `Error` and `Exception`. This lesson explains how the hierarchy works, when the compiler requires handling, how failures move through the call stack, and how to write safe recovery code.

![Java Throwable hierarchy](java-diagram:throwable-hierarchy)

## 1. The `Throwable` hierarchy

`Throwable` is the superclass of everything that the JVM or the `throw` statement can throw. Its two important direct subclasses are:

- **`Error`**: a serious problem normally caused by the JVM or its environment. Application code usually does not recover from it.
- **`Exception`**: an exceptional condition that application code can often handle, translate, log, or report to a caller.

`RuntimeException` is a subclass of `Exception`. A throwable is a **checked exception** when it is neither an `Error` nor a `RuntimeException` subclass. Checked exceptions must be caught or declared.

```text
Throwable
├── Error                         unchecked
│   ├── OutOfMemoryError
│   ├── StackOverflowError
│   ├── NoClassDefFoundError
│   └── LinkageError
└── Exception
    ├── RuntimeException           unchecked
    │   ├── NullPointerException
    │   ├── IllegalArgumentException
    │   ├── ArithmeticException
    │   └── IndexOutOfBoundsException
    └── checked exceptions
        ├── IOException
        ├── SQLException
        ├── InterruptedException
        └── ClassNotFoundException
```

The exact rule is more useful than memorizing a list: a subclass of `Throwable` is checked unless it is also a subclass of `RuntimeException` or `Error`.

## 2. Error versus Exception

| Property | `Error` | Checked `Exception` | Unchecked `RuntimeException` |
| --- | --- | --- | --- |
| Typical cause | JVM, class-loading, memory, or runtime infrastructure failure | External condition the caller may recover from | Invalid state, invalid input, or programming defect |
| Compiler requires catch/declare? | No | Yes | No |
| Usually recoverable? | Usually no | Often yes | Depends on the contract and bug |
| Examples | `OutOfMemoryError`, `StackOverflowError` | `IOException`, `SQLException` | `NullPointerException`, `IllegalArgumentException` |
| Normal application action | Protect boundaries and allow shutdown/restart | Handle, retry, translate, or declare | Fix the cause or validate input; catch only when useful |

“Unchecked” does not mean “unimportant.” It means the compiler does not enforce a catch-or-declare rule. `NullPointerException` may still represent a serious defect.

### Runnable: compare the three categories

This example deliberately throws one value from each category. The simulated `Error` does not allocate memory; it demonstrates the control-flow rule safely.

```java runnable
public class Main {
    static class ConfigurationException extends Exception {
        ConfigurationException(String message) { super(message); }
    }

    static void checkedFailure() throws ConfigurationException {
        throw new ConfigurationException("Configuration file is unavailable");
    }

    static void uncheckedFailure() {
        throw new IllegalArgumentException("Age cannot be negative");
    }

    static void simulatedSeriousFailure() {
        throw new AssertionError("Simulated JVM-level failure");
    }

    public static void main(String[] args) {
        try {
            checkedFailure();
        } catch (ConfigurationException e) {
            System.out.println("Checked: " + e.getMessage());
        }

        try {
            uncheckedFailure();
        } catch (IllegalArgumentException e) {
            System.out.println("Unchecked: " + e.getMessage());
        }

        try {
            simulatedSeriousFailure();
        } catch (AssertionError e) {
            System.out.println("Error caught for demonstration: " + e.getMessage());
        }
    }
}
```

## 3. What happens when an exception is thrown?

When a method throws a `Throwable`:

1. Java creates or receives a throwable object containing its type, message, stack trace, and possibly a cause.
2. The current method stops at the throw point.
3. The JVM searches the current method for a compatible `catch` block.
4. If none matches, the JVM returns to the caller and repeats the search up the call stack.
5. If no handler is found, the current thread terminates and the JVM prints an uncaught-exception report.

![Exception propagation through the call stack](java-diagram:exception-propagation)

### Runnable: propagation and the call stack

```java runnable
public class Main {
    static void controller() {
        service();
    }

    static void service() {
        repository();
    }

    static void repository() {
        throw new IllegalStateException("Database connection is not ready");
    }

    public static void main(String[] args) {
        try {
            controller();
        } catch (IllegalStateException e) {
            System.out.println("Handled at the boundary: " + e.getMessage());
            System.out.println("Thrown type: " + e.getClass().getSimpleName());
            System.out.println("Top stack frame: " + e.getStackTrace()[0].getMethodName());
        }
    }
}
```

## 4. Checked exceptions

A checked exception represents a condition that the caller is expected to consider. For example, reading a file can fail because it does not exist, permissions changed, or the device is unavailable. The compiler requires one of two choices:

- handle it with `try`/`catch`; or
- declare it with `throws` so the caller takes responsibility.

Common checked exceptions include `IOException`, `SQLException`, `InterruptedException`, `ClassNotFoundException`, `ParseException`, and `ReflectiveOperationException`.

```java runnable
import java.io.IOException;

public class Main {
    static String loadProfile() throws IOException {
        throw new IOException("Profile store is temporarily unavailable");
    }

    public static void main(String[] args) {
        try {
            System.out.println(loadProfile());
        } catch (IOException e) {
            System.out.println("Show retry message: " + e.getMessage());
        }
    }
}
```

A checked exception is not automatically a better design. Use it when callers can reasonably recover or choose another action. Do not force callers to catch an exception for a programming error that should instead be fixed or represented by a clear unchecked exception.

## 5. Unchecked exceptions

Unchecked exceptions extend `RuntimeException`. The compiler does not require a catch or declaration because these failures commonly indicate invalid input, a violated precondition, or a programming defect.

Examples include:

- `NullPointerException`: an operation needs an object but receives `null`.
- `IllegalArgumentException`: a method receives an invalid argument.
- `IllegalStateException`: the object or application is not in a valid state for the operation.
- `ArithmeticException`: an invalid arithmetic operation occurs, such as integer division by zero.
- `IndexOutOfBoundsException`: an index is outside the valid range.
- `ClassCastException`: an object cannot be cast to the requested type.
- `NoSuchElementException`: code asks an iterator or optional-like source for a value that is absent.

### Runnable: validate at the boundary

```java runnable
public class Main {
    static int lengthOfRequiredText(String text) {
        if (text == null) {
            throw new IllegalArgumentException("text must not be null");
        }
        return text.length();
    }

    public static void main(String[] args) {
        try {
            System.out.println(lengthOfRequiredText(null));
        } catch (IllegalArgumentException e) {
            System.out.println("Bad request: " + e.getMessage());
        }

        System.out.println("Valid length: " + lengthOfRequiredText("Java"));
    }
}
```

Do not catch `RuntimeException` merely to hide a defect. Validate data at the boundary, fix the root cause, or catch it at a meaningful boundary where you can produce a useful response.

## 6. `try`, `catch`, and `finally`

A `try` block contains code that may fail. A `catch` block handles a matching throwable. A `finally` block is for cleanup that should happen whether the operation succeeds or fails.

Rules to remember:

- A `try` must have at least one `catch`, one `finally`, or both.
- More specific catches must appear before broader catches.
- Only one matching catch block runs.
- `finally` normally executes after the try or catch block.
- A JVM shutdown, process kill, or catastrophic JVM failure can prevent `finally` from running.
- Avoid returning from `finally`; it can hide an exception or replace a return value.

```java runnable
public class Main {
    public static void main(String[] args) {
        try {
            int value = Integer.parseInt("not-a-number");
            System.out.println(value);
        } catch (NumberFormatException e) {
            System.out.println("Input is not an integer");
        } finally {
            System.out.println("Cleanup or final logging runs here");
        }
        System.out.println("The program continues after handling");
    }
}
```

## 7. Try-with-resources

For a resource that implements `AutoCloseable`, prefer try-with-resources. Java closes the resource automatically, even when the body throws. If both the body and close operation fail, the close failure is retained as a **suppressed exception** on the primary exception.

```java runnable
import java.io.BufferedReader;
import java.io.StringReader;

public class Main {
    public static void main(String[] args) {
        try (BufferedReader reader = new BufferedReader(new StringReader("first line"))) {
            System.out.println(reader.readLine());
        } catch (Exception e) {
            System.out.println("Read failed: " + e.getMessage());
        }
        System.out.println("The reader was closed automatically");
    }
}
```

Use this pattern for files, sockets, database statements, HTTP response bodies, and other closeable resources. It is safer than manually closing a resource in `finally` because it preserves close failures and handles multiple resources in reverse declaration order.

## 8. `throw` versus `throws`

| Keyword | Meaning | Location | Example |
| --- | --- | --- | --- |
| `throw` | Actually throws one throwable object now | Method body | `throw new IllegalArgumentException("bad age");` |
| `throws` | Declares that a method may propagate one or more types | Method signature | `read() throws IOException` |

`throws` is required for a propagated checked exception. It is optional for `RuntimeException` and `Error`, although declaring an unchecked type can document a contract.

```java runnable
import java.io.IOException;

public class Main {
    static void validate(int age) {
        if (age < 0) {
            throw new IllegalArgumentException("age cannot be negative");
        }
    }

    static void readConfig() throws IOException {
        throw new IOException("config file is missing");
    }

    public static void main(String[] args) {
        try {
            validate(-1);
        } catch (IllegalArgumentException e) {
            System.out.println("throw: " + e.getMessage());
        }

        try {
            readConfig();
        } catch (IOException e) {
            System.out.println("throws propagated to caller: " + e.getMessage());
        }
    }
}
```

## 9. Custom exceptions and exception chaining

Create a custom exception when its type communicates a domain-level decision that callers may need to handle. A checked custom exception extends `Exception`; an unchecked custom exception extends `RuntimeException`.

Always preserve the original cause when translating a lower-level failure. The cause lets logs and diagnostics show where the failure began.

```java runnable
public class Main {
    static class PaymentDeclinedException extends Exception {
        PaymentDeclinedException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    static void chargeCard() throws PaymentDeclinedException {
        try {
            throw new IllegalStateException("gateway timeout");
        } catch (IllegalStateException e) {
            throw new PaymentDeclinedException("Payment could not be completed", e);
        }
    }

    public static void main(String[] args) {
        try {
            chargeCard();
        } catch (PaymentDeclinedException e) {
            System.out.println(e.getMessage());
            System.out.println("Cause: " + e.getCause().getMessage());
        }
    }
}
```

Use a meaningful message, provide the standard constructors where appropriate, and do not expose stack traces or internal causes directly to an end user.

## 10. Errors and thread behavior

An `Error` can technically be caught because it is a `Throwable`, but catching it is usually not a recovery strategy. `OutOfMemoryError`, `StackOverflowError`, `NoClassDefFoundError`, and linkage failures can leave the process or its assumptions unsafe. A top-level boundary may log the failure, release what it can, and let a supervisor restart the service.

If an uncaught throwable escapes a thread, that thread terminates. Other threads are not automatically stopped. This is why one request thread can fail while other request threads continue, although the service may still be unhealthy if the failure indicates a shared JVM or deployment problem.

`finally` normally executes while unwinding even for an `Error`, but it is not an absolute guarantee if the JVM is forcibly terminated or crashes.

### Runnable: one failing thread and two healthy threads

```java runnable
public class Main {
    static void request(String name, boolean fail) {
        try {
            System.out.println(name + " started");
            if (fail) {
                throw new AssertionError("simulated fatal request failure");
            }
            System.out.println(name + " completed");
        } finally {
            System.out.println(name + " cleanup ran");
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Thread first = new Thread(() -> request("Request-1", false));
        Thread failed = new Thread(() -> request("Request-2", true));
        Thread third = new Thread(() -> request("Request-3", false));

        first.start();
        failed.start();
        third.start();
        first.join();
        failed.join();
        third.join();
        System.out.println("Main thread is still running");
    }
}
```

In a real server, catch ordinary `Exception` values at a request boundary to create an appropriate response, use `finally` or try-with-resources for cleanup, and let infrastructure monitor uncaught errors. Do not claim that catching an `Error` makes the JVM healthy.

## 11. Common runtime failures

| Type | Meaning | Typical response |
| --- | --- | --- |
| `ClassNotFoundException` | Explicit class loading could not find the requested class | Check the classpath, module path, or optional dependency; handle or declare it |
| `NoClassDefFoundError` | A class definition available during compilation is unavailable or failed during runtime loading | Fix packaging, dependency scope, version conflicts, or initialization failure |
| `ClassCastException` | The runtime type is incompatible with the requested cast | Correct the type design or check with `instanceof` before casting |
| `NullPointerException` | Code dereferenced `null` where an object was required | Validate inputs and fix the source of the null reference |
| `IllegalStateException` | An operation was called when the object or workflow was in the wrong state | Correct lifecycle ordering or report the state transition clearly |
| `ClassFormatError` | The JVM found an invalid class-file format | Rebuild the artifact and inspect bytecode, packaging, or incompatible tooling |
| `LinkageError` | A class-loading or binary-compatibility problem occurred | Align runtime and compile-time dependencies; restart after deployment repair |
| `ClassCircularityError` | A circular dependency occurred while initializing a class | Break the initialization cycle |
| `IllegalClassFormatException` | An instrumentation transformer received an invalid class format | Fix the agent or transformer and verify bytecode compatibility |
| `UnmodifiableClassException` | An instrumentation operation tried to modify a class that cannot be modified | Change the instrumentation strategy or target a modifiable class |
| `ReflectiveOperationException` | A reflective operation failed; common subclasses include class, method, and field lookup failures | Handle or translate the reflective failure at the boundary |
| `RuntimeException` | Base class for unchecked application/runtime failures | Fix invalid state or input; catch only with a useful recovery action |

### `ClassNotFoundException` versus `NoClassDefFoundError`

`ClassNotFoundException` is an exception commonly produced by an explicit operation such as `Class.forName("com.example.Plugin")`. The caller can often treat it as an optional plugin or configuration problem.

`NoClassDefFoundError` is an error raised when the JVM needs a class definition at runtime but cannot load it, even though compilation previously succeeded or the class initialization failed. It commonly indicates a packaging, classpath, module-path, or dependency-version problem.

## 12. Null handling

`NullPointerException` often points to an earlier contract violation. Check required arguments at the public boundary and use a clear message. Do not use a broad `catch (NullPointerException)` as normal validation.

```java runnable
public class Main {
    static String upperCaseRequired(String value) {
        if (value == null) {
            throw new IllegalArgumentException("value is required");
        }
        return value.toUpperCase();
    }

    public static void main(String[] args) {
        try {
            System.out.println(upperCaseRequired(null));
        } catch (IllegalArgumentException e) {
            System.out.println("Validation message: " + e.getMessage());
        }
        System.out.println(upperCaseRequired("java"));
    }
}
```

For a safe comparison when a value may be null, call `equals` on the known non-null constant: `"Yash".equals(value)`, not `value.equals("Yash")`.

## 13. Practical handling checklist

1. Catch only when you can recover, add context, translate the exception, or produce a meaningful boundary response.
2. Catch the most specific type that you can handle.
3. Preserve the cause when wrapping: `new DomainException("message", cause)`.
4. Do not swallow failures with an empty catch block.
5. Do not log the same exception repeatedly at every layer.
6. Use try-with-resources for closeable resources.
7. Restore the interrupt flag when catching `InterruptedException` unless the method deliberately handles interruption: `Thread.currentThread().interrupt()`.
8. Do not catch `Throwable` in ordinary application code.
9. Treat `Error` as a signal to diagnose infrastructure or JVM health, not as a normal business exception.
10. Return safe client-facing messages while keeping detailed causes in protected logs.

## Quick interview questions and answers

<details><summary>What is the root class of Java errors and exceptions?</summary>

`Throwable` is the root class. Its direct branches are `Error` and `Exception`. Only a `Throwable` or one of its subclasses can be thrown or caught.

</details>

<details><summary>What is the main difference between Error and Exception?</summary>

An `Error` normally represents a serious JVM, class-loading, memory, or infrastructure problem from which application code is not expected to recover. An `Exception` represents an abnormal application condition that code can often handle or translate. Both are throwable, but their operational meaning differs.

</details>

<details><summary>Can an Error be caught?</summary>

Yes. `Error` extends `Throwable`, so a compatible catch block can catch it. That does not mean it should normally be caught. Catch it only at a carefully chosen boundary for logging, cleanup, or controlled shutdown/restart behavior.

</details>

<details><summary>What is the difference between checked and unchecked exceptions?</summary>

A checked exception is a `Throwable` that is not an `Error` or `RuntimeException`; the compiler requires it to be caught or declared. An unchecked exception is a `RuntimeException` or `Error`; the compiler does not impose that requirement.

</details>

<details><summary>Is RuntimeException checked or unchecked?</summary>

`RuntimeException` and all its subclasses are unchecked. `NullPointerException`, `IllegalArgumentException`, and `ArithmeticException` are examples.

</details>

<details><summary>What is the difference between throw and throws?</summary>

`throw` performs the throw inside a method body and accepts one throwable object. `throws` appears in a method signature and declares types that may propagate to the caller. Checked exceptions require a catch or declaration; unchecked types do not.

</details>

<details><summary>Does finally always execute?</summary>

`finally` normally executes during control-flow completion, exception propagation, return, or error unwinding. It may not execute if the JVM exits abruptly, the process is forcibly killed, or the JVM itself crashes. Avoid returning from `finally`.

</details>

<details><summary>Why is try-with-resources preferred over finally for resources?</summary>

It closes every declared `AutoCloseable` automatically, closes multiple resources in reverse order, and preserves close failures as suppressed exceptions instead of losing them.

</details>

<details><summary>What is exception propagation?</summary>

Propagation is the JVM searching the current method and then its callers for a compatible handler. A method can handle the exception, translate it with a cause, or allow it to continue up the call stack.

</details>

<details><summary>What is exception chaining?</summary>

Exception chaining preserves the lower-level cause inside a higher-level exception. For example, a repository can wrap an `IOException` in `ProfileLoadException` while retaining the original cause for diagnostics.

</details>

<details><summary>Are constructors inherited?</summary>

No. Constructors are not members inherited by subclasses. A subclass constructor can invoke a superclass constructor using `super(...)`, and Java inserts an implicit `super()` when no explicit constructor call is written and the superclass has an accessible no-argument constructor.

</details>

<details><summary>Why should application code usually not catch OutOfMemoryError?</summary>

The JVM may not have enough memory to continue safely. Catching it can allow a few cleanup or logging actions, but it is not reliable recovery. The normal operational response is to diagnose memory usage and restart or replace the failing process.

</details>

<details><summary>What is the difference between ClassNotFoundException and NoClassDefFoundError?</summary>

`ClassNotFoundException` is an exception commonly caused by an explicit class lookup that cannot find a class. `NoClassDefFoundError` is an error raised when the JVM needs a class definition at runtime but cannot load it or its initialization failed. The first is often an expected optional-loading failure; the second usually indicates packaging or dependency problems.

</details>

<details><summary>Can one thread's Error stop every other thread?</summary>

An uncaught throwable normally terminates the thread in which it occurs. Other threads can continue, but a shared JVM-level failure such as memory exhaustion may make the whole service unhealthy. Thread isolation is not a guarantee of application safety.

</details>

<details><summary>Should a catch block catch Exception or Throwable?</summary>

Catch the narrowest type you can handle. Catching `Exception` can be appropriate at an application boundary, but catching `Throwable` also catches `Error` and should be reserved for exceptional infrastructure-level boundaries. Never use broad catches to hide bugs.

</details>

## References

[1]: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html "Java SE 21 Throwable API"
[2]: https://docs.oracle.com/javase/tutorial/essential/exceptions/ "Oracle Java exceptions tutorial"
[3]: https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html "Java Language Specification: Exceptions"
[4]: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Error.html "Java SE 21 Error API"
[5]: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Exception.html "Java SE 21 Exception API"
