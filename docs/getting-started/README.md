# Getting Started

Everything you need to make your first TurboSMTP API call.

---

## Authentication

TurboSMTP uses API Keys for authentication. Pass your key in the `Authorization` header on every request:

```
Authorization: Bearer YOUR_API_KEY
```

### API Keys vs. Consumer Keys

| Key Type | Purpose | Scope |
|---|---|---|
| **API Key** | Standard authentication for sending and analytics | Full account access |
| **Consumer Key** | Granular access control with optional IP restrictions | Scoped per application |

Consumer Keys are recommended for production environments. They support IP allowlisting, limiting exposure in the event of key compromise.

> **Manage your keys:** Log in to the TurboSMTP dashboard → Settings → API Keys

---

## Base URLs

| Environment | Base URL |
|---|---|
| Production | `https://api.turbo-smtp.com/api/v2` |

---

## Your First Request

```bash
curl -X POST https://api.turbo-smtp.com/api/v2/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "you@yourdomain.com",
    "to": ["recipient@example.com"],
    "subject": "Hello from TurboSMTP",
    "html": "<h1>It works!</h1>"
  }'
```

---

## Next Steps

- [Send transactional email](../transactional/README.md)
- [Validate email addresses](../validation/README.md)
- [Set up webhooks](../webhooks/README.md)
- [Explore the full API reference](../../api-reference/README.md)
