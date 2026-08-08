# K-01 — 4-leg cross-audit record

**Phase:** K-01, move the launch-local MCP profile out of project config
**Audited commits:** `4c699b523` (RED), `c3beb0262` (GREEN), `df65b72d4` (SIGKILL proof)
**Date:** 2026-08-08

## Verdicts

| leg | verdict | notes |
|---|---|---|
| Codex 5.6 Sol | **NO-GO** | 7 findings. Pinned to `c3beb0262`; could not run Vitest under its read-only sandbox |
| Gemini 3.1 Pro | **NO-GO** | 4 findings. Its shell tool was blocked mid-run, so it reasoned from reads — findings still verified correct |
| Kimi K3 | **FIX-FIRST** | 4 findings. Ran the affected test files (32 passed) |
| internal `ferrox-code-reviewer` | **FIX-FIRST** | 1 finding, plus independent confirmation on nine other axes |

**Every finding below was reproduced by execution before being accepted.** No finding was taken on
a leg's word — one leg's headline claim (that the normal restore path blind-writes) had already been
disproved earlier in this milestone by running the test that covers it.

## Fixed in `8e36abf05` and the follow-up commit

| # | finding | legs | why it mattered |
|---|---|---|---|
| 1 | **Silent data loss.** The line scanner had no TOML string context, so a table header merely *quoted* inside a multi-line string started a removal block and deleted real user content up to the next header-looking line. The survivor still parsed, so the fail-closed guard never fired. | Gemini | The worst possible shape: silent, on a file the user owns, undetectable by the guard that exists to catch exactly this |
| 2 | **Secret leakage.** `smol-toml` echoes the offending source line verbatim; the global config holds `api_key` values, so a malformed line put a live credential in the thrown message, which reaches `mainError` unredacted before the UI-layer redaction applies. | Gemini, Kimi, Codex | A user's TOML typo could write their key to main-process logs and the renderer log stream |
| 3 | **Unactionable brick.** A config declaring `profiles` as an inline table can never accept a bracketed section, so every launch failed with an opaque "resulting content is not valid TOML". | Gemini | Failing closed is right; failing incomprehensibly is not. Now names the cause and the one-line fix |
| 4 | **Lease key not canonicalised.** The sibling workspace lease `realpath`s; this one did not, so two symlink aliases to one `config.toml` got separate leases and could interleave the transaction — B's restore baking A's temporary profile permanently into the user's real config. | internal, Kimi, Codex | The exact defence already built and tested for the *lower-stakes* workspace file was not carried to the higher-stakes one |
| 5 | **Quoted spelling bricked launches.** `[profiles."__wayland_desktop_session"]` is valid TOML for the same table; raw-string matching missed it, left the stale table, appended a second, and failed the output parse. | Codex, Kimi, internal | Bricked every managed launch until the user hand-rewrote otherwise-valid syntax |
| 6 | **First-run ENOENT.** On a clean machine the native config dir may not exist. Connector publication creates it, but a chat with **zero** connectors skips that path and still reaches the profile write, so the transaction wrote its sibling backup/marker into a missing directory and aborted the launch. | Codex | A first-launch breaker on a fresh install — the single most likely finding to hit a real new user |

Regression tests added: 9 (7 in the splice suite, 3 in the lease suite, minus overlap). Full suite
after fixes: **16,256 tests, 0 failed** (`success: true`), typecheck clean.

### One existing test was changed — deliberately, and it is not a weakening

`projectConfigLease.test.ts` case (c) asserted which of two **independent** keys entered first within
a tick. Canonicalising makes acquisition asynchronous, so that ordering is now scheduler-dependent
and was never a guarantee this lease makes. The test now asserts the invariant it actually describes
— B completes while A is held, A has *not* left, A finishes last — which is strictly stronger than
the ordering tuple it replaced. Same-key mutual exclusion is untouched and still covered by cases
(a), (b) and (d). All four legs independently confirmed `wcore-profileIsolation.test.ts` was
strengthened, not loosened.

---

## 🔴 OPEN — BLOCKING. K-01 is NOT signed off.

### O-1. The lease does not cover every writer to the file it protects

