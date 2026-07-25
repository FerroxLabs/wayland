# Milestone F — CI Truth (make the gate mean something)

**Why this milestone exists:** Milestone E got the branch onto CI for the first time (PR #925) and CI
immediately proved that a green check on this repo does not mean the code works. Everything below is
open work carried out of E, ordered by blast radius.

**Standing rule for every packet here (Sean, 2026-07-25):** green code tests are not the test. The test
is booting the PACKAGED artifact and using it as a user. Every packet ends with a live run, not a report.

---

## F-01 · Close the required-checks bypass (HIGHEST — do first)

**Problem (proven live on #925):** `main` protection is `enforce_admins: true`, `required_reviews: 0`,
required checks = `Code Quality`, `Unit Tests (macos-14)`, `Unit Tests (ubuntu-latest)`,
`Unit Tests (windows-2022)`. `pr-checks-docs.yml` publishes three of those as literal
`echo "Docs-only PR, skipping unit tests."` jobs. Its `paths: ['**/*.md', ...]` trigger fires when ANY
changed file matches, so a mixed PR (code + one markdown) runs BOTH workflows and the stub reports green
under the required names. The real `pr-checks.yml` additionally gates all 9 jobs on
`draft == false` while the stub's echo jobs have no draft gate, so a draft PR runs zero real checks and
still shows required checks green.

Observed on #925: 7 of 8 unit shards FAILING, I18n FAILING, Code Quality FAILING, all three required
`Unit Tests (...)` reporting PASS.

The real aggregator already states the principle the stub breaks: "a required check must never report
green when the tests it gates did not actually run."

**Do:** make the stub mutually exclusive with the real gate. A `paths:` filter cannot express
"docs-only", so compute it: a first job that diffs base..head and exits early unless EVERY changed file
is docs. Alternatively stop reusing the required-check names in the stub and give the docs path its own
names. Prefer the former so docs-only PRs still satisfy protection.

**Verify:** on a scratch branch, (a) a docs-only PR satisfies the required checks, (b) a mixed PR does
NOT get green required checks while real tests fail, (c) a draft PR does not report green required
checks. Evidence pasted into the packet, not asserted.

**Until this lands: do not merge #925 on a green required check.** See
[[ci-required-checks-bypass-docs-stub]].

## F-02 · recoveryCapture SNAPSHOT_FILE_TYPE on ubuntu

**Diagnosed, not fixed.** `tests/unit/process/services/recovery/recoveryCapture.test.ts` fails on the
Linux runner with "Built recovery point failed verification: SNAPSHOT_FILE_TYPE".
`recoveryManifest.ts:1129/1153` raises that code when a snapshot inventory contains a symbolic link or
an unsupported entry. So the capture tree differs on Linux (bun's installs create symlinks that macOS
layout does not), which makes this the same defect class as the two already fixed this session: a test
inheriting ambient machine state instead of controlling it.

**Do:** make the capture tree explicit (fixture dir the test builds), not whatever is on disk. Do NOT
relax the symlink assertion — it is a real integrity rule.

**Verify:** passes on ubuntu, macos and windows shards in CI, plus locally.

## F-03 · Redo the formatting pass safely

**Reverted in `aea1b4820` because it broke the build.** oxfmt pretty-printed
`resources/modelsdev-snapshot.json` (a minified, SHA-256-and-size-pinned supply-chain snapshot) from 1
line to 103,798, so `verify:modelsdev-snapshot` failed the pinned hash and no packaged build could
complete. It also reformatted 20+ `contracts/` wire schemas and compat fixtures. The full unit suite,
tsc, and CI's own formatter all approved that change; only running the build caught it.

**Do:**
1. Fix the hook first: `.pre-commit-config.yaml` oxfmt `exclude:` currently covers only
   `src/process/resources/(skills-library|bundled-workflows)/index.json`. It must also exclude
   `resources/modelsdev-snapshot.json`, `contracts/**`, and any other pinned/generated artifact. Its
   `files:` regex also omits `.mjs`, so 4 such files were never routed to the formatter.
2. Then reformat only this branch's delta minus those exclusions (~358 files last time).

**Verify:** `bun run verify:modelsdev-snapshot` passes, packaged build completes, packaged smoke PASSES.
Code Quality (Oxfmt) is red until this lands — accepted, documented.

## F-04 · Issue + decision hygiene

- **#910b "Chats"** — ratified (keep `8f713ea04`); record the ratification, no code change.
- Confirm no other issue was marked fixed while unreleased. #537 is correctly
  `state:fixed-pending-release`, comment posted, left open.

## F-05 · Reconcile the external cleanup plan (`~/Downloads/wayland-desktop-cleanup-plan.md`)

**Key insight: that audit was taken at commit `1b1c1e9`, which is exactly this branch's merge-base.** It
describes shipped v0.11.18, not this branch — its acceptance bars cite "968 unit tests" where this branch
has 15,718. So some findings may already be fixed here.

**Do:** produce a truthful per-packet status (already-fixed / still-open / superseded) before anyone
starts work, so nothing is redone. Its P0-1 (ACP bridges resolved via `bunx @latest` at spawn time =
RCE on every user if any of those npm packages is compromised) is the same supply-chain class as the two
pin problems hit this session and wants the same pinned-manifest treatment.

**Note its guardrails:** never weaken the security shell, never touch the signing pipeline, one packet
per PR, no bulk cleanup bombs (F-03 is the cautionary example), no history rewriting.

## F-06 · Sealed build — GATED ON SEAN

Needs a protected `release-trust-v1` branch and repo variable `WAYLAND_RELEASE_TRUST_ROOT_SHA` pinned to
its reviewed commit. Neither exists. **Deliberately not done by the agent:** the agent that builds
releases must not mint the authority that validates them — the same boundary D-08 refused to cross.

**Verify:** packaged smoke PASS against a SEALED distributable, plus notarization confirmed on the
artifact (notarization itself is already fully wired: `afterSign.js` for the .app, `notarizeDmg.js` for
the dmg, all six Apple/Azure secrets present).

## F-07 · IJFW Memory looks permanently broken once Skip is on (Sean's live find)

**Symptom Sean hit on released 0.11.18:** Settings > IJFW Memory reported "IJFW installed: Not
installed yet" and "Memory runtime: Waiting for install" while IJFW 1.6.5 was present in
`~/.ijfw/mcp-server`, and Test said "Memory did not respond". Turning Skip off did not fix it.
Turning it off and on again did not fix it. Reinstalling IJFW did not fix it.

**Root cause:** the toggle only persisted `ijfw.skipSetup`. Bootstrap had already run at app boot and
short-circuited on the `opt_out` branch, so turning Skip back off re-ran nothing: the lifecycle
status stayed `opt_out`, the checklist kept rendering the pre-toggle snapshot, and `runtimeMode` was
never enabled. Only a full app restart could recover it, and nothing on the page said so. For a
customer that is indistinguishable from a dead feature.

**Fixed in `b80ad8beb`** (no new i18n keys):
- switching Skip OFF now invokes `ijfw.triggerInstall` — the same bootstrap the Memory page's install
  button already used — and surfaces its error if it refuses to start
- the panel stays subscribed to `ijfw.onStatusChanged`, so `installing` → `installed_current` lands
  on the checklist live instead of waiting for a restart
- the panel's DOM suite mocked `ipcBridge.ijfw` without `onStatusChanged` or `triggerInstall`, so
  neither path had any coverage; 6 tests added, 43 green across the three IJFW suites

**Ruled out on the way (do not re-chase):** the #706 fused-runtime bug (0.11.18 does ship
`resolveJsRuntime` + bundled Bun); a broken install (the server starts and answers `initialize`
correctly from the CLI even with no `node_modules`); a phantom opt-out (the flag really is persisted
— the config store is base64, so plaintext greps for it return nothing).

**STILL OPEN — the testability hole that let this ship.** Profile isolation is gated on
`WAYLAND_E2E_TEST=1` (`configureAppIdentity.ts:16`) and that SAME variable disables IJFW
(`src/index.ts:726`). So no packaged E2E or smoke run can ever exercise Memory — which is exactly why
the packaged cockpit smoke reported PASS while Memory was dead on the same build. Fix direction: give
the IJFW guard its own variable (`WAYLAND_DISABLE_IJFW`) and have the E2E harness set it explicitly,
so isolation and IJFW-enablement stop being the same switch. Until then, IJFW must be live-tested via
a redirected `HOME` (see the F-07 harness) rather than the standard smoke.

### F-07 cross-audit (Ferrox Factory panel, 2026-07-25)

Four legs on the diff `b80ad8beb~1..d624555b0`. **Gemini's recorded model ID `gemini-3.1-pro` is dead
(404 ModelNotFoundError)** — rerun on the CLI default. Update
[[cross-audit-panel-invocations]].

Codex 5.6 Sol: FIX-FIRST (5 findings) · Gemini: FIX-FIRST (2) · Kimi K3: found the same lead finding ·
internal reviewer: ran.

**Fixed as a result:**
- **All three legs independently found the same lead defect**: the switch was derived from lifecycle
  status, which conflates a user SETTING with on-disk STATE. First cut (`fa6e104ce`) only guarded late
  emits within one mount; Codex and Gemini both showed that was too narrow — a remount re-derived it.
  Properly fixed in `8ee6b2218` with a new `ijfw.getSkipSetup` IPC reading the flag directly.

**DEFERRED — needs Sean's sign-off (real findings, not nits):**
1. **Lock contention reports success (Codex #3, Gemini #2) — HIGHEST.** `bootstrapImpl` returns
   normally when the install lock is held by another process, and `ijfwBridge.triggerInstall` converts
   that to `{ok:true}`. So turning Skip OFF can show a success toast, emit no status, and leave the
   original restart-only dead end fully intact. This re-creates the exact bug F-07 set out to fix, in a
   narrower window. Fix: return a typed lock-contention outcome and surface it.
2. **Double-install race (Codex #2).** Detection happens BEFORE the lock is acquired, so the toggle and
   the +5s boot bootstrap can both observe "not installed"; a delayed second call can take the released
   lock on stale detection and run a second installer. Fix: coalesce on one in-flight promise and
   re-detect after acquiring the lock.
3. **`metrics` is policy-sensitive (Codex #5).** It maps to `metrics:read`, so an active extension
   granting `memory:*` but not `metrics:read` denies the probe (and logs the denial) while Memory recall
   is healthy. A health probe should be policy-neutral — a transport-level `tools/list` ping is the
   right shape. NOTE: `metrics` is still strictly better than the shipped `state`, which could never
   succeed for anyone; this is a narrowing, not a regression.
4. **Separate preference-write failure from install-trigger failure (Codex #4)** — overlaps 1.

**Also worth a follow-up:** while opted out the status is not merely stale, it is untrue — the
`opt_out` branch returns before detection runs, so the page asserts "Not installed yet" about an
install it never looked for. Making that copy honest needs new i18n keys across 10 locales, so it was
deliberately left out of `b80ad8beb`.

---

## Order

F-01 → F-07 → F-02 → F-03 → F-05 → F-04, with F-06 whenever Sean sets the trust root.
F-07 jumped the queue because it is a shipped, customer-visible dead end.
