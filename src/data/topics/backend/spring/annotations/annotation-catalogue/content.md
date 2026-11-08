# Spring Framework Annotations — Complete Catalogue

Annotations are metadata, not behaviour. Spring reads them while it builds the `ApplicationContext`: component scanning turns annotated classes into `BeanDefinition`s, `AutowiredAnnotationBeanPostProcessor` performs injection, and proxy creators read `@Transactional`, `@Cacheable`, `@Async` and `@PreAuthorize` to wrap a bean in an advisor. Nothing in an annotation *does* anything on its own — a container or a post-processor has to interpret it.

Two questions decide everything in this page:

1. **Which beans exist?** — registration annotations (`@Component`, `@Bean`, `@Configuration`, `@Import`, `@ComponentScan`).
2. **How are they wired and used?** — injection and selection (`@Autowired`, `@Qualifier`, `@Primary`), lifecycle (`@PostConstruct`), and cross-cutting behaviour (`@Transactional`, `@Aspect`, `@Scheduled`).

All examples below use one small car-garage domain so the annotations stay comparable:

```java
public interface Engine {
    String start();
}

public interface Tyre {
    int gripLevel();
}
```

## 1. Beans and registration

| Annotation | Package | What it does | Car example |
|---|---|---|---|
| `@Component` | `org.springframework.stereotype` | Marks a class for classpath scanning; bean name defaults to the decapitalised class name. | `@Component class PetrolEngine implements Engine` → bean `petrolEngine` |
| `@Service` | `org.springframework.stereotype` | Same as `@Component`; expresses "application/service layer" intent. No behaviour change. | `@Service class CarRentalService` |
| `@Repository` | `org.springframework.stereotype` | Same as `@Component` plus persistence-exception translation to `DataAccessException`. | `@Repository class CarJpaRepository` |
| `@Controller` | `org.springframework.stereotype` | MVC stereotype; handler methods are discovered by `RequestMappingHandlerMapping`. | `@Controller class CarController` |
| `@RestController` | `org.springframework.web.bind.annotation` | `@Controller` + `@ResponseBody` on every method: return values are serialised, not resolved as views. | `@RestController class CarApi` |
| `@Configuration` | `org.springframework.context.annotation` | `@Component` whose `@Bean` methods are proxied so inter-method calls return the singleton, not a new object. | `@Configuration class GarageConfig` |
| `@Bean` | `org.springframework.context.annotation` | Registers the method's return value as a bean; the **method name is the bean name**. | `@Bean Engine petrolEngine()` |
| `@ComponentScan` | `org.springframework.context.annotation` | Overrides the scan base packages / filters used by `@SpringBootApplication`. | `@ComponentScan("com.garage")` |
| `@ComponentScans` | `org.springframework.context.annotation` | Repeatable container for multiple `@ComponentScan` declarations. | — |
| `@Import` | `org.springframework.context.annotation` | Imports configuration classes, `ImportSelector`s or `ImportBeanDefinitionRegistrar`s. | `@Import(GarageConfig.class)` |
| `@ImportResource` | `org.springframework.context.annotation` | Loads a legacy XML bean definition file alongside annotation config. | `@ImportResource("classpath:garage.xml")` |
| `@PropertySource` | `org.springframework.context.annotation` | Adds a properties file to the `Environment` (does not read YAML by default). | `@PropertySource("classpath:fleet.properties")` |
| `@Conditional` | `org.springframework.context.annotation` | Registers the bean/configuration only when the condition matches. | `@Conditional(ElectricFleetEnabled.class)` |
| `@Profile` | `org.springframework.context.annotation` | Condition shorthand: active only when the named profile is active. | `@Profile("electric") class ElectricMotor` |
| `@Scope` | `org.springframework.context.annotation` | `singleton` (default), `prototype`, `request`, `session`, `application`, `websocket`. | `@Scope("prototype") class CarWash` |
| `@Lazy` | `org.springframework.context.annotation` | Defers creation (or injects a proxy that resolves on first use). | `@Lazy @Bean CarWash carWash()` |
| `@DependsOn` | `org.springframework.context.annotation` | Forces initialisation order for beans with no type dependency. | `@DependsOn("flyway") @Bean Garage garage()` |
| `@Description` | `org.springframework.context.annotation` | Human-readable description on the bean definition (JMX / tooling). | `@Description("Fleet of 12 cars")` |
| `@Indexed` | `org.springframework.stereotype` | Writes a candidate index at compile time so startup avoids a full classpath scan (`spring-context-indexer`). | `@Indexed @Component class Car` |

