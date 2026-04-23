# OpenCode's Multi-agent Orchestration and Management Plugin

`opencode-mama` is a project-scoped OpenCode plugin for manager-led multi-agent software delivery.

## What It Gives You

- a primary `manager` agent
- a strict local `/m` control surface
- specialist role templates for OpenCode agents
- repo-local workflow state
- manager-approved handoffs instead of direct worker-to-worker coordination
- compact, explicit artifacts for multi-agent work

## When To Adopt

Adopt `opencode-mama` if you want:

- OpenCode as the main UI for multi-agent work
- one manager to coordinate specialist agents
- explicit task handoffs instead of implicit coordination
- workflow state stored in the repo instead of in terminal history
- a setup that favors resumability and low token waste

Do not adopt it if you want:

- direct user-to-worker interaction
- worker-to-worker autonomy
- loose, conversation-only coordination
- multiple concurrent top-level workflows in one project

## Human Usage

After installing the plugin in a project:

1. Select the `manager` agent in OpenCode.
2. Use `/m help` to see the local manager command surface.
3. Use `/m new` to start a workflow, or `/m resume` to continue one.
4. Use `/m version` when you need plugin version information.

## What To Customize

- `config.toml` for per-role runtime settings
- `PROJECT.md` for long-term project goals and architecture
- `AGENTS.md` for repo-wide agent rules
- role templates under `templates/_opencode/agents/` for behavior changes

## Notes

- `opencode-mama` is designed around manager-mediated workflows.
- The repo keeps workflow state in `.artifact/`.
- Role behavior belongs in the OpenCode agent templates, not in human-facing documentation.
