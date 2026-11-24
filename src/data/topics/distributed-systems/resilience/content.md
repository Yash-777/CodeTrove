# Resilience

Resilience means a system can handle failures and continue working. It helps prevent one service failure from affecting the entire system. Common techniques include [timeouts, retries](/content/tree/distributed-systems/resilience/timeouts-retries-idempotency), circuit breakers, fallbacks, and bulkheads.

## Timeouts, Retries and Circuit Breakers

A service often depends on other services to complete a request. Sometimes these services become slow or stop working.

- **Timeouts:** Stop waiting if a service takes too long to respond.
- **Retries:** Try the request again if it fails.
- **Circuit Breakers:** Stop sending requests to a service when it keeps failing. This gives the service time to recover.

Retries can make things worse if a service is already overloaded. Too many requests can put even more pressure on it.

A circuit breaker helps prevent this by temporarily stopping requests to the failing service.

### Request Flow

Requests travel from users through a service and then to another dependent service. The circuit breaker controls whether requests can reach that service.

### Useful Reference Links

1. [Microsoft – Rate Limiting Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern)
2. [Microsoft – Throttling Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/throttling)
3. [Microsoft – Circuit Breaker Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
4. [MDN – HTTP 429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429)

### Live Monitoring

Explore how resilience patterns work in real time:

- [Resilience – Timeouts, Retries & Circuit Breakers](https://sysdesign.simuveda.in/lab/#resilience)
- [Rate Limiting – Who Gets a 429?](https://sysdesign.simuveda.in/lab/#rate-limiting)
- [Idempotency](https://sysdesign.simuveda.in/lab/#idempotency)