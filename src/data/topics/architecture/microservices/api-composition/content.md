# API Composition

API composition combines data from multiple services to serve a client view. It can live in a gateway, a backend-for-frontend, or a dedicated query service depending on client needs and domain ownership.

```text
Client -> BFF -> Product service
			 -> Inventory service
			 -> Pricing service
```

Parallel fan-out may reduce latency, but total success and latency depend on downstream services. Set per-call deadlines, cap concurrency, define partial-result behavior, and avoid retry storms. A composer should not become the owner of business invariants or a hidden monolith.

**Trade-offs:** composition avoids shared databases and tailors responses, but increases runtime coupling. Materialized read models or events can fit high-volume queries better.

**Interview points:** discuss fan-out latency, partial failure, caching, ownership, and when composition should give way to a CQRS-style read model.

**Related:** [Service Boundaries](/content/tree/architecture/microservices/microservice-boundaries), [Rate Limiting](/content/tree/api-integration/resilience/rate-limiting), [Service Discovery](/content/tree/distributed-systems/service-discovery/service-registry).
