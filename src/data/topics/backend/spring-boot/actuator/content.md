# Spring Boot Actuator

Actuator exposes operational endpoints for health, metrics, environment, and application diagnostics. It integrates with Micrometer and health contributors so operations teams can monitor service state and dependencies.

Expose only the endpoints required by the platform. Keep management endpoints on a protected network or separately secured port where appropriate, and apply authentication and authorization. Health checks should distinguish liveness from readiness and avoid expensive dependency checks that create cascading failures.

**Pitfalls:** exposing `env`, `configprops`, or heap-dump endpoints publicly; returning sensitive details; and making readiness depend on every optional downstream service.

**Interview points:** explain health groups, readiness versus liveness, metric scraping, and how endpoint exposure is secured and minimized.

**Related:** [Spring Boot Profiles](/content/tree/backend/spring-boot/profiles), [Service Discovery](/content/tree/distributed-systems/service-discovery/service-registry), [Observability](/content/tree/distributed-systems/observability/metrics).
