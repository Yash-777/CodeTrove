# JavaScript Types, Scope and Functions

## 1. Dynamic typing

JavaScript is dynamically typed. A value always has a type, but a variable can hold a value of any type, and you can change it later. JavaScript checks what you are doing with a value only when the code runs, not before.

```js
let data = 10;
console.log(typeof data); // number

data = 'Yash';            // same variable, new type
console.log(typeof data); // string

data = true;
console.log(typeof data); // boolean

data = function () {};
console.log(typeof data); // function

let empty;                // declared, but no value yet
console.log(typeof empty); // undefined
```

The type is checked when the line runs, so a wrong operation fails only at that moment:

```js
let value = 10;
console.log(value.toString()); // 10 (works on a number)

value = null;
try {
  console.log(value.toString());
} catch (error) {
  console.log('Checked at runtime:', error.message);
  // Checked at runtime: Cannot read properties of null (reading 'toString')
}
```

> [!TIP]
> The type belongs to the value, not to the variable. The variable is just a label that can be moved to a different value.

> [!NOTE]
> "Dynamically typed" and "loosely typed" are not the same thing. JavaScript is dynamic because types are checked at runtime. It is also loose (weakly typed) because it converts types silently, for example `'5' * 2` gives `10`.

## 2. Scope: where a variable is visible

Scope decides where a name can be used.

| Where it is declared | Who can use it |
|---|---|
| Top level of the page (outside any function) | Everything on that page (global scope) |
| Inside a function | Only that function's body (local scope) |
| `let` / `const` inside `{ }` | Only that block |
| `var` inside `{ }` | The whole surrounding function |

```js runnable
(function report() {
  if (true) {
    let inside = 'visible in this block';
    const alsoInside = 2;
    var functionScoped = 'visible in report';

    console.log("let:", inside, " const:", alsoInside, " var:", functionScoped);
  }

  // `var` ignores block boundaries, so it is still available here.
  console.log('`var` belongs to the whole function:', functionScoped);

  // `let` and `const` stay inside the block, so these lines throw.
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

`const` has a second rule: it cannot be reassigned.

```js
const limit = 5;
try {
  limit = 10;
} catch (error) {
  console.log(error.name + ':', error.message);
  // TypeError: Assignment to constant variable.
}

const user = { name: 'Asha' };
user.name = 'Ravi';        // allowed: the object changes, the binding does not
console.log(user.name);    // Ravi
```

> [!WARNING]
> `const` stops reassignment, not change. An object or array declared with `const` can still be modified.

> [!NOTE]
> At the top level of a classic script, `var` and function declarations become properties of the global object. `let` and `const` are global in reach, but they are not added to `window`.

## 3. Hoisting

Hoisting means the JavaScript engine moves declarations to the top of their scope before running any code. Only the declaration moves. The assignment stays where you wrote it.

```js
console.log(city); // undefined (the declaration moved up, the value did not)
var city = 'Paris';
console.log(city); // Paris
```

The engine reads the code above as if it were written like this:

```js
var city;                 // declaration hoisted to the top
console.log(city);        // undefined
city = 'Paris';           // assignment stays in place
console.log(city);        // Paris
```

`let` and `const` are also hoisted, but they cannot be used before their declaration line. That gap is called the temporal dead zone.

```js
try {
  console.log(price);
} catch (error) {
  console.log(error.name + ':', error.message);
  // ReferenceError: Cannot access 'price' before initialization
}
let price = 5;
```

| Declared with | Usable before its line? | What you get |
|---|---|---|
| `var` | Yes | `undefined` |
| `let` / `const` | No | `ReferenceError` |
| `function name() {}` | Yes | The full function |
| `var name = function () {}` | Name only | `undefined`, then `TypeError` if called |

## 4. Default values

A variable that was declared but never assigned is `undefined`. A function that does not return anything also gives back `undefined`.

```js
let notSet;
console.log(notSet);        // undefined

function noReturn() {
  // no return statement
}
console.log(noReturn());    // undefined

function withReturn() {
  return 'some data';
}
console.log(withReturn());  // some data
```

## 5. Function declarations

A function declaration starts with the `function` keyword and a name:

```js
function name(parameters) {
  // function body: a sequence of statements
  return 'some data'; // optional, default is undefined
}
```

**Declarations are hoisted completely**, so you can call them before the line where they are written:

```js
console.log(add(2, 3)); // 5

function add(a, b) {
  return a + b;
}
```

- A declaration at the top level of the page has global access.
- A declaration inside another function is hoisted to the top of that function and is visible only there.
- If the same name is declared twice, the later one overrides the earlier one.

```js
function greet() { return 'first'; }
function greet() { return 'second'; }  // re-defined, overrides the first

