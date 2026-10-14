**Java Programming Language**

Java is a programming language and computing platform first released by Sun Microsystems in 1995. It is the underlying technology that powers Java programs including utilities, games, and business applications. Java runs on more than 850 million personal computers worldwide, and on billions of devices worldwide, including mobile and TV devices. Java is composed of a number of key components that, as a whole, create the Java platform.

Java is an object-oriented programming language that includes the following features.
 * Platform Independence - Java applications are compiled into bytecode which is stored in class files and loaded in a JVM. Since applications run in a JVM, they can be run on many different operating systems and devices.
 * Object-Oriented - Java is an object-oriented language that take many of the features of C and C++ and improves upon them.
 * Automatic Garbage Collection - Java automatically allocates and deallocates memory so programs are not burdened with that task.
 * Rich Standard Library - Java includes a vast number of premade objects that can be used to perform such tasks as input/output, networking, and date manipulation.

#### Get started with [_Java Technology_](https://docs.oracle.com/javase/tutorial/getStarted/intro/definition.html)

_In the Java programming language, all source code is first written in plain text files ending with the `.java` extension. Those source files are then compiled into `.class` files by the javac compiler. A `.class` file does not contain code that is native to your **processor**; it instead contains **bytecodes** — the machine language of the Java Virtual Machine (JVM). The java launcher tool then runs your application with an instance of the Java Virtual Machine._

| Figure showing MyProgram.java, compiler, MyProgram.class, Java VM, and My Program running on a computer. |
| :--: |
| ![MyProgram.java](https://docs.oracle.com/javase/tutorial/figures/getStarted/getStarted-compiler.gif "An overview of the software development process.") |

Because the Java VM is available on many different operating systems, the same .class files are capable of running on Microsoft Windows, the Solaris™ Operating System (Solaris OS), Linux, or Mac OS.

| _Figure showing source code, compiler, and Java VM's for Win32, Solaris OS/Linux, and Mac OS_ |
| :--: |
| ![Figure showing source code, compiler, and Java VM's for Win32, Solaris OS/Linux, and Mac OS](https://docs.oracle.com/javase/tutorial/figures/getStarted/helloWorld.gif "Through the Java VM, the same application is capable of running on multiple platforms.") |

---

The Java VM requires that the class you execute with it have a main method at which to begin execution of your application.
<br />
A [Closer Look at the "Hello World!" Application](https://docs.oracle.com/javase/tutorial/getStarted/application/index.html) discusses the main method in detail.

```java
/**
 * The HelloWorldApp class implements an application that
 * simply displays "Hello World!" to the standard output.
 */
class HelloWorldApp {
    public static void main(String[] args) {
        System.out.println("Hello World!"); //Display the string.
    }
}
```

## Try it

Every example marked with **Run** is a live Java editor. Edit the code and press **Run** (or `Ctrl/Cmd + Enter`). Select the execution API first, then select the Java version offered by that API. Use a `public class Main` so the file is `Main.java`.

```java runnable
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}
```

> [!NOTE]
> Java code uses [Wandbox](https://wandbox.org) by default. The current public Wandbox compiler list advertises **Java 22 (OpenJDK 22+36)** and **Java 21 (OpenJDK 21+35)**; the dropdown is loaded from Wandbox at runtime so it does not claim versions the service no longer offers. Java boxes need an internet connection and send the snippet text and STDIN to the selected service.

## Java execution APIs

### Wandbox — default

[Wandbox](https://wandbox.org) is an open-source public “social compilation” service. CodeTrove reads the available Java compilers with:

```text
GET https://wandbox.org/api/list.json
```

It filters entries whose language is Java, then sends code and STDIN to:

```text
POST https://wandbox.org/api/compile.json
```

The request includes the selected compiler identifier, `stdin`, compiler/runtime options, and `save: false`. The response is read from `compiler_error`, `program_output`, `program_error`, and `status`. Wandbox currently supports these Java versions in the public list: **22 and 21**. If the public list changes, CodeTrove updates the version dropdown automatically.

### Judge0 — best for self-hosting

[Judge0](https://github.com/judge0/judge0) is open source and provides a REST API for compiling and running Java. It supports STDIN, compiler output, execution status, CPU/wall-time limits, and memory limits. You can configure the JDK versions installed on your own service, but self-hosting requires deployment and maintenance. The hosted [online demo](https://ide.judge0.com/) is useful for trying Judge0, but public endpoints may have rate limits or availability constraints.

CodeTrove reads Java runtimes from the selected Judge0-compatible endpoint:

```text
GET https://ce.judge0.com/languages
```

The public endpoint currently advertises **Java 17 (JDK 17.0.6)** and **Java 13 (OpenJDK 13.0.1)**. It then submits the source with the selected `language_id` and limits to:

```text
POST https://ce.judge0.com/submissions?base64_encoded=false&wait=true
```

The response is read from `compile_output`, `stdout`, `stderr`, and `status.description`. A self-hosted Judge0 deployment can expose a different compatible base URL and a different set of installed JDK versions; the API adapter keeps the provider-specific request and response handling separate from the editor.

See the [Java playground](#/build/compiler?lang=java) for STDIN input and the API/version selectors.
