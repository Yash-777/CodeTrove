# Variables & Types

## `val` and `var`

- `val` is a read-only reference (assigned once).
- `var` is a mutable variable.

Prefer `val` and switch to `var` only when the value really changes.

```kotlin runnable
fun main() {
    val language = "Kotlin"   // cannot be reassigned
    var counter = 0           // can be reassigned
    counter += 1
    println("$language $counter")
}
```

Reassigning a `val` is a compile error. Remove the `//` below and press **Run** to see it:

```kotlin runnable
fun main() {
    val pi = 3.14
    // pi = 3.1416
    println(pi)
}
```

## Type inference and explicit types

The compiler infers the type from the initial value; you can still write it explicitly.

```kotlin runnable
fun main() {
    val city = "Hyderabad"        // String
    val visitors = 12             // Int
    val ratio: Double = 0.75      // explicit type
    val big = 3_000_000_000L      // Long
    val letter = 'K'              // Char
    val ready = true              // Boolean

    println("$city ${city::class.simpleName}")
    println("$visitors ${visitors::class.simpleName}")
    println("$ratio $big $letter $ready")
}
```

## No implicit widening

Kotlin does not silently convert between number types. Convert explicitly.

```kotlin runnable
fun main() {
    val small: Int = 42
    val large: Long = small.toLong()
    val text = "123".toInt()
    println(large + text)
    println(7 / 2)       // integer division
    println(7 / 2.0)     // floating-point division
}
```

## Type safety

A variable keeps its declared type. This code does not compile (see the underline):

```kotlin runnable
fun main() {
    var score = 99
    score = "Game Over"
    println(score)
}
```
