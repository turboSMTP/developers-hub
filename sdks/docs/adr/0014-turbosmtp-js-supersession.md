# ADR-0014: `turboSMTP-js` Is Superseded — Node Stays Unified

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-09-23 |
| **Applies to** | The `turboSMTP-js` project and its two npm packages; [ADR-0007](0007-sdk-packaging-granularity.md) flip trigger 4; [ADR-0009](0009-webhook-receiver-package.md) decision 4; the Node SDK's first publish |

---

## Context

Two packages are live on npm under the organisation's scope, published within ten seconds of each
other on 2026-08-05 from `turboSMTP/turboSMTP-js`:

| Package | Version | Deprecated | Downloads (last year) |
|---|---|---|---|
| `@turbosmtp/mail` | 0.1.0, the only version | no | 204 |
| `@turbosmtp/webhook` | 0.1.0, the only version | no | 173 |

`@turbosmtp/sdk` is unregistered. The `turboSMTP-js` repository is public, not archived, has had no
push since 2026-08-05, and describes itself as *"Official TypeScript/JavaScript SDK for TurboSMTP."*
Its maintainers are members of this team, so this is a coordination question between two internal
efforts, not a question of registry access.

**Three things make this need a decision rather than a cleanup.**

**1. The packaging shape is already decided, and `@turbosmtp/mail` contradicts it.**
[ADR-0007](0007-sdk-packaging-granularity.md) settled one unified package per language with domains
as namespaces, and prohibits per-domain packages outright. A package that is only `mail` is the shape
that decision exists to prevent.

**2. ADR-0007 anticipated exactly this fork.** Flip trigger 4 reads:

> *"The organisation **sanctions `turboSMTP-js`** as the Node SDK — in which case **Node alone**
> diverges to domain packages and the other four stay unified."*

So the decision is not "may we tidy up npm." It is whether that trigger fires. If it does, the Node
package is re-split and ADR-0007 is reopened for one language. If it does not, `turboSMTP-js` is
superseded and the unified shape holds across all five.

**3. ADR-0009 rests on a decision that does not exist.** Its decision 4 states that
`@turbosmtp/webhook@0.1.0` *"is part of the legacy set being deprecated under ADR-0006."*
[ADR-0006](0006-legacy-official-sdk-consolidation.md) is titled *Deprecate
`turboSMTP-{csharp,php,python}`*, is scoped in its header to those three repositories, and says in
terms: *"Go and Node are unaffected."* No accepted decision covers these packages.

The gap is upstream of all three: **the project's own inventory of what exists does not mention
`turboSMTP-js` at all.** It lists the legacy C#, PHP and Python repositories as to-be-superseded, but
not the JS one. An inventory that claims completeness and omits two published packages is how
ADR-0009 came to cite a deprecation that does not cover it, with nothing to catch the error.

---

## Decision

**1. `turboSMTP-js` is superseded by the Node SDK in `developers-hub`. ADR-0007 flip trigger 4 does
not fire.** Node stays unified: `@turbosmtp/sdk` with domains as namespaces, plus the
`@turbosmtp/webhook` carve-out ADR-0009 established. No language diverges to domain packages.

**2. `@turbosmtp/mail` is deprecated in full and is not replaced by a compatibility shim.**

```
npm deprecate @turbosmtp/mail@"*" \
  "Superseded by @turbosmtp/sdk. Sending is client.mail.send(). See github.com/turboSMTP/developers-hub"
```

The deprecation is the migration vehicle. npm surfaces it on every install, and the name stays
reserved. Republishing `@turbosmtp/mail` as a thin re-export of `@turbosmtp/sdk` is **rejected**:
it would keep a per-domain package alive to tidy up the removal of per-domain packages, violating
the rule this record is enforcing.

**3. `@turbosmtp/webhook@0.1.0` is deprecated at that version, and `0.2.0` is confirmed as the first
version published from this repository.**

```
npm deprecate @turbosmtp/webhook@0.1.0 \
  "From the retired turboSMTP-js project. 0.2.0+ is a different implementation and is not a drop-in upgrade. See github.com/turboSMTP/developers-hub"
```

