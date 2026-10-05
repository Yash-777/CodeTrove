# Spring Data Repositories

Spring Data repository interfaces provide a persistence abstraction and can derive queries from method names or use explicit JPQL/native queries. They reduce repetitive access code but retain the semantics and performance characteristics of the underlying store.

```java
interface OrderRepository extends JpaRepository<Order, UUID> {
	Page<Order> findByCustomerId(UUID customerId, Pageable pageable);
}
```

Use pagination for potentially large result sets, inspect generated queries, and place transaction boundaries where the use case spans operations. A repository abstraction does not eliminate SQL knowledge or prevent N+1 queries.

**Pitfalls:** unbounded collections, exposing persistence entities through APIs, and relying on method-name derivation for complex query behavior.

**Interview points:** compare query derivation with explicit queries, explain pagination and transaction scope, and describe detecting inefficient database access.

**Related:** [Transactions](/content/tree/backend/spring-data/transactions), [N+1 Queries](/content/tree/backend/hibernate-jpa/n-plus-one), [Specifications](/content/tree/backend/spring-data/specifications).
