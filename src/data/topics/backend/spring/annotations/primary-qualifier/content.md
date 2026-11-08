# @Primary vs @Qualifier — Resolving an Ambiguous Bean

Two beans, one type, one injection point. Spring cannot guess, so it fails fast at startup. The fix is always one of three moves:

> **Consider marking one of the beans as `@Primary`, updating the consumer to accept multiple beans, or using `@Qualifier` to identify the bean that should be consumed**

That sentence is Spring Boot's failure analysis for `NoUniqueBeanDefinitionException`, and it is the exact message we hit in the [Exceptions](https://github.com/Yash-777/SpringBootApp/wiki/Exceptions) notes with `SortAlgorithem` / `BubbleSort` / `QuickSort`. This page walks the same problem through a **car garage**, because a sorting algorithm hides the interesting part: a car has several genuinely different engines, and "which engine" is a business decision, not an accident.

Both annotations belong to the **Spring Framework**:

| Annotation | Group | Package | Scope |
|---|---|---|---|
| `@Primary` | Spring Framework (core container) | `org.springframework.context.annotation` | Declared **on the bean** — "pick me by default" |
| `@Qualifier` | Spring Framework (core container) | `org.springframework.beans.factory.annotation` | Declared **on the injection point** — "pick this one here" |

## 1. Reproduce the failure

One interface, three implementations, one greedy consumer.

```java
public interface Engine {
    String start();
}
```

```java
@Component
public class PetrolEngine implements Engine {

    private static final Log log = LogFactory.getLog(PetrolEngine.class);

    public String start() {
        log.info("Petrol engine ignited");
        return "petrol";
    }
}

@Component
public class DieselEngine implements Engine {

    private static final Log log = LogFactory.getLog(DieselEngine.class);

    public String start() {
        log.info("Diesel engine ignited");
        return "diesel";
    }
}

@Component
public class ElectricMotor implements Engine {

    private static final Log log = LogFactory.getLog(ElectricMotor.class);

    public String start() {
        log.info("Electric motor spinning");
        return "electric";
    }
}
```

```java
@Service
public class CarService {

    private final Engine engine;

    // three candidates for one parameter -> startup fails
    public CarService(Engine engine) {
        this.engine = engine;
    }
}
```

Spring Boot refuses to start:

```text
***************************
APPLICATION FAILED TO START
***************************

Description:

Parameter 0 of constructor in com.garage.service.CarService required a single bean,
but 3 were found:
	- dieselEngine: defined in file [.../DieselEngine.class]
	- electricMotor: defined in file [.../ElectricMotor.class]
	- petrolEngine: defined in file [.../PetrolEngine.class]

Action:

Consider marking one of the beans as @Primary, updating the consumer to accept
multiple beans, or using @Qualifier to identify the bean that should be consumed
```

The underlying exception, worth recognising in logs:

```text
org.springframework.beans.factory.NoUniqueBeanDefinitionException:
No qualifying bean of type 'com.garage.Engine' available:
expected single matching bean but found 3: dieselEngine,electricMotor,petrolEngine
```

Two failure modes, two exceptions — keep them apart in an interview:

- **0 candidates** → `NoSuchBeanDefinitionException` ("no qualifying bean of type ... available: expected at least 1 bean").
- **more than 1 candidate** → `NoUniqueBeanDefinitionException` ("expected single matching bean but found N").

## 2. Fix 1 — `@Primary` on the default bean

`@Primary` says: when this type has several candidates and nobody asked for a specific one, use me.

```java
@Component
@Primary
public class PetrolEngine implements Engine {
    public String start() { return "petrol"; }
}
```

```java
@Service
public class CarService {
    private final Engine engine;
    public CarService(Engine engine) { this.engine = engine; }   // petrolEngine, no error
}
```

`@Primary` works identically on component classes and on `@Bean` factory methods:

```java
@Configuration
public class GarageConfig {

    @Bean
    @Primary
    public Engine petrolEngine() { return new PetrolEngine(); }

    @Bean
    public Engine dieselEngine() { return new DieselEngine(); }

    @Bean
    public Engine electricMotor() { return new ElectricMotor(); }
}
```

Characteristics:

- **One line, applies context-wide.** Every consumer that asks for `Engine` without a qualifier gets petrol.
- **Silent.** Nobody reading `CarService` can see which engine it gets — the knowledge lives on the bean.
- **Two local `@Primary` beans is still a failure**: `NoUniqueBeanDefinitionException: ... more than one 'primary' bean found among candidates: [...]`.
- A `@Primary` bean in the current context wins over a `@Primary` bean inherited from a parent context.

