# Java Optional<T>

## Overview

`Optional<T>` is a container object that may or may not hold a non-null value. It forces you to explicitly handle the "value might be missing" case instead of accidentally hitting a `NullPointerException`.

## The Problem It Solves

Before Java 8, dealing with potentially null values was error-prone:

```java
String name = getName();  // Could be null
String result = name.toUpperCase();  // Crashes if name is null!
```

## The Solution: Optional

`Optional` makes the possibility of absence explicit:

```java
Optional<String> maybeName = Optional.ofNullable(getName());
String result = maybeName
  .map(String::toUpperCase)
  .orElse("UNKNOWN");
```

## Creating Optionals

```java
// Empty Optional
Optional<String> empty = Optional.empty();

// Optional with a value
Optional<String> withValue = Optional.of("Hello");

// From a potentially null value
Optional<String> fromNull = Optional.ofNullable(getName());
```

## Common Operations

### Checking if present

```java
if (maybeName.isPresent()) {
  System.out.println(maybeName.get());
}

// Modern way (Java 10+)
maybeName.ifPresent(System.out::println);
```

### Getting the value

```java
// Returns the value or throws NoSuchElementException
String name = maybeName.get();

// Returns the value or a default
String name = maybeName.orElse("Unknown");

// Returns the value or throws a custom exception
String name = maybeName.orElseThrow(
  () -> new IllegalArgumentException("Name required")
);
```

### Transforming values

```java
// Apply a function if value is present
Optional<Integer> length = maybeName
  .map(String::length);

// Chain multiple Optionals
Optional<String> result = maybeName
  .flatMap(this::findRelated);
```

### Filtering

```java
// Keep the value only if it matches a condition
Optional<String> longName = maybeName
  .filter(name -> name.length() > 5);
```

## Common Patterns

### Null-safe chaining

```java
Optional<String> email = getUser()
  .map(User::getEmail)
  .filter(e -> e.contains("@"));
```

### Default values

```java
String domain = getEmail()
  .map(email -> email.split("@")[1])
  .orElse("example.com");
```

### Logging missing values

```java
getUser()
  .ifPresentOrElse(
    user -> logger.info("Found: " + user),
    () -> logger.warn("User not found")
  );
```

## Important Notes

⚠️ **Don't use Optional for:**
- Collections (use empty collections instead)
- Method parameters (use overloading or Builder pattern)
- Serialization (Optional is not serializable)

✅ **Use Optional for:**
- Return values that might be absent
- Method chaining and functional operations
- Making null-handling explicit in your API