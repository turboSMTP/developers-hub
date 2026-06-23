# Account Management

Manage the credentials and settings of your TurboSMTP account: consumer keys, passwords, usage alerts, validation credit purchases, and reference data.

> **Authentication:** unless noted otherwise, endpoints accept either auth method — `Authorization: $TURBO_API_KEY` or the `consumerKey`/`consumerSecret` header pair. **Consumer key management and password changes are API-key-only** (see each section). See [Getting Started](../getting-started/README.md).

---

## Consumer Keys

Consumer keys are permanent API credentials — see [Getting Started](../getting-started/README.md#create-a-consumer-key) for why they're recommended in production.

> **API key required:** all three endpoints below accept only the `Authorization` header. Consumer key listing, creation, and deletion are not allowed when authenticated via consumer key.

### List

**`GET /user/consumerKeys`**

```bash
curl https://pro.api.serversmtp.com/api/v2/user/consumerKeys \
  -H "Authorization: $TURBO_API_KEY"
```

Response:

```json
{
  "count": 2,
  "results": [
    {
      "consumerKey": "bff5c9436b6da9fe3c1d3379e7dc0f21",
      "label": "QA",
      "creation_time": "2023-10-12 11:58:11"
    },
    {
      "consumerKey": "1027d089da21adfc7f08dc14303571f3",
      "label": "Staging",
      "creation_time": "2023-08-02 17:18:00"
    }
  ]
}
```

Each entry can also carry `ips` (IP addresses the key is restricted to — empty means no restriction), `permissions` (granted permissions), and `is_legacy`. The `consumerSecret` is **never** included — it is shown only once, at creation.

[Try it in the API reference →](../../api-docs/index.html#/consumerkey/listConsumerKeys)

### Create

**`POST /user/consumerKeys`**

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/user/consumerKeys \
  -H "Authorization: $TURBO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "production-backend"
  }'
```

Response (`201 Created`):

```json
{
  "consumerKey": "b914ad238d0e8e8851b81e86ce46ae1d",
  "consumerSecret": "JOSenWTYopGjhZ1CDvsEbcK9PNUA06Xy"
}
```

> **Store the secret now.** The `consumerSecret` is returned only at creation time — listing your consumer keys later returns the key, label, and metadata, but never the secret.

[Try it in the API reference →](../../api-docs/index.html#/consumerkey/createConsumerKey)

### Delete

**`DELETE /user/consumerKeys/{consumerKey}`**

```bash
curl -X DELETE https://pro.api.serversmtp.com/api/v2/user/consumerKeys/bff5c9436b6da9fe3c1d3379e7dc0f21 \
  -H "Authorization: $TURBO_API_KEY"
```

Response:

```json
{
  "message": "success"
}
```

An unknown key returns `404` with `{"message": "key_not_found"}`. Deletion is immediate — any integration using the key stops authenticating.

[Try it in the API reference →](../../api-docs/index.html#/consumerkey/deleteConsumerKey)

---

## Change Password

**`PUT /change-password`**

> **API key required:** calling this endpoint with consumer key headers returns `403` with `not_allowed_for_apikey`. Authenticate with the `Authorization` header.

```bash
curl -X PUT https://pro.api.serversmtp.com/api/v2/change-password \
  -H "Authorization: $TURBO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "6SwHbc96dyE8",
    "password": "SMkhhf4J686P",
    "confirm_password": "SMkhhf4J686P"
  }'
```

Response:

```json
{
  "message": "success"
}
```

Password rules:

- At least 10 characters
- At least one uppercase character
- At least one lowercase character
- At least one digit

Returns `{"message": "success"}`. A wrong `current_password` returns `403` with `password_is_invalid`. The `400` catalog covers each rule violation (`password_length_should_not_be_less_than_10_characters`, `password_should_contain_at_least_one_uppercase_character`, `password_should_contain_at_least_one_lowercase_character`, `password_should_contain_at_least_one_digit`, `password_should_equal_confirm_password`, `new_password_should_not_equal_current_password`, plus missing-field variants).

[Try it in the API reference →](../../api-docs/index.html#/authentication/ChangePassword)

---

## Forgot Password

A three-step, token-based reset flow. **Tokens are valid for 1 hour.**

### 1. Request a reset email

**`POST /forgot-password`** — no authentication required:

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "developer@yourdomain.com"}'
```

