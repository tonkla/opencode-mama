---
description: Strict local manager control command. Parse arguments locally and never forward them to the model.
agent: manager
---

`/m` is a strict local-control command for the `manager` agent.

Valid commands:

- `/m new`
- `/m resume`
- `/m resume <id>`
- `/m delete <id>`
- `/m version`
- `/m help`

Rules:

- Treat everything after `/m` as local tool arguments.
- Never treat `/m` arguments as a prompt.
- Never forward `/m` arguments to an LLM provider.
- Reject any unsupported subcommand or argument shape locally.
