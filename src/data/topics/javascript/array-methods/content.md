

```js
const prices = [10, 20, 30];

map    -> transform each item, same length out:
  prices.map(p => p * 1.1)          // [11, 22, 33]

filter -> keep items matching a condition:
  prices.filter(p => p > 15)         // [20, 30]

reduce -> combine everything into one value:
  prices.reduce((sum, p) => sum + p, 0)   // 60
```