Use it when the interface has an obvious production default: a primary `DataSource`, the default `Clock`, the default payment provider.

## 3. Fix 2 — `@Qualifier` at the injection point

`@Qualifier` says: at *this* injection point, use the bean carrying this qualifier.

```java
@Service
public class CarService {

    private final Engine engine;

    public CarService(@Qualifier("dieselEngine") Engine engine) {
        this.engine = engine;
    }
}
```

The value `dieselEngine` matches the **bean name** (default = decapitalised class name, or the name you give in `@Component("dieselEngine")` / the `@Bean` method name). It is the fallback qualifier Spring documents: *the bean name is considered a default qualifier value.*

On a field (discouraged, but common in existing code):

```java
@Service
public class CarService {

    @Autowired
    @Qualifier("dieselEngine")
    private Engine engine;
}
```

Characteristics:

- **Explicit at the point of decision.** A reader of `CarService` sees exactly which engine is used.
- **Local.** Other consumers can keep the primary engine.
- **Fails loudly if wrong**: a typo produces `NoSuchBeanDefinitionException: No qualifying bean of type 'com.garage.Engine' available: expected at least 1 bean which qualifies as autowire candidate`, not silently the wrong engine.
- Works on constructor parameters, fields, setters and `@Bean` method parameters.

## 4. Fix 3 — `@Qualifier` on the bean declaration

You can attach a business name to the bean once, then ask for that name anywhere:

```java
@Component
@Qualifier("diesel")
public class DieselEngine implements Engine { ... }

@Component
@Qualifier("petrol")
public class PetrolEngine implements Engine { ... }
```

```java
public CarService(@Qualifier("diesel") Engine engine) { ... }
```

Spring resolves this by looking for the `@Qualifier` annotation on the target class (or factory method), not only on the bean definition, so the class-level qualifier is honoured.

**Two traps this surfaces — both are real interview material:**

1. **Qualifier values are case-sensitive strings.** The wiki example declares `@Qualifier("Quick")` on `QuickSort` but injects `@Qualifier("quick")`. Those do not match. Because the fallback is the bean name, `@Qualifier("quickSort")` (the bean name) *does* work — which is why the bug can look intermittent depending on which form you copy.
2. **A qualifier is not an alias for the bean name.** `@Qualifier("diesel")` does not rename `dieselEngine` to `diesel`; delete the bean and the qualifier disappears with it. If you want stable names, rename the bean itself (`@Component("diesel")`).

Prefer this form when the qualifier expresses domain vocabulary (`"diesel"`, `"electric"`, `"stripe"`) rather than a class name.

### Custom qualifier annotations (the production-grade version)

Stringly-typed values fail at runtime. A composed annotation fails at compile time:

```java
@Target({ ElementType.FIELD, ElementType.PARAMETER, ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Qualifier
public @interface Electric {
}
```

```java
@Component
@Electric
public class ElectricMotor implements Engine { ... }

@Service
public class EcoCarService {
    public EcoCarService(@Electric Engine engine) { ... }
}
```

Now a typo is a compilation error, and the annotation is discoverable in IDE searches.

## 5. Fix 4 — accept every candidate and choose at runtime

Sometimes the consumer genuinely needs several implementations. Inject the collection:

```java
@Service
public class FleetService {

    private final Map<String, Engine> engines;   // key = bean name

    public FleetService(Map<String, Engine> engines) {
        this.engines = engines;
    }

    public String start(String engineName) {
        return engines.get(engineName).start();
    }
}
```

`List<Engine>` works too, and `@Order` / `@Priority` decide the order:

```java
@Component
@Order(2)
public class DieselEngine implements Engine { ... }

@Component
@Order(1)
public class PetrolEngine implements Engine { ... }
```

This is the **strategy pattern**: the map key can come from configuration (`garage.default-engine=dieselEngine`), from a request field, or from a feature flag. Nothing is hard-coded, and adding a fourth engine requires no change to the consumer.

One caution: an injected `Map<String, Engine>` with no `@Qualifier` includes *all* `Engine` beans — including test doubles and third-party ones. Give the beans a marker qualifier if the collection must stay closed.

## 6. The order Spring actually applies

`DefaultListableBeanFactory.doResolveDependency` does this, in order:

| Step | Action | Annotation |
|---|---|---|
| 1 | Collect candidates by **type** | — |
| 2 | Drop candidates that do not match the requested **qualifier** (including bean-name fallback) | `@Qualifier`, custom qualifiers |
| 3 | If one candidate remains, use it | — |
| 4 | Otherwise pick the single **primary** candidate | `@Primary` |
| 5 | Otherwise pick the highest **priority/order** | `@Priority`, `@Order` |
| 6 | Otherwise match the dependency **name** (field/parameter) to a bean name | — |
| 7 | Still ambiguous → `NoUniqueBeanDefinitionException` | — |

