# Kafka Interview Questions and Answers

This is the single, maintained home for CodeTrove's Kafka interview questions. It brings together the earlier topic/partition/broker, producer/consumer/offset, ZooKeeper-versus-KRaft, and sync-versus-async questions, then adds practical questions on reliability, operations, security, and system design. The old pages now point here so their answers do not drift apart.

Use these answers as a starting point, not scripts to memorize. In a strong interview answer, name the guarantee, state its boundary, describe the failure case, and explain the trade-off you would choose for the workload.

## Foundations

<details>
<summary>What is Apache Kafka, and what does event streaming mean?</summary>

### Answer
Kafka is a distributed event-streaming platform. It lets producers publish records to topics, stores those records durably according to topic policy, and lets consumers read and process them in real time or later. Event streaming describes that fuller lifecycle—capturing events, retaining them, processing them, and routing results—not only the act of sending a message. Kafka's [official introduction](https://kafka.apache.org/44/getting-started/introduction/#what-is-event-streaming) explains this model.

For example, an order service publishes `OrderCreated`. A payment service, inventory service, and analytics pipeline can each consume that event independently. Kafka separates the producer from the consumer's uptime and pace, but it also introduces a cluster, schema, retries, monitoring, and data-retention responsibilities.

> **Interviewer is listening for:** Kafka is a durable, replayable log-based event platform, not a magic replacement for every synchronous call or database.

</details>

<details>
<summary>What are an event, producer, consumer, topic, broker, partition, and offset?</summary>

### Answer
An **event** (also called a record) represents something that happened. It commonly contains a key, value, timestamp, and optional headers. A **producer** writes records; a **consumer** reads and processes them. A **topic** names a stream, such as `orders`. A **broker** is a Kafka server that stores and serves topic partitions. A **partition** is an ordered log within the topic and the unit Kafka distributes for storage and parallelism. An **offset** identifies a position in one partition; it is not a global ID across the topic.

In a three-partition `orders` topic, offset 42 in partition 0 and offset 42 in partition 2 are different positions. The record key helps choose a partition. The key/value pair is application data; the offset is Kafka's log position.

</details>

<details>
<summary>How is Kafka different from a traditional work queue and publish-subscribe broker?</summary>

### Answer
A work queue usually hands each message to one worker and removes or acknowledges it when processed. Traditional publish-subscribe systems often fan a message out to subscribers but do not necessarily retain a replayable history. Kafka combines a partitioned log with consumer groups: members of one group share the work, while separate groups can each read the retained stream independently. A consumer can also move its offset backward and replay records that are still retained.

That replay model is powerful for rebuilding projections or onboarding a new consumer, but it means retention, duplicate-safe processing, and offset management matter. Select a queue or broker based on routing, per-message acknowledgement, latency, ordering, replay, and operational needs—not on a fixed throughput number copied from an old comparison.

</details>

<details>
<summary>What is the relationship between a Kafka topic, partition, and broker?</summary>

### Answer
A topic is a logical stream. Kafka splits it into partitions, and each partition is stored on one or more brokers when replication is configured. A partition is an append-only log with its own offsets. Its leader replica serves normal reads and writes; follower replicas copy the leader's log. The partition count controls how many independent logs can be assigned in parallel.

For example, an `orders` topic with three partitions can distribute leaders across three brokers. Replicas may be placed on different brokers so one broker failure does not automatically remove every copy. Replica placement, rack awareness, and cluster capacity still need deliberate configuration.

</details>

<details>
<summary>How does partition count affect consumer scalability?</summary>

### Answer
More partitions can allow more consumers in the same group to process records concurrently, because each partition can be assigned to at most one active member of that group at a time. The number of useful active consumers for one topic subscription is therefore bounded by the number of assigned partitions. If a group has three partitions and ten consumers, some consumers will be idle for that topic.

Partitions also add metadata, file handles, replication traffic, leader-election work, and recovery overhead. Increasing a topic's partition count later can change how a key maps to a partition under common partitioners, so records for that key may be split across old and new partitions. Estimate partitions using expected throughput and consumer parallelism, then load-test and monitor rather than maximizing the number blindly.

