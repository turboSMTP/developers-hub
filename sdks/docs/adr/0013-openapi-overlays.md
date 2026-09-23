# ADR-0013: OpenAPI Overlays for Generation-Only Spec Patching

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-09-20 |
| **Applies to** | `api-reference/overlays/`, `sdks/scripts/generate.mjs`, and every generated Layer 1 |

---

## Context

The canonical specification lives in `turbo-smtp-openapi/` on self-hosted git and is the single
source of truth for the wire contract. `api-reference/upstream/turbo-smtp.yaml` is a synced copy of
it, and GitHub Pages publishes that copy verbatim.

That arrangement is deliberate and it is load-bearing. The project's standards state it in three
separate places: a mismatch between the spec and live behaviour is *"a backend defect to be corrected
upstream"*, *"raised as a specification correction upstream, not absorbed into the SDK"*, and
contributors are told not to *"invent or document a second source-of-truth"*. The only appearance of
the word "patch" in a spec context is an **Invalid** example.

Scaling from one Node SDK to five languages puts pressure on this. Generated code quality depends on
spec details that are correct as a wire contract but poor as a code-generation input — most visibly
`operationId`s, which become method names in every language at once. Nine orphaned `operationId`s are
already known. Fixing each upstream is right, but upstream changes are not free and not fast, and
five SDKs are blocked on each one. The tempting shortcut is to hand-edit the synced copy, which the
rules above correctly forbid: it would make `api-reference/` a second source of truth, and because
Pages serves that directory, the edit would also change what the world is told the API does.

The question is therefore not "may we patch the spec" — it is whether a form of patching exists that
does not create a second source of truth.

---

## Decision

**1. Adopt OpenAPI Overlay 1.0.0 documents, in `api-reference/overlays/`, applied only during code
generation.** `generate.mjs` applies them as step 0, before bundling. Nothing else reads them.

**2. Pages continues to serve `api-reference/upstream/` verbatim.** No overlay is ever applied to the
published spec. This is what makes the rest of this decision sound: the document describing the wire
contract to the outside world remains the untouched synced copy, so no second source of truth is
created. An overlay is a build-time transform of a code-generation input — the same category as the
existing tag filter, which nobody considers a competing spec.

**3. An overlay may only affect code generation.** `operationId`s, naming, and `x-` extensions.

**4. An overlay may never alter wire semantics.** Not paths, methods, status codes, required-ness,
types, formats, enum values, authentication, or any part of a request or response payload. A change
that cannot be expressed under rule 3 is a spec or backend defect, and the existing rule applies
unchanged: correct it upstream.

**5. Every overlay names the upstream issue it compensates for, and is deleted when that issue
closes.** An overlay with no open issue is a bug, not an asset. Overlays are expected to be
short-lived and the directory is expected to be empty most of the time.

**6. The overlay applier is pinned like every other pipeline tool.** `openapi-format`, at an exact
version, invoked with `--no-sort`.

---

## Consequences

The three constraints quoted in Context are amended to carry this boundary rather than being
overridden: a generation-only overlay is now an explicitly permitted mechanism, and absorbing a
behavioural mismatch into the SDK remains prohibited. The prohibition people actually rely on — that
you cannot quietly make the published spec disagree with upstream — is strengthened, because there is
now a sanctioned place to put generation fixes and therefore no motive to hand-edit the synced copy.

The cost is a second tool in the pipeline. `@redocly/cli@2.47.0` cannot apply overlays: it has no
`overlay` command, and an `overlays:` key is rejected at config root and under `apis.<name>` alike —
after which `bundle` **silently emits the unmodified document**. That failure mode argues for the
pin rather than against the tool: a floating applier that silently stopped applying would produce a
regenerated Layer 1 that looks plausible and is wrong. `openapi-format` was chosen over `bump-cli`
for being MIT-licensed, lighter, and file-in/file-out; both were verified against an Overlay 1.0.0
fixture covering `update`, `remove`, and multi-match JSONPath targets. The applier's own `--no-sort`
flag is mandatory: it reorders keys by default, which would rewrite the entire bundle and hide the
overlay's real effect.

Layer 1 becomes a function of the spec *and* the overlay set, so an overlay's removal changes
generated code exactly as a spec change would. This is the intended behaviour — it is what makes rule
5 safe to act on — but it means overlays are covered by the existing rule that Layer 1 is regenerated,
never hand-edited, and that the semantic layer is amended before an SDK changes.

With no overlays present the step is skipped entirely and the pipeline is byte-for-byte what it was,
so adopting this ADR changes no generated output on the day it lands.

The risk this carries is that rules 3–5 erode: an overlay that quietly fixes a behavioural mismatch
would recreate exactly the second source of truth this ADR claims to avoid, and it would do so
invisibly, because the published spec would still look correct. Phase 5 of the layout refactor adds
a CI assertion that every overlay parses and changes no wire semantics. Until that lands, rules 3–5
are enforced by review.

---

## Alternatives considered

**Hand-edit the synced copy.** Rejected — creates a second source of truth, and because Pages serves
that directory it would also misrepresent the API publicly.

**Fix everything upstream and wait.** Rejected as the *sole* mechanism, not as a principle. It
remains the required path for anything touching wire semantics. For generation-only defects it blocks
five SDKs on an unrelated release cadence, and the pressure that creates is what produces hand-edits.

**Post-process the generated code.** Rejected — moves the patch even further from the spec, has to be
reimplemented per language, and breaks the property that Layer 1 is purely derived.

**Configure the generator instead.** Rejected as insufficient. `openapitools.json` and the per-language
configs cannot rename an individual operation or annotate a single schema; they configure the
generator, not the document.

---

## References

- `api-reference/overlays/README.md` — the operational rules and how to write one
- [OpenAPI Overlay Specification 1.0.0](https://spec.openapis.org/overlay/v1.0.0.html)
- ADR-0003 (SDK repository topology) — the decision this one sits alongside
- ADR-0004 (build toolchain version policy) — why the applier is pinned exactly
