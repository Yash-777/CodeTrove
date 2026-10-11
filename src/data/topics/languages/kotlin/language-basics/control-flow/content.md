# Control Flow

## `if` as an expression

```kotlin runnable
fun main() {
    val temperature = 31
    val label = if (temperature > 30) "hot" else if (temperature > 15) "mild" else "cold"
    println("It is $label")
}
```

## `when` - a powerful `switch`

```kotlin runnable
fun describe(x: Any): String = when (x) {
    0 -> "zero"
    1, 2, 3 -> "small number"
    in 4..9 -> "single digit"
    is String -> "text of length ${x.length}"
    else -> "something else"
}

fun main() {
    println(describe(0))
    println(describe(2))
    println(describe(7))
    println(describe("Kotlin"))
    println(describe(3.14))
}
```

## Loops and ranges

```kotlin runnable
fun main() {
    for (i in 1..3) print("$i ")          // 1 2 3
    println()
    for (i in 10 downTo 1 step 3) print("$i ")   // 10 7 4 1
    println()
    for (i in 0 until 3) print("$i ")     // 0 1 2
    println()

    var n = 3
    while (n > 0) {
        println("countdown $n")
        n--
    }
}
```

## `break`, `continue` and labels

```kotlin runnable
fun main() {
    outer@ for (i in 1..3) {
        for (j in 1..3) {
            if (j == 2) continue
            if (i == 3) break@outer
            println("i=$i j=$j")
        }
    }
}
```

## Exceptions are expressions too

```kotlin runnable
fun parse(text: String): Int =
    try {
        text.toInt()
    } catch (e: NumberFormatException) {
        -1
    }

fun main() {
    println(parse("42"))
    println(parse("forty-two"))
}
```
