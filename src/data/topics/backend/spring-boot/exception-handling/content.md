# Spring Boot Error Handling

Spring Boot's web auto-configuration supplies a default error endpoint and error attributes for failures that reach the servlet container. For a public API, use an explicit response contract rather than exposing framework defaults as the long-term contract.

Spring MVC's `@RestControllerAdvice` and `@ExceptionHandler` handle known domain and validation errors. Spring Boot 3 / Spring Framework 6 can use `ProblemDetail` for RFC 9457-style responses. Keep the controller advice focused on application errors and let Boot's fallback handle unexpected failures.

Never expose stack traces, SQL details, credentials, or internal class names in production responses. Configure error-detail exposure deliberately, log unexpected errors with a request/trace identifier, and avoid noisy error logs for expected client mistakes.

**Interview points:** distinguish Boot's fallback error handling from application-level exception mapping, explain stable HTTP semantics, and describe how to remain diagnosable without leaking internals.

**Related:** [Global Exception Handling in Spring MVC](/content/tree/backend/spring-web/global-exception-handling), [Spring Boot Actuator](/content/tree/backend/spring-boot/actuator).