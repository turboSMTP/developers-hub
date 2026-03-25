# Webhooks

Receive real-time notifications for delivery and engagement events by registering a webhook endpoint in your TurboSMTP dashboard.

---

## Overview

TurboSMTP sends HTTP `POST` requests to your configured endpoint whenever a tracked event occurs. Each request contains a JSON payload describing the event.

---

## Event Types

| Event | Trigger |
|---|---|
| `delivered` | Message successfully delivered to recipient mail server |
| `bounced` | Message permanently rejected (hard bounce) |
| `deferred` | Delivery temporarily delayed (soft bounce / 4xx) |
| `dropped` | Message suppressed (unsubscribe, block, or duplicate) |
| `opened` | Recipient opened the email (requires open tracking) |
| `clicked` | Recipient clicked a tracked link |
| `unsubscribed` | Recipient clicked the unsubscribe link |
| `complained` | Recipient marked the message as spam |

---

## Payload Schema

```json
{
  "event": "delivered",
  "timestamp": "2026-03-25T14:32:00Z",
  "message_id": "msg_abc123",
  "email": "recipient@example.com",
  "subject": "Your order has shipped",
  "metadata": {}
}
```

### Common Fields

| Field | Type | Description |
|---|---|---|
| `event` | string | Event type (see table above) |
| `timestamp` | string (ISO-8601) | Time the event occurred |
| `message_id` | string | Unique identifier for the message |
| `email` | string | Recipient address |
| `subject` | string | Email subject line |
| `metadata` | object | Custom fields passed at send time |

---

## Securing Your Endpoint

TurboSMTP signs webhook payloads with an HMAC-SHA256 signature. Validate the `X-TurboSMTP-Signature` header on every incoming request to ensure the payload originated from TurboSMTP.

```python
import hmac
import hashlib

def verify_signature(payload: bytes, secret: str, signature: str) -> bool:
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
```

---

## Registering a Webhook

1. Log in to the TurboSMTP dashboard
2. Navigate to **Settings → Webhooks**
3. Enter your endpoint URL and select the events to subscribe to
4. Save — TurboSMTP will begin delivering events immediately

---

## Next Steps

- [Transactional email overview](../transactional/README.md)
- [Full API Reference](../../api-reference/README.md)
