---
name: git-commit
description: Expert guidance for crafting high-quality, Conventional Commits-compliant git commit messages. Use this skill when you need to write a commit message for your changes.
---

# Git Commit Skill

This skill ensures all project contributions maintain a clean, readable, and machine-parsable history using the **Conventional Commits** specification.

## Core Workflow

> **CRITICAL**: DO NOT execute a git commit unless the user has explicitly commanded it (e.g., "commit", "commit all"). Even if changes are ready and passing all checks, wait for the user's specific instruction to proceed with the commit.

1.  **Review Changes**: Run `git status` and `git diff --cached` to see exactly what you are about to commit.
2.  **Pre-commit Hygiene**: Run all Husky pre-commit commands (or the equivalent scripts) before committing. Fix all failures locally; do not bypass hooks.
3.  **Determine Intent**: Match your changes to one of the [Commit Types](#commit-types).
4.  **Draft Message**:
    - Start with a concise **Subject Line**.
    - Add a **Body** if the "why" isn't obvious from the subject.
    - Include **Footers** for breaking changes or task references.

## Commit Message Format

```text
<type>: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- **feat**: A new feature (correlates with `MINOR` in SemVer).
- **fix**: A bug fix (correlates with `PATCH` in SemVer).
- **docs**: Documentation-only changes.
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
- **refactor**: A code change that neither fixes a bug nor adds a feature.
- **perf**: A code change that improves performance.
- **test**: Adding missing tests or correcting existing tests.
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation.
- **ci**: Changes to CI configuration files and scripts.

## Best Practices

- **Imperative Mood**: Use the imperative, present tense in the subject: "change" not "changed" or "changes". Think of it as: "If applied, this commit will *[subject line]*".
- **Conciseness**: Keep the subject line under 50 characters if possible.
- **No Punctuation**: Do NOT end the subject line with a period.
- **Lowercase Subject**: Start the subject line with a lowercase letter.
- **Explain "Why"**: Use the body (after a blank line) to explain the motivation for the change and contrast it with previous behavior.
- **Breaking Changes**: Use `!` after the type (e.g., `feat!: ...`) or include `BREAKING CHANGE:` in the footer.
- **Husky Failures**: If Husky pre-commit fails, fix the underlying issue and re-run the hook. If failures are caused by script configuration (e.g., glob patterns, unsupported files), update the script to be robust and then re-run.
- **No Hook Skipping**: Do not use `--no-verify` or bypass hooks unless the user explicitly requests it.
- **Explicit Authorization**: You must receive an explicit "commit" command from the user before using this skill or running a git commit command.

## Examples

### Good Subject Line
`feat: add language picker to content editor`

### Full Commit Message
```text
feat: add migration for navigation schema

- Create 'navs' and 'nav_items' tables for site menus
- Implement sub-menu support up to 2 levels
- Update Drizzle relations in schema.ts

Closes: #142
```
