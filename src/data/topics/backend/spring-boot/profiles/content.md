# Spring Boot Profiles

Profiles select environment-specific bean definitions and configuration, for example `local`, `test`, or `production`. Activate profiles explicitly through deployment configuration and keep common defaults in the base configuration.

```yaml
spring:
	config:
		activate:
			on-profile: production
```

Profiles are useful for wiring differences, but avoid maintaining unrelated application behavior in a growing matrix of profile-specific branches. Do not store credentials in profile files; inject secrets through a secret-management mechanism. Test the effective configuration used by each deployment.

**Pitfalls:** relying on an accidental local default, activating conflicting profiles, and treating profiles as a substitute for deployment configuration management.

**Interview points:** discuss property precedence, profile activation, configuration validation, and how to avoid environment drift.

**Related:** [Configuration Properties](/content/tree/backend/spring-boot/configuration-properties), [Actuator](/content/tree/backend/spring-boot/actuator).
