/**
 * src/data/topics/javascript.js
 * ------------------------------------------------------------------
 * Same shape/rules as java.js - see that file's header comment for the
 * full field-by-field explanation. This file only covers "JavaScript"
 * category topics.
 */

const javascriptTopics = [
  {
    slug: 'promises',
    title: 'Promises & async/await',
    summary: 'Handling asynchronous operations without callback pyramids.',
    tags: ['javascript', 'async'],
    gifUrl: null,
    relatedTool: null,
    body: `A Promise represents a value that will be available later (success)
or an error (failure). async/await is syntax sugar that lets you write
asynchronous code that reads like synchronous code.

Example:
  async function getUser(id) {
    const res = await fetch(\`/api/users/\${id}\`);
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  }`,
  },
  {
    slug: 'destructuring',
    title: 'Destructuring',
    summary: 'Unpack values from arrays/objects into distinct variables.',
    tags: ['javascript', 'syntax'],
    gifUrl: null,
    relatedTool: null,
    body: `Example:
  const user = { name: 'Ana', age: 30 };
  const { name, age } = user;

  const [first, second] = [10, 20];`,
  },
  {
    slug: 'event-loop',
    title: 'The Event Loop',
    summary: 'How JavaScript handles async work on a single thread.',
    tags: ['javascript', 'runtime'],
    gifUrl: null,
    relatedTool: null,
    body: `JavaScript runs on a single thread, but never blocks on I/O. The
event loop continuously checks: is the call stack empty? If so, take the
next task from the queue (a resolved promise callback, a timer, an I/O
completion) and run it. This is why console.log order with
setTimeout(fn, 0) can surprise beginners - "0ms" still means "after the
current stack finishes."`,
  },
  {
    slug: 'array-methods',
    title: 'map, filter, reduce',
    summary: 'The three array methods that replace most manual loops.',
    tags: ['javascript', 'arrays'],
    gifUrl: null,
    relatedTool: null,
    body: `const prices = [10, 20, 30];

map    -> transform each item, same length out:
  prices.map(p => p * 1.1)          // [11, 22, 33]

filter -> keep items matching a condition:
  prices.filter(p => p > 15)         // [20, 30]

reduce -> combine everything into one value:
  prices.reduce((sum, p) => sum + p, 0)   // 60`,
  },
];

export default javascriptTopics;