## 2. Dependency injection and bean selection

| Annotation | Package | What it does | Car example |
|---|---|---|---|
| `@Autowired` | `org.springframework.beans.factory.annotation` | Injects by type into a constructor, setter, field or method. `required = false` makes it optional. | `CarService(Engine engine)` |
| `@Qualifier` | `org.springframework.beans.factory.annotation` | Narrows candidates by qualifier value; also falls back to matching the **bean name**. | `CarService(@Qualifier("dieselEngine") Engine engine)` |
| `@Primary` | `org.springframework.context.annotation` | Marks the default choice when several candidates share a type. | `@Primary @Component class PetrolEngine` |
| `@Value` | `org.springframework.beans.factory.annotation` | Injects a literal or a property/SpEL expression. | `@Value("${garage.fleet-size:12}") int fleetSize` |
| `@Lookup` | `org.springframework.beans.factory.annotation` | Method injection: replaces the method body with a container lookup (prototype into singleton). | `@Lookup protected TyreSet freshTyres()` |
| `@Order` | `org.springframework.core.annotation` | Numeric ordering for injected collections, advisors, interceptors, `@Bean` methods. | `@Order(1) @Bean Engine petrolEngine()` |
| `@Priority` | `jakarta.annotation` (interpreted by Spring) | Ordering hint that also wins when no `@Primary` exists; lower value = higher priority. | `@Priority(1) class ElectricMotor` |
| `@AliasFor` | `org.springframework.core.annotation` | Declares that two attributes of a composed annotation are aliases. | `@AliasFor(annotation = Component.class, attribute = "value")` |
| `@Named` / `@Inject` | `jakarta.inject` (JSR-330) | Standard alternatives to `@Component` / `@Autowired`. | `@Inject CarService(CarRepository repo)` |

Order of resolution when a type has many candidates: **type → `@Qualifier` → `@Primary` → `@Priority`/`@Order` → dependency (field/parameter) name → `NoUniqueBeanDefinitionException`**. The full worked example is on [@Primary vs @Qualifier](/content/tree/backend/spring/annotations/primary-qualifier).

## 3. Lifecycle, scheduling and events

| Annotation | Package | What it does | Car example |
|---|---|---|---|
| `@PostConstruct` | `jakarta.annotation` | Runs after dependency injection, before the bean is handed out. | `@PostConstruct void warmUp()` |
| `@PreDestroy` | `jakarta.annotation` | Runs on context shutdown (removed in Java 11+ `javax`, use `jakarta`). | `@PreDestroy void parkFleet()` |
| `@EventListener` | `org.springframework.context.event` | Subscribes a method to application events (sync by default). | `@EventListener void onCarSold(CarSoldEvent e)` |
| `@TransactionalEventListener` | `org.springframework.transaction.event` | Fires after the producing transaction commits / rolls back (`phase = ...`). | `@TransactionalEventListener(phase = AFTER_COMMIT)` |
| `@Async` | `org.springframework.scheduling.annotation` | Runs the method on a task executor; requires `@EnableAsync`. | `@Async void notifyOwner(Car car)` |
| `@EnableAsync` | `org.springframework.scheduling.annotation` | Turns on `@Async` proxy infrastructure. | on a `@Configuration` class |
| `@Scheduled` | `org.springframework.scheduling.annotation` | Cron/fixed-rate/fixed-delay execution; requires `@EnableScheduling`. | `@Scheduled(cron = "0 0 6 * * *") void serviceFleet()` |
| `@Schedules` | `org.springframework.scheduling.annotation` | Container for several `@Scheduled` rules on one method. | — |
| `@EnableScheduling` | `org.springframework.scheduling.annotation` | Activates the scheduler. | on a `@Configuration` class |
| `@Cacheable` | `org.springframework.cache.annotation` | Serves repeat calls from a cache; skip the method body on hit. | `@Cacheable("cars") Car find(Long id)` |
| `@CachePut` | `org.springframework.cache.annotation` | Always runs the method and updates the cache with the result. | `@CachePut(value = "cars", key = "#car.id")` |
| `@CacheEvict` | `org.springframework.cache.annotation` | Removes entries (`allEntries = true` for a full clear). | `@CacheEvict(value = "cars", allEntries = true)` |
| `@Caching` | `org.springframework.cache.annotation` | Groups several cache operations on one method. | — |
| `@EnableCaching` | `org.springframework.cache.annotation` | Activates the cache interceptor. | on a `@Configuration` class |

