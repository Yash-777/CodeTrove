# Scala

Scala is a statically typed language for the JVM that combines object-oriented and functional programming. It supports concise expressions, powerful abstractions, and direct access to Java libraries. The official language site is [scala-lang.org](https://scala-lang.org/).

## Try it

The [Scala playground](#/build/compiler?lang=scala) sends Scala 3 worksheet code to Scastie and streams compiler messages and program output back into the editor.

```scala runnable
val fruits = List("apple", "banana", "avocado", "papaya")

val countsToFruits = fruits.groupBy(fruit => fruit.count(_ == 'a'))

for (count, fruits) <- countsToFruits do
  println(s"with 'a' × $count = $fruits")
```

## Important features

### Expression-oriented syntax

Most Scala constructs produce values. `if`, `match`, and a block can be assigned to a value, which makes control flow composable.

```scala runnable
val score = 82
val result = if score >= 50 then "pass" else "retry"
println(result)
```

Scala 3 uses significant indentation as an alternative to braces. Braces remain available when a project prefers them.

### Immutable values and type inference

Use `val` for a value that is not reassigned and `var` only when mutation is part of the design. The compiler usually infers the type from the initializer.

```scala runnable
val language = "Scala"
val year: Int = 2026
println(s"$language in $year")
```

### First-class functions

Functions can be stored, passed, and returned like other values. Collection methods such as `map`, `filter`, and `fold` make transformations explicit.

```scala runnable
val numbers = List(1, 2, 3, 4, 5, 6)
val evenSquares = numbers.filter(_ % 2 == 0).map(n => n * n)
println(evenSquares)
```

### Algebraic data with enums and match

Scala 3 `enum` declarations model a closed set of cases. Pattern matching makes the cases visible at the use site and can be checked for exhaustiveness.

```scala runnable
enum PaymentStatus:
  case Pending, Paid, Failed

def label(status: PaymentStatus): String = status match
  case PaymentStatus.Pending => "waiting"
  case PaymentStatus.Paid    => "complete"
  case PaymentStatus.Failed  => "needs attention"

println(label(PaymentStatus.Paid))
```

### Case classes and safe data modeling

A `case class` is a convenient immutable data carrier. The compiler supplies useful `equals`, `hashCode`, `toString`, and `copy` behavior.

```scala runnable
case class User(name: String, active: Boolean)

val original = User("Asha", active = true)
val suspended = original.copy(active = false)
println(suspended)
```

### Options instead of null checks

`Option[A]` represents either `Some(value)` or `None`. Operations such as `map`, `flatMap`, `getOrElse`, and pattern matching keep absence explicit.

```scala runnable
def parsePort(text: String): Option[Int] =
  text.toIntOption.filter(port => port > 0 && port <= 65535)

println(parsePort("8080").getOrElse(80))
println(parsePort("not-a-port").getOrElse(80))
```

### For-comprehensions

A `for` expression combines values from types such as `Option`, collections, and `Future`. It is syntax for composing `map`, `flatMap`, and `withFilter` operations.

```scala runnable
val first = Some(10)
val second = Some(5)
val total = for
  a <- first
  b <- second
  if b > 0
 yield a + b

println(total)
```

### JVM and Java interoperability

Scala code compiles to JVM bytecode and can call Java classes. This makes it practical to introduce Scala into an existing Java build, although teams should choose collection conversions and nullability boundaries deliberately.

## Key takeaways

- Scala combines object-oriented and functional programming on the JVM.
- Prefer immutable `val` values, expressions, and small pure functions.
- Use `case class`, `enum`, `match`, and `Option` to model domain states explicitly.
- Collection operations and for-comprehensions make transformations readable.
- The compiler checks types before execution; the playground sends code to Scastie, so an internet connection is required.
