# JavaScript Variables and Hoisting

Learn how `var`, `let`, and `const` differ, and how JavaScript handles variable and function declarations before code runs. Edit each example and select **Run** to see the output.

## 1. `var`, `let`, and `const`

| Keyword | Scope | Redeclaration in the same scope | Reassignment | Initialization |
| --- | --- | --- | --- | --- |
| `var` | Function (or global) | Allowed | Allowed | Optional; defaults to `undefined` |
| `let` | Block | Not allowed | Allowed | Required before use |
| `const` | Block | Not allowed | Not allowed for the binding | Required at declaration |

```js runnable
var city = "Hyderabad";
let count = 1;
const language = "JavaScript";

count = 2;
console.log("City:", city);
console.log("Count:", count);
console.log("Language:", language);
```

`const` prevents reassignment of the binding, not mutation of an object stored in that binding.

```js runnable
const user = { name: "Yash" };
user.name = "CodeTrove";
console.log(user);

// This would throw a TypeError:
// user = { name: "Another user" };
```

## 2. Function scope vs block scope

`var` is scoped to its containing function, while `let` and `const` are scoped to the nearest block, such as an `if` block or loop body.

```js runnable
if (true) {
  var functionScoped = "visible outside the block";
  let blockScoped = "visible only inside the block";
  const alsoBlockScoped = "also inside the block";
  console.log(blockScoped);
  console.log(alsoBlockScoped);
}

console.log(functionScoped);
// Uncomment the next line to see a ReferenceError:
// console.log(blockScoped);
```

## 3. What is hoisting?

Hoisting describes how JavaScript processes declarations before executing statements in their scope. It does **not** mean every variable is safely usable before its declaration.

### `var` hoisting

A `var` declaration is initialized to `undefined` when its scope is entered. Its assignment remains at the original line.

```js runnable
console.log(message); // undefined
var message = "Hello";
console.log(message); // Hello
```

Conceptually, this behaves like:

```js
var message;
console.log(message);
message = "Hello";
console.log(message);
```

### `let` and `const`: temporal dead zone

`let` and `const` declarations are also processed for their scope, but they cannot be accessed before the declaration is evaluated. That interval is called the **temporal dead zone (TDZ)**.

```js runnable
// Uncomment to observe a ReferenceError:
// console.log(score);
let score = 10;
console.log(score);
```

The same restriction applies to `const`:

```js runnable
const framework = "React";
console.log(framework);

// Uncomment to observe a ReferenceError:
// console.log(nextFramework);
// const nextFramework = "Vue";
```

## 4. Function declaration hoisting

A function declaration can be called before its position in the source code because the function declaration is initialized during scope setup.

```js runnable
console.log(greet("Yash"));

function greet(name) {
  return `Hello, ${name}!`;
}
```

## 5. Function expressions and arrow functions

The variable declaration follows its own hoisting rules. With `var`, the binding exists as `undefined` before assignment; calling it then causes a `TypeError`. With `let` or `const`, accessing the binding before declaration causes a `ReferenceError`.

```js runnable
// Uncomment to see a TypeError: greetUser is undefined at this point.
// greetUser();
var greetUser = function () {
  console.log("Hello from a function expression");
};
greetUser();
```

```js runnable
const add = (a, b) => a + b;
console.log(add(2, 3));
```

## 6. Quick rules to remember

- Prefer `const` by default when a binding will not be reassigned.
- Use `let` when reassignment is needed.
- Avoid `var` in modern JavaScript unless you specifically need its function-scoped behavior.
- Declare variables before using them to make code easier to read and avoid temporal-dead-zone errors.
- Function declarations are hoisted with their function body; function expressions and arrow functions are assigned to variables and follow those variables' initialization rules.

> **Try it:** Change values in any runnable example and select **Run**. Use **Reset** to restore the original code.
