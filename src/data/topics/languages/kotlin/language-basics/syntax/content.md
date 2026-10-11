# Kotlin Syntax

A Kotlin program starts at a `main` function. Statements do not need semicolons.

## Hello, World

```kotlin runnable
fun main() {
    println("Hello, World!")
}
```

## Comments and string templates

Use `$name` or `${expression}` to put values inside a string.

```kotlin runnable
fun main() {
    // single-line comment
    /* multi-line
       comment */
    val name = "Kotlin"
    val year = 2016
    println("Hello, $name!")
    println("${name.length} letters, released in $year, ${2026 - year} years ago")
}
```

## Everything is an expression (almost)

`if` returns a value, so it can be assigned directly.

```kotlin runnable
fun main() {
    val a = 7
    val b = 12
    val max = if (a > b) a else b
    println("max = $max")
}
```

## Program arguments

`main` can optionally receive the command-line arguments.

```kotlin runnable
fun main(args: Array<String>) {
    println("Received ${args.size} arguments")
}
```

## Try it yourself

```kotlin runnable
fun main() {
    val language = "Kotlin"
    println("I am learning $language")
    // Try: break the code (remove a quote) and watch the editor underline the error.
}
```
