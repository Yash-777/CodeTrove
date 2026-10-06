# Spring MVC DispatcherServlet

`DispatcherServlet` is Spring MVC's front controller. It receives servlet requests and coordinates handler mapping, handler adaptation, request argument resolution, message conversion, exception handling, and response rendering.

```text
HTTP request -> DispatcherServlet -> HandlerMapping -> Controller
			 -> argument binding / validation -> return handling
			 -> HttpMessageConverter -> HTTP response
```

Filters run before the servlet; `HandlerInterceptor` hooks around mapped handler execution. Keep application business logic out of the dispatcher and global pipeline hooks.

**Interview points:** walk a JSON request through handler mapping, argument binding, validation, controller invocation, conversion, and exception resolution.

**Related:** [REST Controllers](/content/tree/backend/spring-web/rest-controllers), [Validation](/content/tree/backend/spring-web/validation), [Filters](/content/tree/backend/spring/filters).
