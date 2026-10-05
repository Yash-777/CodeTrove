# Service and API Versioning

Versioning manages change across independently deployed producers and consumers. Prefer backward-compatible evolution: add optional fields, preserve existing meanings, and let consumers tolerate unknown fields. Use a new major contract when a breaking change cannot be avoided.

HTTP APIs may version by path, header, or media type; events need schema compatibility rules. Versioning a service name in discovery is not a substitute for API compatibility.

**Migration flow:** publish the new contract, deploy consumers that can handle both forms, deploy the producer, observe adoption, and retire the old form after a communicated window. Contract tests and telemetry reveal lagging consumers.

**Pitfalls:** versioning every change, silently changing field semantics, and retaining old versions indefinitely without ownership or usage data.

**Interview points:** explain expand-and-contract deployment, consumer-driven contracts, and safe deprecation.

**Related:** [API Composition](/content/tree/architecture/microservices/api-composition), [Data Ownership](/content/tree/architecture/microservices/data-ownership).
