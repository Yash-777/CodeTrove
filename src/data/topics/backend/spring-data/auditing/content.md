# Spring Data Auditing

Spring Data auditing records metadata such as creation time, last modification time, and the actor responsible for a change. Auditing annotations standardize this metadata across persistence operations.

Enable auditing and annotate fields with `@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`, or `@LastModifiedBy`. An `AuditorAware` implementation can provide the current actor from the security context.

This metadata is not a tamper-proof audit trail. Regulated or security-sensitive history may need append-only records, database controls, retention policy, and independent access monitoring.

**Pitfalls:** recording an unauthenticated actor, relying on inconsistent clocks, and treating timestamps as a full history of changes.

**Interview points:** distinguish operational metadata from an immutable audit log, and explain how background jobs identify system actors.

**Related:** [Repositories](/content/tree/backend/spring-data/repositories), [Authentication](/content/tree/backend/spring-security/authentication).
