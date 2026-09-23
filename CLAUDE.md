# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project Overview

**TurboSMTP Developers Hub** — the public-facing documentation portal for the TurboSMTP API, and the
home of the SDK packages built on it. Content is authored in Markdown and published via GitHub
Pages; CI validates and deploys it automatically on push to `main`. The SDK packages under `sdks/`
are the exception — they build, lint and test like any code.

## Authoritative rules: the internal context pack

The **context pack** in the sibling repository `developers-hub-internal` is the authoritative source
for this project's standards, architecture, tooling and process.

- **Where this file and the pack disagree, the pack wins.** This file carries only what the pack does
  not cover, plus the orientation needed to work without it.
- **Start at the pack's index and follow its routing**, then open only the one or two files it names.
  Do not load the whole pack. The index is the complete list of what the pack governs — this file
  deliberately does not duplicate it, so it cannot fall out of step.
- The pack's `system/` subdirectory is harness-owned — do not route into it.
- The internal repository is **private**. A contributor without access should work from this file and
  [`CONTRIBUTING.md`](CONTRIBUTING.md) alone; nothing here requires the pack to be readable.

The pack is where to look for the exact validation commands and their order, the approved stack and
pinned tool versions, where a component lives and how the spec derives into packages, SDK layering
and the semantic layer's authority, and the CI workflow rules — including what is deliberately not
automated.

## Repository Structure

Orientation only — the pack carries the full map.

- **`docs/`** — topic guides (getting-started, transactional, validation, webhooks)
- **`api-reference/`** — the pre-bundled OpenAPI 3.1 spec (`upstream/turbo-smtp.yaml`), the generation-only `overlays/`, plus a self-contained Swagger UI bundle, deployed to GitHub Pages
- **`sdks/`** — SDK strategy docs, generator config, the generation and spec-guard scripts, and the source per unit: `packages/` for the unified SDKs, `webhooks/` for the receivers (ADR-0009)
- **`ai-integrations/`** — MCP Server and Agent Skills documentation
- **`.github/`** — `workflows/` (every automation entry point), `actions/` (first-party composite actions — reusable steps, never entry points), and PR/issue templates

## Relationship to `turbo-smtp-openapi/`

The canonical **OpenAPI v2 specification** lives in the sibling repository `../turbo-smtp-openapi/`
and is the source of truth. `api-reference/upstream/turbo-smtp.yaml` here is a synced copy: make spec
changes upstream and re-sync. The rules governing the synced copy, the bundled build input and
generated Layer 1 are in the pack.

`api-reference/overlays/` does **not** create a second source of truth. Overlays are applied only
while generating SDK code; GitHub Pages serves `upstream/` verbatim. An overlay may change
operationIds, naming and `x-` extensions — never wire semantics — and is deleted when the upstream
issue it compensates for closes. See `api-reference/overlays/README.md` and ADR-0013.

## API Documentation Sync

The `api-reference/` folder mirrors `../turbo-smtp-openapi/turbo-api-2/`, which serves a **single
pre-bundled** `turbo-smtp.yaml` — there is no `Domains/` folder in the served copies. Serving one
file with only internal `$ref`s lets Swagger UI load in a single request instead of ~10, which is the
main render-speed win.

> **The spec and the UI assets sync to different places.** The spec lives in
> `api-reference/upstream/`; the Swagger UI assets live at `api-reference/` root. A blanket recursive
> copy of `turbo-api-2/*` into `api-reference/` would drop a second `turbo-smtp.yaml` at the root —
> which nothing reads, nothing validates, and which then drifts silently. Copy the two separately.

Whenever the served spec or the Swagger UI assets are updated upstream, sync the changes here:

1. Verify the bundled spec is valid: `npx @redocly/cli@<pinned> lint ../turbo-smtp-openapi/turbo-api-2/turbo-smtp.yaml` — the pinned version is in the pack; do not float it.
2. Copy the spec: `Copy-Item -Path "../turbo-smtp-openapi/turbo-api-2/turbo-smtp.yaml" -Destination "./api-reference/upstream/" -Force`
3. Copy the UI assets: `Copy-Item -Path "../turbo-smtp-openapi/turbo-api-2/*" -Exclude "turbo-smtp.yaml" -Destination "./api-reference/" -Recurse -Force` (ensure `api-reference/` has no stale `Domains/` folder and no stray root `turbo-smtp.yaml`)
4. **Re-record the checksum: `node sdks/scripts/check-spec.mjs --write-checksum`** — the spec-drift guard fails CI until this matches, which is the point: it separates a sync from a hand-edit.
5. Run the guard: `node sdks/scripts/check-spec.mjs`
6. Confirm the page still loads — the spec URL in `swagger-initializer.js` is resolved by the browser, so a wrong path 404s the live site while CI stays green: `npx --yes http-server api-reference -p 8080`
7. Stage and commit the result: `git add api-reference/` then a `sync: update API docs from turbo-api-2` commit — per **Workflow Rules** below, the user runs this step.

> Step 4 is only ever run as part of a sync. Re-recording the checksum to silence a failing
> guard, without having re-synced, defeats the one thing it detects.

## SDK Development (`sdks/`)

Every SDK standard — layering, public surface, coding conventions, tooling versions, commands and CI
— is governed by the context pack. Start at its index and follow the routing. The pack also carries
the rule that **the semantic layer is amended before an SDK changes, never after**.

In-repo material the pack does not replace:

- [`sdks/plan.md`](sdks/plan.md) — strategy narrative: the 3-layer architecture and rollout tiers
- [`sdks/pipeline.md`](sdks/pipeline.md) — operational flow from canonical spec to registries and mirrors
- [`sdks/docs/adr/`](sdks/docs/adr/) — Architecture Decision Records
- [`sdks/index.md`](sdks/index.md) — per-language SDK status and planned package names

> `sdks/client-contract.md` and `sdks/TASKS.md` are **historical record**: superseded by the context
> pack and being retired. Do not cite them as authority.

**Two gotchas worth keeping in view:**

- The generator's default `skipFormModel=true` drops multipart upload request models — verify
  multipart explicitly when configuring the validation, suppressions and subaccount domains.
- Never invoke `openapi-generator-cli` without `--openapitools`. Its implicit config lookup does not
  honour `cwd` reliably; left to itself it silently re-pins to the latest release and writes a fresh
  `openapitools.json` at the repository root. `generate.mjs` passes the flag — use the script.

## Documentation Standards

- All content is Markdown. Follow the existing folder structure under `docs/`.
- Code examples must be tested and use realistic values (no placeholder tokens in final form).
- API examples must align with the OpenAPI spec in `../turbo-smtp-openapi/`.
- Adhere to the PR template in `.github/pull_request_template.md`.

## Workflow Rules

- **Never commit or push** unless the user explicitly asks for it.
- **Branch naming:** Use `fix/<description>` for bug corrections, `feat/<description>` for new content additions.
- **PR process:** All changes go through a pull request against `main`. Use the GitHub PR template.
