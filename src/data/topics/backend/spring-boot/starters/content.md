# Spring Boot Starters

A starter is a curated dependency descriptor that brings together libraries commonly used for a capability, such as web, data access, or validation. Starters simplify dependency selection; auto-configuration uses the resulting classpath and application settings to configure beans.

For example, a web starter supplies the web stack and related dependencies, but does not itself implement application endpoints. The Spring Boot dependency-management model aligns compatible versions so applications should usually avoid overriding individual transitive versions without a specific reason.

**Pitfalls:** assuming a starter is runtime behavior, accumulating overlapping starters, and overriding transitive versions until the dependency graph becomes incompatible. Inspect the resolved dependency tree when behavior changes unexpectedly.

**Interview points:** distinguish starters from auto-configuration, explain dependency management, and describe how classpath conditions influence the resulting application context.

**Related:** [Auto-Configuration](/content/tree/backend/spring-boot/auto-configuration), [Configuration Properties](/content/tree/backend/spring-boot/configuration-properties).