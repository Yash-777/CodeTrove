JavaScript runs on a single thread, but never blocks on I/O. The
event loop continuously checks: is the call stack empty? If so, take the
next task from the queue (a resolved promise callback, a timer, an I/O
completion) and run it. This is why console.log order with
setTimeout(fn, 0) can surprise beginners - "0ms" still means "after the
current stack finishes."