ADR-0009 chose `0.2.0` because `0.1.1` would imply a continuity that does not exist. `0.2.0` carries
some of that implication too, and `1.0.0` was considered as the honest discontinuity signal. It is
rejected: `1.0.0` asserts a stability commitment the program is not ready to make while
`@turbosmtp/sdk` is at `0.1.0` and four languages are unbuilt. The `0.y.z` range already means
"anything may change", and the discontinuity is stated explicitly in the deprecation message above —
which people read, unlike a version number.

**4. This record supersedes ADR-0009 decision 4's citation of ADR-0006.** The conclusion of that
decision — publish at `0.2.0` — stands unchanged and is reaffirmed above on its own reasoning: npm
never frees a published version number, whoever owns it. Only the clause placing the package under
ADR-0006's deprecation is withdrawn, because ADR-0006 excludes Node. ADR-0009 is not edited;
per `README.md`, a decision is corrected by a new record, not in place.

**5. The repository is retitled, then archived.** It claims official status that no inventory of
this program records, and nothing may be described as official beyond what is recorded. Order
matters: **retitle first** — an archived repository is read-only.

**6. The project's inventory records `turboSMTP-js` and both packages.** That inventory asserts its
own completeness; until it names them, every statement derived from it is unsound.

---

## Consequences

### Positive

- The one-unified-package rule holds across all five languages, on a decision rather than by the
  absence of a challenge to it. ADR-0007's trigger was designed to be answered, and this answers it.
- `@turbosmtp/sdk` publishes into a scope with one official sending package, not two.
- The `@turbosmtp/webhook` lineage change becomes visible at the point of use rather than inferable
  from a version number.
- ADR-0009 stops resting on a citation that does not support it, without its text being rewritten.
- The inventory becomes true, closing the gap that let the miscitation through.

### Negative / Constraints

- **`@turbosmtp/mail`'s name is spent.** Deprecation does not free it, and unpublishing is closed
  after 72 hours and would reserve it anyway. If a `mail`-named package is ever wanted, it is
  unavailable.
- **204 and 173 downloads a year are small but not zero.** The figures are consistent with registry
  crawlers rather than dependants, but that is inference, not evidence. Any real consumer migrates
  by hand, guided only by the deprecation text — which is why the wording above is part of the
  decision rather than left to whoever runs the command.
- **Two `0.1.0`s under one scope now mean different things.** `@turbosmtp/webhook@0.1.0` is retired
  while `@turbosmtp/sdk@0.1.0` will be current. The deprecation message is the only thing
  distinguishing them at a glance.
- **Archiving is effectively one-way** in practice, even though GitHub permits unarchiving.
- This record does **not** authorize publishing. That remains blocked until publish CI exists, and
  no `NPM_TOKEN` is configured.

---

## Alternatives considered

**Sanction `turboSMTP-js` — let flip trigger 4 fire.** Rejected on the evidence. It has one version,
no push in seven weeks, no stars, and no semantic layer, conformance suite, CI or decision record
behind it. The `developers-hub` SDK has all four. Firing the trigger would also re-split the Node
package and reopen ADR-0007 for one language — a large cost to preserve the weaker artifact.

**Publish both and leave it.** Rejected: two official Node SDKs with overlapping purpose contradicts
ADR-0007 and ADR-0005 at once, and pushes the choice onto consumers, who have least context.

**Deprecate quietly, without an ADR.** Rejected. ADR-0005 makes this repository the decision record;
a supersession that exists only as an npm flag is exactly the undocumented decision that produced
this situation.

**Extend ADR-0006 to cover Node.** Rejected: it is Accepted, its scope is stated in its header, and
amending a decision in place is prohibited. A new record is the mechanism.

**Rename the new webhook package to sidestep the collision.** Rejected: `@turbosmtp/webhook` is the
established publish target and [ADR-0009](0009-webhook-receiver-package.md) deliberately kept it.
Renaming would reverse its decision 2 for no benefit.

---

## References

- [ADR-0005](0005-sdk-program-authority.md) — `developers-hub/sdks/` is the decision record
- [ADR-0006](0006-legacy-official-sdk-consolidation.md) — the C#/PHP/Python consolidation this record does *not* extend
- [ADR-0007](0007-sdk-packaging-granularity.md) — one unified package per language; flip trigger 4
- [ADR-0009](0009-webhook-receiver-package.md) — the webhook carve-out and the `0.2.0` choice; decision 4's citation is superseded here
- `turboSMTP/turboSMTP-js` — the superseded project
- Registry and repository state verified 2026-09-23
