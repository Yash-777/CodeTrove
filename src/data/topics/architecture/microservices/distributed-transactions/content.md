# Distributed Transactions

A business operation spanning service-owned databases cannot usually rely on one local ACID transaction. Network partitions, timeouts, and independent commits require an explicit consistency and recovery strategy.

A common approach is a saga: services commit local transactions and communicate with commands or events; failures may trigger retries or compensating actions. Compensation is a new business action, not a time reversal, so it must account for partial completion. A transactional outbox prevents local state from committing while its event is lost.

**Trade-offs:** two-phase commit can provide stronger atomicity when all participants support it, but couples coordination and availability. Eventual consistency supports service autonomy but needs idempotent handlers, reconciliation, and sometimes user-visible pending states.

**Interview points:** walk through success, timeout, duplicate delivery, and compensation. Explain why exactly-once behavior across independent systems is usually an application-level guarantee.

**Related:** [Saga Choreography](/content/tree/interview-prep/microservices/project-flow/saga-pattern/choreography/saga-choreography), [Saga Orchestration](/content/tree/interview-prep/microservices/project-flow/saga-pattern/orchestration/saga-orchestration), [Idempotency](/content/tree/api-integration/resilience/idempotency).
