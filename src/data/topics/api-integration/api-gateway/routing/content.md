# API Gateway Routing

Gateway routing maps an incoming request to a backend destination using configured attributes such as host, path, HTTP method, or trusted headers. The destination may be a stable service name resolved through service discovery rather than a fixed instance address.

```text
GET /v1/orders/42 -> match route -> resolve order-service
				  -> apply timeout / policy -> forward request
```

Define route precedence explicitly when patterns overlap. Preserve or deliberately rewrite paths and headers, validate forwarded host/protocol information, and avoid forwarding internal headers supplied by clients. Use weighted routes only with health checks, observability, and a rollback plan for canary releases.

Routing does not itself make retries safe. Set bounded timeouts, and retry only transient failures when the operation is idempotent or otherwise protected. Report stable public errors rather than leaking upstream addresses or stack details.

**Pitfalls:** ambiguous match rules, stale service destinations, unbounded retries, and routing that bypasses authentication or request-size controls.

**Interview points:** describe route matching, discovery/load balancing, path rewriting, canary rollout, timeout behavior, and how route changes are tested before production.

**Related:** [API Gateway Pattern](/content/tree/api-integration/api-gateway/gateway-pattern), [Authentication at Gateway](/content/tree/api-integration/api-gateway/authentication-at-gateway), [Service Discovery](/content/tree/distributed-systems/service-discovery/service-registry).
