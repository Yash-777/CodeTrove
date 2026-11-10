# Java Virtual Machine (JVM)

The Java Virtual Machine runs Java bytecode and provides a consistent execution model across operating systems. A Java source file is compiled into class files, then a JVM loads, verifies, links, and executes those classes.

## Main subsystems

A practical JVM mental model has four cooperating parts:

1. **Class loader subsystem** locates class definitions and builds their runtime representations.
2. **Runtime data areas** hold thread state, objects, class metadata, and execution support data.
3. **Execution engine** interprets bytecode and may compile frequently executed code into native machine code.
4. **Native interface and libraries** connect Java code to platform services and native implementations when required.

The JVM specification defines observable behavior, but the layout, garbage collector, JIT compiler, and diagnostic tools are implementation choices. HotSpot is one JVM implementation; other vendors may use different internal strategies.

## From source to execution

```text
.java source
   │ javac
   ▼
.class bytecode ── load → verify → prepare → resolve → initialize
                                      │
                                      ▼
                            interpreter and JIT compiler
                                      │
                                      ▼
                              machine execution
```

Verification protects the runtime from malformed bytecode. Preparation allocates class-level structures and default static values. Initialization runs class initialization code when the JVM rules require it.

## Runtime areas at a glance

The heap and method-area concepts are shared across threads. Each Java thread has its own program counter and JVM stack, and each active method call creates a frame containing local variables, an operand stack, and a return/linking context. Native stacks support native calls according to the JVM implementation.

The heap stores objects and arrays and is managed by garbage collection. Modern HotSpot JVMs keep class metadata in native **Metaspace** rather than the removed PermGen area. JIT-compiled machine code is held in an implementation-specific code cache.

## Diagnose by symptom, not by flag

`OutOfMemoryError: Java heap space`, Metaspace exhaustion, direct-buffer pressure, and inability to create native threads have different causes. Start with the exact error, runtime version, heap and native-memory measurements, allocation rate, GC behavior, and thread count. Increasing `-Xmx` is not a universal solution and can make a container exceed its memory limit.

The most useful JVM tuning loop is measured and reversible: define a latency, throughput, startup, or memory objective; establish a representative baseline; change one variable; and compare the result under the same workload.

## Related pages

- [JVM Memory](/content/tree/languages/java/core/jvm/jvm-memory)
- [Garbage Collection](/content/tree/languages/java/core/jvm/garbage-collection)
- [Class Loading](/content/tree/languages/java/core/jvm/class-loading)
- [JVM Tuning](/content/tree/languages/java/core/jvm/jvm-tuning)