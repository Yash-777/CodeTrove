# Saga — Orchestration (Centralized)

In orchestration, a coordinator drives the workflow by commanding participating services and reacting to their results.

## Flow screen

```text
                 +------------------+
                 | Saga Orchestrator|
                 +--------+---------+
                          |
              +-----------+-----------+
              |           |           |
            Order       Payment    Inventory
              |           |           |
              +-----------+-----------+
                          |
                    Success / Compensate
```

<details>
<summary>When would you prefer Saga orchestration?</summary>

### Answer
Use orchestration when the business workflow has many steps, explicit sequencing, complex compensation, or a need for one place to observe workflow state. The orchestrator coordinates; services still own their data and local transactions.

> **Note — what the interviewer is expecting:**
> Explain why central workflow visibility can outweigh the additional coordinator component and coupling.

</details>

<details>
<summary>Does a Saga provide ACID atomicity across microservices?</summary>

### Answer
No. Each service commits its own local transaction. A Saga coordinates a sequence of local transactions and compensating actions. There can be windows of inconsistency and compensation can itself fail, so the business process must tolerate eventual consistency.

> **Note — what the interviewer is expecting:**
> Never describe Saga as a distributed replacement for a single ACID transaction.

</details>

<a href="/content/tree/messaging/patterns/saga-pattern" target="_blank" rel="noopener noreferrer">Open CodeTrove Saga Pattern ↗</a>
