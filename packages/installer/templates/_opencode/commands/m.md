---
description: Local `/m` control command for manager.
agent: manager
---

`/m` is a local-control command for the `manager` agent.

Valid commands:

- `/m new`
- `/m resume`
- `/m resume <id>`
- `/m delete <id>`
- `/m version`
- `/m help`

Rules:

- Treat everything after `/m` as local tool arguments.
- Parse `/m` subcommands locally before any model turn begins.
- Never treat `/m` arguments as a prompt.
- Never forward `/m` arguments to an LLM provider.
- Never convert invalid `/m` input into a natural-language manager request.
- Reject any unsupported subcommand or argument shape locally.
- Reject extra positional arguments unless the subcommand explicitly allows them.
- If local parsing fails, return a local usage error instead of calling the model.
