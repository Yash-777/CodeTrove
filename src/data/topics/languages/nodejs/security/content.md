# Security Basics

A Node.js service inherits risks from its code, configuration, operating environment, and every installed dependency. Treat security as a set of layers: keep the runtime and packages maintained, validate untrusted data, protect credentials, limit resource use, and expose only the capabilities the process needs. [1]

## Dependencies and the software supply chain

Before adding a package, verify its name, maintenance status, intended purpose, and project compatibility. A typo in a package name can install an unrelated project. Dependencies can run code during installation, so the package registry and maintainer account are part of the application's trust boundary. [1]

Commit the lockfile for applications and use `npm ci` in reproducible builds. Run `npm audit` to check for known advisories, review the report, and test updates. `npm audit fix` can update compatible dependencies; `npm audit fix --force` may cross major-version boundaries and should not be used without reviewing its impact. An audit only detects issues present in the advisory data and does not certify that the application is secure. [1] [2]

## Validate input at the boundary

Treat request parameters, headers, JSON bodies, uploaded files, environment variables, and data from external services as untrusted. Validate types, lengths, formats, and allowed values before using them. Use parameterized queries for databases, safe APIs for file paths, and allowlists for redirect destinations. Set body and upload size limits to reduce resource-exhaustion risk.

Do not pass untrusted strings to `eval`, shell commands, dynamic module loading, or template compilation. A value that is harmless as plain text may become executable when inserted into a command or code context. Prefer structured APIs and escaping/encoding appropriate to the output context.

## Protect secrets and access

Keep API keys, database passwords, signing keys, and private certificates out of source control, browser code, logs, and error responses. Inject secrets through a deployment secret manager or protected environment variables. Grant the process only the filesystem, network, and operating-system permissions it needs. Rotate a secret promptly if it is exposed.

Use authentication and authorization checks on every protected operation. Authentication answers who the caller is; authorization decides what that caller may do. Do not rely on a hidden button or client-side route as an access-control mechanism.

## Secure the HTTP edge

Use TLS for traffic that crosses networks or carries sensitive data. For Express applications, Helmet can set useful security-related response headers, but headers do not replace validation or correct access control. Configure cookies with appropriate `Secure`, `HttpOnly`, and `SameSite` attributes when using sessions. Hide internal error detail from clients while recording enough diagnostic information in protected server logs. [3]

A production example might start with:

```js
import express from 'express';
import helmet from 'helmet';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
```

Install Helmet with `npm install helmet`. Review and configure its policy for the application's actual resources; an incorrect Content Security Policy can break the site, while a permissive one may provide little protection. [3]

## Availability and operational safety

Set timeouts and limits for requests, connections, uploads, queues, and expensive work. Avoid synchronous CPU-heavy operations on request paths because they block the event loop. Apply rate limits where clients can trigger costly or state-changing operations. Keep production dependencies and the Node.js runtime on supported releases, and test upgrades before deployment.

Use structured logs, but never log passwords, access tokens, session cookies, or full sensitive request bodies. Handle errors centrally and return a generic error identifier or message to clients rather than a stack trace. Maintain backups and practice restoration for persistent data.

## References

[1]: https://nodejs.org/en/learn/getting-started/security-best-practices "Node.js Security Best Practices"
[2]: https://docs.npmjs.com/cli/v11/commands/npm-audit "npm audit"
[3]: https://expressjs.com/en/advanced/best-practice-security.html "Express Production Security Best Practices"
