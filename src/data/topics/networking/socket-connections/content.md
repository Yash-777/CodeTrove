# Socket connections

A **socket** is an operating-system programming interface for sending and receiving data over a network. A TCP server binds a local address and port, listens, and accepts incoming connections. A client resolves the server name, chooses a local ephemeral port, and connects to the server address and port. The server's listening socket remains ready for new clients; `accept` returns a separate connected socket for each client.

![A client and server socket exchange data over TCP](networking-diagram:socket-lifecycle)

## TCP connection lifecycle

1. The application chooses a host and port. Name resolution may turn the hostname into one or more IP addresses.
2. The client calls `connect`; the OS performs TCP setup with a server that is listening and reachable through the network path.
3. The server's `accept` returns a connected socket. The connection is identified by both endpoints and the transport protocol.
4. Both sides exchange a byte stream. TCP preserves byte order, not message boundaries, so application code must frame messages.
5. One side closes or resets the connection. The other side observes EOF or an error and releases resources.

## Run a tiny local TCP server (Node.js)

Save as `server.js`, then run `node server.js`. It listens only on loopback, so other devices cannot reach it via the public network interface.

```javascript
const net = require('node:net');

const server = net.createServer((socket) => {
  console.log('client connected:', socket.remoteAddress, socket.remotePort);
  socket.write('Welcome. Send a line.\n');
  socket.on('data', (data) => {
    const message = data.toString('utf8').trim();
    console.log('received:', message);
    socket.write(`echo: ${message}\n`);
  });
  socket.on('end', () => console.log('client disconnected'));
});

server.listen(5000, '127.0.0.1', () => {
  console.log('listening on 127.0.0.1:5000');
});
```

Open a second terminal and connect using Node:

```bash
node -e "const s=require('net').connect(5000,'127.0.0.1',()=>s.write('hello\n'));s.on('data',d=>{console.log(d.toString());s.end()})"
```

Or use `nc 127.0.0.1 5000` where netcat is installed, then type a line. This example is deliberately local and has no authentication or encryption. Do not expose it to the Internet or send secrets through it.

## UDP sockets

A UDP socket binds to a local port and sends/receives whole datagrams. It has no listen/accept handshake like TCP. A receiver may see missing, duplicated, or reordered datagrams; application code must decide what to do.

## Diagnose from Windows

```powershell
Get-NetTCPConnection -LocalPort 5000 -State Listen
Test-NetConnection 127.0.0.1 -Port 5000
```

On Linux/macOS, `ss -ltnp` (Linux) or `lsof -nP -iTCP:5000 -sTCP:LISTEN` (macOS) can inspect a listening process. A port's being open locally does not prove the remote path, firewall, name resolution, TLS, or application protocol works.

## References

[1]: https://nodejs.org/api/net.html "Node.js: net module"
[2]: https://www.rfc-editor.org/rfc/rfc9293 "RFC 9293: TCP"
[3]: https://man7.org/linux/man-pages/man2/socket.2.html "Linux socket(2) manual"
