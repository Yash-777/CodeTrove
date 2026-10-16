# Forward proxy: client-side intermediary

A **forward proxy** sits on the outbound side of clients. The client or its network configuration chooses to send requests through it. The proxy applies policy and sends requests onward, then returns the response.

![Client request routed through an outbound forward proxy](networking-diagram:forward-proxy)

## Example flow

1. A developer laptop is configured to use `proxy.corp.example:8080` for outbound web traffic.
2. The browser requests `https://docs.example.com/`. For HTTPS, a typical HTTP proxy receives a `CONNECT docs.example.com:443` request; after approval it creates a TCP tunnel to the destination. TLS then runs through that tunnel from browser to destination, unless an authorized enterprise TLS inspection policy deliberately changes the trust endpoints.
3. The proxy logs or enforces the organization's outbound policy. The destination receives the proxied network connection; `X-Forwarded-For` is not automatically added by every proxy and is not trustworthy unless the application has an explicit trusted-proxy policy.
4. The response travels back through the proxy to the client.

Common uses include controlled egress, user authentication, policy enforcement, audit logging, and shared caching. A forward proxy does not inherently hide the user from the proxy operator, and it is not a guarantee of anonymity. Do not send credentials to an untrusted proxy; it may observe unencrypted requests and connection metadata.

## Inspect local proxy settings

On Windows, open **Settings → Network & internet → Proxy** or inspect user/machine policy with your administrator. In PowerShell, environment variables can be printed with:

```powershell
Get-ChildItem Env:HTTP_PROXY,Env:HTTPS_PROXY,Env:NO_PROXY
```

On macOS/Linux:

```bash
printf 'HTTP_PROXY=%s\\nHTTPS_PROXY=%s\\nNO_PROXY=%s\\n' "$HTTP_PROXY" "$HTTPS_PROXY" "$NO_PROXY"
```

Proxy settings are often sensitive infrastructure information; redact credentials and internal hostnames before sharing output. A local proxy test only applies to requests made by tools configured to use it.

## References

[1]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Proxy_servers_and_tunneling "MDN: Proxy servers and tunneling"
[2]: https://www.rfc-editor.org/rfc/rfc9110 "RFC 9110: HTTP Semantics (CONNECT)"
