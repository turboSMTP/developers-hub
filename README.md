# TurboSMTP Developers Hub

Welcome to the official TurboSMTP developer portal. This repository is the single source of truth for integrating with TurboSMTP's transactional email, email validation, and AI-native tooling.

---

## Navigate the Hub

| Section | Description |
|---|---|
| [API Reference](api-integrations/README.md) | OpenAPI 3.1 spec overview, the eight integration guides, and the [live interactive Swagger UI](https://turbosmtp.github.io/turbosmtp-swagger-ui/) |
| [SDKs](#sdks) | Official client libraries for all supported languages |
| [AI Integrations](ai-integrations/mcp-server.md) | MCP Server and Agent Skills — designed, not yet built |

---

## Quick Start

```bash
# Send your first email using curl
curl -X POST https://api.turbo-smtp.com/api/v2/mail/send \
  -H "consumerKey: $CONSUMER_KEY" \
  -H "consumerSecret: $CONSUMER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "you@yourdomain.com",
    "to": "recipient@example.com",
    "subject": "Hello from TurboSMTP",
    "content": "It works!",
    "html_content": "<h1>It works!</h1>"
  }'
```

See [Getting Started](api-integrations/docs/getting-started.md) for full authentication details.

---

## SDKs

Official client libraries for **Node.js/TypeScript, Python, C#, Go** and **PHP**, built on one
shared surface so that the same operation behaves the same way in every language. That surface is
defined in [`semantic-layer.md`](sdk-integrations/semantic-layer.md).

**Nothing from this programme is published yet.** Two packages are built and pending publication —
each is documented by its own README, which is also what will ship to the registry:

- [`@turbosmtp/mail`](sdk-integrations/packages/node-mail/README.md) — sending, Node.js/TypeScript
- [`@turbosmtp/webhook`](sdk-integrations/webhooks/node-webhook/README.md) — webhook receiver, Node.js/TypeScript

> **Installing either name today gets retired code.** `@turbosmtp/mail` and `@turbosmtp/webhook` are
> already live at `0.1.0` from `turboSMTP-js`, the superseded Node SDK that predates this programme.
> This programme continues both names starting at `0.2.0`, because npm never frees a published
> version number. `turboSMTP-js` and the `turboSMTP-csharp`, `turboSMTP-php` and `turboSMTP-python`
> repositories are all superseded; each is deprecated as its replacement ships.

---

## AI Integrations

Two AI integrations are designed but **not yet built** — nothing is available to install:

- **[MCP Server](ai-integrations/mcp-server.md)** — would let any MCP-compatible agent reach TurboSMTP without bespoke integration code.
- **[Agent Skills](ai-integrations/agent-skills.md)** — would package TurboSMTP deliverability expertise as SKILL.md files.

---

## Resources

- [API Reference](api-integrations/README.md) — narrative overview of the API surface
- [Interactive API Reference (Swagger UI)](https://turbosmtp.github.io/turbosmtp-swagger-ui/) — live "Try It" playground for every endpoint
- [TurboSMTP Website](https://turbo-smtp.com)
