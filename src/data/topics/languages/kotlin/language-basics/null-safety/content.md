# Null Safety

In Kotlin, regular types cannot hold `null`. A type that can be `null` is written with a `?`.

## Nullable vs non-nullable

```kotlin runnable
fun main() {
    var name: String = "Kotlin"
    // name = null            // compile error: String cannot be null

    var nickname: String? = "KT"
    nickname = null           // OK: String? allows null
    println(name)
    println(nickname)
}
```

## Safe call `?.` and Elvis `?:`

`?.` returns `null` instead of throwing; `?:` supplies a default.

```kotlin runnable
fun main() {
    val a: String? = "hello"
    val b: String? = null

    println(a?.length)          // 5
    println(b?.length)          // null
    println(b?.length ?: 0)     // 0
    println(a?.uppercase() ?: "empty")
}
```

## Smart casts after a null check

```kotlin runnable
fun describe(text: String?): String {
    if (text == null) return "no text"
    return "text has ${text.length} characters"   // text is String here
}

fun main() {
    println(describe("Kotlin"))
    println(describe(null))
}
```

## `let` for null-safe blocks and `!!`

`?.let { }` runs only when the value is not null. `!!` asserts non-null and throws if it is.

```kotlin runnable
fun main() {
    val email: String? = "dev@example.com"
    email?.let { println("Sending mail to $it") }

    val missing: String? = null
    missing?.let { println("never printed") }

    println(missing!!.length)   // NullPointerException
}
```
