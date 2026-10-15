# TLS/SSL: authenticate a server and protect the connection

**TLS (Transport Layer Security)** protects data in transit and can authenticate a server using certificates. “SSL” is the older predecessor; modern web connections should use TLS, even though interfaces still say “SSL certificate.” HTTPS is HTTP carried inside TLS. TLS protects confidentiality and integrity between the TLS endpoints, but does not prove that a website's content is honest or that an endpoint is uncompromised.

![TLS handshake and certificate trust chain](networking-diagram:tls-trust)

## What the browser verifies

For `https://www.example.com`, the browser typically validates that the certificate is within its validity period, the requested hostname is covered by a Subject Alternative Name, the certificate chains through valid signatures to a trusted root CA, constraints and key usage are appropriate, and revocation/status checks satisfy policy. The server proves possession of the private key associated with the certificate during the handshake. TLS negotiates cryptographic parameters and establishes keys; HTTP data is sent only after the channel is ready.

A public **Certificate Authority (CA)** verifies control of domain names under a certificate-issuance method, then signs a certificate. The browser/OS ships or receives trusted root certificates. Intermediates link the server certificate to a trusted root. Servers should present the leaf certificate and necessary intermediate certificates; the root is normally already in the trust store. A CA signature is not a guarantee that a site is benevolent—it binds an identity to a key under the CA's validation rules.

If name, dates, chain, usage, or policy checks fail, the browser displays a warning. A warning should be investigated, not clicked through for an unknown site: an attacker, captive portal, incorrect server, expired certificate, or incorrect local clock could be involved. Some browsers or managed policies prevent bypass for certain errors.

## TLS, HTTPS, and the request order

The client first needs the destination IP, then opens a transport connection, then negotiates TLS using the intended server name (SNI) and supported versions. The server presents a certificate; the client validates it; keys are negotiated; and only then does the client send the HTTP request through the encrypted channel. A TLS session can be resumed and an already-open connection reused, so these phases do not necessarily repeat on every page load.

## Inspect a public certificate

On macOS/Linux or Windows with OpenSSL installed:

```bash
openssl s_client -connect example.com:443 -servername example.com -showcerts
```

The `-servername` option supplies SNI. This command diagnoses the certificate chain and TLS negotiation from the machine where it runs; it does not itself prove the browser uses the same trust store or network route.

## Local test certificates

Use the separate **Local TLS testing** lesson for a safe, reproducible `mkcert` workflow and a self-signed OpenSSL alternative. A locally issued certificate is only trusted if its issuing local CA is installed in the trust store used by the browser. Trust only a CA you created and control; never install an unknown root CA to “fix” an error. Do not deploy development certificates or a private local root CA to production.

## References

[1]: https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security "MDN: Transport Layer Security"
[2]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview "MDN: HTTP overview"
[3]: https://www.rfc-editor.org/rfc/rfc8446 "RFC 8446: TLS 1.3"
[4]: https://letsencrypt.org/how-it-works/ "Let's Encrypt: How it works"
[5]: https://support.google.com/chrome/a/answer/3505249?hl=en "Chrome Enterprise: manage trusted certificates"
