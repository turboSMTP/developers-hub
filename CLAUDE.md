# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project Overview

**TurboSMTP Developers Hub** — the public-facing documentation portal for the TurboSMTP API.

Content is authored in Markdown and published via GitHub Pages. This is a docs-as-code repository: there is no build step required locally; CI validates and deploys automatically on push to `main`.

## Repository Structure

- **`docs/`** — Topic guides (getting-started, transactional, validation, webhooks)
- **`api-reference/`** — OpenAPI 3.1 spec and generated reference docs
- **`sdks/`** — SDK integration guides per language (Node.js, Python, Go, PHP, C#)
- **`ai-integrations/`** — MCP Server and Agent Skills documentation
- **`.github/`** — GitHub Actions workflows and PR/issue templates
  - `workflows/validate-openapi.yml` — Lints OpenAPI spec on push
  - `workflows/deploy-swagger-ui.yml` — Deploys to GitHub Pages

## Relationship to `turbo-smtp-openapi/`

The canonical **OpenAPI v2 specification** lives in the sibling repository `../turbo-smtp-openapi/`.

When the spec stabilizes, it will be promoted to `api-reference/turbo-smtp.yaml` here. Until then:
- Do not copy or manually duplicate spec content from `turbo-smtp-openapi/`
- Reference the sibling repo as the source of truth
- If spec examples are needed in the docs, link to the spec in the sibling repo or fetch it programmatically

## API Documentation Sync

The `api-docs/` folder contains a Swagger UI deployment that mirrors `../turbo-smtp-openapi/turbo-api-2/`.

Whenever the OpenAPI spec or Swagger UI assets are updated in `turbo-api-2/`, sync the changes to `api-docs/`:

1. Verify the spec is valid: `npx @redocly/cli lint ../turbo-smtp-openapi/turbo-api-2/turbo-smtp.yaml`
2. Copy updated files: `Copy-Item -Path "../turbo-smtp-openapi/turbo-api-2/*" -Destination "./api-docs/" -Recurse -Force`
3. Commit and push: `git add api-docs/; git commit -m "sync: update API docs from turbo-api-2"`

## Documentation Standards

- All content is Markdown. Follow the existing folder structure under `docs/`.
- Code examples must be tested and use realistic values (no placeholder tokens in final form).
- API examples must align with the OpenAPI spec in `../turbo-smtp-openapi/`.
- Adhere to the PR template in `.github/pull_request_template.md`.

## Workflow Rules

- **Never commit or push** unless the user explicitly asks for it.
- **Branch naming:** Use `fix/<description>` for bug corrections, `feat/<description>` for new content additions.
- **PR process:** All changes go through a pull request against `main`. Use the GitHub PR template.