## 4. Web / Spring MVC

| Annotation | What it does | Car example |
|---|---|---|
| `@RequestMapping` | Maps URL/HTTP method/headers/consumes/produces at class or method level. | `@RequestMapping("/cars")` |
| `@GetMapping` `@PostMapping` `@PutMapping` `@PatchMapping` `@DeleteMapping` | Composed shortcuts that set the HTTP method. | `@GetMapping("/{id}") Car one(@PathVariable Long id)` |
| `@PathVariable` | Binds a URI template variable. | `@GetMapping("/cars/{plate}")` → `@PathVariable String plate` |
| `@RequestParam` | Binds a query/form parameter (`required`, `defaultValue`). | `?seats=5` → `@RequestParam int seats` |
| `@RequestBody` | Deserialises the request body (Jackson by default) into an object. | `@PostMapping("/cars") Car add(@RequestBody Car car)` |
| `@ResponseBody` | Serialises the return value instead of resolving a view. Implied by `@RestController`. | `@ResponseBody List<Car> all()` |
| `@RequestHeader` / `@CookieValue` | Binds a header / cookie value. | `@RequestHeader("X-Fleet") String fleet` |
| `@ModelAttribute` | Binds form data onto an object, or exposes a model attribute method. | `@ModelAttribute CarFilter filter` |
| `@InitBinder` | Customises the `WebDataBinder` (e.g. register a date editor). | `@InitBinder void init(WebDataBinder b)` |
| `@ResponseStatus` | Sets the status for a handler method or exception class. | `@ResponseStatus(HttpStatus.CREATED)` |
| `@ExceptionHandler` | Handles a specific exception inside a controller (or an advice). | `@ExceptionHandler(CarNotFound.class)` |
| `@ControllerAdvice` | Global `@ExceptionHandler` / `@ModelAttribute` / `@InitBinder` for all controllers. | `@ControllerAdvice class ApiErrors` |
| `@RestControllerAdvice` | `@ControllerAdvice` + `@ResponseBody`: JSON error contract. | `@RestControllerAdvice` |
| `@CrossOrigin` | Adds CORS headers for a controller or method. | `@CrossOrigin(origins = "https://fleet.example")` |
| `@RequestAttribute` / `@SessionAttributes` / `@MatrixVariable` | Access request attributes, session model attributes, or matrix path params. | `@MatrixVariable int year` |

See [REST Controllers](/content/tree/backend/spring-web/rest-controllers), [Validation](/content/tree/backend/spring-web/validation) and [Global Exception Handling](/content/tree/backend/spring-web/global-exception-handling) for the request lifecycle behind these.

## 5. Spring Boot specifics

