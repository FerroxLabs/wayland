# Milestone D — Desktop Inbox Repairs (CONTEXT)

**Created:** 2026-07-23 · **Status:** ACTIVE (planning D1) · **Base:** `worktree-agent-desktop-integration` (LOCAL)

Milestone D builds the GitHub-issue repairs that a 3-agent research council confirmed are
**desktop-side and Core-independent**. It runs while wayland-core is being rebuilt, so nothing
here may depend on the moving Core (SBX-02 wiring, COW-04 live citations stay out — Core-gated).

Full triage + root-cause map: `../../HANDOFF-2026-07-23-milestone-D-inbox-repairs.md`,
`../../INBOX-TRIAGE.md`. Milestone table + resume: `../../STATE.md`.

**Acceptance model (unchanged since the 2026-07-20 pivot):** Sean + Claude live-test together;
a green Playwright/unit sweep IS acceptance. Each fix stamps `github_issue: NN` in its PLAN.md
frontmatter so it auto-closes on merge. These `D-*` packets are the human work-tracking unit; a
SUMMARY is written when a packet is live-test-accepted.

## Phases (build order D1 → D2 → D3 → D5 → D4)
- **D1 — Bridge reliability** (ACTIVE): #890 WhatsApp bridge (FIX) + #537 host-send (VERIFY-only).
- **D2 — Skills trust:** #885 Skill Guard builtin exemption (FIX).
- **D3 — Honest diagnostics:** #891 Memory false "Degraded" (FIX+BUILD) + #853 surface exec errors (BUILD).
- **D5 — UI clarity:** #909 runtime pill, #910 naming, #508 top-bar spend, #882 project-name-on-tabs (all BUILD, S).
- **D4 — Token efficiency** (LAST, gated): #723 in-place per-step context reset (FIX, L) — reconfirm arch with Sean.

## D1 scope + VERIFIED code facts (as of HEAD c33d7faef, this tree)

### #890 — WhatsApp (baileys/personal) bridge never connects (FIX)

