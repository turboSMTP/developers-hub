# Spec Overlays

OpenAPI [Overlay 1.0.0](https://spec.openapis.org/overlay/v1.0.0.html) documents applied to
`../upstream/turbo-smtp.yaml` **during SDK code generation only**.

This directory is empty by design. An overlay here is a temporary compensation for a specific
upstream defect, not a place to shape the API.

## The boundary

The canonical specification lives in `../../../turbo-smtp-openapi/` and is the single source of
truth for the wire contract. `../upstream/turbo-smtp.yaml` is a synced copy of it, and that copy is
what GitHub Pages publishes — **verbatim, with no overlay applied**. Overlays are read by
`sdks/scripts/generate.mjs` and affect generated SDK code only.

That separation is what makes overlays legitimate rather than a second source of truth. It only
holds while these rules hold:

1. **An overlay may only affect code generation** — `operationId`s, naming, `x-` extensions.
2. **An overlay may never alter wire semantics.** Not paths, methods, status codes, required-ness,
   types, formats, enum values, authentication or any part of a request or response payload. If the
   spec is wrong about what the API does, that is a backend or specification defect and is corrected
   upstream — never absorbed here.
3. **Every overlay names the upstream issue it compensates for**, in its `info.description`.
4. **Every overlay is deleted when that issue closes.** An overlay with no open issue is a bug.

A change that cannot be made under these rules does not belong in an overlay. Raise it upstream.

## Writing one

File name: `<short-slug>.yaml`. Applied in lexicographic order, so prefix with a number if ordering
ever matters.

```yaml
overlay: 1.0.0
info:
  title: <what this corrects>
  version: 1.0.0
  description: >-
    Compensates for <upstream issue URL or id>. Generation-only: no wire semantics
    are changed. Delete this file when that issue closes.
actions:
  - target: $.paths['/some/path'].get
    update:
      operationId: someOperationName
```

`target` is a JSONPath expression. Multi-match targets work, as does `remove: true`.

## Tooling

Applied by `openapi-format`, pinned — `@redocly/cli` has no Overlay support at any version this
project uses. It is pinned to an exact version and always run with `--no-sort`; `generate.mjs` is
the only thing that should invoke it.

## Verifying

Rules 1, 2 and 4 are enforced by the spec-drift guard, which CI runs on every change under
`api-reference/`:

```
node sdks/scripts/check-spec.mjs
```

It bundles the spec twice — once bare, once overlaid — and rejects any difference outside the
allowlist, so an overlay that touches a status code, a required field or a payload shape fails with
the exact JSON path. It also fails an overlay that changes *nothing*, because a target that no
longer matches means the defect it compensated for is silently back.

**Rule 3 is not machine-checkable.** Nothing can verify that the issue named in `info.description`
is real or still open. That one is on review.

## Background

See [`sdks/docs/adr/0013-openapi-overlays.md`](../../sdks/docs/adr/0013-openapi-overlays.md).
