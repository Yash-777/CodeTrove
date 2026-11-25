# Kafka Interview Questions and Answers


- **Apache Kafka** is a distributed event-streaming platform. Producers write events, Kafka stores them, consumers read them.
- Events live in **topics**. Each topic is split into **partitions**, and each partition is an append-only log.
- Every message has an **offset**: its position in a partition.
- **Brokers** are the Kafka servers that store partitions.
- **Consumer groups** share the work: each partition is read by one consumer in the group.
- Kafka **keeps messages** after they are read (until retention expires), so they can be replayed.
- Order is guaranteed **only within one partition**.
- **Consumer lag** (how far consumers are behind) is the key health metric.
- Modern Kafka uses **KRaft**; ZooKeeper is not required.
- Delivery is usually **at-least-once**, so handle duplicates with idempotency.


## 1. Foundations

<details>
<summary>Q1. What is Apache Kafka, and what does event streaming mean?</summary>

Kafka is a distributed platform for sending, storing, and processing events. Producers publish events to topics, Kafka stores them durably, and consumers read them now or later. Event streaming covers the whole lifecycle: capture, keep, process, and send results onward.

*Example:* An order service publishes `OrderCreated`. Payment, inventory, and analytics each read it independently.

</details>

<details>
<summary>Q2. What are an event, producer, consumer, topic, broker, partition, and offset?</summary>

- **Event (record):** something that happened, with a key, value, timestamp, and optional headers.
- **Producer:** writes events.
- **Consumer:** reads and processes events.
- **Topic:** a named stream, such as `orders`.
- **Broker:** a Kafka server that stores partitions.
- **Partition:** one ordered log inside a topic; the unit of parallelism.
- **Offset:** a message's position in one partition. Offset 42 in partition 0 is a different message from offset 42 in partition 2.

</details>

<details>
<summary>Q3. What is the relationship between a topic, a partition, and a broker?</summary>

A topic is a logical stream split into partitions. Partitions are spread across brokers. Each partition has a leader replica that handles reads and writes, and follower replicas that copy it for safety.

*Example:* Topic `orders` with 3 partitions can place one partition on each of Broker 1, 2, and 3.

</details>

<details>
<summary>Q4. How is Kafka different from a traditional queue (RabbitMQ, SQS)?</summary>

- A **queue** gives each message to one worker and removes it once done. It suits one-time jobs.
- **Kafka** keeps messages for a retention period. Many consumer groups can read the same data, and each can replay from an earlier offset.

Choose Kafka for event streams, replay, many readers, and high throughput. Choose a queue for jobs done once and then removed.

</details>

<details>
<summary>Q5. Are Kafka messages deleted after a consumer reads them?</summary>

No. Reading only moves the group's offset forward. Messages are removed when **retention** (time or size) expires. With **log compaction**, Kafka keeps the latest value for each key instead. Retention is not a backup, so set it to cover your replay needs.

</details>

<details>
<summary>Q6. What ordering does Kafka guarantee?</summary>

Order is guaranteed **within one partition** only. To keep all events of one order in sequence, use the same key (like `orderId`) so they land in the same partition. There is no global order across partitions.

</details>

## 2. Producers

<details>
<summary>Q7. How are records assigned to partitions?</summary>

- **With a key:** Kafka hashes the key, so the same key goes to the same partition (while the partition count stays the same).
- **Without a key:** records are spread across partitions in batches.
- You can also set the partition directly or write a custom partitioner.

A very popular key can overload one partition (a hot partition), so choose keys carefully.

</details>

<details>
<summary>Q8. What is an idempotent producer?</summary>

It stops retries from writing the same message twice to Kafka. The producer attaches an ID and sequence number, and the broker ignores duplicates. It also keeps order during retries.

It does **not** make a database update or payment happen exactly once. You still need business-level idempotency.

</details>

<details>
<summary>Q9. What do acks=0, acks=1, and acks=all mean?</summary>

- `acks=0`: producer does not wait. Fastest, but messages can be lost.
- `acks=1`: waits for the leader only. Data can be lost if the leader fails before followers copy it.
- `acks=all`: waits for all in-sync replicas. Safest.

</details>

## 3. Consumers, Groups, and Offsets

<details>
<summary>Q10. What is a consumer group?</summary>

Consumers with the same group ID share the work: each partition goes to only one consumer in the group. Different groups read independently, and each gets the full stream.

*Example:* Groups `fulfillment` and `analytics` both read every order. Three `fulfillment` consumers split the partitions among themselves.

</details>

<details>
<summary>Q11. Why can several services read the same topic independently?</summary>

Each consumer group keeps its **own offsets**, so one group's progress never affects another's.

</details>

<details>
<summary>Q12. How does partition count affect consumer scalability?</summary>

The number of partitions limits how many consumers in a group can work in parallel. With 3 partitions, a 4th consumer sits idle. More partitions allow more parallelism but add storage, network, and recovery overhead. Changing the partition count later can change which partition a key maps to.

