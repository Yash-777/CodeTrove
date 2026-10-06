# Authentication at an API Gateway

Gateway authentication verifies the caller's identity before routing an external request to an internal service. It centralizes protocol handling, coarse access checks, and edge policy, but does not make the gateway the owner of every authorization decision.

## Request flow

```text
Client -> TLS / gateway -> validate credential -> apply edge policy
	-> route with trusted identity context -> service authorization
```

For JWT access tokens, validate the signature using trusted keys and enforce issuer, audience, expiry, and allowed algorithms. For opaque tokens, an OAuth 2.0 token-introspection call can verify active status, but adds latency and a dependency. Cache key metadata carefully to support rotation without trusting stale or untrusted keys.

After validation, propagate identity using a mechanism internal services trust, such as a signed, audience-restricted token or mutually authenticated service connection. Strip client-supplied identity headers before setting trusted values. Do not forward the original bearer token to services that do not need it.

## Authentication is not complete authorization

The gateway can enforce coarse policies such as authenticated access, scopes, tenant-level quotas, and route permissions. The service that owns the resource must still enforce domain rules such as whether this user may view a specific order. Gateway checks alone are vulnerable to alternate internal paths and object-level authorization mistakes.

- Return `401 Unauthorized` when credentials are absent or invalid; include an appropriate authentication challenge where required.
- Return `403 Forbidden` when the caller is authenticated but lacks permission.
- Keep internal services private and authenticate service-to-service traffic; do not assume network location makes a caller trusted.

## Failure and operational choices

Fail closed for invalid credentials and authorization decisions. If an introspection provider is unavailable, choose an explicit availability/security policy rather than silently accepting unverified tokens. Monitor validation failures, provider latency, key refresh errors, and 401/403 rates without logging credentials. Apply request-size limits and rate limiting at the edge, with identity-aware limits after authentication.

**Pitfalls:** trusting spoofable identity headers, checking only token decoding instead of cryptographic validation, ignoring `aud`, putting resource ownership rules only in the gateway, and allowing gateway bypass routes.

**Interview points:** explain JWT validation versus introspection, trusted identity propagation, 401 versus 403, gateway/service responsibility boundaries, and behavior during identity-provider failure.

**Related:** [API Gateway Pattern](/content/tree/api-integration/api-gateway/gateway-pattern), [Rate Limiting](/content/tree/api-integration/resilience/rate-limiting), [OAuth2 / JWT](/content/tree/backend/spring-security/oauth2-jwt), [Authorization](/content/tree/backend/spring-security/authorization).
