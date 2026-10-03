# MediaVerse agent instructions

Follow [CONTRIBUTING.md](./CONTRIBUTING.md) for the request lifecycle and pull request standard. These rules apply to every coding agent working in this repository.

## Before changing files

- Read the linked issue and restate its acceptance criteria. If there is no issue, derive explicit criteria from the user's request.
- Inspect `git status` and preserve changes you did not create.
- Sync from `main` only when the user asks or the task requires it; never discard or rewrite user work.
- Read the nearest component guide before editing: `ui/README.md`, `backend/README.md`, or `mcp-server/README.md`.
- Search for existing implementations and tests before adding a new abstraction.

## While implementing

- Make the smallest coherent change that satisfies the accepted outcome.
- Do not perform unrelated refactors, dependency upgrades, formatting sweeps, or documentation generation.
- Keep authentication, authorization, secrets, personal data, and admin operations server-enforced.
- Preserve API and stored-data compatibility unless a breaking change is explicitly approved. Document migrations and rollback steps.
- Add a regression test for a bug fix and focused tests for new behavior when the repository has a relevant test layer.
- Reuse established UI components, service boundaries, error shapes, and naming conventions.
- Do not edit generated design-sync documentation by hand unless the task is specifically about that system.

## Verification and handoff

- Run the checks for every affected area listed in `CONTRIBUTING.md`, plus `git diff --check`.
- Inspect the final diff for secrets, unrelated changes, stale comments, debug output, and accidental generated files.
- Never claim a check passed unless it was run successfully.
- In the handoff, summarize the outcome, list changed files or surfaces, report exact verification, and call out risks or follow-ups.
- For a pull request, use `.github/PULL_REQUEST_TEMPLATE.md`, link the issue, and include visual evidence for UI changes.

## Stop and ask

Ask for direction before destructive data operations, production changes, public API breaks, new paid services, security-policy changes, or scope that materially exceeds the accepted request.
