# Authentication in Spring Security

Authentication establishes who is making a request. Spring Security represents the result as an `Authentication` in the `SecurityContext`, with a principal, credentials (normally erased after use), and granted authorities.

Common mechanisms include form login, HTTP Basic for controlled contexts, sessions, and OAuth 2.0 resource-server bearer tokens. Select based on client type and threat model; do not invent token formats or store plaintext passwords.

**Operational concerns:** configure session-fixation protection, secure cookie attributes, password hashing, and safe failure responses. For stateless APIs, evaluate CSRF based on whether credentials are sent automatically by browsers.

**Interview points:** distinguish authentication from authorization and trace how credentials become an authenticated principal.

**Related:** [Authorization](/content/tree/backend/spring-security/authorization), [OAuth2 / JWT](/content/tree/backend/spring-security/oauth2-jwt), [Security Filters](/content/tree/backend/spring-security/security-filters).
