# SDK generator configs

Per-language [OpenAPI Generator](https://openapi-generator.tech) config files for **Layer 1** (the
generated transport and models core). Consumed by
[`../scripts/generate.mjs`](../scripts/generate.mjs) via `-c sdk-integrations/config/<lang>.yaml`;
the generator version is pinned in [`../openapitools.json`](../openapitools.json).

## Generator flavor per language

| Language | Generator | Transport | Notes |
|---|---|---|---|
| Node/TS | `typescript-fetch` | native `fetch` | no axios dep; works in browsers |
| Python | `python` | urllib3 | pydantic v2 models; async facade is a later addition |
| C# | `csharp` | `HttpClient` | `net8.0`; nullable reference types on |
| Go | `go` | net/http | nullable → `Nullable<T>` wrappers |
| PHP | `php` | Guzzle | |

All were validated against the bundled 3.1 spec when the generators were selected — no
down-convert shim and no Kiota fallback needed.

## Generated namespace per language

Layer 1 is emitted into an internal namespace so the hand-written facade can own the public
entrypoint:

| Language | Layer 1 namespace |
|---|---|
| Node/TS | each package's `src/generated/` |
| Python | `turbosmtp._generated` |
| C# | `TurboSMTP.Generated` |
| Go | package `generated` |
| PHP | `TurboSMTP\Generated` |

## What these configs deliberately omit

A config is domain-agnostic and reused across every tier and every API package, so what varies per
run is passed by the script rather than baked in here.

- **`inputSpec` / `outputDir`** — supplied per run by the generation script.
- **Domain filter** — applied by the script, which pre-filters the bundled spec to the target
  domain's tag(s) using Redocly's `filter-in` decorator with `--remove-unused-components` to prune
  the components the filtered operations no longer reach. The generator's own
  `openapi-normalizer FILTER` was the alternative and is not used.
- **`skipFormModel`** — left at the generator default (`true`) because **P0 Mail has no multipart**.
  That default drops multipart upload request models; **flip it to `false`, or handle the fields as
  operation params, when configuring P1 validation upload and P2 suppressions-import and
  subaccount-logo.**
- **Package name** — overridden per run via `--additional-properties`. A config that named one
  package would stop being reusable across the mail and unified packages.
