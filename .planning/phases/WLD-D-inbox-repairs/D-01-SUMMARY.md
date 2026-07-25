---
phase: WLD-D-inbox-repairs
plan: D-01
github_issue: 890
status: complete-pending-full-packaged-smoke
---

# D-01 SUMMARY — #890 WhatsApp bridge never connects

**Outcome: FIXED and live-verified.** The bridge migrated off `child_process.fork` onto
`spawn` via `resolveJsRuntime()`; baileys reaches QR pairing under the bundled runtime with a
clean JSON-RPC stdout. Local only, nothing pushed.

## Root cause (research overturned the council's theory)
The council/handoff blamed `baileys.js` pino→stdout. Research + independent re-verification proved
that wrong: the real cause is the **RunAsNode fuse**. Packaged builds disable it (`afterPack.js`,
SEC-ELEC-05/#706), so `WhatsAppPlugin.forkBridge`'s `child_process.fork` booted a SECOND Electron
instance that lost the single-instance lock and `app.quit()`d (code=0) → 12-reconnect `error`;
baileys/QR never ran. `forkBridge` was the one spawn site never migrated to the shipped #706
`resolveJsRuntime()` pattern (`safeSpawn.ts:151-156`). A pino→stderr-only fix would have done
nothing, because baileys never even runs.

## What shipped (chosen approach)
- **Primary:** `forkBridge` `fork`→`spawn` via `resolveJsRuntime()` (bundled Bun when packaged),
  through a new pure `bridgeSpawnConfig.ts` (`buildBridgeSpawnConfig`) — unit-testable like
  `resolveJsRuntimeWith`. A1 (spawn), not A2 (utilityProcess): the fallback was never needed.
- **IPC resolution:** dropped the `'ipc'` stdio slot (no code carries data over process IPC —
  the only `process.send` was a presence heuristic). QR-to-stderr re-gated on a
  `WAYLAND_BRIDGE_UNDER_PARENT` env flag (runtime-agnostic; the old `typeof process.send` heuristic
  is invalid without an ipc channel).
- **Companion:** baileys pino pinned to fd2 via `bridgeLogger.js` (ships together — the leak goes
  live the moment baileys actually runs).
- **Hardening:** `handleFrame` object-guard so a JSON primitive pollution line can't `TypeError` out
  of the stdout `data` handler.
- Files: `WhatsAppPlugin.ts`, `bridgeSpawnConfig.ts` (new), `baileys.js`, `bridgeLogger.js` (new)
  + 11 test files (9 migrated fork→spawn mocks, 2 new Wave-0).

## Verification (Ferrox loop + live harness)
- **Plan:** `ferrox-plan-phase` (researcher → planner → plan-checker; checker caught a blocking
  false-green — acceptance must be a FUSED build, not `bun run package`).
- **Cross-audit:** `ferrox-code-reviewer` → GO, 0 Critical/High. `D-01-REVIEW.md`.
- **Verify (static):** `ferrox-verifier` → GOAL MET at unit/static level. `D-01-VERIFICATION.md`.
- **Verify (live, run by hand through the harness):** ran the real `bridge.js` under system Bun
  1.3.11 (= bundled version) with a `connect` RPC, fresh session. Result: `connection.status`
  starting→connecting, then a real **`qr.update`** frame (baileys reached QR — the exact step #890
  said never happens), then clean disconnect. **stdout = 6 frames, 0 pollution lines** (pino→fd2
  confirmed live). stderr carried baileys' 2 lines, both benign Bun `ws`-shim warnings
  (`'upgrade'`/`'unexpected-response'` not implemented in Bun) — QR reached despite them.
- Full unit suite **15,625/0**; tsc `--noEmit` clean.
- **baileys-under-Bun verdict: works** (QR pairing proven). The plan's A2 fallback is unneeded.

## Honest residual (what's NOT proven)
- The live smoke ran the bridge standalone under system Bun, not via the packaged `WhatsAppPlugin`
  inside a FUSED `.app` end-to-end. The spawn wiring is unit-locked and the runtime-critical path
  (Bun + baileys + stdout purity) is proven, so residual risk is low. A full fused packaged smoke
  is PARKED — it requires the capability-seal receipts ceremony (`WAYLAND_CAPABILITY_RECEIPTS_DIR`),
  owner/CI-adjacent. Note: the fix spawns bundled Bun directly, so it sidesteps the fuse by
  construction — the fuse itself was never the thing to re-test.
- Watch-item for the packaged/Windows run: confirm actual message **send/receive** under Bun's `ws`
  shim (QR pairing is proven; the 2 unimplemented ws events could matter for some WS edge cases).

## Follow-ups (cross-audit, both PRE-EXISTING — not D1 regressions, tracked separately)
- **WR-01:** the bridge child inherits full `process.env` (`bridgeSpawnConfig.ts`) rather than
  `safeSpawn`'s `buildChildEnv` allowlist. `fork` did the same, so not a regression — but a real
  hardening gap given the child runs third-party npm (baileys). Worth a ticket.
- **WR-02:** dead per-instance session isolation — `--session` is never passed to the bridge; the
  `WhatsAppPlugin.ts:338` comment is stale. Pre-existing.
- Nits: a `handleFrame` comment overstates array handling; two stale `forkSpy` spy names.
