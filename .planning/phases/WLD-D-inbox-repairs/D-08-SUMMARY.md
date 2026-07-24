# D-08 SUMMARY — Local packaged-verification build path (DONE, local)

**Goal:** a sanctioned, repeatable LOCAL build producing a launchable `out/mac-arm64/Wayland.app` so
`scripts/packaged-cockpit-smoke.mjs` can run on a dev machine — WITHOUT breaching the release trust
boundary (no forged attestations / spoofed trust-root SHA) and WITHOUT changing the real release path.

**Status:** BUILT + cross-audited + full-suite-verified, LOCAL only (nothing pushed). Branch
`worktree-agent-desktop-integration`. 5 commits `1d8dcabb9..8e21e5b4e`. Full unit suite **15,711 / 0**
(148 skipped), tsc clean.

## What shipped
- **`scripts/localVerificationGate.js`** (new, pure/dependency-free): `isLocalVerificationBuild(env)`
  (exact `'1'` only), `isLocalVerificationDirBuild(env, argv)` (flag AND canonical `--dir`),
  `isCanonicalDirOnlyArgs(argv)` (allowlist: platform/arch/`--dir`/build flags only),
  `findDistributableArtifacts(names)` (dmg/pkg/zip/exe/msi/appimage/deb/rpm/snap).
- **`scripts/build-with-builder.js`**: the ONE `writeCapabilitySeal` call is guarded — on a local
  verification build it is OMITTED (never forged; a stale `public/capability-seal.json` is `fs.rmSync`'d
  first) with a loud NOT-A-RELEASE warning; else the verbatim release call runs. `--allow-missing-seal`
  is threaded to `verify-packaged-resources.js` only on a verification build. `buildWithDmgRetry` gained
  `allowDmgRetry` (both call sites pass `!localVerificationBuild`) so a failed `--dir` build can never
  recover into an unsealed DMG. New fail-closed post-build assertion: a verification build that produced
  ANY distributable throws.
- **`scripts/verify-packaged-resources.js`**: with `--allow-missing-seal`, the `capability-seal` entry
  requires the seal to be ABSENT (present seal = critical failure); every other critical resource +
  signature check stays fully enforced.
- **`package.json`**: `dist:verify:mac` = `cross-env WAYLAND_LOCAL_VERIFICATION=1 node
  scripts/build-with-builder.js auto --mac --dir` + `predist:verify:mac` (mirror of `predist:mac`).
- **`justfile`**: `verify-package` → `dist:verify:mac`; `smoke-cockpit` → build then
  `WAYLAND_CDP_PORT=9340 node scripts/packaged-cockpit-smoke.mjs`.
- Tests: `tests/unit/localVerificationGate.test.ts` (predicate + arg-bypass + distributable helper),
  `tests/unit/verifyPackagedResources.test.ts` (+ allow-missing-seal present/absent).

## Cross-audit (4-model panel + re-audits) — every finding closed
Panel = Codex 5.6 Sol + Gemini 3.1 Pro (`gemini-3.1-pro-preview`) + Kimi K3 + internal Claude.
- **F1 (HIGH):** the seal is also a `critical:true` PACKAGED-resource check (`verify-packaged-resources.js`
  run at `build-with-builder.js:~1027`), so `dist:verify:mac` died there. → thread `--allow-missing-seal`.
- **F2 (HIGH):** a stale real seal in `public/` could ride into the unsealed `.app`. → `fs.rmSync` in the
  skip branch + verifier fails closed on a present seal.
- **F3 (HIGH, Codex reproduced vs electron-builder 26.10):** `argv.includes('--dir')` ≠ effective dir
  build — `--mac dmg --dir` built an unsealed DMG. → allowlist-strict `isCanonicalDirOnlyArgs` (fail-safe
  to the seal path).
- **DMG-retry (HIGH, Codex round 3):** `buildWithDmgRetry` recovered a failed `--dir` build into a DMG
  from the unsealed `.app`. → `allowDmgRetry=!localVerificationBuild` + the class-closing assertion.
- **CLASS CLOSED:** "a verification build must never yield a distributable" is now a fail-closed post-build
  invariant, not a per-path patch. Audit loop stopped there (no round-4 whack-a-mole).

## Release-safety (provable)
Flag absent ⇒ release path byte-identical (the `else` branch is the verbatim `writeCapabilitySeal` call).
`git diff 72bfb618e..HEAD -- scripts/capability-seal/` is EMPTY. No trust-root/attestation/fuse/signing
edits. `grep -rniE "capability[-_]?seal" src/` empty (no runtime consumer). CI/release scripts never set
the flag and never pass `--dir`.

## Proven working
The live `dist:verify:mac` fired the guard (`⚠️ LOCAL VERIFICATION BUILD … capability seal omitted`),
produced a genuinely seal-free artifact (`seal absent (good)`), and cleared the seal gate that blocked
every prior packaged-build attempt this session.

## What D-08 immediately caught (see handoff)
The build then failed at the NEXT gate — a real **D-01 (#890) regression**: `scripts/whatsapp-bridge-source.json`
is stale (baileys.js drifted, bridgeLogger.js unpinned). That is NOT a D-08 issue; it is the pending item.

## Run it
```
bun run dist:verify:mac
WAYLAND_CDP_PORT=9340 node scripts/packaged-cockpit-smoke.mjs
git checkout -- src/process/services/constitution/constitutionFsAuthority.generated.ts
```
