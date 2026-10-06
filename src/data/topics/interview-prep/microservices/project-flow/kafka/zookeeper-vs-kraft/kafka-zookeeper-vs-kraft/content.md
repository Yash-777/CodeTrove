# Kafka — ZooKeeper vs KRaft

Modern Kafka deployments are moving away from ZooKeeper toward **KRaft (Kafka Raft metadata mode)** for Kafka metadata management.

<details>
<summary>Is ZooKeeper required for modern Kafka?</summary>

### Answer
No. Older Kafka architectures used ZooKeeper for cluster metadata and controller coordination. KRaft removes that external dependency by using Kafka's own Raft-based metadata quorum. When interviewing, describe the architecture used by the version you actually operate rather than presenting ZooKeeper as universally required.

> **Note — what the interviewer is expecting:**
> Current Kafka knowledge and awareness that architecture depends on Kafka version and deployment mode.

</details>

<details>
<summary>Why is KRaft useful operationally?</summary>

### Answer
It reduces the need to operate a separate coordination system for Kafka metadata and brings metadata consensus into Kafka itself. This simplifies the architecture, but it does not eliminate the need to understand quorum health, controller roles, upgrades, and recovery.

> **Note — what the interviewer is expecting:**
> Explain the operational motivation without claiming that KRaft removes distributed-systems complexity.

</details>

Reference: [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