| Annotation | What it does | Car example |
|---|---|---|
| `@SpringBootApplication` | Composed of `@SpringBootConfiguration` + `@EnableAutoConfiguration` + `@ComponentScan`. One class, three effects. | `@SpringBootApplication public class GarageApplication` |
| `@EnableAutoConfiguration` | Applies auto-configuration classes from the classpath, filtered by `@ConditionalOn...`. | — |
| `@ConfigurationProperties(prefix = "garage")` | Binds a properties subtree to a typed object (relaxed binding, validation with `@Validated`). | `garage.fleet-size=12` → `int fleetSize` |
| `@EnableConfigurationProperties` | Registers `@ConfigurationProperties` beans explicitly (no `@Component` needed). | `@EnableConfigurationProperties(GarageProperties.class)` |
| `@ConstructorBinding` | Selects constructor binding for immutable property classes (implicit in Boot 3 for a single constructor). | `GarageProperties(int fleetSize)` |
| `@ConditionalOnClass` / `@ConditionalOnMissingBean` / `@ConditionalOnProperty` | Auto-configuration conditions: back off when the user already defined a bean. | `@ConditionalOnMissingBean(Engine.class)` |
| `@AutoConfiguration` / `@AutoConfigureAfter` / `@AutoConfigureBefore` | Declares and orders auto-configuration classes (Boot 2.7+ replaces `spring.factories`). | — |

The booking in [Auto-Configuration](/content/tree/backend/spring-boot/auto-configuration) and [Configuration Properties](/content/tree/backend/spring-boot/configuration-properties) explains why condition order matters.

## 6. Data access and transactions

| Annotation | Package | What it does | Car example |
|---|---|---|---|
| `@Transactional` | `org.springframework.transaction.annotation` | Runs the method in a transaction through a proxy: `propagation`, `isolation`, `readOnly`, `rollbackFor`, `timeout`. | `@Transactional(readOnly = true) List<Car> all()` |
| `@EnableTransactionManagement` | `org.springframework.transaction.annotation` | Activates transaction proxies (auto-configured by Boot). | on a `@Configuration` class |
| `@Query` / `@Modifying` | `org.springframework.data.jpa.repository` | Custom JPQL/native query; `@Modifying` is required for update/delete. | `@Query("select c from Car c where c.seats > :n")` |
| `@Param` | `org.springframework.data.repository.query` | Binds a method parameter to a named query parameter. | `@Param("n") int seats` |
| `@Lock` | `org.springframework.data.jpa.repository` | Applies a JPA lock mode (`PESSIMISTIC_WRITE`, `OPTIMISTIC`). | `@Lock(LockModeType.PESSIMISTIC_WRITE)` |
| `@EntityGraph` | `org.springframework.data.jpa.repository` | Fetches an association eagerly for one query, avoiding N+1. | `@EntityGraph(attributePaths = "owner")` |
| `@EnableJpaRepositories` | `org.springframework.data.jpa.repository.config` | Registers repository interfaces outside the scanned package. | — |
| `@EnableJpaAuditing` / `@CreatedDate` / `@LastModifiedDate` | `org.springframework.data.annotation` (auditing) | Fills audit columns automatically. | `@CreatedDate Instant createdAt` |

Careful: `@Entity`, `@Table`, `@Id`, `@Column`, `@OneToMany` belong to **Jakarta Persistence**, not Spring. Spring Data only understands Spring repository interfaces.

## 7. Security

| Annotation | What it does | Car example |
|---|---|---|
| `@EnableWebSecurity` | Enables the Spring Security filter chain (Boot auto-configures it). | `@EnableWebSecurity class SecurityConfig` |
| `@EnableMethodSecurity` | Turns on `@PreAuthorize` / `@PostAuthorize` / `@PreFilter` / `@PostFilter` (replaces `@EnableGlobalMethodSecurity`). | `@EnableMethodSecurity class MethodSecurityConfig` |
| `@PreAuthorize` | SpEL check before the method runs. | `@PreAuthorize("hasRole('FLEET_MANAGER')")` |
| `@PostAuthorize` | Check after the method runs; can inspect the returned object. | `@PostAuthorize("returnObject.owner == authentication.name")` |
| `@PreFilter` / `@PostFilter` | Filters collection arguments / results element by element. | `@PreFilter("filterObject.active")` |
| `@Secured` / `@RolesAllowed` | Coarser role checks (`ROLE_` prefix required for `@Secured`). | `@Secured("ROLE_ADMIN")` |
| `@AuthenticationPrincipal` | Injects the current principal (or an expression over it). | `Car mine(@AuthenticationPrincipal User user)` |
| `@WithMockUser` / `@WithAnonymousUser` | Test support: runs the test body as an authenticated user. | `@WithMockUser(roles = "ADMIN")` |

