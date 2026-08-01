---
phase: WLD-D-inbox-repairs
plan: D-08
type: execute
wave: D6
depends_on: []
files_modified:
  - scripts/localVerificationGate.js (new leaf module — pure, side-effect-free)
  - scripts/build-with-builder.js
  - package.json
  - justfile (OPTIONAL — Claude's discretion, gated on Sean's Confirm)
  - tests/unit/localVerificationGate.test.ts (new unit)
autonomous: false
blocking: true
---

> **Source of truth:** `D-08-RESEARCH.md` (Confidence HIGH; every claim traced to file:line at
> HEAD `72bfb618e`, independently re-verified in this worktree during planning) and the milestone
> guardrails in `D-CONTEXT.md`. **Follow Approach B** (default-OFF seal-skip guard + `dist:verify:mac
--dir`). Do not re-derive the diagnosis — the seal ceremony is isolated to ONE call site
> (`build-with-builder.js:625`), nothing in `src/` or the smoke reads the seal (Q-C/Q-D both NO), so
> the honest move is to **OMIT (not forge)** the seal on an explicit local build. Line anchors below
> were re-confirmed live; they may drift — anchor on the identifiers, not the digits, and re-verify
> exact text before editing.

> ## ⚠ CONFIRM-GATE (SECURITY-SENSITIVE — BUILD DOES NOT START UNTIL SEAN CONFIRMS)
>
> This packet edits a **release-critical** file (`scripts/build-with-builder.js`, the capability-seal
> ceremony). Per Sean's directive the sequence is **Plan → Review (cross-audit) → Confirm (Sean) →
> Build.** Do NOT begin Task 1 until Sean has confirmed, in writing, all three:
>
> 1. **Flag name + default-OFF posture** — `WAYLAND_LOCAL_VERIFICATION`, unset/`'0'`/`'true'` all keep
>    the release path (seal written); ONLY the exact string `'1'` skips the seal. CI never sets it.
> 2. **Honest behavior is OMIT, not forge** — a local verification build writes NO
>    `public/capability-seal.json` and emits a loud "NOT A RELEASE" log. It does NOT fabricate a seal,
>    spoof `WAYLAND_RELEASE_TRUST_ROOT_SHA`, or touch `gh attestation verify`.
> 3. **Optional `just` recipe — yes or no** (Task 2, item 3). Default recommendation: yes, a thin
>    `verify-package` / `smoke-cockpit` convenience pair; skip if Sean prefers zero justfile churn.
>
> LOCAL only — no push/merge/deploy without Sean. Never touch `/Users/seandonahoe/dev/wayland/app`.

<objective>
**D-08 — Local packaged-verification build path.** Every local route to a launchable `.app` dies on the
release capability-seal ceremony: `scripts/build-with-builder.js:625` calls `writeCapabilitySeal({...})`
**unconditionally, before any preview/stable split**, and it transitively requires the CI-only trust root
(`WAYLAND_RELEASE_TRUST_ROOT_SHA`) plus `gh attestation verify` against a protected signer workflow —
neither of which exists on this dev machine. So there is no sanctioned way to produce an `out/mac-arm64/*.app`
for `scripts/packaged-cockpit-smoke.mjs`, which blocks the batched Milestone D packaged live-verify.

Research resolved the two crux questions to **NO**: the app has **zero** runtime references to the seal
(`grep -rn capability-seal src/` → empty; `public/capability-seal.json` is an untracked build artifact,
never read by any process/renderer), and the smoke script does **not** assert a seal either — it resolves
`out(-preview)/mac-arm64/*.app`, launches the binary with `WAYLAND_CDP_PORT`, and checks boot +
`.layout-content` render + a chat round-trip. Because nothing reads the seal, we do **not** fabricate one
(real or "verification-mode"). The honest, minimal move is to **skip the seal write** on an explicitly
non-release local build, leaving the release path **byte-identical** when the flag is absent.

**Deliver (LOCKED scope — Approach B):**

- A new tiny **pure leaf module** `scripts/localVerificationGate.js` exporting
  `isLocalVerificationBuild(env)` → `true` only when `env.WAYLAND_LOCAL_VERIFICATION === '1'`. Extracted
  so the release-vs-skip decision is unit-testable red-first (`build-with-builder.js` is a top-level
  side-effecting script that runs the whole build on `require` — not unit-testable as-is; see Task 1).
