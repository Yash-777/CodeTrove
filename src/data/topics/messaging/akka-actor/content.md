# Akka Actor

The actor model represents concurrent work as isolated actors that communicate by sending messages. An actor owns its state and processes one message at a time, so callers do not directly mutate that state or share its locks.

## Actor fundamentals

An actor has an address, a mailbox, a behavior, and private state. Messages should be immutable commands or events. The sender does not call a method on the actor; it sends a message and the actor decides how to handle it.

```scala
import akka.actor.typed.{ActorRef, Behavior}
import akka.actor.typed.scaladsl.Behaviors

object Counter {
  sealed trait Command
  case object Increment extends Command
  final case class Get(replyTo: ActorRef[Int]) extends Command

  def apply(value: Int = 0): Behavior[Command] =
    Behaviors.receive { (_, message) => message match {
      case Increment => apply(value + 1)
      case Get(replyTo) => replyTo ! value; Behaviors.same
    }}
}
```

Typed Akka makes the protocol explicit. An `ActorRef[Command]` accepts only the messages defined by the actor's protocol, which turns many integration mistakes into compile-time errors.

## Tell, ask, and timeouts

The tell pattern (`ref ! message`) is asynchronous and does not wait for a result. The ask pattern creates a temporary reply path and should always have a timeout and a failure strategy. Prefer sending a command with a reply actor when the protocol can model the response directly.

Do not block an actor waiting for I/O. Delegate blocking work to a suitable dispatcher or use an asynchronous client, then send the result back as a message.

## Supervision and lifecycle

Supervision defines what happens when a child fails: restart, resume, stop, or escalate. Restarting may reset in-memory state, so durable state belongs in a database or event store when it cannot be reconstructed.

Design startup, shutdown, poison messages, timeouts, and dead letters as observable states. A mailbox can fill when a producer outpaces a consumer; apply back-pressure, bounded queues, batching, or admission control rather than assuming the actor system is infinite.

## Production checklist

- Keep messages small, immutable, versionable, and explicit.
- Make handlers idempotent when delivery can be retried.
- Choose dispatchers for CPU-bound and blocking work separately.
- Instrument mailbox wait, processing time, failures, restarts, and dead letters.
- Test behavior with probes, deterministic clocks, and failure scenarios.
- Define delivery guarantees; ordinary actor messaging is not automatically exactly once.

> **Mental model:** an actor is a serialized state machine with a mailbox, not a magical distributed transaction.
