# Prototypes and Inheritance

Every ordinary JavaScript object can delegate property lookup to another object called its prototype. If a property is not found on the object itself, the runtime follows the prototype chain until it finds the property or reaches `null`.

## Delegation with `Object.create`

```js
const canSpeak = {
  speak() {
    return `${this.name} is speaking`;
  },
};

const user = Object.create(canSpeak);
user.name = 'Ana';
console.log(user.speak());
```

The method is stored once on `canSpeak`, while `user` supplies the `this` value at call time. An own property shadows a property with the same name on the prototype.

```js
user.speak = () => 'custom message';
console.log(user.speak());
console.log(Object.hasOwn(user, 'speak')); // true
```

## Classes are prototype-based syntax

`class` provides a clearer syntax for constructor functions and prototype methods. Methods declared in the class body are shared through the prototype rather than copied onto every instance.

```js
class Account {
  constructor(owner) {
    this.owner = owner;
    this.balance = 0;
  }

  deposit(amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    this.balance += amount;
  }
}

const account = new Account('Ana');
account.deposit(25);
console.log(account.balance);
```

Use `extends` and `super` only when the subtype relationship is genuine. Composition is often simpler when behavior can be assembled from independent collaborators.

## Safe property access

Objects may inherit properties, so `for...in` can include enumerable prototype properties. Use `Object.keys`, `Object.entries`, or `Object.hasOwn` when you need own properties only. Avoid changing built-in prototypes in application code because it can create collisions and surprising behavior for every consumer of that runtime.

Prototype lookup is a language mechanism, not a security boundary. Treat parsed input as data and validate it before using it in application logic.
