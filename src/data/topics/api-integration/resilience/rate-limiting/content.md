# Rate Limiting

Rate limiting bounds request volume over time for a key such as a user, API key, tenant, IP, or route. It protects service capacity, limits abuse, and enforces quotas. This API resilience entry links to the canonical guide with algorithm choices, shared-state design, HTTP responses, and operations.

[Open the Rate Limiting design guide](/content/tree/interview-prep/system-design/rate-limiting)

For distributed services, an in-memory limiter is only per instance; a global quota needs shared atomic state or deliberate partitioning. Return `429 Too Many Requests` with documented retry guidance when appropriate. See also [Denial-of-Service Protection](/content/tree/api-integration/resilience/dos-protection) and [Bulkheads](/content/tree/api-integration/resilience/bulkheads).