## 8. Aspect-oriented programming

| Annotation | What it does | Car example |
|---|---|---|
| `@Aspect` | Marks a class whose `@Pointcut`/advice methods form an aspect. | `@Aspect @Component class CarAuditAspect` |
| `@Pointcut` | Names a reusable join-point expression. | `@Pointcut("execution(* com.garage..*(..))")` |
| `@Before` / `@After` / `@AfterReturning` / `@AfterThrowing` / `@Around` | Advice kinds; `@Around` wraps the call and must call `proceed()`. | `@Around("garageService()") Object timed(ProceedingJoinPoint p)` |
| `@EnableAspectJAutoProxy` | Enables `@Aspect` proxy creation (`proxyTargetClass = true` forces CGLIB). | on a `@Configuration` class |
| `@DeclareParents` | Introduces extra interfaces into advised beans. | — |

[Spring AOP](/content/tree/backend/spring/aop) covers the proxy mechanics; the practical consequence is that **self-invocation bypasses the proxy**, so `this.audit()` is not advised.

## 9. Testing

| Annotation | What it does |
|---|---|
| `@SpringBootTest` | Boots a real `ApplicationContext`; `webEnvironment = RANDOM_PORT` starts a server. |
| `@WebMvcTest` | Slice test: MVC layer only, `@Service`/`@Repository` beans are not created. |
| `@DataJpaTest` | Slice test: JPA + embedded database, each test rolled back. |
| `@JsonTest` | Slice test for Jackson serialisation. |
| `@TestConfiguration` | Extra beans for one test class only (never picked up by component scan). |
| `@MockitoBean` / `@MockitoSpyBean` | Replaces a bean with a Mockito mock/spy in the test context (Boot 3.4+; older `@MockBean`/`@SpyBean` are deprecated). |
| `@ContextConfiguration` | Declares config classes for a plain `@ExtendWith(SpringExtension.class)` test. |
| `@TestPropertySource` / `@ActiveProfiles` | Adds test properties / activates profiles. |
| `@DirtiesContext` | Rebuilds the context for the next test after this one (slow — use sparingly). |
| `@Sql` | Runs SQL scripts before/after a test method. |

## 10. Annotations that are **not** Spring

| Annotation | Actually from | Why people assume otherwise |
|---|---|---|
| `@Entity`, `@Table`, `@Id`, `@Column`, `@Transient`, `@ManyToOne`, `@Version` | Jakarta Persistence (`jakarta.persistence`) | Used almost exclusively inside Spring Data projects |
| `@Valid`, `@NotNull`, `@Size`, `@Email`, `@Min`, `@Pattern` | Jakarta Bean Validation (`jakarta.validation`) | Spring MVC/`@Validated` triggers the validation |
| `@JsonProperty`, `@JsonIgnore`, `@JsonFormat` | Jackson | Serialisation happens inside Spring MVC |
| `@Slf4j`, `@Data`, `@Builder`, `@RequiredArgsConstructor` | Lombok (compile-time) | Nothing to do with the container |
| `@Override`, `@FunctionalInterface`, `@Deprecated`, `@SuppressWarnings` | `java.lang` | Compiler only — no runtime effect |
| `@Named`, `@Inject`, `@PostConstruct` | JSR-330 / JSR-250 (`jakarta.inject`, `jakarta.annotation`) | Spring implements the standard — that does **not** make them Spring annotations |

Interviewers use exactly this list to separate "I memorised annotations" from "I know who reads the annotation".

## 11. One garage, every registration style

```java
// 1. Stereotype + scanning (component classes)
public interface Engine { String start(); }

@Component
@Primary
class PetrolEngine implements Engine {
    private static final Log log = LogFactory.getLog(PetrolEngine.class);
    public String start() {
        log.info("Petrol engine ignited");
        return "petrol";
    }
}

@Component
class DieselEngine implements Engine {
    private static final Log log = LogFactory.getLog(DieselEngine.class);
    public String start() {
        log.info("Diesel engine ignited");
        return "diesel";
    }
}

@Component
class ElectricMotor implements Engine {
    private static final Log log = LogFactory.getLog(ElectricMotor.class);
    public String start() {
        log.info("Electric motor spinning");
        return "electric";
    }
}
```

