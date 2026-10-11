# Data Classes

A `data class` is meant to hold data. The compiler generates `equals()`, `hashCode()`, `toString()`, `copy()` and `componentN()` functions from the primary constructor.

## Declaring and printing

```kotlin runnable
data class User(val name: String, val age: Int)

fun main() {
    val user = User("Asha", 31)
    println(user)                       // toString() is generated
    println(user.name)
}
```

## Equality is by value

```kotlin runnable
data class Point(val x: Int, val y: Int)

class Plain(val x: Int, val y: Int)

fun main() {
    println(Point(1, 2) == Point(1, 2))     // true  - compares properties
    println(Plain(1, 2) == Plain(1, 2))     // false - compares references
    println(setOf(Point(1, 2), Point(1, 2)).size)
}
```

## `copy()` and destructuring

```kotlin runnable
data class Product(val name: String, val price: Double, val inStock: Boolean = true)

fun main() {
    val keyboard = Product("Keyboard", 49.99)
    val sale = keyboard.copy(price = 39.99)
    println(keyboard)
    println(sale)

    val (name, price, inStock) = sale
    println("$name costs $price (in stock: $inStock)")
}
```

## Use them in collections

```kotlin runnable
data class Employee(val name: String, val department: String, val salary: Int)

fun main() {
    val team = listOf(
        Employee("Asha", "Engineering", 120),
        Employee("Ravi", "Engineering", 100),
        Employee("Meera", "Design", 90),
    )

    println(team.groupBy { it.department }.mapValues { (_, people) -> people.map { it.name } })
    println(team.maxByOrNull { it.salary })
    println(team.sumOf { it.salary })
}
```
