A JWT is 3 base64url-encoded parts joined by dots:

```
  header.payload.signature

Header:  { "alg": "HS256", "typ": "JWT" }
Payload: { "sub": "1234", "role": "admin", "exp": 1893456000 }
Signature: HMACSHA256(base64UrlEncode(header) + "." +
                       base64UrlEncode(payload), secretKey)
```

**Important**: the payload is only ENCODED, not encrypted. Never put secrets
in it - anyone can decode and read it. The signature only proves the
token wasn't tampered with (if they don't know the `secret/private` key).
