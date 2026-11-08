# Spring Framework Annotations

Annotations are metadata that the container reads at startup: component scanning turns annotated classes into `BeanDefinition`s, post-processors perform injection, and proxy creators add transactions, caching, async execution and security on top of your beans. Nothing happens until something interprets them — knowing *who* reads an annotation is the difference between quoting definitions and debugging a real application.

This section covers the annotation surface of the **Spring Framework** (core container, Spring MVC, `spring-tx`, `spring-aop`, Spring Security) and points out the annotations from Jakarta, Jackson and Lombok that live in the same files but are not Spring's.

## Start here

| Page | What it answers |
|---|---|
| [Annotations Catalogue](/content/tree/backend/spring/annotations/annotation-catalogue) | Every Spring annotation, grouped by purpose (registration, injection, lifecycle, web, Boot, data, security, AOP, testing) with a car-garage example per row — plus the "this is not Spring" list |
| [@Primary vs @Qualifier](/content/tree/backend/spring/annotations/primary-qualifier) | The ambiguous-bean failure end to end: the exact `NoUniqueBeanDefinitionException` message, all four fixes, and the real resolution order (type → qualifier → primary → priority/order → bean name) |
| [Annotation Interview Questions](/content/tree/backend/spring/annotations/annotation-interview-questions) | Twenty interview questions with answers and code, from stereotype differences to `@Transactional` self-invocation and debugging the wrong bean in production |

## The failure this section exists for

Two implementations, one injection point, and Spring refuses to start:

```text
Parameter 0 of constructor in com.garage.service.CarService required a single bean, but 3 were found:
	- dieselEngine: defined in file [.../DieselEngine.class]
	- electricMotor: defined in file [.../ElectricMotor.class]
	- petrolEngine: defined in file [.../PetrolEngine.class]

Action:

Consider marking one of the beans as @Primary, updating the consumer to accept
multiple beans, or using @Qualifier to identify the bean that should be consumed
```

Those three suggestions are three legitimate designs, not three workarounds — the full comparison is on the [@Primary vs @Qualifier](/content/tree/backend/spring/annotations/primary-qualifier) page.

## Which annotation do I reach for?

- **"Make this class a bean"** → `@Component` (or `@Service` / `@Repository` / `@Controller` for intent), `@Bean` when you need factory logic, `@Configuration` for a group of `@Bean` methods.
- **"This class needs a collaborator"** → constructor injection, no annotation needed in Spring 4.3+ with a single constructor; add `@Qualifier` when more than one candidate exists.
- **"Which of several implementations"** → `@Primary` for the default, `@Qualifier` (preferably a custom annotation) at the injection point, `Map<String, T>` when the choice is data.
- **"Add behaviour around a method"** → `@Transactional`, `@Cacheable`, `@Async`, `@PreAuthorize` — and remember they all need a proxy, so self-invocation bypasses them.
- **"Read configuration"** → `@Value` for one value, `@ConfigurationProperties` for a typed group.
- **"Run code at startup/shutdown"** → `@PostConstruct` / `@PreDestroy`, `@EventListener`, `@Scheduled`.

## Keeping it honest

Two habits prevent most annotation bugs:

1. **Know the reader.** `@Entity` is Hibernate's mapping, `@Valid` is Jakarta Bean Validation, `@JsonProperty` is Jackson, `@Slf4j` is Lombok. Spring only triggers them.
2. **Know the proxy.** Anything that changes behaviour (`@Transactional`, `@Async`, `@Cacheable`, `@PreAuthorize`, `@Scheduled`) works because the bean is wrapped, so an internal `this.method()` call skips it entirely.

**Related:** [Spring IoC and Dependency Injection](/content/tree/backend/spring/ioc-di), [Bean Lifecycle](/content/tree/backend/spring/bean-lifecycle), [Application Context](/content/tree/backend/spring/application-context), [Spring AOP](/content/tree/backend/spring/aop).
