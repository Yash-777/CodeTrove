# Eureka Server Mechanics & Eureka Client Lifecycle

Eureka provides a registry so service instances can discover one another without hard-coding changing host/port locations.

## Lifecycle screen

```text
Service starts
   |
   v
Eureka Client initializes
   |
Register instance + metadata
   |
Heartbeats / renewals  -----> Eureka Server
   |                              |
   |<----- registry responses -----+
   |
Discover service instances
   |
Load-balance / call instance
   |
Shutdown -> deregister (best effort)
```

<details>
<summary>How does the Eureka Server and Eureka Client work together?</summary>

### Answer
A client registers its instance metadata with the Eureka server and periodically renews its lease. Other clients query the registry and obtain instance information for routing. Production designs must account for stale registrations, network partitions, server availability, client-side caching, health status, and graceful shutdown.

> **Note — what the interviewer is expecting:**
> Explain the lifecycle and failure assumptions rather than saying only “Eureka finds services.”

</details>

<details>
<summary>What happens when a service instance dies without deregistering?</summary>

### Answer
The registry may temporarily retain the instance until renewal information becomes stale and the server removes it according to its eviction behavior. Clients may also have cached registry data. This is why connection timeouts, health checks, retries, circuit breakers, and careful failure handling remain necessary.

> **Note — what the interviewer is expecting:**
> Service discovery is not health detection with perfect instantaneous accuracy. Discuss eventual visibility and downstream protection.

</details>

## Cross references

<a href="/content/tree/distributed-systems/service-discovery/eureka-server" target="_blank" rel="noopener noreferrer">Open Eureka Server ↗</a>
<a href="/content/tree/distributed-systems/service-discovery/eureka-client" target="_blank" rel="noopener noreferrer">Open Eureka Client ↗</a>
