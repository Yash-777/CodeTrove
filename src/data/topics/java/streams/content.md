## Overview

Streams let you process collections declaratively instead of writing
manual for-loops. A stream doesn't store data - it describes a pipeline of
operations (`filter -> map -> collect`) that runs when a terminal operation
(like `collect()` or `forEach()`) is called.

Example:
```java
  List<String> names = List.of("Ann", "Bob", "Cy", "Dee");
  List<String> longNames = names.stream()
      .filter(n -> n.length() > 2)
      .map(String::toUpperCase)
      .collect(Collectors.toList());
  // -> ["ANN", "BOB", "DEE"]
```
