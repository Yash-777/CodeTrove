# Method Security with `@PreAuthorize`

`@PreAuthorize` evaluates an authorization expression before a method proceeds. Enable method security explicitly and use it for rules that belong at a service boundary, not only in controller routing.

```java
@PreAuthorize("hasAuthority('invoice:read')")
Invoice findInvoice(UUID id) { ... }
```

Expressions can reference the principal and method arguments. Keep complex domain authorization in a policy/service method rather than embedding opaque logic. Proxy-based method security has a self-invocation limitation: calls through `this` generally bypass the proxy.

**Pitfalls:** forgetting to enable method security, invoking an annotated method internally, and writing tests that bypass the proxy. Test allowed and denied cases with Spring Security test support.

**Interview points:** compare URL and method security, explain expression evaluation and proxy boundaries, and discuss object ownership checks against insecure direct object references.

**Related:** [Authorization](/content/tree/backend/spring-security/authorization), [AOP](/content/tree/backend/spring/aop).
