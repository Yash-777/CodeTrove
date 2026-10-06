# Servlet Filters in Spring Applications

A servlet `Filter` wraps the HTTP request/response before and after the servlet pipeline. Filters can inspect headers, add correlation IDs, wrap request bodies, or apply cross-cutting behavior before Spring MVC selects a handler.

Order matters: encoding, CORS, security, and application filters must run in an intentional sequence. Avoid consuming a request body without a reusable wrapper, and avoid logging secrets or full payloads by default.

Spring Security is implemented through a servlet filter chain, but application filters should not replace its authentication and authorization mechanisms. An MVC `HandlerInterceptor` runs later and has access to handler metadata.

**Interview points:** compare filters to interceptors, explain registration and ordering, and select the correct layer based on whether behavior must apply before MVC routing.

**Related:** [Interceptors](/content/tree/backend/spring/interceptors), [Spring Security Filters](/content/tree/backend/spring-security/security-filters).