- **Guard ONLY the seal call** in `build-with-builder.js` (`:625-628`): when
  `isLocalVerificationBuild(process.env)` is true, emit a loud "NOT A RELEASE — seal omitted" log;
  otherwise run the **verbatim original** `writeCapabilitySeal({ root, outputFile })`. Leave
  `verifyThirdPartyExecutableLedger()` (`:624`) running — it is local-safe (validates a local ledger JSON,
  no creds/network/trust-root) and a legitimate integrity check even locally.
- Two new `package.json` scripts: `dist:verify:mac` (runs the **existing, audited** orchestration with
  `cross-env WAYLAND_LOCAL_VERIFICATION=1 … --mac --dir`) and its `predist:verify:mac` hook mirroring
  `predist:mac`, so the app is a _complete, bootable_ build (MCP bundling, bundled-bun, constitution
  authority, native rebuild, Developer-ID signing, skill-pack staging) — not the silently-incomplete app
  a direct `electron-builder` call would risk.
- OPTIONAL (Claude's discretion, gated on Sean's Confirm, kept minimal): a `justfile`
  `verify-package` / `smoke-cockpit` convenience pair.

**Explicitly OUT of scope (do NOT touch):**

- Any change that makes a local artifact pass the **real** release acceptance (trust root / attestation).
  That is the security line — rejected. Forge nothing.
- Any edit under `scripts/capability-seal/` — the seal machinery itself is untouched (`git diff --stat
scripts/capability-seal/` must be EMPTY).
- The `else` (release) branch — it is the byte-identical original `writeCapabilitySeal({...})`. No
  rewrite, no reformat.
- DMG signing / notarization / Windows / Linux local-verify paths — `--dir` mac-arm64 only for this
  dev machine. `afterSign.js` already skips notarization without Apple creds; `notarizeDmg.js` is a no-op
  for `--dir` (no DMG).
- The packaged live-verify of the D-03/D-04/D-05/D-06 surfaces and the D-07 token-cost sweep — D-08
  **unblocks** those, but each packet's packaged live-verify is **its own acceptance**, not D-08's.
- No fuse change, no runtime code change. This is a build-time env-gated branch + two script lines only.

Purpose: a sanctioned, repeatable LOCAL build that yields a launchable `out/mac-arm64/*.app` so
`packaged-cockpit-smoke.mjs` can run — with the release trust boundary **provably** intact (grep/diff-
provable, and now unit-test-provable) and the real release path unchanged.
Output: one new pure module + one guarded block + two `package.json` script lines (+ optional justfile)

- one new red-first unit test, proven green on `bun run test:vitest`, with the release-safety grep/diff
  assertions clean, and confirmed by a packaged live-verify (a launchable `.app` + `packaged-cockpit-smoke.mjs`
  GREEN) accepted by Sean + Claude.
  </objective>

<tasks>

**Task 1 — Wave 0: extract the pure decision seam + write its test FIRST (commit `test(D-08): ...`).**

`scripts/build-with-builder.js` is a top-level side-effecting script — module-scope `const`s (`:615-617`)
and the whole build inside a top-level `try` (`:619`), no `require.main === module` guard — so `require()`ing
it executes the build. It is **not unit-testable as-is**. Per the research (Validation Architecture) and the
established repo pattern of extracting pure helpers from build scripts for unit tests
(`tests/unit/notarizeDmgRetry.test.ts`, `tests/unit/scripts/generateCapabilityAcceptanceReceipts.test.ts`),
extract the one boolean decision into a pure leaf module and test THAT red-first. This is the honest Wave-0
floor: it proves the release-vs-skip decision without spawning a build.

