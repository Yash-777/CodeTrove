# Collections

Kotlin separates **read-only** collections (`List`, `Set`, `Map`) from **mutable** ones (`MutableList`, `MutableSet`, `MutableMap`).

## List

```kotlin runnable
fun main() {
    val fruits = listOf("apple", "banana", "cherry")
    println(fruits)
    println("size = ${fruits.size}, first = ${fruits.first()}, last = ${fruits.last()}")
    println(fruits[1])

    val shopping = mutableListOf("milk")
    shopping.add("bread")
    shopping += "eggs"
    println(shopping)
}
```

## Set and Map

```kotlin runnable
fun main() {
    val unique = setOf(1, 2, 2, 3, 3, 3)
    println(unique)                         // [1, 2, 3]

    val ages = mapOf("Asha" to 31, "Ravi" to 27)
    println(ages["Asha"])
    println(ages.getOrDefault("Nobody", -1))
    for ((name, age) in ages) println("$name is $age")

    val scores = mutableMapOf<String, Int>()
    scores["kotlin"] = 100
    scores["java"] = 90
    println(scores)
}
```

## `map`, `filter`, `reduce`

```kotlin runnable
fun main() {
    val numbers = listOf(1, 2, 3, 4, 5, 6)

    println(numbers.filter { it % 2 == 0 })
    println(numbers.map { it * it })
    println(numbers.sum())
    println(numbers.reduce { acc, n -> acc * n })
    println(numbers.any { it > 5 })
    println(numbers.all { it > 0 })
}
```

## Grouping, sorting and chaining

```kotlin runnable
fun main() {
    val words = listOf("kiwi", "apple", "fig", "banana", "cherry", "date")

    println(words.sortedBy { it.length })
    println(words.groupBy { it.length })
    println(words.filter { it.length > 3 }.map { it.uppercase() }.sorted())
    println(words.associateWith { it.length })
}
```

## Sequences for large pipelines

A `Sequence` evaluates lazily - elements flow through the whole chain one at a time.

```kotlin runnable
fun main() {
    val result = generateSequence(1) { it + 1 }
        .filter { it % 3 == 0 }
        .map { it * it }
        .take(5)
        .toList()
    println(result)
}
```
