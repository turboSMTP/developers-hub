# TurboSMTP MCP Server

**Designed, not started.** No implementation exists and nothing is published. This page explains the
protocol a TurboSMTP MCP server would speak; the server's own surface will be documented when it is
built.

---

## What is MCP?

The **Model Context Protocol (MCP)**, open-sourced by Anthropic, is a universal interface that allows AI agents to securely interact with external tools and data sources. It eliminates the need to write bespoke integration code for every AI platform.

Architecture:

| Role | Description |
|---|---|
| **MCP Host** | The AI application (e.g., Claude Desktop, Cursor) |
| **MCP Client** | Protocol handler inside the host |
| **MCP Server** | The program exposing capabilities to the AI |
| **Transport** | JSON-RPC 2.0 via stdio (local) or HTTP+SSE (remote) |

The specification is maintained at [modelcontextprotocol.io](https://modelcontextprotocol.io).

---

## Related

- [Agent Skills](agent-skills.md) — Domain expertise packages for AI agents
- [Email Validation](../api-integrations/docs/validation.md)
- [Transactional Email](../api-integrations/docs/transactional.md)
