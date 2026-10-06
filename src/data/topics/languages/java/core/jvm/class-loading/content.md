# JVM Class Loading

Class loading locates bytecode and creates its runtime `Class` representation. The lifecycle is commonly described as loading, linking (verification, preparation, resolution), and initialization. Initialization runs static initializers under JVM rules.

Parent delegation asks a parent class loader first, helping protect platform classes. Application servers, plugin systems, and test frameworks may isolate class loaders; identical class names defined by different loaders are distinct runtime types.

**Pitfalls:** classpath conflicts, dependency-version conflicts, static initialization cycles, and class-loader leaks from long-lived references to reloadable classes or threads.

**Interview points:** distinguish loading from initialization and explain class identity as the binary name plus defining class loader.

**Related:** [JVM Memory](/content/tree/languages/java/core/jvm/jvm-memory), [JVM Tuning](/content/tree/languages/java/core/jvm/jvm-tuning).
