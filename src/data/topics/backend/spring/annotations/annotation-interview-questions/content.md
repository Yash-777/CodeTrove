# Spring Annotation Interview Questions

Questions an interviewer actually asks about Spring annotations, answered the way you would answer them for a car-garage service: a short definition, the mechanism, the trade-off, and a code snippet. Patterns follow the same style as the project's other interview pages.

<details>
<summary><strong>Q1. What is the difference between @Component, @Service, @Repository and @Controller?</strong></summary>

### Question
Four stereotypes, one container. Are they interchangeable?

### Answer
They are all `@Component` meta-annotated and all become `BeanDefinition`s during component scanning. The differences are intent plus one behavioural extra:

| Annotation | Behaviour beyond `@Component` |
|---|---|
| `@Component` | none — generic scanned bean |
| `@Service` | none — marks the service layer |
| `@Repository` | adds persistence-exception translation to `DataAccessException` (where a `PersistenceExceptionTranslator` exists) |
| `@Controller` | marks an MVC handler; `RequestMappingHandlerMapping` discovers its `@RequestMapping` methods |
| `@RestController` | `@Controller` + `@ResponseBody` on every method |

```java
@Component
public class Car { private final String plate; /* ... */ }

@Repository
public class CarRepository { /* DAO-style access, exceptions translated */ }

@Service
public class CarService { public Car findByPlate(String plate) { ... } }
```

**What the interviewer wants:** you know `@Service` is documentation, not behaviour, and that `@Repository` has one real effect.

</details>

<details>
<summary><strong>Q2. @Component vs @Bean — which one and when?</strong></summary>

### Question
Both register beans. Why do we need both?

### Answer
`@Component` is discovered by **classpath scanning**; the container instantiates the class and does constructor injection. `@Bean` is a **factory method**; you write the construction logic yourself, which allows builders, third-party classes, conditional creation and setting properties that have no setter.

```java
@Component
public class PetrolEngine implements Engine { }   // scanned, constructor-injected

@Configuration
public class GarageConfig {
    @Bean
    public Engine electricMotor() {               // third-party / builder / conditional
        return Engine.builder().type("electric").power(150).build();
    }
}
```

Use `@Bean` for classes you cannot annotate (libraries), for `@Conditional` variants, and when the bean name must be stable (the method name becomes the bean name). Use `@Component` for your own plain classes.

**Trap:** calling one `@Bean` method from another inside `@Configuration(proxyBeanMethods = false)` creates a new instance instead of reusing the singleton.

</details>

<details>
<summary><strong>Q3. Two beans implement one interface. What happens, and what are your options?</strong></summary>

### Question
`PetrolEngine` and `DieselEngine` both implement `Engine`, and `CarService(Engine engine)` fails at startup. Why, and what are the fixes?

### Answer
IoC resolves **by type**; two candidates for a single parameter is ambiguous, so the container fails fast with:

```text
NoUniqueBeanDefinitionException: No qualifying bean of type 'com.garage.Engine'
available: expected single matching bean but found 2: dieselEngine,petrolEngine
```

Spring Boot's failure analyzer then prints: *"Consider marking one of the beans as @Primary, updating the consumer to accept multiple beans, or using @Qualifier to identify the bean that should be consumed."* Those are exactly the three designs:

1. `@Primary` on the default engine.
2. `@Qualifier("dieselEngine")` on the injection point.
3. `Map<String, Engine>` / `List<Engine>` and select at runtime.

Zero candidates is a different exception: `NoSuchBeanDefinitionException`.

</details>

<details>
<summary><strong>Q4. @Primary vs @Qualifier — which wins, and does the order matter?</strong></summary>

### Question
If `PetrolEngine` is `@Primary` and a consumer asks for `@Qualifier("dieselEngine")`, which engine is injected?

### Answer
The qualifier wins, because of **when** each is consulted:

