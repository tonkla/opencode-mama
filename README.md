# OpenCode's Multi-agent Orchestration and Management Plugin

`opencode-mama` is a project-scoped OpenCode plugin for manager-led multi-agent software delivery.

It scaffolds a primary `manager` agent, project specialist subagents, a strict local `/m` command, and repo-local workflow state under `.artifact/`.

## What It Does

- adds a primary `manager` agent to the project
- adds a strict local `/m` command for manager control
- scaffolds built-in specialist role agents as subagents
- keeps workflow state in repo-local artifacts
- uses manager-approved handoffs instead of direct worker-to-worker coordination
- optimizes for explicit state and low token waste

## Mental Model

The system is manager-centric:

1. You select the `manager` agent in the OpenCode agent switcher.
2. If there is no active local manager session yet, the plugin creates one automatically on the first normal manager message.
3. The manager inspects project context and current workflow state.
4. The manager decides the next role.
5. `opencode-mama` starts or reconciles worker sessions for that task.
6. The worker writes outputs or proposed handoffs.
7. The manager accepts or rejects those proposals and decides what happens next.

The manager is the only control plane. Workers do not directly coordinate with each other.

## Built-in Roles

Built-in roles:

- Manager
- Researcher
- Designer
- Architect
- Tester
- Coder
- Reviewer
- Committer

Typical delivery flow:

- `Researcher -> Designer -> Architect -> Tester -> Coder -> Reviewer -> Committer`

This is not a fixed pipeline. The manager may skip, repeat, or loop roles as needed.

## Project Files

`opencode-mama` expects these project files:

- `PROJECT.md`
- `AGENTS.md`
- `config.toml`

Responsibilities:

- `PROJECT.md`: long-lived product charter for agents
- `AGENTS.md`: repo-specific agent workflow rules
- `config.toml`: per-role runtime settings

## OpenCode Project Structure

The plugin works through project-local OpenCode files:

- `.opencode/plugins/` for plugin code
- `.opencode/commands/m.md` for strict local manager control
- `.opencode/agents/<role>.md` for project-scoped role behavior

On first load, the plugin should auto-scaffold missing built-in role files and the local manager command file.

Existing customized role files should not be overwritten automatically.

Role model:

- `manager` is the project's custom primary agent
- specialist roles are project subagents
- built-in OpenCode primary agents such as `build` and `plan` remain untouched

## Manager Control

Select the `manager` agent in OpenCode to enter the manager workflow.

The strict local manager control command surface is:

```text
/m new
/m resume
/m resume <id>
/m delete <id>
/m version
/m help
```

Expected behavior:

- `/m` arguments are parsed locally and never sent to the model
- `new` creates a new local manager session only if no unfinished active session exists
- `resume` resumes the most recent manager session by default
- `resume <id>` resumes a specific local manager session
- `delete <id>` removes a non-active manager session
- `version` shows plugin version information
- `help` shows the supported local command set

## Workflow Rules

- one active top-level workflow per project
- one OpenCode session per task
- worker session titles follow `<role>: <task>`
- worker-authored next-role handoffs are proposals only
- the manager must explicitly accept a proposal before routing the next role
- manager-written next actions live in the active session file, not in worker queues
- the plugin applies a manager-written next action only after the manager session becomes idle
- OpenCode session events are used for observation and reconciliation, but repo-local artifacts remain the source of truth

## Repo Write Rules

- only `tester` and `coder` may modify the repo
- all other roles should write only artifact outputs under `.artifact/`

Additional role boundaries:

- `tester` defines or updates tests before implementation when tests are part of the task
- `coder` implements production changes after a valid manager handoff
- workers should not bypass the manager to coordinate directly

## Configuration

Use `config.toml` for per-role runtime settings such as:

- `provider`
- `model`
- `thinking`
- `enabled`
- `dir`

Role behavior should stay in `.opencode/agents/<role>.md`, not in `config.toml`.
