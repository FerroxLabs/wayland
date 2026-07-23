# HANDOFF — 2026-07-23 — Milestone D: Desktop Inbox Repairs

**Read this first on resume.** All code work is LOCAL on branch
`worktree-agent-desktop-integration`, in the **canonical Ferrox Desktop worktree
`~/dev/wayland-worktrees/desktop-integration`** (a worktree of `~/dev/wayland/app`, remote
`ferrox` → FerroxLabs/wayland). Run tooling from there. **DO NOT use the old
`~/gsd-workspaces/wayland-desktop-integration/app`** — that stray clone-of-a-clone was abandoned
2026-07-23 when Sean had the branch relocated into canonical (it was 509 ahead / 0 behind main,
a clean push). D1 (#890) build is in progress here; latest checkpoint `f2a4a4bce`. Nothing pushed
to the `ferrox` GitHub remote without Sean.

## What just happened (this session)
Two things: (1) shipped a set of desktop fixes locally; (2) triaged the whole GitHub
inbox with a 3-agent research council and executed the comms, and now Milestone D is
approved to build the confirmed repairs through Ferrox Factory.

### Local commits this session (on top of Milestone-B handoff `80072f7f5`)
- `902afd147` a11y trust-floor (8 gated rule-IDs cleared)
- `3c11691b4` B-01 hosted-voice consent E2E (2 tests)
- `fd1ad049e` onboarding resume-across-remount fix (3 DOM tests)
- `25a69fd3d` #836 success-green contrast (emerald-400→700, 5.48:1)
- `730230eaf` #842 workflow awaiting_input notification (+2 tests)
- doc commits: `dd0c760dc`, `ac0b563ff`, `59a9c879a` (INBOX-TRIAGE.md), `9db87f1eb`
- Full suite last green at **15,615/0** (recurring constitution flake under parallelism,
  passes isolated — NOT ours).

### GitHub inbox — EXECUTED (live on FerroxLabs/wayland, done, not pending)
Via `gh` as FerroxLabs, Sean Writer voice, zero em dashes, signed "The Wayland Team":
- **Closed 11:** #645, #490, #180, #663, #780 (already-fixed, cited commit); #871/#898/#917
  (empty stubs); #915 (dup of #916); #409 (stale); #446 (support answered). (#275 was already closed.)
- **Need-info posted (kept open, labeled state:needs-info):** #902, #449, #487, #507, #916, #396, #873.
- **Relabeled enhancement + replied:** #909, #910.
- Open count ~141 → ~133.

## Council findings that reshaped the plan (verified against code)
- **Owner was right — already shipped, closed:** #645 terminal mode (`41a4b768f`), #275 AV
  false-positive (skill-pack #309, zero loose SKILL.md + release gate), #490 Windows registry
  residue (`3afb6b93c`), #663 approval/trust HITL (`602db7db0`+`b3ed2e7b5`+`e9ce0d4f7`), #180
  History timeline (`ProjectHistoryPanel.tsx`).
- **Signing, for the record:** desktop app IS Authenticode-signed (Windows Azure Trusted
  Signing `electron-builder.yml:199-213`, CI refuses unsigned) + macOS notarized. The bundled
  `wayland-core.exe` is only linker-signed (`electron-builder.yml:251`, signIgnore `:256-261`) —
  so the #914 Smart-App-Control gap is CORE-side, not desktop.
- Provider/routing batch (#897/#902/#685/#487/#507/#551/#396/#503) is mostly Core-side; several
  were reported ON 0.11.18 which already carries the candidate desktop fixes.

Full triage record: `.planning/INBOX-TRIAGE.md`.

## MILESTONE D — Desktop Inbox Repairs (APPROVED — build in this order)
Each phase runs the full Factory loop: `ferrox-plan-phase` → build → independent cross-audit →
full unit suite + a11y gate → live-verify → ship. Stamp each issue `github_issue: NN` in the
plan frontmatter so it auto-closes on merge. **NO push/merge/release without Sean.**

Execution order: **D1 → D2 → D3 → D5, then D4 last.**

### D1 — Bridge reliability
- **#890 WhatsApp bridge (FIX, S-M).** Root cause: `src/process/channels/whatsapp-bridge/backends/baileys.js:121`
  `pino({level:'warn'})` logs to fd 1 (stdout) — the SAME channel as the bridge's JSON-RPC framing —
  so any warn corrupts a frame → bridge exits code=0 → 12 reconnects → error. Fix: route pino to
  stderr (`pino({level:'warn'}, pino.destination(2))`) and/or make `consumeStdout`
  (`WhatsAppPlugin.ts:770-785`) defensively skip non-`{`-prefixed lines. CAVEAT before closing:
  the reporter's `[Wayland:init]`/MCP-scripts lines come from main-process `initStorage.ts` and
  cannot reach an isolated child pipe by that path — confirm log-file conflation vs a real
  fd-sharing bug in a Windows packaged repro.
- **#537 (VERIFY only).** Desktop host-send hook already merged (`f9c0a1c9b`: `hostSendMessage.ts`,
  `protocol.ts` host_send_message_request/result, `envBuilder.ts` sets WAYLAND_SEND_MESSAGE_HOST_DELEGATE=1).
  Dormant until Core emits `host_send_message_request`. Verify the Core hook shipped in the bundled
  binary, live-verify an agent email send, then close. Channel code byte-identical 0.12.17..0.12.19 —
  do NOT tell users "upgrade Core".

### D2 — Skills trust
- **#885 Skill Guard (FIX, M).** `SkillSource` (`src/common/types/skillTypes.ts:11`) =
  `'wayland-library'|'team'|'user'|'imported'|'cli-discovered'` — NO builtin/vendored provenance and
  NO source-based quarantine exemption. `SkillLibrary.rescanStale` (`SkillLibrary.ts:549-608`) filters
  by scannerVersion only, so builtin (`wayland-library`) skills hit the same `SkillGuard.scan` (`:580`)
  as imported; a `blocked` verdict refuses body load (`:432`). `TRUSTED_SOURCES={'wayland-library','team'}`
  (`:305`) is used only for import de-dup, never to skip the guard. Fix: exempt wayland-library/team
  from quarantine (trust-by-default unless an explicit integrity failure) + store user unblock overrides
  in user-data keyed by skill id+contentHash (packaged skill dirs aren't writable).

### D3 — Honest diagnostics (rolls up to Sean's #656 principle)
- **#891 Memory false "Degraded" (FIX+BUILD, S+M).** The desktop probe/Test button does a stdio MCP
  round-trip: `IjfwSetupStatus.tsx:82` invokes `{verb:'state'}` via `ijfwMcpClient` which SPAWNS
  `~/.ijfw/mcp-server` over stdio (`ijfwMcpClient.ts`). It never touches the daemon HTTP
  `/api/health` on `127.0.0.1:37891` the reporter cited (grep 37891/api/health in src/process = 0 hits),
  and the probe failure is UNLOGGED. Fix: (a) log the real MCP spawn/handshake failure reason (reporter
  explicitly asked); (b) reconcile surfaces — surface the real reason and/or probe the endpoint the
  memory actually uses.
- **#853 Surface real errors (BUILD, M). SCOPE (Sean's call): exec/process failures only.** Raw provider
  API errors already surface verbatim; the gap is core/exec-level failures (AV/firewall/signature/spawn)
  showing generic text. Surface wcore process/exec stderr + a discoverable log link on those failures.
  NOT a full error-taxonomy rebuild.

### D5 — UI clarity batch
- **#909 (BUILD, S).** Runtime pill shows the assistant (Concierge) and hides the runtime (Wayland Core);
  surface the runtime alongside the assistant.
- **#910 (BUILD, S).** Align labels: pin action vs "Starred", "Chats" vs "Conversations".
- **#508 (BUILD, S).** Cost UI already built (`src/renderer/pages/mission-control/cost/`: CostTab,
  BudgetsPanel, CostBreakdown, BudgetBar, BudgetGateModal, wired `mission-control/index.tsx:336-338`).
  Remaining delta only: a compact spend indicator on the top bar / project page.
- **#882 (BUILD, S — LOWEST priority).** `ConversationTabs.tsx` renders `tab.name` only (~line 606);
  add a secondary project label per tab.

### D4 — Token efficiency (money, GATED, build LAST)
- **#723 (FIX, L). Sean's arch call = IN-PLACE per-step context reset** (confirm once more before building,
  since it's money + UX). The autonomous path is already scoped (`dispatchAutonomousStep.ts` spawns a
  fresh child per step, `composeDirective:79-90`). The IN-CONVERSATION auto-advance is not: `parentTurnDriver.ts`
  → `WorkflowSessionService.continueRun` sends the next-step directive into the SAME conversation
  (`parentTurnDriver.ts:8-30`), inheriting the full transcript 1..N; no capping in parentTurnDriver/runDriver;
  `composeStepContext.ts` only prepends an 8KB step block, no reset. Fix = per-step context reset/summary
  in the in-conversation advance path. Pairs with a Core tail-cap for defense-in-depth.

## Not desktop code — Sean's routing/product calls (pending, not blocking D)
- **#914** — Authenticode-sign the Windows `wayland-core.exe` (Core). Rec: route to Core.
- **#685** — Sub + "Anthropic API off" still calls Anthropic (money). Rec: Core, hard block-when-off guard.
- **#247** — app exit reaps user-launched agent CLIs. Rec: keep reaping default + add "leave running" opt-out.
- **#551** — Intel-mac 30s wcore timeout. Rec: confirm Intel-mac support; yes → Core perf, sunsetting → close won't-fix.

## Guardrails (in effect)
- LOCAL ONLY for code — no push/merge/release/PR without Sean. GH issue triage comments are authorized (done).
- Every FIX goes through the Ferrox Factory disciplined workflow, not ad-hoc.
- gh writes: FerroxLabs account (re-assert — drifts to TradeCanyon), no backticks in comment bodies,
  Sean Writer voice, zero em dashes, "All the best, The Wayland Team".
- No AI signatures in commits/PRs.
- Always `bun run package`, NEVER raw `npx electron-vite build` (skips prepackage → launch artifacts missing
  → packaged app crashes on launch). Revert `src/process/services/constitution/constitutionFsAuthority.generated.ts`
  after any package build. Constitution tests flake under full-suite parallelism (pass isolated).
- SBX-02 wiring / COW-04 live citations = Core-gated; don't build against the moving Core.

## Verify commands
- Unit suite: `npm test` (~2 min; expect the constitution flake, re-run isolated to confirm).
- a11y gate: `bun run test:e2e:a11y` (green 6/6; `UPDATE_A11Y_BASELINE=1 ...` to re-record).
- Typecheck: `npx tsc --noEmit -p tsconfig.json`.
- Packaged smoke: `node scripts/packaged-cockpit-smoke.mjs` (rebuild `bun run package` after source edits).

## RESUME
Proceed with **Milestone D in order D1 → D2 → D3 → D5 → D4**. Start by running
`ferrox-plan-phase` on **D1** (#890 fix + #537 verify) using the root-cause map above, build it,
independent cross-audit, full-suite + a11y verify, live-verify, ship. Then D2, D3, D5. D4 last —
reconfirm the #723 in-place-reset arch with Sean before building.
Source of truth: this file → `.planning/STATE.md` → `.planning/INBOX-TRIAGE.md`.