1. candidates are collected by type,
2. candidates that do not match the requested qualifier are removed,
3. `@Primary` picks a default only if more than one candidate survives,
4. `@Priority`/`@Order`,
5. dependency-name (field/parameter name) to bean-name match,
6. `NoUniqueBeanDefinitionException`.

```java
@Service
public class RacingCarService {
    // petrol is @Primary, but this injection point asks for diesel explicitly
    public RacingCarService(@Qualifier("dieselEngine") Engine engine) { ... }
}
```

`@Primary` is a bean-side default; `@Qualifier` is a consumer-side decision, so it must be able to override the default.

</details>

<details>
<summary><strong>Q5. Can you have two @Primary beans?</strong></summary>

### Question
What if two implementations of `Engine` are both `@Primary`?

### Answer
Locally, no — resolution throws:

```text
NoUniqueBeanDefinitionException: No qualifying bean of type 'com.garage.Engine' available:
more than one 'primary' bean found among candidates: [petrolEngine, dieselEngine]
```

Across parent/child contexts it is tolerated: a `@Primary` bean in the child context takes precedence over a `@Primary` bean inherited from the parent.

This is the main argument for `@Primary` being a *single* default per type, and for using qualifiers once a second "special" implementation exists.

</details>

<details>
<summary><strong>Q6. Does @Qualifier match the bean name? Is it case-sensitive?</strong></summary>

### Question
`@Qualifier("diesel")` versus `@Qualifier("dieselEngine")` versus `@Qualifier("DieselEngine")` — which ones work?

### Answer
Spring's documented fallback is: **the bean name is considered a default qualifier value.** So:

- `@Qualifier("dieselEngine")` — matches the bean **name** (decapitalised class name, or the value in `@Component("dieselEngine")` / the `@Bean` method name). Works.
- `@Qualifier("diesel")` — works only if the bean declares `@Qualifier("diesel")` on the class or factory method, or is named `diesel`.
- `@Qualifier("DieselEngine")` — does not match: the comparison is **case-sensitive**.

```java
@Component
@Qualifier("diesel")
public class DieselEngine implements Engine { }
```

```java
public CarService(@Qualifier("diesel") Engine engine) { ... }   // matches the annotation
public CarService(@Qualifier("dieselEngine") Engine engine) { ... } // matches the bean name
```

Case mismatch is the classic bug in copied examples — including the sorting example in the project wiki, where `@Qualifier("Quick")` sits on the class and `@Qualifier("quick")` is injected.

</details>

<details>
<summary><strong>Q7. How do you inject every implementation of an interface?</strong></summary>

### Question
A fleet admin should be able to start any engine. Do we need a lookup service?

### Answer
No — inject a collection. Spring populates `List<T>`, `Set<T>` and `Map<String, T>` (map key = bean name):

```java
@Service
public class FleetService {

    private final Map<String, Engine> engines;

    public FleetService(Map<String, Engine> engines) { this.engines = engines; }

    public String start(String engineName) {
        return engines.get(engineName).start();
    }
}
```

`List<Engine>` ordering comes from `@Order`/`@Priority` (lower value first). This is the **strategy pattern** with the container as registry — the right choice when the selection is data (config, request field) rather than code.

</details>

<details>
<summary><strong>Q8. Field injection, setter injection or constructor injection?</strong></summary>

### Question
`@Autowired` works on all three. Which do you use in production and why?

### Answer
Constructor injection, with `final` fields:

```java
@Service
public class CarService {

    private final Engine engine;
    private final CarRepository repository;

    public CarService(Engine engine, CarRepository repository) {
        this.engine = engine;
        this.repository = repository;
    }
}
```

Reasons: dependencies are explicit and immutable, the class cannot exist half-built, a circular dependency fails at startup instead of hiding, and `new CarService(engine, repo)` works in a plain unit test with no container.

Field injection (`@Autowired private Engine engine;`) hides the dependency list, blocks `final`, and pushes tests towards reflection or `@SpringBootTest`. Setter injection is fine for genuinely optional dependencies — better expressed today as `ObjectProvider<Engine>` or `@Autowired(required = false)`.

