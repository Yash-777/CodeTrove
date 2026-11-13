# Selenium XPaths

XPath is a selector language for locating nodes in an HTML or XML document. In Selenium, a good XPath identifies the element by stable meaning rather than by the current position of a fragile DOM tree.

## Absolute versus relative paths

An absolute XPath starts at the document root and encodes every level:

```xpath
/html/body/main/div[2]/form/input[1]
```

It breaks when a wrapper is inserted. A relative XPath starts from a meaningful anchor:

```xpath
//form[@aria-label='Sign in']//input[@name='email']
```

Prefer a stable `id`, `name`, `data-testid`, accessible label, or unique semantic attribute when one exists. CSS selectors are often simpler for classes and attributes; XPath is valuable when you need text matching or relationships between nodes.

## Core expressions

| Need | XPath | Notes |
|---|---|---|
| Element by attribute | `//input[@name='email']` | Exact attribute match |
| Visible text | `//button[normalize-space()='Save']` | Ignores surrounding whitespace |
| Partial attribute | `//*[contains(@class, 'error')]` | Useful for generated class names, but avoid broad matches |
| Prefix | `//div[starts-with(@id, 'row-')]` | Works with predictable prefixes |
| Descendant | `//section[@aria-label='Orders']//button` | Searches below the anchor |
| Parent | `//span[normalize-space()='Total']/..` | Use a semantic ancestor when possible |
| Sibling | `//label[.='Email']/following-sibling::input` | Useful for label-control layouts |

Predicates can be combined:

```xpath
//input[@type='text' and @required and not(@disabled)]
```

## Axes and relationships

XPath axes express how nodes relate: `ancestor`, `parent`, `child`, `descendant`, `following-sibling`, `preceding-sibling`, `following`, and `preceding`. Use them when the element itself has no reliable identifier but a nearby label or heading does.

```xpath
//article[.//h2[normalize-space()='Payment']]
  //button[@type='submit']
```

This selects the submit button inside the article whose heading is Payment. It is more resilient than `//article[3]` because it describes the relationship that matters.

## Selenium usage and waits

```java
By email = By.xpath("//input[@name='email']");
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
WebElement field = wait.until(ExpectedConditions.visibilityOfElementLocated(email));
field.clear();
field.sendKeys("qa@example.test");
```

A selector only answers *where*. An explicit wait answers *when*. Wait for visibility, clickability, a URL, a stable attribute, or a business-level state rather than adding arbitrary sleeps.

## Dynamic DOM troubleshooting

- Inspect the rendered DOM, not only the original HTML source.
- Check whether an iframe or shadow root changes the search context.
- Use `normalize-space()` when formatting adds whitespace around text.
- Avoid indexes unless the collection order is part of the contract.
- Do not select by volatile generated IDs or CSS classes when a stable test attribute can be added.
- Log the locator and the current URL when a wait times out.

> **Locator principle:** the best XPath describes the user-facing relationship that makes the element unique, not the number of containers above it.
