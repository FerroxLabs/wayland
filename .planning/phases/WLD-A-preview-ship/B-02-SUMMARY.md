---
phase: WLD-A-preview-ship
plan: B-02
status: partial-verified-contrast-fixes-plus-coverage-doubled
completed: 2026-07-22
---

# B-02 — a11y burn-down (partial: top contrast offenders + coverage expansion)

## Shipped (verified)
- **Contrast fixes** (computed WCAG ratios, all now ≥4.5:1):
  - Light `--text-muted` `#777777 → #666666` — was 3.9–4.5:1 on the app backgrounds (fails), now 5.0–5.7:1. (Sean-approved via mock-up.)
  - Dark `--text-muted` `#9a9a9a → #a0a0a0` — was 4.35:1 on the elevated `#353535` fill, now 4.69:1; stays below `--text-secondary`.
  - Titlebar tagline (`.app-titlebar__brand-tagline`) re-pointed `--text-dim (#6b) → --text-muted` — was 2.69:1 on `#2a2a2a`, now 5.49:1. Scoped to the element so the global dim/muted hierarchy is untouched.
  - Arco empty-state (`.arco-empty-description`) → `--text-muted` — was ~3.3:1, now readable.
- **Coverage doubled:** a11y spec `SURFACES` 3 → 6 (added Voice, Assistants, General settings). Baseline re-recorded for all six. Gate green (6/6).

## Honest scope finding
Color-contrast is a **broad dark-theme burn-down**, NOT a single-token fix (the mock-up implied the latter from the one light-theme pair I'd found by inspection). The gate samples the DARK theme; the live axe scan found many low-contrast elements, largely Arco component defaults, beyond the 4 top offenders fixed here (my diagnostic dump was node-capped, so the true count is higher). **color-contrast still appears in the baseline on all 6 surfaces** — the fixes reduced offending nodes but did not clear the rule.

## Remaining (needs decisions / a focused pass)
- **DESIGN CALL — orange "Recommended" tag** (`FluxRouterHero.module.css .recommendedTag`): white on brand `--brand #ff6b35` = 2.83:1. Recommended: keep the brand orange, use **dark text `#1a1a1a`** = 6.14:1 (common legible badge pattern). Pending Sean.
- **Full color-contrast clearance:** enumerate every remaining offender (uncapped scan) and fix — dedicated pass; many are Arco defaults fixable via `arco-override.css`.
- **Mechanical rules** (button-name, aria-prohibited-attr, aria-required-parent, aria-valid-attr-value, scrollable-region-focusable, label, nested-interactive, aria-input-field-name): targeted node-by-node fixes; each surface's set is in `baseline.json`.
- **Cockpit Home/nav coverage:** needs shell-activation in the a11y spec (hash-nav only reaches Classic surfaces).

## Verify
`bun run package` then `bun run test:e2e:a11y` (green, 6 surfaces). Re-record: `UPDATE_A11Y_BASELINE=1`.
