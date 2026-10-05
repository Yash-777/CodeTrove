# Kafka — Producer, Consumer & Offset Management

Kafka consumers track their position using offsets. Understanding offset behavior is essential for retry, replay, duplicate processing, and delivery semantics.

<details>
<summary>What is a Kafka consumer offset?</summary>

### Answer
An offset identifies a record's position within a partition. A consumer group commits offsets so it can resume processing after restart or rebalance. The committed offset represents consumer progress, not proof that a business transaction is permanently complete.

> **Note — what the interviewer is expecting:**
> Distinguish broker position, committed consumer progress, and successful business processing.

</details>

<details>
<summary>How can duplicate processing happen even when offsets are committed?</summary>

### Answer
If a consumer processes a message successfully but crashes before its offset commit becomes durable, the message can be delivered again after restart. The business operation therefore needs idempotency or another safe deduplication strategy when duplicate delivery is possible.

> **Note — what the interviewer is expecting:**
> Understand at-least-once processing and why offset commits alone do not make business effects exactly once.

</details>

## Senior follow-ups

- What causes consumer rebalancing?
- What is consumer lag and how do you alert on it?
- How do you preserve ordering for one customer/order?
- When would you replay a partition from an earlier offset?
