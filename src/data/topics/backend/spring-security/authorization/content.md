# Authorization in Spring Security

Authorization decides whether a principal may perform an operation on a resource. Spring Security supports request-level rules and method-level checks; enforce policy near the protected operation, especially when several entry points invoke the same service.

Use least privilege and explicit deny-by-default rules. Roles are commonly represented using the `ROLE_` convention, while authorities can express finer-grained permissions. Validate tenant and resource ownership against trusted domain data rather than user-supplied identifiers.

**Pitfalls:** protecting only URL paths while leaving service methods accessible through other routes, inconsistent tenant checks, and confusing successful authentication with permission to act.

**Interview points:** distinguish role-based and authority-based checks and describe tests for both permitted and denied cases.

**Related:** [Authentication](/content/tree/backend/spring-security/authentication), [Method Security](/content/tree/backend/spring-security/preauthorize), [OAuth2 / JWT](/content/tree/backend/spring-security/oauth2-jwt).
