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

### Create

**`POST /user/consumerKeys`** — body `{"label": "..."}`; returns `201` with the `consumerKey` and the one-time-visible `consumerSecret`. Full example in [Getting Started](../getting-started/README.md#create-a-consumer-key).

### Delete

**`DELETE /user/consumerKeys/{consumerKey}`**

```bash
curl -X DELETE https://pro.api.serversmtp.com/api/v2/user/consumerKeys/bff5c9436b6da9fe3c1d3379e7dc0f21 \
  -H "Authorization: $TURBO_API_KEY"
```

Returns `{"message": "success"}`. An unknown key returns `404` with `{"message": "key_not_found"}`. Deletion is immediate — any integration using the key stops authenticating.

[Try it in the API reference →](../../api-docs/index.html#/consumerkey/listConsumerKeys)

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

**`GET /forgot-password?token=<token>`** — returns `{"message": "success"}` if valid, `403` with `token_is_invalid` otherwise. Unlike the other two steps, this check requires authentication (`Authorization` header).

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
  -H "Authorization: $TURBO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "alert@example.com", "percentage": 80}'
```

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

**`POST /billing/buy_emailvalidation_credits`**

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/billing/buy_emailvalidation_credits \
  -H "Authorization: $TURBO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 320}'
```

`amount` is an **integer amount of money** in your account currency, between **15 and 1800**. The response is not an instant charge — it returns a URL to the billing system where you complete the payment:

```json
{
  "url": "https://bs.serversmtp.com/index.php/guest/payment_information/form/..."
}
```

`400` errors: `missing_required_parameter_amount`, `amount_should_be_integer`, `amount_should_not_be_less_than_15`, `amount_should_not_be_higher_than_1800`, `can_not_buy_extra_credit_without_active_plan` (an active plan is required).

See [Email Validation](../validation/README.md#credits) for how credits are consumed.

[Try it in the API reference →](../../api-docs/index.html#/billing/buyEmailValidatorCredits)

---

## Reference Data

Country and state lookups, useful for building address forms (e.g. when creating [subaccounts](../subaccounts/README.md)). Both endpoints are **public** — no authentication required.

**`GET /meta/countries`** — all countries:

```json
[
  { "iso_code": "US", "currency": "USD", "flag": "🇺🇸", "name": "United States", "phonecode": "1" }
]
```

**`GET /meta/state/{isoCode}`** — states/regions for a country ISO code:

```bash
curl https://pro.api.serversmtp.com/api/v2/meta/state/US
```

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
- [Full API reference](../../api-docs/index.html)
