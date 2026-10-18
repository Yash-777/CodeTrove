# Event Loop and Asynchronous Work

The event loop lets Node.js make progress on many I/O operations without creating a JavaScript thread for every connection. JavaScript callbacks run one at a time by default. When the program starts asynchronous I/O, the operating system or Node's supporting runtime can perform or wait for that work; when it completes, Node schedules code to resume the task. This model can handle many concurrent requests, but it does not make CPU-heavy JavaScript run in parallel. [1]

## The lifecycle of an asynchronous request

1. Node runs the current synchronous JavaScript until the call stack is clear.
2. An API starts work such as a file read, socket operation, or timer.
3. JavaScript can continue handling other ready work while the operation is pending.
4. When the operation completes, Node queues a callback or promise continuation.
5. The callback runs when the event loop reaches the relevant queue; its synchronous code must finish before another JavaScript callback can run.

Some operations use operating-system facilities; some use libuv's worker pool. The implementation differs by API and platform. Application code should use asynchronous APIs for I/O and avoid assuming every asynchronous operation consumes a separate JavaScript thread. [1]

## A small scheduling example

```js
console.log('sync: start');

setTimeout(() => console.log('timer callback'), 0);
Promise.resolve().then(() => console.log('promise callback'));

console.log('sync: end');
```

The synchronous lines run first. The promise continuation is then processed as a microtask, and the timer callback runs in a later event-loop turn. A zero-millisecond timer does not mean “run immediately”; timer delays are minimum thresholds and can be extended by other work. Avoid relying on exact timing between different scheduling APIs. [1]

## Phases, at a useful level

The event loop cycles through phases that handle different work. The most familiar are timers, pending callbacks, poll (I/O), check (including `setImmediate()`), and close callbacks. Each phase processes callbacks that are ready for it. Promise jobs and `process.nextTick()` have their own scheduling behavior around these callbacks, so code that mixes all schedulers can become hard to reason about.

Use the scheduler that expresses your intent: promises for asynchronous composition, timers for delayed work, and `setImmediate()` for work scheduled after the current poll phase. Do not use any of them as a substitute for splitting a very large CPU task into smaller work units or moving it to a worker.

## The event-loop blocking trap

This handler is synchronous and blocks every other JavaScript callback until the loop completes:

```js
app.get('/report', (_request, response) => {
  const result = calculateForSeveralSeconds();
  response.json(result);
});
```

During that calculation, unrelated requests, timers, and completed I/O callbacks wait. This creates slow-tail latency and can make the whole process appear stuck. Prefer asynchronous I/O APIs. For sustained CPU-intensive calculations, consider `node:worker_threads`, a separate process, or a dedicated job worker. A promise alone does not move CPU work to another thread.

## Practical guidance

- Do not call synchronous filesystem APIs on a busy request path unless the work is known to be tiny and intentional.
- Avoid unbounded loops, very large synchronous parsing, and expensive regular expressions on user-controlled input.
- Set reasonable timeouts and limits for requests, uploads, and queued work.
- Measure event-loop delay and request latency under representative load; a benchmark that only measures one request can hide queueing effects.
- Use streams for large input instead of reading the entire file into one buffer; see [Streams and Backpressure](/content/tree/languages/nodejs/streams).

## References

[1]: https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick "The Node.js Event Loop"
