# Spring AOP

Aspect-oriented programming modularizes cross-cutting behavior such as transactions, security checks, and metrics. Spring AOP commonly uses proxies that intercept calls to Spring-managed beans and apply advice selected by a pointcut.

```java
@Around("@annotation(MeasureCall)")
Object measure(ProceedingJoinPoint call) throws Throwable {
	long start = System.nanoTime();
	try { return call.proceed(); }
	finally { record(System.nanoTime() - start); }
}
```

Proxy-based AOP applies at proxy boundaries. Self-invocation through `this` typically bypasses the proxy, and final/private methods may not be advised depending on proxy type. Keep advice narrow and avoid hiding business-critical flow in broad aspects.

**Interview points:** distinguish join points, pointcuts, advice, and proxying; explain why self-invocation bypasses advice; identify when compile-time or bytecode weaving differs from Spring proxy AOP.

**Related:** [Transactions](/content/tree/backend/spring-data/transactions), [Interceptors](/content/tree/backend/spring/interceptors).
