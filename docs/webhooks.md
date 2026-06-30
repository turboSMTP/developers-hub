# Event Webhook

Receive real-time notifications for delivery and engagement events as TurboSMTP processes your messages.

> The Event Webhook is configured from the TurboSMTP dashboard — it is not managed through the API described elsewhere in this hub. The canonical payload documentation is the official [Event Webhook Reference](https://serversmtp.com/event-webhook-reference/); this page summarizes it and shows how webhook events relate to the send and analytics APIs.

---

## Event Types

### Delivery Events

| Event | Trigger |
|---|---|
| `PROCESSED` | Message accepted and queued for delivery |
| `DELIVERED` | Message delivered to the recipient's mail server |
| `DEFERRED` | Delivery temporarily delayed — will be retried |
| `BOUNCED` | Message permanently rejected |
| `DROPPED` | Message dropped without delivery |

### Engagement Events

| Event | Trigger |
|---|---|
| `OPENED` | Recipient opened the email |
| `CLICKED` | Recipient clicked a tracked link |
| `UNSUBSCRIBED` | Recipient unsubscribed |
| `REPORT` | Recipient reported the message as spam |

For querying the same lifecycle historically (rather than receiving it as a push), see the [Analytics](../analytics/README.md) status model.

---

## Payload Fields

### Common Fields (all events)

| Field | Description |
|---|---|
| `id` | Event identifier |
| `mid` | Message ID — matches the `mid` returned by [`POST /mail/send`](../transactional/README.md) |
| `status` | The event type (see tables above) |
| `email` | Recipient address |
| `subject` | Email subject (may be `null`) |
| `timestamp` | Event time as Unix time, GMT+0 |

### Conditional Fields

| Field | Present on | Description |
|---|---|---|
| `reason` | `DROPPED`, `DEFERRED`, `BOUNCED` | Error details from the receiving server |
| `attempt` | `DEFERRED` | Delivery attempt count |
| `useragent` | `OPENED`, `CLICKED` | Recipient browser/client information |
| `ip` | `OPENED`, `CLICKED` | Recipient IP address |
| `url` | `CLICKED` | The clicked link |

---

## Correlating Events with Your System

Two values let you join webhook events back to your own records:

- **`mid`** — every event carries the message ID returned by `/mail/send` at send time.
- **`reference_id`** — the OpenAPI specification defines the `reference_id` send field as *"custom argument included within an email to be added to the Event Webhook response"*. Set it at send time to attach your own correlation key (an order ID, a user ID) to the message's events.

```json
{
  "from": "notifications@yourdomain.com",
  "to": "user@example.com",
  "subject": "Your order has shipped",
  "content": "Order #1234 is on its way.",
  "reference_id": "order-1234"
}
```

---

## What Is Not Publicly Documented

The official reference does not currently document the following — treat any third-party claims about them with caution and [contact support](https://serversmtp.com/contacts/) if you need specifics:

- How to register a webhook endpoint (done via the dashboard)
- Request signing / signature verification
- Retry and timeout semantics for unreachable endpoints

---

## Next Steps

- [Send messages with a `reference_id`](../transactional/README.md)
- [Query delivery history with Analytics](../analytics/README.md)
- [Official Event Webhook Reference](https://serversmtp.com/event-webhook-reference/)
