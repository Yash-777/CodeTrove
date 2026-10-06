# Idempotency

Idempotency means repeating an operation with the same request identity produces no additional business effect. It is essential when clients retry after timeouts, because a server may have committed a write even when the response was lost.

This API resilience entry links to the canonical implementation and senior-interview guide, which covers key scope, durable storage, concurrent duplicates, replaying results, retention, and failure cases:

[Open the Idempotency implementation guide](/content/tree/interview-prep/microservices/project-flow/api-gateway-idempotency/api-gateway-idempotency)

Use a durable uniqueness constraint or equivalent atomic coordination in multi-instance systems; a process-local cache is not sufficient. See also [Timeouts and Retries](/content/tree/api-integration/resilience/timeouts-retries) and [Rate Limiting](/content/tree/api-integration/resilience/rate-limiting).