```java
// 2. Explicit configuration (same three beans, @Bean style)
@Configuration
class GarageConfig {

    @Bean
    @Primary
    Engine petrolEngine() { return new PetrolEngine(); }

    @Bean
    Engine dieselEngine() { return new DieselEngine(); }

    @Bean
    Engine electricMotor() { return new ElectricMotor(); }
}
```

```java
// 3. Consumers: default choice, explicit choice, and all candidates
@Service
class CarService {
    private final Engine engine;
    CarService(Engine engine) { this.engine = engine; }          // @Primary wins
    String ignite() { return "car started with " + engine.start(); }
}

@Service
class RacingCarService {
    private final Engine engine;
    RacingCarService(@Qualifier("dieselEngine") Engine engine) {  // explicit, beats @Primary
        this.engine = engine;
    }
}

@Service
class FleetOverviewService {
    private final Map<String, Engine> engines;                    // bean name -> instance
    FleetOverviewService(Map<String, Engine> engines) { this.engines = engines; }
    String start(String beanName) { return engines.get(beanName).start(); }
}
```

`@Component` and `@Bean` produce the same `BeanDefinition` in the end — the difference is *how* it is created (instantiated and injected by the container vs. built by your factory method) and *what* it can do (constructor injection in a scanned class, arbitrary builder logic in a `@Bean` method).

## 12. Pitfalls worth remembering

- **`@Configuration(proxyBeanMethods = false)`** ("lite mode") is faster, but calling one `@Bean` method from another then creates a *new* instance instead of returning the singleton.
- **`@Qualifier` values are case-sensitive strings.** The fallback match is the bean name, so `@Qualifier("dieselEngine")` and `@Qualifier("DieselEngine")` are not the same.
- **`@Autowired` on a field hides dependencies**, breaks `final` fields, and makes plain unit tests require reflection. Constructor injection keeps the class container-free.
- **Self-invocation is not proxied.** `@Transactional`, `@Async`, `@Cacheable`, `@PreAuthorize` and `@Scheduled` all work through a proxy, so an internal call inside the same bean bypasses them.
- **`@PostConstruct` / `@Value` are injected after construction**, so using them in the constructor sees `null`/`0`.
- **`@Profile` is a condition, not a switch at runtime** — beans excluded by a profile simply do not exist in that context.
- **Annotations are not inherited the way methods are** unless the annotation is `@Inherited` or Spring composes it (Spring's `AnnotatedElementUtils` does search for meta-annotations, which is why `@RestController` works as `@Component`).
- **`@Order` is not precedence** for security: `@Order` on advices/`@Bean` methods controls collection order, not "which bean gets injected".

## 13. Interview points

- Explain that annotations are inert metadata and name the component that reads each family: `ClassPathBeanDefinitionScanner`, `AutowiredAnnotationBeanPostProcessor`, `CommonAnnotationBeanPostProcessor`, `InfrastructureAdvisorAutoProxyCreator`.
- Distinguish bean *definition* annotations from bean *selection* annotations (`@Primary`/`@Qualifier`) and from *behavioural* annotations that need a proxy.
- Know the exact failure text for an ambiguous type and the four fixes (see the ambiguity page).
- Be able to say which annotations are Jakarta/Jackson/Lombok rather than Spring.
- Explain why constructor injection plus `final` fields is the production default, and why self-invocation defeats `@Transactional`.

**Related:** [@Primary vs @Qualifier](/content/tree/backend/spring/annotations/primary-qualifier), [Annotation Interview Questions](/content/tree/backend/spring/annotations/annotation-interview-questions), [Spring IoC and Dependency Injection](/content/tree/backend/spring/ioc-di), [Bean Lifecycle](/content/tree/backend/spring/bean-lifecycle), [Application Context](/content/tree/backend/spring/application-context).
