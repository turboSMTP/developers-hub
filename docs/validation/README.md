# Email Validation

Verify email addresses in real time before sending to protect your sender reputation and reduce bounce rates.

---

## Verify a Single Address

**`GET /verify`**

```bash
curl -X GET "https://api.turbo-smtp.com/api/v2/verify?email=user@example.com" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Response

```json
{
  "email": "user@example.com",
  "status": "valid",
  "disposable": false,
  "free_provider": true
}
```

---

## Validation Statuses

| Status | Description | Recommended Action |
|---|---|---|
| `valid` | Address is deliverable | Safe to send |
| `invalid` | Address does not exist or domain is unreachable | Remove from list |
| `catch-all` | Domain accepts all addresses — delivery unverified | Send with caution |
| `spamtrap` | Known spam trap address | **Never send** |
| `abuse` | Address associated with abuse reports | **Never send** |
| `disposable` | Temporary / throwaway address | Block or flag based on use case |

> **Important:** Never send to addresses with `spamtrap` or `abuse` status. Sending to these addresses severely damages sender reputation.

---

## Bulk Validation

**`POST /verify/bulk`**

```bash
curl -X POST https://api.turbo-smtp.com/api/v2/verify/bulk \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      "user1@example.com",
      "user2@example.com",
      "suspect@domain.org"
    ]
  }'
```

> See the [API Reference](../../api-reference/README.md) for polling bulk job status and retrieving results.

---

## Next Steps

- [Send validated addresses via transactional email](../transactional/README.md)
- [Automate validation with the List Hygiene Agent Skill](../../ai-integrations/agent-skills.md)
- [Full API Reference](../../api-reference/README.md)