console.log(greet()); // second
```

A function declared inside another function stays local:

```js
function globalAccess() {
  function localAccess() {
    return 'inside globalAccess';
  }
  console.log(localAccess()); // inside globalAccess
}

globalAccess();

try {
  localAccess();
} catch (error) {
  console.log(error.name + ':', error.message);
  // ReferenceError: localAccess is not defined
}
```

## 6. Function expressions

An expression is any piece of code that produces a value. A function can be a value too, so it can appear wherever an expression is allowed.

```js
10;                            // a literal
(10);                          // an expression
console.log((10).toString());  // 10 (a string)

var a;
a = 10;                        // an expression assigned to a variable
console.log(a.toString());     // 10
```

The same idea works with functions:

```js
var f;
f = function () {              // function expression assigned to a variable
  console.log('var Function');
};
f();                           // var Function
```

### Anonymous function expression

The function has no name of its own. It is reached through the variable.

```js
var anonymous = function () {
  console.log('anonymous function expression');
};
anonymous(); // anonymous function expression
```

### Named function expression

The name is available only inside the function itself. It is useful for recursion and for readable stack traces.

```js
const factorial = function inner(n) {
  if (n === 1) {
    return 1;
  }
  return n * inner(n - 1);   // `inner` is visible inside the function
};

console.log(factorial(5));   // 120

try {
  inner(5);
} catch (error) {
  console.log(error.message);
  // inner is not defined
}
```

### IIFE: Immediately Invoked Function Expression

Wrap a function in parentheses and call it straight away. It runs once and keeps its variables private.

```js
(function selfExecuting() {
  var secret = 'hidden inside the IIFE';
  console.log('IIFE - Immediately-Invoked Function Expression');
  // IIFE - Immediately-Invoked Function Expression
})();

try {
  console.log(secret);
} catch (error) {
  console.log(error.message);
  // secret is not defined
}
```

## 7. Declaration vs expression

| | Function declaration | Function expression |
|---|---|---|
| Syntax | `function add() {}` | `var add = function () {}` |
| Hoisted | Completely, so it can be called early | Only the variable name, so calling early fails |
| Name | Required | Optional |
| Typical use | Named helpers, top-level functions | Callbacks, IIFEs, values stored in variables |
| Error if called too early | None | `TypeError: add is not a function` (`var`) or `ReferenceError` (`let`/`const`) |

```js
try {
  subtract(5, 2);
} catch (error) {
  console.log(error.name + ':', error.message);
  // TypeError: subtract is not a function
}

var subtract = function (a, b) {
  return a - b;
};

console.log(subtract(5, 2)); // 3
```

> [!IMPORTANT]
> Both forms can do the same work. The real differences are hoisting and naming. If you need to call a function before its definition, use a declaration.

## 8. Implicit globals

Assigning to a name that was never declared creates a global variable. This happens only in non-strict ("sloppy") mode.

```js
function setup() {
  var local = 'only inside setup';
  shared = 'leaked to global scope';  // no var, let or const
}

setup();
console.log(shared); // leaked to global scope

try {
  console.log(local);
} catch (error) {
  console.log(error.message);
  // local is not defined
}
```

> [!CAUTION]
> In strict mode, and inside ES modules, `shared = ...` throws `ReferenceError: shared is not defined`. Always declare variables with `let` or `const`.

## 9. How the engine reads a script

The engine first moves declarations up, then runs the code in order. Take this script:

```js
var anonymous = function () {
  console.log('anonymous function expression');
};

var namedExpression = function forInternalUse(fact) {
  if (fact === 1) {
    return 1;
  }

  var localExpression = function () {
    console.log('local to the parent function scope');
  };

  globalExpression = function () {
    console.log('creates a new global variable, then assigns this function');
  };

  return fact * forInternalUse(fact - 1);
};

namedExpression(3);
globalExpression(); // available now, because namedExpression ran first
// creates a new global variable, then assigns this function
```

The engine treats it as if it were written like this:

```js
var anonymous;
var namedExpression;
var globalExpression;             // implicit global, created on first assignment

anonymous = function () { /* ... */ };

namedExpression = function forInternalUse(fact) {
  var localExpression;            // hoisted to the top of this function

  if (fact === 1) {
    return 1;
  }
  localExpression = function () { /* ... */ };
  globalExpression = function () { /* ... */ };
  return fact * forInternalUse(fact - 1);
};

