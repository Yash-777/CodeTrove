# FreeMarker Template Language (FTL)

FreeMarker is a server-side template engine. An FTL template combines literal output with expressions and directives that read a data model. The template should present data; business rules and security decisions should remain in application code.

## Interpolation and data

```ftl
<h1>Welcome, ${user.displayName}</h1>
<p>Open orders: ${orders?size}</p>
```

Variables may be strings, numbers, booleans, sequences, hashes, or dates. Missing values should be handled deliberately:

```ftl
${user.nickname!user.displayName}
<#if user.phone??>
  <span>${user.phone}</span>
</#if>
```

The default operator (`!`) supplies a fallback; `??` tests whether a value exists. Avoid allowing missing data to silently hide a required business field.

## Directives and iteration

```ftl
<#if orders?has_content>
  <ul>
  <#list orders as order>
    <li>${order.id}: ${order.total}</li>
  <#else>
    <li>No orders</li>
  </#list>
  </ul>
<#else>
  <p>No order data was supplied.</p>
</#if>
```

Assignments use `<#assign>`. Macros define reusable presentation blocks:

```ftl
<#macro badge label tone='neutral'>
  <span class="badge badge-${tone}">${label}</span>
</#macro>
<@badge label='Paid' tone='success' />
```

Use `<#include>` for shared fragments and `<#import>` for reusable macro libraries. Keep macro parameters small and explicit.

## Escaping and output formats

HTML output should use the appropriate auto-escaping configuration or explicit escaping such as `${value?html}`. URL, JavaScript, JSON, XML, email, and plain-text output have different escaping rules. Never concatenate untrusted input into HTML, JavaScript, SQL, or shell commands through a template.

Whitespace control (`<#lt>`, `<#rt>`, and related syntax) can help generated text, but use it sparingly so the template remains readable. Date, number, and string built-ins are powerful; document locale and time-zone assumptions.

## Configuration and debugging

A template needs a loader, encoding, locale, time zone, exception handler, and data model. In development, expose useful template errors; in production, log a correlation ID and a safe failure without leaking the data model. Test templates with representative data, missing optional values, empty collections, escaping-sensitive text, and non-ASCII characters.

> **Template boundary:** templates format trusted view data; they should not become a second application service layer.
