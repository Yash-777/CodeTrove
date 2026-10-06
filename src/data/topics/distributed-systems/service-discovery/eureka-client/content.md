# Eureka Client

A Eureka client registers an instance, renews its lease, and fetches registry information. With Spring Cloud LoadBalancer, callers can use a logical service ID and choose an instance from the client's registry view.

```text
orders -> resolve PAYMENT-SERVICE -> select instance -> HTTP call
```

Discovery is not resilience. Configure connect/read timeouts, bounded retries for safe operations, circuit breaking where useful, and observability for resolution and call failures. A cached registry can contain an instance that has already failed.

**Pitfalls:** treating registration as readiness, retrying non-idempotent requests without a policy, and allowing unbounded attempts per client.

**Interview points:** distinguish naming from load balancing, explain client-side caching, and describe behavior when the registry or chosen instance is unavailable.

**Related:** [Eureka Server](/content/tree/distributed-systems/service-discovery/eureka-server), [Service Registry](/content/tree/distributed-systems/service-discovery/service-registry), [Rate Limiting](/content/tree/api-integration/resilience/rate-limiting).
