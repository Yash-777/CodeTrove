# Scope and Closures

Scope determines where a name can be resolved. JavaScript uses lexical scope: a function can access names from the place where it was written, not from the place where it is later called.

## Block and function scope

`let` and `const` are block-scoped. `var` is function-scoped, which means it can escape an `if` or loop block and is easier to misuse.

```js
function report() {
  if (true) {
    let inside = 'visible in this block';
    const alsoInside = 2;
    var functionScoped = 'visible in report';
    console.log(inside, alsoInside);
  }

  console.log(functionScoped);
  // inside and alsoInside are not available here.
}
```

A name in an inner scope can shadow an outer name. Prefer distinct names when possible; shadowing can make reviews and debugging harder.

## Closures

A closure is a function together with the lexical environment it can still access. The outer function may finish, but the captured bindings remain available while the inner function is reachable.

```js
function makeCounter(start = 0) {
  let value = start;
  return () => {
    value += 1;
    return value;
  };
}

const next = makeCounter(10);
console.log(next()); // 11
console.log(next()); // 12
```

Each call to `makeCounter` creates a separate `value` binding. Closures are useful for private state, callbacks, event handlers, and factories.

## Loops and captured bindings

A `let` declaration in a `for` loop creates a per-iteration binding. With `var`, callbacks share the same function-scoped variable and often observe its final value.

```js
const callbacks = [];
for (let index = 0; index < 3; index += 1) {
  callbacks.push(() => index);
}
console.log(callbacks.map((callback) => callback())); // [0, 1, 2]
```

## Function declarations and expressions

A function declaration is initialized when its surrounding scope is entered, so it can be called before its source position. A function expression is evaluated when execution reaches the expression. With `var`, the variable exists earlier as `undefined`; with `let` or `const`, accessing it before initialization throws a `ReferenceError`.

```js
sayHello();
function sayHello() {
  console.log('hello');
}

// greet(); // ReferenceError: Cannot access 'greet' before initialization
const greet = () => console.log('hi');
```

Use declarations when early availability improves organization. Use expressions or arrows when assigning callbacks, preserving lexical `this`, or keeping a function local to a specific binding. Avoid relying on hoisting to hide initialization order.
