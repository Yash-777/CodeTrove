**Monolithic Architecture**: All modules are built and deployed as one application.
<br/>Example: An e-commerce application handles users, orders, payments, and inventory in one Spring Boot application.

**Microservices Architecture**: Each business capability runs as an independently deployable service. </br>Example: Separate User, Order, Payment, and Inventory Spring Boot services communicate through REST APIs or Kafka.

---

# Design Patterns Used in Microservices

A microservice architecture splits one big application into small services that run, deploy and scale on their own. That brings new problems: *How do services find each other? What if one is down? How do I trace a request across five services? How do I keep data consistent without one database?*

This page groups the patterns by the problem they solve. Every concept is a collapsible block: a **simple explanation first**, then examples (Java / Spring Boot, config, diagrams). Two kinds of patterns appear:

- **Classic (GoF) patterns** such as Factory, Singleton, Proxy, Strategy, Observer. They work *inside* a service.
- **Microservice patterns** such as Service Discovery, Circuit Breaker, API Gateway, Saga. They work *between* services.

---

<details open><summary>Quick map: problem → pattern → common tool</summary>

| Problem | Pattern | Common tool |
|---|---|---|
| Create objects without hard-coding the class | Factory | Spring `BeanFactory` / `ApplicationContext` |
| One shared instance / one per request / one per user | Singleton and bean scopes | Spring `@Scope`, `@RequestScope`, `@SessionScope` |
| Service addresses keep changing | Service Discovery | Eureka, Consul, Kubernetes DNS |
| One entry point for all clients | API Gateway / Reverse Proxy | Spring Cloud Gateway, Nginx, Kong |
| A called service is slow or down | Circuit Breaker (+ Retry, Bulkhead, Timeout) | Resilience4j |
| Trace one request across services | Distributed Tracing + Log Aggregation | Micrometer Tracing (earlier Sleuth), Zipkin, ELK |
| Services should not wait for each other | Messaging / Event-Driven | Kafka, RabbitMQ |
| Same config for many services | Externalized Configuration | Spring Cloud Config, Vault |
| Each service owns its data | Database per Service | One schema or DB per service |
| Transaction across services | Saga | Choreography or Orchestration |
| Reliable "save + publish event" | Transactional Outbox | Outbox table + relay |
| Separate reads from writes | CQRS (+ Event Sourcing) | Read model + write model |
| Combine data from many services | API Composition / BFF | Gateway or aggregator service |
| Add logging/security without touching code | Sidecar / Service Mesh | Envoy, Istio |
| Move from monolith slowly | Strangler Fig | Gateway routing rules |
| Protect from a messy legacy model | Anti-Corruption Layer | Adapter / translator class |
| Know if a service is healthy | Health Check | Spring Boot Actuator, Kubernetes probes |

</details>

<details open><summary>Design patterns in microservices: detailed concepts with examples</summary>

## Part 1: Classic patterns inside a service

<details><summary>Factory design pattern (creating objects)</summary>

### Simple explanation

A **factory** creates objects for you, so the calling code does not use `new` and does not need to know the exact class. *You ask for "a UPI payment" and the factory decides how to build it.*

**Why it helps in microservices:** one service often supports many variants (payment types, notification channels, file parsers). The factory keeps that choice in one place.

| Term | Meaning |
|---|---|
| Product | The interface the caller uses (`PaymentService`) |
| Concrete product | A real implementation (`UpiPayment`, `CardPayment`) |
| Factory | Decides which concrete product to return |

```java
interface PaymentService { void pay(double amount); }

class UpiPayment implements PaymentService {
    public void pay(double amount) { System.out.println("Paid " + amount + " via UPI"); }
}
class CardPayment implements PaymentService {
    public void pay(double amount) { System.out.println("Paid " + amount + " via Card"); }
}

// Simple factory
class PaymentFactory {
    static PaymentService get(String type) {
        return switch (type.toUpperCase()) {
            case "UPI"  -> new UpiPayment();
            case "CARD" -> new CardPayment();
            default     -> throw new IllegalArgumentException("Unknown type: " + type);
        };
    }
}

PaymentFactory.get("upi").pay(500);    // Paid 500.0 via UPI
```

**The Spring way:** Spring itself is a giant factory. The `BeanFactory` / `ApplicationContext` creates and wires your objects. You can let Spring build the lookup map for you:

```java
@Component("UPI")
class UpiPayment implements PaymentService { public void pay(double a) { /* ... */ } }

@Component("CARD")
class CardPayment implements PaymentService { public void pay(double a) { /* ... */ } }

@Service
class PaymentFactory {
    private final Map<String, PaymentService> services;      // key = bean name

    PaymentFactory(Map<String, PaymentService> services) {   // Spring injects all beans of this type
        this.services = services;
    }
    PaymentService get(String type) {
        PaymentService s = services.get(type.toUpperCase());
        if (s == null) throw new IllegalArgumentException("Unknown type: " + type);
        return s;
    }
}
```

> Adding a new payment type now means adding one `@Component`; the factory is never edited (Open/Closed Principle).

| Variant | Simple meaning |
|---|---|
| Simple factory | One method with `switch`/`if` |
| Factory Method | Subclass decides which object to create |
| Abstract Factory | A factory of related factories (e.g. UI kit per OS) |

</details>

<details><summary>Singleton and bean scopes (singleton, prototype, request, session)</summary>

### Simple explanation

