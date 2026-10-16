# TLD, domain names, URLs, and URIs

A **URI** identifies a resource. A **URL** is a URI that also describes how to locate it. In everyday web development, people often say “URL” for an HTTP or HTTPS address. The supplied [Document URL guide][1] demonstrates the main pieces and includes a legacy `window.open()` sample and a JavaScript parser; this lesson keeps the same concepts but uses the browser's standard `URL` and `URLSearchParams` APIs to avoid fragile manual splitting.

## URL parts

Use this example:

```text
https://user:secret@shop.example.co.uk:8443/products/42?color=blue&tag=a%3Db#reviews
```

| Component | Example | Meaning |
|---|---|---|
| Scheme / protocol | `https:` | Selects the URL scheme and related protocol behavior. |
| User information | `user:secret@` | Optional credentials syntax. Avoid putting credentials in shareable URLs. |
| Hostname | `shop.example.co.uk` | The DNS name of the destination. |
| Port | `8443` | Service endpoint port; HTTPS usually uses 443 when omitted. |
| Path | `/products/42` | Resource path on that origin. |
| Query | `?color=blue&tag=a%3Db` | Parameters sent to the server. Values may repeat and may contain encoded `=` or `&`. |
| Fragment | `#reviews` | Client-side location within a resource. Browsers do not send the fragment in the HTTP request target. |

The **origin** is scheme + host + port (with default-port normalization). `https://example.com` and `http://example.com` are different origins. A path can be case-sensitive depending on the server. Percent-encoding represents characters that cannot safely appear literally in a URL component.

![Anatomy of a web URL and the DNS boundary](networking-diagram:url-anatomy)

## TLD and domain labels

DNS names are hierarchical labels separated by dots, read from right to left. The final label is the **top-level domain (TLD)**, such as `.com`, `.org`, `.uk`, or `.io`. Some country-code domains use additional registry labels, as in `.co.uk`. The label immediately before the applicable public suffix is often called the second-level domain; `example.co.uk` is a registered-domain example, while `shop` is a subdomain. The exact “registrable domain” boundary is governed by the public suffix list, so a simplistic “last two labels” rule is wrong for some domains.

The URL `https://yash-777.github.io/CodeTrove/` has hostname `yash-777.github.io`, path `/CodeTrove/`, and HTTPS scheme. The domain is on GitHub Pages; `.io` is the TLD, while `github.io` is a hosted platform suffix. A **registrar** manages the registration. A **registry** operates a TLD. DNS hosting publishes records. A resolver looks them up.

## Parse the current address safely

This modern version of the supplied guide's URL inspection example handles encoded query values and repeated parameter names without splitting on every `=` character.

```javascript
const address = new URL(window.location.href);

const details = {
  href: address.href,
  protocol: address.protocol,       // "https:"
  origin: address.origin,           // scheme + host + effective origin
  hostname: address.hostname,       // no port
  host: address.host,               // hostname plus explicitly written port
  explicitPort: address.port,       // empty when the default/implicit port is used
  pathname: address.pathname,
  search: address.search,
  fragment: address.hash.slice(1),  // fragment is for the client, not the HTTP request
  query: [...address.searchParams.entries()],
};

console.log(details);
console.log(address.searchParams.getAll('tag')); // preserves repeated values
```

`URL.port` reports the port written in the URL; it is often an empty string for default ports. When you need the network default, map `http:` to 80 and `https:` to 443 explicitly. The exact code from the source guide includes a hand-written query parser that splits each pair at `=` and assigns into an object. That loses repeated keys and can truncate values that contain `=`. Use `URLSearchParams` for application code instead.

The guide also shows `window.open()`. A safe, user-initiated external link is usually better as an ordinary anchor. If code must open a new tab, use a fixed, validated destination and prevent the new page from controlling the opener:

```javascript
const destination = new URL('https://www.google.com/');
window.open(destination.href, '_blank', 'noopener,noreferrer');
```

Browsers can block popups unless the call happens directly in response to a user gesture. Never pass untrusted input to `window.open()` without validating the scheme and destination.

## Inspect a real URL from a terminal

**Windows PowerShell** (the same commands also work in modern Windows Command Prompt):

```powershell
$url = [uri]'https://windows.github.com/'
$url.Scheme
$url.Host
$url.Port
$url.AbsolutePath
$url.Query
$url.Fragment
```

PowerShell parses the supplied URL locally; it does not make a network request. To inspect DNS, use:

```powershell
Resolve-DnsName windows.github.com -Type A
Resolve-DnsName windows.github.com -Type AAAA
```

For **Windows Command Prompt**, `nslookup windows.github.com` asks the configured DNS server. In PowerShell, `nslookup` is also available. To view the route on Windows, run `tracert windows.github.com`.

On **macOS/Linux**, use `dig windows.github.com A`, `dig windows.github.com AAAA`, or `getent hosts windows.github.com`. `getent` follows the host lookup sources configured by the system, not only public DNS.

## References

[1]: https://developer.mozilla.org/en-US/docs/Web/API/URL "MDN: URL API"
[2]: https://www.rfc-editor.org/rfc/rfc3986 "RFC 3986: Uniform Resource Identifier Syntax"
