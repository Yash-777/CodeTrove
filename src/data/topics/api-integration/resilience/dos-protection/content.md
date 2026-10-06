# Denial-of-Service Protection

Denial-of-service protection preserves useful capacity when traffic is malicious or exceeds safe operating limits. Apply layered controls: network/edge filtering, authentication, request-size limits, rate and concurrency limits, timeouts, bounded queues, and dependency isolation.

Use trustworthy identity keys where possible and protect tenants from noisy neighbors. Per-IP limits alone are weak against distributed sources and can affect users behind shared NAT. Instrument rejections and saturation so controls can be tuned without hiding legitimate demand.

**Pitfalls:** unlimited bodies, expensive unauthenticated operations, unbounded queues, and retries that amplify an outage. A limiter cannot compensate for insecure code or poor capacity planning.

**Interview points:** identify the threat and protected resource, choose edge and application controls, and explain fail-open/fail-closed behavior when the limiter store is unavailable.

**Related:** [Rate Limiting](/content/tree/api-integration/resilience/rate-limiting), [Bulkheads](/content/tree/api-integration/resilience/bulkheads), [API Gateway](/content/tree/api-integration/api-gateway/gateway-pattern).