**Singleton** means *one instance, shared by everyone*. In Spring, objects are created and managed by the container, and **scope** decides *how long an object lives and who shares it*.

> Spring's "singleton" means **one instance per Spring container**. The classic GoF singleton means one per class loader. They are similar but not the same.

| Scope | Simple meaning | Lifetime | Typical use |
|---|---|---|---|
| `singleton` (default) | One shared object | Whole application | Services, repositories, config (must be stateless) |
| `prototype` | New object every time it is requested | Until garbage collected | Stateful helpers, builders |
| `request` | One object per HTTP request | One request | Request-specific context (user id, trace id) |
| `session` | One object per user session | One HTTP session | Shopping cart, login info |
| `application` | One per `ServletContext` | Web app lifetime | App-wide shared data |
| `websocket` | One per WebSocket session | Socket lifetime | Chat state |

```java
@Service                                   // singleton by default
class OrderService { /* stateless, shared by all threads */ }

@Component
@Scope("prototype")                        // new instance on each injection or getBean()
class ReportBuilder { private final List<String> rows = new ArrayList<>(); }

@Component
@RequestScope                              // one per HTTP request
class RequestContext { private String userId; /* getters/setters */ }

@Component
@SessionScope                              // one per user session
class Cart { private final List<String> items = new ArrayList<>(); }
```

**GoF singleton (without Spring)**

```java
// 1) Best and simplest: enum (thread-safe, serialization-safe)
public enum AppConfig {
    INSTANCE;
    public String env() { return "prod"; }
}
AppConfig.INSTANCE.env();

// 2) Double-checked locking
public class Registry {
    private static volatile Registry instance;      // volatile is required
    private Registry() {}
    public static Registry getInstance() {
        if (instance == null) {
            synchronized (Registry.class) {
                if (instance == null) instance = new Registry();
            }
        }
        return instance;
    }
}
```

> **Microservice tip:** keep singletons **stateless**. If you keep user data in a `session` bean, the next request may land on another instance. Services are usually stateless and store shared session data in **Redis** (Spring Session) or in a JWT token.

**Injecting a short-lived bean into a singleton:** `@RequestScope` and `@SessionScope` beans are wrapped in a **scoped proxy** automatically. The singleton holds the proxy, and the proxy hands out the right instance for the current request.

</details>

<details><summary>Builder, Strategy, Observer, Adapter, Decorator, Facade (other classic patterns)</summary>

### Simple explanation

| Pattern | Simple meaning | Microservice example |
|---|---|---|
| **Builder** | Build a complex object step by step | `ResponseEntity.ok().header(...).body(...)`, Lombok `@Builder` for DTOs |
| **Strategy** | Swap an algorithm at runtime | Different discount, pricing or routing rules chosen per request |
| **Observer** | Subscribers are told when something happens | Spring `ApplicationEvent`, message topics |
| **Adapter** | Convert one interface into another | Wrapping a third-party payment API behind your own interface |
| **Decorator** | Add behaviour around an object | Adding caching or logging around a repository |
| **Facade** | One simple front for a complex subsystem | An "order facade" that calls inventory, payment and shipping |
| **Template Method** | Fixed steps, some steps overridable | `RestTemplate`, `JdbcTemplate` |

```java
// Builder
User u = User.builder().name("Ada").age(30).build();

// Strategy
interface Discount { double apply(double price); }
Discount festival = p -> p * 0.8;
Discount none     = p -> p;
double total = festival.apply(1000);      // 800.0

// Observer with Spring events
record OrderPlaced(long orderId) {}

@Service
class OrderService {
    private final ApplicationEventPublisher publisher;
    OrderService(ApplicationEventPublisher publisher) { this.publisher = publisher; }
    void place(long id) { publisher.publishEvent(new OrderPlaced(id)); }
}

@Component
class EmailListener {
    @EventListener
    void on(OrderPlaced e) { System.out.println("Send email for " + e.orderId()); }
}
```

> Strategy plus Factory is very common: the factory picks the strategy.

</details>

## Part 2: Finding and reaching services

<details><summary>Service discovery</summary>

### Simple explanation

In the cloud, service instances start, stop and move all the time, so their IP addresses keep changing. **Service discovery** is a **phone book for services**: each service registers its name and address, and others look the address up by *name* instead of hard-coding an IP.

```text
 order-service ──"where is payment-service?"──► [ Service Registry ] ◄──register── payment-service (10.0.0.5:8082)
        └────────────────────────call 10.0.0.5:8082────────────────────────────►
```

| Part | Simple meaning |
|---|---|
| **Service registry** | The phone book (Eureka, Consul, ZooKeeper, etcd) |
| **Registration** | A service adds itself on startup (self-registration), or a platform does it (third-party registration) |
| **Heartbeat** | The service says "I'm alive" every few seconds; dead ones are removed |
| **Lookup** | A client asks the registry for the addresses of a service name |

| Type | Who picks the instance? | Example |
|---|---|---|
| **Client-side discovery** | The calling service gets the list and load-balances itself | Eureka + Spring Cloud LoadBalancer |
| **Server-side discovery** | A load balancer or router does the lookup | Kubernetes Service, AWS ELB |

**Eureka server**

```java
@SpringBootApplication
@EnableEurekaServer
public class RegistryApplication {
    public static void main(String[] args) { SpringApplication.run(RegistryApplication.class, args); }
}
```