Consequences worth stating out loud in an interview:

- **`@Qualifier` beats `@Primary`.** Qualifier filtering happens while candidates are collected, i.e. *before* the primary check, so a qualified injection point can always override the default.
- **A field or parameter name can resolve ambiguity without any annotation.** With beans `petrolEngine` and `dieselEngine`, a field named `dieselEngine` in a single-candidate context injects diesel. This is fragile and should never be the plan — but it explains "why does it work on my machine".
- **Order is not a tie-breaker for injection by type in the same way as `@Primary`**; `@Order`/`@Priority` are consulted after `@Primary`, and `@Order` is mainly for collections, advisors and interceptors.

## 7. `@Primary` and `@Qualifier` together

They compose, with the qualifier winning:

```java
@Component
@Primary
public class PetrolEngine implements Engine { ... }   // default

@Service
public class RacingCarService {
    public RacingCarService(@Qualifier("dieselEngine") Engine engine) { ... }  // overrides default
}
```

A practical rule for a real codebase:

- `@Primary` for the **one obvious default** of an infrastructure type.
- `@Qualifier` (preferably a custom annotation) for **every consumer where the choice is semantically important** — payment provider, storage backend, notification channel.
- Never rely on field/parameter-name matching as the design.

## 8. Same pattern elsewhere in the project

The wiki's sorting example is the same shape with a weaker domain:

```java
public interface SortAlgorithem { int[] sort(int[] numbers); }

@Component @Qualifier("bubble")
public class BubbleSort implements SortAlgorithem { ... }

@Component @Qualifier("quick")
public class QuickSort implements SortAlgorithem { ... }

@Service
public class BinarySearchImpl {
    private final SortAlgorithem sorter;
    public BinarySearchImpl(@Qualifier("quick") SortAlgorithem sorter) { this.sorter = sorter; }
}
```

And the payment section of this app behaves the same way:

```java
public interface PaymentGateway { PaymentResult pay(PaymentRequest request); }

@Service @Primary
public class StripeGateway implements PaymentGateway { ... }   // default provider

@Service
public class BilldeskGateway implements PaymentGateway { ... }

@Service
public class RazorGateway implements PaymentGateway { ... }

@Service
public class BoxpayGateway implements PaymentGateway { ... }

@Service
public class CheckoutService {
    private final PaymentGateway gateway;
    public CheckoutService(@Qualifier("billdeskGateway") PaymentGateway gateway) { ... }
}
```

Same decision, same failure text — only the vocabulary changes. That is why the error message mentions all three fixes: they are three legitimate designs, not three workarounds.

## 9. Verify the wiring

```java
@SpringBootTest
class EngineWiringTest {

    @Autowired CarService carService;
    @Autowired FleetService fleetService;

    @Test
    void defaultConsumerUsesPrimaryEngine() {
        assertThat(carService.ignite()).contains("petrol");
    }

    @Test
    void collectionContainsEveryEngine() {
        assertThat(fleetService.start("dieselEngine")).contains("diesel");
    }
}
```

At runtime, `/actuator/beans` lists every bean with its name, type and qualifiers — the fastest way to answer "what did the container actually create?" See [Spring Boot Actuator](/content/tree/backend/spring-boot/actuator).

## 10. Interview points

- State the precedence precisely: **type → qualifier → primary → priority/order → dependency name → exception**. "Qualifier wins over primary" is the sentence interviewers listen for.
- Know both exception names and which one means "none" vs "too many".
- Explain why `@Primary` is a *bean-side default* and `@Qualifier` is a *consumer-side decision*, and which one is easier to review in code.
- Mention the bean-name fallback of `@Qualifier` and its case sensitivity.
- Describe the collection/strategy alternative (`Map<String, Engine>`) and when it is better than either annotation.
- Finish with the operational detail: `NoUniqueBeanDefinitionException` is a **startup** failure — failing fast is the feature, because the alternative is a random engine at runtime.

**Related:** [Annotations Catalogue](/content/tree/backend/spring/annotations/annotation-catalogue), [Annotation Interview Questions](/content/tree/backend/spring/annotations/annotation-interview-questions), [Spring IoC and Dependency Injection](/content/tree/backend/spring/ioc-di), [Application Context](/content/tree/backend/spring/application-context), [Bean Lifecycle](/content/tree/backend/spring/bean-lifecycle).
