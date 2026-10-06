# Microservice Boundaries

A service boundary should group capabilities and data that change together while minimizing coordination with other services. Derive boundaries from business capabilities and domain language, not technical layers such as “controller service” or “database service.”

Good boundaries provide clear team ownership, own their data and invariants, and communicate through explicit APIs or events. They support independent deployment without turning every function into a network service.

**Warning signs:** shared-table writes, frequent synchronous calls for one user action, duplicated business rules, and changes requiring coordinated releases. These can indicate a misplaced boundary or a distributed workflow that needs redesign.

**Trade-offs:** microservices improve independent deployment and scaling but add network failure, operational, security, and consistency costs. Choose the simplest architecture that meets actual organizational and scaling needs.

**Interview points:** describe domain-driven decomposition, ownership, and how to evolve a modular monolith safely.

**Related:** [Data Ownership](/content/tree/architecture/microservices/data-ownership), [API Composition](/content/tree/architecture/microservices/api-composition), [Architecture Deep Dive](/content/tree/architecture/microservices/architecture-deep-dive).
