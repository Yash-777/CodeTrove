# Spring Bean Lifecycle

A Spring bean is an object managed by the container. In a typical lifecycle, Spring instantiates it, injects dependencies, runs aware callbacks and bean post-processors, invokes initialization callbacks, and later calls destruction callbacks when the context closes. Exact phases depend on scope and configuration.

Use `@PostConstruct` for initialization that requires injected dependencies and `@PreDestroy` for cleanup of resources owned by the bean. Prefer framework-managed clients and pools when they already define lifecycle behavior.

**Pitfalls:** doing long or blocking work during startup, relying on lifecycle callbacks for business workflows, and assuming prototype-scoped beans receive the same destruction management as singletons.

**Interview points:** explain bean post-processors and how proxies can be applied, distinguish initialization from construction, and discuss shutdown ordering for owned resources.

**Related:** [IoC / DI](/content/tree/backend/spring/ioc-di), [Application Context](/content/tree/backend/spring/application-context).