> **▶ RESEARCH VERDICT (2026-07-23, AUTHORITATIVE — see `D-01-RESEARCH.md`, independently re-verified).**
> Real root cause is the **RunAsNode fuse**, NOT stdout pollution and NOT pino. `forkBridge`
> (`WhatsAppPlugin.ts:34,687`) uses `child_process.fork`, which Electron breaks once the RunAsNode
> fuse is disabled — and `afterPack.js` (`applyElectronFuses`, SEC-ELEC-05, #706) disables it on every
> packaged build. So in a packaged app the "fork" boots a SECOND Electron instance that loses the
> single-instance lock and `app.quit()`s (code=0) → 12× reconnect ladder → status `error`; baileys/QR
> never run. This is the same #706 breakage already fixed at `safeSpawn.ts:151-156` via
> `resolveJsRuntime()`; `forkBridge` is the one spawn site never migrated. The `[Wayland:init]`/"MCP
> scripts" strings are the primary app's logs conflated into the shared Windows log (H2), not pipe
> pollution (zero app-log `console.log`s exist in the bridge child). **Primary fix = migrate
> `forkBridge` fork→spawn via `resolveJsRuntime()` (fallback `utilityProcess` if baileys is
> Bun-incompatible); pino→stderr is a necessary COMPANION (dormant until baileys actually runs), not
> the fix.** The competing-hypotheses notes below are the pre-research investigation trail, kept for
> provenance — the research verdict supersedes them.

Reporter (Windows, desktop bundling core 0.12.24): bridge subprocess starts, "Wayland's own
startup log lines" (`[Wayland:init] …`, "MCP scripts present", "Adopting existing Playwright MCP
server") land on the stdout the bridge uses for JSON-RPC, host logs "bridge emitted invalid JSON",
bridge exits code=0, 12 reconnects, status `error`, never reaches QR. `last_connected` stays null.

Verified in-tree (do not re-derive; the researcher confirms/extends):
- `whatsapp-bridge/bridge.js:96` frames protocol as `process.stdout.write(JSON.stringify(obj)+"\n")` on fd1.
- `whatsapp-bridge/backends/baileys.js:121` `const logger = pino({ level: 'warn' })` — pino defaults to
  fd1 (stdout), the SAME channel. baileys.js:196-200 already routes the QR render to stderr when there is
  an IPC parent, so the codebase already treats stdout as protocol-only — pino is the remaining fd1 leak
  *from inside the child*.
- `WhatsAppPlugin.ts:687-690` forks the bridge with `stdio: ['pipe','pipe','inherit','ipc']` →
  **child stdout is a PRIVATE pipe** (only the child writes it; host reads it in `consumeStdout`),
  **child stderr is INHERITED** (parent's fd2). So main-process `console.log` of `[Wayland:init]`/"MCP
  scripts" **cannot physically enter the child's stdout pipe** — the reporter's literal mechanism does
  not hold by that path.
- `WhatsAppPlugin.ts:780-795` `handleFrame` **already tolerates** invalid JSON: `JSON.parse` in try/catch,
  logs "bridge emitted invalid JSON" and returns — it does NOT crash or exit. A pino NDJSON line would
  parse as valid JSON, match neither `id` nor `method`, and be silently dropped. So the reported
  "throws → bridge exits code=0" is NOT explained by the current handleFrame.

**Unresolved (the research pass must nail before we write code):**
1. **How do those exact `[Wayland:init]`/"MCP scripts present"/"Adopting … Playwright MCP" strings reach
   the frame parser?** Leading hypothesis: the forked bridge entry transitively imports app/bootstrap
   code (or runs MCP/Playwright adoption inside the child) that `console.log`s to the child's OWN fd1 →
   into the protocol pipe. Alternative: pure log-file conflation (reporter pasted the shared log where
   main-process stderr + child output interleave) and the real parse failures are baileys/pino lines.
   Resolve by tracing the bridge child's import graph + any console.log-to-stdout inside it, and by
   git-checking whether the tolerant `handleFrame` post-dates the reporter's build.
2. **What actually exits code=0?** Current handleFrame doesn't. Candidates: a child crash on a failed
   transitive import; a startup ready/handshake frame that never arrives (poisoned first line) → timeout;
   or the reporter's build predates the tolerant handleFrame. Confirm the real exit path.

**Fix direction (to be finalized by planner from RESEARCH.md):** guarantee the child's fd1 carries ONLY
JSON-RPC frames — (a) route baileys pino to stderr (`pino({level:'warn'}, pino.destination(2))`),
(b) eliminate/redirect any app-log `console.log` that runs inside the bridge child to stderr, (c) keep
`consumeStdout`/`handleFrame` defensively skipping non-frame lines without ever exiting. Windows packaged
repro is the acceptance surface for the reported symptom; a unit/integration test around consumeStdout +
a stdout-purity assertion is the automated floor.

### #537 — engine send_message "unknown channel: email" (VERIFY-only)
Desktop host-send hook already merged (`hostSendMessage.ts` present, 6713 bytes; `protocol.ts`
host_send_message_request/result; `envBuilder.ts` WAYLAND_SEND_MESSAGE_HOST_DELEGATE). Dormant until
Core emits `host_send_message_request`. Channel code byte-identical 0.12.17..0.12.19 — do NOT tell users
"upgrade Core". D1 task = verify the Core hook is present in the bundled binary, live-verify an agent
email send end-to-end, then close (or, if Core hook absent in the bundled engine, route to Core and mark
#537 blocked-on-Core, do NOT ship a desktop change). This is verification, not construction.

## Guardrails
LOCAL only — no push/merge/release/deploy without Sean. Never touch `/Users/seandonahoe/dev/wayland/app`.
Every FIX runs the full Factory loop: research → plan → build → independent cross-audit → full unit suite
(`bun run test:vitest`) + a11y gate (`bun run test:e2e:a11y`) → live-verify → ship. **Always `bun run
package`, never raw `npx electron-vite build`** (raw skips the prepackage hook → packaged app crashes on
launch); revert `constitutionFsAuthority.generated.ts` after any package build. Constitution tests flake
under full-suite parallelism (pass isolated) — not a regression. gh writes use FerroxLabs, Sean Writer
voice, zero em dashes, no backticks in comment bodies, signed "All the best, The Wayland Team". No AI
signatures in commits/PRs.
