# Phase WLD-D (D-08) — Local packaged-verification build path — Research

**Researched:** 2026-07-24
**Domain:** Electron packaging (electron-vite + electron-builder), release-acceptance capability seal, local smoke tooling
**Confidence:** HIGH (every claim traced to file:line in this worktree; branch `worktree-agent-desktop-integration`, HEAD `72bfb618e`)

> Note on HEAD: the task brief cited `dfe9eb71c`; the live worktree HEAD is `72bfb618e`. All
> evidence below is from the live tree. The build/seal machinery is unchanged between the two.

## Summary

The Milestone D fixes need a packaged `.app` to run `scripts/packaged-cockpit-smoke.mjs`, but every
local path to an `.app` dies on the release capability-seal ceremony. That ceremony lives in **exactly
one place** — `scripts/build-with-builder.js:625` `writeCapabilitySeal(...)` — which is called
**unconditionally, before any preview/stable divergence**, and transitively requires the CI-only trust
root (`WAYLAND_RELEASE_TRUST_ROOT_SHA`) and `gh attestation verify` against a protected signer workflow.
Neither electron-builder's own hooks (`afterPack.js`, `afterSign.js`, `notarizeDmg.js`) nor
`electron-builder.yml` reference the seal, the trust root, or require signing/notarization creds to
complete.

The two crux questions both resolve **NO**: (Q-C) the app has **zero** runtime references to the
capability seal — `grep -rn capability-seal src/` returns nothing; `public/capability-seal.json` is
never read by any process/renderer code and is an untracked build artifact. (Q-D) the smoke script does
**not** assert a seal either — it resolves `out(-preview)/mac-arm64/*.app`, launches the binary with
`WAYLAND_CDP_PORT`, connects over CDP, and checks boot + `.layout-content` render + a chat round-trip.
Because nothing reads the seal, **the elaborate "local-unattested-verification seal" design in Q-E is
unnecessary** — we do not need to fabricate a seal at all, only to stop the build from dying on the seal
write when explicitly producing a non-release verification artifact.

**Primary recommendation:** Add a single default-OFF guard (`WAYLAND_LOCAL_VERIFICATION=1`) around the
one `writeCapabilitySeal` call, plus a `dist:verify:mac` script that runs the existing, audited
`build-with-builder.js` orchestration with electron-builder `--dir` (unpacked `.app`, no DMG, no
notarization). Release path stays **byte-identical** when the flag is absent (grep-provable: the seal
call is untouched in the `else` branch). This reuses the complete, correct build sequence (MCP bundling,
bundled-bun, constitution authority, native rebuild, Developer-ID signing) — guaranteeing a *bootable,
capability-complete* app, which a hand-rolled direct-`electron-builder` invocation would not.

<user_constraints>
## User Constraints (from D-CONTEXT.md)

> There is no separate CONTEXT for D-08; `D-CONTEXT.md` is the milestone-wide context and its
> guardrails are the locked constraints for this packet.

### Locked Decisions / Guardrails
- **LOCAL only** — no push/merge/release/deploy without Sean. Never touch
  `/Users/seandonahoe/dev/wayland/app`. Work in
  `/Users/seandonahoe/dev/wayland-worktrees/desktop-integration` on `worktree-agent-desktop-integration`.
  [CITED: D-CONTEXT.md:92]
- **Do NOT weaken the release trust boundary.** No forged/faked attestations, no spoofed trust-root SHA.
  Release must stay strict; any new flag defaults OFF. [task brief; consistent with D-CONTEXT posture]
- **Do NOT change the real release/ship path.** [task brief]
- **Always `bun run package`, never raw `npx electron-vite build`** (raw skips the prepackage hook →
  packaged app crashes on launch); revert `constitutionFsAuthority.generated.ts` after any package
  build. Constitution tests flake under full-suite parallelism (pass isolated) — not a regression.
  [CITED: D-CONTEXT.md:94-97]
- Acceptance = Sean + Claude live-test together; a green Playwright/unit sweep IS acceptance.
  [CITED: D-CONTEXT.md:12-13]
- No AI signatures in commits/PRs; gh writes use FerroxLabs / Sean Writer voice.

### Claude's Discretion
- Exact flag name (`WAYLAND_LOCAL_VERIFICATION` recommended) and the loud non-release log wording.
- Whether to emit `--dir` only vs. also a local unsigned DMG (recommend `--dir` only — the smoke wants
  the `.app`).
