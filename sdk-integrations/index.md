# SDK Registry

Official and community-maintained client libraries for the TurboSMTP API.

---

## Official SDKs

> **Status, 2026-08-11.** No TurboSMTP SDK is published to a package registry yet. The table below
> reports actual availability — earlier revisions of this page listed install commands for packages
> that do not exist. Planned package names are fixed in
> [`semantic-layer.md`](semantic-layer.md) but are not installable until each SDK ships.

| Language | Package | Status | Install | Guide |
|---|---|---|---|---|
| Node.js / TypeScript | mail | Built, publish pending | *not yet published* — planned as `@turbosmtp/mail` | [packages/node-mail](packages/node-mail/README.md) |
| Node.js / TypeScript | unified | Not started | *not yet published* — planned as `@turbosmtp/sdk` | — |
| Node.js webhook receiver | — | Built, publish pending | *not yet published* — planned as `@turbosmtp/webhook` | [webhooks/node-webhook](webhooks/node-webhook/README.md) |
| Python | mail | Planned | *not yet published* | — |
| Python | unified | Planned | *not yet published* | — |
| C# | mail | Planned | *not yet published* — planned as `TurboSMTP.Mail` (NuGet) | — |
| C# | unified | Planned | *not yet published* — planned as `TurboSMTP` (NuGet) | — |
| Go | mail | Planned | *not yet published* — planned as `github.com/turbosmtp/turbosmtp-go-mail` | — |
| Go | unified | Planned | *not yet published* — planned as `github.com/turbosmtp/turbosmtp-go` | — |
| PHP | mail | Planned | *not yet published* — planned as `turbosmtp/turbosmtp-mail` | — |
| PHP | unified | Planned | *not yet published* — planned as `turbosmtp/turbosmtp-client` | — |

A language gets a guide when each of its packages is built: a guide is that package's own README,
which is also what ships to the registry. The surface every one of them must present is fixed in
[`semantic-layer.md`](semantic-layer.md).

The Go module path is **lower-case**. Go module paths are case-sensitive while GitHub URLs are not,
so `go get github.com/turboSMTP/…` against a lower-case `go.mod` fails with *"module declares its
path as X but was required as Y"*.

### Superseded SDKs

Three repositories previously carried the official label. None was ever published to a package
registry, and all three are superseded by the SDKs described above. They are deprecated per language as
each replacement ships, so they remain readable until then.

| Repository | Language | Note |
|---|---|---|
| [turboSMTP-csharp](https://github.com/turboSMTP/turboSMTP-csharp) | C# | Most complete of the three; source-only, never on NuGet |
| [turboSMTP-php](https://github.com/turboSMTP/turboSMTP-php) | PHP | Source-only, never on Packagist |
| [turboSMTP-python](https://github.com/turboSMTP/turboSMTP-python) | Python | Generator output only, no client layer |

---

## SDK Design Philosophy

All official TurboSMTP SDKs expose the same **client surface** — a `TurboSMTPClient` whose API
domains are reached as namespaces (`client.mail`, `client.validation`, …). That surface arrives in
two packages per language, split where the API itself splits: a **mail package** for sending, and a
**unified package** carrying every other domain. Most integrations only send, so most only need the
mail package. The two are independent — neither contains the other — so a project needing both
installs both and constructs a client from each. Webhook receiving ships separately again, because
the receiver runs in the process that accepts callbacks rather than the one that sends mail. The
surface every SDK must satisfy is fixed in [`semantic-layer.md`](semantic-layer.md).

Minimal instantiation, as shipped in the Node.js mail package:

```typescript
import { TurboSMTPClient } from '@turbosmtp/mail';

const client = new TurboSMTPClient({
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
});

const { messageId } = await client.mail.send({
  from: 'you@yourdomain.com',
  to: ['recipient@example.com'],
  subject: 'Hello from TurboSMTP',
  text: 'Sent with the TurboSMTP Node.js SDK.',
});
```

Authentication is a `consumerKey`/`consumerSecret` pair, not a single API key, and the SDK attaches
both headers for you — identically in both API packages, which take the same constructor options.
Namespaces ship in priority order — `mail` first, `validation` next — so `client.validation` is not
yet available in any SDK, and no unified package has been built.

SDKs are built in three layers: a transport client generated from the
[OpenAPI 3.1 specification](../api-integrations/README.md) by `openapi-generator-cli` (pinned in
[`openapitools.json`](openapitools.json)), a **hand-written facade** that provides the surface the
semantic layer defines, and the conformance tests. No custom generator templates are used —
ergonomics live in the facade, not in the generated layer. See
[`semantic-layer.md`](semantic-layer.md).

---

## Community SDKs

Have you built a TurboSMTP client for a language not listed here? Open a [Feature Request](../.github/ISSUE_TEMPLATE/feature_request.md) to register it.

---

## All SDKs require the OpenAPI 3.1 spec as the source of truth

If you find a discrepancy between an SDK's behavior and the spec, please open a [Bug Report](../.github/ISSUE_TEMPLATE/bug_report.md).
