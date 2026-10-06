# CompletableFuture

`CompletableFuture` represents a result that may arrive later and composes asynchronous stages. Use `thenApply` to transform a value, `thenCompose` to flatten another asynchronous stage, and `thenCombine` to join independent work.

```java
return loadUser(id).thenCombine(loadOrders(id), Profile::new);
```

Async methods without an explicit executor use the common fork-join pool. Provide a dedicated bounded executor for blocking I/O. Handle errors with `exceptionally`, `handle`, or `whenComplete` based on whether the stage recovers, transforms, or only observes. Apply deadlines deliberately; cancellation may not stop an underlying remote call.

**Pitfalls:** blocking with `join()`, hidden common-pool contention, lost context, and converting failures into misleading defaults.

**Interview points:** compare `thenApply` and `thenCompose`, explain error propagation, and discuss bounding concurrency and enforcing deadlines.

**Related:** [Executors](/content/tree/languages/java/core/concurrency/executors), [Threads](/content/tree/languages/java/core/concurrency/threads).