</details>

<details>
<summary>Q13. What is a consumer offset?</summary>

An offset is a message's position in a partition. A consumer group **commits** its offset to remember where to resume after a restart or rebalance. It shows progress; it does not prove the business work finished exactly once.

</details>

<details>
<summary>Q14. Should offsets be committed automatically or manually?</summary>

- **Auto commit:** simple, but the offset may be committed before processing finishes. A crash can then skip messages.
- **Manual commit:** commit only after the work succeeds. A crash before the commit causes a re-delivery, so processing must be idempotent.

With parallel processing, never commit past an unfinished earlier message in the same partition.

</details>

<details>
<summary>Q15. How can duplicates happen even when offsets are committed?</summary>

A consumer saves data to the database, then crashes before committing the offset. After restart, Kafka sends the message again and the data is saved twice. Committing first has the opposite risk: a crash after the commit but before the save loses the work.

**Fix:** use idempotency keys, unique constraints, or an inbox/outbox pattern.

</details>

<details>
<summary>Q16. What happens when a consumer joins, leaves, or crashes?</summary>

The group coordinator **rebalances**: it pauses briefly and reassigns partitions to the remaining consumers. Nothing is lost because the new owner continues from the last committed offset.

Triggers: a consumer joining or leaving, missed heartbeats, a deployment, or a partition-count change. Close consumers gracefully and avoid long blocking work in the poll loop.

</details>

<details>
<summary>Q17. What is consumer lag, and how do you investigate growing lag?</summary>

Lag is the gap between the latest message in a partition and the group's committed offset. To investigate:

1. Find the affected topics, partitions, and consumers.
2. Compare incoming rate with processing rate.
3. Check for a hot partition, slow downstream calls, repeated retries, frequent rebalances, or CPU/GC pressure.
4. Add consumers only if free partitions exist and the downstream system can cope.

</details>

<details>
<summary>Q18. How should consumers handle retries and poison messages?</summary>

- Retry temporary failures a limited number of times with backoff.
- Send a message that keeps failing to a **dead-letter topic** with error details, so it does not block the partition.
- If later events depend on the failed one, decide clearly whether skipping it is allowed.
- Alert on the dead-letter topic and keep a replay procedure.

</details>

## 4. Reliability and Delivery Guarantees

<details>
<summary>Q19. What are leader, follower, replica, and ISR?</summary>

- **Leader:** handles reads and writes for a partition.
- **Follower:** copies the leader's log.
- **Replication factor:** how many copies exist.
- **ISR (in-sync replicas):** replicas that are caught up with the leader.

If the leader fails, an in-sync replica becomes the new leader. Replication is not a backup.

</details>

<details>
<summary>Q20. How do replication factor, acks=all, and min.insync.replicas work together?</summary>

With replication factor 3, `acks=all`, and `min.insync.replicas=2`, a write succeeds only when at least 2 replicas have it. If only 1 replica is in sync, writes are rejected. This trades some availability for stronger durability.

</details>

<details>
<summary>Q21. Can Kafka guarantee that no record is ever lost?</summary>

Not unconditionally. `acks=all` with a proper `min.insync.replicas` greatly reduces risk, but loss is still possible from correlated failures, unsafe leader election, wrong configuration, or operator mistakes. Durability depends on the producer, brokers, consumer commits, and the final sink together.

</details>

<details>
<summary>Q22. What are at-most-once, at-least-once, and exactly-once?</summary>

- **At-most-once:** commit first, then process. A crash can skip a message.
- **At-least-once:** process first, then commit. A crash can cause a duplicate. This is the common default.
- **Exactly-once:** achievable inside Kafka using transactions. For external systems like a database, you still need idempotency or an outbox design.

</details>

<details>
<summary>Q23. How do Kafka transactions work?</summary>

A transactional producer writes to several partitions and commits the consumed offsets in one atomic transaction. If it aborts, consumers using `read_committed` do not see the aborted messages. Transactions cover Kafka only, not databases, emails, or payment APIs.

</details>

## 5. Architecture and Operations

<details>
<summary>Q24. Is ZooKeeper required for modern Kafka?</summary>

No. Older Kafka used ZooKeeper for metadata and controller coordination. **KRaft** replaces it with a Raft-based metadata quorum inside Kafka itself. Always say which Kafka version and mode you run.

</details>

<details>
<summary>Q25. Why is KRaft useful?</summary>

It removes the separate ZooKeeper cluster, which simplifies deployment, upgrades, and troubleshooting. You still need to monitor controller quorum health and plan upgrades.

</details>

<details>
<summary>Q26. When would you choose Kafka over a synchronous REST call?</summary>

Choose Kafka when the producer should not wait for consumers, several services need the same event, work should be buffered, or you want replay. Use REST when the caller needs an immediate, authoritative answer, such as validating a payment. Do not add Kafka just to hide a slow dependency.

