# HTTP/HTTPS and redirects

HTTP is an application protocol: a client sends a request, and a server returns a response. The request includes a method such as `GET`, a target (path and query for HTTP/1.1), headers, and optionally a body. A response contains a status code, headers, and often a representation. In HTTPS, the HTTP exchange is protected by TLS between the relevant TLS endpoints.

![Client request path from DNS through TLS to HTTP response](networking-diagram:dns-tls-http)

## Exact walkthrough 1: GitHub Desktop

This is the trace supplied for the learning example. The first two entries say “from disk cache,” so the browser had cached redirect responses; a cached entry is not necessarily a fresh round trip to the server in this page load.

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

| Hop | Client sends | Server/cache answers | What the client does next |
|---|---|---|---|
| 1 | `GET https://windows.github.com/` | `301 Moved Permanently`, `Location: https://desktop.github.com/` | Repeats navigation for the new URL. This sample says the redirect was served from disk cache. |
| 2 | `GET https://desktop.github.com/` | `301 Moved Permanently`, `Location: https://github.com/apps/desktop` | Follows the second `Location`; also shown as a disk-cache response. |
| 3 | `GET https://github.com/apps/desktop` | `200 OK` | Stops redirecting and displays the response representation. |

A redirect is a response from one URL, not DNS “finding” another IP for that same URL. The new host can trigger a separate DNS lookup and connection. When redirects cross origins, the browser applies origin, credential, cookie, referrer, and security rules; it does not blindly copy every header.

## Exact walkthrough 2: Java.com

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

| Hop | Meaning |
|---|---|
| `http://java.com/` → 307 | The trace labels this as an `HttpsUpgrades` non-authoritative reason. In Chromium-based browsers an internal HTTPS-upgrade can be shown separately from a server-issued redirect; the actual trace and browser version matter. It is not a DNS response. |
| `https://java.com/` → 301 | A permanent redirect points to `https://www.java.com/`. `Location` contains the next URL. |
| `https://www.java.com/` → 302 | A temporary redirect points to the language path `/en/`; `server: cloudflare` identifies a responding infrastructure layer in this trace, not necessarily the application origin. |
| `https://www.java.com/en/` → 200 | Final successful response. The page body can now be rendered. |

The exact status and headers can change with cache state, region, browser version, or server configuration. Treat these as the provided teaching trace, not a guaranteed live result.

## Status codes that appear here

- **200 OK**: the request succeeded; a GET commonly carries the selected representation.
- **301 Moved Permanently**: a permanent redirect. Clients and intermediaries can cache it, so changing a redirect may not immediately affect every browser.
- **302 Found**: a temporary redirect. Historically, clients may rewrite some non-GET methods when following 301/302; use 307/308 when preserving method/body is essential.
- **307 Temporary Redirect**: temporary redirection that preserves the method and body under HTTP semantics. A browser's internal navigation upgrade can be reported in developer tools with browser-specific labels.

## Inspect the live redirect chain

On Windows with modern `curl.exe`, or on macOS/Linux:

```bash
curl -sS -D - -o /dev/null -L --max-redirs 10 https://windows.github.com/
```

Windows Command Prompt uses `NUL` instead of `/dev/null`:

```powershell
curl.exe -sS -D - -o NUL -L --max-redirs 10 https://windows.github.com/
```

`-I` sends HEAD rather than GET; some servers handle HEAD differently. `-D -` prints response headers and `-L` follows redirects. A `curl` trace does not reproduce browser cache entries, browser HTTPS-upgrade policy, or browser service workers. Use the browser Network panel with “Preserve log” enabled to compare those details.

## References

[1]: https://www.rfc-editor.org/rfc/rfc9110 "RFC 9110: HTTP Semantics"
[2]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Redirections "MDN: Redirections in HTTP"
[3]: https://developer.chrome.com/docs/devtools/network/reference/ "Chrome DevTools: Network panel"
