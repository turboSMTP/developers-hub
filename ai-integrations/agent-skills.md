# TurboSMTP Agent Skills

**Designed, not started.** No skills have been written and no library is published. This page
explains the format a TurboSMTP skill would use; the skills themselves will be documented when they
exist.

---

## What are Agent Skills?

The **Agent Skills** open standard provides a lightweight, structured format for extending AI agent capabilities. Each skill is a directory containing:

- `SKILL.md` — YAML frontmatter (name, description, allowed tools) + Markdown instructions
- `scripts/` — Optional executable scripts
- `references/` — Optional reference documents
- `assets/` — Optional templates or data files

### Progressive Disclosure

AI agents load skills in three tiers:

| Tier | What is loaded | Token cost |
|---|---|---|
| Tier 1 | `name` + `description` from YAML frontmatter only | ~50–100 tokens per skill |
| Tier 2 | Full `SKILL.md` body — loaded when a prompt matches | Full skill content |
| Tier 3 | Files from `assets/` — loaded on demand by the skill | Per asset |

This keeps deep domain expertise available to an agent without holding it all in the context window.

---

## Related

- [MCP Server](mcp-server.md) — The execution layer skills operate on top of
- [Email Validation](../api-integrations/docs/validation.md)
