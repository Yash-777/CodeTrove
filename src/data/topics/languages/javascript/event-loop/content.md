# The JavaScript Event Loop

JavaScript executes synchronous code on a call stack. Browser and server runtimes provide host APIs for timers, network requests, and other operations. When host work completes, its callback is queued for a later turn of the event loop.

## Tasks and microtasks

The current stack finishes before queued work runs. Promise reactions and `queueMicrotask` use the microtask queue, while timers and many I/O callbacks use task queues. After a task completes, the runtime drains microtasks before starting another task.

```js
console.log('start');

setTimeout(() => console.log('timer'), 0);
Promise.resolve().then(() => console.log('promise'));

console.log('end');
// start, end, promise, timer
```

A zero-millisecond timer is not an immediate interrupt. It becomes eligible only after the current task and the already queued microtasks finish.

## Avoid blocking the loop

Long CPU-bound loops block input, rendering, timers, and network callbacks because no other work can run while the stack is busy.

```js
function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}
```

For expensive work, split processing into small scheduled chunks, use a worker where supported, or move the computation to a server-side worker. Do not assume that making a function `async` makes CPU work non-blocking; `async` changes promise handling, not the execution cost of synchronous statements.

## Scheduling and responsiveness

Use promises for dependent asynchronous flow and timers for deliberate delay or yielding. Be careful with recursive microtasks: continuously scheduling another microtask can starve timers and rendering. Keep callbacks short, measure long tasks, and apply cancellation when queued work is no longer relevant.

The exact host queues vary between browsers and server runtimes, but the reliable rule is the same: synchronous work runs first, completed asynchronous work is queued, and queued callbacks run only when the current stack is clear.
