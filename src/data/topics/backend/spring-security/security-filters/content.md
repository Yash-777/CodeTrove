# Spring Security Filter Chain

Spring Security integrates with servlet requests through a `DelegatingFilterProxy` and a `FilterChainProxy` containing one or more `SecurityFilterChain` instances. Matchers select a chain; its filters establish the security context, authenticate credentials, translate failures, and authorize requests.

Order matters: authentication must establish a principal before authorization checks it. Prefer the Spring Security DSL and standard filters over custom filters whose order and matching behavior are unclear.

**Pitfalls:** broad matchers, a second chain unexpectedly capturing requests, disabling CSRF without considering the client model, and logging credentials or tokens.

**Interview points:** trace a request through the chain, distinguish servlet filters from MVC interceptors, and explain how multiple chains are selected.

**Related:** [Authentication](/content/tree/backend/spring-security/authentication), [Authorization](/content/tree/backend/spring-security/authorization), [Servlet Filters](/content/tree/backend/spring/filters).
