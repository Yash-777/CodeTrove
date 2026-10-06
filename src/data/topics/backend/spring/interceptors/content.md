# Spring MVC Interceptors

`HandlerInterceptor` hooks into Spring MVC around handler execution: `preHandle` runs before the controller, `postHandle` after it returns, and `afterCompletion` after request completion. Interceptors are useful for request-scoped observability or lightweight cross-cutting MVC behavior.

```java
@Override
public boolean preHandle(HttpServletRequest request,
						 HttpServletResponse response, Object handler) {
	request.setAttribute("startedAt", System.nanoTime());
	return true;
}
```

They run within the MVC handler pipeline and do not cover every servlet request path. Use servlet filters for lower-level request/response wrapping or security-chain integration; use Spring Security rather than a custom interceptor for authentication and authorization.

**Pitfalls:** putting business logic in interceptors, forgetting async dispatch behavior, and assuming they protect non-MVC endpoints.

**Interview points:** compare filters and interceptors, outline ordering, and identify the correct layer for authentication, metrics, and controller-specific policy.

**Related:** [Filters](/content/tree/backend/spring/filters), [Spring Security Filters](/content/tree/backend/spring-security/security-filters).
