# Rate Limiting at an API Gateway

Gateway rate limiting rejects or delays traffic before it consumes backend capacity. It is useful for protecting shared infrastructure, applying coarse per-client quotas, and limiting abusive bursts. It complements service-level limits, which can use domain identity and business context unavailable at the edge.

Choose a key such as authenticated client, tenant, API key, or route. Avoid relying only on a client-supplied IP header; accept forwarded addresses only from trusted proxies. In a multi-instance gateway, use shared atomic state or explicitly document that limits are per instance.

When a quota is exceeded, return `429 Too Many Requests` with `Retry-After` or documented rate-limit headers when appropriate. Decide deliberately whether a limiter-store outage fails open or closed, and monitor rejection rate, limiter latency, hot keys, and backend saturation.

Do not apply one global limit blindly: isolate tenants and expensive routes, and ensure retries use backoff instead of amplifying overload. See the canonical guide for fixed/sliding windows, token buckets, leaky buckets, and distributed-state trade-offs:

[Open Rate Limiting concepts](/content/tree/api-integration/resilience/rate-limiting)

**Related:** [API Gateway Pattern](/content/tree/api-integration/api-gateway/gateway-pattern), [Authentication at Gateway](/content/tree/api-integration/api-gateway/authentication-at-gateway), [Timeouts and Retries](/content/tree/api-integration/resilience/timeouts-retries).
