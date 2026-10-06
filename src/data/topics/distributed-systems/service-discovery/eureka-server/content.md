# Eureka Server

Eureka Server is a service registry in the Spring Cloud Netflix ecosystem. Instances register metadata and periodically renew leases; clients fetch a registry view and resolve logical service names.

Run resilient server instances and secure the registry. Clients cache registry data, so a brief registry outage need not immediately stop all traffic, but stale instances may remain in client views.

**Failure behavior:** partitions can delay renewals and deregistration. Eureka self-preservation may retain instances when renewals fall below an expected threshold, reducing false eviction during a partition but allowing stale entries. Callers must still handle connection failures.

**Pitfalls:** treating registration as proof of readiness, exposing registry endpoints publicly, and assuming discovery alone provides robust load balancing or retries.

**Interview points:** explain registration, lease renewal, replication, client caching, and stale-instance handling.

**Related:** [Eureka Client](/content/tree/distributed-systems/service-discovery/eureka-client), [Service Registry](/content/tree/distributed-systems/service-discovery/service-registry), [Eureka Mechanics](/content/tree/interview-prep/microservices/project-flow/eureka-service-discovery/mechanics-client-lifecycle/eureka-mechanics-client-lifecycle).
