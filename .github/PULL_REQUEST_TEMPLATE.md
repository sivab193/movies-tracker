## Outcome

<!-- Explain the user-visible or operator-visible result. -->

Closes #

## Changes

<!-- List the important changes and affected surfaces. -->

-

## Verification

<!-- List exact commands and results. Say "Not run" with a reason when applicable. -->

- [ ] UI lint: `cd ui && npm run lint`
- [ ] UI build: `cd ui && npm run build`
- [ ] Backend tests: `cd backend && python -m unittest discover -s tests`
- [ ] MCP build: `cd mcp-server && npm run build`
- [ ] Repository check: `git diff --check`
- [ ] Manual acceptance criteria verified

## Visual evidence

<!-- Required for visible UI changes. Add before/after screenshots or a recording; otherwise write "Not applicable." -->

## Risk and operations

- Schema or data migration: None
- Environment or configuration changes: None
- API compatibility impact: None
- Deployment or rollback notes: None

## Author checklist

- [ ] The diff is limited to the accepted request.
- [ ] Tests cover new behavior or the fixed regression.
- [ ] Authentication, authorization, privacy, and admin boundaries were reviewed.
- [ ] Documentation and `CHANGELOG.md` were updated when released behavior changed.
- [ ] No secrets, personal data, debug output, or generated local artifacts are included.
