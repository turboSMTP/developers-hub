# SDK generator configs

Per-language [OpenAPI Generator](https://openapi-generator.tech) config files for **Layer 1**
(the generated transport + models core). Consumed by
[`../scripts/generate.mjs`](../scripts/generate.mjs) via `-c sdk-integrations/config/<lang>.yaml`. Generator
version is pinned in [`../openapitools.json`](../openapitools.json) (currently 7.24.0). See
[`../semantic-layer.md`](../semantic-layer.md).

## Generator flavor per language

| Language | Generator | Transport | Notes |
|---|---|---|---|
| Node/TS | `typescript-fetch` | native `fetch` | no axios dep; Node 18+ and browsers |
| Python | `python` | urllib3 | pydantic v2 models; async facade is a later addition (contract §3.1) |
| C# | `csharp` | `HttpClient` | `net8.0`; nullable reference types on |
| Go | `go` | net/http | nullable → `Nullable<T>` wrappers |
| PHP | `php` | Guzzle | |

All five were validated against the bundled 3.1 spec in the **1.3 spike** — no down-convert shim and
no Kiota fallback needed.

## Layer 1 / Layer 2 layout

These configs generate **Layer 1 only**, into an **internal namespace** so the hand-written Layer 2
facade can own the public entrypoint (`TurboSMTPClient`) within each published package:

| Language | Layer 1 (generated) namespace | Public facade surface |
|---|---|---|
| Node/TS | emitted to each package's `src/generated/` | `@turbosmtp/mail`, `@turbosmtp/sdk` |
| Python | `turbosmtp._generated` | `turbosmtp` |
| C# | `TurboSMTP.Generated` | `TurboSMTP` |
| Go | package `generated` | package `turbosmtp` (owns `go.mod`) |
| PHP | `TurboSMTP\Generated` | `TurboSMTP` |

A language ships **two API packages** — a mail package and a unified one — and both are generated
from the single config above. The config is domain-agnostic, so what distinguishes them is what the
script passes per run: the domain filter, the output directory, and the published package name
(`--additional-properties`, which overrides the config's default). There is deliberately no second
config file — a per-language config that named one package would stop being reusable across tiers,
which is the property the omissions below exist to preserve. The table's "public facade surface"
column names the unified package; each language's mail package is its counterpart, and both are
fixed in the semantic layer's naming map.

Package identity matches the registry names fixed in the semantic layer. Packaging/project files (package.json, pyproject, go.mod,
.csproj, composer.json) are owned by the facade, not the generated core — the script skips generated
project files (`generateSourceCodeOnly`/`withGoMod:false`/ignore rules) so regeneration never clobbers
the facade's packaging.

## What these configs deliberately omit

- **`inputSpec` / `outputDir`** — supplied per run by the 1.6 script, not baked here.
- **Domain filter** — kept out so each config is **domain-agnostic and reused across every tier**.
  Domain partitioning (P0 mail → P1 validation → …) is applied by the **script** per run. Approach:
  pre-filter the bundled spec to the target domain's tag(s) before generation (proven-clean models,
  since the spike showed full-spec generation resolves all `$ref`s). The exact filter mechanism
  (Redocly filter decorator vs the generator's `openapi-normalizer FILTER`) is chosen and validated
  for model-pruning in task 1.6.
- **`skipFormModel`** — left at the generator default (`true`) because **P0 Mail has no multipart**.
  This default drops multipart upload request models; **flip to `false` (or handle via operation
  params) when configuring P1 validation upload and P2 suppressions-import / subaccount-logo**
  (carried over from the 1.3 spike).

## Regenerating

Do not hand-edit generated Layer 1 code. Change the spec upstream in `turbo-smtp-openapi/`, re-sync
`api-integrations/upstream/turbo-smtp.yaml`, and re-run the generation script — it overlays, bundles,
filters and generates in one pass.

If the problem is the *generated code* rather than the API itself — an unusable `operationId`, say —
the fix is a generation-only overlay in `api-integrations/overlays/`, not an edit to the synced copy.
Overlays may never change wire semantics; see [`api-integrations/overlays/README.md`](../../api-integrations/overlays/README.md).
