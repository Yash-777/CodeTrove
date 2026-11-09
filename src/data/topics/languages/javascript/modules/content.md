# JavaScript Modules

Modules split a program into files with explicit imports and exports. A module's top-level names are private by default, which prevents unrelated files from accidentally sharing mutable globals.

## Named exports

```js
// math.js
export function add(left, right) {
  return left + right;
}

export const version = '1.0';
```

```js
// app.js
import { add, version } from './math.js';

console.log(add(2, 3), version);
```

Use named exports when a file exposes several related capabilities. The importer chooses the local names, and refactoring tools can trace the relationship.

## Default exports and re-exports

A module can expose one primary value as its default export.

```js
// formatter.js
export default function formatName(name) {
  return name.trim().toUpperCase();
}
```

```js
import formatName from './formatter.js';
```

Default exports are convenient for one main abstraction, while named exports make the public surface more explicit. Re-export a stable public API from an index module when consumers should not depend on internal file layout.

## Module evaluation

Static imports are resolved before the module body runs. Dependencies are evaluated once and their exported bindings are shared. Circular dependencies can expose a binding before its initialization, so keep the dependency graph directed and move shared contracts into a lower-level module when cycles appear.

Dynamic import loads a module on demand and returns a promise:

```js
async function loadEditor() {
  const { Editor } = await import('./editor.js');
  return new Editor();
}
```

This is useful for optional features and route-level code splitting. Handle loading failures and avoid importing untrusted paths constructed from user input.

## Module boundaries

Keep side effects explicit. A module that registers a global listener or starts a service during import is harder to test than one that exports a function and lets the application choose when to start it. Separate pure utilities from environment-specific adapters, and make browser or server assumptions visible in the module name and API.
