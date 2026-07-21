# Wayland Desktop — Cockpit Preview: remaining work as milestones + waves

**Date:** 2026-07-21 · **Branch:** `worktree-agent-desktop-integration` (LOCAL ONLY, nothing pushed) · **Base:** `74b360597`

## Straight answer: why this hasn't been running through Ferrox milestones/waves

It WAS. The WLD program ran through Ferrox (GSD): 7 phases, packets `01-XX`, integration branch, `/ferrox-progress` at 65%. Two things took it off the Ferrox rails:

1. **The reality assessment** (2026-07-20) proved the "7 phases" were overwhelmingly *already built* — the packets were a **safety-proof + accept** program, not a build program. It collapsed the 7 phases into a lean `T0–T5` plan.
2. **Sean's pivot** killed the M0B/cohort acceptance ceremony (the packet-based "done" gate). Once the acceptance model became "Sean+Claude live-test together," the remaining Ferrox packets were the *killed ceremony* — so continuing to execute them via `/ferrox-*` lifecycle would have been building dead work. A standing guardrail also fences me from the Ferrox milestone lifecycle (it deletes worktrees).

**So I worked the lean plan directly** with this discipline: map → build → **independent adversarial audit (default-REJECT)** → **full unit suite** → **runtime live-sweep** → atomic commit, all tracked in memory. That is real discipline — but the honest gap Sean flagged is that it was **not tracked as Ferrox milestones/waves**, so `/ferrox-progress` is stale and there was no wave-level view. This doc fixes the visibility. Re-engaging Ferrox's *tracked* lifecycle is a Sean decision (it needs the fenced commands); this doc is Ferrox-ingestable either way.

## Done this session (11 commits, all LOCAL, all independently audited)
`c03584bb9` wcore comment · `ea87291ea` VOC-03 voice consent · `9c72cf057`+`9fbdf099b` QA-01 a11y gate · `39f10578a` cohort-UI removal · `f75b5d777` chat overlap fix · `e5b63ab8b` a11y lang · `289ee13c7` VOC-03 test-rot fix · `9b661a948` cohort backend deletion (−11.4k LOC) · `0468b787e` MCP fixture fix. **Full suite green (15,510 pass, 0 fail); Cockpit renders all 13 surfaces + real Flux chat, runtime-swept.**

---

## MILESTONE M1 — Shippable Cockpit Preview (the goal)

### Wave A — Package & smoke (BLOCKING for a real ship; release-adjacent, do WITH Sean)
- A1. Build the preview with the **MATCHED bundled engine** (not a mismatched dev engine): `node scripts/stage-wcore-bump.mjs vX.Y.Z --write` for the current signed Core, then `bun run dist:preview:mac`.
- A2. **Packaged smoke** on the artifact (not dev): boot → Cockpit eligible (the new `cockpitPreviewBridge` stub in a *packaged* build) → real-engine chat streams. macOS proven in dev; do packaged. Win/Linux per distribution intent.
- A3. **Declare Voice / MCP / sandbox** each IN or "physically absent" for the candidate (each capability-conditional acceptance criterion is satisfied by honest absence).

### Wave B — Trust/quality floor (BLOCKING for an honest preview)
- B1. VOC-03 follow-ups: inline "Review hosted-voice consent" affordance for existing hosted-provider users (currently must switch-away-and-back — fails closed, but non-obvious); friendlier error copy for `TTS_/STT_HOSTED_CONSENT_REQUIRED` (+ i18n); live-click the consent modal in a sweep.
- B2. a11y debt burn-down (baseline in `tests/e2e/a11y/baseline.json`): `color-contrast`, `aria-prohibited-attr`, `button-name`, `scrollable-region-focusable`. Expand a11y spec coverage to Cockpit Home/nav + Voice/Assistants settings.

### Wave C — Hygiene (non-blocking, cheap)
- C1. Remove orphaned i18n keys (`settings.navigationPage.{cohort*,evidenceConsent*}`) across 12 locales + regenerate `i18n-keys.d.ts`.
- C2. Update ROADMAP.md/STATE.md to reality; mark the 14 killed cohort/M0B packets out-of-scope. Optionally drop recovery `stateAuthorityInventory` `cohort-evidence`/`cockpit-rollout` registry entries (data-only).

---

## MILESTONE M2 — Scope decisions (T3, NON-blocking for a first preview)
- Wave D — COW-04/05/06 (durable citation ledger + type-aware DOCX/PDF validation): decide prompt-level-OK-for-preview vs enforced infra (lean: prompt-level for preview).
- Wave E — SBX-02 (project-scoped localhost/toolchain grant, genuinely MISSING): decide **descope** (lean) vs build.
- Wave F — IMG-01 (inference-time vision-only routing + param-strip, PARTIAL): harden the fail-closed guarantees.
- Wave G — VOC-04 (authoritative `VoiceReceipt`, MISSING): only if Voice ships.
- Wave H — CMP-01 (Web/Cloud composition root, PARTIAL/low-value): decide in/out of scope at all.

## MILESTONE M3 — Secure Portability (T4, DEFERRED future milestone — do NOT block Cockpit)
Phase-7 ~8.3k-LOC encrypted transfer engine, staged behind a bridge deny-list. Real build gaps: wire live Desktop+Core cross-store quiescence (hardcoded off); transactional import apply (+ recovery-point + quarantine); un-deny the export/import/publish surface (owner go/no-go); full-instance round-trip acceptance under fault/replay/restart.

## Acceptance model (per Sean's pivot)
No cohort/external test group. Acceptance = **Sean + Claude live-test a dev/preview build together** (Playwright sweep `scratchpad/sweep-cockpit.mjs` — connect Flux, activate Cockpit, walk every destination + real chat), fix, re-test. A green sweep IS the acceptance.

## Run/verify quickref
- Dev app for sweep: `electron .` loads the **built** `out/renderer` — `bun run package` (~25s) after source edits first.
- Full suite: `bun run test:vitest` (15,510 pass). a11y gate: `bun run test:e2e:a11y`.
- Guardrails held all session: LOCAL only (no push/merge/release); never touch `/Users/seandonahoe/dev/wayland/app`; independent audit + full suite before every commit; never run Ferrox milestone lifecycle (deletes worktrees).
