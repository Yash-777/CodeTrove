# Eureka vs ZooKeeper vs Consul

Compare these technologies by the problem they solve, consistency model, operational model, ecosystem, and the needs of your deployment.

| Area | Eureka | ZooKeeper | Consul |
|---|---|---|---|
| Typical use | Service discovery in Spring Cloud systems | Coordination/configuration primitives and legacy Kafka metadata use | Service discovery, health checks and configuration/coordination |
| Consistency emphasis | Availability-oriented registry behavior | Strong coordination/consistency primitives | Strong service/networking features with health checks |
| Java/Spring fit | Very familiar in Spring Cloud Netflix deployments | General distributed coordination | Strong cloud/service-networking integrations |
| Operational question | Registry availability and stale entries | Quorum and coordination health | Agents, servers, health checks and ACLs |

<details>
<summary>Why might a team choose Eureka instead of ZooKeeper or Consul?</summary>

### Answer
Choose based on the platform and operational requirements. A Spring Cloud application may already have Eureka integration and conventions. Consul can be attractive when broader service networking and health-check capabilities are required. ZooKeeper is primarily a coordination system and should not be selected merely because it can store service information.

> **Note — what the interviewer is expecting:**
> Requirements-driven comparison, not memorized product rankings.

</details>

> **Interview caution:** Kafka itself has moved toward KRaft for metadata management; do not describe ZooKeeper as mandatory for modern Kafka deployments.
