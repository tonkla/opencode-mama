# AGENTS.md

## Purpose

This file defines repo-specific operating rules for agents working on `opencode-mama`.

Read this file, `PROJECT.md`, and `config.toml` before making routing, design, or implementation decisions.

## Product context

- `opencode-mama` is a project-scoped OpenCode plugin.
- OpenCode is the primary UI for the manager role.
- The user selects the `manager` agent directly from the OpenCode agent switcher.
- `/m` is a strict local command surface available only in `manager` mode.
- The manager is the only control plane between the user and workers.
- Workers do not directly coordinate with each other.

## Core operating rules

- Optimize for token savings first.
- Prefer file references over copied context.
- Keep prompts, handoffs, and runtime state agent-first, compact, and explicit.
- Do not use tmux output as the source of truth.
- Treat repo-local artifact files as the durable system record.
- Assume one active top-level workflow per project.
- Assume one OpenCode session per task.
- Session titles should follow `<role>: <task>`.
- Treat the `manager` agent as the only custom primary agent scaffolded by this project.
- Leave built-in OpenCode primary agents such as `build` and `plan` untouched.

## Role model

Built-in roles:

- manager
- researcher
- designer
- architect
- tester
- coder
- reviewer
- committer

Rules:

- Treat `manager` as always enabled.
- Other roles may be skipped only when the manager decides they are unnecessary or the role is disabled in `config.toml`.
- Typical flow is `researcher -> designer -> architect -> tester -> coder -> reviewer -> committer`.
- The manager may skip, repeat, or loop roles as needed.
- Common manager-led loops include `architect <-> coder <-> reviewer`.

## Manager authority

- The manager delegates work, tracks workflow state, and decides the next role.
- The manager writes canonical workflow state under `.artifact/manager/`.
- The manager accepts or rejects worker-authored handoff proposals.
- A worker-authored handoff is not authoritative until the manager accepts it in manager-owned state.
- The manager must preserve clear ownership and never allow worker-to-worker direct protocol bypass.
- The manager must not directly spawn specialists through the model loop; the plugin applies manager-written next actions after the manager session becomes idle.

## Artifact protocol

### Source of truth

Use repo-local artifacts as the system record:

- `.artifact/manager/session.json` as a tiny pointer to the active local manager session ID
- `.artifact/manager/sessions/<id>/session.json` as the canonical workflow state
- `.artifact/queues/*.json` for worker-to-manager queue messages
- `.artifact/<role>/*.md` for worker-authored handoff tasks and role outputs

### File formats

Use formats by ownership and purpose:

- `.md` for handoff tasks and role-authored narrative outputs
- `.json` for machine-owned mutable state, queues, and events
- `.toml` only for human-owned configuration such as `config.toml`

Rationale:

- Markdown is the best default for handoffs because it carries instructions with less structural noise than JSON.
- JSON is the best default for machine state because it is easier to parse, validate, diff, and rewrite safely.
- TOML is for stable human-edited config, not runtime workflow state.

### Token optimization rules

- Do not duplicate context into new files unless the manager explicitly needs a derived summary.
- Point to file paths instead of copying large excerpts.
- Prefer short headings and flat bullet lists.
- Prefer concrete constraints over prose explanation.
- Avoid narrative recap when a checklist or path list is enough.
- Keep handoffs scoped to the next role's task only.
- Do not include background that the next role can read directly from referenced files.

## Handoff formatting

For worker-authored handoff tasks under `.artifact/<role>/[unix_timestamp]-[topic].md`, prefer this compact structure:

```md
# <Task Title>

## Goal
- One or two bullets max.

## Inputs
- `/abs/path/file`
- `/abs/path/other-file`

## Constraints
- Required rule
- Required rule

## Deliver
- Exact expected output

## Done When
- Concrete completion condition
```

Formatting rules:

- Keep sections short.
- Use bullets instead of paragraphs when possible.
- Do not embed large copied code blocks unless the next role cannot access the source.
- Prefer absolute or repo-root-relative paths consistently within a handoff.
- Use explicit filenames, commands, and acceptance criteria.

## Worker communication rules

- Workers may write queue messages under `.artifact/queues/*.json` when they need to communicate with the manager.
- Queue files are for worker-to-manager communication, not for manager-to-worker orchestration.
- Workers may author next-role handoff proposals under their role artifact directory.
- Workers must not treat their own proposed handoff as accepted automatically.
- Workers must wait for manager acknowledgement before assuming the next role is active.

## Repo write permissions

In v1:

- only `tester` and `coder` may modify the repo
- all other roles should write only under `.artifact/`
- `tester` owns writing or updating tests before implementation when tests are part of the task
- `coder` owns production code changes after a valid manager handoff

Additional rules:

- `tester` must not implement production code
- `coder` must not author the initial tests
- `coder` must not weaken tester intent to make implementation easier
- `coder` must not edit designer, architect, or reviewer artifacts
- if tests look wrong, impossible, or inconsistent, escalate back to the manager

## Review protocol

The manager must enforce review closure for implementation work:

- maintain a manager-owned findings ledger under `.artifact/manager/`
- use stable finding IDs and explicit finding states
- never route `reviewer -> reviewer` for the same task without an intervening coder handoff or explicit manager scope change
- route coder with only the current open findings plus exact validation commands
- require follow-up review to map prior finding IDs to state transitions
- stop the loop only when required validation passes and open critical findings are closed
- if the same finding is reopened repeatedly, escalate to `architect`

## Documentation boundaries

- Change `PROJECT.md` only when explicitly asked to update project vision, architecture, or guardrails.
- Use `README.md` for human-facing setup and operating guidance.
- Keep `AGENTS.md` focused on repo-specific agent behavior and workflow rules.
