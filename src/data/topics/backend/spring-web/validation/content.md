# Spring Request Validation

Spring MVC integrates Jakarta Bean Validation with request binding. Put constraints on request DTOs and use `@Valid` or `@Validated` at the controller boundary so malformed input is rejected before application logic runs.

```java
record CreateUser(@NotBlank @Email String email,
				  @Size(min = 12, max = 128) String password) {}
```

Return stable field-error information without echoing sensitive values. Keep domain invariants enforced in the domain/service layer as well, because jobs, messaging, and internal calls may bypass MVC validation.

**Pitfalls:** validating only controller requests, returning framework exception details directly, and expressing business rules as syntax-only constraints.

**Interview points:** distinguish request validation from domain validation and test invalid, boundary, and valid inputs through the HTTP layer.

**Related:** [REST Controllers](/content/tree/backend/spring-web/rest-controllers), [Global Exception Handling](/content/tree/backend/spring-web/global-exception-handling).
