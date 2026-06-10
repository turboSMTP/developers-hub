# Suppressions

A suppression is an address TurboSMTP will not deliver to — because it bounced, complained, unsubscribed, failed validation, or was blocked manually. Suppressions protect your sender reputation; this API lets you query, import, export, and delete them.

> **Authentication:** all endpoints on this page accept either auth method — `Authorization: $TURBO_API_KEY` or the `consumerKey`/`consumerSecret` header pair. See [Getting Started](../getting-started/README.md).

---

## Suppression Records

Each suppression has these fields:

| Field | Description |
|---|---|
| `date` | When the suppression was recorded, `YYYY-MM-DD HH:MM:SS` |
| `recipient` | The suppressed email address |
| `sender` | Sender of the message that triggered the suppression (may be `null`) |
| `source` | How the address was suppressed (see below) |
| `subject` | Subject of the triggering message (empty for manual entries) |
| `reason` | Detail string, e.g. an SMTP error (may be `null`) |

### Sources

| `source` | Meaning |
|---|---|
| `manual` | Added by you, via dashboard, import, or API |
| `bounce` | Delivery permanently failed (hard bounce) |
| `spam` | Recipient reported the message as spam |
| `unsubscribe` | Recipient unsubscribed |
| `validation_failed` | Address failed [email validation](../validation/README.md) |

---

## Query Suppressions

**`GET /suppressions`**

```bash
curl -G https://pro.api.serversmtp.com/api/v2/suppressions \
  -H "Authorization: $TURBO_API_KEY" \
  --data-urlencode "from=2026-01-01" \
  --data-urlencode "to=2026-01-31" \
  --data-urlencode "filter_by=bounce" \
  --data-urlencode "limit=10" \
  --data-urlencode "page=1"
```

### Query Parameters

| Parameter | Required | Description |
|---|---|---|
| `from` | Yes | Start date, format `yyyy-mm-dd` |
| `to` | Yes | End date, format `yyyy-mm-dd` |
| `page` | No | Page number (default `1`) |
| `limit` | No | Rows per page (default `10`) |
| `filter` | No | Text to search across recipient, sender, subject, and reason |
| `filter_by` | No | Restrict to one or more **sources** (`manual`, `bounce`, `spam`, `unsubscribe`, `validation_failed`) |
| `smart_search` | No | `true`/`false` (default `false`) |
| `orderby` | No | Sort field: `date` (default), `source`, `recipient`, `reason` |
| `ordertype` | No | `asc` or `desc` (default `desc`) |
| `tz` | No | Timezone offset, e.g. `-07:00` |

> **Careful:** `filter_by` here selects suppression **sources**. On the [Analytics](../analytics/README.md) endpoint the same parameter name selects which *fields* the text filter applies to — they are not interchangeable.

### Response

```json
{
  "count": 5,
  "results": [
    {
      "date": "2021-03-17 00:00:00",
      "sender": "andrea@emailchef.com",
      "source": "bounce",
      "subject": "Newsletter - September 2022",
      "recipient": "bounce1@turbo-smtp.com",
      "reason": "550 Error"
    },
    {
      "date": "2021-03-15 00:00:00",
      "sender": "alberto@emailchef.com",
      "source": "manual",
      "subject": "",
      "recipient": "bounce2@turbo-smtp.com",
      "reason": "manual inserted"
    }
  ]
}
```

[Try it in the API reference →](../../api-docs/index.html#/suppressions/getSuppressions)

### Advanced Filtering via POST

**`POST /suppressions`** accepts the same filters as a JSON body, plus a `restrict` array that GET does not support. Each restriction targets one field with an include/exclude match:

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/suppressions \
  -H "Authorization: $TURBO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "2026-01-01",
    "to": "2026-01-31",
    "filter_by": ["bounce"],
    "page": 1,
    "limit": 10,
    "restrict": [
      { "by": "recipient", "operator": "exclude", "filter": "@internal.example.com" }
    ]
  }'
```

| `restrict[].field` | Values |
|---|---|
| `by` | `sender`, `recipient`, `reason`, `subject` |
| `operator` | `include`, `exclude` |
| `filter` | Text to match |
| `smart_search` | `true`/`false` |

[Try it in the API reference →](../../api-docs/index.html#/suppressions/filterSuppressions)

---

## Add Suppressions

**`POST /suppressions/import`** — two request formats:

**JSON** (`type: "manual"`) for a list of addresses:

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/suppressions/import \
  -H "Authorization: $TURBO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "manual",
    "reason": "unsubscribe requests from support tickets",
    "content": ["user1@example.com", "user2@example.com"]
  }'
```

**Multipart** (`type: "file"`) for a CSV or TXT file:

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/suppressions/import \
  -H "Authorization: $TURBO_API_KEY" \
  -F "type=file" \
  -F "reason=imported removal requests" \
  -F "file=@suppressions.csv"
```

Response — addresses are partitioned into accepted and rejected:

```json
{
  "status": "success",
  "valid": ["valid.email.1@gmail.com", "valid.email.2@gmail.com"],
  "invalid": ["invalid@email"]
}
```

`400` errors: `missing_upload_file`, `invalid_mail_address_list`.

[Try it in the API reference →](../../api-docs/index.html#/suppressions/importSuppressions)

---

## Delete Suppressions

> **Deleting a suppression means TurboSMTP will deliver to that address again.** Only remove entries you are certain were suppressed in error — re-sending to bounced or complaining addresses damages your sender reputation.

### By Address List

**`POST /suppressions/bulk_delete`** — the request body is a **bare JSON array** of email addresses:

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/suppressions/bulk_delete \
  -H "Authorization: $TURBO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '["user1@example.com", "user2@example.com"]'
```

Response: `{"success": true}`. Sending an empty list returns `400` with `no_contacts_were_provided`.

[Try it in the API reference →](../../api-docs/index.html#/suppressions/bulkDeleteSuppressions)

### By Filter

**`POST /suppressions/delete`** — deletes **every suppression matching the filter**. Accepts the same body as `POST /suppressions` (without paging/ordering): `from`/`to` (required), `tz`, `filter`, `filter_by`, `smart_search`, `restrict`.

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/suppressions/delete \
  -H "Authorization: $TURBO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "2026-01-01",
    "to": "2026-01-31",
    "filter_by": ["manual"],
    "filter": "imported removal request"
  }'
```

> **Destructive operation.** A broad date range with no `filter`/`filter_by` deletes *all* suppressions in that range — bounces and spam complaints included. Run the identical body against `POST /suppressions` first to preview exactly what will be removed.

[Try it in the API reference →](../../api-docs/index.html#/suppressions/deleteFilterSuppressions)

---

## Export to CSV

**`GET /suppressions/csv`** — same query parameters as `GET /suppressions` (no paging), returns `text/csv` with columns `Status;Subject;From;To;Date;Reason`:

```bash
curl -G https://pro.api.serversmtp.com/api/v2/suppressions/csv \
  -H "Authorization: $TURBO_API_KEY" \
  --data-urlencode "from=2026-01-01" \
  --data-urlencode "to=2026-01-31" \
  -o suppressions-january.csv
```

**`POST /suppressions/csv`** — the same export driven by a JSON filter body (including `restrict`), for when GET query strings aren't expressive enough.

[Try it in the API reference →](../../api-docs/index.html#/suppressions/exportSuppressionsDataCSV)

---

## Next Steps

- [Validate addresses before sending to avoid bounces](../validation/README.md)
- [Monitor bounce events in Analytics](../analytics/README.md)
- [React to bounces in real time with webhooks](../webhooks/README.md)
