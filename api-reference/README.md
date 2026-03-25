# API Reference

The TurboSMTP API is defined using the **OpenAPI 3.1 specification**, which serves as the single source of truth for all SDKs, documentation, and interactive references.

---

## Specification File

The OpenAPI 3.1 specification file will be located at:

```
api-reference/openapi.yaml
```

> The spec file will be committed here once the active API conformance testing phase is complete. This phase ensures total alignment between the documented specification and the runtime behavior of all TurboSMTP endpoints.

---

## Interactive Reference

Once the spec is committed, a Swagger UI interactive reference is automatically deployed to GitHub Pages via the [deploy-swagger-ui workflow](../.github/workflows/deploy-swagger-ui.yml).

This provides a live "Try It" playground for every endpoint without requiring any local setup.

---

## Specification Details

| Property | Value |
|---|---|
| Specification Version | OpenAPI 3.1 |
| Generator Toolchain | `openapi-generator-cli v7.18.0` |
| Security Scheme | Bearer Token (API Key / Consumer Key) |

---

## API Surface

| Sub-API | Base Path | Description |
|---|---|---|
| Mail | `/api/v2/mail` | Send transactional email |
| Analytics | `/api/v2/mail/stats` | Retrieve delivery metrics |
| Validation | `/api/v2/verify` | Real-time email verification |
| Webhooks | Dashboard configuration | Delivery and engagement event streams |

---

## Conformance Policy

All TurboSMTP backend behavior must conform to this specification. If you discover a discrepancy between the spec and a live endpoint response (e.g., a type mismatch such as a stringified boolean instead of a JSON boolean), please open a [Bug Report](../.github/ISSUE_TEMPLATE/bug_report.md).

Conformance is validated automatically on every commit via the [validate-openapi workflow](../.github/workflows/validate-openapi.yml).
