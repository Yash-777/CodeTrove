# Global Exception Handling in Spring MVC

`@ControllerAdvice` and `@ExceptionHandler` centralize mapping from application failures to stable HTTP responses. They keep controllers focused, but should not hide unexpected failures or disclose internal details.

```java
@RestControllerAdvice
class ApiErrors {
	@ExceptionHandler(OrderNotFoundException.class)
	ResponseEntity<ProblemDetail> notFound(OrderNotFoundException error) {
		var problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		problem.setTitle("Order not found");
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
	}
}
```

Map validation and known domain errors deliberately. Log unexpected errors once at the appropriate boundary and avoid returning stack traces, SQL details, or secrets. Ensure malformed request bodies also follow the public error contract.

**Interview points:** explain exception-to-status mapping, stable schemas, validation errors, observability, and why catch-all handling that returns success is unsafe.

**Related:** [Java Exceptions](/content/tree/languages/java/core/language-basics/exceptions), [Spring Boot Exception Handling](/content/tree/backend/spring-boot/exception-handling).
