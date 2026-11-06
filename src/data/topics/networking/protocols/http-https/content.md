# HTTP vs HTTPS, URL, and HTTP Status Codes

HTTP is an application-layer request–response protocol. A client sends a request and a server, proxy, gateway, cache, or CDN returns a response. HTTPS uses the same HTTP semantics inside a TLS-protected connection.

> **Reading path:** URL → HTTP vs HTTPS → request lifecycle → HTTP/1.0 and HTTP/1.1 → redirect hop tables → status codes (1xx to 5xx, expandable) → debugging examples.

## 1. URL: the address of a resource

<details open><summary><b>What Is a URL?</b></summary>

 A **Uniform Resource Locator (URL)**, also called a web address, is the address of a resource on the web ([MDN: What is a URL?](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL)).

It tells the browser where to find a resource and how to access it. A URL can point to a web page, a file, or even an email address (`mailto:`).

#### Main Components of a URL

```text
https://user:pass@blog.example.com:8443/docs/page.html?search=term#history
└─┬──┘   └──┬───┘ └──────┬───────┘└─┬─┘└──────┬──────┘└────┬────┘└──┬───┘
scheme   userinfo       host      port      path        query   fragment
```

- **Scheme / Protocol:** Tells the browser how to connect, such as `https://` or `http://`.
- **Userinfo:** Optional credentials before the host (`user:pass@`). Deprecated for HTTP and rarely used.
- **Host:** The server name. It is a domain name such as `blog.example.com`, or an IP address.
  - **Subdomain:** An optional part before the main domain, such as `www.` or `blog.`.
  - **Domain name:** The main name of a website, such as `example.com`.
  - **Top-level domain (TLD):** The extension at the end, such as `.com`, `.org` or `.gov`.
- **Port:** Optional. It defaults to `80` for HTTP and `443` for HTTPS.
- **Path:** Identifies a page, folder or file on the site, such as `/wiki/URL`.
- **Query parameters:** Extra information for the server, starting with `?`, such as `?search=term`.
- **Fragment / anchor:** Points to a section of the page, starting with `#`, such as `#History`.

| URL Anatomy: A Visual Guide | URL Structure Explained |
| :-- | :-- |
| ![Diagram of the parts of a URL](/public/images/URL%20Anatomy_%20A%20Visual%20Guide.png) | ![Diagram explaining URL structure](/public/images/URL%20Structure%20Explained.png) |

</details>

<details><summary>URL examples: absolute, relative, query, fragment, encoding, and browser state</summary>

An absolute URL works without surrounding context:

```text
https://developer.mozilla.org/en-US/docs/Web/HTTP
```

A relative URL is resolved against the current document's URL:

```text
/images/logo.png
../api/users
```

Query values should be encoded. The [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL) and [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) APIs do it for you:

```js
const url = new URL('https://api.example.com/search');
url.searchParams.set('q', 'HTTP status codes');
url.searchParams.set('page', '2');
console.log(url.toString());
// https://api.example.com/search?q=HTTP+status+codes&page=2
```

A fragment such as `#redirects` is handled by the browser after the response arrives. It is **not** sent to the server and is not part of the request target.

### Browser state: cookies vs web storage

| | Cookies | `localStorage` | `sessionStorage` |
|---|---|---|---|
| Sent to the server automatically | **Yes**, in the `Cookie` request header | No | No |
| Scope | Domain and path rules (plus `Secure`, `SameSite`) | One origin (scheme + host + port) | One origin, **per tab** |
| Lifetime | Session, or until `Expires` / `Max-Age` | Until cleared | Until the tab closes |
| Typical size | About 4 KB per cookie | About 5 MB per origin | About 5 MB per origin |

The [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) adds `window.localStorage` and `window.sessionStorage`. Each returns a `Storage` object for setting, reading and removing items, with a separate store for each origin. Cookies are read and written through [`document.cookie`](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie), which acts as a getter and setter.

```js
localStorage.setItem('colorSetting', '#a4509b');

document.cookie = 'yummy_cookie=choco; path=/; max-age=3600; SameSite=Lax; Secure';
```

`HttpOnly` cookies cannot be created or read from JavaScript. Only a `Set-Cookie` response header can set them. Never store tokens or secrets in `localStorage`, because any script on the page can read it.

</details>

## 2. HTTP versus HTTPS

| Property | HTTP | HTTPS |
|---|---|---|
| Scheme and port | `http://`, usually 80 | `https://`, usually 443 |
| Transport protection | Bytes can be observed or changed in transit. | TLS provides encryption and integrity protection between TLS endpoints. |
| Certificate | Not required. | Client validates hostname, validity, chain, and trust policy. |
| Production use | Legacy, local, or deliberately public non-sensitive traffic. | Normal production websites and APIs. |

