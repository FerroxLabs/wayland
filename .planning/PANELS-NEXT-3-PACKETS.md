# Three packets, found by LIVE-TESTING the app (2026-08-09, head b840629bb)

Every one of these came from Sean driving a real WCore turn through Flux. None
was visible to the unit suite, which is green at 16,411 / 0 failed.

Live rig that produced them (works, reuse it):
```
node scripts/prepareConstitutionFs.js ; node scripts/build-mcp-servers.js
WAYLAND_HOME=<scratch> WAYLAND_MULTI_INSTANCE=1 WAYLAND_DEV_PROFILE=LV-K06 \
  WAYLAND_DISABLE_AUTO_UPDATE=1 WAYLAND_CDP_PORT=9241 bun run start
```
CDP helper `scratchpad/cdp.mjs` (import `ws` by ABSOLUTE path). Flux connects via
Settings > Models > paste key > "Connect Flux Router" then the "Connect" button;
77 models resolve. `curl` is hook-rewritten and fails against CDP - use node `fetch`.
Approval prompts are NOT buttons: dispatch a real `Input.dispatchKeyEvent` Enter.

---

## P1 - REGRESSION I INTRODUCED. Do this first.

`ActivityTimeline.tsx` - my single-step label promotion (commit c4e1f532e) renders
the promoted label as the SUMMARY **and** still renders the child row, so
Observability shows "Running printf hello-wayland" twice, stacked.

Fix: a group of one must not render a wrapper AND a row. Collapse to one row that
expands to its own detail. The existing test asserts the label appears and that
"Did N things" does not - it passes either way, so it did not catch this.
**Add an assertion on the label's OCCURRENCE COUNT, not its presence.**

## P2 - K-03: the lifecycle never reaches `completed`

Observed live: assistant had fully answered ("It printed exactly: hello-wayland"),
and `[data-testid=execution-thread-summary]` still carried
`data-lifecycle="running"` across repeated polls.

Consequence: **my spine-bar fix (25a119c75) is correct in code and DEAD in
practice.** It stands the bar down on `completed`; wcore never gets there. Same
root cause as the 4632s timer Sean screenshotted. Fix K-03 and that fix comes
alive; until then the bar reads "running" forever on a finished turn.

## P3 - Workbench navigation: the horizontal tab row cannot hold the section set

Live: Progress / Observability / Build / Engine / Workspace overflow the 340px
panel. Workspace is unreachable without a scroll arrow the user does not notice.

It gets worse, not better: sections are DYNAMIC projections - `knowledge`,
`automation`, `consequential`, `team`, `browser-cua` all appear based on what the
run did (`WorkbenchHost/projections/model.ts`). Any horizontal row loses this.

**Icons alone are not the fix, and the codebase already recorded why**
(`WorkbenchHost/index.tsx:335-342`): sections carry no icons, label is their only
identity, a 36px column cannot hold horizontal text, and an earlier
`writing-mode: vertical-rl` attempt was "unreadable at a glance and easy to
mistake for a scrollbar". Icon-only also removes the words, which worsens the
exact discoverability problem being reported.

RECOMMENDED: stacked collapsible sections (the Claude panel Sean liked) - grows
DOWN so it scales with N, nothing hidden behind a scroll affordance, icons as
header decoration BESIDE labels rather than instead of them. Touches
WorkbenchHost's section/tab contract and every test asserting on `[role=tab]`.

## Still open from before

- File card for written files (drive from the file OUTCOME, never the
  `[[AION_FILES]]` marker - live forgery hole). Reuse `FilePreview.tsx`.
- Windows: T1 is mocked `spawn`, never real `CreateProcess`. Book the box.
- Sean's two decisions: the B1 trade, and Observability now gated on content.