> **Moved question:** This consolidates the earlier question, “How does partition count affect consumer scalability?”

</details>

<details>
<summary>What ordering does Kafka guarantee?</summary>

### Answer
Kafka preserves order within a single partition. It does not establish a total order across every partition in a topic. If all events for one order must be observed in sequence, use a stable key such as `orderId` so the default keyed partitioner sends those records to the same partition. Keep one active consumer in the group on that partition while processing the sequence, and configure retries so a later record is not allowed to overtake a failed earlier record when order matters.

Ordering is not the same as business causality. Multiple producers, retries, asynchronous processing, and changes to partitioning can affect the order your application observes. State precisely which key or aggregate needs ordering and design around that boundary.

</details>

<details>
<summary>Are Kafka records deleted after a consumer reads them?</summary>

### Answer
Usually, no. Consumption advances a group's offset; it does not remove the record from the topic. Retention by time or size decides when ordinary log segments can be removed. Log compaction instead retains the latest value for each key over time, making a topic useful as a changelog or latest-state stream. Retention and compaction serve different purposes, and a compacted topic can still contain multiple records for a key until compaction runs.

Replay is possible only while the needed records remain available. Set retention based on recovery and replay requirements, storage cost, and data-retention policy. Do not treat Kafka retention as a backup or assume it preserves data forever.

</details>

## Producers, groups, and offsets

<details>
<summary>How do records get assigned to partitions?</summary>

### Answer
A producer can name a partition explicitly or use a partitioner. With the default keyed behavior, a record with a key is routed using a hash of that key, so matching keys normally reach the same partition while the topic's partitioning configuration remains compatible. Without a key, the producer uses its default batching and partitioning strategy to distribute records. A custom partitioner can implement a domain-specific policy.