- New-script naming (`dist:verify:mac` recommended) and whether to add a `just` recipe.

### Deferred / Out of Scope
- Any change that makes a local artifact pass the *real* release acceptance (trust root / attestation).
  Explicitly rejected — that is the security line.
- Building a full release, DMG signing/notarization, or Windows/Linux local-verify paths (mac-arm64
  only for this dev machine).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| D-08 | A sanctioned, repeatable LOCAL build producing a launchable `out/mac-arm64/Wayland*.app` so `packaged-cockpit-smoke.mjs` can run, without breaching the release trust boundary and without changing the real release path. | Seal ceremony isolated to `build-with-builder.js:625`; app + smoke never read the seal (Q-C/Q-D both NO); electron-builder hooks + config are cred-free/graceful; a one-line default-OFF guard + `--dir` script yields a correct bootable app with release path byte-identical. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Local `.app` production | Build tooling (`scripts/build-with-builder.js` + electron-builder) | — | Packaging is a build-time concern; no app-runtime code changes |
| Release trust boundary (seal/trust-root/attestation) | CI-only (`build-with-builder.js:625` → `capability-seal/*` → GH attestation) | — | Layers 2–3 are CI-by-design; must remain untouched on the release path |
| Runtime integrity that DOES gate the app | App runtime (constitution FS authority; codesign self-check) | — | Independent of the capability seal; satisfied by the normal package flow |
| Smoke verification | Local tooling (`packaged-cockpit-smoke.mjs`) | — | Boot + surfaces + IPC + chat round-trip over CDP; does not read the seal |

## Standard Stack

No new dependencies. All intervention reuses in-repo tooling already on the build path.

| Module | Purpose | Already used by |
|--------|---------|-----------------|
| `scripts/build-with-builder.js` | full package orchestration (vite → MCP bundle → bundled-bun → constitution authority → electron-builder) | every `dist:*` / `build-*` script |
| `electron-builder` (`--dir`) | emit unpacked `out/mac-arm64/*.app` (no DMG/installer) | `build-with-builder.js:897` |
| `cross-env` | set the default-OFF flag inline in a package.json script | `dist:preview:*` scripts already use it |
| `scripts/packaged-cockpit-smoke.mjs` | CDP smoke over the packaged `.app` | existing harness |
| `scripts/capability-seal/generateCapabilityAcceptanceReceipts.js` | (optional) local receipts — **not required** given Q-C/Q-D | release acceptance |

**Installation:** none.

## Package Legitimacy Audit

N/A — no external packages installed. Node builtins + in-repo scripts + existing devDependencies
(`electron-builder`, `cross-env`) only.

## Answers to Research Questions

### Q-A — Is there ALREADY a local packaged-smoke build path?  →  **Partially: recipes exist, but they route through the same seal and are broken locally.**  [VERIFIED: codebase]

- `justfile:183-185` — `build-package: preflight` → `node scripts/build-with-builder.js auto --pack-only --skip-native`. But `--pack-only` **returns before electron-builder** (`build-with-builder.js:697-701`), so it produces `out/main|renderer|preload` and **no `.app`**. Worse, `--pack-only` runs *after* the seal call at `:625`, so it also dies on the trust root locally.
- `justfile:383-385` — `packaged-ext-build: build-package` then `node scripts/packaged-launch.mjs`. `packaged-launch.mjs:66` expects `out/mac-arm64/*.app`; after `--pack-only` there is none, so this recipe is already internally inconsistent for local use.
- `justfile:240-252` — `build-mac:arm64` → `build-with-builder.js arm64 --mac --arm64` **does** produce a `.app` + DMG, but hits the same `:625` seal → `Release acceptance trust root is unavailable.`
- **How CI builds the smoke artifact:** `platform-package-smoke.mjs:201` asserts a *clean worktree* before recording its own "immutable commit/tree attestation" — that is the smoke's provenance stamp, **not** the capability seal. No workflow builds an *unsealed* artifact; the release job that produces the sealed `.app` supplies `WAYLAND_RELEASE_TRUST_ROOT_SHA` + GH attestations, then the smoke runs against that sealed artifact. There is **no** sanctioned "build unsealed locally then smoke" recipe today — that is precisely the gap D-08 fills. [VERIFIED: `grep -rln packaged-cockpit-smoke|platform-package-smoke .github/workflows/` + `justfile`]