namedExpression(3);
globalExpression();
```

> [!WARNING]
> `namedExpression()` with no argument never reaches `fact === 1`, so it recurses until the stack overflows. Always give a recursive function a base case that your input can actually hit.

## 10. Functions are objects

JavaScript treats functions as first-class objects. You can store them in variables, pass them around, and attach properties to them.

```js
function counter() {
  counter.calls += 1;
  return counter.calls;
}
counter.calls = 0;            // a property on a function

counter();
console.log(counter());       // 2
```

### Constructor functions and the prototype

Before classes, constructors were plain functions called with `new`. Shared methods live on `prototype`.

```js
function Shape(id) {          // function declaration used as a constructor
  this.id = id;
}

// Methods added once, shared by every instance.
Shape.prototype.getID = function () {
  return this.id;
};
Shape.prototype.setID = function (id) {
  this.id = id;
};

var expFn = Shape;            // the same function stored in a variable

var funObj = new Shape();     // a function object (an instance)
console.log(funObj.hasOwnProperty('prototype')); // false (instances have no own `prototype`)

funObj.setID(10);
console.log(funObj.getID());  // 10
```

## 11. Arrow functions (ES6)

Arrow functions have a shorter syntax: `(parameters) => body`. They suit small, non-method functions and cannot be used as constructors.

```js
const fn = (item) => (item & 1 ? 'Odd' : 'Even');

console.log(fn(2)); // Even
console.log(fn(3)); // Odd

try {
  new fn();
} catch (error) {
  console.log(error.name + ':', error.message);
  // TypeError: fn is not a constructor
}
```

| | Regular function | Arrow function |
|---|---|---|
| Own `this` | Yes | No (uses the surrounding `this`) |
| Can be a constructor (`new`) | Yes | No |
| Hoisted when declared with `function` | Yes | No (it is an expression) |

## 12. Primitive values

The primitive types are `string`, `number`, `bigint`, `boolean`, `undefined`, `symbol`, and `null`. Primitives are immutable values. Objects, arrays, and functions are reference values that can hold mutable state.

```js runnable
const title = 'CodeTrove';
const count = 3;
const enabled = true;
const missing = undefined;
const empty = null;

console.log(typeof title, typeof count, typeof enabled);
console.log(typeof missing, typeof empty); // "undefined", "object"
```

`typeof null` is a long-standing language quirk. Use `value === null` when testing specifically for `null`.

## 13. Equality and coercion

Prefer strict equality (`===` and `!==`) because it compares without implicit conversion. Loose equality (`==`) applies coercion rules that can be surprising when values come from forms, URLs, or JSON.

```js
console.log(0 === false);         // false
console.log('' === 0);            // false
console.log(Number('42') === 42); // true
```

Convert at system boundaries instead of allowing mixed representations to spread through application logic. Use `Number.isNaN(value)` to detect the numeric `NaN` value, and use `Array.isArray(value)` for arrays.

## 14. Objects and references

Assigning an object copies its reference, not a deep copy of its contents.

```js runnable
const first = { done: false };
const second = first;
second.done = true;
console.log(first.done); // true
```

Use a deliberate copy when the data should be independent. A shallow spread copies only the first level, and nested objects still share references.

```js runnable
const original = { user: { name: 'Ana' } };
const copy = structuredClone(original);
copy.user.name = 'Sam';
console.log(original.user.name); // Ana
```

## 15. Practical type checks

Validate external data before using it. A JSON response can be syntactically valid while still having the wrong shape, so check required fields and collection types at the boundary.

```js
function isUser(value) {
  return value !== null
    && typeof value === 'object'
    && typeof value.id === 'string'
    && typeof value.name === 'string';
}

console.log(isUser({ id: 'u1', name: 'Ana' })); // true
console.log(isUser(null));                      // false
console.log(isUser({ id: 1, name: 'Ana' }));    // false (id is a number)
```

Keep values predictable within a function. Explicit conversion and small type guards make dynamic code easier to test and maintain.

## Quick reference

| Idea | Remember it as |
|---|---|
| Dynamic typing | The value has the type, the variable is just a label |
| `var` | Function-scoped, hoisted as `undefined` |
| `let` / `const` | Block-scoped, unusable before the declaration line |
| Hoisting | Declarations move up, assignments stay |
| Function declaration | Fully hoisted, callable before it is written |
| Function expression | Behaves like any other value in a variable |
| IIFE | Define and run once, keep variables private |
| Arrow function | Short syntax, no own `this`, no `new` |
| Equality | Use `===`, convert deliberately |

> [!TIP]
> If code behaves strangely, ask two questions: where was this name declared (scope), and had that line run yet (hoisting)?