Using a key such as `customerId` can preserve per-customer order, but a single extremely popular customer can create a hot partition. A key is therefore both a data-model choice and a load-distribution choice. The [Kafka design documentation](https://kafka.apache.org/documentation/#design) describes producer partitioning and batching.

</details>

<details>
<summary>What is a consumer group, and how do same-group and different-group consumers behave?</summary>

### Answer
Consumers with the same group ID cooperate. Kafka assigns each subscribed partition to at most one active member of that group at a time, so the group distributes work. Consumers in different groups read independently, so each group can receive the full retained stream. For example, `fulfillment` and `analytics` can both read every `OrderCreated` event, while three `fulfillment` consumers share the topic's partitions among themselves.

The earlier wiki described this same distinction. A consumer group is not a broadcast mechanism within the group; broadcast-like fan-out is achieved by using separate group IDs. One group can subscribe to several topics, and the assignment is computed across its subscriptions.

</details>

<details>
<summary>What happens when a consumer joins, leaves, or stops responding?</summary>

### Answer
The group coordinator detects a membership or subscription change and the group reassigns partitions. A join, graceful leave, heartbeat/session timeout, subscription change, partition-count change, or deployment can trigger a rebalance. During some rebalance protocols, consumption pauses while assignments are coordinated; incremental or cooperative assignment can reduce how much work must stop, but it does not remove the need to handle rebalances safely.

Close consumers gracefully, use compatible group settings, keep processing bounded, and avoid doing long blocking work on the poll loop. Track rebalance frequency and duration. During partition revocation, finish or safely abandon in-flight work before committing progress so a new owner does not race with the old one.

</details>

<details>
<summary>What is a Kafka consumer offset?</summary>

### Answer
An offset is a record's position within one partition. A consumer group stores committed offsets so that its members can resume from an agreed position after a restart or rebalance. The committed offset is a progress checkpoint; it is not an identifier for a business transaction and does not prove that an external side effect has completed exactly once.

If the consumer has processed offset 20 successfully but has only committed offset 20 as the next position to read, the exact stored value and API convention matter. Explain the concept as “the next position from which the group should resume,” and verify the client API's commit semantics rather than assuming the number labels the last completed record.

</details>

<details>
<summary>When should a consumer commit offsets automatically or manually?</summary>

### Answer
Automatic commits are simple, but a commit can get ahead of business processing if records are still being handled when the offset is committed. If the process then crashes, those records may be skipped on restart. With manual commits, commit only after the work covered by the checkpoint has succeeded. If the process crashes after the side effect but before the commit, Kafka may deliver the record again, so the side effect should be idempotent or deduplicated.

For concurrent processing, do not commit a later offset past an earlier unfinished record in the same partition. A careful design tracks completed work per partition and advances the committed position only through a contiguous completed prefix.

</details>

<details>
<summary>How can duplicate processing happen even when offsets are committed?</summary>

### Answer
Suppose a consumer writes an order update to a database and then crashes before committing its Kafka offset. After restart, Kafka delivers the same event again. The database update can happen twice unless it is idempotent or protected by a transaction/deduplication key. Committing the offset before the database write creates the opposite risk: a crash after the commit but before the write can lose the business effect.

This is why offset commits alone do not create exactly-once behavior across arbitrary systems. Use an idempotency key, a unique constraint, an inbox/outbox pattern, or a transaction design that matches the sink. The answer should name both crash windows, not just say “enable auto commit.”

> **Moved question:** This carries forward the earlier duplicate-processing question from the producer/consumer/offset page.

</details>

<details>
<summary>What is consumer lag, and how would you investigate a growing lag?</summary>

### Answer
Consumer lag describes how far a group's processing position trails the end of the partition log. It can be expressed as a record difference, a time delay, or both; tools calculate it using committed offsets and the log end or high watermark. Check the unit before comparing alerts across dashboards.

First identify affected topics, partitions, and group members. Then compare incoming rate with processing rate, check for a hot partition, slow downstream calls, repeated retries, rebalance churn, GC or CPU pressure, network/storage saturation, and insufficient active consumers. Add consumers only when partitions and downstream capacity allow useful parallelism. Lag is an effect to explain, not the root cause by itself.

</details>

<details>
<summary>How should a consumer handle retries and a poison record?</summary>

### Answer
A transient failure may be retried with bounded backoff. A permanently invalid or repeatedly failing record should not block a partition forever unless strict ordering requires that stop. A dead-letter topic can preserve the original record plus error context for inspection and repair. If later events depend on the failed event, moving it aside and continuing may violate business order; define that policy explicitly.

Avoid unbounded immediate retries, which can create a hot loop. Make the retry limit, backoff, ownership, alerting, replay procedure, and retention of failed records explicit. A dead-letter topic is a recovery mechanism, not a place to silently discard errors.

</details>

## Reliability and delivery guarantees

<details>
<summary>What are leader, follower, replica, and in-sync replica (ISR)?</summary>

### Answer
For each partition, one replica is the leader and handles normal client reads and writes. Other replicas fetch the leader's log as followers. The **replication factor** is the number of configured copies of that partition. The **in-sync replica set (ISR)** is the set of replicas considered sufficiently caught up under the cluster's replication rules. If the leader fails, Kafka can elect an eligible replica as the new leader.

Replication provides additional copies and can support failover; it is not equivalent to a backup. Accidental deletes, application-level corruption, bad retention settings, or a failure affecting every replica can still require restoration or replay from another source.

</details>

<details>
<summary>What do replication factor, acks=all, and min.insync.replicas mean together?</summary>

### Answer
A replication factor of 3 configures three copies of each partition. `acks=all` asks the leader to wait for the current in-sync replicas before acknowledging a produce request. `min.insync.replicas` can set the minimum number of ISR members required for a write when using `acks=all`. If the ISR falls below that threshold, the write fails rather than succeeding with fewer in-sync copies than the chosen policy allows.

For example, RF=3 with `min.insync.replicas=2` can continue accepting writes with two in-sync replicas, but may reject writes when only one remains. This trades write availability during failures for a stronger durability threshold. Exact guarantees depend on broker configuration, leader-election policy, storage, and failure scope; read the current [producer and reliability design](https://kafka.apache.org/documentation/#design) for the deployment version.

</details>

<details>
<summary>Can Kafka guarantee that no record is ever lost?</summary>

### Answer
No distributed system can honestly promise that without stating assumptions. `acks=0` can lose a record without the producer learning that it was not stored. `acks=1` can acknowledge the leader's local write before followers replicate it. `acks=all` with an appropriate minimum ISR gives a stronger acknowledgement condition, but may reject writes when enough replicas are unavailable. Data loss can still result from correlated failures, unsafe leader election, configuration mistakes, operator actions, storage faults, or bugs.

In an interview, describe the failure model and the desired trade-off. Durability is a whole-path property involving the producer, broker replication, consumer checkpoint, and external sink—not just a topic setting.

</details>

<details>
<summary>What is an idempotent producer, and does it make the business operation exactly once?</summary>

### Answer
An idempotent producer uses producer identity and sequence information so that retries from that producer session do not append duplicate copies of the same batch under the supported conditions. It also helps preserve order across retries. Current Kafka clients enable idempotence by default when the selected configuration is compatible; still check the exact client version and effective settings.

Producer idempotence protects Kafka writes from a retry duplicate. It does not deduplicate two intentional application sends, nor does it make a database update, email, or payment exactly once. Use business idempotency at the sink as well. See Kafka's [delivery semantics](https://kafka.apache.org/documentation/#semantics).

</details>

<details>
<summary>What does at-most-once, at-least-once, and exactly-once mean in Kafka?</summary>

### Answer
**At-most-once** processing commits progress before the work; a crash can skip work, but a record is not intentionally retried after the checkpoint. **At-least-once** processing performs the work before committing progress; a crash in between can cause a duplicate. **Exactly-once** is a scoped property, not a universal promise that arbitrary external side effects happen once.

Kafka can support transactional consume-process-produce workflows so that output records and consumed offsets are committed atomically within Kafka. Downstream consumers should use `read_committed` when they must not see aborted transactional output. If the processing writes to an external database, coordinate the database effect using idempotency or an appropriate transaction/outbox design. The [official semantics documentation](https://kafka.apache.org/documentation/#semantics) explains where Kafka's guarantee applies.

</details>

<details>
<summary>How do Kafka transactions work, and why are they not a universal distributed transaction?</summary>

### Answer
A transactional producer can publish to multiple Kafka partitions and commit the consumed offsets in the same Kafka transaction. If the transaction aborts, `read_committed` consumers hide its aborted records. A stable transactional ID lets Kafka coordinate producer sessions and fence older instances using the same identity.

This transaction does not automatically include a relational database, an email provider, or a payment API. To update Kafka and a database reliably, use a transactional outbox/inbox or another explicit dual-write strategy. Be prepared to discuss transaction coordinator availability, timeouts, throughput cost, and the boundaries of the atomic unit.

</details>

## Architecture and operations

<details>
<summary>Is ZooKeeper required for modern Kafka?</summary>

### Answer
No. Older Kafka clusters used ZooKeeper for metadata and controller coordination. KRaft places the metadata quorum within Kafka and uses the Raft protocol between controllers. The selected mode and migration support depend on the Kafka release and cluster state; do not mix configuration instructions from an older ZooKeeper deployment with a new KRaft cluster. The [official KRaft guide](https://kafka.apache.org/44/getting-started/zk2kraft/) documents the distinction.

The earlier Interview Prep answer about ZooKeeper has been moved here and corrected: ZooKeeper is not a universal prerequisite. When discussing an existing cluster, name its Kafka version and operating mode before proposing a command or migration.

> **Moved question:** “Is ZooKeeper required for modern Kafka?”

</details>

<details>
<summary>Why is KRaft useful operationally?</summary>

### Answer
KRaft removes the need to run a separate ZooKeeper cluster for Kafka metadata and brings metadata consensus into Kafka's controller quorum. That can simplify deployment, upgrades, and failure diagnosis because the metadata control plane is part of the Kafka system itself. It does not remove distributed-systems work: operators still need to monitor controller quorum health, plan upgrades, and understand metadata recovery and migration procedures.

> **Moved question:** This carries forward the earlier operational follow-up about KRaft.

</details>

<details>
<summary>When would you choose Kafka instead of a synchronous REST call?</summary>

### Answer
Choose Kafka when the producer should not wait for each consumer, several independent consumers need the same event, work can be buffered, or a retained event stream is useful for replay and recovery. A synchronous request is often simpler when the caller needs an immediate authoritative answer, such as validating a payment before returning to the user.

Kafka changes the business workflow: the caller may receive “accepted” rather than the final outcome. The system then needs correlation IDs, status visibility, retry policy, idempotency, and a clear expectation of eventual consistency. Do not introduce Kafka solely to hide a slow dependency.

> **Moved question:** This includes the earlier “When would you choose Kafka instead of a synchronous REST call?” question.

</details>

<details>
<summary>What changes when a synchronous dependency becomes asynchronous?</summary>

### Answer
The caller no longer receives the final business result in the same request. You must define an event contract, correlation and idempotency strategy, a way to expose processing status, retry and dead-letter behavior, observability, and what the user sees while work is pending. The failure may occur after the original request has returned, so the system needs a recovery path that does not depend on the caller still waiting.

Asynchronous communication lowers temporal coupling, but it does not remove dependencies. It replaces a direct runtime dependency with a contract, broker, consumer, and operational workflow.

</details>

<details>
<summary>What is a hot partition, and how can you reduce it?</summary>

### Answer
A hot partition receives much more traffic than other partitions, often because a small number of keys dominate or the partitioning strategy is uneven. Adding more consumers will not split one partition among members of the same group; one active member owns that partition. First inspect per-partition producer rate, consumer lag, record size, and key distribution.

Possible fixes include choosing a better key, increasing partitions with an explicit migration plan, splitting a high-volume aggregate into sub-keys when ordering allows, batching, or isolating the hot workload in a separate topic. Each change can affect ordering and key-to-partition mapping, so validate with the business ordering requirement before changing it.

</details>

<details>
<summary>How do you choose between Kafka Connect and Kafka Streams?</summary>

### Answer
Use **Kafka Connect** to move data between Kafka and external systems using reusable source and sink connectors. Use **Kafka Streams** when application logic must transform, aggregate, join, or maintain state over streams and produce derived streams. Use the ordinary producer and consumer APIs for direct application-level reads and writes.

A connector does not remove the need to manage schemas, delivery semantics, credentials, throughput, and failures. A Streams application does not automatically solve a bad event model or external side-effect problem. Choose the smallest component that owns the required behavior.

</details>

<details>
<summary>How should event schemas evolve without breaking consumers?</summary>

### Answer
Treat events as versioned contracts. Prefer additive, optional fields with safe defaults when consumers can ignore unknown fields. Avoid silently changing the meaning or type of an existing field. Decide whether compatibility must be backward, forward, or full, and validate producer and consumer versions in CI. A schema registry can enforce compatibility rules, but the team still owns semantic versioning, rollout order, and migration of old records.

If one consumer deploys more slowly than another, publish an event that both the old and new consumers can interpret during the transition. Keep event names and payloads tied to facts that happened rather than commands that ask another service to do work.

</details>

<details>
<summary>What security controls should a production Kafka cluster have?</summary>

### Answer
Use TLS for network encryption and broker identity verification, SASL or another supported mechanism for client authentication, and ACLs or the deployment's authorization layer for least-privilege topic and group access. Protect credentials, rotate them, separate application identities, and expose only the intended listeners. Monitor authentication and authorization failures, and keep broker/client versions patched.

Do not assume that network isolation alone is authentication. Also consider sensitive payloads, retention and deletion obligations, auditability, and what data is copied into logs or dead-letter topics. Exact configuration differs between self-managed Kafka and managed services.

</details>

<details>
<summary>How would you handle a production incident where order-consumer lag suddenly grows?</summary>

### Answer
Start by confirming the affected consumer group, topics, partitions, lag unit, and time of onset. Compare incoming records per second with successful processing rate. Then inspect whether lag is isolated to one partition, whether a key became hot, whether consumers are rebalancing repeatedly, and whether downstream calls, database pools, CPU, garbage collection, storage, or network capacity changed.

Stabilize the system without losing order or causing a retry storm. Add consumers only if there are unassigned partitions and downstream capacity. If the sink is failing, use bounded backoff and a deliberate retry/DLQ policy. After recovery, identify whether a deployment, schema change, broker issue, traffic spike, or poison event caused the incident; add an alert on both lag and progress rate, not only a static lag number.

</details>

<details>
<summary>How would you design an order-event flow that can be replayed safely?</summary>

### Answer
Publish an immutable `OrderCreated` event keyed by `orderId` to an `orders` topic. Configure partitions and replication for the expected throughput and failure policy. Give fulfillment and analytics separate group IDs so both can process each retained event. Make the fulfillment database write idempotent—perhaps with a unique event ID or inbox table—then commit the group's progress only after the write succeeds. Use a schema-compatibility policy, monitor per-partition lag and consumer errors, and define retention to cover the recovery window.

If the order database and Kafka publish must not diverge, write the business update and an outbox row in one database transaction, then publish the outbox record with a relay. That still requires idempotent consumption because the relay can publish more than once. This answer connects the event model, durability, consumer groups, duplicates, and recovery rather than treating Kafka as a single configuration flag.

</details>

<details>
<summary>How do you test a Kafka producer and consumer beyond a unit test?</summary>

### Answer
Unit-test partition-key construction, serialization, validation, and idempotent business handling without a broker. Add integration tests against an ephemeral Kafka broker or a compatible test environment to verify topic configuration, serialization, group behavior, commits, retries, and shutdown/rebalance handling. Include a failure test where the sink succeeds but the process stops before the offset commit, then verify that replay does not duplicate the business effect.

Contract tests should check schema compatibility and expected event semantics. In production, exercise lag alerts, dead-letter replay, and broker/client upgrade procedures. A test that only asserts “send returned without exception” does not prove that the intended consumer processed the event.

</details>

## Quick revision map

| If asked about… | Anchor your answer on… |
| --- | --- |
| Scale | Partitions create parallel lanes; a group cannot use more active consumers than assigned partitions. |
| Order | Ordering is per partition; key related records consistently and handle retries carefully. |
| Duplicates | Processing before offset commit can replay; make external side effects idempotent. |
| Durability | Discuss replication, `acks`, minimum ISR, failure scope, and availability trade-offs. |
| Exactly once | Scope the atomic guarantee to Kafka transactions; external systems need their own coordination. |
| Modern cluster design | KRaft is the current metadata quorum model; ZooKeeper guidance is version-specific. |
| Adoption | Explain why asynchronous buffering, fan-out, or replay is worth the added operational complexity. |

## Further learning

- Start with the [Apache Kafka event-streaming introduction](https://kafka.apache.org/44/getting-started/introduction/#what-is-event-streaming), [design documentation](https://kafka.apache.org/documentation/#design), [delivery semantics](https://kafka.apache.org/documentation/#semantics), and [KRaft guide](https://kafka.apache.org/44/getting-started/zk2kraft/).
- The [Kafka wiki quickstart](https://github.com/Yash-777/SpringBoot_MicroService/wiki/kafka) and [Spring Boot example](https://github.com/Yash-777/SpringBoot_MicroService/wiki/Apache-Kafka) are the source of several carried-forward examples. Their older ZooKeeper/`--zookeeper` commands are historical; the concepts have been updated here for current Kafka.
- The supplied [community Kafka interview gist](https://gist.github.com/bansalankit92/9414ef3614229cdca6053464fedf5038) contains additional prompts. Treat version-sensitive claims and absolute performance or “never lost” statements as discussion starters, not guarantees.
- Watch the [offset, lag, commit, rebalance, consumer-group, and replication deep dive](https://www.youtube.com/watch?v=iImW2xHMIRA) or the [Kafka and Spring Boot course](https://www.youtube.com/watch?v=tU_37niRh4U&t=653s) after working through the answers.
- The [ServiceNow Kafka/ZooKeeper discovery reference](https://www.servicenow.com/docs/r/zurich/it-operations-management/discovery-and-service-mapping-patterns/kafka-zookeeper-discovery.html) and [academic Kafka architecture figure](https://www.researchgate.net/figure/Apache-Kafka-architecture-with-mandatory-and-optional-services_fig3_360518587) are optional operational and architecture context; this article's diagram is original.
