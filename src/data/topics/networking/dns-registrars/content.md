# DNS & Registrars

DNS is the distributed naming system that lets software use names such as `www.example.com` while IP networking routes packets to addresses. A registrar, DNS hosting provider, recursive resolver, and authoritative nameserver are different roles. One company may provide several of them, but the concepts should not be conflated.

## Who does what?

A **registry** operates a top-level domain such as `.com`; registrars sell registrations to customers and communicate with the registry. The domain owner configures delegation at the registrar, often by selecting authoritative nameservers. A DNS hosting provider operates those authoritative servers and stores records such as A, AAAA, MX, NS, TXT, and CAA. A **recursive resolver** receives lookup requests from devices and searches or returns cached answers. Examples of public recursive services include Cloudflare `1.1.1.1` and Google Public DNS `8.8.8.8`; an ISP or enterprise may operate the resolver used by a device.

For example, a customer can register a domain at Namecheap, delegate it to Cloudflare nameservers, and have a laptop use the ISP resolver. Those are three distinct service roles.

![DNS resolution from local lookup through the recursive resolver hierarchy](networking-diagram:dns-resolution)

## Learn these subsections

- **TLD, domain names, URL and URI**: read labels from right to left, distinguish a registered domain from a full hostname, and parse scheme, authority, port, path, query, and fragment. Includes JavaScript URL parsing plus CMD and PowerShell checks.
- **What happens when DNS cannot find a record?**: follow the local hosts file, local caches, configured resolver, root/TLD/authoritative referrals, timeouts, alternate servers, NXDOMAIN, negative caching, and TTL.
- **DNS record types and commands**: inspect A, AAAA, CNAME, MX, NS, TXT, CAA, SOA, SRV, and PTR records from Windows, macOS, and Linux.

## An important correction about retries

“DNS did not find it” can mean different things. A timeout or unreachable server is a transport failure, so a stub resolver or recursive resolver may retry another configured server according to its own policy. An authoritative `NXDOMAIN` is a valid answer that says the name does not exist; clients do **not** normally ask every other unrelated resolver until somebody happens to return an IP. A recursive resolver may follow CNAMEs or referrals, and it can retry another authoritative server after a timeout. It caches positive records for their TTL and may cache negative answers for a separately determined negative TTL.

The order and caches vary by operating system, browser, VPN, enterprise policy, and DNS configuration. The lessons describe the common path rather than promising one universal call sequence.

## Try the Network tool

The [Build → Tools → Network DNS tab](/build/tools/network) can query Cloudflare or Google DNS-over-HTTPS for selected record types. It sends the hostname to the selected resolver when you press the lookup button; this browser tool is not identical to your computer's configured resolver.

## References

[1]: https://www.rfc-editor.org/rfc/rfc1034 "RFC 1034: Domain Names—Concepts and Facilities"
[2]: https://man7.org/linux/man-pages/man5/hosts.5.html "Linux hosts(5) manual"
[3]: https://www.rfc-editor.org/rfc/rfc8484 "RFC 8484: DNS Queries over HTTPS"
