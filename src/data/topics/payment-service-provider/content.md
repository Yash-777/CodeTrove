# Payment Gateways: Billdesk, Stripe, Razor, and Boxpay

A payment gateway integration is a state machine, not just a checkout button. The application creates or initializes a payment, redirects or presents a payment surface, receives a provider callback or webhook, verifies authenticity, and reconciles the final status before granting value.

## Common flow

1. Create an internal order with an amount and an immutable business reference.
2. Create the provider-side payment session, order, or intent using server-side credentials.
3. Send the client only the public checkout data it needs.
4. Receive the return response and provider webhook independently.
5. Verify signatures or authenticated event payloads on the server.
6. Transition the internal order idempotently to `PAID`, `FAILED`, `CANCELLED`, or `REQUIRES_ACTION`.
7. Reconcile uncertain or delayed payments with the provider and record refunds separately.

Never trust a browser redirect alone as proof of payment. A customer can close the tab, a callback can be retried, and a payment can remain pending after the checkout page disappears.

## Provider fit at a glance

| Provider | Useful integration concepts | Must be treated as provider-specific |
|---|---|---|
| Billdesk | Hosted checkout, transaction references, return/callback handling, reconciliation | Request signing, response fields, environments, and settlement rules |
| Stripe | Payment Intents, Checkout, webhook events, payment-method confirmation | Intent state transitions, event signatures, asynchronous methods, and API versioning |
| Razorpay | Server-created orders, checkout, payment IDs, signature verification | Order/payment relationship, HMAC verification, captures, and webhook events |
| Boxpay | Hosted or embedded checkout, payment session references, callbacks/webhooks | Credentials, signature scheme, status vocabulary, and API version details |

The exact endpoints, signature construction, API versions, and required fields change over time. Keep provider adapters isolated and verify current provider documentation before production rollout.

## Provider abstraction

Keep business code independent of gateway-specific request and response shapes:

```java
public interface PaymentGateway {
    PaymentSession createSession(PaymentOrder order, String idempotencyKey);
    PaymentStatus fetchStatus(String providerReference);
    RefundResult refund(String providerReference, Money amount);
    boolean verifyCallback(Map<String, String> headers, String rawBody);
}
```

An adapter translates the internal model to Billdesk, Stripe, Razorpay, or Boxpay. Store the provider name, internal order ID, provider reference, raw event ID, status, amount, currency, and timestamps. Do not store card numbers or sensitive payment credentials.

## Webhooks, retries, and idempotency

Persist a webhook event ID before applying its business effect. If the same event arrives twice, return a successful response without granting value twice. Use an idempotency key when creating a payment and make the key stable for the same internal order attempt.

Use bounded retries with backoff for transient failures. Do not retry authentication failures or validation errors blindly. If a provider is unavailable, mark the order as pending or unknown and reconcile later rather than guessing.

## Security and operations

- Keep secret keys in a secret manager, never in frontend code or logs.
- Verify signatures against the raw request body and use constant-time comparison where appropriate.
- Validate amount, currency, merchant reference, and expected customer before fulfillment.
- Separate test and live credentials and prevent environment crossovers.
- Audit every status transition, refund, webhook, and reconciliation decision.
- Design refunds, partial refunds, disputes, and chargebacks as separate workflows.

> **Fulfillment rule:** grant the product or service only after a server-side, verified, idempotent transition says the order is paid.
