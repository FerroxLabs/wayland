# HANDOFF — Milestone WLD-K "Core First"

**Written 2026-08-08. Branch `packet/attribution-audit`, pushed to `ferrox`, 0 unpushed.**
**Worktree: `~/dev/wayland-worktrees/packet-attribution`. Head at handoff: `246d890cb`.**

---

## 1. Read these first, in this order

1. `.planning/phases/WLD-K-core-first/L-1-RESULT.md` — the live-verification result and the
   corrected diagnosis. **This is the current front line.**
2. `.planning/phases/WLD-K-core-first/LIVE-VERIFY.md` — the six-check gate, L-1…L-6.
3. `.planning/phases/WLD-K-core-first/K-01-CROSSAUDIT.md` — 4-leg audit record, 6 fixed findings,
   4 tracked open items.
4. `.planning/MILESTONE-WLD-K-core-first.md` — the original packet definitions.

Do **not** re-derive anything in those. They are verified.

## 2. North star

The Master Class in ~3 weeks demonstrates **Wayland architecture** — Wayland Desktop driving
Wayland Core. Claude Code as backend is a fallback, not the story. A non-technical user must succeed
on Wayland Core.

## 3. ENGINE: use 0.12.26

**Core v0.12.26 is PUBLISHED** — tag `v0.12.26`, GitHub release `isPrerelease: false`, published
2026-08-08T03:46:19Z, npm `latest: 0.12.26`, source commit `98ad1c283…`.

- Select it with `WCORE_VERSION=v0.12.26`.
- **The committed pin `DEFAULT_WCORE_VERSION` in `scripts/prepareWaylandCore.js:213` is STILL
  `v0.12.25` and must stay there until L-1 passes.** The bump is Sean's call and a
  release-trust-boundary change. L-1 passing is the evidence that makes it safe.
- **Trap:** the bundled binary at `resources/bundled-wayland-core/darwin-arm64/wayland-core` also
  reports `0.12.26` but is the **rc.2** artifact. Version string cannot distinguish them — use
  `--build-info` and check the source commit. A result attributed to the wrong engine is worse than
  no result.
- `bundled-wcore-shasums.json` does not yet contain stable v0.12.26, only rc.2. Do not hand-edit it.

**0.12.25 can only ever prove bootstrap + config hygiene.** It predates the W-0 fix, so ToolSearch
cannot see MCP tools there. The headline claim is demonstrable **only on 0.12.26**.

## 4. What is built (all pushed, nothing merged or tagged)

| packet                        | state                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| K-01 profile → global config  | built, 4-leg audited, **6 defects fixed**, live-verified as _working_ for config plumbing |
| K-02 honest failure surfacing | built; **gap found by L-1 — see §5.2**                                                    |
| K-03 turn that never finishes | built, 2-leg audited, 3 defects fixed; **live-verify still owed**                         |
| K-04 RC policy + Core handoff | decided and committed                                                                     |
| K-05 / K-06 / K-07            | **not started**                                                                           |

Suite: **16,292 tests, 0 failed** (baseline at milestone start was 16,231). Typecheck clean.

## 5. THE THREE NEXT ACTIONS, in order

### 5.1 Regenerate the Core contract fixture against stable 0.12.26 — **the blocker**

`src/process/agent/wcore/desktopContractV1.ts:20` pins `major:1, minor:0`, generated 2026-08-01 from
Core producer commit `d0aa0abc75af…`. Stable 0.12.26 negotiates a **different contract minor**, so
`assertDescriptor` (`desktopContractV1.ts:181`) rejects the handshake with `contract_minor_mismatch`
before any chat runs. Fixture is `contracts/wayland-desktop-core/v1/manifest.json`; generator is
`wcore-desktop-contract-gen/1`.

**DO NOT loosen or delete the minor check to make this pass.** It exists to stop Desktop talking to
an engine whose contract it does not implement. Regenerate the fixture; the assertion stays strict.
This project has weakened a real check once to satisfy a fixture artifact — a cross-audit caught it,
not the author. Do not repeat that.

### 5.2 Extend K-02 to the contract-rejection path

On `contract_minor_mismatch` the user sees **nothing at all** — the chat hangs at "queued"
indefinitely. K-02 exists to make engine failures honest and covers the stderr/start-failure paths,
but not this one. A silent hang is the exact failure mode K-02 was written to eliminate. In scope.

### 5.3 Re-run L-1 on 0.12.26, then L-2 … L-6

