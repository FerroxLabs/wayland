# HANDOFF — 2026-07-23 (Milestone B built; Wave 1/3/4/5 + all 7 scope items)

**Read this first on resume.** Everything below is LOCAL on branch
`worktree-agent-desktop-integration` (HEAD `fc1e75d0c`), **nothing pushed**, in worktree
`~/gsd-workspaces/wayland-desktop-integration/app`. Run tooling from there.

## Where we are

- **Milestone A — Cockpit Preview Ship:** packaged smoke proven (A-02, functional risk
  retired); a11y floor largely done; i18n hygiene done. Remaining = the SEALED distributable
  build (Sean's CI trust root only) + a few documented a11y residuals.
- **Milestone B — Scope Decisions:** Sean's call 2026-07-23 = **BUILD ALL 7, no deferments.**
  **All 7 landed + verified.** Full suite **15,611 pass / 0 real failures** (1 pre-existing
  `WorkflowDetailModal.dom.test.tsx` flake — passes 12/12 isolated; nothing built touches
  workflows).
- **Milestone C — Secure Portability:** still deferred.

## This session's commits (20 total, `9aa836c86..fc1e75d0c`, all LOCAL)

**Wave 1 — packaged smoke harness + A-02**

- `scripts/packaged-cockpit-smoke.mjs` — drives the PACKAGED hardened app over CDP (no fuse
  weakened; Playwright's Electron driver can't attach because `afterPack` disables the node
  inspector — the app self-enables Chromium remote debugging via `WAYLAND_CDP_PORT`). Walks 12
  surfaces + bridge + Flux connect + chat. Audit-hardened against 5 false-green paths.
  Run: `node scripts/packaged-cockpit-smoke.mjs` (surface gate green via `--no-chat`; chat
  assertion needs a non-rate-limited backend). Key: `~/.config/wayland-smoke/flux-test-key`.
- A-02 evidence + findings in `.planning/phases/WLD-A-preview-ship/A-02-*.md`.

**Wave 3 — a11y (B-02):** 374→~35 gated nodes cleared. Assistant switches/edit-buttons
aria-labelled, settings-sider focusable, brand-orange primary buttons → dark text (6.14:1).
Baseline tightened; gate green 6/6. `bun run test:e2e:a11y`.

**Wave 4 — i18n hygiene:** 22 orphaned cohort keys removed ×12 locales; 814 i18n tests pass.

**Milestone B — all 7 (see `.planning/phases/WLD-B-scope/B-DECISIONS.md` capture table):**

- **IMG-01** `a0b8c82d2` — enforced fail-closed image/vision send gate
  (`src/renderer/utils/model/imageVisionGate.ts` + `useGuidSend.ts`). Retires the reported
  silent-image-drop bug. 7 tests.
- **CMP-01** `ff26e32dc` (+re-pin `fdf332c64`) — composition contract test
  (`tests/unit/execution/cmp01SharedModelCompositionContract.test.ts`), digest-pinned,
  host-neutral replay. 5 tests.
- **SBX-02 core** `9a70287ee` — `src/common/security/projectCapabilityGrants.ts`: fail-closed
  resolver + SSRF-safe host classification + all 8 sibling vectors blocked. 42 tests.
- **VOC-04** `172a1a0a7`, `68231d960` — provider-neutral TTS/STT adapter registries +
  authoritative VoiceReceipt; VOC-03 consent gate verified intact. 110 voice tests.
- **COW-04/05/06** `0bdda68de`, `033abc541` — citation ledger + type-aware validation folded
  into the canonical execution model (`src/common/execution/{types,reducer,selectors,delivery}.ts`,
  NO parallel store) + Workbench rendering + end-to-end journey test. 61 execution tests.
- **Brand contrast** `443a04ba1` — dark-on-orange primary buttons.
- **B-01 consent test hooks** `d9c328a0b` — `tts/stt-consent-pending`, `*-consent-review`,
  `voice-consent-accept/cancel`.

## NEXT — where to resume (priority order)

1. **SBX-02 wiring (next increment, NOT a descope).** The security-critical resolver is done.
   Remaining: (a) consult `resolveGrant` at the process-side network/toolchain request gate;
   (b) pass the scoped grant to `wayland-core` via `desktopContractV1` (the Core hook — Core
   ships NO localhost exception today, see `SecurityPane.tsx`); (c) an **HONEST** SecurityPane
   grant/revoke affordance that states "pending Core support" and NEVER implies localhost works
   (a fake toggle is the exact security theater the pane exists to avoid). Persistence key
   `project.capabilityGrants` already defined.
2. **COW-04 live population.** Ledger/enforcement/rendering built; live citations need Core to
   emit a `source_citation` execution-evidence event, then add it to the
   `WCoreExecutionEvidenceEvent` union + the `transformMessage` accept-list in `chatLib.ts`.
   Do NOT widen that security whitelist until Core emits the event.
3. **VOC-04 renderer surfacing.** Thread `VoiceReceipt` through IPC to a UI (advisory) — would
   expand `SpeechToTextResult`/`TextToSpeechBridgeResult` and touch exact-match tests.
4. **a11y residuals (non-blocking):** ~18 scattered settings-toggle labels (SystemModalContent/
   voice/models — proven aria-label pattern); ~24 Arco-internal ARIA nodes; one
   `.arco-empty-description` contrast node on guid-home.
5. **B-01 consent E2E** against the new test hooks (packaged): switch to hosted provider →
   assert disclosure → accept → assert persistence → assert unconsented path fails closed.
6. **Wave A sealed build** — Sean's CI trust-root action only; functional risk already retired.
   Build IMG-01/COW-06 are already in, so a preview cut now contains the image fix.
7. **Bugs filed this session:** onboarding-restarts-from-step-1 (persist progress —
   `A-02-FINDINGS-onboarding.md`); stale-bundled-artifact test fragility
   (`A-02-FINDINGS-test-fragility.md`); cold-start model resolver can pick a non-conversational
   model when the catalog has no marquee provider.

## Guardrails (still in effect)

- **LOCAL ONLY — no push / merge / release / deploy / PR without Sean.**
- Never touch the main checkout `~/gsd-workspaces/wayland-desktop-integration/app` … wait — THAT
  IS the integration worktree we use. The one to never touch is the primary canonical checkout
  and any other instance's dirty worktree. Do all work on `worktree-agent-desktop-integration`.
- Never run the Ferrox milestone lifecycle (deletes worktrees) or `build-package`/release.
- No AI signatures in commits (no Co-Authored-By / "Generated with").
- Never commit or log the Flux key. Do not circumvent the capability-seal attestation gate
  (sealed build is Sean's CI).
- The `bundled-officecli`/`constitutionFsAuthority.generated.ts` are build output — revert if a
  package build dirties them; DON'T commit. Clear stale `resources/bundled-officecli/` before a
  full suite (stale artifact fails 3 tests — see the fragility finding).

## How to verify (fast)

- Full unit suite: `npm test` (~2 min; expect the 1 WorkflowDetailModal flake — re-run it
  isolated to confirm: `npx vitest run tests/unit/renderer/pages/workflows/WorkflowDetailModal.dom.test.tsx`).
- a11y gate: `bun run test:e2e:a11y` (green 6/6). Re-record: `UPDATE_A11Y_BASELINE=1 bun run test:e2e:a11y`.
- Packaged smoke: `node scripts/packaged-cockpit-smoke.mjs` (rebuild first with `bun run package`
  after source edits — e2e loads the built `out/renderer`).
- Typecheck: `npx tsc --noEmit -p tsconfig.json`.

Source of truth: `.planning/STATE.md` + `.planning/ROADMAP.md` +
`.planning/phases/WLD-B-scope/B-DECISIONS.md`. Memory:
`wld-overnight-smoke-harness-2026-07-23` + `wld-voc03-a11y-inflight-2026-07-21`.
