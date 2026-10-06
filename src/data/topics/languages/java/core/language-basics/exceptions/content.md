# Java Exception Handling

Exceptions represent failures outside the normal result flow. Checked exceptions must be caught or declared; unchecked exceptions often represent programming errors or failures callers cannot reasonably recover from at the current layer.

```java
try (var reader = Files.newBufferedReader(path)) {
	return reader.readLine();
} catch (IOException e) {
	throw new ConfigReadException("Unable to read configuration", e);
}
```

Use try-with-resources for `AutoCloseable` values. Catch only when you can recover, add useful context, or map the error at a boundary. Preserve the original cause and avoid exposing internal exception details to API clients.

**Pitfalls:** broad catches, swallowed failures, lost causes, resource leaks, and using exceptions for ordinary branching.

**Interview points:** compare checked and unchecked exceptions; explain propagation, suppressed exceptions, and the difference between recovery and translating an error.

**Related:** [Global Exception Handling](/content/tree/backend/spring-web/global-exception-handling), [Transactions](/content/tree/backend/spring-data/transactions).
