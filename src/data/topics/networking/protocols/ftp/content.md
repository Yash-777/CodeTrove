# FTP, FTPS, and SFTP

**FTP (File Transfer Protocol)** uses a control connection to carry commands and replies, and a separate data connection to carry file listings and contents. Classic FTP does not encrypt credentials or data. It is easy to block or misconfigure through firewalls because the data connection behaves differently in active and passive modes.

![FTP control connection and separate file data connection](networking-diagram:ftp-connections)

## Control and data connections

With classic FTP, a client first connects to the server's control service (conventionally TCP port 21). Commands such as `USER`, `PASS`, `PASV`, `RETR` (download), and `STOR` (upload) travel over the control connection. File bytes travel over a data connection. In active mode the server initiates the data connection toward the client; in passive mode the server provides a port and the client opens the data connection. NAT/firewall constraints make passive mode common for clients behind routers.

## Do not confuse these protocols

| Name | What it is | Encryption |
|---|---|---|
| FTP | Classic file-transfer protocol | None by default; credentials and contents can be exposed. |
| FTPS | FTP with TLS applied to its control/data connections | Can be encrypted when correctly configured; modes and certificates must match the client/server. |
| SFTP | SSH File Transfer Protocol | Runs as a subsystem over SSH; distinct protocol, commonly over TCP port 22. |

Use SFTP or a managed HTTPS/object-storage transfer service instead of plain FTP over an untrusted network. Do not send passwords to an unknown FTP host.

## Check a host and port from Windows

```powershell
Resolve-DnsName ftp.example.com
Test-NetConnection ftp.example.com -Port 21
```

## Check from macOS/Linux

```bash
dig ftp.example.com
nc -vz ftp.example.com 21
```

A port check only tests whether a TCP connection opens from your current network. It does not authenticate, prove TLS, confirm passive-data ports, or confirm that you are authorized to transfer a file. Use server documentation for the correct endpoint and allowed ports.

## References

[1]: https://www.rfc-editor.org/rfc/rfc959 "RFC 959: File Transfer Protocol"
[2]: https://www.rfc-editor.org/rfc/rfc4217 "RFC 4217: Securing FTP with TLS"
[3]: https://www.rfc-editor.org/rfc/rfc4253 "RFC 4253: SSH Transport Layer Protocol"