The email contains a **Reset Password** button and a secret token for the API flow. The endpoint returns success whether or not the address is registered, to prevent email enumeration.

### 2. (Optional) Check the token

**`GET /forgot-password?token=<token>`**

```bash
curl https://pro.api.serversmtp.com/api/v2/forgot-password?token=781d4b44aaf5de86dc0a7e1ca2dc409f \
  -H "Authorization: $TURBO_API_KEY"
```

Response:

```json
{
  "message": "success"
}
```

An invalid or expired token returns `403` with `token_is_invalid`. Unlike the other two steps, this check requires authentication (`Authorization` header).

### 3. Set the new password

**`PUT /forgot-password`** — no authentication required; same password rules as above:

```bash
curl -X PUT https://pro.api.serversmtp.com/api/v2/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "password": "SMBBBf4J686P",
    "confirm_password": "SMBBBf4J686P",
    "token": "781d4b44aaf5de86dc0a7e1ca2dc409f"
  }'
```

Response:

```json
{
  "message": "success"
}
```

An invalid or expired token returns `403` with `token_is_invalid`.

[Try it in the API reference →](../../api-docs/index.html#/authentication/SendSecretTokenResetPassword)

---

## Usage Alerts

Get an email notification when your plan usage crosses a threshold. Each alert is an `email` + `percentage` (0–100) pair.

| Endpoint | Action |
|---|---|
| `GET /tools/alerts` | List alerts (`{count, results}`) |
| `POST /tools/alerts` | Create — returns `201` with the new alert including its `id` |
| `GET /tools/alerts/{Id}` | Fetch one alert |
| `PATCH /tools/alerts/{Id}` | Update email and/or percentage |
| `DELETE /tools/alerts/{Id}` | Delete — returns `{"message": "success"}` |

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/tools/alerts \
  -H "consumerKey: $CONSUMER_KEY" \
  -H "consumerSecret: $CONSUMER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email": "alert@example.com", "percentage": 80}'
```

Response (`201 Created`):

```json
{
  "id": 4117,
  "email": "alert@example.com",
  "percentage": 80
}
```

`400` errors: `missing_required_parameter_email`, `missing_required_parameter_percentage`, `percentage_should_be_integer`, `percentage_should_not_be_less_than_0`, `percentage_should_not_be_higher_than_100`. An unknown `Id` returns `404` with `alert_not_found`.

[Try it in the API reference →](../../api-docs/index.html#/alerts/getAlerts)

---

## Buy Email Validation Credits

Top up Email Validation Credits with **`POST /billing/buy_emailvalidation_credits`**. Because credits are consumed by validation, this endpoint is documented in full — including the free-vs-paid credit model and error catalog — under [Email Validation → Credits](../validation/README.md#credits).

---

## Reference Data

Country and state lookups, useful for building address forms (e.g. when creating [subaccounts](../subaccounts/README.md)). Both endpoints are **public** — no authentication required.

**`GET /meta/countries`**

```bash
curl https://pro.api.serversmtp.com/api/v2/meta/countries
```

Response:

```json
[
  { "iso_code": "US", "currency": "USD", "flag": "🇺🇸", "name": "United States", "phonecode": "1" }
]
```

**`GET /meta/state/{isoCode}`** — states/regions for a country ISO code:

```bash
curl https://pro.api.serversmtp.com/api/v2/meta/state/US
```

Response:

```json
[
  { "name": "Alabama", "iso_code": "AL", "country_code": "US", "type": null }
]
```

An unknown ISO code returns `404` with `{"message": "invalid_iso_code"}`.

[Try it in the API reference →](../../api-docs/index.html#/meta/getCountries)

---

## Next Steps

- [Create and use consumer keys](../getting-started/README.md)
- [Manage subaccounts (agency plans)](../subaccounts/README.md)
- [Full API reference](../../api-docs/index.html#/)