| Concern | Synchronous (HTTP/gRPC) | Asynchronous (Kafka) |
|---|---|---|
| Response | Immediate | Deferred |
| Coupling | Caller waits for dependency | Loosely coupled in time |
| Failure | Caller sees the error directly | Consumer can retry or reprocess |
| Scaling | Caller is blocked | Broker buffers the load |
| Ordering | Request order | Per-partition order |

</details>

<details>
<summary>Q27. What changes when a synchronous call becomes asynchronous?</summary>

The caller no longer gets the final result immediately. You need an event contract, correlation and idempotency IDs, a way to show status, retry and dead-letter handling, monitoring, and clear expectations of eventual consistency.

</details>

<details>
<summary>Q28. What is a hot partition, and how do you reduce it?</summary>

A hot partition gets far more traffic than the others, usually because a few keys dominate. More consumers will not help, since one consumer owns one partition. Options: choose a better key, split a busy key into sub-keys (if ordering allows), add partitions with a migration plan, or move the hot workload to its own topic.

</details>

<details>
<summary>Q29. Kafka Connect vs Kafka Streams: when to use which?</summary>

- **Kafka Connect:** move data between Kafka and external systems using ready-made connectors.
- **Kafka Streams:** transform, aggregate, join, or keep state over streams inside your application.
- **Producer/Consumer APIs:** direct reads and writes in application code.

</details>

<details>
<summary>Q30. How should event schemas evolve safely?</summary>

Treat events as versioned contracts. Add optional fields with defaults instead of changing existing fields. Choose backward, forward, or full compatibility and check it in CI, ideally with a schema registry. Deploy so old and new consumers can both read the events during the transition.

</details>

<details>
<summary>Q31. What security controls should a production cluster have?</summary>

- **TLS** for encryption and broker identity.
- **SASL** (or similar) for client authentication.
- **ACLs** for least-privilege access to topics and groups.
- Rotate credentials, use separate identities per application, and expose only the needed listeners.
- Watch for sensitive data in payloads, logs, and dead-letter topics.

</details>

## 6. Scenario and Design Questions

<details>
<summary>Q32. How would you handle a sudden rise in order-consumer lag in production?</summary>

1. Confirm the group, topics, partitions, and when it started.
2. Compare produce rate with processing rate.
3. Check for a hot partition, rebalance loops, slow database or API calls, and resource limits.
4. Add consumers only if there are idle partitions and downstream capacity.
5. Use bounded retries and a dead-letter topic to avoid a retry storm.
6. Find the root cause (deployment, schema change, traffic spike, poison message) and alert on both lag and processing rate.

</details>

<details>
<summary>Q33. How would you design an order flow that can be replayed safely?</summary>

1. Publish an immutable `OrderCreated` event keyed by `orderId` to the `orders` topic.
2. Give each service its own consumer group (fulfillment, analytics).
3. Make the consumer's database write idempotent (unique event ID or inbox table).
4. Commit the offset only after the write succeeds.
5. Set retention long enough to cover your recovery window.
6. Use the **outbox pattern** so the database update and Kafka publish never diverge.
7. Monitor per-partition lag and errors.

</details>

<details>
<summary>Q34. How do you test Kafka producers and consumers?</summary>

- **Unit tests:** key building, serialization, validation, idempotent handling.
- **Integration tests:** run against a test broker to check topics, groups, commits, retries, and shutdown.
- **Failure test:** let the sink succeed, stop before the commit, and confirm the replay does not duplicate the effect.
- **Contract tests:** check schema compatibility.

</details>

## 7. Senior Follow-ups to Practise

<details>
<summary>What causes consumer rebalancing?</summary>

A consumer joining or leaving, missed heartbeats or session timeout, a subscription change, a deployment, or a partition-count change.

</details>

<details>
<summary>How do you alert on consumer lag?</summary>

Alert on both lag (records or time) per partition and on the processing rate, so you catch a stuck consumer even when the lag number looks small.

</details>

<details>
<summary>How do you preserve ordering for one customer or order?</summary>

Use a stable key such as `orderId`, keep one active consumer per partition, and configure retries so a later message cannot overtake a failed earlier one.

</details>

<details>
<summary>When would you replay a partition from an earlier offset?</summary>

To rebuild a projection, recover from a bug or bad deployment, or onboard a new consumer. This works only while the messages are still within retention, and processing must be idempotent.

</details>

## Quick Revision Map

| If asked about | Remember |
|---|---|
| Scale | Partitions are parallel lanes; active consumers in a group cannot exceed partitions. |
| Order | Order is per partition; use a consistent key. |
| Duplicates | Process-then-commit can replay; make side effects idempotent. |
| Durability | Replication, `acks=all`, `min.insync.replicas`, and the availability trade-off. |
| Exactly once | Kafka transactions cover Kafka only; external systems need their own idempotency. |
| Modern clusters | KRaft is the current metadata model; ZooKeeper is version-specific. |
| Health | Watch consumer lag and processing rate. |
