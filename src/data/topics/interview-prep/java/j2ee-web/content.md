# J2EE Web Container — Interview Q&A

<details><summary>What is a servlet and what is its lifecycle?</summary>

### Answer
A servlet is a server-side Java component managed by a servlet container. The container creates or obtains the servlet, calls `init`, invokes `service` for requests, and calls `destroy` during removal. An `HttpServlet` dispatches HTTP methods such as `doGet` and `doPost`.

### Example
```java
public class HealthServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request,
                          HttpServletResponse response) throws IOException {
        response.setContentType("text/plain");
        response.getWriter().println("ok");
    }
}
```

### Interviewer perspective
Servlet instances can handle concurrent requests. Do not store request-specific mutable data in instance fields. Explain `ServletConfig` for servlet-specific initialization and `ServletContext` for application-wide context.
</details>

<details><summary>What is the servlet container responsible for?</summary>

### Answer
The container maps requests, manages servlet lifecycle, creates request/response objects, controls sessions, runs filters, handles concurrency, and provides configuration and dispatching facilities. It also owns the boundary between the HTTP server and application components.

### Example
```text
HTTP request → container mapping → filter chain → servlet service → response
```

### Interviewer perspective
Keep container responsibilities separate from business services. A servlet should translate the protocol boundary, validate input, call application logic, and construct a response rather than own persistence logic.
</details>

<details><summary>How does Spring's DispatcherServlet relate to the servlet container?</summary>

### Answer
`DispatcherServlet` is a servlet registered with the servlet container and acts as Spring MVC's front controller. After container-level filters run, it uses handler mappings to find a controller, invokes interceptors and controller methods, resolves the response, and returns through the filter chain.

### Example
```text
Tomcat → Filter chain → DispatcherServlet → HandlerMapping → Controller
       ← response filters ← view/message conversion ← controller result
```

### Interviewer perspective
Distinguish servlet-container filters from Spring interceptors. Filters can run before Spring is entered and can handle non-Spring resources; interceptors operate around Spring handler execution.
</details>

<details><summary>What is a servlet Filter and when is it useful?</summary>

### Answer
A filter intercepts requests and responses before and after the target resource. Common uses include authentication, CORS headers, logging, auditing, compression, encryption, request correlation, and body caching. A filter must call `chain.doFilter` when the request should continue.

### Example
```java
@Component
class RequestLogFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {
        long start = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            System.out.println(System.nanoTime() - start);
        }
    }
}
```

### Interviewer perspective
A filter can short-circuit the request by sending a response and not calling the chain. Explain ordering, error dispatches, async dispatches, and whether sensitive headers or bodies are safe to log.
</details>

<details><summary>What is FilterConfig and how do you register a Spring filter?</summary>

### Answer
`FilterConfig` supplies the filter name, servlet context, and initialization parameters. In Spring Boot, `FilterRegistrationBean` gives programmatic control over URL patterns, order, and init parameters. `@WebFilter` with `@ServletComponentScan` is the standard Servlet 3 approach but has different dependency-injection and ordering behavior.

### Example
```java
@Bean
FilterRegistrationBean<RequestLogFilter> loggingFilter(RequestLogFilter filter) {
    var registration = new FilterRegistrationBean<>(filter);
    registration.addUrlPatterns("/api/*");
    registration.setOrder(10);
    registration.addInitParameter("redact", "authorization,cookie");
    return registration;
}
```

### Interviewer perspective
Prefer explicit registration when Spring dependency injection, ordering, and configuration matter. Never log raw authorization headers just because a filter can read them.
</details>

<details><summary>What is OncePerRequestFilter and why is it useful?</summary>

### Answer
Spring's `OncePerRequestFilter` provides a template that ensures filter logic runs once per request dispatch under its configured dispatch rules. It is useful for request logging, JWT extraction, correlation IDs, and other logic that should not repeat during forwards or includes.

### Example
```java
@Component
class CorrelationFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {
        String id = UUID.randomUUID().toString();
        try (MDC.MDCCloseable ignored = MDC.putCloseable("requestId", id)) {
            chain.doFilter(request, response);
        }
    }
}
```

### Interviewer perspective
“Once” is scoped to the request dispatch behavior and configuration; it is not a global once-only guarantee. Ask how async and error dispatches should be treated.
</details>

<details><summary>How can a request body be read more than once?</summary>

### Answer
The servlet request body is normally a forward-only stream. A caching wrapper reads it once and exposes repeatable readers to downstream components. The wrapper must enforce a size limit and the response wrapper must copy its buffered content back before returning.

### Example
```java
try {
    filterChain.doFilter(cachedRequest, cachedResponse);
} finally {
    audit(cachedRequest.getCachedBody());
    cachedResponse.copyBodyToResponse();
}
```

### Interviewer perspective
Request-body caching can consume memory, expose secrets, and break streaming uploads. Use it only for bounded payloads and redact credentials before logging.
</details>

## References

- [Jakarta Servlet specification](https://jakarta.ee/specifications/servlet/)
- [HttpServlet API](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/http/HttpServlet.html)
- [Spring OncePerRequestFilter](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/filter/OncePerRequestFilter.html)
- [Spring FilterRegistrationBean](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/web/servlet/FilterRegistrationBean.html)
