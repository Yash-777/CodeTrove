# Spring IoC and Dependency Injection

Inversion of Control means an application delegates object creation and lifecycle to a container. Dependency Injection (DI) is the mechanism Spring commonly uses: components declare dependencies and the container supplies them.

```java
@Service
class CheckoutService {
	private final PaymentGateway gateway;
	CheckoutService(PaymentGateway gateway) { this.gateway = gateway; }
}
```

Prefer constructor injection for required dependencies. It makes invariants explicit, supports immutability, and allows ordinary unit construction. Spring resolves candidates by type, then qualifiers or primary markers where needed.

**Pitfalls:** field injection hides dependencies; circular dependencies often indicate unclear ownership; too many constructor parameters can reveal a class with too many responsibilities.

**Interview points:** distinguish IoC from DI, describe bean registration and dependency resolution, and explain why constructor injection improves testability without requiring a container in unit tests.

**Related:** [Bean Lifecycle](/content/tree/backend/spring/bean-lifecycle), [Application Context](/content/tree/backend/spring/application-context), [Java Abstraction](/content/tree/languages/java/core/oop/abstraction).
