# Contributing to MediaVerse

This document is the source of truth for turning a user request into a shipped change. It applies to users, product administrators, developers, reviewers, and coding agents.

## Choose the right request

Use one request for one outcome. Search existing issues first, then choose a form from the [request page](https://github.com/sivab193/movies-tracker/issues/new/choose).

| Request | Use it when | Required evidence |
| --- | --- | --- |
| Bug | Existing behavior is broken or regressed | Reproduction steps, expected and actual results, environment, screenshots or logs when useful |
| Feature | A new user or admin outcome is needed | Problem, affected user, proposed outcome, acceptance criteria, alternatives |
| Data correction | Catalog data is missing or wrong | Title or entity, current value, expected value, trustworthy source URL |

Do not post credentials, tokens, private account data, or security vulnerabilities. Follow [SECURITY.md](./SECURITY.md) for security reports.

## Shared lifecycle

Every request follows the same states:

1. **Submitted** — the form contains enough context to reproduce or evaluate the request.
2. **Triage** — a maintainer confirms type, impact, priority, scope, and ownership.
3. **Ready** — acceptance criteria are testable and dependencies or design decisions are resolved.
4. **In progress** — an assignee has started a focused implementation.
5. **In review** — a linked pull request includes verification evidence.
6. **Done** — the change is merged, deployed when applicable, and the issue is closed with release notes or a verification comment.

An issue may instead be marked **needs info**, **duplicate**, **declined**, or **blocked**. The maintainer should leave a short reason and, when possible, the next action.

## Maintainer triage standard

The product administrator or maintainer owns the queue. During triage:

- Confirm that the request contains no secrets or personal data.
- Reproduce bugs before marking them ready. If reproduction is impossible, request the smallest missing detail.
- Rewrite the desired outcome as testable acceptance criteria; do not prescribe code unless there is a hard constraint.
- Check for duplicates, affected surfaces (`ui`, `backend`, `mcp`, `data`, `docs`), regressions, migration needs, and rollout risk.
- Assign one type, one priority, and the relevant area labels.
- Keep approval separate from implementation: only `status: ready` authorizes development.

Suggested labels:

| Group | Values |
| --- | --- |
| Type | `type: bug`, `type: feature`, `type: data`, `type: docs`, `type: maintenance` |
| Priority | `priority: critical`, `priority: high`, `priority: normal`, `priority: low` |
| Status | `status: needs-info`, `status: ready`, `status: in-progress`, `status: blocked` |
| Area | `area: ui`, `area: backend`, `area: mcp`, `area: data`, `area: infrastructure` |

Critical means an active security incident, broad outage, or destructive data loss. High means a major workflow is blocked without a reasonable workaround. Normal is the default. Low covers minor polish and optional improvements.

## Ready for development

A request is ready only when it has:

- a clear user or operator outcome;
- observable acceptance criteria;
- known scope and affected area;
- a priority and owner;
- resolved product decisions, or an explicit decision owner;
- identified security, privacy, data-migration, or compatibility constraints.

Small, obvious maintenance changes may use the pull request description as the issue, but the same acceptance and verification standards still apply.

## Implementation standard

1. Branch from current `main`. Use `<type>/<issue-number>-<short-name>`; coding-agent tooling may require `codex/<issue-number>-<short-name>`.
2. Keep the diff limited to the accepted outcome. Open another issue for unrelated cleanup.
3. Preserve existing APIs and stored data unless the issue explicitly approves a breaking change or migration.
4. Add or update tests for changed behavior. Prefer a regression test for every bug fix.
5. Update only documentation made inaccurate by the change. Avoid duplicating setup or reference material.
6. Never commit secrets, local environments, build output, user exports, media renders, or editor state.
7. Run the checks that cover the changed area and record exact commands and results in the pull request.

Minimum local checks:

```bash
# Frontend
cd ui
npm run lint
npm run build

# Backend
cd backend
python -m unittest discover -s tests

# MCP server
cd mcp-server
npm run build

# Repository hygiene
git diff --check
```

If a check cannot run, state why and describe the manual verification performed. Do not report an unrun check as passing.

## Pull request standard

A pull request must:

- link its issue with `Closes #123` or explain why no issue is needed;
- explain the user-visible outcome and the important implementation choice;
- list changed surfaces and any schema, environment, API, or deployment impact;
- include test commands and results;
- include before/after images or recordings for visible UI changes;
- identify risks, rollback steps, and follow-up work;
- remain focused enough to review and revert safely.

Use a conventional title: `fix:`, `feat:`, `docs:`, `refactor:`, `test:`, `chore:`, or `security:` followed by a concise imperative summary.

## Review and completion

Reviewers verify acceptance criteria first, then correctness, security/privacy, data safety, compatibility, tests, accessibility, and maintainability. Authors resolve all blocking comments and keep the branch current with `main`.

After merge, the maintainer confirms deployment or migration status, verifies the outcome in the target environment when practical, closes the issue, and records user-facing changes in `CHANGELOG.md` when they affect released behavior.
