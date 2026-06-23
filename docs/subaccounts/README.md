# Subaccounts

Manage client accounts under your own — create subaccounts, set their sending quotas, activate or deactivate them, log in on their behalf, and brand the experience with your agency identity.

> **Plan requirement:** subaccount endpoints are an **agency-plan feature**. Without an eligible plan they return `403` with `{"message": "feature_not_available_for_active_plan"}`.
>
> **Authentication:** all endpoints on this page accept either auth method — `Authorization: $TURBO_API_KEY` or the `consumerKey`/`consumerSecret` header pair. See [Getting Started](../getting-started/README.md).

---

## List Subaccounts

**`GET /subaccounts/list`**

```bash
curl -G https://pro.api.serversmtp.com/api/v2/subaccounts/list \
  -H "Authorization: $TURBO_API_KEY" \
  --data-urlencode "page=1" \
  --data-urlencode "limit=10" \
  --data-urlencode "filter_by_active=true"
```

### Query Parameters

| Parameter | Description |
|---|---|
| `page` / `limit` | Paging (defaults `1` / `10`) |
| `filter_by_email` | Full or partial email match |
| `filter_by_active` | `true` / `false` |
| `filter_by_ip[]` | One or more sending IPv4 addresses (repeat the parameter) |
| `order_by` | `email` (default) or `last_used` |
| `ordertype` | `asc` or `desc` |

### Response

```json
{
  "count": 2,
  "results": [
    {
      "active": true,
      "email": "subaccount-1@yourdomain.om",
      "subaccount_id": 19302132,
      "ip": "199.244.75.250",
      "last_used": "2022-11-20 22:44:07",
      "limit": 16,
      "plan_expiration": "2023-01-17 00:00:00",
      "sent": 2,
      "plan_limit_interval": "Monthly"
    }
  ]
}
```

`limit` is the allowed send volume per `plan_limit_interval` (`Daily`, `Monthly`, or `Yearly` — always following the main account's interval); `sent` is usage in the current period; `-1` means unlimited.

[Try it in the API reference →](../../api-docs/index.html#/subaccounts/getSubaccounts)

---

## Create a Subaccount

Before creating, you can check whether an email address is already taken anywhere on TurboSMTP with **`GET /subaccounts/email-exists?Email=<address>`** — returns `{"result": true}` if it exists (note the capitalized `Email` parameter).

**`POST /subaccounts`**

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/subaccounts \
  -H "Authorization: $TURBO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@clientdomain.com",
    "first_name": "Andrea",
    "last_name": "Willems",
    "password": "LetmeIn123!",
    "confirm_password": "LetmeIn123!",
    "ip": "185.228.36.19",
    "policy_agree": true,
    "company_name": "Refreshing Soda Inc."
  }'
```

Returns `201` with the full subaccount object including its `subaccount_id` and `parent_id`.

| Field | Required | Notes |
|---|---|---|
| `email` | Yes | Must not already exist on TurboSMTP |
| `first_name` / `last_name` | Yes | 1–50 characters |
| `password` / `confirm_password` | Yes | ≥10 chars, at least one uppercase character, one lowercase character, and one digit |
| `ip` | Yes | Sending IP — **must be an IPv4 address already associated with your (parent) account**, else `400` `ip_not_associated_to_user_account` |
| `policy_agree` | Yes | Must be `true` |
| `address_1`, `address_2`, `city`, `region`, `country`, `zip_code`, `phone_number`, `company_name`, `site_url` | No | Owner/agency details |

> **Building the address form?** Use the public country/state lookups in [Account → Reference Data](../account/README.md#reference-data) to populate `country` and `region`.

[Try it in the API reference →](../../api-docs/index.html#/subaccounts/createSubaccount)

---

## Get and Update Details

- **`GET /subaccounts/{Id}`** — full subaccount object. Unknown IDs return `404` with `subaccount_not_found` (as do all `{Id}` endpoints on this page).
- **`PATCH /subaccounts/{Id}`** — update the same fields as creation (email excluded); `first_name`, `last_name`, `ip`, and `policy_agree` are required in the body, and the same password/IP validations apply when those fields are sent.

[Try it in the API reference →](../../api-docs/index.html#/subaccounts/getSubaccountDetails)

---

## Quotas and Status

### Sending limit

**`POST /subaccounts/{Id}/updatesubaccountsmtplimit`**

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/subaccounts/19302132/updatesubaccountsmtplimit \
  -H "Authorization: $TURBO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit": 2000}'
```

`limit` is the number of emails per the plan's interval. **`-1` means no limit.** It cannot exceed your parent account's limit (`400` `limit_should_not_be_higher_than_parent_account_limit`) or be lower than `-1`.

### Active status

**`POST /subaccounts/{Id}/updatesubaccountstatus`** with `{"active": true|false}`. Users cannot log in to an inactive subaccount; note that sending also requires the subaccount's subscription to be active.

### Current plan

**`GET /subaccounts/{Id}/active-plan`** — the subaccount's limit, usage (`sent`), `plan_expiration`, `plan_limit_interval`, and `expired` flag.

[Try it in the API reference →](../../api-docs/index.html#/subaccounts/UpdateSubaccountSMTPLimit)

---

## Log In as a Subaccount

**`POST /subaccounts/authorize`** — obtain an API key that acts as the subaccount, for support or management tasks:

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/subaccounts/authorize \
  -H "Authorization: $TURBO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "client@clientdomain.com"}'
```

```json
{
  "auth": "f8efa7be4e7457c463e8b800e1f11f92072d272c"
}
```

Use the returned `auth` value as the `Authorization` header — subsequent calls operate in the subaccount's context, exactly like a key from [`POST /authorize`](../getting-started/README.md#get-an-api-key).

[Try it in the API reference →](../../api-docs/index.html#/subaccounts/SubaccountAuthenticationLogin)

---

## Agency Branding

### Logo

| Endpoint | Action |
|---|---|
| `GET /subaccounts/logo` | Returns `{"logoUrl": "..."}` |
| `POST /subaccounts/logo` | Multipart upload (`file`) — **PNG or JPEG only** (`400` `file_type_should_be_png_or_jpeg`) |
| `DELETE /subaccounts/logo` | Removes the logo (`404` `logo_not_found` if none) |

```bash
curl -X POST https://pro.api.serversmtp.com/api/v2/subaccounts/logo \
  -H "Authorization: $TURBO_API_KEY" \
  -F "file=@agency-logo.png"
```

### Agency details

**`GET /subaccounts/agency`** / **`PATCH /subaccounts/agency`** — agency identity shown to subaccounts:

| Field | Max length |
|---|---|
| `agency_name` | 128 |
| `agency_website` | 128 |
| `agency_footer` | 2048 |

```bash
curl -X PATCH https://pro.api.serversmtp.com/api/v2/subaccounts/agency \
  -H "Authorization: $TURBO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agency_name": "My Agency Inc.",
    "agency_website": "https://www.mywebsite.com",
    "agency_footer": "My signature goes here."
  }'
```

[Try it in the API reference →](../../api-docs/index.html#/subaccounts/getAgencySettings)

---

## Known Limitation: No Delete Endpoint

The API currently provides **no endpoint to delete a subaccount**. Deactivate it instead (`POST /subaccounts/{Id}/updatesubaccountstatus` with `{"active": false}`) and set its limit to `0` if you need to fully retire it. A delete capability is tracked for a future API release.

---

## Next Steps

- [Account management (consumer keys, alerts)](../account/README.md)
- [Getting started with authentication](../getting-started/README.md)
- [Full API reference](../../api-docs/index.html#/subaccounts/getSubaccounts)
