# Service Registry and Discovery

A service registry stores network locations and metadata for running instances. Clients or load balancers resolve logical service names so deployments can add or replace instances without hard-coded host addresses.

```text
instance starts -> register + heartbeat -> registry
caller -> resolve service -> choose instance -> request
```

Discovery can be client-side (the caller chooses an instance) or server-side (a proxy/load balancer resolves it). Registrations and health signals can be stale, so callers still need connection timeouts, bounded retries, and resilience to instance replacement.

**Trade-offs:** registries support elastic deployment but add control-plane infrastructure and eventual consistency. Cloud DNS or a service mesh may provide discovery without an application-level registry client.

**Interview points:** distinguish control plane from request path, explain stale registrations, and discuss health checks, caching, and failure behavior.

**Related:** [Eureka Server](/content/tree/distributed-systems/service-discovery/eureka-server), [Eureka Client](/content/tree/distributed-systems/service-discovery/eureka-client), [Load Balancing](/content/tree/api-integration/load-balancing/load-balancer-basics).
