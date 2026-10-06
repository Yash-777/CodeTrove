# Spring Data Specifications

Specifications compose database predicates programmatically, commonly through the JPA Criteria API and `JpaSpecificationExecutor`. They are useful when optional search filters must be combined without many near-identical repository methods.

```java
static Specification<Order> hasStatus(Status status) {
	return (root, query, cb) -> status == null
		? cb.conjunction()
		: cb.equal(root.get("status"), status);
}
```

Compose predicates deliberately and keep query intent readable. Use pagination and inspect generated SQL; dynamic filters can still create expensive joins or queries that miss indexes.

**Trade-offs:** composition supports flexible filters but generic predicate builders can hide intent. A fixed complex report may be clearer as an explicit query.

**Interview points:** discuss predicate composition, optional filters, pagination, query-plan verification, and parameterized criteria instead of concatenated SQL.

**Related:** [Repositories](/content/tree/backend/spring-data/repositories), [Transactions](/content/tree/backend/spring-data/transactions).
