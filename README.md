# TurboSMTP Developers Hub

Welcome to the official TurboSMTP developer portal. This repository is the single source of truth for integrating with TurboSMTP's transactional email, email validation, and AI-native tooling.

---

## Navigate the Hub

| Section | Description |
|---|---|
| [Getting Started](docs/getting-started/README.md) | Authentication, API Keys, and Consumer Keys |
| [Transactional Email](docs/transactional/README.md) | Send email and retrieve analytics via the `/mail` API |
| [Email Validation](docs/validation/README.md) | Real-time email verification endpoints |
| [Webhooks](docs/webhooks/README.md) | Delivery and engagement event schemas |
| [SDKs](sdks/index.md) | Official client libraries for all supported languages |
| [API Reference](api-reference/README.md) | OpenAPI 3.1 specification and interactive reference |
| [AI Integrations](ai-integrations/mcp-server.md) | MCP Server and Agent Skills for AI-native workflows |

---

## Quick Start

```bash
# Send your first email using curl
curl -X POST https://api.turbo-smtp.com/api/v2/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "you@yourdomain.com",
    "to": ["recipient@example.com"],
    "subject": "Hello from TurboSMTP",
    "html": "<h1>It works!</h1>"
  }'
```

See [Getting Started](docs/getting-started/README.md) for full authentication details.

---

## SDKs

| Language | Status | Install |
|---|---|---|
| [C#](sdks/csharp.md) | Stable | `dotnet add package TurboSMTP` |
| [PHP](sdks/php.md) | Stable | `composer require turbosmtp/turbosmtp-client` |
| [Node.js / TypeScript](sdks/nodejs.md) | Planned | `npm install @turbosmtp/sdk` |
| [Python](sdks/python.md) | Planned | `pip install turbosmtp` |
| [Go](sdks/go.md) | Planned | `go get github.com/turboSMTP/turbosmtp-go` |

---

## AI Integrations

TurboSMTP is an AI-native platform. Integrate directly into your AI workflows:

- **[MCP Server](ai-integrations/mcp-server.md)** — Connect any MCP-compatible AI agent (Claude, Cursor, etc.) to TurboSMTP with zero custom integration code.
- **[Agent Skills](ai-integrations/agent-skills.md)** — Open-source SKILL.md packages that embed TurboSMTP deliverability expertise into your AI agents.

---

## Contributing

We welcome contributions to documentation, SDKs, and AI integrations. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Resources

- [API Reference](api-reference/README.md)
- [Issue Tracker](.github/ISSUE_TEMPLATE/bug_report.md)
- [TurboSMTP Website](https://turbo-smtp.com)
