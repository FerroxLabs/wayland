---
phase: WLD-A-preview-ship
plan: B-02
type: execute
wave: B
depends_on: []
files_modified:
  - tests/e2e/specs/accessibility.e2e.ts
  - tests/e2e/a11y/baseline.json
  - src/renderer (a11y fixes)
autonomous: true
blocking: true
---

<objective>
Burn down the real a11y debt the QA-01 gate captured, and widen coverage, so the preview clears an
honest accessibility floor. (`html-has-lang` already fixed this session in `e5b63ab8b`.)
</objective>

<tasks>
- Fix baseline violations in priority order: `color-contrast` (every surface), then `aria-prohibited-attr`, `button-name`, `scrollable-region-focusable`. Re-record baseline after each real fix (`UPDATE_A11Y_BASELINE=1`).
- Expand the a11y spec (`accessibility.e2e.ts`) to Cockpit Home + CockpitSider nav + Voice/Assistants settings (currently guid-home/settings-models/settings-channels only).
- Keep the gate green (fails only on NEW serious/critical vs `tests/e2e/a11y/baseline.json`).
</tasks>

<verification>
`bun run test:e2e:a11y` green; baseline shrinks (fixed violations removed, not re-baselined as accepted); new surfaces scanned.
</verification>

<success_criteria>
Serious/critical a11y debt on preview surfaces is materially reduced and regression-gated.
</success_criteria>

<output>Write B-02-SUMMARY.md with before/after violation counts per surface.</output>
