# JavaScript Types

JavaScript is dynamically typed: values have types, while variables are not permanently restricted to one type. The runtime determines which operations are valid when an expression executes.

## Primitive values

The primitive types are `string`, `number`, `bigint`, `boolean`, `undefined`, `symbol`, and `null`. Primitives are immutable values. Objects, arrays, and functions are reference values that can hold mutable state.

```js
const title = 'CodeTrove';
const count = 3;
const enabled = true;
const missing = undefined;
const empty = null;

console.log(typeof title, typeof count, typeof enabled);
console.log(typeof missing, typeof empty); // "undefined", "object"
```

`typeof null` is a long-standing language quirk. Use `value === null` when testing specifically for `null`.

## Equality and coercion

Prefer strict equality (`===` and `!==`) because it compares without implicit conversion. Loose equality (`==`) applies coercion rules that can be surprising when values come from forms, URLs, or JSON.

```js
console.log(0 === false); // false
console.log('' === 0);    // false
console.log(Number('42') === 42); // true
```

Convert at system boundaries instead of allowing mixed representations to spread through application logic. Use `Number.isNaN(value)` to detect the numeric `NaN` value, and use `Array.isArray(value)` for arrays.

## Objects and references

Assigning an object copies its reference, not a deep copy of its contents.

```js
const first = { done: false };
const second = first;
second.done = true;
console.log(first.done); // true
```

Use a deliberate copy when the data should be independent. A shallow spread copies only the first level; nested objects still share references.

```js
const original = { user: { name: 'Ana' } };
const copy = structuredClone(original);
copy.user.name = 'Sam';
console.log(original.user.name); // Ana
```

## Practical type checks

Validate external data before using it. A JSON response can be syntactically valid while still having the wrong shape, so check required fields and collection types at the boundary.

```js
function isUser(value) {
  return value !== null
    && typeof value === 'object'
    && typeof value.id === 'string'
    && typeof value.name === 'string';
}
```

Keep values predictable within a function. Explicit conversion and small type guards make dynamic code easier to test and maintain.
