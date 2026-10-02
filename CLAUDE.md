# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project Overview

**TurboSMTP Developers Hub** — the public documentation portal for the TurboSMTP API, and the home of
the SDK packages built on it. **This repository serves no website**: the API reference is published
from the read-only `turbosmtp-swagger-ui` mirror, so there is no Pages workflow here and no site to
build. The SDK packages under `sdk-integrations/` are the exception to "it's all Markdown" — they
build, lint and test like any code.

## Authoritative rules: the internal context pack

The **context pack** in the sibling repository `developers-hub-internal` is the authoritative source
for this project's standards, architecture, tooling and process. **Where this file and the pack
disagree, the pack wins.**

Start at the pack's index — it states its own routing rules, lists everything the pack governs, and
is the only place that list is maintained. This file does not restate it.

What is here instead: the handful of things the pack does not cover, and the rules about how *you*
work in this repository.

## API Documentation Sync

`api-integrations/` mirrors `../turbo-smtp-openapi/turbo-api-2/`, which serves a **single pre-bundled**
`turbo-smtp.yaml` — there is no `Domains/` folder in the served copies.

> **The spec and the UI assets sync to different places.** The spec goes to
> `api-integrations/upstream/`; the Swagger UI assets go to `api-integrations/swagger-ui/`. A blanket
> recursive copy of `turbo-api-2/*` into `swagger-ui/` would drop a second `turbo-smtp.yaml` there —
> which nothing reads, nothing validates, and which `assemble.mjs` would then publish alongside the
> real one. Copy the two separately.

When the served spec or the UI assets change upstream:

1. `npx @redocly/cli@2.47.0 lint ../turbo-smtp-openapi/turbo-api-2/turbo-smtp.yaml`
2. `Copy-Item -Path "../turbo-smtp-openapi/turbo-api-2/turbo-smtp.yaml" -Destination "./api-integrations/upstream/" -Force`
3. `Copy-Item -Path "../turbo-smtp-openapi/turbo-api-2/*" -Exclude "turbo-smtp.yaml" -Destination "./api-integrations/swagger-ui/" -Recurse -Force` — **nothing else is excluded**; `swagger-ui/` is byte-identical to what `turbo-api-2` ships, `swagger-initializer.js` included. Afterwards check for a stale `Domains/` folder or a stray `turbo-smtp.yaml`.
4. `node sdk-integrations/scripts/check-spec.mjs --write-checksum`
5. `node sdk-integrations/scripts/check-spec.mjs`
6. `node api-integrations/assemble.mjs --out ../.site-check`, then `npx --yes http-server ../.site-check -p 8080 -d false`, and open `http://127.0.0.1:8080/` to confirm the page loads.
7. Stage and commit — per **Workflow Rules**, you do not run this step.

The rules governing each step — when the checksum may be re-recorded, why the page is verified
against the assembled tree, why the versions are pinned — are in the pack.

## SDK Development (`sdk-integrations/`)

Every SDK standard is governed by the pack. One thing it does not carry:

- **Reference [`semantic-layer.md`](sdk-integrations/semantic-layer.md) at a high level only** — never
  by section number, and never from SDK source. That document is deliberately unnumbered and may be
  reorganised at any time, so a citation into it is a reference that silently goes stale.

## Documentation Standards

API examples must align with the OpenAPI spec in `../turbo-smtp-openapi/` — for every operation the
spec carries. **`api-integrations/docs/webhooks.md` is the exception:** the Event Webhook payload
appears in no specification, so that page derives from nothing and is never reconciled against the
spec. Do not "correct" it toward the spec; there is nothing there to correct it to.

## Workflow Rules

- **Never commit or push** unless the user explicitly asks for it. The user stages and commits.
