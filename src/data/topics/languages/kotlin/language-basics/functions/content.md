# Functions

## Declaring functions

```kotlin runnable
fun add(a: Int, b: Int): Int {
    return a + b
}

// Expression body: the return type is inferred
fun multiply(a: Int, b: Int) = a * b

fun main() {
    println(add(10, 5))
    println(multiply(6, 7))
}
```

## Default and named arguments

```kotlin runnable
fun greet(name: String, greeting: String = "Hello", punctuation: String = "!"): String =
    "$greeting, $name$punctuation"

fun main() {
    println(greet("Yash"))
    println(greet("Yash", "Welcome"))
    println(greet(name = "Yash", punctuation = "?"))
}
```

## Unit and `vararg`

A function that returns nothing useful returns `Unit` (usually omitted).

```kotlin runnable
fun printAll(vararg items: String) {
    for (item in items) println("- $item")
}

fun main() {
    printAll("alpha", "beta", "gamma")
}
```

## Lambdas and higher-order functions

Functions are values: pass them around and return them.

```kotlin runnable
fun applyTwice(x: Int, operation: (Int) -> Int): Int = operation(operation(x))

fun main() {
    val double = { n: Int -> n * 2 }
    println(applyTwice(3, double))
    println(applyTwice(3) { it + 10 })       // trailing lambda, implicit `it`
    println(listOf(1, 2, 3).map { it * it })
}
```

## Extension functions

Add a function to an existing type without inheriting from it.

```kotlin runnable
fun String.shout(): String = uppercase() + "!"

fun main() {
    println("kotlin".shout())
}
```
