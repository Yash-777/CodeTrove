# Abstraction

Abstraction exposes the contract a caller needs while hiding implementation detail. Java interfaces and abstract classes define contracts that allow implementations to change independently from consumers.

```java
interface PaymentGateway { Receipt charge(Money amount); }

final class CheckoutService {
	private final PaymentGateway gateway;
	CheckoutService(PaymentGateway gateway) { this.gateway = gateway; }
}
```

Create an abstraction when there is a meaningful boundary, independent implementation, or dependency that should be replaceable. An interface for every class can add ceremony without reducing coupling.

**Trade-offs:** interfaces support multiple type contracts; abstract classes can share state and implementation but constrain inheritance. The contract should express caller needs, not leak implementation-specific behavior.

**Interview points:** explain dependency inversion, who owns the interface, and how the abstraction helps testing without making testability its only purpose.

**Related:** [Encapsulation](/content/tree/languages/java/core/oop/encapsulation), [Polymorphism](/content/tree/languages/java/core/oop/polymorphism), [Dependency Injection](/content/tree/backend/spring/ioc-di).
