# Proxy servers: forward vs reverse

A **proxy** is an intermediary that receives a client's request and makes or routes a request on its behalf. The words *forward* and *reverse* describe which side the proxy represents in the system design. Both can cache, authenticate, filter, log, transform traffic, or conceal an address, but those capabilities depend on configuration and protocol. A proxy is not automatically encrypted or anonymous.

![Forward proxy represents clients; reverse proxy represents origin servers](networking-diagram:proxy-comparison)

## Learn each direction

- **Forward proxy**: clients are configured to send outbound requests through it. It may enforce an organization's browsing policy, provide controlled egress, authenticate users, or cache responses. The remote server sees the proxy as the network peer, though forwarded headers can disclose client information if configured to do so.
- **Reverse proxy**: clients address the proxy as the public service endpoint. It routes requests to one or more backend services and may terminate TLS, load-balance, apply Web Application Firewall rules, cache content, or centralize observability.

The accompanying lessons include text diagrams and concrete flow examples. The supplied Code & Fun PDF covers the same client→forward-proxy→Internet and client→reverse-proxy→application-server contrasts; the code examples are explained conceptually rather than copied as a substitute for production-ready, secure proxy configuration.

## Do not confuse proxy with every intermediary

A NAT gateway rewrites network addresses; it is not necessarily an HTTP proxy. A DNS resolver answers names; it is not an HTTP proxy. A load balancer may operate at layer 4 or layer 7 and can be implemented alongside a reverse proxy. A VPN carries traffic through a tunnel but is not necessarily an application-layer proxy. A TLS-intercepting enterprise proxy can inspect traffic only under specific client trust and policy arrangements and should be disclosed and authorized.

## References

[1]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Proxy_servers_and_tunneling "MDN: Proxy servers and tunneling"
[2]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Proxies "MDN: Proxies"
