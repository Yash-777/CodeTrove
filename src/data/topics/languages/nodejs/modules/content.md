# Modules: CommonJS and ES Modules

A module is a file or package with an explicit interface that other code can load. Modules let an application split responsibilities, reuse code, and isolate local variables. Node.js provides built-in modules, project files, and packages installed into `node_modules`. [1]

## Three module sources

1. **Built-in modules** provide runtime features. Use the `node:` prefix to make the source clear, such as `node:fs/promises`, `node:http`, or `node:path`.
2. **Local modules** are files in your project. Relative paths such as `./routes.js` identify them.
3. **Packages** are installed dependencies such as `express`. A package can define public entry points and command-line executables in its package metadata.

Do not import an untrusted package merely because it has a familiar name. Package resolution follows the project and module configuration; typos in a dependency name can install a different package than intended.

## CommonJS

CommonJS is the original Node.js module system. It uses `require()` to load modules and `module.exports` to define what a file provides. Use `.cjs` to force CommonJS when a package is configured as ES modules.

```js
// math.cjs
function add(a, b) {
  return a + b;
}

module.exports = { add };
```

```js
// app.cjs
const { add } = require('./math.cjs');
console.log(add(2, 3));
```

Assigning a property to `exports` adds a named export, but assigning a completely new value to `exports` does not replace `module.exports`. When exporting a single class or function, assign it to `module.exports`.

## ECMAScript modules

ES modules use `import` and `export`. Use `.mjs` to force an ES module, or set `"type": "module"` in the nearest `package.json` so `.js` files in that package scope are interpreted as ES modules. Use `.cjs` or `"type": "commonjs"` to be explicit about CommonJS. Make the choice clear rather than mixing styles unpredictably. [1] [2]

```json
{
  "type": "module"
}
```

```js
// math.js
export function add(a, b) {
  return a + b;
}
```

```js
// app.js
import { add } from './math.js';
console.log(add(2, 3));
```

In Node.js, relative ES module imports generally include the file extension, such as `./math.js`. `import` and `require()` are not interchangeable syntax: they use different loaders and have different resolution and interoperability rules. Avoid assuming that a default export from an ES module behaves like a CommonJS export object.

## Choosing and changing module systems

For a new project, ES modules are a common default because they use the JavaScript standard syntax shared with browsers. CommonJS remains widely used in existing Node.js projects and packages. Match the system used by the project's dependencies, tooling, and test configuration.

When converting a project, do it consistently: set the package `type`, update file extensions where needed, adjust import/export syntax, and run the test/build suite. A package boundary is defined by the nearest `package.json`, so nested packages may have different module types.

## Practical debugging

- `ERR_MODULE_NOT_FOUND`: check the relative path and file extension, then confirm the dependency is installed in the current project.
- `require is not defined`: the file is running as an ES module; use `import` or change the package/file module type intentionally.
- `Cannot use import statement outside a module`: Node is interpreting that file as CommonJS; set `"type": "module"` or use `.mjs` if that is the intended system.
- A package works in one folder but not another: check which `package.json` is nearest to each file and whether each environment installed dependencies.

## References

[1]: https://nodejs.org/api/modules.html "CommonJS modules"
[2]: https://nodejs.org/api/esm.html "ECMAScript modules"
