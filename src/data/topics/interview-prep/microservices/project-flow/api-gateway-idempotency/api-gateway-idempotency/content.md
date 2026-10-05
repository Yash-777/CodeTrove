# API Gateway & Idempotency

API Gateway and idempotency solve different problems: the gateway controls the edge, while idempotency prevents retries from creating duplicate business effects.

## Request screen

```text
Client -> Gateway -> Auth -> Rate Limit -> Route -> Service
                                      |
                                Idempotency-Key
                                      |
                              Idempotency Store
```

<details>
<summary>What should an API Gateway do, and what should it never own?</summary>

### Answer
A gateway is a strong location for TLS termination, routing, authentication/token pre-checks, rate limiting, request-size controls, correlation metadata, and sometimes aggregation. Business rules, database transactions, domain authorization decisions, and long-running workflows should remain in services that own those domains.

> **Note — what the interviewer is expecting:**
> Clear separation between **edge policy** and **business ownership**, plus awareness of gateway bottlenecks and availability.

</details>

<details>
<summary>How do you make a payment or order API idempotent when the client retries after a timeout?</summary>

### Answer
Require a client-generated idempotency key for the business operation. Persist the key with the operation status and a safe replayable result, enforce uniqueness, and return the same outcome for repeated requests. The database transaction must protect the uniqueness invariant. Do not rely only on an in-memory cache because another instance may receive the retry.

> **Note — what the interviewer is expecting:**
> Discuss retries, concurrent duplicate requests, durable state, unique constraints, expiration/retention, and what happens when the first request succeeded but its response was lost.

</details>

## Senior follow-ups

- Should GET be idempotent by definition? Explain semantic idempotency versus implementation details.
- Where should an idempotency record live in a multi-instance deployment?
- How do you prevent an attacker from filling the idempotency store with random keys?
- How do rate limiting, authentication, request size limits, and idempotency interact?

## Cross references

<a href="/content/tree/api-integration/resilience/idempotency" target="_blank" rel="noopener noreferrer">Open CodeTrove Idempotency ↗</a>
<a href="/content/tree/api-integration/api-gateway/gateway-pattern" target="_blank" rel="noopener noreferrer">Open API Gateway Pattern ↗</a>