```yaml
# registry application.yml
server:
  port: 8761
eureka:
  client:
    register-with-eureka: false     # the registry does not register itself
    fetch-registry: false
```

**Eureka client (any microservice)**

```yaml
spring:
  application:
    name: payment-service          # the name other services will use
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka
```

**Calling by name**

```java
@Configuration
class WebConfig {
    @Bean
    @LoadBalanced                                   // resolves the name via the registry
    RestTemplate restTemplate() { return new RestTemplate(); }
}

// "payment-service" is a service name, not a host
Payment p = restTemplate.getForObject("http://payment-service/payments/1", Payment.class);

// Declarative style with OpenFeign
@FeignClient(name = "payment-service")
interface PaymentClient {
    @GetMapping("/payments/{id}")
    Payment byId(@PathVariable long id);
}
```

> **On Kubernetes** you often skip Eureka: every `Service` gets a DNS name (`http://payment-service`), and Kubernetes does the discovery and load balancing.
> **Note:** the old Netflix Ribbon client load balancer was replaced by Spring Cloud LoadBalancer.

</details>

<details><summary>API gateway, reverse proxy and the Proxy pattern</summary>

### Simple explanation

A **proxy** is a **middleman** that stands between a caller and the real thing.

| Type | Simple meaning | Whose side? |
|---|---|---|
| **Forward proxy** | Hides the *client* from the internet (company proxy, VPN) | Client side |
| **Reverse proxy** | Hides the *servers* from the client; the client talks to one address and the proxy forwards to the right server | Server side |
| **API Gateway** | A reverse proxy that also understands APIs: routing, authentication, rate limiting, aggregation | Server side |

```text
 Client ──► [ API Gateway / Reverse Proxy ] ──► order-service
                 │ routing, auth, SSL,         ──► payment-service
                 │ rate limit, logging         ──► user-service
```

**What a gateway does (one entry point for all clients)**

| Job | Simple meaning |
|---|---|
| Routing | `/orders/**` goes to order-service |
| Authentication | Check the JWT once, not in every service |
| SSL termination | Handle HTTPS at the edge |
| Rate limiting | Block clients that send too many requests |
| Load balancing | Spread calls over instances |
| Aggregation | Combine several service responses into one |
| Cross-cutting | Logging, CORS, header changes, caching |

