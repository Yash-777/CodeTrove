# Zipkin & Sleuth — Distributed Tracing

Distributed tracing follows one logical request across multiple services. Zipkin is a tracing backend/UI; Spring Cloud Sleuth was a Spring tracing instrumentation project used by older Spring Cloud stacks. Modern Spring projects should verify the exact Spring Boot/Spring Cloud version because tracing has evolved toward Micrometer Tracing.

## Trace screen

```text
Client
  |
  | traceId=abc
  v
Gateway ---- span A ---->
  |
  v
Order Service -- span B --> Payment -- span C --> Kafka/DB
  |                                                |
  +---------------- trace context ----------------+
                         |
                         v
                    Zipkin / tracing backend
```

<details>
<summary>What problem does distributed tracing solve that logs alone do not?</summary>

### Answer
Logs tell you what an individual process observed. Distributed tracing connects spans across service boundaries using trace/span context, making it possible to see the critical path, downstream latency, retries, and failure propagation for one request.

> **Note — what the interviewer is expecting:**
> Explain trace ID, span, context propagation, sampling, and how tracing helps diagnose latency across services.

</details>

<details>
<summary>Where should correlation IDs and trace IDs be generated and propagated?</summary>

### Answer
The edge can establish or accept a safe correlation identifier, while the tracing system manages trace/span context. Propagate context through HTTP and messaging boundaries using supported instrumentation. Never trust arbitrary incoming identifiers as authorization credentials.

> **Note — what the interviewer is expecting:**
> Observability context is diagnostic metadata, not authentication.

</details>

## References

- [Spring Microservices](https://spring.io/microservices)
- [Zipkin](https://zipkin.io/)
- [Micrometer Tracing](https://micrometer.io/docs/tracing)
