# Transactional Email

Send one-to-one triggered emails — order confirmations, password resets, notifications — via the TurboSMTP send API.

---

## Endpoint

**`POST /mail/send`**

| Host | Notes |
|---|---|
| `https://api.turbo-smtp.com/api/v2` | Production sending |
| `https://api.eu.turbo-smtp.com/api/v2` | Production sending, European infrastructure |

> **Authentication:** this endpoint accepts **only** the `consumerKey` / `consumerSecret` headers. Sending an `Authorization` header returns `401`. See [Getting Started](../getting-started/README.md) to create a consumer key pair.

---

## Send an Email

```bash
curl -X POST https://api.turbo-smtp.com/api/v2/mail/send \
  -H "consumerKey: $CONSUMER_KEY" \
  -H "consumerSecret: $CONSUMER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "FROM NAME <user@example.com>",
    "to": "user@example.com,user2@example.com",
    "subject": "This is a test message",
    "cc": "cc_user@example.com",
    "bcc": "bcc_user@example.com",
    "content": "This is plain text version of the message.",
    "html_content": "This is <b>HTML</b> version of the message."
  }'
```

Success response:

```json
{
  "message": "OK",
  "mid": 1688566310828572700
}
```

> **`mid` is a 64-bit integer.** Values can exceed JavaScript's `Number.MAX_SAFE_INTEGER` (2⁵³−1). If you consume the response in JavaScript, parse `mid` as a string or `BigInt` to avoid silent precision loss.

---

## Request Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `from` | string | Yes | Sender — either `user@example.com` or `Name <user@example.com>` |
| `to` | string | Yes | **Comma-separated** recipient list (not an array) |
| `subject` | string | No | Subject line, max 700 characters |
| `cc` | string | No | Comma-separated carbon-copy list |
| `bcc` | string | No | Comma-separated blind-copy list |
| `content` | string | No | Plain-text body |
| `html_content` | string | No | HTML body |
| `custom_headers` | object | No | Additional email headers as key/value strings (see below) |
| `reference_id` | string | No | Custom argument echoed back in [Event Webhook](../webhooks/README.md) payloads |
| `X-campaign-ID` | string | No | Campaign label, surfaced as `x_campaign_id` in [Analytics](../analytics/README.md) |
| `mime_raw` | string | No | A complete raw MIME message — replaces `content` and `html_content` |
| `attachments` | array | No | Attachment objects (see below) |

### Limitations

- The total size of the email, **including attachments, must be less than 24 MB**.

---

## Attachments

Each entry in `attachments` is an object:

| Field | Description |
|---|---|
| `content` | Base64-encoded file content |
| `name` | Filename shown to the recipient |
| `type` | MIME type of the file |
| `content_id` | Only for embedded images — see next section |

```bash
curl -X POST https://api.turbo-smtp.com/api/v2/mail/send \
  -H "consumerKey: $CONSUMER_KEY" \
  -H "consumerSecret: $CONSUMER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "user@example.com",
    "to": "user2@example.com",
    "subject": "Monthly report attached",
    "content": "Please find the report attached.",
    "attachments": [
      {
        "content": "dXBsb2FkZXIxQGdtYWlsLmNvbQ0KdXBsb2FkZXIyQGdtYWlsLmNvbQ0KYWJjMQ==",
        "name": "list.txt",
        "type": "text/plain"
      }
    ]
  }'
```

---

## Embedded Images (CID)

To display an image inline rather than as a downloadable attachment, give the attachment a `content_id` and reference it from `html_content` with a `cid:` URL:

```bash
curl -X POST https://api.turbo-smtp.com/api/v2/mail/send \
  -H "consumerKey: $CONSUMER_KEY" \
  -H "consumerSecret: $CONSUMER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "user@example.com",
    "to": "test@example.com",
    "subject": "This is a Message subject",
    "html_content": "<p><img src=\"cid:<UNIQUE_ID>@<SENDER_DOMAIN.COM>\"></p>",
    "attachments": [
      {
        "content_id": "<UNIQUE_ID>",
        "content": "data:image/jpeg;base64,/BASE_64_OF_THE_IMAGE",
        "name": "image.jpg",
        "type": "image/jpeg"
      }
    ]
  }'
```

Valid `content_id` formats include a UUID (`550e8400-e29b-41d4-a716-446655440000`), timestamp + suffix (`20231012-abc123`), a simple incremental ID (`1`), a Base64 string, or any custom format (`img_001_2023`).

---

## Custom Headers

`custom_headers` is an object of header name → string value. Use it for standard headers or your own:

```json
{
  "custom_headers": {
    "List-Unsubscribe": "<https://www.example.com/unlist?id=8822772727>",
    "X-Entity-Ref-ID": "4ec7b020-51dc-442f-bd39-9b0a32c3eb83",
    "Tracking-Id": "888884433",
    "reply-to": "alternative-email@domain.com"
  }
}
```

Common uses:

- **`reply-to`** — direct replies to a different address than `from`
- **`List-Unsubscribe`** — give recipients a one-click unsubscribe option (improves deliverability)
- **`X-Entity-Ref-ID`** — control how Gmail and other clients group message threads

---

## Tracking Sends

Two request fields help you correlate sends with later events:

- **`reference_id`** — a per-message custom argument included in [Event Webhook](../webhooks/README.md) payloads, ideal for joining webhook events back to records in your system.
- **`X-campaign-ID`** — a campaign label you can filter on in [Analytics](../analytics/README.md) (`filter_by=x_campaign_id`).

---

## Error Responses

**`400 Bad Request`** — `{"message": "error", "errors": [...]}` where `errors` lists each problem:

| Example `errors` entry | Cause |
|---|---|
| `missing or not valid sender email (from)` | `from` missing or malformed |
| `missing recipients (to)` | `to` missing |
| `'abc' 'to' email not valid` | An address in `to`/`cc`/`bcc` is malformed (one entry per bad address) |
| `Invalid Mime` | `mime_raw` could not be parsed |
| `nocredit` | Account subscription has no remaining sending credit |

**`401 Unauthorized`** — note the distinct shape used by this endpoint:

```json
{
  "errorCode": 3,
  "message": "Invalid authorization token",
  "details": "No authorization key was specified for request: POST /api/mail/send"
}
```

Variants: `"Wrong credentials specified"` (invalid key pair) and `"Account for <email> is inactive"` (deactivated account).

---

## Next Steps

- [Track delivery, opens, and clicks in Analytics](../analytics/README.md)
- [Receive real-time events via webhooks](../webhooks/README.md)
- [Manage bounces and unsubscribes with Suppressions](../suppressions/README.md)
- [Try it in the API reference](../../api-docs/index.html#/mail/sendEmail)
