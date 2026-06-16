# Email Validation

Verify email addresses before sending to protect your sender reputation and reduce bounce rates. Validate a single address in real time, or upload a list and validate it in bulk.

> **Authentication:** all endpoints on this page accept either auth method — `Authorization: $TURBO_API_KEY` or the `consumerKey`/`consumerSecret` header pair. See [Getting Started](../getting-started/README.md).

---

## Credits

The Email Validation feature uses its own **Email Validation Credits** — separate from the Email Sending Credits used for outbound mail. A free quota is included with every TurboSMTP plan; when that quota is exhausted, additional credits can be purchased. Check your balance with **`GET /emailvalidation/subscription`**:

```bash
curl https://pro.api.serversmtp.com/api/v2/emailvalidation/subscription \
  -H "consumerKey: $CONSUMER_KEY" \
  -H "consumerSecret: $CONSUMER_SECRET"
```

```json
{
  "currency": "$",
  "free_credits": 3000,
  "free_credits_used": 473,
  "remaining_free_credit": 2527,
  "paid_credits": 500.00,
  "latest_period_start_date": "2026-06-01 00:00:00",
  "period_expiration_date": "2026-07-01 00:00:00",
  "last_used_period": "2026-06-01 00:00:00"
}
```

The two credit types work differently:

- **Free credits** are measured in units — 1 credit validates 1 email — and renew each period (see `latest_period_start_date` / `period_expiration_date`).
- **`paid_credits`** is a monetary balance. As validations are performed the balance is deducted; the cost per validation is variable and depends on the amount of validated emails.

To top up, **`POST /billing/buy_emailvalidation_credits`** with `{"amount": <integer>}` (15–1800, currency-dependent; requires an active plan) returns a `url` to the billing system where you complete the payment — it is not an instant charge.

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/billing/buy_emailvalidation_credits \
  -H "consumerKey: $CONSUMER_KEY" \
  -H "consumerSecret: $CONSUMER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}'
```

Response:

```json
{
  "url": "https://billing.serversmtp.com/index.php/guest/payment_information/form/IUZXLEg3iWqRfhY5jdCHKGVO6a02ym8J"
}
```

Visit the returned `url` to complete payment in the billing system.

[Try it in the API reference →](../../api-docs/index.html#/email-validator/getEmailValidationSubscription)

---

## Validate a Single Address

**`POST /emailvalidation/validateEmail`** — real-time validation of one address (consumes 1 credit):

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/emailvalidation/validateEmail \
  -H "consumerKey: $CONSUMER_KEY" \
  -H "consumerSecret: $CONSUMER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email": "developer@yourcompany.com"}'
```

Response:

```json
{
  "email": "developer@yourcompany.com",
  "status": "valid",
  "sub_status": "",
  "free_email": false,
  "domain": "yourcompany.com",
  "domain_age_days": 9964,
  "smtp_provider": "google",
  "mx_found": true,
  "mx_record": "gmail-smtp-in.l.google.com",
  "did_you_mean": null,
  "account": "developer",
  "firstname": "Jhon",
  "lastname": "Doe",
  "gender": null,
  "country": null,
  "region": null,
  "city": null,
  "zipcode": null,
  "processed_at": "2021-03-17 00:00:00"
}
```

Useful fields beyond `status`/`sub_status`:

| Field | Description |
|---|---|
| `free_email` | `true` if the address is from a free provider (Gmail, etc.) |
| `domain_age_days` | Age of the domain in days, or `null` |
| `mx_found` / `mx_record` | Whether the domain has an MX record, and its preferred record |
| `smtp_provider` | Detected provider, or `null` |
| `did_you_mean` | Suggested fix for a probable typo, or `null` |

`400` errors: `invalid_email_address`, `missing_required_parameter_email`.