</details>

<details>
<summary><strong>Q9. Does Spring match a field name to a bean name automatically?</strong></summary>

### Question
I removed `@Qualifier` and it still works. Why?

### Answer
Because the last fallback before failing is **dependency-name matching**: if candidates remain and one bean name equals the field or parameter name, it is chosen.

```java
@Service
public class CarService {
    @Autowired
    private Engine dieselEngine;   // matches bean dieselEngine without any @Qualifier
}
```

It works, but it is incidental design: renaming the field or the bean silently changes wiring, and it stops working the moment a `@Primary` appears (primary is checked first). Treat it as a debugging explanation, not a technique.

</details>

<details>
<summary><strong>Q10. @Autowired vs @Resource vs @Inject</strong></summary>

### Question
Are there alternatives to `@Autowired`, and do they differ?

### Answer
- `@Autowired` (Spring) — resolves **by type**, supports `required = false`, works on constructors, fields, setters, methods.
- `@Inject` (JSR-330, `jakarta.inject`) — resolves by type; Spring supports it. No `required` attribute.
- `@Resource` (JSR-250, `jakarta.annotation`) — resolves **by name first**, then by type.

```java
@Resource(name = "dieselEngine")
private Engine engine;
```

Prefer the Spring annotation in Spring code (better diagnostics and the `required` flag), and the JSR-330 one in framework-neutral modules. Do not mix them in the same class — reviewers cannot see the resolution rule.

</details>

<details>
<summary><strong>Q11. Is @Entity a Spring annotation? What about @Valid and @Slf4j?</strong></summary>

### Question
Name the annotations in a typical Spring Boot service that are not Spring's.

### Answer
| Annotation | Actually from |
|---|---|
| `@Entity`, `@Table`, `@Id`, `@Column`, `@ManyToOne` | Jakarta Persistence (`jakarta.persistence`) |
| `@Valid`, `@NotNull`, `@Size`, `@Email` | Jakarta Bean Validation (`jakarta.validation`) |
| `@JsonProperty`, `@JsonIgnore` | Jackson |
| `@Slf4j`, `@Data`, `@RequiredArgsConstructor` | Lombok |
| `@Named`, `@Inject`, `@PostConstruct` | JSR-330 / JSR-250 (`jakarta.inject`, `jakarta.annotation`) |
| `@Override`, `@FunctionalInterface` | `java.lang` |

Spring merely *interprets* them: Hibernate provides the JPA implementation, Spring MVC triggers validation, Boot auto-configures a Jackson `ObjectMapper`, and `CommonAnnotationBeanPostProcessor` honours `@PostConstruct`.

**Why it matters:** it shows you understand who reads each annotation at runtime instead of memorising a list.

</details>

<details>
<summary><strong>Q12. What does @SpringBootApplication actually do?</strong></summary>

### Question
One annotation starts the whole application. What is inside it?

### Answer
It is a composed annotation of three:

```java
@SpringBootConfiguration     // a @Configuration for this application
@EnableAutoConfiguration     // apply auto-configurations from the classpath, filtered by @ConditionalOn...
@ComponentScan               // scan the package of this class and below
```

Consequences worth mentioning:

- Putting the class in `com.garage` means `com.garage.service` is scanned but `org.example` is not; `@ComponentScan("com.garage, org.example")` fixes that.
- Auto-configuration runs **after** user configuration and backs off via `@ConditionalOnMissingBean`, which is why your `@Bean Engine` replaces Boot's default.
- `@SpringBootTest` finds this class as the configuration entry point.

</details>

<details>
<summary><strong>Q13. Why does @Transactional not work when I call the method from inside the same class?</strong></summary>

### Question
`CarService.save()` is `@Transactional` and `CarService.importFleet()` calls `this.save(...)`. No transaction is applied. Why?

### Answer
`@Transactional` is implemented by a **proxy** (`BeanNameAutoProxyCreator`/`InfrastructureAdvisorAutoProxyCreator` producing a CGLIB or JDK proxy). The transaction starts when the proxy receives the call. An internal `this.save(...)` never crosses the proxy, so no advice runs.

