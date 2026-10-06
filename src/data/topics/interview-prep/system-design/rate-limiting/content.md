# Rate Limiting

Rate limiting bounds request volume over time for a defined key, such as user, API key, tenant, IP, or route. It protects capacity, controls noisy neighbors, limits abuse, and can enforce quotas. It complements authentication and overload protection rather than replacing them.

## Algorithms and placement

- **Fixed window:** a simple counter per interval; it permits bursts at window boundaries.
- **Sliding window:** smooths boundary behavior, with more state or computation.
- **Token bucket:** tokens refill at a configured rate; a bounded bucket permits controlled bursts.
- **Leaky bucket:** releases work at a steadier rate and can shape queued traffic.

Enforce coarse limits at the gateway and domain quotas where identity and business context are known. In a multi-instance deployment, shared state (often Redis with atomic operations) or partitioned keys are needed for a global limit. An in-memory limiter is only per instance.

## HTTP behavior and operations

Return `429 Too Many Requests` for caller-specific quota exhaustion, optionally with `Retry-After` and documented rate-limit headers. Choose fail-open or fail-closed behavior if the limiter store is unavailable based on abuse risk and availability goals. Bound key cardinality and monitor allowed/rejected counts, latency, hot keys, and store errors.

**Pitfalls:** trusting spoofable IP headers, retrying immediately and worsening overload, inconsistent limits across replicas, and applying one quota to unrelated tenants.

**Interview points:** clarify key and scope, estimate state and throughput, explain burst semantics, distributed coordination, failure mode, and client backoff.

**Related:** [API Gateway & Idempotency](/content/tree/interview-prep/microservices/project-flow/api-gateway-idempotency/api-gateway-idempotency), [Service Discovery](/content/tree/distributed-systems/service-discovery/service-registry), [Idempotency](/content/tree/api-integration/resilience/idempotency).
