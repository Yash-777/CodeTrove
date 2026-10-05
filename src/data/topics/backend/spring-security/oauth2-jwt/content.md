# OAuth 2.0 Resource Server and JWT

An OAuth 2.0 resource server accepts access tokens and enforces their scopes or authorities. JWT is a token format, not an authorization protocol by itself. Spring Security can validate bearer JWTs using issuer metadata or configured keys and map claims to authorities.

Validate the signature and expected issuer; enforce expiration and, when required, audience and allowed algorithms. Use a maintained resource-server integration rather than hand-parsing tokens. Key rotation and JWKS availability are operational concerns.

**Pitfalls:** trusting decoded claims before signature validation, accepting tokens for another audience, logging bearer tokens, and assuming JWT revocation is immediate. Keep tokens short-lived and define key/issuer policy deliberately.

**Interview points:** distinguish access and ID tokens, explain issuer/audience/signature validation, and discuss key rotation and revocation trade-offs.

**Related:** [Authentication](/content/tree/backend/spring-security/authentication), [Authorization](/content/tree/backend/spring-security/authorization).