- **New file `tests/unit/localVerificationGate.test.ts`** — mirror the `import x = require('../../scripts/…')`
  CJS pattern in `tests/unit/notarizeDmgRetry.test.ts`. Import `isLocalVerificationBuild` from
  `../../scripts/localVerificationGate.js`. Assert:
  1. `isLocalVerificationBuild({})` (flag unset) → `false` — the RELEASE path (seal written) is taken.
  2. `isLocalVerificationBuild({ WAYLAND_LOCAL_VERIFICATION: undefined })` → `false`.
  3. `isLocalVerificationBuild({ WAYLAND_LOCAL_VERIFICATION: '1' })` → `true` — the seal is SKIPPED.
  4. `isLocalVerificationBuild({ WAYLAND_LOCAL_VERIFICATION: '0' })` → `false` (default-OFF: any non-`'1'`).
  5. `isLocalVerificationBuild({ WAYLAND_LOCAL_VERIFICATION: 'true' })` → `false` — ONLY the exact string
     `'1'` flips it, so a stray truthy value can never silently skip the seal on a release box.
     RED: the module does not exist yet (import fails). This encodes the core release-safety invariant —
     seal written unless the operator explicitly opts into a local verification build with `'1'`.
     Verify: `bun run test:vitest localVerificationGate` (all RED — module absent).
     Done: the test file is committed as `test(D-08): ...` before any production edit; every assertion is RED.

**Task 2 — Approach B: the seal-skip guard + `dist:verify:mac --dir` (commit `build(D-08): ...`).**
Flips Task-1 RED → GREEN and adds the build path. Touch ONLY the sites named. Re-verify the live line
numbers/text before editing (anchors are HEAD `72bfb618e`; they may have drifted).

1. **New `scripts/localVerificationGate.js`** — a pure, dependency-free CJS leaf module (no imports of
   `build-with-builder.js` or anything else). Export `isLocalVerificationBuild(env)` returning
   `(env && env.WAYLAND_LOCAL_VERIFICATION) === '1'`. Add a head comment stating: build-time only;
   `WAYLAND_LOCAL_VERIFICATION=1` omits (does NOT forge) the release capability seal so a local `--dir`
   build can produce a launchable `.app` for `packaged-cockpit-smoke.mjs`; default-OFF — any other value
   keeps the release path. `module.exports = { isLocalVerificationBuild }`.

2. **`scripts/build-with-builder.js`** — two confined edits:
   - Near the existing requires (`:21-22`, alongside `verifyThirdPartyExecutableLedger` /
     `writeCapabilitySeal`), add `const { isLocalVerificationBuild } = require('./localVerificationGate');`.
   - At the seal call (`:624-628`): **leave `verifyThirdPartyExecutableLedger();` (`:624`) exactly as-is**,
     then wrap ONLY the `writeCapabilitySeal({...})` call so the guarded shape is:
     when `isLocalVerificationBuild(process.env)` is true, call `console.warn(...)` with a loud, single-line
     NOT-A-RELEASE message naming the flag and stating the capability seal was omitted and the artifact must
     never ship as a release; ELSE run the byte-identical original
     `writeCapabilitySeal({ root: path.resolve(__dirname, '..'), outputFile: capabilitySealPath });`.
     The `else` branch MUST be the verbatim original call — same arguments, same formatting. Add a short
     comment: the seal is release-gated; a local verification build omits it (does not forge it), and the
     app + smoke never read it (Q-C/Q-D). Do NOT edit the seal machinery, the trust-root/attestation code,
     any fuse, or the `restoreCapabilitySeal` handling.

3. **`package.json` `scripts`** — add two lines (mirror the existing `predist:mac` / `dist:mac` pair at
   `:32-33`; `cross-env` precedent at `dist:preview:mac` `:38`, and it is already a devDependency):
   - `"predist:verify:mac": "bun run verify:modelsdev-snapshot && bun run build:skill-pack"` — a verbatim
     mirror of `predist:mac`, so skill-pack is staged before the build-with-builder skill-pack assertion
     (`prepareConstitutionFs` runs inside build-with-builder). `bun run` auto-fires the `pre` hook, exactly
     as `predist:mac` gates `dist:mac`.
   - `"dist:verify:mac": "cross-env WAYLAND_LOCAL_VERIFICATION=1 node scripts/build-with-builder.js auto --mac --dir"`.
     `builderArgs` (`:508-517`) filters only `auto` / arch flags / `--skip-vite|--skip-native|--pack-only|--force`
     and passes everything else (`--mac --dir`) straight to electron-builder (`:897`) — so `--dir` produces
     an unpacked `out/mac-arm64/*.app` (no DMG, no notarization) via the full audited orchestration. This is
     NOT the forbidden raw `electron-vite build`: it routes through build-with-builder.js, which runs
     `prepareConstitutionFs` (`:640-644`), electron-vite, MCP bundling, bundled-bun, and skill-pack staging.