```java
@Service
public class CarService {

    @Transactional
    public void save(Car car) { ... }

    public void importFleet(List<Car> cars) {
        cars.forEach(this::save);   // BUG: no transaction boundary per call
    }
}
```

Fixes:

1. Move the transactional method to another bean and inject it.
2. Make `importFleet` itself `@Transactional` (one boundary, usually what you want).
3. `TransactionTemplate` for programmatic, proxy-free control.

The same proxy rule applies to `@Async`, `@Cacheable`, `@PreAuthorize` and `@Scheduled`.

</details>

<details>
<summary><strong>Q14. @Value vs @ConfigurationProperties</strong></summary>

### Question
Both read `application.properties`. When do you use which?

### Answer
`@Value` is a single-expression injection; `@ConfigurationProperties` binds a whole prefix to a typed object with relaxed binding and validation.

```java
@Value("${garage.fleet-size:12}")
private int fleetSize;
```

```java
@ConfigurationProperties(prefix = "garage")
@Validated
public record GarageProperties(
        @Min(1) int fleetSize,
        String defaultEngine,
        List<String> workshops) { }
```

Use `@ConfigurationProperties` for anything with more than one or two values: it supports `kebab-case`, lists, nested objects, `@Validated`, and IDE metadata (when the annotation processor is present). `@Value` cannot bind a list from a comma-separated property reliably and shows no metadata in the IDE.

</details>

<details>
<summary><strong>Q15. Where do @PostConstruct and @PreDestroy fit in the lifecycle?</strong></summary>

### Question
When exactly do they run, and what replaces them in newer Java?

### Answer
Order for a singleton bean:

1. instantiate (constructor),
2. populate properties and dependencies (`@Autowired`, `@Value`),
3. `BeanNameAware` / `BeanFactoryAware` / `ApplicationContextAware` callbacks,
4. `BeanPostProcessor.postProcessBeforeInitialization`,
5. `@PostConstruct`, then `InitializingBean.afterPropertiesSet()`, then `initMethod`,
6. `BeanPostProcessor.postProcessAfterInitialization` (where proxies are created),
7. bean is ready; on shutdown `@PreDestroy`, then `DisposableBean.destroy()`, then `destroyMethod`.

```java
@Component
public class Garage {
    @PostConstruct void warmUp() { /* dependencies are injected here */ }
    @PreDestroy  void parkFleet() { /* release resources */ }
}
```

`javax.annotation` was removed from the JDK in Java 11; on Boot 3 you import `jakarta.annotation.PostConstruct`. Never do real work in a constructor when it depends on injected fields — they are not set yet.

</details>

<details>
<summary><strong>Q16. @ControllerAdvice vs @RestControllerAdvice</strong></summary>

### Question
How do you return a consistent JSON error for every controller?

### Answer
`@RestControllerAdvice` = `@ControllerAdvice` + `@ResponseBody`, so returned objects are serialised by Jackson instead of being resolved as views.

```java
@RestControllerAdvice
public class ApiErrors {

    @ExceptionHandler(CarNotFound.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail carNotFound(CarNotFound ex) {
        ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        detail.setTitle("Car not found");
        detail.setDetail(ex.getMessage());
        return detail;
    }
}
```

`@ControllerAdvice` can be narrowed to a package or annotation (`basePackages`, `annotations`). Keep the advice for *known* domain errors; let Boot's fallback handle unexpected exceptions, and never leak stack traces. See [Global Exception Handling](/content/tree/backend/spring-web/global-exception-handling).

</details>

<details>
<summary><strong>Q17. @RequestParam vs @PathVariable vs @RequestBody</strong></summary>

### Question
Three ways to get data in. When is each correct?

### Answer
| Annotation | Source | Typical use |
|---|---|---|
| `@PathVariable` | URI template segment | `/cars/{plate}` — identifies a resource |
| `@RequestParam` | query string or form field | `/cars?seats=5` — filters, optional modifiers |
| `@RequestBody` | HTTP body, deserialised by message converters | `POST /cars` with a JSON payload |