Keep 0.12.25 in the matrix for bootstrap + config hygiene only. **Rebuild `out/` first**
(`bun run package`) — a stale build silently tests stale code, which already cost one run.

## 6. Tracked open items (from `K-01-CROSSAUDIT.md`)

- **O-1** `configBridge` writes the same global `config.toml` under an unrelated `writeLock`. The
  _damaging_ branch is closed (it now refuses to persist the ephemeral profile). What remains is
  transient: a settings write in the exact second a chat launches can cost that launch its profile
  ("Profile not found"), no persistent damage. Durable fix = unify the locks; **needs its own packet
  and audit** because `configBridge` takes `withProfileAuthorityLock` then its own `writeLock`, and
  a naive nesting reintroduces the ABBA risk three audit legs cleared.
- **O-2** the global lease is released before the engine tree is proven dead on a hung bootstrap.
  Pre-existing doctrine, higher stakes now. Fold into the O-1 packet.
- **O-3** a dotted-key spelling of the reserved table still fails closed. Accepted, documented.
- **O-4** an external editor saving mid-splice bakes the reserved table in. Self-limiting.

## 7. Credentials

- Flux burn key: `~/.config/wayland-smoke/flux-burn-key` (0600, outside the repo).
  **Sean should rotate it — it was pasted in chat.** Pre-existing key: `flux-test-key`.
- Never print, echo, commit, or log either. Reference inline via `$(cat …)`.

## 8. Machines

| box            | address                         | notes                                         |
| -------------- | ------------------------------- | --------------------------------------------- |
| this Mac       | —                               | darwin-arm64                                  |
| `seandesktop`  | `100.109.207.54` (Tailscale)    | Windows, online. PowerShell uses `;` not `&&` |
| `wayland-soak` | `100.81.158.63` (Tailscale SSH) | Linux, Ubuntu 24.04, node v22.21.1, online    |

`hetzner-dsm` (95.216.244.213) is the Donahoe Sales Machine — **different project, not this one.**

K-05/K-06/K-07 acceptance needs all three OSes. These are Sean's **working** machines, not clean
VMs, so uninstall-by-manifest (INS-05) is what protects them.

## 9. Non-negotiable guardrails

- **No merge, no tag, no release, no PR without Sean.** `build-and-release.yml` fires on **ANY** tag.
- **Never commit `src/process/services/constitution/constitutionFsAuthority.generated.ts`.** It is
  permanently modified in the working tree, along with `AGENTS.md`. Neither is ever staged.
- **Never relax, skip or delete an existing test to make something pass.** Fix the cause.
- Never weaken the security shell (`sandbox: true`, `contextIsolation: true`,
  `nodeIntegration: false`, CSP, `bridgeAllowlist.ts`, `urlValidation.ts`, DOMPurify, `safeStorage`).
  Never touch the signing pipeline. Any new flag defaults OFF.
- `migrations.ts` `aionrs` SQL literals never change. `FoundrySkills`/`foundry-skills` never renamed.
- `prek run --all-files` is forbidden. No history rewriting. No AI attribution trailers.
- gh writes must be **FerroxLabs** (drifts to TradeCanyon). No backticks in gh/wl comment bodies.
- Never touch `/Users/seandonahoe/dev/wayland/app` — the canonical tree. Work stays in the worktree.
- TVControl's `ui_evaluate` stays behind `TV_MCP_ADVANCED=1`.
- **Do not drive Sean's live TradingView chart into a changed state.** Prefer read-only tools;
  record and restore if you must change symbol/timeframe. This has bitten before.

## 10. Method rules that earned their place this milestone

- **Verify by EXECUTING, never by reading.** Every wrong turn came from asserting unrun behaviour.
- **Confirm a method finds a KNOWN POSITIVE before believing a zero.** This caught a false finding
  (a substring match inside `DEFAULT_WCORE_VERSION`) that would have made a whole decision doc wrong.
- **A RED test must fail for the RIGHT reason.** Two did not; the fixtures were wrong, not the code.
- **Never special-case by array index.** A magic index mis-applied itself the moment a pattern was
  inserted above it.
- Cross-audit legs disagree, and that is the value: no single leg found all defects, and the two most
  serious were each found by exactly one leg. Sean's call: **weight Codex 5.6 Sol and Kimi K3;
  Gemini is degraded** (its findings still verified out, but it ran with a blocked shell).