**Raised by:** Codex 5.6 Sol (finding 1). **Confirmed by inspection of the real code.**

`src/process/agent/wcore/configBridge.ts` writes the **same** global `config.toml` — it resolves the
identical target via `resolveActiveConfigPath()` (`configBridge.ts:76,163`) and serialises through
its own module-local `writeLock` (`configBridge.ts:105-109`), which has no relationship to
`withGlobalWCoreProfileLease`. Worse, it writes via `atomicWriteToml` — a **structured round-trip**
(`configBridge.ts:122-134`), precisely the operation the splice module forbids for this file because
it destroys user comments and formatting.

Connector publication also writes Core's startup config before spawn (`WCoreManager.ts:468-476`).

**Failure scenario.** Chat B reads the global config. Chat A takes the K-01 lease and splices in its
temporary profile. B then publishes its earlier snapshot through the unrelated `writeLock`:

- if B's write lands *without* A's profile, A's engine starts against bytes with no requested
  profile and fails with "Profile not found" — the exact bug K-01 exists to fix; or
- if B read *after* A's splice, B structurally reserialises the whole user config including A's
  temporary table, and A's hash-gated restore then preserves B's divergent bytes — permanently
  baking Desktop's internal profile into the user's config and destroying their comments.

**Why this is K-01's to own, not pre-existing:** before K-01, Desktop did not write the profile to
the global config at all, so `configBridge` was the only Desktop writer of that file. K-01 introduced
the second writer without unifying the lock.

**Fix direction (deliberately not attempted at the end of a long session):** put `configBridge`'s
mutate/write path behind the same global lease, or collapse both onto one lock. This must be designed
with the `withProfileAuthorityLock` ordering in mind — `configBridge` already takes that lock, so a
naive nesting introduces exactly the ABBA risk the other legs cleared this diff of. **This needs its
own packet and its own audit.**

### O-2. Deferred, needs Sean's sign-off: lease released before the engine tree is proven dead

**Raised by:** Codex (2), Gemini (4), Kimi (4) — three independent legs.

On a bootstrap that spawns but hangs, the 30s timeout leaves `childProcess` set, so `consumed` is
false and both restores are correctly skipped — but the lease is released as soon as `start()`
rejects, before `stopBootstrapEngine()` confirms the tree is dead. A sibling chat can then acquire
the lease and rewrite `config.toml` while the first engine is alive and may not yet have read it.

The `consumed` doctrine is **pre-existing and intentional** for the workspace file (the internal leg
confirmed K-01 mirrors it exactly). What changed is the stakes: the file left in place is now the
user's own. Self-heals on the next launch via `recoverProjectConfigTransaction`, so it is not data
loss — but the ordering contract in the plan says write → ingestion-confirmed **or tree-death
confirmed** → restore → release, and only the first half is honoured.

**Recommendation:** fold into the same packet as O-1, since both are about the lease's true extent.

### O-3. Accepted limitation, documented rather than fixed

A user who writes the reserved table using **dotted keys under `[profiles]`**
(`[profiles]` then `__wayland_desktop_session.mcp_servers = [...]`) still fails closed with a
message naming the reserved table. Reproduced by execution. Not fixed because it requires the user to
appropriate Desktop's internal identifier in a form Desktop never writes, the failure is closed
(no data loss), and full key-structure normalisation adds real parser complexity to a
security-sensitive splice. Recorded so nobody rediscovers it as new.

### O-4. Accepted, self-limiting

An external editor that saves the config *while* it is spliced bakes the reserved table into the
"original" snapshot. Cosmetic — Desktop strips any pre-existing reserved table on every subsequent
splice, so runtime behaviour stays correct. Worth revisiting when O-1 is fixed, because the clean
solution is the same: strip the reserved table from the content being backed up.

---

## Method note

Two of the four legs ran degraded — Gemini's shell was blocked, Codex could not run Vitest under its
sandbox — and **both still produced real, confirmed findings**. Kimi and the internal leg, which
could execute, each found something the others missed. The value came from the disagreement: no
single leg found all six fixed defects, and the two most serious (silent data loss, first-run ENOENT)
were each found by exactly one leg.