```java
@GetMapping("/cars/{plate}")
public Car byPlate(@PathVariable String plate) { ... }

@GetMapping("/cars")
public List<Car> search(@RequestParam(defaultValue = "0") int seats) { ... }

@PostMapping("/cars")
@ResponseStatus(HttpStatus.CREATED)
public Car add(@Valid @RequestBody Car car) { ... }
```

`@RequestBody` is required for `POST`/`PUT` payloads; `@PathVariable` is required for REST-style addressing; `@RequestParam` is the safe default for anything optional or filter-like.

</details>

<details>
<summary><strong>Q18. How do you write a custom qualifier annotation, and why bother?</strong></summary>

### Question
String qualifiers break at runtime. Can the compiler catch it?

### Answer
Yes — annotate a custom annotation with `@Qualifier`:

```java
@Target({ ElementType.FIELD, ElementType.PARAMETER, ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Qualifier
public @interface Petrol {
}
```

```java
@Component
@Petrol
public class PetrolEngine implements Engine { }

@Service
public class CarService {
    public CarService(@Petrol Engine engine) { ... }   // compile-time checked, searchable
}
```

Benefits: typos fail to compile, IDEs can find every usage, the qualifier carries domain meaning, and it can carry attributes (`@Provider(region = "eu")`) that Spring matches by attribute value.

</details>

<details>
<summary><strong>Q19. @Order vs @Priority vs @Primary</strong></summary>

### Question
Three ordering-ish annotations. Are they interchangeable?

### Answer
No:

- `@Primary` — chooses **one bean** for a single injection point when several candidates match. Highest precedence among these three.
- `@Priority` — a JSR-330 annotation Spring also honours; lower value = higher priority. Consulted after `@Primary`, so it can break a tie between non-primary candidates.
- `@Order` — ordering within a **collection** (`List<Engine>`), advisor ordering, interceptor ordering, `@Bean` method ordering. It is not a tie-breaker for `@Autowired` by type.

```java
@Component
@Order(1)
public class PetrolEngine implements Engine { }   // first in List<Engine>
```

Use `@Order` when the order of processing matters (filters, aspects), `@Priority` for global ranking, `@Primary` for a default implementation.

</details>

<details>
<summary><strong>Q20. How would you debug "the wrong bean got injected" in production?</strong></summary>

### Question
No exception — just unexpected behaviour. What do you check, in what order?

### Answer
1. **`/actuator/beans`** — every bean name, type, qualifiers and dependencies; confirms whether a duplicate or a Boot auto-configured default exists.
2. **Startup condition report** — run with `--debug` to print the auto-configuration report (`positiveMatches`/`negativeMatches`), showing which `@ConditionalOnMissingBean` decisions were taken.
3. **Look for `@Primary`** on the interface's implementations and any `@Qualifier` at the injection point; then check the field/parameter name, because the name fallback can silently choose a bean.
4. **Check proxies** — if the correct bean is injected but the behaviour is missing, the annotation may be bypassed by self-invocation (`@Transactional`, `@Async`, `@Cacheable`).
5. **Add an assertion to the test suite** — a `@SpringBootTest` asserting `carService.engine()` type is cheap insurance against a future `@Primary` change.

Being able to name a debugging path (not just the annotation semantics) is what separates a senior answer here.

</details>

## Related

- [Annotations Catalogue](/content/tree/backend/spring/annotations/annotation-catalogue) — every Spring annotation grouped by purpose, plus the ones that are not Spring's.
- [@Primary vs @Qualifier](/content/tree/backend/spring/annotations/primary-qualifier) — the full worked car-garage example.
- [Spring IoC and Dependency Injection](/content/tree/backend/spring/ioc-di), [Bean Lifecycle](/content/tree/backend/spring/bean-lifecycle), [Spring AOP](/content/tree/backend/spring/aop).
