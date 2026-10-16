# DNS records and lookup commands

A DNS resource record binds an owner name to typed data. Its type defines how the data should be interpreted; a TTL limits how long caches may retain a positive answer. Records live in authoritative zones, while tools commonly query recursive resolvers that may return cached answers.

## Common record types

| Type | Purpose | Example-shaped data |
|---|---|---|
| A | IPv4 address | `203.0.113.10` |
| AAAA | IPv6 address | `2001:db8::10` |
| CNAME | Alias to another DNS name | `www.example.com → example.com` |
| MX | Mail-exchanger host and preference | `10 mail.example.com` |
| NS | Nameservers for a zone/delegation | `ns1.example.net` |
| TXT | Text for verification and policies such as SPF/DKIM | `v=spf1 ...` |
| CAA | Which certificate authorities may issue for a name | `0 issue "letsencrypt.org"` |
| SOA | Zone authority metadata, serial and refresh timers | primary NS, serial, timers |
| SRV | Service target plus port, priority and weight | `_service._tcp.example.com` |
| PTR | Reverse mapping from an IP to a DNS name | `...in-addr.arpa → host.example.com` |

These examples are illustrative, not live records. A CAA record does not issue or validate a certificate. A PTR record is not proof that a domain owns an address.

## Windows PowerShell

```powershell
Resolve-DnsName example.com -Type A
Resolve-DnsName example.com -Type AAAA
Resolve-DnsName example.com -Type MX
Resolve-DnsName example.com -Type NS
Resolve-DnsName example.com -Type TXT
```

From Command Prompt or PowerShell, `nslookup` works for common types:

```powershell
nslookup -type=CAA example.com
nslookup -type=SOA example.com
nslookup -type=SRV _https._tcp.example.com
```

Exact `Resolve-DnsName` support varies by Windows version.

## macOS and Linux

```bash
dig example.com A
dig example.com AAAA
dig example.com MX
dig example.com NS
dig example.com TXT
dig example.com CAA
dig example.com SOA
dig _service._tcp.example.com SRV
```

For concise output, use `dig +noall +answer example.com MX`. To ask a particular resolver, use `dig @1.1.1.1 example.com A`. `dig +trace example.com A` follows referrals from the root, subject to network policy. `getent hosts example.com` follows the system's configured host-lookup sources, which may include `/etc/hosts`.

## Reverse lookup

Reverse DNS uses PTR records under reverse address namespaces. Try:

```powershell
nslookup 8.8.8.8
```

```bash
dig -x 8.8.8.8
```

Compare forward A/AAAA results too; reverse DNS alone does not prove that the named host serves a particular website.

## References

[1]: https://www.rfc-editor.org/rfc/rfc1035 "RFC 1035: Domain Names—Implementation and Specification"
[2]: https://www.rfc-editor.org/rfc/rfc1034 "RFC 1034: Domain Names—Concepts and Facilities"
[3]: https://www.rfc-editor.org/rfc/rfc3596 "RFC 3596: DNS Extensions to Support IP Version 6"
[4]: https://www.rfc-editor.org/rfc/rfc2782 "RFC 2782: A DNS RR for specifying the location of services"
[5]: https://letsencrypt.org/docs/caa/ "Let's Encrypt: CAA records"
[6]: https://www.rfc-editor.org/rfc/rfc5321 "RFC 5321: Simple Mail Transfer Protocol"
