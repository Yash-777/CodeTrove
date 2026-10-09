# TypeScript Basics

TypeScript adds static type syntax to JavaScript. CodeTrove type-checks each runnable TypeScript example in your browser, transpiles it to JavaScript, then executes it in the sandboxed playground. Type errors are underlined in the editor while you type, and **Run** prints the compiler error instead of executing code that does not compile.

> Note: The playground checks a single self-contained file (strict mode). `import`/`export` statements and npm packages are not available.

## 1. Type annotations

Use annotations to describe the values a variable can hold.

```ts runnable
let userName: string = "Yash";
let score: number = 95;
let isLearning: boolean = true;

console.log("User:", userName);
console.log("Score:", score);
console.log("Learning TypeScript:", isLearning);
```

## 2. Type inference

TypeScript can infer a type from the initial value, so annotations are not always necessary.

```ts runnable
let city = "Hyderabad"; // inferred as string
let visitors = 12;      // inferred as number

console.log(city.toUpperCase());
console.log("Visitors:", visitors + 1);
```

## 3. Functions and parameter types

Annotate function parameters and, when useful, the return type.

```ts runnable
function add(a: number, b: number): number {
  return a + b;
}

const formatGreeting = (name: string): string => `Hello, ${name}!`;

console.log("Sum:", add(10, 5));
console.log(formatGreeting("CodeTrove"));
```

## 4. Interfaces and object shapes

An interface describes the properties an object should have.

```ts runnable
interface Product {
  id: number;
  name: string;
  price: number;
}

const product: Product = { id: 101, name: "Keyboard", price: 49.99 };
console.log(product.name);
console.log("Price:", product.price);
```

## 5. Union types and narrowing

A union allows a value to be one of several types. Check the type before using type-specific operations.

```ts runnable
function printId(id: number | string): void {
  if (typeof id === "string") {
    console.log("ID:", id.toUpperCase());
  } else {
    console.log("ID:", id.toFixed(0));
  }
}

printId("ab-123");
printId(456);
```

## 6. Optional properties

Use `?` for a property that may be absent.

```ts runnable
interface Profile {
  name: string;
  nickname?: string;
}

function showProfile(profile: Profile): void {
  console.log("Name:", profile.name);
  console.log("Nickname:", profile.nickname ?? "not set");
}

showProfile({ name: "Yash" });
showProfile({ name: "Yashwanth", nickname: "Yash" });
```

## 7. Compile-time type errors

In JavaScript a variable can change type freely. TypeScript infers the type from the first value and reports a **compile error** when you break it - before the code ever runs.

JavaScript - perfectly valid:

```js runnable
let score = 99;          // starts as a number
score = "Game Over";     // fine in JavaScript
console.log(score);
```

TypeScript - the assignment is underlined in the editor; select **Run** to see the compiler message:

```ts runnable
let score = 99;          // TS infers: number
score = "Game Over";     // ❌ COMPILE ERROR
console.log(score);
```

Expected output: `main.ts(2,1): error TS2322: Type 'string' is not assignable to type 'number'.`

Fix it by declaring the type you actually want:

```ts runnable
let score: number | string = 99;
score = "Game Over";
console.log(score);
```

## Key takeaways

- TypeScript is type-checked, then transpiled to JavaScript before browser execution.
- Type errors stop the run and are shown as `main.ts(line,col): error TSxxxx`.
- Type annotations and interfaces are removed during transpilation.
- Type inference reduces repetitive annotations.
- Union types and narrowing help model values safely.
- This playground is for self-contained examples; imports and npm packages are not provided.
