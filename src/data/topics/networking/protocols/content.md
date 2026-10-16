# Types of network protocols

A protocol defines how peers format messages and coordinate. Protocols operate at different layers: IP moves packets between network interfaces, TCP or UDP provides transport, and application protocols define what programs mean by messages. A TCP connection does not itself speak HTTP; an application protocol runs over the transport.

## Web protocols

**HTTP** is a request/response application protocol. **HTTPS** is HTTP protected by TLS. A browser sends a method, target, headers, and sometimes a body; the server responds with a status, headers, and optional body. A 3xx response may direct a client to request a different URL using `Location`. See **HTTP/HTTPS and redirects** for the two complete redirect examples requested in this tool.

## Mail protocol

**SMTP** transfers outgoing and relayed email between mail systems. DNS MX records guide the sending system to the next mail server. SMTP is different from protocols used by a mail client to retrieve or synchronize mail, such as IMAP or POP3. See **SMTP** for message steps and local checks.

## File transfer

Classic **FTP** separates a control connection from a data connection and sends credentials/data without TLS by default. Avoid ordinary FTP over untrusted networks. **FTPS** is FTP protected with TLS. **SFTP** is a distinct file-transfer protocol carried over SSH; it is not FTP with an “S”. See **FTP, FTPS, and SFTP**.

## Transport protocols

**TCP** provides an ordered byte stream and retransmission for reliable delivery. **UDP** sends independent datagrams with minimal transport guarantees; the application may need to handle loss, ordering, and retries itself. DNS often uses UDP and can use TCP when needed; modern DNS may also travel over HTTPS or TLS. “UUD” is not a commonly standardized Internet transport protocol; this lesson covers UDP, the likely intended term.

## How to choose

Use HTTPS for web APIs and browsers. Use SMTP for email transfer. Prefer SFTP or an HTTPS-based transfer service over plain FTP. Use TCP when an application needs a reliable ordered stream; UDP suits designs that value low overhead or implement reliability at a higher layer. Protocol selection depends on the complete application, security model, network path, and latency/loss trade-offs—not just a port number.

## References

[1]: https://www.rfc-editor.org/rfc/rfc9110 "RFC 9110: HTTP Semantics"
[2]: https://www.rfc-editor.org/rfc/rfc5321 "RFC 5321: SMTP"
[3]: https://www.rfc-editor.org/rfc/rfc959 "RFC 959: FTP"
[4]: https://www.rfc-editor.org/rfc/rfc768 "RFC 768: UDP"
[5]: https://www.rfc-editor.org/rfc/rfc9293 "RFC 9293: TCP"
