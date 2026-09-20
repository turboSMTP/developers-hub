# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project Overview

**TurboSMTP Developers Hub** — the public-facing documentation portal for the TurboSMTP API, and the
home of the SDK packages built on it. Content is authored in Markdown and published via GitHub
Pages; CI validates and deploys it automatically on push to `main`. The SDK packages under `sdks/`
are the exception — they build, lint and test like any code.

## Authoritative rules: the internal context pack

The **context pack** in the sibling repository `developers-hub-internal` is the authoritative source
for this project's standards, architecture, tooling and process:

    ../developers-hub-internal/context-pack/context-pack-index.md

- **Where this file and the pack disagree, the pack wins.** This file carries only what the pack does
  not cover, plus the orientation needed to work without it.
- **Read `context-pack-index.md` first**, then open only the one or two files its routing table or a
  matching scenario names. Do not load the whole pack.
- `context-pack/system/` is harness-owned — do not route into it.
- The internal repository is **private**. A contributor without access should work from this file and
  [`CONTRIBUTING.md`](CONTRIBUTING.md) alone.

Common routings — the index is the complete list:

| Looking for | Pack file |
|---|---|
| The exact lint / typecheck / build / test / generate / spec-lint command, and the order they run in | `validation-tools.md` |
| Approved stack, pinned tool versions, runtime floors, adding a dependency | `tech-policy.md` |
| Where a component lives, the spec→package derivation chain, branch and tag conventions | `codebase-map.md` |
| SDK layering, public surface, error taxonomy, the semantic layer's authority | `arch-standards.md` |
| GitHub Actions workflow rules, CI gates, and what is deliberately *not* automated | `automation-standards.md` |

## Repository Structure

Orientation only — the full map is `codebase-map.md` in the pack.

- **`docs/`** — topic guides (getting-started, transactional, validation, webhooks)
- **`api-reference/`** — the pre-bundled OpenAPI 3.1 spec (`turbo-smtp.yaml`) plus a self-contained Swagger UI bundle, deployed to GitHub Pages
- **`sdks/`** — SDK strategy docs, generator config, and the generated + facade source per language
- **`ai-integrations/`** — MCP Server and Agent Skills documentation
- **`.github/`** — GitHub Actions workflows and PR/issue templates

## Relationship to `turbo-smtp-openapi/`

The canonical **OpenAPI v2 specification** lives in the sibling repository `../turbo-smtp-openapi/`
and is the source of truth. `api-reference/turbo-smtp.yaml` here is a synced copy: make spec changes
upstream and re-sync. The rules governing the synced copy, the bundled build input and generated
Layer 1 are in the pack (`constraints.md`, `codebase-map.md`).

## API Documentation Sync

The `api-reference/` folder mirrors `../turbo-smtp-openapi/turbo-api-2/`, which serves a **single
pre-bundled** `turbo-smtp.yaml` — there is no `Domains/` folder in the served copies. Serving one
file with only internal `$ref`s lets Swagger UI load in a single request instead of ~10, which is the
main render-speed win.

Whenever the served spec or the Swagger UI assets are updated upstream, sync the changes here:

1. Verify the bundled spec is valid: `npx @redocly/cli@<pinned> lint ../turbo-smtp-openapi/turbo-api-2/turbo-smtp.yaml` — the pinned version is in `tech-policy.md`; do not float it.
2. Copy updated files: `Copy-Item -Path "../turbo-smtp-openapi/turbo-api-2/*" -Destination "./api-reference/" -Recurse -Force` (ensure `api-reference/` has no stale `Domains/` folder)
3. Stage and commit the result: `git add api-reference/` then a `sync: update API docs from turbo-api-2` commit — per **Workflow Rules** below, the user runs this step.

## SDK Development (`sdks/`)

Every SDK standard — layering, public surface, coding conventions, tooling versions, commands and CI
— is governed by the context pack. Start at `context-pack-index.md`; for design work the entry point
is `arch-standards.md`, which also carries the rule that **the semantic layer is amended before an
SDK changes, never after**.

In-repo material the pack does not replace:

- [`sdks/plan.md`](sdks/plan.md) — strategy narrative: the 3-layer architecture and rollout tiers
- [`sdks/pipeline.md`](sdks/pipeline.md) — operational flow from canonical spec to registries and mirrors
- [`sdks/docs/adr/`](sdks/docs/adr/) — Architecture Decision Records
- [`sdks/index.md`](sdks/index.md) — per-language SDK status and planned package names

> `sdks/client-contract.md` and `sdks/TASKS.md` are **historical record**: superseded by the context
> pack and being retired. Do not cite them as authority.

**Gotcha worth keeping in view:** the generator's default `skipFormModel=true` drops multipart upload
request models — verify multipart explicitly when configuring the validation, suppressions and
subaccount domains.

## Documentation Standards

- All content is Markdown. Follow the existing folder structure under `docs/`.
- Code examples must be tested and use realistic values (no placeholder tokens in final form).
- API examples must align with the OpenAPI spec in `../turbo-smtp-openapi/`.
- Adhere to the PR template in `.github/pull_request_template.md`.

## Workflow Rules

- **Never commit or push** unless the user explicitly asks for it.
- **Branch naming:** Use `fix/<description>` for bug corrections, `feat/<description>` for new content additions.
- **PR process:** All changes go through a pull request against `main`. Use the GitHub PR template.
