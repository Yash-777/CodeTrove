/**
 * src/data/topics/jwt.js
 * ------------------------------------------------------------------
 * Same shape/rules as java.js - see that file's header comment.
 * Covers the "JWT" category.
 */

const jwtTopics = [
  {
    slug: 'structure',
    title: 'JWT structure',
    summary: 'Header.Payload.Signature - what each part actually contains.',
    tags: ['jwt', 'security'],
    gifUrl: null,
    relatedTool: 'jwt-tool',
    body: `A JWT is 3 base64url-encoded parts joined by dots:
  header.payload.signature

Header:  { "alg": "HS256", "typ": "JWT" }
Payload: { "sub": "1234", "role": "admin", "exp": 1893456000 }
Signature: HMACSHA256(base64UrlEncode(header) + "." +
                       base64UrlEncode(payload), secretKey)

Important: the payload is only ENCODED, not encrypted. Never put secrets
in it - anyone can decode and read it. The signature only proves the
token wasn't tampered with (if they don't know the secret/private key).`,
  },
  {
    slug: 'expiry-claims',
    title: 'Standard claims (exp, iat, iss)',
    summary: 'The reserved fields most JWT libraries understand by default.',
    tags: ['jwt', 'security'],
    gifUrl: null,
    relatedTool: 'jwt-tool',
    body: `Common registered claims:
  exp - expiration time (unix timestamp, seconds)
  iat - issued-at time
  iss - issuer (who created the token)
  sub - subject (usually the user id)
  aud - audience (intended recipient)

Most libraries reject an expired token automatically when verifying,
as long as you check "exp" - it's not enforced by the token format
itself.`,
  },
];

export default jwtTopics;
