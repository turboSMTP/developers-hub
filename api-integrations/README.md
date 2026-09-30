# API Reference

The TurboSMTP API is defined using the **OpenAPI 3.1 specification**, which serves as the single source of truth for all SDKs, documentation, and interactive references.

This page is the narrative overview of the API surface. For the **interactive** reference, use the live Swagger UI below.

For step-by-step integration guides — authentication, sending, analytics, suppressions, validation and webhooks — see [`docs/`](docs/README.md).

---

## Interactive Reference

**Live Swagger UI:** [https://turbosmtp.github.io/turbosmtp-swagger-ui/](https://turbosmtp.github.io/turbosmtp-swagger-ui/)

A live "Try It" playground for every endpoint, with no local setup required.

**This repository does not serve it.** The site is published from
[`turboSMTP/turbosmtp-swagger-ui`](https://github.com/turboSMTP/turbosmtp-swagger-ui), a read-only
mirror assembled from the two halves below — the vendored UI in `swagger-ui/` and the synced spec in
`upstream/` — and force-pushed by the
[publish-api-reference workflow](../.github/workflows/publish-api-reference.yml) on every change.
Never commit to the mirror; it is regenerated on every publish.

---

## Specification Source

The spec is **authored** as a multi-file OpenAPI 3.1 document upstream, but what is **published** is a single pre-bundled file carrying internal `$ref`s only:

```
api-integrations/upstream/turbo-smtp.yaml   # the complete pre-bundled document, published verbatim
api-integrations/swagger-ui/                # the vendored Swagger UI, exactly as turbo-api-2 ships it
api-integrations/overlays/                  # generation-only patches — never published
api-integrations/docs/                      # human-facing topic guides — never published
api-integrations/assemble.mjs               # flattens the two into the publishable tree
```

Serving one file lets Swagger UI load it in a single request instead of roughly ten, which is the main render-speed win. There is no `Domains/` folder in this repository.

`upstream/` is synced from the canonical source in the sibling repository `../turbo-smtp-openapi/turbo-api-2/` and is **never hand-edited**. Validity is checked on every change via the [validate-openapi workflow](../.github/workflows/validate-openapi.yml), and an in-place edit is caught by the spec-drift guard, `sdk-integrations/scripts/check-spec.mjs`.

`overlays/` holds OpenAPI Overlay documents applied **only** while generating SDK code. They never touch the published spec and may never change wire semantics — see [`overlays/README.md`](overlays/README.md) for the rules.

`docs/` holds the topic guides. They are hand-authored — never generated, never synced — and are not published to the mirror. Note in particular that [`docs/webhooks.md`](docs/webhooks.md) defines the Event Webhook payload, which appears in **no** OpenAPI document: the upstream spec carries only an empty `callbacks: {}` stub. Nothing derives that page, so a spec sync must never overwrite it.

---

## Specification Details

| Property | Value |
|---|---|
| Specification Version | OpenAPI 3.1 |
| Generator Toolchain | `openapi-generator-cli v7.24.0` (pinned in `sdk-integrations/openapitools.json`) |
| Security Schemes | API Key (raw `Authorization` header) and Consumer Key/Secret header pair |

---

## API Surface

| Domain | Endpoints | Description |
|---|---|---|
| Authentication | `/authorize`, `/deauthorize`, `/change-password`, `/forgot-password` | API key lifecycle and password management |
| Mail | `/mail/send` | Send transactional email (dedicated host, consumer key auth) |
| Analytics | `/analytics`, `/analytics/{Id}`, `/analytics/csv` | Per-message delivery events |
| Suppressions | `/suppressions`, `/suppressions/import`, `/suppressions/csv`, … | Suppressed-address management |
| Email Validation | `/emailvalidation/validateEmail`, `/emailvalidation/lists/*`, … | Single and bulk address validation |
| Subaccounts | `/subaccounts/*` | Multi-tenant management (agency plans) |
| Alerts | `/tools/alerts` | Usage-threshold notifications |
| Consumer Keys | `/user/consumerKeys` | Permanent API credential management |
| Billing | `/billing/buy_emailvalidation_credits` | Validation credit purchase |
| Meta | `/meta/countries`, `/meta/state/{isoCode}` | Reference data |
| Webhooks | Dashboard configuration | Delivery and engagement event streams (not an API endpoint) |

---

## Conformance Policy

All TurboSMTP backend behavior must conform to this specification. If you discover a discrepancy between the spec and a live endpoint response (e.g., a type mismatch such as a stringified boolean instead of a JSON boolean), please open a [Bug Report](../.github/ISSUE_TEMPLATE/bug_report.md).

Conformance is validated automatically on every commit via the [validate-openapi workflow](../.github/workflows/validate-openapi.yml).
