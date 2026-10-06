# Spring REST Controllers

`@RestController` combines controller registration with response-body semantics. Mapping annotations bind HTTP methods and paths; Spring MVC resolves path variables, query parameters, headers, and request bodies.

```java
@RestController
@RequestMapping("/orders")
class OrderController {
	@PostMapping
	ResponseEntity<OrderView> create(@Valid @RequestBody CreateOrder request) {
		var order = service.create(request);
		return ResponseEntity.created(URI.create("/orders/" + order.id()))
			.body(OrderView.from(order));
	}
}
```

Keep controllers thin: map HTTP input to application commands, invoke the use case, and return response DTOs. Avoid exposing persistence entities directly as public API contracts.

**Pitfalls:** ambiguous routes, unbounded list responses, internal model leakage, and missing authorization at the service boundary.

**Interview points:** explain HTTP status/resource semantics, validation, pagination, and transport DTOs versus domain models.

**Related:** [DispatcherServlet](/content/tree/backend/spring-web/dispatcher-servlet), [Validation](/content/tree/backend/spring-web/validation), [Global Exception Handling](/content/tree/backend/spring-web/global-exception-handling).
