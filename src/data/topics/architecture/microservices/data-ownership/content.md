# Data Ownership in Microservices

Each service owns the data and invariants for its bounded context. Other services use supported APIs or published events instead of writing its tables. Ownership limits schema coupling and lets the owning team evolve its persistence model.

Ownership does not require a different database product for every service; separate schemas or clearly enforced logical ownership may be sufficient. Cross-service reporting can use events, a read model, or a warehouse rather than synchronous joins across service databases.

**Trade-offs:** ownership reduces coupling but makes cross-service queries and workflows eventually consistent. Consumers must account for duplicate delivery, ordering guarantees, and schema evolution.

**Pitfalls:** shared database writes, treating events as synchronous queries, and incompatible event changes. A transactional outbox can persist local state and an event record atomically.

**Interview points:** explain ownership, eventual consistency, outbox, and how to create cross-service views without shared-table coupling.

**Related:** [Distributed Transactions](/content/tree/architecture/microservices/distributed-transactions), [Service Boundaries](/content/tree/architecture/microservices/microservice-boundaries).
