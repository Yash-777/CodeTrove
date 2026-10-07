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
