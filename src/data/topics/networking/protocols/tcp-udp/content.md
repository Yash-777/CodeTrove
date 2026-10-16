# TCP and UDP: transport choices

IP routes packets between network interfaces. **TCP** and **UDP** are transport protocols that let applications identify services using port numbers, but they provide different guarantees.

## TCP: reliable ordered byte stream

TCP establishes a connection, numbers bytes, retransmits missing data, manages flow and congestion, and presents an ordered byte stream to the application. It does not preserve application message boundaries: code using TCP must define its own framing, for example a length prefix or newline. HTTPS normally uses HTTP over TCP/TLS (HTTP/3 is an important QUIC/UDP-based alternative).

A common TCP connection is identified by source IP, source port, destination IP, destination port, and transport protocol. Many separate clients can connect to the same server port because their source endpoints differ.

## UDP: independent datagrams

UDP exposes datagrams with ports, length, and checksum. It does not guarantee delivery, ordering, or duplicate suppression. Applications may add retries, ordering, congestion control, or accept occasional loss. DNS queries and real-time applications are common examples; many higher-level protocols also use UDP as their transport foundation. UDP does not mean “no connection” at the API level—applications can associate a default peer—but UDP itself does not establish a TCP-style reliable stream.

There is no commonly standardized general-purpose Internet transport called **UUD**. This subsection covers **UDP**, likely the intended abbreviation.

## Compare

| Need | Typical fit | What the application must consider |
|---|---|---|
| Reliable ordered stream | TCP | Setup latency, head-of-line effects, framing, congestion. |
| Message datagrams, low overhead | UDP | Loss, reordering, duplication and congestion behavior. |
| Modern browser web transport | TCP/TLS for HTTP/1.1 or HTTP/2; QUIC over UDP for HTTP/3 | Negotiation, middlebox/network support, security and fallback. |

## Check TCP reachability

Windows PowerShell:

```powershell
Test-NetConnection example.com -Port 443
```

macOS/Linux:

```bash
nc -vz example.com 443
```

This checks a TCP connection to that host and port. It is not a UDP test and does not prove an application-level handshake succeeds. ICMP tools such as `ping` test a different protocol and may be blocked while TCP still works.

## References

[1]: https://www.rfc-editor.org/rfc/rfc9293 "RFC 9293: Transmission Control Protocol"
[2]: https://www.rfc-editor.org/rfc/rfc768 "RFC 768: User Datagram Protocol"
[3]: https://www.rfc-editor.org/rfc/rfc9000 "RFC 9000: QUIC"
[4]: https://www.rfc-editor.org/rfc/rfc9114 "RFC 9114: HTTP/3"
