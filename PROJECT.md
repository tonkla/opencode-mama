# OpenCode's Multi-agent Orchestration and Management Plugin Project Overview

## Identity

`opencode-mama` is a project-scoped OpenCode plugin for manager-led multi-agent software delivery.

OpenCode is the primary UI for the manager role. The user selects the `manager` agent directly from the OpenCode agent switcher, and the plugin orchestrates manager and worker sessions behind that entrypoint.

## Goals

In priority order, `opencode-mama` should:

1. Reduce the cost of multi-agent software delivery without losing important context.
   - Minimize unnecessary token usage across roles and tasks.
   - Prefer compact, agent-first artifacts over repeated conversational context.
   - Preserve working state explicitly so workflows can resume without re-explaining prior work.
2. Keep the manager as the only control plane between the user and worker agents.
   - The user interacts with the manager, not directly with workers.
   - Workers do not directly communicate with each other.
   - Worker proposals become actionable only after manager acknowledgement.
3. Make orchestration flexible across roles, models, and reasoning levels while staying OpenCode-native.
   - Route work by role instead of assuming one agent does everything.
   - Keep role behavior project-scoped and configurable.
   - Let teams choose per-role runtime settings in `config.toml`.
4. Prefer explicit, file-based coordination over implicit conversational state.
   - Treat repo-local artifacts as the durable system record.
   - Use OpenCode session events for observation and reconciliation, not as the only source of truth.
   - Avoid redundant context copies; prefer references to existing files and artifacts.

## Vision

Build a practical manager-led orchestration layer for OpenCode projects that need multiple specialized agents without losing control, context, or budget discipline.

`mama` exists to make multi-agent delivery cheaper, more explicit, and easier to resume. The system should keep orchestration simple: one manager, role-specific workers, explicit handoffs, durable workflow state, and minimal token waste.

## System Model

- The project scaffolds one custom primary agent: `manager`.
- The user talks to the manager by selecting the `manager` agent in OpenCode.
- If there is no active local manager session yet, the plugin creates one automatically on the first normal manager message.
- The plugin creates and manages worker sessions behind the manager workflow.
- The manager decides which role acts next.
- One OpenCode session is created per task.
- Worker session titles follow `<role>: <task>`.
- Workers may propose next-role handoffs, but they do not route the next role directly.
- The manager accepts or rejects worker-authored proposals in manager-owned state.
- One top-level user request is active per project.
- Built-in OpenCode primary agents such as `build` and `plan` are left untouched.

## Source of Truth

The durable system record is repo-local and file-based.

- `.artifact/manager/session.json` is a tiny pointer to the active local manager session ID.
- `.artifact/manager/sessions/<id>/session.json` is the canonical active workflow state.
- `.artifact/queues/*.json` stores worker-to-manager queue messages.
- `.artifact/<role>/*.md` stores worker-authored handoff tasks and role outputs.

OpenCode runtime state is important but secondary. Session events help the manager observe and reconcile workflow progress, but durable workflow truth must remain in repo-local artifacts.

## Roles

Built-in roles:

- manager
- researcher
- designer
- architect
- tester
- coder
- reviewer
- committer

The manager is always enabled. Other roles may be skipped when the manager decides they are unnecessary or when `config.toml` explicitly disables them.

Typical delivery flow:

- `researcher -> designer -> architect -> tester -> coder -> reviewer -> committer`

This is guidance, not a hard pipeline. The manager may skip, repeat, or loop roles when needed. Common manager-led loops include:

- `architect <-> coder <-> reviewer`

## OpenCode Integration

`opencode-mama` is a project-local OpenCode integration surface.

- Plugin code lives under `.opencode/plugins/`.
- Local manager control lives under `.opencode/commands/m.md`.
- Each role is a real project-scoped OpenCode agent under `.opencode/agents/<role>.md`.
- Runtime settings live in `config.toml`.

Role behavior belongs in project agent files, not in `config.toml`.
The `manager` agent is `mode: primary`. Specialists are `mode: subagent`.

## Workflow Contract

### Manager-owned state

The manager writes canonical orchestration state under `.artifact/manager/`.

At minimum, the manager state maintains:

- `.artifact/manager/session.json`
- `.artifact/manager/sessions/<id>/session.json`

Workflow IDs are local `mama` session IDs and are distinct from raw OpenCode session IDs.

### Worker communication

Workers communicate with the manager through:

- worker-authored handoff markdown files
- queue JSON files under `.artifact/queues/`

Workers may propose next-role work, but those proposals are not authoritative until the manager accepts them.
Queues are for worker-to-manager communication, not manager-to-worker orchestration.

### Plugin orchestration contract

- The manager writes the canonical next action into the active session file.
- The plugin applies that next action only after the manager session becomes idle.
- The plugin records the action result back into the same active session file.
- Allow at most one pending manager action at a time.

### Context discipline

- Prefer file references over copied context.
- Keep handoffs scoped to the next role’s job.
- Keep artifacts agent-first and token-efficient.
- Avoid redundant summaries when the source material already exists in the repo or prior artifacts.

## Permissions and Boundaries

- only `tester` and `coder` may modify the repo
- all other roles write only artifact outputs under `.artifact/`
- `tester` defines or updates tests before implementation when tests are part of the flow
- `coder` implements production code after a valid manager handoff

Hard boundaries:

- the manager does not implement product code
- the manager does not directly spawn specialists through the model loop
- workers do not directly coordinate with other workers
- worker-authored proposals do not auto-route the next role
- tmux output must not become the workflow protocol

## State Machine

The workflow states are:

- `new`
- `routing`
- `worker_running`
- `needs_clarification`
- `reviewing`
- `completed`
- `failed`
- `cancelled`

`reviewing` is reserved for the reviewer role being active. It is not a generic manager-inspection state.

## Product Direction

- Keep the manager focused on routing, state, and control.
- Keep workers focused on bounded role work.
- Prefer serialized, manager-mediated handoffs over autonomous worker coordination.
- Borrow useful OpenCode-native mechanics such as event-driven session observation and compaction-aware summaries.
- Do not let OpenCode runtime convenience override the file-based workflow contract.
- Keep orchestration outside the model loop when the plugin can execute it deterministically.
- Optimize for token efficiency before workflow niceties.

## Initial Scope

- Support OpenCode first and treat it as the manager UI.
- Install as a project-local plugin under `.opencode/plugins/`.
- Auto-scaffold missing built-in agent files and `.opencode/commands/m.md`.
- Use the `manager` primary agent as the main entrypoint.
- Use `/m new`, `/m resume`, `/m resume <id>`, `/m delete <id>`, `/m version`, and `/m help` as strict local manager control commands.
- Refuse `/m new` when an unfinished active session already exists.
- Keep built-in roles fixed.
- Keep one active top-level workflow per project.

## Non-Goals

- Direct user-to-worker interaction
- Worker-to-worker autonomous coordination
- Redundant context copies as a convenience layer
- Home-directory runtime state as the primary workflow protocol
- Tmux scraping as the source of truth
- Arbitrary project-defined role sets
- Multiple concurrent top-level workflows per project

## Guardrails

- `PROJECT.md` is the long-lived internal product charter for agents working on `opencode-mama`.
- Keep this document stable and high level.
- Change it only when explicitly asked to update project vision, core architecture, direction, or guardrails.
- Put human-facing setup and operating guidance in `README.md`.
- Put repo-specific agent workflow rules in `AGENTS.md`.
