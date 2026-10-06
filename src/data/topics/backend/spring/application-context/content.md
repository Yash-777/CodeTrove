# Spring ApplicationContext

`ApplicationContext` is Spring's central container abstraction. It builds and wires beans, resolves dependencies, publishes events, exposes resources and environment properties, and integrates lifecycle and post-processing features.

Applications usually let Spring Boot create the context, while tests may create a smaller context with selected configuration. Context refresh performs configuration processing and singleton initialization, so expensive initialization can affect startup time.

**Pitfalls:** using the context as a service locator hides dependencies; creating many test contexts can slow suites; and static access to the container complicates lifecycle and isolation.

**Interview points:** explain how component scanning and configuration register beans, how dependency resolution occurs, and what happens during refresh at a high level.

**Related:** [IoC / DI](/content/tree/backend/spring/ioc-di), [Bean Lifecycle](/content/tree/backend/spring/bean-lifecycle), [Spring Boot Auto-Configuration](/content/tree/backend/spring-boot/auto-configuration).
