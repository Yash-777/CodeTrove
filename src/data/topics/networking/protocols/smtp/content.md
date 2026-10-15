# SMTP: sending and relaying email

The **Simple Mail Transfer Protocol (SMTP)** transfers email from a sending application to a submission server and between mail servers. It is not generally the protocol a client uses to read its mailbox; IMAP or POP3 commonly serve that purpose. SMTP servers use DNS **MX** records to identify a next-hop mail exchanger, then connect to that mail server. Messages can pass through multiple relays before delivery.

![Mail delivery from sender through SMTP submission and MX-selected relays](networking-diagram:smtp-flow)

## A simplified message path

1. The user submits a message to an authenticated mail submission service, normally with TLS configured by that provider.
2. The sender's mail system looks up the recipient domain's MX records and applies mail-routing and security policy.
3. It connects to the chosen destination server, negotiates the supported SMTP features, and transfers the message. If a temporary condition occurs, a capable server can queue and retry delivery later.
4. A receiving mail system applies anti-abuse checks and routes the message to a mailbox. The recipient reads it using a mailbox-access protocol or provider API.

SMTP's command exchange includes a greeting, `EHLO`, sender and recipient envelope commands, message data, and a completion response. Real deployments require authentication, TLS, anti-spam controls, and domain policy; do not transmit a real message by pasting credentials into a terminal example.

## DNS and port checks

PowerShell:

```powershell
Resolve-DnsName example.com -Type MX
Test-NetConnection smtp.example.com -Port 587
```

macOS/Linux:

```bash
dig example.com MX
nc -vz smtp.example.com 587
```

A successful TCP-port test only proves that a TCP connection could be made from that machine at that moment. It does not prove that the server accepts mail, credentials, recipients, or the message. Port numbers are conventions and can be altered by deployment policy; use the provider's documented endpoint.

## Security distinction

SMTP can be protected by TLS, but SMTP as a protocol name alone does not mean that a particular connection is encrypted or that a server authenticates the sender. Mail servers can relay in stages and the path is not end-to-end encrypted by default. Sensitive content may require application-level end-to-end encryption in addition to TLS on each transport hop.

## References

[1]: https://www.rfc-editor.org/rfc/rfc5321 "RFC 5321: Simple Mail Transfer Protocol"
[2]: https://www.rfc-editor.org/rfc/rfc3207 "RFC 3207: SMTP Service Extension for Secure SMTP over TLS"
[3]: https://www.rfc-editor.org/rfc/rfc8314 "RFC 8314: Cleartext Considered Obsolete: Use of TLS for Email Submission and Access"
