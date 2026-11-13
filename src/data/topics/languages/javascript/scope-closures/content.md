# Scope and Closures

Scope determines where a name can be resolved. JavaScript uses lexical scope: a function can access names from the place where it was written, not from the place where it is later called.

## Block and function scope

`let` and `const` are block-scoped. `var` is function-scoped, which means it can escape an `if` or loop block and is easier to misuse.

```js runnable
(function report() {
  if (true) {
    let inside = 'visible in this block';
    const alsoInside = 2;
    var functionScoped = 'visible in report';

    console.log(inside, alsoInside);
    // visible in this block 2
  }

  // `var` ignores block boundaries, so it is still available here.
  console.log('`var` belongs to the whole function:', functionScoped);

  // `let` and `const` stay inside the block, so these lines throw. ReferenceError: inside/alsoInside is not defined
  try {
    console.log(inside);
  } catch (error) {
    console.log('`let` is block scoped:', error.message);
  }

  try {
    console.log(alsoInside);
  } catch (error) {
    console.log('`const` is block scoped:', error.message);
  }
})(); // Self-invoking function: it runs immediately
```

A name in an inner scope can shadow an outer name. Prefer distinct names when possible; shadowing can make reviews and debugging harder.

## Closures

A closure is a function that remembers the variables from the place where it was created, even after that outer function has finished running.

```js runnable
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

Here, `makeCounter` finishes, but the returned function still remembers `value`. Each call to `makeCounter` creates its own separate `value`, so counters don't affect each other.

Closures are useful for private data, callbacks, event handlers, and factory functions.

> [!TIP]
> Think of a closure as a function carrying a backpack. The backpack holds the variables it needs from where it was born.

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