**Spring Cloud Gateway**

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order-service
          uri: lb://ORDER-SERVICE            # lb:// = look up via service discovery
          predicates:
            - Path=/orders/**
          filters:
            - AddRequestHeader=X-Source, gateway
        - id: payment-service
          uri: lb://PAYMENT-SERVICE
          predicates:
            - Path=/payments/**
```

**Nginx as a reverse proxy**

```nginx
upstream order_service {
    server 10.0.0.1:8081;
    server 10.0.0.2:8081;                    # Nginx load-balances across both
}
server {
    listen 80;
    location /orders/ {
        proxy_pass http://order_service;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

**The GoF Proxy pattern in Java** (an object that controls access to another object, used for logging, security, lazy loading, caching, and transactions in Spring):

```java
interface Greeter { String hello(String name); }

Greeter real = name -> "Hello " + name;

Greeter proxy = (Greeter) Proxy.newProxyInstance(
    Greeter.class.getClassLoader(),
    new Class[]{ Greeter.class },
    (p, method, args) -> {
        System.out.println("before: " + method.getName());     // extra behaviour
        Object result = method.invoke(real, args);
        System.out.println("after");
        return result;
    });

proxy.hello("Yash");     // before: hello -> after
```

> Spring AOP (`@Transactional`, `@Cacheable`, `@Async`) works exactly like this: Spring wraps your bean in a **proxy** and adds the extra behaviour around your method.

**Related patterns**

| Pattern | Simple meaning |
|---|---|
| **Backend for Frontend (BFF)** | A separate gateway per client type (web, mobile), each shaping data for its UI |
| **API Composition / Aggregator** | One service calls several others and merges the answers |
| **Edge service** | Another name for a gateway at the system boundary |

> **Note:** Netflix Zuul was replaced by Spring Cloud Gateway in the Spring ecosystem.

</details>

## Part 3: Staying alive when things fail

<details><summary>Circuit breaker (with Retry, Timeout, Bulkhead, Rate Limiter, Fallback)</summary>

### Simple explanation

Like the **circuit breaker (fuse) in your home**: if a called service keeps failing, the breaker **opens** and stops sending requests for a while. This gives the broken service time to recover and stops your service from wasting threads waiting for a dead one (**cascading failure**).

```text
        failures > threshold               wait time over
 CLOSED ───────────────────► OPEN ─────────────────────► HALF-OPEN
 (calls pass)               (calls blocked,             (a few test calls)
    ▲                        fallback used)                  │
    └───────────── test calls succeed ◄──────────────────────┤
                                  test calls fail ───────────► back to OPEN
```

| State | Simple meaning |
|---|---|
| **Closed** | Normal. Requests pass and failures are counted |
| **Open** | Too many failures. Requests fail immediately and the **fallback** runs |
| **Half-open** | After a wait, a few trial requests go through. If they succeed → Closed, else → Open |

**Resilience4j example**

```java
@Service
public class OrderClient {
    private final RestTemplate restTemplate;
    public OrderClient(RestTemplate restTemplate) { this.restTemplate = restTemplate; }

    @CircuitBreaker(name = "payment", fallbackMethod = "paymentFallback")
    public String callPayment(long id) {
        return restTemplate.getForObject("http://payment-service/payments/" + id, String.class);
    }

    // same parameters + the exception
    private String paymentFallback(long id, Throwable t) {
        return "Payment service is busy, please try again later";
    }
}
```

```yaml
resilience4j:
  circuitbreaker:
    instances:
      payment:
        slidingWindowSize: 10                    # look at the last 10 calls
        failureRateThreshold: 50                 # open when 50% fail
        waitDurationInOpenState: 10s             # stay open for 10 seconds
        permittedNumberOfCallsInHalfOpenState: 3 # trial calls
```

**Companion resilience patterns**

| Pattern | Simple meaning | Annotation / example |
|---|---|---|
| **Timeout** | Don't wait forever | `@TimeLimiter(name = "payment")` |
| **Retry** | Try again on temporary failure (with a delay) | `@Retry(name = "payment")` |
| **Bulkhead** | Limit concurrent calls so one slow service cannot use all threads (like ship compartments) | `@Bulkhead(name = "payment")` |
| **Rate limiter** | Allow only N calls per period | `@RateLimiter(name = "payment")` |
| **Fallback** | A safe default answer when the call fails (cached value, empty list, message) | `fallbackMethod = "..."` |
| **Cache** | Serve the last good result | `@Cacheable` |

```yaml
resilience4j:
  retry:
    instances:
      payment:
        maxAttempts: 3
        waitDuration: 500ms
```

> **Order matters:** Retry wraps the Circuit Breaker, which wraps the Bulkhead and Timeout. Retry only **idempotent** operations (safe to repeat), or you may charge a customer twice.
> **Note:** Netflix Hystrix is in maintenance mode; **Resilience4j** is the common replacement.

</details>

<details><summary>Health check and graceful degradation</summary>

### Simple explanation

A **health check** is an endpoint that says whether a service is alive and ready. Orchestrators (Kubernetes) and registries use it to restart or stop routing to bad instances.

| Probe | Question it answers | Kubernetes action |
|---|---|---|
| **Liveness** | Is the process stuck? | Restart the container |
| **Readiness** | Can it take traffic now (DB connected, cache warm)? | Remove from the load balancer until ready |

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      probes:
        enabled: true          # /actuator/health/liveness and /readiness
```

```yaml
# Kubernetes deployment snippet
livenessProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
readinessProbe:
  httpGet: { path: /actuator/health/readiness, port: 8080 }
```

</details>

## Part 4: Seeing what is happening

<details><summary>Distributed tracing and log aggregation (Sleuth / Micrometer Tracing, Zipkin, ELK)</summary>

### Simple explanation

One user click can travel through many services. If something fails, which service is to blame? **Distributed tracing** gives the whole journey **one ID** so you can follow it everywhere. *Like a courier tracking number that follows a parcel through every hub.*

| Term | Simple meaning |
|---|---|
| **Trace ID** | One ID for the **whole request** across all services |
| **Span ID** | One ID for **one step** (one service call) inside the trace |
| **Parent span** | The span that started this step |
| **Correlation ID** | A custom request ID you pass in a header, doing the same job |
| **Sampling** | Record only a percentage of traces to save cost |

```text
 trace = 7f3a...                                    (same in every log line)
 gateway        span=a1         ─┐
 order-service  span=b2 (parent=a1) ─┤  all share trace 7f3a...
 payment-service span=c3 (parent=b2) ─┘
```

**Spring Cloud Sleuth** added the trace and span IDs to every log line and propagated them through HTTP calls and messages. **Sleuth was retired with Spring Boot 3.** The replacement is **Micrometer Tracing**, which does the same job.

*Log line with Sleuth or Micrometer Tracing:*

```text
INFO [order-service,7f3a9c2b1d4e5f60,b2c3d4e5f6a7b8c9] Order 42 created
INFO [payment-service,7f3a9c2b1d4e5f60,c3d4e5f6a7b8c9d0] Charging 500.00
        └── app name ──┘ └──── trace id ────┘ └──── span id ────┘
```

**Spring Boot 3 (Micrometer Tracing + Zipkin)**

```xml
<dependency><groupId>io.micrometer</groupId><artifactId>micrometer-tracing-bridge-brave</artifactId></dependency>
<dependency><groupId>io.zipkin.reporter2</groupId><artifactId>zipkin-reporter-brave</artifactId></dependency>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-actuator</artifactId></dependency>
```

```yaml
management:
  tracing:
    sampling:
      probability: 1.0            # trace 100% (use less in production)
  zipkin:
    tracing:
      endpoint: http://localhost:9411/api/v2/spans
logging:
  pattern:
    level: "%5p [${spring.application.name:},%X{traceId:-},%X{spanId:-}]"
```

**Spring Boot 2 (Sleuth, for old projects)**

```xml
<dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-starter-sleuth</artifactId></dependency>
<dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-sleuth-zipkin</artifactId></dependency>
```

**Your own correlation ID with MDC** (works with any framework)

```java
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String id = Optional.ofNullable(req.getHeader("X-Correlation-Id"))
                            .orElse(UUID.randomUUID().toString());
        MDC.put("correlationId", id);                 // appears in every log line via %X{correlationId}
        res.setHeader("X-Correlation-Id", id);        // return it to the caller
        try { chain.doFilter(req, res); }
        finally { MDC.remove("correlationId"); }
    }
}
```

> Pass `X-Correlation-Id` on every outgoing call too (a `RestTemplate` interceptor or Feign `RequestInterceptor`).

**The three pillars of observability**

| Pillar | Simple meaning | Tools |
|---|---|---|
| **Logs** | What happened (events) | ELK (Elasticsearch, Logstash, Kibana), Loki + Grafana |
| **Metrics** | How much / how fast (numbers) | Micrometer, Prometheus, Grafana |
| **Traces** | Where the time went across services | Zipkin, Jaeger, Tempo |

> **Log Aggregation pattern:** every service writes **structured (JSON) logs** to stdout, an agent ships them to one central store, and you search them all in one place using the trace ID.

</details>

## Part 5: Talking without waiting

<details><summary>Messaging and event-driven communication</summary>

### Simple explanation

Services can talk **synchronously** (REST, gRPC: ask and wait) or **asynchronously** (messaging: drop a message in a mailbox and carry on). **Messaging** puts a **broker** between services so they do not need to be up at the same time.

| | Synchronous (REST / gRPC) | Asynchronous (messaging) |
|---|---|---|
| Style | Request → wait → response | Send → continue; consumer handles it later |
| Coupling | Caller needs the callee running | Loose; broker holds the message |
| Failure | Callee down → caller fails | Message waits in the queue |
| Use for | Queries needing an immediate answer | Commands, notifications, events |

| Concept | Simple meaning |
|---|---|
| **Message broker** | The post office (Kafka, RabbitMQ, ActiveMQ, AWS SQS/SNS) |
| **Producer / Publisher** | Sends messages |
| **Consumer / Subscriber** | Receives messages |
| **Queue (point-to-point)** | Each message is handled by **one** consumer |
| **Topic (publish/subscribe)** | Each message is delivered to **all** interested subscribers |
| **Consumer group** | Instances of one service share a topic's work |
| **Dead Letter Queue (DLQ)** | Where messages that keep failing are parked |
| **Event** | "Something happened" (`OrderCreated`) |
| **Command** | "Please do this" (`ChargeCard`) |

```text
 order-service ──publish──► [ topic: order-created ] ──► inventory-service
                                                     ──► email-service
                                                     ──► analytics-service
```

**Kafka with Spring Boot**

```java
@Service
public class OrderPublisher {
    private final KafkaTemplate<String, String> kafka;
    public OrderPublisher(KafkaTemplate<String, String> kafka) { this.kafka = kafka; }

    public void publish(String orderId, String json) {
        kafka.send("order-created", orderId, json);        // topic, key, value
    }
}

@Component
public class InventoryListener {
    @KafkaListener(topics = "order-created", groupId = "inventory-service")
    public void on(String message) {
        System.out.println("Reserve stock for: " + message);
    }
}
```

**RabbitMQ with Spring Boot**

```java
rabbitTemplate.convertAndSend("orders.exchange", "order.created", payload);

@RabbitListener(queues = "inventory.queue")
public void handle(String payload) { /* ... */ }
```

**Rules for reliable messaging**

| Rule | Why |
|---|---|
| **Idempotent consumer** | Messages can arrive twice; handling one twice must not break anything (store processed message IDs) |
| **Retry + DLQ** | Retry temporary errors, then park poison messages |
| **Ordering by key** | In Kafka, messages with the same key go to the same partition, so they stay in order |
| **Schema versioning** | Add fields without breaking old consumers (Avro, JSON with defaults) |
| **At-least-once** | The common delivery guarantee; combine with idempotency |

| Pattern | Simple meaning |
|---|---|
| **Publish/Subscribe** | One event, many listeners |
| **Event-Carried State Transfer** | The event holds the data, so consumers don't call back |
| **Request-Reply over messaging** | Reply goes to a reply queue |
| **Competing Consumers** | Many instances read one queue to scale out |

</details>

## Part 6: Data and transactions

<details><summary>Database per service</summary>

### Simple explanation

Each microservice **owns its own data** and no other service reads its tables directly. Others must ask through its API or events. This keeps services independent, but it means no easy joins and no single big transaction.

| Choice | Meaning |
|---|---|
| **Private tables** | Same server, separate schema per service |
| **Private database** | Fully separate DB per service |
| **Polyglot persistence** | Each service uses the best DB (SQL for orders, Mongo for catalog, Redis for cache) |

```text
 order-service ─► orders DB          payment-service ─► payments DB
        └── needs payment info? call payment-service API or listen to its events