[Try it in the API reference →](../../api-docs/index.html#/email-validator/validateEmail)

---

## Validate a List (Bulk Workflow)

Bulk validation is asynchronous and list-based: upload a file, trigger validation, poll for progress, then fetch results.

### 1. Upload the file

**`POST /emailvalidation/upload`** — multipart upload of a CSV or TXT file of addresses:

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/emailvalidation/upload \
  -H "consumerKey: $CONSUMER_KEY" \
  -H "consumerSecret: $CONSUMER_SECRET" \
  -F "file=@prospects.csv"
```

Response (`201 Created`):

```json
{
  "list_id": 10093,
  "total_emails": 314
}
```

`400` errors: `missing_upload_file`, `invalid_mail_address_list`, `unsupported_file_format`.

### 2. Start validation

**`POST /emailvalidation/lists/{Id}/validate`** — this is the step that consumes credits:

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/emailvalidation/lists/10093/validate \
  -H "consumerKey: $CONSUMER_KEY" \
  -H "consumerSecret: $CONSUMER_SECRET"
```

`400` errors: `list_already_validated`, `insufficient_credit`.

### 3. Poll for progress

**`GET /emailvalidation/lists/{Id}`**:

```bash
curl https://pro.api.serversmtp.com/api/v2/emailvalidation/lists/10093 \
  -H "consumerKey: $CONSUMER_KEY" \
  -H "consumerSecret: $CONSUMER_SECRET"
```

```json
{
  "id": 10093,
  "creation_time": "2021-03-17 08:56:00",
  "file_name": "prospects.csv",
  "is_processed": false,
  "percentage": 83,
  "total_emails": 314,
  "total_processed": 260,
  "status_summary": [
    { "status": "valid", "total": 201 },
    { "status": "invalid", "total": 59 }
  ]
}
```

Poll until `is_processed` is `true` (`percentage` reaches 100). `GET /emailvalidation/lists` (with `page`, `limit`, `from`, `to`, `tz` parameters) lists all your validation lists.

### 4. Fetch results

**`GET /emailvalidation/lists/{Id}/emails`** — paged results (`page`, `limit`):

```json
{
  "count": 2,
  "processed": 2,
  "results": [
    {
      "email": "mail@thearter-gallery.eu",
      "id": 500157,
      "status": "do_not_mail",
      "sub_status": "",
      "free_email": false,
      "domain": "thearter-gallery.eu",
      "domain_age_days": null,
      "smtp_provider": null,
      "mx_found": true,
      "mx_record": "gmail-smtp-in.l.google.com"
    }
  ]
}
```

> Before validation completes, this endpoint returns `processed: 0` with an empty `results` array — not an error.

For one address's full record (including `did_you_mean` and `created_at`), use **`GET /emailvalidation/lists/{Id}/emails/{emailId}`** with the `id` from the results.

### 5. Export and clean up

- **`GET /emailvalidation/lists/{Id}/csv`** — download all results as `text/csv`.
- **`DELETE /emailvalidation/lists/{Id}`** — delete the list when you're done; returns `{"success": true}`.

Unknown list IDs return `404` with `{"message": "list_not_found"}` on all list endpoints.

[Try it in the API reference →](../../api-docs/index.html#/email-validator/uploadEmailValidationFile)

---

## Validation Statuses

Every validated address gets a `status` and, where applicable, a `sub_status`.

| `status` | Meaning | Recommended action |
|---|---|---|
| `valid` | Deliverable — expected bounce rate under 2% | Safe to send |
| `invalid` | Address does not exist or cannot receive mail | Remove from your list |
| `catch_all` | Domain accepts all addresses; deliverability unverifiable | Segment separately; expect some bounces |
| `unknown` | Could not be validated (server down, anti-spam blocking, …) | Treat with caution — roughly 80% of unknowns are bad addresses |
| `spamtrap` | Believed to be a spam trap | **Never send** |
| `abuse` | Owner is known to mark mail as spam | Do not send |
| `do_not_mail` | Valid address you generally shouldn't mail (see sub-statuses) | Decide per sub-category |

### `do_not_mail` Sub-Statuses

| `sub_status` | Meaning |
|---|---|
| `disposable` | Temporary/throwaway address (lifespan from 15 minutes to ~6 months) |
| `toxic` | Known abuse, spam, or bot-created address |
| `role_based` | Position or group address (`sales@`, `info@`, `contact@`) — strongly correlated with spam complaints |
| `role_based_catch_all` | Role-based address on a catch-all domain |
| `global_suppression` | Found on popular global suppression lists (ISP complainers, litigators, purchased addresses) |
| `possible_trap` | Contains keywords correlated with spam traps (e.g. `spam@`) |

### Other Sub-Statuses

Sub-statuses also qualify `valid`, `invalid`, and `unknown` results — for example `alias_address` and `leading_period_removed` (valid), `mailbox_not_found`, `failed_syntax_check`, `possible_typo`, `no_dns_entries`, `mailbox_quota_exceeded`, `does_not_accept_mail`, `unroutable_ip_address` (invalid), and `antispam_system`, `greylisted`, `timeout_exceeded`, `failed_smtp_connection`, `forcible_disconnect`, `mail_server_did_not_respond`, `mail_server_temporary_error`, `exception_occurred` (unknown). `greylisted` addresses often validate successfully on a second pass. The full catalog with explanations is in the [API reference](../../api-docs/index.html#/email-validator/validateEmail).

---

## Recipe: Clean a List Before a Campaign

1. Upload and validate the list (steps 1–3 above).
2. Export the CSV or page through the results.
3. Keep `valid`; drop `invalid`, `spamtrap`, `abuse`, and `toxic`/`disposable`; segment `catch_all` and decide on `role_based` case by case.
4. Optionally add the rejects to your [suppression list](../suppressions/README.md) (`source` will be `manual`; addresses that failed validation during sending are suppressed automatically with source `validation_failed`).

---

## Next Steps

- [Add failed addresses to Suppressions](../suppressions/README.md)
- [Send to your cleaned list](../transactional/README.md)
- [Full API reference](../../api-docs/index.html#/email-validator/validateEmail)
