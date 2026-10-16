# Reverse proxy: public edge in front of servers

A **reverse proxy** is the client-facing endpoint for one or more origin servers. The client connects to the public hostname; the reverse proxy selects a backend and forwards the request. Backend systems can remain on private addresses, but their protection depends on network rules and correct proxy configuration.

![A reverse proxy terminates client connections and routes to backend services](networking-diagram:reverse-proxy)

## Example flow

1. A browser resolves `app.example.com` to a load-balanced public address and opens TLS to the reverse-proxy tier.
2. The reverse proxy presents the public certificate, validates or routes the request, and selects a healthy backend (for example, `app-2` for `/api/`).
3. It forwards the request over a separately configured connection. That backend hop may also use TLS. The proxy may pass controlled metadata such as `Forwarded` or `X-Forwarded-For`.
4. The backend response returns through the proxy, which sends the response to the client.

A reverse proxy can centralize TLS termination, routing, load balancing, compression, caching, rate limits, WAF rules, and access logs. It can also introduce failure modes: the proxy's health, routing rules, timeouts, header handling, and connection limits matter.

## Header trust boundary

Never trust an incoming `X-Forwarded-For` or `Forwarded` header from arbitrary clients. The edge should replace or append forwarding headers according to a documented chain, and the application should trust only known proxy IPs. Otherwise a user can spoof client IP information used for security, auditing, or rate limits. Do not expose an internal backend port directly if it is meant to accept traffic only from the proxy.

## Reverse proxy vs load balancer

A reverse proxy usually understands application requests (for example, HTTP paths and headers). A load balancer may select a backend based only on transport connections or may also operate at layer 7. Many products provide both roles; the names describe functions, not necessarily separate boxes.

## References

[1]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Proxy_servers_and_tunneling "MDN: Proxy servers and tunneling"
[2]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Forwarded "MDN: Forwarded header"
[3]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For "MDN: X-Forwarded-For header"