```

> The price: **data duplication** and **eventual consistency** (data becomes consistent a moment later). The patterns below handle that.

</details>

<details><summary>Saga (distributed transaction)</summary>

### Simple explanation

A normal DB transaction cannot span several services. A **saga** is a **chain of local transactions**; if one step fails, the saga runs **compensating transactions** (undo steps) for the steps that already finished.

*Booking a trip: book flight → book hotel → charge card. If the card fails, cancel the hotel and cancel the flight.*

```text
 Create Order ─► Reserve Stock ─► Charge Payment ─► Confirm Order
      ▲                │                │
      │    (payment fails)              ▼
      └──── Cancel Order ◄── Release Stock   (compensations run backwards)
```

| Style | Simple meaning | Pros | Cons |
|---|---|---|---|
| **Choreography** | No boss. Each service listens to events and publishes the next one | Simple, loosely coupled | Hard to see the whole flow as it grows |
| **Orchestration** | A central **orchestrator** tells each service what to do next | Clear flow, easier to manage failures | Orchestrator is an extra component |

**Choreography example**

```java
// order-service
orderRepo.save(order);                                   // status = PENDING
kafka.send("order-created", orderId, json);

// inventory-service
@KafkaListener(topics = "order-created", groupId = "inventory")
void reserve(String json) {
    boolean ok = stock.reserve(json);
    kafka.send(ok ? "stock-reserved" : "stock-failed", key, json);
}

