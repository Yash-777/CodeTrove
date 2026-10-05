# Kafka — Topic, Partition & Broker Relationship

Kafka scales streams by splitting a topic into partitions and distributing those partitions across brokers.

## Architecture screen

```text
Topic: orders
+----------------+  +----------------+  +----------------+
| Partition 0    |  | Partition 1    |  | Partition 2    |
| 0 1 2 3 4 ...  |  | 0 1 2 3 4 ...  |  | 0 1 2 3 4 ...  |
+--------+-------+  +--------+-------+  +--------+-------+
         |                    |                    |
      Broker 1             Broker 2             Broker 3
```

<details>
<summary>What is the relationship between a Kafka topic, partition, and broker?</summary>

### Answer
A topic is a logical stream. A topic is divided into partitions, which provide ordered logs within each partition and enable parallelism. Brokers store partitions and serve reads/writes. Replicas can place copies of partitions on multiple brokers for fault tolerance.

> **Note — what the interviewer is expecting:**
> Know that ordering is normally guaranteed within a partition, not globally across an entire topic.

</details>

<details>
<summary>How does partition count affect consumer scalability?</summary>

### Answer
Within a consumer group, a partition is assigned to at most one active consumer at a time. More partitions can enable more parallel consumers, but partitions also create storage, network, recovery, and coordination overhead.

> **Note — what the interviewer is expecting:**
> Connect partitioning to ordering, throughput, consumer parallelism, and operational cost.

</details>
