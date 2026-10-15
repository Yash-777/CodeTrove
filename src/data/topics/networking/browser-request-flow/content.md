# Browser request: URL → DNS → socket → TLS → HTTP → response

This page puts the concepts side by side. The phases describe a **fresh** HTTPS request; a real browser may reuse cached DNS, a connection, a TLS session, a service-worker result, or a cached redirect and skip some network activity.

![End-to-end request life cycle](networking-diagram:request-lifecycle)

| Phase | What happens | What to look for |
|---|---|---|
| 1. Parse URL | Browser separates scheme, host, port, path, query, and fragment. A `#fragment` is not sent in the HTTP request. | `https`, hostname, default port 443, request path. |
| 2. Resolve hostname | Browser/system checks caches and local resolution sources such as hosts configuration. If needed, a stub resolver asks its configured recursive resolver. The recursive resolver uses cache and, if necessary, follows root/TLD/authoritative referrals to fetch A/AAAA or CNAME data. | DNS record, answer TTL, response status, resolver. A timeout and NXDOMAIN are different. |
| 3. Select an address | The browser chooses an address from the answer, potentially considering IPv6/IPv4 and connection policy. One name can return several addresses. | Multiple A/AAAA records, CDN/geo results, IPv4/IPv6 route. |
| 4. Establish transport | For classic HTTPS over HTTP/1.1 or HTTP/2, the client connects via TCP to the destination port (usually 443). HTTP/3 uses QUIC over UDP. | TCP handshake, timing, firewalls, proxy tunnels. |
| 5. Negotiate TLS | Client sends SNI and supported parameters; server returns its certificate and proves possession of its key; client validates hostname and the certificate chain; session keys protect data. | Certificate SAN, issuer, validity, chain and browser trust. |
| 6. Send HTTP request | Only after TLS is ready does the browser send method, path/query, headers, and optionally a body. The server/application or an intermediary processes it. | Request URL, method, headers, remote address, cache state. |
| 7. Interpret response | Status and headers describe outcome. A 200 response commonly supplies the requested representation; a 3xx can include `Location` for another request. | Status, `Location`, `Cache-Control`, server/intermediary, response body. |
| 8. Follow redirects/render | The client resolves and connects to the new host if needed, repeats relevant phases, and eventually renders a body or reports an error. | Redirect chain, policy, service worker, disk/memory cache. |

## DNS lookup failure: retry is not “ask everyone”

A timeout or unreachable resolver may trigger a retry against another configured resolver or another authoritative server. An authoritative `NXDOMAIN` is a valid negative answer; clients do not normally cycle through every public DNS service hoping for a different IP. A recursive resolver can retry alternate authoritative servers on transport failure and cache a valid answer, including negative answers for a negative TTL. Positive record TTLs count down separately in caches. Local hosts configuration can override DNS resolution, and browser/system ordering varies.

## Redirect trace 1: GitHub Desktop

The exact trace supplied for this lesson:

```text
URL: -> GET https://windows.github.com/
     <- Status Code: 301 Moved Permanently (from disk cache)
     <- Response headers
          location: https://desktop.github.com/
          server: GitHub.com

     -> Request URL: GET https://desktop.github.com/
     <- Status code: 301 Moved Permanently (from disk cache)
     <- Response headers
          location: https://github.com/apps/desktop
          server: GitHub.com

Request URL: GET https://github.com/apps/desktop
Status code: 200 OK
server: github.com
```

The first two redirect responses are explicitly marked **from disk cache**. In a current navigation the browser may not contact either redirecting host on the network. When it follows `Location`, the next URL has a different hostname, so it can require another DNS answer and connection (unless already cached/reusable). The final request gets `200 OK` in the example.

## Redirect trace 2: java.com

The exact trace supplied:

```text
Request URL: GET http://java.com/
Status code: 307 Temporary Redirect
Referrer policy: strict-origin-when-cross-origin
location: https://java.com/
non-authoritative-reason: HttpsUpgrades

Request URL: GET https://java.com/
Status code: 301 Moved Permanently
location: https://www.java.com/

Request URL: GET https://www.java.com/
Status code: 302 Found
location: https://www.java.com/en/
server: cloudflare

Request URL: GET https://www.java.com/en/
Status code: 200 OK
server: cloudflare
```

The `HttpsUpgrades` reason is browser-specific/internal metadata in this trace, not a DNS response. Next, the displayed 301 redirects to `www.java.com`; the 302 adds `/en/`; then the 200 response is shown. Server names identify the responding edge/reverse-proxy layer in that trace and do not prove the application server is physically the same machine. Live responses can differ by date, browser, cache, region, or infrastructure.

## Reproduce from a terminal

```bash
curl -sS -D - -o /dev/null -L --max-redirs 10 https://windows.github.com/
curl -sS -D - -o /dev/null -L --max-redirs 10 https://java.com/
```

On Windows use `curl.exe` and replace `/dev/null` with `NUL`. `curl -L` follows server redirects but does not reproduce browser disk cache, browser-generated HTTPS upgrades, service workers, or DevTools' labels. In Chrome DevTools, open **Network**, enable **Preserve log**, and inspect request, response, and redirect entries. The client and server time stamps can help distinguish network waits from a cached response.

## References

[1]: https://www.rfc-editor.org/rfc/rfc9110 "RFC 9110: HTTP Semantics"
[2]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Redirections "MDN: Redirections in HTTP"
[3]: https://www.rfc-editor.org/rfc/rfc1034 "RFC 1034: Domain Names—Concepts and Facilities"
[4]: https://www.rfc-editor.org/rfc/rfc8446 "RFC 8446: TLS 1.3"
