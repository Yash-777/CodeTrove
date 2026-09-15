Common registered claims:

 * exp - expiration time (unix timestamp, seconds)
 * iat - issued-at time
 * iss - issuer (who created the token)
 * sub - subject (usually the user id)
 * aud - audience (intended recipient)

Most libraries reject an expired token automatically when verifying,
as long as you check "exp" - it's not enforced by the token format
itself.