// payment-service
@KafkaListener(topics = "stock-reserved", groupId = "payment")
void charge(String json) { /* publish payment-completed or payment-failed */ }

// order-service (compensation)
@KafkaListener(topics = {"stock-failed", "payment-failed"}, groupId = "order")
void cancel(String json) { order.setStatus("CANCELLED"); orderRepo.save(order); }
```

> **Tools for orchestration:** Camunda, Temporal, Netflix Conductor, Axon. Remember: sagas are **eventually consistent**, and compensations must also be idempotent.

</details>

<details><summary>Transactional outbox (reliable "save and publish")</summary>

### Simple explanation

**Problem:** a service saves to its database **and** sends an event. If the DB commit works but the broker is down (or the reverse), the data and the event disagree. You cannot make a DB and a broker commit together.

**Solution:** in the **same local transaction**, save the business data and also insert the event into an **outbox table**. A separate relay reads the outbox and publishes to the broker, then marks the row as sent.

```java
@Transactional                                   // one DB transaction
public void placeOrder(Order order) {
    orderRepo.save(order);
    outboxRepo.save(new OutboxEvent("order-created", order.getId(), toJson(order)));
}

// a scheduled job or Debezium (change data capture) publishes pending rows
@Scheduled(fixedDelay = 1000)
public void relay() {
    for (OutboxEvent e : outboxRepo.findUnsent()) {
        kafka.send(e.getTopic(), e.getKey(), e.getPayload());
        e.markSent();
    }
}
```

```sql
CREATE TABLE outbox (
  id BIGINT PRIMARY KEY,
  topic VARCHAR(100),
  event_key VARCHAR(100),
  payload JSON,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

> The relay may publish a message twice, so consumers must be **idempotent**. A related pattern is the **Inbox** (the consumer saves processed message IDs).

</details>

<details><summary>CQRS and Event Sourcing</summary>

### Simple explanation

**CQRS** (Command Query Responsibility Segregation) means **separate models for writing and reading**. Commands change data; queries only read, often from a fast, shaped-for-the-screen copy.

| | Command side | Query side |
|---|---|---|
| Purpose | Change state (`PlaceOrder`) | Read state (`GetOrderSummary`) |
| Model | Rich business rules | Flat, denormalized view |
| Store | Normalized DB | Read DB / cache / Elasticsearch |
| Sync | Publishes events | Updates the view from events |

```java
// Command side
record PlaceOrderCommand(long customerId, List<Long> items) {}
class OrderCommandService { void handle(PlaceOrderCommand c) { /* validate, save, publish OrderPlaced */ } }

// Query side
record OrderSummary(long orderId, String customerName, double total) {}
class OrderQueryService { OrderSummary get(long id) { /* read from the read model */ return null; } }
```

**Event Sourcing** stores **every change as an event** instead of only the latest state. The current state is rebuilt by replaying the events. *A bank statement: you never store just "balance"; you store each deposit and withdrawal.*

```java
record AccountOpened(String id) {}
record MoneyDeposited(String id, double amount) {}
record MoneyWithdrawn(String id, double amount) {}

double balance = 0;
for (Object e : events) {
    if (e instanceof MoneyDeposited d)      balance += d.amount();
    else if (e instanceof MoneyWithdrawn w) balance -= w.amount();
}
```

| Benefit | Cost |
|---|---|
| Full audit history, can replay or rebuild views | More complexity, eventual consistency |
| Natural fit with CQRS and messaging | Event schema changes need care |

> Use CQRS and Event Sourcing only where the benefit is real (audit, heavy read load). They are **not** the default.

</details>

<details><summary>API composition (aggregator) and Backend for Frontend</summary>

### Simple explanation

Because each service owns its data, one screen may need data from several services. An **API composer** calls them and merges the answers so the client makes **one** call.

```java
@RestController
class OrderDetailsController {
    private final OrderClient orders;
    private final CustomerClient customers;
    private final PaymentClient payments;
    // constructor omitted

    @GetMapping("/order-details/{id}")
    OrderDetails get(@PathVariable long id) {
        Order order = orders.byId(id);
        // call the other two in parallel
        CompletableFuture<Customer> c = CompletableFuture.supplyAsync(() -> customers.byId(order.customerId()));
        CompletableFuture<Payment>  p = CompletableFuture.supplyAsync(() -> payments.byOrder(id));
        return new OrderDetails(order, c.join(), p.join());
    }
}
```

**BFF (Backend for Frontend):** a separate aggregator for each client (web BFF, mobile BFF), so the mobile app gets a small payload and the web app gets a rich one.

> Wrap each downstream call with a circuit breaker and a fallback so one slow service does not break the whole page.

</details>

## Part 7: Configuration, platform and migration

<details><summary>Externalized configuration (Config Server)</summary>

### Simple explanation

Keep configuration **outside** the code so the same build runs in dev, test and prod, and so many services share one central, versioned source (usually a Git repo).

```java
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication { /* ... */ }
```

```yaml
# config server
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/your-org/config-repo
```

```yaml
# client service
spring:
  application:
    name: order-service
  config:
    import: "configserver:http://localhost:8888"
```

| Option | Simple meaning |
|---|---|
| Spring Cloud Config | Central config backed by Git |
| Kubernetes ConfigMap / Secret | Config as platform objects |
| HashiCorp Vault | Secrets with access control and rotation |
| Environment variables | The 12-factor way to override values |

> Keep **secrets** (passwords, keys) in Vault or Kubernetes Secrets, never in plain Git.

</details>

<details><summary>Sidecar and service mesh</summary>

### Simple explanation

A **sidecar** is a helper container that runs **next to** your service (like a sidecar on a motorbike) and handles cross-cutting work: TLS, retries, metrics, tracing, routing. Your code stays focused on business logic and can be in any language.

A **service mesh** is many sidecars (the **data plane**, e.g. Envoy) controlled by a **control plane** (e.g. Istio, Linkerd).

```text
 ┌──────── Pod ────────┐        ┌──────── Pod ────────┐
 │ order-service       │        │ payment-service     │
 │   ▲   │             │        │   ▲   │             │
 │ [sidecar proxy] ────┼──mTLS──┼─► [sidecar proxy]   │
 └─────────────────────┘        └─────────────────────┘
          control plane: routing rules, certificates, policies
```

| What the mesh gives you | Without a mesh |
|---|---|
| mTLS between services | Code it in each service |
| Retries, timeouts, circuit breaking | Resilience4j in each service |
| Traffic splitting (canary 90/10) | Custom gateway rules |
| Metrics and traces for free | Add libraries everywhere |

</details>

<details><summary>Strangler fig (migrating from a monolith)</summary>

### Simple explanation

Named after a vine that slowly grows around a tree and replaces it. Instead of a risky "big bang" rewrite, put a **gateway in front** of the monolith and **move one feature at a time** to new microservices. The gateway sends that feature's traffic to the new service. When nothing is left, retire the monolith.

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: new-orders              # already migrated
          uri: lb://ORDER-SERVICE
          predicates: [ Path=/orders/** ]
        - id: legacy                  # everything else still goes to the monolith
          uri: http://legacy-app:8080
          predicates: [ Path=/** ]
```

> Related: **Anti-Corruption Layer (ACL)**: a translator class between the new services and the legacy system so the messy old model does not leak into the new design.

```java
class LegacyCustomerAdapter {                       // ACL (Adapter pattern)
    Customer toCustomer(LegacyCustRec r) {
        return new Customer(r.CUST_ID, r.CUST_NM.trim());   // map old names to the clean model
    }
}
```

</details>

<details><summary>Idempotency, API versioning and other supporting patterns</summary>

### Simple explanation

| Pattern | Simple meaning | Example |
|---|---|---|
| **Idempotency key** | Doing the same request twice has the same effect as once | Client sends `Idempotency-Key`; server stores it and returns the saved result on a repeat |
| **API versioning** | Change an API without breaking old clients | `/v1/orders`, `/v2/orders` or a header |
| **Pagination / filtering** | Don't return a huge list | `?page=0&size=20` |
| **Consumer-driven contracts** | Test that provider and consumer agree on the API | Spring Cloud Contract, Pact |
| **Blue-green / canary deploy** | Release safely | Route 10% of traffic to the new version |
| **Service per team** | One team owns one service end to end | Conway's law |
| **Sharding / partitioning** | Split data by key | Kafka partitions, DB shards |

```java
@PostMapping("/payments")
ResponseEntity<Payment> pay(@RequestHeader("Idempotency-Key") String key, @RequestBody PayRequest req) {
    return idempotencyStore.find(key)                       // seen before? return the saved result
        .map(ResponseEntity::ok)
        .orElseGet(() -> {
            Payment p = paymentService.charge(req);
            idempotencyStore.save(key, p);
            return ResponseEntity.ok(p);
        });
}
```

</details>

## Summary

<details><summary>Which pattern for which situation (cheat sheet)</summary>

```text
Create objects by type          -> Factory
One shared / per request / per session instance -> Singleton and scopes
Find services by name           -> Service Discovery (Eureka, Consul, K8s DNS)
One front door                  -> API Gateway / Reverse Proxy
Wrap an object with extra behaviour -> Proxy (Spring AOP)
Dependency is failing           -> Circuit Breaker + Retry + Timeout + Bulkhead + Fallback
Follow a request everywhere     -> Distributed Tracing (traceId, spanId) + Log Aggregation
Don't wait for other services   -> Messaging / Events (Kafka, RabbitMQ)
Each service its own data       -> Database per Service
Multi-service transaction       -> Saga (choreography or orchestration)
Save + publish reliably         -> Transactional Outbox
Separate read and write         -> CQRS (+ Event Sourcing)
Merge data for one screen       -> API Composition / BFF
Central config                  -> Config Server / Vault
Cross-cutting infra             -> Sidecar / Service Mesh
Leave the monolith slowly       -> Strangler Fig (+ Anti-Corruption Layer)
```

</details>

<details><summary>Concept-wise interview questions and answers</summary>

<details><summary>What is the Factory pattern and where do you see it in Spring?</summary>

A factory creates objects so callers don't use `new` or know the concrete class. Spring's `BeanFactory` / `ApplicationContext` is a factory: it creates, configures and wires beans. You can also inject a `Map<String, Interface>` to build your own lookup factory.

</details>

<details><summary>What are Spring bean scopes?</summary>

`singleton` (default, one per container), `prototype` (new each time), `request` (one per HTTP request), `session` (one per user session), `application` and `websocket`. Request and session scopes are available only in web applications.

</details>

<details><summary>Is a Spring singleton the same as the GoF singleton?</summary>

No. A Spring singleton is one instance per **Spring container** (so two contexts can hold two instances). A GoF singleton is one instance per **class loader**, enforced by the class itself. Spring singletons must be stateless to be thread-safe.

</details>

<details><summary>What is service discovery, and client-side vs server-side?</summary>

A registry lets services find each other by name instead of fixed IPs. In **client-side** discovery the caller fetches the instance list and load-balances (Eureka + Spring Cloud LoadBalancer). In **server-side** discovery a router or load balancer does it (Kubernetes Service, AWS ELB).

</details>

<details><summary>Reverse proxy vs forward proxy vs API gateway?</summary>

A forward proxy represents the client, a reverse proxy represents the servers, and an API gateway is a reverse proxy with API features such as authentication, rate limiting, routing and aggregation.

</details>

<details><summary>How does a circuit breaker work?</summary>

It has three states. **Closed**: calls pass and failures are counted. **Open**: after the failure threshold, calls fail fast and a fallback runs. **Half-open**: after a wait, a few trial calls decide whether to close again or reopen. It prevents cascading failures.

</details>

<details><summary>Circuit breaker vs retry vs bulkhead?</summary>

Retry repeats a failed call. Circuit breaker stops calling a failing service. Bulkhead limits concurrent calls so one slow dependency cannot exhaust all threads. They are used together, and retry must be limited to idempotent operations.

</details>

<details><summary>How do you trace a request across microservices?</summary>

Give each request a **trace ID** that is passed through every call and added to the logs, with a **span ID** per step. Use Micrometer Tracing (Sleuth in Spring Boot 2) with Zipkin or Jaeger, and send logs to a central store (ELK, Loki) so you can search by trace ID.

</details>

<details><summary>What happened to Spring Cloud Sleuth?</summary>

It supported Spring Boot 2.x and was retired with Spring Boot 3. Its tracing features moved to **Micrometer Tracing**, which keeps the same ideas (trace ID, span ID, propagation, Zipkin export).

</details>

<details><summary>Synchronous vs asynchronous communication?</summary>

Synchronous (REST, gRPC) waits for a reply and couples the caller to the callee's availability. Asynchronous messaging uses a broker so the caller continues immediately and the consumer processes later, which gives looser coupling and better resilience, at the cost of eventual consistency.

</details>

<details><summary>Queue vs topic?</summary>

A queue delivers each message to one consumer (point-to-point, load sharing). A topic delivers each message to every subscriber (publish/subscribe). In Kafka, consumer groups give both behaviours: one consumer per partition within a group, every group receives all messages.

</details>

<details><summary>How do you handle duplicate messages?</summary>

Make consumers idempotent: store processed message IDs (inbox table), use natural idempotency (upsert by key), and use unique constraints. Most brokers give at-least-once delivery, so duplicates are normal.

</details>

<details><summary>How do you handle transactions across services?</summary>

Use a **Saga**: a series of local transactions with compensating actions for rollback, either choreographed with events or orchestrated by a coordinator. Avoid two-phase commit across services because it couples them and hurts availability.

</details>

<details><summary>What is the transactional outbox pattern?</summary>

Write the business data and the event to an outbox table in one local transaction. A relay (poller or change-data-capture like Debezium) publishes it to the broker. This avoids the "saved but not published" problem.

</details>

<details><summary>What is CQRS, and when would you use it?</summary>

Separating the write model from the read model. Use it when reads and writes have very different needs (heavy read load, complex views, audit). It adds complexity and eventual consistency, so it is not the default.

</details>

<details><summary>Why one database per service?</summary>

It keeps services loosely coupled and independently deployable and scalable, and lets each pick the best storage. The cost is no cross-service joins or ACID transactions, so you use APIs, events, and sagas.

</details>

<details><summary>What is a sidecar?</summary>

A helper container deployed with the service that handles cross-cutting concerns (TLS, retries, metrics, routing). Many sidecars managed by a control plane form a service mesh such as Istio.

</details>

<details><summary>What is the strangler fig pattern?</summary>

Gradually replace a monolith by routing feature after feature to new services through a gateway, instead of a big-bang rewrite. The monolith shrinks until it can be retired.

</details>

<details><summary>What is the difference between an API gateway and a service mesh?</summary>

A gateway handles **north-south** traffic (clients → system) at the edge. A service mesh handles **east-west** traffic (service ↔ service) inside the system with sidecars.

</details>

</details>
</details>

## References

[microservices.io patterns catalog (Chris Richardson)](https://microservices.io/patterns/index.html) · [Spring Cloud documentation](https://spring.io/projects/spring-cloud) · [Spring Cloud Gateway](https://spring.io/projects/spring-cloud-gateway) · [Resilience4j documentation](https://resilience4j.readme.io/) · [Micrometer Tracing](https://micrometer.io/docs/tracing) · [Spring Framework bean scopes](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)