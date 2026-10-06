# Synchronous vs Asynchronous Communication

Use synchronous communication when the caller needs an immediate response. Use asynchronous messaging when work can be decoupled, buffered, retried, or processed independently.

| Concern | Synchronous HTTP/gRPC | Asynchronous Kafka/message broker |
|---|---|---|
| Response | Immediate | Deferred |
| Coupling | Temporal coupling | Lower temporal coupling |
| Failure | Caller sees dependency failure directly | Consumer can retry/reprocess |
| Scaling | Caller waits for dependency | Broker buffers workload |
| Ordering | Request sequence | Partition/order rules apply |

<details>
<summary>When would you choose Kafka instead of a synchronous REST call?</summary>

### Answer
Choose Kafka when the producer should not wait for consumers, multiple consumers need the same event, workload should be buffered, or downstream processing can happen asynchronously. Do not introduce Kafka when the business operation requires an immediate authoritative response and the added operational complexity has no value.

> **Note — what the interviewer is expecting:**
> Trade off latency, consistency, coupling, retry behavior, throughput, and operational complexity.

</details>

<details>
<summary>What changes when a synchronous dependency becomes asynchronous?</summary>

### Answer
The caller no longer receives the final business result immediately. You need an event contract, correlation/idempotency strategy, status tracking or callback mechanism, retry/DLQ handling, observability, and clear eventual-consistency expectations.

> **Note — what the interviewer is expecting:**
> Understand that asynchronous communication changes the business workflow, not only the transport.

</details>
