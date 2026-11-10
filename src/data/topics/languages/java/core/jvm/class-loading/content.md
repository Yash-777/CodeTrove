# JVM Class Loading

Class loading locates a binary class definition and creates the runtime representation used by the JVM. Loading is only one stage of the class lifecycle; linking and initialization happen under separate rules.

## Lifecycle

1. **Loading** finds the bytes for a requested binary name and creates a `Class` object.
2. **Verification** checks that the bytecode is structurally and semantically safe for the JVM.
3. **Preparation** allocates class-level storage and assigns default values to static fields.
4. **Resolution** turns symbolic references into direct references when required; it may be lazy.
5. **Initialization** executes class initialization code and assigns explicit static initializers in the specified order.

A class can be loaded and linked without being initialized. Referencing a compile-time constant, asking for a class literal, and other operations have distinct initialization behavior; do not reduce the rules to “the first reference always runs static code.”

## Parent delegation

A class loader normally asks its parent to load a class before trying itself. This helps platform classes come from trusted loaders and avoids accidentally replacing core types. Modern JDKs distinguish the bootstrap loader, the platform loader, and the application/system loader; older documentation may call the middle layer the extension loader.

```java
ClassLoader loader = ClassLoader.getSystemClassLoader();
System.out.println(loader);
System.out.println(String.class.getClassLoader()); // typically null: bootstrap-defined
System.out.println(MyService.class.getClassLoader());
```

The bootstrap loader is implemented by the JVM and may be represented as `null` in the Java API. The exact loader graph is implementation- and runtime-dependent.

## Class identity and isolation

A runtime type is identified by its binary name together with its defining class loader. Two loaders can define the same binary name as distinct types, which is useful for plugins and isolation but can also cause confusing `ClassCastException` or `LinkageError` failures.

Application servers, test runners, plugin systems, and reloadable development tools often use child-first or custom delegation rules. Document those rules and close resources associated with unloadable loaders.

## Common failures

`ClassNotFoundException` usually means a requested class could not be found through the loading operation. `NoClassDefFoundError` can mean a class was present earlier but is now unavailable or failed during initialization. `LinkageError` often signals incompatible versions, duplicate definitions, or loader constraints.

Diagnose the runtime class path, module path, defining loader, dependency graph, and initialization cause. Avoid solving conflicts by blindly changing delegation order; that can hide a version mismatch or expose unsafe platform replacements.

**Related:** [JVM Memory](/content/tree/languages/java/core/jvm/jvm-memory), [JVM Tuning](/content/tree/languages/java/core/jvm/jvm-tuning).
