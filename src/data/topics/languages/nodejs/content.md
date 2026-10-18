# Node.js

Node.js is a cross-platform JavaScript runtime built on the V8 engine. It lets JavaScript run outside a browser, with APIs for files, networking, processes, and other operating-system work. The runtime is especially useful for HTTP services, command-line tools, build tools, and applications that spend much of their time waiting for I/O. [1]

Node.js is not a separate programming language and it is not a web framework. Node.js provides the runtime and built-in modules; npm manages packages; frameworks such as Express add conveniences for building web applications.

## A request, from code to response

A Node.js process loads your application and its dependencies, executes JavaScript, and starts asynchronous work such as accepting a network connection or reading a file. When that work completes, Node schedules the associated callback or promise continuation. JavaScript callbacks run one at a time on the event loop by default, so a long CPU-bound callback can delay unrelated requests even when the application uses `async` functions. Learn the details in [Event Loop and Asynchronous Work](/content/tree/languages/nodejs/event-loop).

## Start with a tiny HTTP server

The built-in `node:http` module is enough for a basic server; no framework is required. Save this as `server.cjs` and run `node server.cjs`:

```js
const { createServer } = require('node:http');

const server = createServer((request, response) => {
  response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  response.end('Hello from Node.js\n');
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Listening at http://127.0.0.1:3000');
});
```

Visit the printed address in a browser or test it with `curl http://127.0.0.1:3000`. Binding to `127.0.0.1` keeps this example reachable only from the same computer. A production service normally uses a deployment-appropriate host and sits behind a controlled network edge.

## Learning path

Follow these lessons in order. Each page builds on the previous one and has examples you can adapt to a real project.

1. [Installation and Version Management](/content/tree/languages/nodejs/installation-and-versions) — install Node.js and npm, select a compatible release, and use nvm-windows safely.
2. [npm and package.json](/content/tree/languages/nodejs/npm-and-package-json) — install dependencies, define scripts, understand lockfiles, and choose local versus global tools.
3. [Modules: CommonJS and ES Modules](/content/tree/languages/nodejs/modules) — organize code and understand `require`, `import`, and package module settings.
4. [Event Loop and Asynchronous Work](/content/tree/languages/nodejs/event-loop) — understand I/O concurrency, promises, timers, and event-loop blocking.
5. [Streams and Backpressure](/content/tree/languages/nodejs/streams) — handle large files and network data without loading everything into memory.
6. [Express HTTP Services](/content/tree/languages/nodejs/express) — build routes and middleware on top of Node's HTTP capabilities.
7. [Security Basics](/content/tree/languages/nodejs/security) — reduce risks from untrusted input, vulnerable packages, and unsafe configuration.
8. [Windows PATH and CLI Troubleshooting](/content/tree/languages/nodejs/windows-cli-troubleshooting) — diagnose `node`, `npm`, or framework commands that are not found.

## Node.js and npm are separate commands

Installing the Node.js distribution normally installs both `node` and `npm`. `node` runs JavaScript programs; `npm` installs and manages packages and runs project scripts. Check both versions after installation:

```sh
node --version
npm --version
```

Choose a Node.js release supported by your framework and deployment platform. For new applications, prefer a currently supported LTS release unless a project's compatibility requirements say otherwise. The selected Node.js version also determines which JavaScript language features and runtime APIs are available. [1] [2]

## When Node.js is a good fit

Node.js is a strong fit for APIs, real-time services, network tools, and file-processing pipelines where asynchronous I/O and JavaScript reuse are valuable. It is not automatically the best choice for every workload: CPU-heavy work in a request handler can block the event loop. Large data should often be processed with streams, and sustained CPU-parallel work may need worker threads, separate processes, or a dedicated compute service.

## References

[1]: https://nodejs.org/en/learn/getting-started/introduction-to-nodejs "Introduction to Node.js"
[2]: https://nodejs.org/en/download "Download Node.js"
