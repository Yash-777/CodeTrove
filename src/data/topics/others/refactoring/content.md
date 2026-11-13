# Refactoring

Refactoring is a behavior-preserving change to the internal structure of software. The goal is to make code easier to understand, test, change, and operate without changing what users observe. It is not a rewrite, a feature request, or permission to change behavior silently.

## A safe refactoring loop

1. **Characterize the current behavior.** Add or run tests around the paths you will touch. For legacy code, a characterization test records what the system currently does, including awkward edge cases.
2. **Make one small change.** Rename a method, extract a calculation, or move one responsibility. Small diffs are easier to review and revert.
3. **Verify continuously.** Run focused unit tests first, then integration tests, static analysis, and the broader build.
4. **Commit the intent.** A commit such as `refactor: extract invoice total calculation` is easier to review than a mixed feature-and-cleanup commit.

```java
// Before: calculation, formatting, and I/O are coupled.
public void printInvoice(Order order) {
    BigDecimal total = order.lines().stream()
        .map(line -> line.price().multiply(BigDecimal.valueOf(line.quantity())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    System.out.println("Total: " + total);
}

// After: the calculation can be tested independently.
public BigDecimal invoiceTotal(Order order) {
    return order.lines().stream()
        .map(line -> line.price().multiply(BigDecimal.valueOf(line.quantity())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
}
```

## Smells and useful transformations

| Smell | First refactoring to consider | Question to ask |
|---|---|---|
| Duplicated logic | Extract method or introduce a shared policy | Are the copies truly the same rule? |
| Long method | Extract method, then name the steps | Does each block have one reason to change? |
| Large conditional | Replace with polymorphism, a strategy, or a lookup table | Is the condition selecting behavior? |
| Feature envy | Move method or responsibility closer to its data | Which object knows enough to own this rule? |
| Primitive obsession | Introduce a value object | Are units, validation, or invariants being lost? |
| Shotgun surgery | Move related behavior behind one boundary | Why does one change require edits everywhere? |

Names are often the lowest-risk improvement. Rename a variable, method, or class when its current name forces readers to reconstruct the meaning. Follow a rename with compilation and tests so references do not remain half-updated.

## Refactoring around APIs and legacy code

Public APIs create compatibility constraints. Prefer adding a new method, deprecating the old one with a migration path, and adapting internally rather than breaking consumers for a cosmetic cleanup. Around legacy code, create a seam: an interface, wrapper, or adapter that lets new tests observe behavior without rewriting the whole subsystem.

Avoid changing several dimensions at once. A package move plus a persistence change plus a new validation rule is not a refactoring-only change; split it into reviewable steps and describe the behavior change explicitly.

## Design trade-offs

Refactoring can improve cohesion and reduce coupling, but abstraction has a cost. Do not create a generic framework for one caller, hide simple logic behind needless indirection, or optimize names while ignoring a slow query. A good refactoring makes the next likely change cheaper and leaves the code more obvious to the next reader.

## Review checklist

- Is the observable behavior unchanged and covered by tests?
- Does the diff have one structural intent?
- Are names, boundaries, and ownership clearer afterward?
- Were error paths, transactions, security checks, and logging preserved?
- Is the change reversible and easy to review?
- Did the build, focused tests, integration tests, and static checks run?

> **Rule of thumb:** refactor toward a concrete next change, not toward an imagined perfect architecture.
