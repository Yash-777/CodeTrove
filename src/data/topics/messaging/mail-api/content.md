# Mail API

A Mail API lets an application submit messages over authenticated HTTPS instead of implementing SMTP delivery directly. The provider may handle queueing, retries, bounce processing, templates, tracking, and delivery events, but the application still owns consent, content, identity, and business meaning.

## Outbound message flow

1. Validate the recipient, sender, subject, and business event.
2. Render a text and HTML body from trusted data.
3. Submit the message with a provider API key or OAuth credential.
4. Store the provider message ID and an internal idempotency key.
5. Process delivery, bounce, complaint, and unsubscribe events.

```json
{
  "to": [{"email": "customer@example.test"}],
  "from": {"email": "notifications@example.test"},
  "subject": "Your report is ready",
  "text": "Your report is ready to download.",
  "html": "<p>Your report is ready to download.</p>"
}
```

The exact JSON shape varies by provider. Keep provider-specific clients behind an internal mail service interface.

## Authentication and safety

Store API keys in a secret manager and grant only the permissions needed to send from approved identities. Verify sender domains and configure SPF, DKIM, and DMARC according to the provider and domain policy. Never place keys in frontend code, templates, logs, or error responses.

Treat recipient addresses and message bodies as personal data. Apply retention, access-control, suppression, and audit policies. Escape or sanitize user-controlled values before inserting them into HTML.

## Retries and delivery events

A successful API response usually means the provider accepted the message, not that it reached the inbox. Use a queue for bursty or non-interactive delivery. Retry transient network and provider errors with bounded exponential backoff; do not retry invalid addresses or permanent rejections.

Webhook handlers must authenticate the request, persist the event ID, and be idempotent. Model states such as `accepted`, `delivered`, `deferred`, `bounced`, `complained`, and `unsubscribed` separately from the business event that caused the mail.

## Testing

Use a sandbox, fake provider, or local mock in automated tests. Assert the rendered subject, recipient policy, template variables, headers, retry behavior, and suppression rules without sending real mail. Add an operational test for provider outage and a manual check for unsubscribe behavior.

> **Delivery principle:** your API call is an acceptance signal; delivery status is an asynchronous operational fact.
