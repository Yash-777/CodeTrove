# Spring Boot Auto-Configuration

Spring Boot auto-configuration conditionally contributes beans based on the classpath, existing beans, and environment. It reduces repetitive setup while remaining overrideable by application configuration.

```java
@AutoConfiguration
@ConditionalOnClass(DataSource.class)
@ConditionalOnMissingBean(DataSource.class)
class DataSourceAutoConfiguration { /* defaults */ }
```

Conditions are evaluated during context configuration. When behavior is unexpected, inspect the condition evaluation report, dependency graph, active properties, and user-defined beans before adding another override. Auto-configuration is not magic: it is ordinary configuration guarded by conditions.

**Pitfalls:** accidental dependency changes activating configuration, bean ambiguity, and overriding defaults without understanding their conditions.

**Interview points:** explain conditional configuration, starter dependencies versus auto-configuration, and how to diagnose why a bean was or was not created.

**Related:** [Starters](/content/tree/backend/spring-boot/starters), [ApplicationContext](/content/tree/backend/spring/application-context), [Configuration Properties](/content/tree/backend/spring-boot/configuration-properties).
