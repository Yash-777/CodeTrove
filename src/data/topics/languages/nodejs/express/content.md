# Express HTTP Services

Node.js includes the low-level `node:http` API. Express is a web framework built on top of Node's HTTP capabilities. It provides routing and middleware so an application can organize request handling without manually parsing every URL and body. [1]

## Create a small Express project

In a new project directory, initialize npm and install Express:

```sh
npm init -y
npm install express
```

For an ES module application, add `"type": "module"` to `package.json`. Create `server.js`:

```js
import express from 'express';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/healthz', (_request, response) => {
  response.json({ status: 'ok' });
});

app.post('/api/messages', (request, response) => {
  const text = request.body?.text;
  if (typeof text !== 'string' || text.trim().length === 0) {
    return response.status(400).json({ error: 'text is required' });
  }

  return response.status(201).json({ id: 'example-1', text: text.trim() });
});

app.listen(3000, '127.0.0.1', () => {
  console.log('Listening at http://127.0.0.1:3000');
});
```

Run it with `node server.js`, then check `http://127.0.0.1:3000/healthz`. The POST route accepts JSON such as `{"text":"hello"}`. It validates the field before using it; in a real application, validate every field and enforce authorization before writing data.

## Routes and middleware

A route pairs an HTTP method and path with a handler. `app.use()` registers middleware that runs in order. Middleware can parse JSON, attach authentication information, log requests, enforce rate limits, or reject invalid input. Keep middleware focused and place security checks before handlers that access protected data.

A common request flow is:

1. The client connects to the server.
2. Middleware applies request parsing, logging, and shared checks.
3. A route validates parameters and calls the application/service layer.
4. The handler returns a response with an intentional status code and content type.
5. Errors are passed to a centralized error handler, which returns a safe response.

## Production considerations

The example binds only to loopback and is intended for local testing. In a deployed service, follow the hosting platform's network model and put a TLS-terminating proxy or load balancer in front when appropriate. If Express runs behind a proxy, configure `trust proxy` only for the actual trusted proxy hops; trusting arbitrary forwarded headers can let clients spoof their source address or protocol.

Set request-size limits, validate input, use safe database queries, and avoid returning stack traces or secrets to clients. Add a tested error-handling strategy and graceful shutdown behavior. Security is a first-class part of API design; continue with [Security Basics](/content/tree/languages/nodejs/security). [2]

## References

[1]: https://expressjs.com/en/starter/installing.html "Installing Express"
[2]: https://expressjs.com/en/advanced/best-practice-security.html "Express Production Security Best Practices"
