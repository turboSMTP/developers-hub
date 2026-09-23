# Architecture Decision Records — TurboSMTP SDKs

This folder contains Architecture Decision Records (ADRs) for the TurboSMTP SDK suite.

An ADR captures the context, decision, and consequences of a significant architectural choice. Once accepted, an ADR is immutable — superseding decisions create a new record that references the old one.

### The one exception: `## Amendments`

Immutability protects the *reasoning*, not the file paths it happens to mention. When a record is
left citing a path that no longer exists, a reader cannot follow it and cannot tell whether the
decision still holds — so the record stops doing its job while remaining technically untouched.

An accepted ADR may therefore be corrected **only** for navigational facts — paths, file names,
links — and only under these rules:

1. **Nothing that carries meaning changes.** Not the decision, the rationale, the alternatives, the
   consequences, the dates, or any dated finding. If a decision itself needs revisiting, that is a
   new ADR.
2. **Every edit is disclosed** in an `## Amendments` section at the end of the record, dated, saying
   exactly what was re-pathed and stating that no decision was altered.
3. **The Status and Date fields are untouched.** The record is still Accepted, on its original date.

An ADR carrying amendments is marked *(amended)* in the index below.

## Format

Each ADR is a Markdown file named `NNNN-short-title.md` where `NNNN` is a zero-padded sequence number.

## Index

| # | Title | Applies to | Status | Date |
|---|---|---|---|---|
| [0001](0001-nodejs-dependency-injection-strategy.md) | Dependency Injection Strategy | Node.js SDK | Accepted | 2026-07-28 |
| [0002](0002-csharp-dependency-injection-strategy.md) | Dependency Injection Strategy | C# SDK | Accepted | 2026-07-28 |
| [0003](0003-sdk-repository-topology.md) | SDK Repository Topology — Monorepo Development, Mirrored Publishing | All SDKs | Accepted | 2026-08-05 |
| [0004](0004-build-toolchain-version-policy.md) | Build Toolchain Version Policy | All SDKs | Accepted | 2026-08-05 |
| [0005](0005-sdk-program-authority.md) | SDK Program Authority — `developers-hub/sdks/` Is the Decision Record | SDK program | Accepted | 2026-08-11 |
| [0006](0006-legacy-official-sdk-consolidation.md) | Legacy Official SDK Consolidation — Deprecate `turboSMTP-{csharp,php,python}` | C# / PHP / Python | Accepted *(amended)* | 2026-08-11 |
| [0007](0007-sdk-packaging-granularity.md) | SDK Packaging Granularity — One Unified Package Per Language | All SDKs | Accepted | 2026-08-14 |
| [0008](0008-python-transport-injection-strategy.md) | Transport Injection Strategy | Python SDK | Accepted | 2026-08-14 |
| [0009](0009-webhook-receiver-package.md) | Webhook Receiver Package — `@turbosmtp/webhook`, Mirrored Like Any Other Unit | All SDKs | Accepted *(amended)* | 2026-08-20 |
| [0010](0010-lint-and-format-floor.md) | Lint and Format Floor — Biome, Repository-Scoped, Pinned Exactly | `sdks/` JS/TS | Accepted | 2026-08-21 |
| [0011](0011-sdks-ci-gate.md) | CI for `sdks/` — What the Merge Gate Covers | `sdks/` | Accepted | 2026-08-21 |
| [0012](0012-client-side-validation-boundary.md) | Client-Side Validation Boundary — Guard What the SDK Transforms | All SDKs | Accepted | 2026-08-21 |
| [0013](0013-openapi-overlays.md) | OpenAPI Overlays for Generation-Only Spec Patching | Spec → Layer 1 pipeline | Accepted | 2026-09-20 |
| [0014](0014-turbosmtp-js-supersession.md) | `turboSMTP-js` Is Superseded — Node Stays Unified | Node SDK / npm scope | Accepted | 2026-09-23 |
