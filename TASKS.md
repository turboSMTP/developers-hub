# TurboSMTP Developers Hub — Project Roadmap & Tasks

## Statuses
`DONE` `WIP` `PENDING` `PAUSED` `BLOCKED`

---

## Phase 1 — API Specification Foundation
> Non-negotiable prerequisite before SDK expansion and AI tooling.

| # | Task | Status | Weeks Effort | Notes |
|---|---|---|---|---|
| 1.1 | Complete Hurl test suite against all TurboSMTP endpoints | WIP | 1 | Covers drift mapping for all sub-systems |
| 1.2 | Complete Schemathesis test suite against all TurboSMTP endpoints | WIP | 2 | Covers schema conformance and edge case generation |
| 1.3 | Rectify all discovered backend vs. spec discrepancies (patch backend or update schema) | PENDING | 2 | Depends on 1.1–1.2; requires coordination with TS backend developers |
| 1.4 | Final clean regeneration of core API projects with `openapi-generator-cli v7.18.0` | PENDING | 1 | Depends on 1.3 |
| 1.5 | Commit finalized OpenAPI 3.1 spec to `api-reference/openapi.yaml` | PENDING | 0.5 | Depends on 1.4 |
| 1.6 | Manually deploy Swagger UI to GitHub Pages | PENDING | 1 | Executes out of sequence — depends on 1.5 and 2.5 (repo must be public); push static files to `gh-pages` branch and enable Pages in repo settings |

---

## Phase 2 — Documentation Content
> Write all documentation in plain Markdown first; platform integration comes later.

| # | Task | Status | Weeks Effort | Notes |
|---|---|---|---|---|
| 2.1 | Write full `getting-started` documentation | PENDING | 0.5 | Scaffold exists |
| 2.2 | Write full `transactional` documentation | PENDING | 0.5 | Scaffold exists |
| 2.3 | Write full `validation` documentation | PENDING | 0.5 | Scaffold exists |
| 2.4 | Write full `webhooks` documentation | PENDING | 0.5 | Scaffold exists |
| 2.5 | Make repository public | PENDING | 0.5 | Gate: depends on 1.5, 2.1–2.4 |

---

## Phase 3 — SDK Modernization
> Two-layer architecture (API Transport + SDK Client) generated with AI, grounded by the finalized spec (SSD).

| # | Task | Status | Weeks Effort | Notes |
|---|---|---|---|---|
| **Existing SDKs — Conformance Track** |
| 3.1 | Resume C# SDK updates (conformance fixes) | PAUSED | 2 | Depends on 1.5 |
| 3.2 | Resume C# unit testing project | PAUSED | 1 | Depends on 3.1 |
| 3.3 | PHP SDK conformance review against finalized spec | PENDING | 3 | Existing stable SDK — check for drift; depends on 1.5 |
| 3.4 | Apply PHP SDK conformance fixes if needed | PENDING | 3 | Depends on 3.3 |
| 3.5 | PHP unit testing project | PENDING | 2 | Depends on 3.4 |
| **New SDKs — Design** |
| 3.6 | Define selective endpoint coverage for new SDKs | PENDING | | Decide which endpoints to expose across all languages; depends on 1.5 |
| 3.7 | Design language-agnostic SDK Client public API contract (`sdks/client-contract.md`) | PENDING | | User-friendly interface spec — grounds all SDK Client AI generation; depends on 3.6 |
| **Node.js / TypeScript SDK** |
| 3.8 | Generate API Transport — Node.js (AI, spec-driven) | PENDING | | Depends on 3.6 |
| 3.9 | Generate SDK Client — Node.js (AI-assisted, contract-driven) | PENDING | | Depends on 3.8, 3.7 |
| 3.10 | Generate unit test project — Node.js (AI-assisted) | PENDING | | Depends on 3.9 |
| 3.11 | Publish Node.js SDK to npm (`@turbosmtp/sdk`) | PENDING | | Depends on 3.10 |
| **Python SDK** |
| 3.12 | Generate API Transport — Python (AI, spec-driven) | PENDING | | Depends on 3.6 |
| 3.13 | Generate SDK Client — Python (AI-assisted, contract-driven) | PENDING | | Depends on 3.12, 3.7 |
| 3.14 | Generate unit test project — Python (AI-assisted) | PENDING | | Depends on 3.13 |
| 3.15 | Publish Python SDK to PyPI (`turbosmtp`) | PENDING | | Depends on 3.14 |
| **Go SDK** |
| 3.16 | Generate API Transport — Go (AI, spec-driven) | PENDING | | Depends on 3.6 |
| 3.17 | Generate SDK Client — Go (AI-assisted, contract-driven) | PENDING | | Depends on 3.16, 3.7 |
| 3.18 | Generate unit test project — Go (AI-assisted) | PENDING | | Depends on 3.17 |
| 3.19 | Publish Go SDK to pkg.go.dev | PENDING | | Depends on 3.18 |
| **Docs** |
| 3.20 | Update SDK docs for all new languages | PENDING | | Depends on 3.11, 3.15, 3.19 |

---

## Phase 4 — MCP Server
> AI-native tool integration via Model Context Protocol.

| # | Task | Status | Weeks Effort | Notes |
|---|---|---|---|---|
| 4.1 | Create `turboSMTP/mcp-server` repository with `.github` standards | PENDING | | Depends on 1.5 |
| 4.2 | Develop MCP Server core in TypeScript (`@modelcontextprotocol/sdk` + Zod) | PENDING | | Depends on 4.1 |
| 4.3 | Implement `send_transactional_email` tool with idempotency enforcement | PENDING | | Depends on 4.2 |
| 4.4 | Implement `fetch_delivery_metrics` tool | PENDING | | Depends on 4.2 |
| 4.5 | Implement `validate_contact_list` tool | PENDING | | Depends on 4.2 |
| 4.6 | Implement `audit_domain_authentication` tool | PENDING | | Depends on 4.2 |
| 4.7 | Implement `TURBOSMTP_READ_ONLY` mode (disables mutating tools) | PENDING | | Depends on 4.3–4.6 |
| 4.8 | Publish MCP Server package to npm | PENDING | | Depends on 4.7 |
| 4.9 | Update `ai-integrations/mcp-server.md` with real installation instructions | PENDING | | Depends on 4.8 |

---

## Phase 5 — Agent Skills Library
> Open-source SKILL.md packages embedding TurboSMTP expertise into AI agents.

| # | Task | Status | Weeks Effort | Notes |
|---|---|---|---|---|
| 5.1 | Create `turboSMTP/ai-agent-skills` public repository | PENDING | | |
| 5.2 | Develop `deliverability-diagnostics` skill | PENDING | | |
| 5.3 | Develop `list-hygiene` skill | PENDING | | |
| 5.4 | Update `ai-integrations/agent-skills.md` with real installation instructions | PENDING | | Scaffold exists |

---

## Phase 6 — Documentation Platform & Automation
> Deferred until content and manual processes are stable and proven.

| # | Task | Status | Weeks Effort | Notes |
|---|---|---|---|---|
| 6.1 | Evaluate and select documentation platform (Mintlify vs. ReadMe) | PENDING | | |
| 6.2 | Connect selected platform to GitHub repository via Git sync | PENDING | | Depends on 6.1 |
| 6.3 | Implement continuous validation CI pipeline (GitHub Actions on every spec commit) | PENDING | | Workflow stub already exists |
| 6.4 | Automate Swagger UI redeployment to GitHub Pages via GitHub Actions | PENDING | | Replaces manual deploy from 1.6; depends on 6.3; triggers on every spec commit |