**Conclusion:** the recipe *shape* exists (`build-mac:arm64` → `.app`; `packaged-cockpit-smoke.mjs`), but every path to an `.app` funnels through the one seal call. No pre-existing local bypass.

### Q-B — Can `electron-builder --dir` be invoked directly, and is the seal in electron-builder's hooks/config?  →  **The seal is NOT in electron-builder's hooks/config; a direct `--dir` would boot but risks an incomplete app. Prefer routing through `build-with-builder.js` with the seal guarded.**  [VERIFIED: codebase]

Where the seal is (and is not):
- **Seal lives only in `build-with-builder.js:619-628`** — `verifyThirdPartyExecutableLedger()` (`:624`, local-safe, see below) then `writeCapabilitySeal({root, outputFile: public/capability-seal.json})` (`:625-628`). This block is inside the top-level `try` and runs before vite, MCP bundling, and electron-builder. It is **unconditional** — no preview/stable branch, no env guard. [VERIFIED: `build-with-builder.js:50-57,619-628`]
- **`electron-builder.yml` does NOT require the seal.** `files:` includes `public/**/*` (`:24`) and `extraResources: - from: public` (`:110-111`) copy `public/` (including `capability-seal.json` *iff present*) into `Contents/Resources`, but nothing verifies its presence. A missing `capability-seal.json` is simply not copied. [VERIFIED: `electron-builder.yml:18-24,110-111`]
- **`afterPack.js`** only flips Electron fuses, rebuilds native modules, and ad-hoc re-signs on macOS (so afterSign's `codesign --verify` passes). No seal / trust root / attestation / creds. [VERIFIED: `afterPack.js:38-59,272`]
- **`afterSign.js`** runs `codesign --verify`; if unsigned it applies an ad-hoc signature and returns; it **skips notarization when `appleId`/`appleIdPassword`/`teamId` are absent** (they are). Graceful, cred-free. [VERIFIED: `afterSign.js:22-45`]
- **`afterAllArtifactBuild: notarizeDmg.js`** only fires for DMG artifacts. `--dir` produces no DMG, so it is a no-op. [VERIFIED: `electron-builder.yml:310`]
- **Mac signing:** `mac.hardenedRuntime: true`, `entitlements: entitlements.plist`, no `mac.identity` set → electron-builder auto-discovers the keychain Developer-ID Application identity (present per task). No `CSC_LINK`/`CSC_KEY_PASSWORD` needed. `signIgnore` (`:256-263`) preserves the pinned nested binaries (wayland-core, officecli, constitution-fs, bun) so their digests stay valid. [VERIFIED: `electron-builder.yml:245-263`]

Would a direct `bunx electron-builder --dir --config electron-builder.yml` (after `bun run package`) work?
- **Succeed & boot: likely yes** — it never touches the seal.
- **Produce a *correct* app: risky.** `build-with-builder.js` performs steps *between* vite and electron-builder that a direct call skips: `build-mcp-servers.js` (`:673-677`; MEMORY: skipping it crash-loops image-gen/search MCP servers), `prepareBundledBun` (`:708`), `prepareOptionalHubResources` (`:713`), and skill-pack staging assertion (`:815-820`). If bundled-bun / MCP bundles are not staged, `extraResources` ships an incomplete app and the smoke's chat round-trip (which spawns wayland-core/bun) can fail. This is the exact class of "silently incomplete package" the smoke exists to catch. [VERIFIED: `build-with-builder.js:673-820`]

**Arg-passthrough confirms feasibility of the guarded route:** `builderArgs` (`build-with-builder.js:508-512`) filters only `--skip-vite|--skip-native|--pack-only|--force` and passes everything else (e.g. `--mac --dir`) straight to the electron-builder command (`:897`). So `build-with-builder.js auto --mac --dir` flows `--dir` to electron-builder unchanged. [VERIFIED: `build-with-builder.js:508-512,585,897`]

> **Bounded probe not run (static tracing preferred, per task).** A live `electron-builder --dir`
> would require a completed `bun run package` first and would create `out/mac-arm64` (cleanup). The
> config + hook reads above answer Q-B fully; running it would add cost without new signal.

### Q-C — Does the app RUNTIME-assert the capability seal / constitution authority such that an unsealed build boots differently?  →  **Capability seal: NO. Constitution authority: yes, but it is satisfied by the normal package flow, not by the seal.**  [VERIFIED: codebase]

- **Capability seal — zero runtime coupling.** `grep -rniE 'capability-seal|capabilitySeal|candidate-capability-seal' src/` → **no matches**. `grep -rn 'capability-seal.json|verifyCapabilitySeal|readCapabilitySeal' src/` → **no matches**. No process, renderer, or `src/index.ts` code reads `public/capability-seal.json`. The seal is a *release-acceptance provenance artifact*, produced at build time and shipped into `Resources`, but **never consulted by the running app**. An app built without it boots, renders all surfaces, serves IPC, and completes a chat round-trip identically. [VERIFIED: two independent greps over `src/`]
- **`public/capability-seal.json` is an untracked build artifact** (`git ls-files --error-unmatch` → NOT tracked). Skipping the seal write simply leaves it absent; electron-builder copies `public/` without it. [VERIFIED: git]
- **Constitution FS authority IS a runtime gate — but independent of the seal.**
  `src/index.ts` (imports) and `constitutionFsService.ts:222` call
  `verifyPackagedConstitutionFsBinary(resourcesPath)` (`constitutionFsBinary.ts:91`), which hashes the
  bundled `wayland-constitution-fs` binary against `PACKAGED_CONSTITUTION_FS_AUTHORITY`
  (`constitutionFsAuthority.generated.ts`) and throws on mismatch. This authority is **generated by the
  normal package flow** — `bun run package`'s `prepackage` runs `prepareConstitutionFs.js`, and
  `build-with-builder.js:640-644` regenerates it for the exact target before vite compiles. `signIgnore`
  preserves the constitution-fs binary bytes. So a `build-with-builder.js` build (the recommended route)
  has a valid constitution authority and passes this gate. This is why D-CONTEXT says "revert
  `constitutionFsAuthority.generated.ts` after any package build" — the build *rewrites* it; it is not a
  seal dependency. [VERIFIED: `constitutionFsBinary.ts:24,82-112,209-278`; `constitutionFsService.ts:222`; `build-with-builder.js:640-644`; package.json `prepackage`]
- **codesign self-check is non-blocking.** `src/index.ts:1189-1192` fires
  `runBundleIntegrityCheck()` (fire-and-forget) on macOS packaged builds. `bundleIntegrity.ts:92`
  ("No-op outside macOS packaged builds. Never throws.") — it reports codesign drift, never gates boot.
  For a properly Developer-ID-signed local build (electron-builder + keychain identity) it passes. [VERIFIED: `src/index.ts:1185-1194`; `bundleIntegrity.ts:92-134`]

**Answer: NO** — boot, the 12 cockpit surfaces, IPC, and a chat round-trip do **not** depend on a valid
capability seal. The only runtime integrity gate (constitution authority) is satisfied by the standard
`build-with-builder.js` package flow.

### Q-D — Does the smoke need the seal?  →  **NO. It needs boot + surfaces render + IPC + chat round-trip.**  [VERIFIED: codebase]

- `packaged-cockpit-smoke.mjs` has **no** seal/trust/attestation reference (`grep -nEi 'capability-seal|seal|trustRoot|attestation'` → none). [VERIFIED]
- It resolves the app via `resolvePackagedApp` scanning `out-preview/` then `out/` for
  `mac-arm64|mac-x64|mac|mac-universal` `*.app` (`:107-118,617-624`), launches the binary itself with
  `WAYLAND_CDP_PORT` set (`:648-653`; "no fuse weakened"), `chromium.connectOverCDP` (`:274`), waits for
  `.layout-content` to render (`:322-326`), then drives a chat round-trip keyed on a distinctive
  instruction phrase (`:416-448`). Burner Flux key at `~/.config/wayland-smoke/flux-test-key`. [VERIFIED: `packaged-cockpit-smoke.mjs:107-118,274,322-326,416-448,617-653`]
- `platform-package-smoke.mjs:201` asserts a clean worktree only to stamp *its own* provenance
  attestation of what was tested — unrelated to the capability seal.

**What must be true of the artifact for the smoke to pass:** a launchable, code-signed (so hardened
runtime permits child-process spawning) `out/mac-arm64/*.app` that boots to `.layout-content`, serves
IPC, and can round-trip a chat via the bundled wayland-core + a Flux key. A valid capability seal is
**not** among these requirements.

### Q-E — Sanctioned fallback if an unsealed boot were illegitimate.  →  **MOOT.** Because Q-C and Q-D are both NO, no local seal (real or "verification-mode") is needed at all.  [design analysis]

The task framed a `WAYLAND_LOCAL_VERIFICATION` "local-unattested-verification seal" that seals from
locally-generated receipts while skipping the trust-root/attestation step and stamping
`mode: "local-unattested-verification"`. **This is more machinery than the problem requires.** Since
nothing reads `public/capability-seal.json` at runtime and the smoke does not check it, fabricating any
seal — even an honestly-labelled one — adds surface (a new seal contract variant, receipt generation on
every local build) for zero functional benefit, and it edges the local build *toward* the seal system we
want to keep release-only.

**The honest, minimal move is to OMIT the seal locally, not to forge a weaker one.** Omission crosses no
security line: we forge no attestation, spoof no trust-root SHA, and write no file that could be mistaken
for a release seal (there is simply no file). The reused `WAYLAND_LOCAL_VERIFICATION=1` flag becomes a
*seal-skip* switch, not a *seal-forge* switch. If Sean later wants a positive local marker, the cheapest
honest option is a tiny non-cryptographic breadcrumb (e.g. writing `public/LOCAL-VERIFICATION-BUILD` or
logging loudly) — but that is optional polish, not a requirement.

## Recommended Approach (ranked)

### ✅ RECOMMENDED — Approach B: default-OFF seal-skip guard + `dist:verify:mac --dir`

One-line conditional around the single seal call, plus a new script that runs the **existing, audited**
orchestration with `--dir`. Least invasive change that guarantees a *correct, complete, bootable* app.

Why it wins:
- **Release path byte-identical when the flag is absent** — grep-provable (see Risks).
- **Reuses the complete build sequence** (MCP bundling, bundled-bun, constitution authority, native
  rebuild, Developer-ID signing, skill-pack staging assertion) → no risk of a silently-incomplete app.
- **Forges nothing** — the seal is omitted, not faked. No trust-root/attestation code is touched.
- `--dir` skips DMG + `notarizeDmg` entirely; `afterSign` already skips notarization without creds.

### ⚠️ ALTERNATIVE — Approach A: zero-source-diff, direct `electron-builder --dir`

`bun run package` → `node scripts/build-mcp-servers.js` → (stage bundled-bun/officecli) →
`bunx electron-builder --dir --config electron-builder.yml`. No file edits at all.
- **Pro:** literally zero change to any release file.
- **Con:** must manually reproduce the prep steps `build-with-builder.js` runs between vite and
  electron-builder; drift-prone as that script evolves; high risk of an incomplete app (missing
  bundled-bun / MCP → chat round-trip fails). "Zero diff" is illusory savings versus one guarded line,
  and it is not cleanly *repeatable/sanctioned* without documenting the same fragile sequence.

### ❌ REJECTED — Approach C: Q-E "local-unattested-verification seal"

Generate local receipts and write a `mode: "local-unattested-verification"` seal skipping only the
attestation step. Rejected: nothing reads the seal, so this is pure overhead and needlessly couples the
local path to the seal system. Documented here only to close the loop on the task's Q-E prompt.

### ❌ REJECTED — satisfy the real seal locally

Impossible without forging: `trustRootCommit` needs `WAYLAND_RELEASE_TRUST_ROOT_SHA` and
`verifyAttestedFile` runs `gh attestation verify --signer-workflow <protected>`. Faking either is the
security breach the guardrails forbid. [VERIFIED: `verifyCandidateCapabilitySeal.js:274-331`]

## Precise Intervention Seams (for the planner)

| # | File | Location | Change |
|---|------|----------|--------|
| 1 | `scripts/build-with-builder.js` | `:625-628` (the `writeCapabilitySeal({...})` call) | Wrap in `if (process.env.WAYLAND_LOCAL_VERIFICATION === '1') { console.warn('⚠️  LOCAL VERIFICATION BUILD — NOT A RELEASE; capability seal omitted'); } else { writeCapabilitySeal({...}); }`. **Leave `verifyThirdPartyExecutableLedger()` at `:624` running** — it is local-safe (validates a local ledger JSON against local authority files, no creds/network/trust-root; `verifyThirdPartyExecutableLedger.js:212-215`) and is a legitimate integrity check even locally. |
| 2 | `package.json` `scripts` | alongside `dist:preview:mac` | Add `"dist:verify:mac": "cross-env WAYLAND_LOCAL_VERIFICATION=1 node scripts/build-with-builder.js auto --mac --dir"` and the matching hook `"predist:verify:mac": "bun run verify:modelsdev-snapshot && bun run build:skill-pack"` (mirror of `predist:mac`, so skill-pack is staged before the `:815` assertion; `prepareConstitutionFs` runs inside build-with-builder). |
| 3 | `justfile` (optional) | near `packaged-ext-build` (`:383`) | Add `verify-package: preflight` → `bun run dist:verify:mac`, and optionally `smoke-cockpit: verify-package` → `node scripts/packaged-cockpit-smoke.mjs` for one-command local smoke. |
| 4 | (no change) | `scripts/packaged-cockpit-smoke.mjs` | Already resolves `out/mac-arm64/*.app`; run with `WAYLAND_CDP_PORT=<port>` and the burner Flux key. No edit needed. |

**Run sequence after the change:**
```
bun run dist:verify:mac                    # → out/mac-arm64/Wayland.app (signed, unsealed, --dir)
WAYLAND_CDP_PORT=9340 node scripts/packaged-cockpit-smoke.mjs   # boot + surfaces + chat round-trip
git checkout -- src/process/services/constitution/constitutionFsAuthority.generated.ts   # per D-CONTEXT
```

## Confirm-gate for Sean (SECURITY-SENSITIVE — do not assume approval)

**Decision:** Add a **default-OFF** `WAYLAND_LOCAL_VERIFICATION=1` guard that makes
`build-with-builder.js` **skip the capability-seal write** (and only that) when producing an explicitly
non-release local `--dir` build, so `packaged-cockpit-smoke.mjs` has an `.app` to run.

**What this does and does NOT do:**
- Does: omit `public/capability-seal.json` on local verification builds; emit a loud "NOT A RELEASE" log.
- Does NOT: forge or fake any attestation, spoof `WAYLAND_RELEASE_TRUST_ROOT_SHA`, touch
  `gh attestation verify`, weaken any fuse, or alter the release path. The seal call is unchanged in the
  `else` (release) branch.

**Why it is low-risk:** the app and the smoke never read the seal (Q-C/Q-D verified NO), and the flag
defaults OFF, so CI/release builds (which never set it) are byte-identical to today. The constitution
runtime gate and Developer-ID signing still apply, so the smoke exercises a genuinely representative
build.

**My recommendation: approve Approach B.** It is the least-invasive change that keeps release strictness
provably intact while unblocking local packaged verification. Confirm: (a) the flag name/default-OFF
posture, (b) that omitting (not forging) the seal is the intended honest behavior, and (c) whether you
want the optional `just` recipe.

## Risks + How the Plan Verifies "Release Path Unchanged"

| Risk | Mitigation / verification |
|------|---------------------------|
| Guard accidentally alters the release path | Grep proof: `grep -n "WAYLAND_LOCAL_VERIFICATION" scripts/build-with-builder.js` must show it ONLY wrapping the `:625` seal call; the `else` branch must be the verbatim original `writeCapabilitySeal({...})`. Diff must be limited to that block + the two new package.json script lines. |
| Trust-root / attestation code touched | `git diff scripts/capability-seal/` must be **empty**. `grep -rn "WAYLAND_RELEASE_TRUST_ROOT_SHA\|gh attestation" scripts/` unchanged. |
| CI/release build behavior drifts | CI never sets `WAYLAND_LOCAL_VERIFICATION`; assert default is unset. Optionally add a guard test asserting `writeCapabilitySeal` is still invoked when the env var is absent. |
| Incomplete app (missing MCP/bun) → false smoke failure | Route through `build-with-builder.js` (Approach B) so all prep steps run; the `:815` skill-pack assertion and `extraResources` copy stay in force. |
| Ad-hoc/Dev-ID signing + hardened runtime blocks child spawns | Keychain Developer-ID identity is present → electron-builder signs properly; `signIgnore` preserves nested binary sigs. Verify during live-run that the chat round-trip (spawns wayland-core) succeeds; if a codesign issue surfaces, `runBundleIntegrityCheck` logs the offending path (non-fatal). |
| Stale generated `constitutionFsAuthority.generated.ts` left in tree | Revert after build per D-CONTEXT:96 (`git checkout -- ...`). |

## Runtime State Inventory

N/A — no rename/migration of stored data. The change adds a build-time env-gated branch and two
package.json script lines. No datastore keys, service config, OS registrations, secrets, or persisted
runtime state are affected. `public/capability-seal.json` is an untracked build artifact whose absence
on local builds is inert (never read at runtime).

## Environment Availability

| Dependency | Required by | Available | Notes |
|------------|-------------|-----------|-------|
| macOS + Xcode `codesign` | electron-builder mac signing | ✓ | dev machine |
| Developer-ID Application identity (keychain) | proper mac signature (hardened runtime child spawns) | ✓ | present per task; no `CSC_*` env needed |
| `electron-builder` / `electron-vite` / `cross-env` | build | ✓ | devDependencies |
| Burner Flux key `~/.config/wayland-smoke/flux-test-key` | smoke chat round-trip | ✓ | per task |
| `WAYLAND_RELEASE_TRUST_ROOT_SHA` + `gh attestation` | **release** seal (NOT needed locally) | ✗ (by design) | CI-only; the whole point is to not need it locally |
| `appleId`/`appleIdPassword`/`teamId` | notarization | ✗ | `afterSign.js` skips gracefully; `--dir` skips DMG notarize |

**Missing with no fallback:** none for the local `--dir` smoke path.
**Missing with fallback:** trust root / Apple creds — the `--dir` + seal-skip path is the fallback.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (unit) for any guard test; the *artifact* validation is the CDP smoke, not a unit test |
| Quick run | `bun run test:vitest <pattern>` (for an optional build-with-builder guard unit test) |
| Artifact validation | `node scripts/packaged-cockpit-smoke.mjs` against `out/mac-arm64/*.app` |
| Full suite | `npm test` (unchanged) |

### Requirement → Test Map
| Req | Behavior | Type | Command | Exists? |
|-----|----------|------|---------|---------|
| D-08 | `dist:verify:mac` emits a bootable `out/mac-arm64/*.app` | manual/integration | `bun run dist:verify:mac` then check `out/mac-arm64/*.app` | ❌ new script |
| D-08 | packaged app boots + surfaces render + chat round-trip | e2e/CDP | `WAYLAND_CDP_PORT=9340 node scripts/packaged-cockpit-smoke.mjs` | ✅ existing harness |
| D-08 | release path unchanged when flag absent | unit (optional) | assert `writeCapabilitySeal` invoked without env var | ❌ Wave 0 (optional guard test) |

### Sampling
- Per change: `bun run dist:verify:mac` + `packaged-cockpit-smoke.mjs` green.
- Release-safety gate: `git diff scripts/capability-seal/` empty; guard grep confined to the `:625` block.

### Wave 0 Gaps
- [ ] `package.json` scripts `dist:verify:mac` + `predist:verify:mac` (new).
- [ ] (optional) unit test asserting seal is still written when `WAYLAND_LOCAL_VERIFICATION` is unset.
- [ ] (optional) `just` recipes `verify-package` / `smoke-cockpit`.

## Security Domain

The change is a **build-time** switch; it introduces no new app attack surface. The security-relevant
property is *non-erosion of the release trust boundary*:

| ASVS-ish concern | Applies | Control |
|------------------|---------|---------|
| Supply-chain / build integrity | yes | Seal-skip is gated default-OFF; release path (flag absent) invokes the unchanged `writeCapabilitySeal` → trust-root + `gh attestation verify` still enforced. `verifyThirdPartyExecutableLedger` still runs locally. |
| Provenance forgery | mitigated | Nothing is forged; the seal is *omitted*, not faked. No file that could be mistaken for a release seal is written. |
| Code signing / hardened runtime | preserved | Developer-ID signing + `signIgnore` + fuses (afterPack) unchanged; local build is genuinely signed. |

STRIDE (Tampering / Repudiation): the guard could be abused to ship an *unsealed* build as if it were a
release — mitigated because the flag defaults OFF, CI never sets it, and the seal is a **release-gate**
artifact whose absence is caught by the release acceptance pipeline (unsealed candidate → no attestation
→ release fails). Recommend the plan add the grep/diff release-safety assertions above.

## Sources

### Primary (HIGH — verified in this worktree, HEAD `72bfb618e`)
- `scripts/build-with-builder.js:50-57,508-512,585,619-628,640-644,673-820,897` — seal call site, arg passthrough, prep steps, builder command
- `scripts/capability-seal/verifyCandidateCapabilitySeal.js:274-331,333-346,545-670` — trust root + attestation gate; `createCapabilitySeal`/`writeCapabilitySeal`
- `scripts/supply-chain/verifyThirdPartyExecutableLedger.js:205-215` — local-safe ledger check
- `scripts/afterPack.js:38-59,272`; `scripts/afterSign.js:22-45`; `electron-builder.yml:18-24,110-111,245-263,306-310`; `electron-builder.preview.cjs` — hooks/config carry no seal/cred dependency
- `src/` greps: no `capability-seal`/`capabilitySeal` matches (runtime never reads the seal); `public/capability-seal.json` untracked
- `src/process/services/constitution/constitutionFsBinary.ts:24,82-112,209-278`; `constitutionFsService.ts:222`; `src/index.ts:1185-1194`; `src/process/services/integrity/bundleIntegrity.ts:92-134` — the real runtime gates, independent of the seal and non-blocking
- `scripts/packaged-cockpit-smoke.mjs:107-118,274,322-326,416-448,617-653`; `scripts/packaged-launch.mjs:26-66`; `platform-package-smoke.mjs:201` — smoke resolves `.app`, no seal assertion
- `justfile:180-185,240-252,275-280,378-385`; `package.json` scripts — existing build/dist/smoke recipes

### Secondary / Tertiary
- None required — all claims verified against source in this session.

## Metadata

**Confidence breakdown:**
- Seal is isolated to one call site (Q-B): HIGH — traced; hooks/config independently confirmed.
- App/smoke never read the seal (Q-C/Q-D): HIGH — two independent greps + smoke read.
- Recommended intervention preserves release path: HIGH — single guarded line, byte-identical else branch.
- Local signed `.app` boots + child-spawns for chat round-trip: MEDIUM-HIGH — signing path confirmed;
  live child-spawn success to be reconfirmed at plan execution (noted as a risk).

**Research date:** 2026-07-24
**Valid until:** ~2026-08-23 (re-verify only if the capability-seal ceremony, electron-builder hooks, or
the constitution authority flow are refactored).

## RESEARCH COMPLETE

**Phase:** WLD-D (D-08) — Local packaged-verification build path
**Confidence:** HIGH

### Key Findings
- The release seal is called in exactly ONE place — `build-with-builder.js:625`
  `writeCapabilitySeal(...)`, unconditional, before any preview/stable split; it transitively needs the
  CI-only trust root + `gh attestation verify`. Nothing else (electron-builder hooks/config, afterPack,
  afterSign) requires the seal or signing/notarization creds.
- **The app never reads the capability seal at runtime** (`grep -rn capability-seal src/` → empty;
  `public/capability-seal.json` untracked) and **the smoke never asserts it** — so Q-C and Q-D are both
  **NO**, which makes the elaborate Q-E "local verification seal" **unnecessary**.
- The only runtime integrity gates (constitution FS authority + codesign self-check) are satisfied by
  the normal `build-with-builder.js` package flow and are independent of the seal.
- **Recommendation:** a default-OFF `WAYLAND_LOCAL_VERIFICATION=1` guard that *skips* (does not forge)
  the seal write, plus a `dist:verify:mac … --dir` script reusing the audited orchestration. Release
  path stays byte-identical (grep/diff-provable). Approach A (zero-diff direct `electron-builder --dir`)
  is a viable but fragile fallback; the Q-E fake-seal and any attempt to satisfy the real seal locally
  are rejected.

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Seal isolation / bypass seam | HIGH | single traced call site + independent hook/config reads |
| App/smoke seal-independence | HIGH | two greps + smoke source read |
| Release-path-unchanged guarantee | HIGH | one guarded line, verbatim else branch |
| Local signed `.app` child-spawn at runtime | MEDIUM-HIGH | signing path confirmed; live-verify at execution |

### Confirm-gate for Sean
Approve the default-OFF `WAYLAND_LOCAL_VERIFICATION` **seal-skip** (not seal-forge) guard. It forges
nothing, spoofs no trust root, touches no attestation code, and leaves the release path byte-identical.
Recommended: approve Approach B.

### Ready for Planning
Research complete. Planner can create a single D-08 packet: (1) guard `build-with-builder.js:625`,
(2) add `dist:verify:mac` + `predist:verify:mac`, (3) optional `just` recipes, (4) release-safety
grep/diff assertions, (5) live smoke via `packaged-cockpit-smoke.mjs`.
