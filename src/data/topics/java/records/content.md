
## Overview

A record auto-generates the `constructor`, `getters`, `equals()`, `hashCode()`,
and `toString()` for you.

Example:
```java
  public record Point(int x, int y) {}
  // usage:
  Point p = new Point(3, 4);
  System.out.println(p.x()); // 3
```