4. **OPTIONAL — `justfile` (gated on Sean's Confirm #3, keep minimal).** Near `packaged-ext-build` (`:384`),
   add `verify-package: preflight` → `bun run dist:verify:mac`, and `smoke-cockpit: verify-package` →
   `WAYLAND_CDP_PORT=9340 node scripts/packaged-cockpit-smoke.mjs` for one-command local smoke. Mark as
   convenience only; do NOT bloat the justfile or add other recipes. If Sean says no, skip this item
   entirely (it is not required for acceptance).

   Verify: `bun run test:vitest localVerificationGate` GREEN (all five assertions pass); `bun run test:vitest`
   full unit suite green; `tsc --noEmit` clean (the new module is plain CJS; the test is typed).
   Done: `isLocalVerificationBuild` decides release-vs-skip; the seal call is guarded (else branch verbatim);
   `dist:verify:mac` + `predist:verify:mac` exist; optional justfile recipes present iff Sean approved.

**Task 3 — Exit bar + release-safety proof + packaged live-verify (human checkpoint, NO code commit).**

- **Automated floor:** `bun run test:vitest` (full unit suite) green; `tsc --noEmit` clean. Constitution
  tests may flake under full-suite parallelism (pass isolated) — not a regression, per `D-CONTEXT.md`.

- **Release-safety acceptance (MUST all pass — explicit, verifiable):**
  - `git diff --stat scripts/capability-seal/` is **EMPTY** — no seal-machinery edits.
  - `grep -rn "WAYLAND_LOCAL_VERIFICATION" scripts/` shows the literal **only** in
    `scripts/localVerificationGate.js` (its single definition); `build-with-builder.js` references it
    solely via `isLocalVerificationBuild(process.env)` wrapping **only** the seal call.
    > _Deviation note (honest):_ the research seam wrapped the raw literal inline in
    > `build-with-builder.js`. Extracting the predicate into `localVerificationGate.js` moves the literal
    > into that tiny audited module so the decision is unit-testable red-first (Task 1). The release-safety
    > intent is fully preserved and is now **stronger**: `grep -n "isLocalVerificationBuild" scripts/build-with-builder.js`
    > shows exactly the require line + the one guard condition, and the seal's `else` branch is byte-identical.
  - `grep -rn "WAYLAND_RELEASE_TRUST_ROOT_SHA\|gh attestation" scripts/` is **unchanged vs HEAD**
    (`git diff` on those matches is empty).
  - The whole diff is confined to: `scripts/localVerificationGate.js` (new) + the require line + the one
    guarded block in `scripts/build-with-builder.js` + the two new `package.json` script lines
    (+ the optional justfile recipes iff approved). Confirm via `git diff --stat`.

- **Packaged live-verify (orchestrator + Sean run this by hand — D-08's own acceptance):**
  1. `bun run dist:verify:mac` → confirm `out/mac-arm64/*.app` exists and **LAUNCHES** (double-click or
     `open out/mac-arm64/Wayland*.app`; the window paints to `.layout-content`).
  2. `WAYLAND_CDP_PORT=9340 node scripts/packaged-cockpit-smoke.mjs` → **GREEN**: boot + all cockpit
     surfaces render + IPC + a chat round-trip using the burner Flux key at
     `~/.config/wayland-smoke/flux-test-key` (the round-trip spawns the bundled wayland-core; a Developer-ID
     signature + `signIgnore`-preserved nested binaries are what let the hardened runtime spawn children —
     if a codesign issue surfaces, `runBundleIntegrityCheck` logs the offending path, non-fatal).
  3. Confirm `public/capability-seal.json` was **NOT** written by this build (seal omitted, not forged), and
     that the run logged the loud NOT-A-RELEASE line.
  4. `git checkout -- src/process/services/constitution/constitutionFsAuthority.generated.ts` — the build
     regenerates it; revert per `D-CONTEXT.md`.

- **Unblocks (reference only — NOT D-08 acceptance):** this launchable `.app` + smoke path is what makes the
  batched Milestone D packaged live-verify runnable — the D-03/D-04/D-05/D-06 surfaces, the D-07 token-cost
  sweep, packaged-i18n (`test:packaged:i18n` / `APP_ASAR_PATH`), and the conversations-surface a11y checks.
  Each of those is verified under **its own** packet's acceptance, not here.

- **Independent cross-audit** of the diff before any merge (release-critical file → the full panel is
  warranted). LOCAL only — no push/merge without Sean.
  Verify: full suite + `tsc --noEmit` green; all release-safety grep/diff assertions clean; `dist:verify:mac`
  yields a launchable `out/mac-arm64/*.app`; `packaged-cockpit-smoke.mjs` GREEN; no seal file written;
  `constitutionFsAuthority.generated.ts` reverted.
  Done: a sanctioned local `dist:verify:mac` produces a launchable, smoke-passing `.app` with the release
  path provably unchanged; cross-audit clean; accepted by Sean + Claude.

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                                     | Description                                                                                                                                                                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| local build tooling → release trust boundary | The guard sits at the single seal call. The only risk is _erosion_ of the release boundary — an operator/CI producing an unsealed artifact and treating it as a release. No new external input is parsed; no runtime attack surface is added. |
| local build → shippable artifact             | A `--dir` local build is genuinely Developer-ID signed but carries NO capability seal. The boundary that must hold: an unsealed artifact can never satisfy the real release acceptance.                                                       |

## STRIDE Threat Register

| Threat ID | Category                | Component                                                                  | Severity | Disposition         | Mitigation Plan                                                                                                                                                                                                                                                                                                                   |
| --------- | ----------------------- | -------------------------------------------------------------------------- | -------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-D08-01  | Tampering               | the seal guard could disable `writeCapabilitySeal` on a real release build | high     | mitigate            | Default-OFF: `isLocalVerificationBuild` returns true ONLY for the exact string `'1'` (unit-tested: unset/`'0'`/`'true'` → seal written). CI/release scripts never set the flag → their behavior is byte-identical to today. The `else` branch is the verbatim original seal call (grep/diff-proven).                              |
| T-D08-02  | Spoofing / Repudiation  | provenance forgery — a local build masquerading as sealed                  | high     | mitigate            | The seal is **omitted, not forged**: no `public/capability-seal.json` is written, no trust-root SHA is spoofed, `gh attestation verify` is never touched. No file that could be mistaken for a release seal exists on a local build. `git diff --stat scripts/capability-seal/` is empty; trust-root/attestation greps unchanged. |
| T-D08-03  | Tampering / Repudiation | an unsealed local `.app` shipped as if it were a release                   | medium   | mitigate + transfer | The build logs a loud NOT-A-RELEASE line; and the release acceptance pipeline is the backstop — an unsealed candidate has no capability seal → no attestation → release **fails closed**. The local flag lives only in `dist:verify:mac`, which is not a release script.                                                          |
| T-D08-04  | Tampering               | code signing / hardened runtime integrity of the local artifact            | low      | accept              | Unchanged: `afterPack` fuses + `afterSign` codesign + `signIgnore`-preserved nested binaries all still run; `--dir` skips DMG/notarize gracefully (no Apple creds needed). The local `.app` is genuinely signed, so the smoke exercises a representative build.                                                                   |
| T-D08-SC  | Tampering               | supply-chain (new packages)                                                | n/a      | accept              | No new packages — `cross-env` is already a devDependency; Node builtins + in-repo scripts only. Package Legitimacy Gate N/A.                                                                                                                                                                                                      |

</threat_model>

<verification>
- `bun run test:vitest localVerificationGate` green: `isLocalVerificationBuild` returns `false` for
  unset/`'0'`/`'true'`/`undefined` (release path — seal written) and `true` only for `'1'` (seal skipped).
- `bun run test:vitest` (full unit suite) green; `tsc --noEmit` clean.
- Release-safety: `git diff --stat scripts/capability-seal/` EMPTY; `grep -rn "WAYLAND_LOCAL_VERIFICATION"
  scripts/` only in `localVerificationGate.js`; the seal call's `else` branch byte-identical to HEAD;
  `grep -rn "WAYLAND_RELEASE_TRUST_ROOT_SHA\|gh attestation" scripts/` unchanged; `git diff --stat` confined
  to the five intended surfaces (+ optional justfile).
- Packaged live-verify: `bun run dist:verify:mac` yields a launchable `out/mac-arm64/*.app`;
  `WAYLAND_CDP_PORT=9340 node scripts/packaged-cockpit-smoke.mjs` GREEN (boot + surfaces + IPC + chat
  round-trip via the burner key); `public/capability-seal.json` NOT written; NOT-A-RELEASE line logged;
  `constitutionFsAuthority.generated.ts` reverted after the build.
- Independent cross-audit of the diff before any merge; LOCAL only, no push/merge without Sean.

**Goal-backward check — each acceptance criterion maps to the phase goal: "a launchable local
`out/mac-arm64/*.app` for `packaged-cockpit-smoke`, release path provably unchanged":**

| Must be TRUE (goal)                                              | Producer behavior that makes it true                                                                                                      | Proven by                                                                                                      |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| A local build reaches electron-builder without dying on the seal | `isLocalVerificationBuild(process.env)` skips `writeCapabilitySeal` when `WAYLAND_LOCAL_VERIFICATION=1`                                   | `localVerificationGate.test` (`'1'` → true) + packaged live-verify (`dist:verify:mac` completes)               |
| The build yields a launchable `out/mac-arm64/*.app`              | `dist:verify:mac` routes through the full build-with-builder orchestration with `--dir` (MCP/bun/constitution/signing/skill-pack all run) | packaged live-verify (`.app` exists + launches)                                                                |
| The packaged app boots, renders surfaces, IPC + chat round-trip  | signed `--dir` app + bundled wayland-core spawned under hardened runtime                                                                  | `packaged-cockpit-smoke.mjs` GREEN                                                                             |
| The release path is byte-identical when the flag is absent       | guard returns false for unset/`'0'`/`'true'`; `else` branch is the verbatim original seal call                                            | `localVerificationGate.test` (default-OFF cases) + `else`-branch diff + trust-root/attestation greps unchanged |
| No provenance is forged                                          | seal is omitted, not faked; no `public/capability-seal.json`, no spoofed trust root, no attestation touched                               | `git diff --stat scripts/capability-seal/` empty + no seal file written in live-verify                         |
| An unsealed build cannot pass a real release                     | flag confined to `dist:verify:mac` (not a release script); release acceptance fails closed on a missing seal                              | threat model T-D08-01/-03 + release pipeline (out of this diff, unchanged)                                     |

</verification>

<success_criteria>
A sanctioned, repeatable LOCAL command — `bun run dist:verify:mac` — produces a launchable, code-signed
`out/mac-arm64/*.app` (via `--dir`, no DMG/notarization) that passes `scripts/packaged-cockpit-smoke.mjs`,
so the batched Milestone D packaged live-verify becomes runnable. The change is exactly: one pure leaf
module (`scripts/localVerificationGate.js`), one guarded block in `scripts/build-with-builder.js` (the seal
`else` branch byte-identical), two `package.json` script lines (+ optional justfile). The release path is
provably unchanged — the seal is OMITTED (never forged) only when `WAYLAND_LOCAL_VERIFICATION === '1'`,
`scripts/capability-seal/` is untouched, and the trust-root/attestation code is unchanged — proven by a
red-first unit test, the release-safety grep/diff assertions, and the full unit suite + `tsc --noEmit` green.
No `github_issue` (build/verification infra). LOCAL only; accepted by Sean + Claude at live-verify.
</success_criteria>

<output>
Write `D-08-SUMMARY.md` when the packet is live-test-accepted, recording: the new
`scripts/localVerificationGate.js` module (`isLocalVerificationBuild`); the guarded seal block in
`build-with-builder.js` (with confirmation the `else` branch stayed byte-identical and
`verifyThirdPartyExecutableLedger()` still runs); the two new `package.json` scripts (`dist:verify:mac`,
`predist:verify:mac`) and whether the optional justfile recipes shipped; the new
`localVerificationGate.test.ts` results; the release-safety grep/diff evidence (empty `scripts/capability-seal/`
diff, literal only in the gate module, trust-root/attestation unchanged, diff confined); the packaged
live-verify evidence (that `dist:verify:mac` produced a launchable `.app`, `packaged-cockpit-smoke.mjs` was
GREEN, no seal file was written, and `constitutionFsAuthority.generated.ts` was reverted); the cross-audit
result; and a note that this unblocks the batched Milestone D packaged live-verify (whose per-packet
acceptance is tracked in D-03/D-04/D-05/D-06/D-07, not here).
</output>
