# Spring Transaction Management

Spring's `@Transactional` commonly applies transaction advice through a proxy around a method call. The transaction manager begins or joins a transaction, then commits on success or rolls back according to configured rules. By default, Spring rolls back for unchecked exceptions and `Error`, not every checked exception.

```java
@Transactional
public Order placeOrder(Command command) {
	var order = repository.save(Order.from(command));
	outbox.save(OutboxEvent.orderCreated(order));
	return order;
}
```

Keep the boundary around one local unit of work. Self-invocation may bypass proxy advice, and remote calls inside a DB transaction hold locks and connections. A local transaction does not make a cross-service workflow atomic; use an outbox and saga when appropriate.

**Interview points:** explain propagation, isolation, rollback rules, proxy limits, and why distributed transactions commonly use eventual-consistency patterns.

**Related:** [AOP](/content/tree/backend/spring/aop), [Distributed Transactions](/content/tree/architecture/microservices/distributed-transactions), [Saga Orchestration](/content/tree/interview-prep/microservices/project-flow/saga-pattern/orchestration/saga-orchestration).
