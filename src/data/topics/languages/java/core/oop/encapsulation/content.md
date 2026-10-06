# Encapsulation

Encapsulation hides an object's representation and exposes operations that preserve its invariants. It is more than generating getters and setters: callers should not be able to put an object into an invalid state.

```java
final class BankAccount {
	private long balance;
	void deposit(long amount) {
		if (amount <= 0) throw new IllegalArgumentException("amount must be positive");
		balance = Math.addExact(balance, amount);
	}
	long balance() { return balance; }
}
```

Use narrow visibility, immutable values where practical, and defensive copies for mutable collections crossing a boundary. This reduces coupling and lets implementation details evolve.

**Trade-offs:** abstraction can protect invariants but excessive indirection can obscure simple data. Decide which rules belong to the object and which require a service or transaction boundary.

**Interview points:** show how encapsulation centralizes validation and explain why public mutable fields or unrestricted setters weaken the contract.

**Related:** [Abstraction](/content/tree/languages/java/core/oop/abstraction), [Objects](/content/tree/languages/java/core/oop/object).
