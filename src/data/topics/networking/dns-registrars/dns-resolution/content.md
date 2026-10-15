# DNS resolution: local name to IP address

When a browser needs `www.example.com`, it needs an address before it can open a network connection. The path below is common, but modern browsers, VPNs, operating systems, enterprise agents, and encrypted DNS can change the order or add caches.

![DNS resolution path with cache hits and resolver referrals](networking-diagram:dns-resolution)

## The common lookup path

1. The browser parses the URL and checks its own in-memory DNS/connection caches. A browser may reuse an address or a live connection that has not expired.
2. If it needs a name lookup, it calls the operating system's name-resolution API. That API can consult local configuration and cache. A hosts-file entry can map a chosen hostname directly to an IP without querying public DNS. On Linux and macOS the file is usually `/etc/hosts`; on Windows it is usually `C:\\Windows\\System32\\drivers\\etc\\hosts`. Exact precedence is OS and configuration dependent.
3. The operating system's stub resolver asks its configured recursive resolver. The resolver might belong to an ISP, company, VPN, router, or a selected public DNS service. A browser using DNS-over-HTTPS can instead send the query over HTTPS to the resolver it is configured to use.
4. If the recursive resolver has a fresh cached answer, it can return it immediately. Otherwise, it performs the necessary lookups, following DNS referrals. Typically it asks a root server which TLD servers to use, asks the TLD servers which authoritative servers host the domain, and asks an authoritative server for the requested record. The recursive resolver usually does this work on the client's behalf; the device does not normally contact all hierarchy servers itself.
5. The recursive resolver returns the response. The client can cache it for the applicable lifetime. The browser can then connect to one of the returned A/AAAA addresses. A hostname may have multiple addresses, and a CDN, geo-routing, or DNS load distribution can return different answers to different clients or at different times.

## What “DNS not found” means

A **timeout** or network error means a server did not produce a usable response in time. The stub resolver or recursive resolver can retry, choose another configured resolver or authoritative server, and apply backoff. Which server is tried and when depends on platform and resolver policy. A successful response from a secondary authoritative server can answer the query; a recursive resolver may cache that answer.

An **NXDOMAIN** response is different: it is a valid DNS answer saying that the queried name does not exist. It is not a signal to ask every public resolver until one returns an IP. A resolver may follow a CNAME if the name is an alias, but if the canonical name is also absent, the chain ends in a negative answer. A **NOERROR with no requested records** can instead mean the name exists but has no record of that type (often called NODATA). A SERVFAIL, REFUSED, timeout, or malformed response each has different meaning.

Resolvers can cache negative answers as well as positive answers. Negative-cache duration is derived from the zone's SOA data and resolver policy; it is not simply the positive-record TTL for an IP address. If a mistaken negative answer is cached, changing the zone may not appear immediately to every resolver.

## TTL and “DNS propagation”

Every cached resource record has a **TTL (time to live)**. A resolver may use a positive answer until its TTL expires, then it should refresh instead of treating the expired value as current. Each cache—browser, OS, router, recursive resolver, or application—can have different behavior and limits. A TTL is not a promise that all clients update at the same instant. Existing caches age out at different times, and negative responses can also be cached.

This is why people say a DNS change is “propagating,” but there is no single global push that updates all caches. Before a planned migration, a domain owner can lower TTL in advance, wait for the earlier longer TTLs to age out, change the records, then raise the TTL again. That planning does not instantly erase cached old answers.

## Check on Windows

Run these in PowerShell or Command Prompt:

```powershell
nslookup example.com
nslookup -type=A example.com
nslookup -type=AAAA example.com
nslookup -type=NS example.com
ipconfig /displaydns
```

To inspect the local hosts file in PowerShell:

```powershell
Get-Content "$env:SystemRoot\System32\drivers\etc\hosts"
```

After intentionally changing that file or testing a DNS update, Windows can clear its local resolver cache with `ipconfig /flushdns` (administrator rights may be required). This does not flush browser caches or a remote recursive resolver's cache.

## Check on macOS/Linux

```bash
getent hosts example.com
 dig +noall +answer example.com A
 dig +noall +answer example.com AAAA
 dig +noall +answer example.com NS
```

`getent` goes through the system's configured host-name lookup path, which may include `/etc/hosts`. `dig` asks DNS directly and is useful for inspecting answer records and TTL values. On systems using systemd-resolved, `resolvectl query example.com` shows the configured resolver's result. To inspect the file, run `cat /etc/hosts`.

## Try a specific public resolver

The following are explicit diagnostic queries to Cloudflare or Google, rather than a transparent report of the default resolver:

```powershell
nslookup example.com 1.1.1.1
nslookup example.com 8.8.8.8
```

```bash
dig @1.1.1.1 example.com A
dig @8.8.8.8 example.com AAAA
```

If resolvers disagree, compare the queried record type, response code, TTL, CNAME chain, DNSSEC behavior, and authoritative data. A difference does not automatically mean one resolver is malicious or that the website is down.

## References

[1]: https://www.rfc-editor.org/rfc/rfc1034 "RFC 1034: Domain Names—Concepts and Facilities"
[2]: https://man7.org/linux/man-pages/man5/hosts.5.html "Linux hosts(5) manual"
[3]: https://www.rfc-editor.org/rfc/rfc8484 "RFC 8484: DNS Queries over HTTPS"
