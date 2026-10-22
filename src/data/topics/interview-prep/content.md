# Interview Prep

This guide is arranged for interviews rather than as a reference dump. Start with the Java sections, then move to J2EE web infrastructure and the existing system-design, SQL, microservices, JavaScript, and behavioral sections.

Every expandable item follows the same interview pattern:

1. **Question** — what an interviewer may ask.
2. **Answer** — the accurate definition and mechanism.
3. **Example** — a small code sample or production scenario.
4. **Interviewer perspective** — the follow-up, trade-off, or common mistake that distinguishes a strong answer.

## Java interview path

- **Java SE Fundamentals** — control flow, casting, boxing, arrays, lists, streams, lambdas, Optional, date/time, Base64, map helpers, and Java 8 additions.
- **OOP and Object Contracts** — encapsulation, polymorphism, overloading, overriding, static hiding, interfaces, varargs, `equals`, and `hashCode`.
- **Collections and Comparators** — collection interfaces, implementation choices, fail-fast iteration, concurrent collections, immutable collections, and comparator design.
- **Streams and Functional Java** — lazy pipelines, primitive streams, collectors, `toMap`, `groupingBy`, duplicate counting, parallel streams, and method references.
- **JVM, Class Loading, and Garbage Collection** — heap regions, reachability, class-loading failures, references, finalization, leaks, and diagnosis.
- **Threads, Executors, and CompletableFuture** — lifecycle, `start` versus `run`, `Runnable`, synchronization, wait/notify, deadlocks, pools, cancellation, and async composition.
- **Exceptions and Resource Safety** — checked versus unchecked failures, error boundaries, try-with-resources, interruption, and production diagnostics.
- **J2EE Web Container** — servlet lifecycle, `HttpServlet`, Spring's `DispatcherServlet`, filter chains, registration choices, and once-per-request filters.

The existing SQL, microservices, system-design, JavaScript, and behavioral pages remain available under their respective interview sections.

## How to answer a senior-level question

Lead with the rule in one sentence. Explain the mechanism with a minimal example. State the important edge case. Finish with where you would use it, what can fail, and how you would test or observe it. Do not claim that an implementation detail is a language guarantee unless the Java specification or API contract guarantees it.

## Official reading

- [Java Language Specification](https://docs.oracle.com/javase/specs/)
- [Java SE API documentation](https://docs.oracle.com/en/java/javase/21/docs/api/)
- [Dev.java learning](https://dev.java/learn/)
- [Jakarta Servlet specification](https://jakarta.ee/specifications/servlet/)
- [Spring Web MVC documentation](https://docs.spring.io/spring-framework/reference/web/webmvc.html)
