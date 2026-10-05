# Spring Boot Configuration Properties

`@ConfigurationProperties` binds a group of external properties to a typed object. It provides a cohesive configuration contract, relaxed property-name binding, and support for validation when configured with a validation provider.

```java
@ConfigurationProperties(prefix = "payments")
@Validated
public record PaymentProperties(@NotBlank String baseUrl,
								@Positive long timeoutMillis) {}
```

Register the properties type with configuration-properties scanning or explicit enablement. Keep environment-specific values outside source control; use a secrets manager for credentials. Prefer typed properties over scattered `@Value` fields for related settings.

**Pitfalls:** missing registration, unvalidated invalid values, ambiguous precedence, and treating profiles as a secret store.

**Interview points:** describe binding and validation, configuration precedence, and how you prevent invalid configuration from reaching production.

**Related:** [Profiles](/content/tree/backend/spring-boot/profiles), [Auto-Configuration](/content/tree/backend/spring-boot/auto-configuration).
