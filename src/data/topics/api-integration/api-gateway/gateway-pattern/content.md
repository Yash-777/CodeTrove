# API Gateway Pattern

An API gateway is a managed entry point between external clients and backend services. It can terminate TLS, authenticate callers, apply coarse access policy, route requests, enforce request limits, and attach correlation metadata. A gateway may also aggregate responses for a client, though this can increase coupling and latency.

```text
Client -> Gateway -> identity / edge policy -> route -> owning service
```

Keep business invariants and resource-level authorization in the service that owns the domain. A gateway should not become a shared database client or a central home for long-running business workflows. Keep it highly available and avoid unnecessary synchronous dependencies in its request path.

**Trade-offs:** gateways simplify clients and centralize edge controls, but can become a bottleneck, availability dependency, or deployment bottleneck if overloaded with business logic.

**Pitfalls:** allowing direct gateway bypass, trusting client-provided identity headers, retrying unsafe requests, and exposing internal service details in public responses.

**Interview points:** explain which responsibilities belong at the edge versus in services, gateway failure modes, and how to scale and observe the entry point.

**Related:** [Routing](/content/tree/api-integration/api-gateway/routing), [Authentication at Gateway](/content/tree/api-integration/api-gateway/authentication-at-gateway), [Gateway Rate Limiting](/content/tree/api-integration/api-gateway/gateway-rate-limiting).
