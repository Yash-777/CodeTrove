# Create TLS certificates locally for testing

A development server can use HTTPS on `localhost` without buying a public certificate. The browser must trust the certificate chain and the certificate must include the exact hostnames or IP addresses you open. Prefer **mkcert** for local development: it creates a local CA and issues certificates containing Subject Alternative Names (SANs). The private CA key is sensitive; keep it private, do not commit it, and do not use it for public production sites.

## Recommended workflow: mkcert

1. Install mkcert from its official project instructions for your OS, including its supported package manager or release binary.
2. Create and install the local development CA into the OS trust store used by your browser:

   ```bash
   mkcert -install
   ```

3. From your project directory, generate a certificate and private key for the names you will actually use:

   ```bash
   mkcert localhost 127.0.0.1 ::1
   ```

   This creates files similar to `localhost+2.pem` and `localhost+2-key.pem`; exact names vary. The certificate should contain each requested DNS name/IP as a SAN.

4. Configure your **local development server** to use those certificate and key files, bind only to the intended development interface, restart it, and open the matching name (for example `https://localhost:5173`). The certificate generator does not configure your web server.
5. Confirm the browser reports a valid connection. Check that the certificate SAN covers the URL hostname and that the issuing local CA appears in the trust store used by that browser.

If a browser still warns, check the exact hostname, certificate dates, SAN, server configuration, OS clock, browser trust store, and whether a VPN or enterprise policy is changing trust. Do not “solve” the warning by installing an unknown CA.

## Alternative: one self-signed OpenSSL certificate

For a short-lived local test, create a private key and a leaf certificate that includes SANs. This is not generally trusted by browsers unless you separately install and trust it; trusting a leaf directly is less convenient than using a dedicated local CA.

```bash
openssl req -x509 -newkey rsa:2048 -sha256 -days 30 -nodes \
  -keyout localhost-key.pem -out localhost-cert.pem \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1"
```

Configure the development server with `localhost-cert.pem` and `localhost-key.pem`, then test only on your local environment. Modern browsers rely on SAN for hostname verification; a common name by itself is not enough. This certificate does not have a trusted CA chain, so a browser warning is expected unless you explicitly add a suitable trust relationship.

## Why Chrome asks for trust or shows a warning

A self-signed certificate is signed by itself; the browser has no reason to trust that signer by default. With mkcert, the developer CA is installed locally, so certificates it signs can be trusted by that browser/OS store. The trust applies to the signing CA, which is powerful; keep its private key safe and remove the CA when finished if it is no longer needed. Managed-device policy can override local behavior. If Chrome offers an “Advanced” bypass for a local test, that bypass only suppresses the warning for that navigation; it does not make the certificate correctly trusted and is not a good deployment fix. Some error classes or policies cannot be bypassed.

## Verify the certificate

```bash
openssl x509 -in localhost-cert.pem -noout -subject -issuer -dates -ext subjectAltName
```

To inspect a running local TLS server:

```bash
openssl s_client -connect localhost:5173 -servername localhost -showcerts
```

Use the port your server actually listens on. The certificate file names and paths vary; avoid placing private keys in a public web directory or source repository.

## References

[1]: https://github.com/FiloSottile/mkcert "mkcert project and installation instructions"
[2]: https://letsencrypt.org/docs/certificates-for-localhost/ "Let's Encrypt: localhost certificates"
[3]: https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security "MDN: Transport Layer Security"
