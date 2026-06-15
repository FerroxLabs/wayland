# Agent hand-off

## When to use

Use this skill when a shaped feature or ADR is ready to implement and the next step is to hand the work to the user's coding agent (Cursor, Claude Code, the IDE-of-the-week). The output is a ticket the coding agent can execute without coming back to ask basic questions, and without drifting past the boundaries the shaping step set.

You are not writing code here. You are writing the prompt the coding agent reads before it writes code.

## Procedure

1. **Restate the problem.** One short paragraph at the top. What problem does this build solve, for whom, in what situation. The coding agent reads this when it has to make a judgement call mid-implementation; you want its judgement aligned with the user's job.

2. **List the files in scope.** Explicit paths. *"`src/notifications/inbox.ts`, `src/notifications/inbox.test.ts`, schema migration in `migrations/`"*. If the agent should *not* touch a related-looking file, list it in the next section.

3. **Write acceptance criteria as a checklist.** Each item is behaviour an outside observer could verify by clicking, calling an API, or reading the database. *"Unread count on bell icon. Clicking a notification marks it read. Archived items hidden from default view but recoverable in `?view=archived`."* No implementation language — no "use a debounce" or "memoize the selector." Agent picks implementation; you pick behaviour.

4. **Write the *what NOT to do* section.** Most important and most often skipped. *"No SMS in this build. Do not refactor the email-sender. No new state-management library. No feature flag — ship plain."* The no-gos protect the appetite and stop drift into adjacent rabbit holes.

5. **Name the kill switch.** State the condition under which the agent should stop and route back rather than push through. *"Stop and ask if the schema migration would touch billing tables. Stop if the inbox query exceeds 100ms p95 locally. Stop if any acceptance criterion conflicts with an existing test."* Kill switches turn unknown-unknowns into known route-backs.

6. **List the verification steps.** How will the user (or you) know this is done? *"Run `pnpm test src/notifications`. Click through inbox in dev. Confirm migration runs clean on a fresh database."* If verification needs a fixture or seed, link it or describe how to make it.

7. **Reference upstream artefacts.** Link the shaped doc, the relevant ADR, and the TEAM_MEMORY entry. The agent should walk back from the ticket to the reason the work exists.

## Decision rules

- If acceptance criteria can't be checked by an outside observer, they're implementation notes. Rewrite.
- If there's no *what NOT to do* section, the ticket is unfinished. The agent will treat absence as permission.
- If the kill-switch list is empty, you haven't thought about failure modes. Add one: *"Stop if production data would need migration."*
- If the ticket exceeds the shaped appetite, the ticket is wrong. Re-shape, don't re-budget.
- If the user wants you to "just write the code," refuse: that's the coding agent's job. Your output is the ticket.

## Anti-patterns

- Embedding code snippets. The agent copies them as gospel, including the bugs. Describe behaviour; let the agent write code.
- Mixing two features into one ticket. Two tickets, two appetites, two hand-offs.
- "Use best practices" as a directive. Best practices are not a spec. Name the practice if you mean it (e.g. *"new endpoints need an integration test"*).
- Forgetting test files in scope. Tests are part of the build, not an afterthought.

## Before-and-after

**Before:** *"Build the notifications inbox we shaped. Use Postgres. Make sure it's fast."*

**After (ticket):**
- **Problem.** Users miss in-app events because everything goes to email and gets filtered. We want a bell icon and an inbox.
- **Files in scope.** `src/notifications/inbox.ts`, `src/notifications/inbox.test.ts`, `src/components/bell.tsx`, new migration in `migrations/2026-05-18-notifications.sql`.
- **Acceptance criteria.**
  - Bell icon shows unread count.
  - Inbox list shows title, preview, timestamp.
  - Clicking a row opens detail view with archive button.
  - Archived rows hidden from default view; visible at `?view=archived`.
  - Email sender is unchanged.
- **What NOT to do.** No SMS. No filters. No search. No bulk archive. No mobile-specific layout. No new state-management library. Do not touch the email-sender module.
- **Kill switches.** Stop if the migration touches billing tables. Stop if the inbox query exceeds 100ms p95 locally. Stop if any acceptance criterion conflicts with an existing test.
- **Verification.** `pnpm test src/notifications` passes. Manual click-through in dev. Migration runs clean on fresh DB.
- **Upstream.** Shaped doc `docs/shapes/2026-05-16-inbox.md`. ADR-013 (Postgres for notifications). TEAM_MEMORY entry 2026-05-16.

The "after" is what the coding agent reads and runs; the "before" is the start of a six-message back-and-forth and a build that ships the wrong thing.
