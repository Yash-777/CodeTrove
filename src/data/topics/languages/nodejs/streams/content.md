# Streams and Backpressure

A stream processes data incrementally. Instead of loading an entire file, upload, or response into memory first, a stream passes manageable chunks from a source to a destination. Node.js uses streams for filesystem, network, compression, and process I/O. [1]

## Four stream types

- **Readable**: data can be read from it, such as `createReadStream()`.
- **Writable**: data can be written to it, such as `createWriteStream()`.
- **Duplex**: it is both readable and writable, such as a TCP socket.
- **Transform**: it is duplex and changes data as it passes through, such as a compression stream.

A real task might be: file on disk → transform that redacts a field → compressed output stream. Each stage can process a chunk and pass it onward without keeping the whole file in memory.

## Prefer pipeline for composed streams

`pipeline()` connects streams, forwards errors, and handles completion. The promise-based API works well with `async` functions:

```js
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

await pipeline(
  createReadStream('large-input.log'),
  createWriteStream('large-output.log'),
);
```

Run this example from an ES module (for example, a project with `"type": "module"` in `package.json`). A production pipeline may add transform streams for parsing, validation, redaction, or compression. Handle errors at the operation boundary and ensure temporary output files are cleaned up if a pipeline fails. [1]

## Backpressure protects memory

A fast producer can generate data faster than a slow consumer can store, transmit, or transform it. Without flow control, buffers can grow until the process uses too much memory. Backpressure is the mechanism that lets a slower downstream stage tell the producer to pause until it can accept more data.

When manually writing to a writable stream, `write(chunk)` can return `false`. Stop writing until the stream emits `drain`; ignoring this signal can accumulate data in memory. When possible, use `pipe()` or `pipeline()` rather than implementing flow control yourself. [1]

## When streams help

Streams are useful for large log files, generated reports, uploads, downloads, HTTP bodies, compression, and data transformations. They are not automatically simpler for every small value: for a small configuration file, a promise-based `readFile()` may be clearer. Choose based on data size, latency, and memory limits.

## Common mistakes

- **Using `data` listeners without flow control**: the producer can outrun the consumer. Use `pipeline()` or explicitly honor backpressure.
- **Ignoring errors**: errors can occur on any stage. `pipeline()` propagates them to the returned promise.
- **Assuming chunks align with records**: a chunk can end in the middle of a line or UTF-8 character. Use a parser/decoder designed to handle boundaries.
- **Collecting every chunk**: concatenating the entire stream recreates the memory problem streams were intended to avoid.
- **Forgetting cancellation**: for long transfers, propagate an `AbortSignal` when the client disconnects or the request is cancelled.

## References

[1]: https://nodejs.org/api/stream.html "Stream API"
