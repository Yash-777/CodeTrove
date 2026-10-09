# TypeScript Basics

TypeScript adds static type syntax to JavaScript. CodeTrove transpiles each runnable TypeScript example to JavaScript in your browser, then executes it in the sandboxed playground.

> Note: The playground transpiles TypeScript but does not perform full project-wide type checking or load npm packages.

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

## Key takeaways

- TypeScript is transpiled to JavaScript before browser execution.
- Type annotations and interfaces are removed during transpilation.
- Type inference reduces repetitive annotations.
- Union types and narrowing help model values safely.
- This playground is for self-contained examples; imports, npm packages, and full type checking are not provided.