```mermaid
sequenceDiagram
    participant Browser
    participant DNS as DNS resolver
    participant Server as HTTPS server
    Browser->>Browser: Parse URL and check cache/service worker
    Browser->>DNS: Resolve hostname
    DNS-->>Browser: Return A/AAAA address
    Browser->>Server: Establish TCP or QUIC transport
    Server-->>Browser: Negotiate TLS and prove certificate identity
    Browser->>Server: Send encrypted HTTP request
    Server-->>Browser: Return HTTP response
    Browser->>Browser: Render, cache, or follow Location
```

<details><summary>What HTTPS protects and what it does not</summary>

HTTPS protects confidentiality and integrity in transit and helps authenticate the requested hostname. It does not fix authorization bugs, XSS, CSRF, injection, leaked credentials, unsafe application logic, or a compromised server.

</details>

## HTTP: Request–Response Protocol

HTTP is a request–response protocol in the client–server model. The client, such as a web browser, sends an HTTP request message to a server hosting a website or application. The server provides resources like HTML files or performs work on the client's behalf, then returns a response message. The response carries a status code and, where applicable, the requested content in its message body.

**References**

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [RFC 9112: HTTP/1.1 Message Syntax](https://www.rfc-editor.org/rfc/rfc9112)
- [MDN: An overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)
- [MDN: HTTP messages](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages)
- [Wikipedia: HTTP](https://en.wikipedia.org/wiki/HTTP)

| Part | Request | Response |
|------|---------|----------|
| Start line | `POST /users HTTP/1.1` | `HTTP/1.1 201 Created` |
| Header | `Host: api.example.com` | `Content-Type: application/json` |
| Header | `Accept: application/json` | `Location: /users/42` |
| Header | `Content-Type: application/json` | |
| Header | `Authorization: Bearer <token>` | |
| Body | `{"name":"Ada","email":"ada@example.com"}` | `{"id":42,"name":"Ada"}` |

### Start line breakdown

| Message | Field | Value | Meaning |
|---------|-------|-------|---------|
| Request | Method | `POST` | Action to perform |
| Request | Target | `/users` | Resource path |
| Request | Version | `HTTP/1.1` | Protocol version |
| Response | Version | `HTTP/1.1` | Protocol version |
| Response | Status code | `201` | Resource created |
| Response | Reason phrase | `Created` | Human-readable status text |

## 3.1 HTTP Methods

`HTTP/1.0` defined `GET`, `HEAD` and `POST`. `HTTP/1.1` added `OPTIONS`, `PUT`, `DELETE`, `TRACE` and `CONNECT`. `PATCH` was standardized later in RFC 5789.

**References**

- [RFC 1945: HTTP/1.0](https://www.rfc-editor.org/rfc/rfc1945)
- [RFC 2068: HTTP/1.1 (original)](https://www.rfc-editor.org/rfc/rfc2068)
- [RFC 2616: HTTP/1.1 (revised)](https://www.rfc-editor.org/rfc/rfc2616)
- [RFC 5789: PATCH Method for HTTP](https://www.rfc-editor.org/rfc/rfc5789)
- [RFC 9110: HTTP Semantics (current)](https://www.rfc-editor.org/rfc/rfc9110)
- [MDN: HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)

| Method | Typical purpose | Important note |
|---|---|---|
| `GET` | Read a representation. | Usually safe and idempotent. |
| `HEAD` | Read headers without a response body. | May be handled differently from `GET`. |
| `POST` | Submit data or trigger processing. | Retries may repeat the operation. |
| `PUT` | Create or replace a known target. | Intended to be idempotent. |
| `PATCH` | Apply a partial modification. | Idempotency depends on design. |
| `DELETE` | Remove a resource. | Intended to be idempotent. |
| `OPTIONS` | Discover options and CORS behavior. | Common preflight method. |
| `TRACE` | Diagnostic loop-back. | Usually disabled in production. |
| `CONNECT` | Establish a proxy tunnel. | Common for HTTPS tunneling. |

<details>
<summary>Marshalling, unmarshalling, and a Java response example</summary>

**Marshalling** converts an in-memory object into a transfer format such as JSON or XML. **Unmarshalling** converts that representation back into an object. Whichever side sends data marshals it, and whichever side receives it unmarshals it.

| Side | Request | Response |
|---|---|---|
| Client | Marshals object to JSON | Unmarshals JSON to object |
| Server | Unmarshals JSON to object | Marshals object to JSON |

```java
@RestController
public class UserController {

    @PostMapping("/users")
    public ResponseEntity<User> create(@RequestBody User user) {   // unmarshal: JSON -> User
        User saved = userService.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved); // marshal: User -> JSON, 201 Created
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return userRepository.findById(id)
            .map(ResponseEntity::ok)                               // 200 OK, User marshalled to JSON
            .orElseGet(() -> ResponseEntity.notFound().build());   // 404 Not Found, no body
    }
}
```

An API often returns two kinds of codes. The **HTTP status code** is in the status line and is understood by browsers, proxies and clients. The **application code** is in the JSON body and carries business-level detail. Keep them separate. The enum below mixes the two, so the first three entries reuse HTTP codes and the last two are custom.

```java
@AllArgsConstructor
@Getter
public enum APIStatusCodes { // Global exceptions
    SUCCESS("200", "Success."),
    HTTP_METHOD_NOT_SUPPORTED("405", "Http Method Not Supported."),
    INTERNAL_SERVER_ERROR("500", "Internal Server Error."),

    // Custom application codes (not HTTP status codes)
    GENERIC_OR_UNKNOWN_ERROR("4001", "Generic Or Unknown Error."),
    REQUIRED_FIELDS_VALIDATION_ERRORS("1001", "Some Required Fields are Blank.");

    private final String code;
    private final String message;
}
```

In Spring, `HttpMessageConverter` implementations (Jackson for JSON, JAXB for XML) do this work. The `Content-Type` and `Accept` headers decide which format is used.

**Is marshalling the same as serialization?** They overlap, but they are not identical:

| | Serialization | Marshalling |
|---|---|---|
| Meaning | Turning an object's state into a byte or text stream | Preparing an object for transfer between systems or processes |
| Scope | General term (JSON, Protobuf, Java `Serializable`) | Common in HTTP, REST, RPC and XML binding (JAXB) |
| Java built-in | `java.io.Serializable` is Java-specific | Often implemented with JSON or XML binding libraries |

**References**

- [Spring: HTTP Message Conversion](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/message-converters.html)
- [Jackson databind](https://github.com/FasterXML/jackson-databind)
- [Oracle: `java.io.Serializable`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Serializable.html)
- [Wikipedia: Marshalling (computer science)](https://en.wikipedia.org/wiki/Marshalling_(computer_science))

</details>

## 4. HTTP/1.0 and HTTP/1.1

<details>
<summary>HTTP/1.0: simple request/response and connection close</summary>

HTTP/1.0 is described in [RFC 1945](https://www.rfc-editor.org/rfc/rfc1945). It defines `GET`, `HEAD` and `POST`.

```http
GET /index.html HTTP/1.0

```

The blank line ends the headers. A request with no body has nothing after it.

| Feature | HTTP/1.0 |
|---|---|
| Request line | Method, target and `HTTP/1.0`. |
| `Host` | Not defined by the specification. Some clients sent it anyway, but a server could not rely on it. |
| Connection reuse | Closes after each response. Keep-alive existed only as an unofficial `Connection: keep-alive` extension. |
| Framing | The body ends at `Content-Length` or when the server closes the connection. No chunked transfer coding. |
| Caching | Basic: `Expires`, `Last-Modified`, `If-Modified-Since`. |
| Effect | A page with many resources needs many TCP (and TLS) handshakes. |

</details>

<details>
<summary>HTTP/1.1: persistent connections and Host routing</summary>

HTTP/1.1 was first published as [RFC 2068](https://www.rfc-editor.org/rfc/rfc2068), then revised as [RFC 2616](https://www.rfc-editor.org/rfc/rfc2616). It is now specified by [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (semantics) and [RFC 9112](https://www.rfc-editor.org/rfc/rfc9112) (message syntax and connections).

```http
GET /index.html HTTP/1.1
Host: example.com
Accept: text/html

```

| Feature | HTTP/1.1 |
|---|---|
| Request line | Method, target and `HTTP/1.1`. |
| `Host` | Required, so one IP can serve many hostnames. A request without it gets `400 Bad Request`. |
| Connection reuse | Persistent by default. `Connection: close` asks the server to close after the response. |
| Framing | Adds [chunked transfer coding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Transfer-Encoding), so a body can be streamed without knowing its length. |
| Methods | Adds `OPTIONS`, `PUT`, `DELETE`, `TRACE` and `CONNECT`. |
| Caching | Adds validators and directives such as `ETag`, `If-None-Match` and `Cache-Control`. |
| Conditional response | Can return `304 Not Modified` so the client reuses its cached copy. |
| Other additions | Range requests (`206 Partial Content`), `Expect: 100-continue`, content negotiation. |
| Pipelining | Defined, but hard to deploy: responses must stay in order, so one slow response blocks the rest (head-of-line blocking). Browsers disable it by default. |

</details>

**Beyond HTTP/1.1.** [HTTP/2](https://www.rfc-editor.org/rfc/rfc9113) adds binary framing and multiplexing, so many requests share one connection. [HTTP/3](https://www.rfc-editor.org/rfc/rfc9114) runs over QUIC instead of TCP. Methods, URLs, headers and status codes keep the same semantics.

## 5. Request lifecycle and flow table

```mermaid
sequenceDiagram
    participant Client
    participant Cache as Browser/cache
    participant DNS
    participant Origin as Server or proxy
    Client->>Cache: Parse URL and check cached/service-worker result
    alt Fresh cached result
        Cache-->>Client: Return cached response
    else Network request
        Client->>DNS: Resolve hostname
        DNS-->>Client: Return address
        Client->>Origin: Open/reuse transport and send HTTP request
        Origin-->>Client: Return status, headers, and body
        alt 3xx with Location
            Client->>Client: Resolve next URL and repeat relevant steps
        else Final response
            Client->>Client: Render or process representation
        end
    end
```

| Phase | What happens | What to inspect |
|---|---|---|
| 1. Parse URL | Separate scheme, host, port, path, query, fragment. | Fragment is not sent to server. |
| 2. Check local results | Check browser cache, service worker, hosts file, resolver cache. | Freshness and cache state. |
| 3. Resolve hostname | Ask recursive DNS for A/AAAA/CNAME data. | TTL, NXDOMAIN versus timeout. |
| 4. Establish transport | Reuse or create TCP; HTTP/3 may use QUIC. | Handshake, proxy, firewall, timing. |
| 5. Negotiate TLS | Authenticate endpoint and establish session keys for HTTPS. | SAN, issuer, validity, trust chain. |
| 6. Send request | Send method, path/query, headers, optional body. | URL, method, headers, remote address. |
| 7. Read response | Interpret status, headers, and body. | Status, `Location`, cache headers, trace ID. |
| 8. Redirect or render | Follow a safe redirect or process final representation. | Count, method preservation, final response. |

## 6. Redirect Walkthroughs with Network Detail

> Teaching traces. Live results can change with cache, browser, CDN, region, and server configuration.

A redirect is an HTTP response (`3xx` plus a `Location` header), not DNS finding another IP for the same URL. Each new hostname may need its own DNS, TCP and TLS work, unless the answer comes from cache or an existing connection is reused.

<details>
<summary>GitHub Desktop: 301 → 301 → 200</summary>

| Hop | Client sends | Server/cache answers | Network work (cold cache) | Network work (this trace) | Next |
|---:|---|---|---|---|---|
| 1 | `GET https://windows.github.com/` | `301 Moved Permanently`, `Location: https://desktop.github.com/` | DNS for `windows.github.com`, TCP to `:443`, TLS (SNI, ALPN), HTTP exchange | None. Served from disk cache. | Request `https://desktop.github.com/` |
| 2 | `GET https://desktop.github.com/` | `301 Moved Permanently`, `Location: https://github.com/apps/desktop` | New hostname: DNS, TCP and TLS again, unless an HTTP/2 connection can be reused | None. Served from disk cache. | Request the GitHub URL |
| 3 | `GET https://github.com/apps/desktop` | `200 OK` | New hostname: DNS, TCP, TLS, then HTTP exchange with the body | Real network request, because the final `200 OK` is not served from the redirect cache | Stop redirecting and render |

A cold chain costs about three DNS lookups, three TCP and TLS setups, and three HTTP round trips, which is why cached `301 Moved Permanently` responses noticeably speed up repeat visits.

</details>

<details>
<summary>Java.com: 307 → 301 → 302 → 200</summary>

| Hop | Client sends | Server/cache answers | Network work | Next |
|---:|---|---|---|---|
| 1 | `GET http://java.com/` | `307 Temporary Redirect`, `Location: https://java.com/` (browser-generated HTTPS upgrade) | None. The browser rewrites the URL internally, so no packet is sent for this hop. | Retry over HTTPS |
| 2 | `GET https://java.com/` | `301 Moved Permanently`, `Location: https://www.java.com/` | DNS for `java.com`, TCP to `:443`, TLS handshake, HTTP exchange | Follow the permanent host change |
| 3 | `GET https://www.java.com/` | `302 Found`, `Location: https://www.java.com/en/`, `server: cloudflare` | New hostname: DNS, TCP and TLS (reuse only if the same server and certificate cover both names), then HTTP exchange | Request the language path |
| 4 | `GET https://www.java.com/en/` | `200 OK`, `server: cloudflare` | Same host as hop 3, so the existing connection is reused (keep-alive or HTTP/2). Only the HTTP exchange is needed. | Render the final response |

Key points:

- Hop 1 is not a server response. `non-authoritative-reason: HttpsUpgrades` is browser metadata, and a plain `curl http://java.com/` may show a different first hop.
- Hop 4 is cheaper than hop 3 because the path changes but the host does not.
- `301 Moved Permanently` is permanent and cacheable. `302 Found` is temporary, so clients normally re-check it.

</details>

<details>
<summary>AWS infrastructure: 301 → target URL</summary>

| Hop | Client sends | Server/cache answers | Network work | Next |
|---:|---|---|---|---|
| 1 | `GET https://infrastructure.aws/` | `301 Moved Permanently`, `Location: https://aws.amazon.com/about-aws/global-infrastructure/regions_az/` | DNS for `infrastructure.aws` (a vanity domain under the `.aws` TLD), TCP to `:443`, TLS handshake, HTTP exchange | Request the target URL |
| 2 | `GET https://aws.amazon.com/about-aws/global-infrastructure/regions_az/` | Not shown in the trace. It may return `200 OK` or redirect again. | New hostname: DNS, TCP and TLS for `aws.amazon.com`, then HTTP exchange | Follow any further redirects, then render |

A vanity domain like this is typically a redirect-only host. Its server exists just to answer with a `Location` header, so the first connection is pure overhead until the `301 Moved Permanently` is cached.

</details>

<details>
<summary>Additional URL examples: 404, 405 and 401</summary>

| Example | Request | Status | Why it happens |
|---|---|---|---|
| Missing page | `GET https://yash-777.github.io/` | `404 Not Found` | No GitHub Pages site is published at this address. Live responses can change. |
| Wrong method | `POST https://github.com` | `405 Method Not Allowed` | The resource exists, but it does not accept `POST`. The `allow` header lists what it does accept. |
| Missing credentials | `GET https://chatgpt.com/backend-api/conversation/<conversation_id>/interpreter/download?...` | `401 Unauthorized` | The request carries no access token, so the server cannot identify the caller. |

**1. `404 Not Found`: the URL maps to nothing**

```text
GET https://yash-777.github.io/
<- 404 Not Found
```

The server was reached and answered normally. It simply has no content for that host and path. This is a successful network exchange with a "nothing here" result, not a connection failure.

**2. `405 Method Not Allowed`: right URL, wrong method**

```bash
curl -i -X POST "https://github.com" \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

```text
HTTP/2 405 Method Not Allowed
allow: GET, PATCH, DELETE
```

The `allow` header tells the client which methods the resource supports. RFC 9110 requires a `405` response to include it. Unlike `404 Not Found`, the resource exists. Only the method is rejected.

**3. `401 Unauthorized`: authentication missing or invalid**

```text
GET https://chatgpt.com/backend-api/conversation/<conversation_id>/interpreter/download
    ?download_intent=true&message_id=<message_id>&sandbox_path=%2Fmnt%2Fdata%2FCodeTrove_WebSockets_Infographic.gif

<- 401 Unauthorized
   {"detail":{"message":"Unauthorized - Access token is missing"}}
```

The server could not identify the caller. The fix is to send valid credentials, usually an `Authorization: Bearer <token>` header. Despite the name, `401` is about authentication (who you are). A `403 Forbidden` means the server knows who you are and still refuses.

### Network detail

| Status | DNS, TCP, TLS | Request reaches the app? | Client fix |
|---|---|---|---|
| `404 Not Found` | Completed normally | Yes, but no resource matches | Fix the URL, or publish the content |
| `405 Method Not Allowed` | Completed normally | Yes, method rejected | Use a method listed in `allow` |
| `401 Unauthorized` | Completed normally | Yes, no valid credentials | Send a valid token or login |

**References**

- [RFC 9110, Section 15.5.2: 401 Unauthorized](https://www.rfc-editor.org/rfc/rfc9110#section-15.5.2)
- [RFC 9110, Section 15.5.5: 404 Not Found](https://www.rfc-editor.org/rfc/rfc9110#section-15.5.5)
- [RFC 9110, Section 15.5.6: 405 Method Not Allowed](https://www.rfc-editor.org/rfc/rfc9110#section-15.5.6)
- [MDN: 401 Unauthorized](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401)
- [MDN: 404 Not Found](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404)
- [MDN: 405 Method Not Allowed](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405)

</details>

## 7. Status-code classes 

HTTP response status codes are issued by a server in response to a client's request. The first digit of the three-digit code defines its class.

| Class | Range | Meaning | Common examples |
|---|---:|---|---|
| [`1xx`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#information_responses) | 100–199 | Informational: request received, processing continues. | `100 Continue`, `101 Switching Protocols` |
| [`2xx`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#successful_responses) | 200–299 | Success: request was received, understood and accepted. | `200 OK`, `201 Created`, `204 No Content` |
| [`3xx`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#redirection_messages) | 300–399 | Redirection: further action is needed to complete the request. | `301 Moved Permanently`, `302 Found`, `304 Not Modified` |
| [`4xx`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#client_error_responses) | 400–499 | Client error: the request is invalid or cannot be fulfilled. | `400 Bad Request`, `401 Unauthorized`, `404 Not Found` |
| [`5xx`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#server_error_responses) | 500–599 | Server error: the server failed to fulfil a valid request. | `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable` |

A code is not the entire diagnosis. Inspect method, URL, headers, response body, `Location`, cache, intermediary, trace ID, and logs.

**References**

- [MDN: HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [RFC 9110, Section 15: Status Codes](https://www.rfc-editor.org/rfc/rfc9110#section-15)
- [IANA: HTTP Status Code Registry](https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml)
- [Wikipedia: List of HTTP status codes](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes)

## 7A. Every status code — expandable reference

The summary tables are followed by one expandable section for every code covered here. Framework, vendor, and provider-specific values are labelled as such.

<details>
<summary>1xx — informational: expand every code</summary>

**Informational 1xx: the request was received, continuing process.** A `1xx` is a provisional (interim) response, defined in [RFC 9110, Section 15.2](https://www.rfc-editor.org/rfc/rfc9110#section-15.2). It is sent before the final response, consists of a status line and optional headers, and ends with an empty line. A client may receive several `1xx` responses before the final one. HTTP/1.0 defines no `1xx` codes, so a server must not send them to an HTTP/1.0 client.

| Code | Reason phrase | Typical use |
|---:|---|---|
| [`100`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/100) | Continue | Client may send the request body after the server accepts the headers (used with `Expect: 100-continue`) |
| [`101`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/101) | Switching Protocols | Server agrees to an `Upgrade`, for example to WebSocket |
| [`102`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/102) | Processing | Deprecated WebDAV interim response: the server is still working on a long request |
| [`103`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/103) | Early Hints | Sends early `Link` headers ([RFC 8297](https://www.rfc-editor.org/rfc/rfc8297)) so the browser can start `preload` or `preconnect` before the final response |
| `104` | Upload Resumption Supported | Temporary registered extension for resumable uploads; support is not universal (see the [IANA registry](https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml)) |

</details>

<details>
<summary>2xx — successful: expand every code</summary>

**Successful 2xx: the request was successfully received, understood, and accepted.** This class of status code is defined in [RFC 9110, Section 15.3](https://www.rfc-editor.org/rfc/rfc9110#section-15.3).

| Code | Reason phrase | Typical use |
|---:|---|---|
| [`200`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200) | OK | The request succeeded. The response body depends on the method (`GET` returns the resource, `POST` returns the result of the action). |
| [`201`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/201) | Created | A new resource was created. Usually includes a `Location` header. |
| [`202`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/202) | Accepted | The request was accepted for asynchronous processing, which may not be complete yet. |
| [`203`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/203) | Non-Authoritative Information | The response came from a transforming proxy or a third-party copy, not the origin server. |
| [`204`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204) | No Content | The operation succeeded and there is no response body. Common for `DELETE` and `PUT`. |
| [`205`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/205) | Reset Content | The client should reset its view, such as clearing a form. |
| [`206`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206) | Partial Content | The requested byte range was returned (used with the `Range` header, for resumable downloads and media seeking). |
| [`207`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/207) | Multi-Status | WebDAV ([RFC 4918](https://www.rfc-editor.org/rfc/rfc4918)): the body describes the result for multiple resources. |
| [`208`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/208) | Already Reported | WebDAV ([RFC 5842](https://www.rfc-editor.org/rfc/rfc5842)): members already listed earlier in the response are not repeated. |
| `218` | This Is Fine | Unofficial Apache (`mod_http_protocol`-style) convention. Not in the [IANA registry](https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml); don't use it in public APIs. |
| [`226`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/226) | IM Used | Delta encoding ([RFC 3229](https://www.rfc-editor.org/rfc/rfc3229)): the `GET` response is the result of instance manipulations applied to the current instance. |

</details>

<details>
<summary>3xx — redirection: expand every code</summary>

**Redirection 3xx: further action needs to be taken to complete the request.** This class of status code, defined in [RFC 9110, Section 15.4](https://www.rfc-editor.org/rfc/rfc9110#section-15.4), tells the client that it must take another step, usually by following the `Location` header, to fulfil the request. Clients should detect and stop redirect loops. Browsers typically cap the chain at around 20 hops, and some other clients use lower limits.

| Code | Reason phrase | Typical use |
|---:|---|---|
| [`300`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/300) | Multiple Choices | More than one representation or target is available. The server may name a preferred one in `Location`. Rarely used in practice. |
| [`301`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/301) | Moved Permanently | The resource has a new permanent URL in `Location`. Cacheable by default. Clients may change `POST` to `GET`. |
| [`302`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302) | Found | The resource is temporarily at another URL. Clients may change `POST` to `GET`. |
| [`303`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/303) | See Other | Fetch the target with `GET`. Common after a `POST` (the Post/Redirect/Get pattern). |
| [`304`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304) | Not Modified | Reply to a conditional request (`If-None-Match`, `If-Modified-Since`). Reuse the cached copy. It has no body and no `Location`, so it is not a true redirect. |
| [`305`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/305) | Use Proxy | Deprecated because of security concerns. Don't use it. |
| `306` | Unused | Reserved and no longer used (see [RFC 9110, Section 15.4.7](https://www.rfc-editor.org/rfc/rfc9110#section-15.4.7)). |
| [`307`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307) | Temporary Redirect | Temporary redirect. The original method and body are preserved. |
| [`308`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308) | Permanent Redirect | Permanent redirect ([RFC 7538](https://www.rfc-editor.org/rfc/rfc7538)). The original method and body are preserved. |

</details>

<details>
<summary>4xx — client errors: expand every code</summary>

**Client Error 4xx: the request contains bad syntax or cannot be fulfilled.** This class of status code, defined in [RFC 9110, Section 15.5](https://www.rfc-editor.org/rfc/rfc9110#section-15.5), is for cases where the client seems to have erred. Except when responding to a `HEAD` request, the server should include a body explaining the error and whether the condition is temporary or permanent. These codes apply to any request method. Many `4xx` codes require a specific header in the response, shown in the table.

**Registered codes**

| Code | Reason phrase | Typical use |
|---:|---|---|
| [`400`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400) | Bad Request | The request syntax, JSON or parameters are invalid. |
| [`401`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401) | Unauthorized | Valid authentication is missing or invalid. The response should include `WWW-Authenticate`. |
| [`402`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402) | Payment Required | Reserved for future use. Some payment or quota APIs use it by their own policy. |
| [`403`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403) | Forbidden | The server understood the request but refuses to authorize it. Re-authenticating won't help. |
| [`404`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404) | Not Found | No resource at this URL. It may be missing, moved, deleted or deliberately hidden. |
| [`405`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405) | Method Not Allowed | The method is not supported for this resource. The response must include `Allow`. |
| [`406`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/406) | Not Acceptable | No representation matches the `Accept*` request headers. |
| [`407`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/407) | Proxy Authentication Required | The client must authenticate with the proxy. The response includes `Proxy-Authenticate`. |
| [`408`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408) | Request Timeout | The server did not receive a complete request in time. |
| [`409`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409) | Conflict | The request conflicts with the current state of the resource, such as an edit conflict or a duplicate. |
| [`410`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/410) | Gone | The resource is intentionally and permanently unavailable. |
| [`411`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/411) | Length Required | The server requires a `Content-Length` header. |
| [`412`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/412) | Precondition Failed | A conditional header such as `If-Match` evaluated to false. |
| [`413`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413) | Content Too Large | The request body exceeds a server limit (formerly "Payload Too Large"). |
| [`414`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414) | URI Too Long | The request target is longer than the server accepts. |
| [`415`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415) | Unsupported Media Type | The `Content-Type` of the request body is not supported. |
| [`416`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/416) | Range Not Satisfiable | The requested `Range` cannot be served. The response includes `Content-Range`. |
| [`417`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/417) | Expectation Failed | The server cannot meet the `Expect` header requirement. |
| [`418`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418) | (Unused) / I'm a teapot | From the April Fools' [RFC 2324](https://www.rfc-editor.org/rfc/rfc2324). The registry marks it unused, but it is kept reserved for compatibility. |
| [`421`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/421) | Misdirected Request | The server cannot produce a response for this scheme and authority, often due to connection reuse (HTTP/2) across hosts. |
| [`422`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422) | Unprocessable Content | The syntax is valid but the content cannot be processed, such as validation errors (formerly "Unprocessable Entity"). |
| [`423`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/423) | Locked | WebDAV ([RFC 4918](https://www.rfc-editor.org/rfc/rfc4918)): the resource is locked. |
| [`424`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/424) | Failed Dependency | WebDAV: the action failed because an earlier action failed. |
| [`425`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/425) | Too Early | The server won't risk processing a request that could be replayed ([RFC 8470](https://www.rfc-editor.org/rfc/rfc8470), TLS early data). |
| [`426`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/426) | Upgrade Required | The client should switch to another protocol or version. The response includes `Upgrade`. |
| [`428`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/428) | Precondition Required | The server requires a conditional request ([RFC 6585](https://www.rfc-editor.org/rfc/rfc6585)), to avoid lost updates. |
| [`429`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429) | Too Many Requests | Rate limit exceeded. May include `Retry-After`. |
| [`431`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/431) | Request Header Fields Too Large | The headers, individually or together, are too large. |
| [`451`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/451) | Unavailable For Legal Reasons | Access is restricted for legal reasons ([RFC 7725](https://www.rfc-editor.org/rfc/rfc7725)). |

**Unofficial and vendor-specific codes.** These are not in the [IANA registry](https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml). Avoid them in public APIs.

| Code | Name | Origin and use |
|---:|---|---|
| `419` | Page Expired | Laravel: the session or CSRF token expired. |
| `420` | Method Failure / Enhance Your Calm | `Method Failure` came from Spring's `HttpStatus` (deprecated). `Enhance Your Calm` was an old Twitter API rate-limit code. |
| `440` | Login Time-out | Microsoft IIS: the client session has expired. |
| `449` | Retry With | Microsoft extension: the request should be retried after the client takes the required action. |
| `450` | Blocked by Windows Parental Controls | Microsoft extension. |
| `498` | Invalid Token | Esri ArcGIS: the token is expired or invalid. |
| `499` | Token Required | Esri ArcGIS. In nginx, `499` instead means the client closed the connection before the response was sent. |

</details>

<details>
<summary>5xx — server errors: expand every code</summary>

**Server Error 5xx: the server failed to fulfil an apparently valid request.** This class of status code, defined in [RFC 9110, Section 15.6](https://www.rfc-editor.org/rfc/rfc9110#section-15.6), indicates that the server is aware it has erred or is incapable of performing the request. Except when responding to a `HEAD` request, the server should include a body explaining the error and whether the condition is temporary or permanent. These codes apply to any request method. Unlike many `4xx` codes, none of them requires a specific response header, though `503` often carries `Retry-After`.

**Registered codes**

| Code | Reason phrase | Typical use |
|---:|---|---|
| [`500`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500) | Internal Server Error | An unexpected failure occurred, such as an unhandled exception in the application. |
| [`501`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501) | Not Implemented | The server does not support the functionality needed, for example an unrecognized method. |
| [`502`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502) | Bad Gateway | A gateway or proxy received an invalid response from the upstream server. |
| [`503`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503) | Service Unavailable | The server is overloaded, restarting or under maintenance. May include `Retry-After`. |
| [`504`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504) | Gateway Timeout | A gateway or proxy did not receive a timely response from the upstream server. |
| [`505`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/505) | HTTP Version Not Supported | The server does not support the HTTP version used in the request. |
| [`506`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/506) | Variant Also Negotiates | Content negotiation misconfiguration ([RFC 2295](https://www.rfc-editor.org/rfc/rfc2295)): the chosen variant itself takes part in negotiation. |
| [`507`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/507) | Insufficient Storage | WebDAV ([RFC 4918](https://www.rfc-editor.org/rfc/rfc4918)): the server cannot store the representation needed to complete the request. |
| [`508`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508) | Loop Detected | WebDAV ([RFC 5842](https://www.rfc-editor.org/rfc/rfc5842)): an infinite loop was detected while processing. |
| [`510`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/510) | Not Extended | Obsoleted extension code from [RFC 2774](https://www.rfc-editor.org/rfc/rfc2774). Don't use it. |
| [`511`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/511) | Network Authentication Required | The client must authenticate to gain network access, such as a captive portal ([RFC 6585](https://www.rfc-editor.org/rfc/rfc6585)). |

**Unofficial and vendor-specific codes.** These are not in the [IANA registry](https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml). Avoid them in public APIs.

| Code | Name | Origin and use |
|---:|---|---|
| `509` | Bandwidth Limit Exceeded | Apache/cPanel: the site exceeded its bandwidth allowance. |
| `521` | Web Server Is Down | Cloudflare: the origin server refused the connection. |
| `526` | Invalid SSL Certificate | Cloudflare: the origin's TLS certificate could not be validated. |
| `530` | Site Is Frozen / Origin DNS Error | Provider-specific. Cloudflare uses it with a `1xxx` error code (for example origin DNS errors), and some hosts use it for suspended sites. |
| `598` | Network Read Timeout | Informal convention used by some proxies. Not standard. |

</details>

</details>


## 8. Error response design

A useful API error response normally contains the HTTP status, stable application code, safe message, validation details when appropriate, and a correlation ID.

```java
public enum ApiStatus {
    SUCCESS("200", "Success"),
    HTTP_METHOD_NOT_SUPPORTED("400", "HTTP method not supported"),
    INTERNAL_SERVER_ERROR("500", "Internal server error"),
    REQUIRED_FIELDS_VALIDATION_ERRORS("1001", "Some required fields are blank");

    private final String code;
    private final String message;

    ApiStatus(String code, String message) {
        this.code = code;
        this.message = message;
    }
}
```

`1001` and `4001`-style values can be application codes, but they are not HTTP status codes. Put them inside an appropriate HTTP response such as `400`, `401`, or `500`.

## 9. Inspect the flow locally

```bash
curl -sS -D - -o /dev/null -L --max-redirs 10 https://windows.github.com/
curl -sS -D - -o /dev/null -L --max-redirs 10 https://java.com/
curl -sS -D - -o /dev/null https://infrastructure.aws/
curl.exe -sS -D - -o NUL -L --max-redirs 10 https://windows.github.com/
curl -sS -w '\nHTTP status: %{http_code}\n' -H 'Accept: application/json' https://api.example.com/users/42
```

`-D -` prints headers, `-o /dev/null` or `-o NUL` discards the body, and `-L` follows redirects. `-I` sends `HEAD`, which can behave differently from `GET`. `curl` does not reproduce browser disk-cache entries, service workers, or browser-specific HTTPS-upgrade labels.

## 10. Expandable questions

<details><summary>Does a redirect perform DNS?</summary>A redirect is an HTTP response. If the Location host is new, the client may perform DNS, transport, and TLS work for that host. A cached redirect can avoid a fresh request.</details>

<details><summary>Why is the Java.com teaching flow 307 → 301 → 302 → 200?</summary>The trace first upgrades HTTP to HTTPS, changes to the `www` host, adds a language path, and then returns the page. Each hop is a separate URL request.</details>

<details><summary>What is the difference between 401 and 403?</summary>`401` means acceptable authentication was not supplied. `403` means the server understood the request but refuses authorization. Some applications return `404` to avoid revealing protected resources.</details>

<details><summary>When should 307 or 308 be used?</summary>Use them when the original method and body must be preserved. Use `303` when the follow-up must be a `GET`.</details>

<details><summary>Are all codes in old lists standard?</summary>No. IANA-registered codes differ from framework, vendor, proxy, CDN, and product extensions such as `218`, `419`, `440`, `449`, `450`, `498`, `499`, `509`, `521`, `526`, `530`, and `598`.</details>

## References

- [MDN: What is a URL?](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL)
- [MDN: HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [IANA: HTTP Status Code Registry](https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml)
- [CodeTrove: Networking overview](/content/tree/networking)
- [CodeTrove: Browser Request Walkthroughs](/content/tree/networking/browser-request-flow)
