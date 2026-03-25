# Transactional Email

Send one-to-one triggered emails and retrieve delivery analytics via the TurboSMTP Mail API.

---

## Send an Email

**`POST /mail/send`**

```bash
curl -X POST https://api.turbo-smtp.com/api/v2/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "notifications@yourdomain.com",
    "to": ["user@example.com"],
    "subject": "Your order has shipped",
    "html": "<p>Your order #1234 is on its way.</p>",
    "text": "Your order #1234 is on its way."
  }'
```

### Key Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `from` | string | Yes | Sender email address |
| `to` | string[] | Yes | Recipient email addresses |
| `subject` | string | Yes | Email subject line |
| `html` | string | No* | HTML body |
| `text` | string | No* | Plain text body |

*At least one of `html` or `text` is required.

> See the [API Reference](../../api-reference/README.md) for the full parameter list including `cc`, `bcc`, `reply_to`, custom headers, and attachments.

---

## Retrieve Delivery Analytics

**`GET /mail/stats`**

Query delivery metrics for a given date range.

```bash
curl -X GET "https://api.turbo-smtp.com/api/v2/mail/stats?from=2026-01-01&to=2026-01-31" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Response Fields

| Field | Description |
|---|---|
| `sent` | Total messages accepted for delivery |
| `delivered` | Successfully delivered to recipient inbox |
| `bounced` | Hard and soft bounce count |
| `dropped` | Messages suppressed (unsubscribes, blocks) |
| `opened` | Unique open events (requires tracking enabled) |
| `clicked` | Unique click events (requires tracking enabled) |

---

## Bounce Types

| Code | Type | Action |
|---|---|---|
| `5xx` | Hard bounce | Remove address from future sends |
| `4xx` | Soft bounce / deferral | Retry eligible — monitor frequency |

---

## Next Steps

- [Set up webhooks for real-time events](../webhooks/README.md)
- [Validate addresses before sending](../validation/README.md)
- [Full API Reference](../../api-reference/README.md)
