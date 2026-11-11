# MapStruct

MapStruct is a Java annotation-processor library that generates type-safe mapper implementations at compile time. Unlike reflection-heavy mappers, generated code is visible, fast, debuggable, and checked by the compiler.

## Basic mapper

```java
@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toResponse(User user);
    User toEntity(CreateUserRequest request);
}
```

The processor generates an implementation. With `componentModel = "spring"`, that implementation is registered as a Spring bean and can be injected into a service.

```java
@Service
@RequiredArgsConstructor
class UserService {
    private final UserMapper mapper;

    UserResponse view(User user) {
        return mapper.toResponse(user);
    }
}
```

## Mapping features

Rename fields with `@Mapping`:

```java
@Mapper(componentModel = "spring")
interface OrderMapper {
    @Mapping(target = "customerName", source = "customer.displayName")
    @Mapping(target = "total", expression = "java(order.total())")
    OrderResponse toResponse(Order order);
}
```

MapStruct can convert compatible primitive and wrapper types, collections, enums, nested properties, and common date types. For a custom rule, add a default method or a separate mapper and reference it with `uses`.

```java
@Mapper(componentModel = "spring", uses = MoneyMapper.class)
interface InvoiceMapper {
    InvoiceResponse toResponse(Invoice invoice);
}
```

## Updating existing objects

Use `@MappingTarget` when a request should update an existing entity rather than create a replacement:

```java
@BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
void update(UpdateProfileRequest source, @MappingTarget User target);
```

Decide deliberately what `null` means. It may mean “clear this value” or “field was not supplied.” An update DTO with explicit presence information is safer than relying on null alone.

## Generated code and diagnostics

Keep annotation processing enabled in Maven or Gradle and inspect generated sources when a mapping surprises you. Common failures include:

- `Unmapped target property`: map it, ignore it intentionally, or fix the target design.
- Ambiguous conversion: provide a named method or explicit conversion.
- Missing nested source: protect null paths or model the relationship clearly.
- Mapper not injectable: check `componentModel`, component scanning, and the generated source.

Use `unmappedTargetPolicy = ReportingPolicy.ERROR` for DTO boundaries where silently missing data is dangerous; use a less strict policy only when the omission is deliberate and documented.

## Testing strategy

Test important mapping contracts with ordinary unit tests. Assert renamed fields, nested values, null handling, enum mapping, collection mapping, and update semantics. Tests should exercise the generated mapper through its public interface; they do not need to test MapStruct's processor itself.

> **Boundary rule:** map at the boundary between API, domain, and persistence models. Do not let a mapper hide business decisions that belong in a service or aggregate.
