# HANDOFF — 2026-07-25 — D-08 DONE (local packaged-verify) + a D-01 regression it caught (PENDING Sean)

**Read first on resume.** All code LOCAL on branch `worktree-agent-desktop-integration` in the canonical
worktree **`~/dev/wayland-worktrees/desktop-integration`** (worktree of `~/dev/wayland/app`, remote
`ferrox` → FerroxLabs/wayland). HEAD `8e21e5b4e`. **Nothing pushed.** Supersedes
`.planning/HANDOFF-2026-07-24-milestone-D-complete.md`.

## TL;DR

1. **D-08 (local packaged-verification build path) is DONE, cross-audited, full-suite-green, local-only.**
   It gives us a sanctioned `bun run dist:verify:mac` that produces a launchable `out/mac-arm64/*.app`
   for `scripts/packaged-cockpit-smoke.mjs` WITHOUT touching the release trust boundary. Detail:
   `.planning/phases/WLD-D-inbox-repairs/D-08-{RESEARCH,PLAN,SUMMARY}.md`.
2. **D-08's first real run caught a shipping-blocker in D-01 (#890).** The packaged build now clears the
   seal gate and dies at the next gate: `scripts/whatsapp-bridge-source.json` is STALE. **ONE decision
   pending from Sean:** regenerate that pin (recommended) or track it as a D-01 follow-up.
3. Once the D-01 pin is regenerated, the packaged smoke can complete → that unblocks the whole batched
   pre-publish pass (packaged-GUI live-verify of D-03..D-07 + D-07 token-cost sweep + #910b + #537).

## D-08 — what was built (5 commits `1d8dcabb9..8e21e5b4e`)

Full Ferrox loop: research → plan → plan-check (PASS) → build (executor) → **4-model cross-audit** →
remediation → re-audits → **class-closing fix**. Full unit suite **15,711/0**, tsc clean.

The one-line idea: a default-OFF `WAYLAND_LOCAL_VERIFICATION=1` (only honored WITH `--dir`) that OMITS
(never forges) the release capability seal, so a local `--dir` build boots for the smoke. The seal is a
CI-only release-acceptance artifact (trust root + `gh attestation verify`) the running app and the smoke
never read — so omitting it locally crosses no security line.

Cross-audit findings, all closed (see D-08-SUMMARY for file:line):

- F1 seal-is-also-a-critical-packaged-resource (dead build) → `--allow-missing-seal` threaded to the verifier.
- F2 stale seal rides into the `.app` → `fs.rmSync` in skip branch + verifier fails closed on a present seal.
- F3 `argv.includes('--dir')` ≠ effective dir build (unsealed DMG via `--mac dmg --dir`, Codex reproduced
  vs electron-builder 26.10) → allowlist-strict `isCanonicalDirOnlyArgs` (fail-safe to the seal path).
- DMG-retry recovery could rebuild an unsealed DMG from a failed `--dir` build → `allowDmgRetry` guard.
- **CLASS CLOSED:** fail-closed post-build assertion — a verification build that produced ANY distributable
  (dmg/pkg/zip/…) throws. Audit loop stopped here on purpose (no round-4 whack-a-mole; the invariant is
  now enforced, not patched per-path).

Release-safety (provable): flag absent ⇒ release path byte-identical; `git diff 72bfb618e..HEAD --
scripts/capability-seal/` EMPTY; no trust-root/attestation/fuse/signing edits; `grep -rniE
"capability[-_]?seal" src/` empty. CI/release scripts never set the flag or pass `--dir`.

Proven working: live `dist:verify:mac` fired the guard, produced a seal-free artifact (`seal absent
(good)`), cleared the seal gate.

## THE ONE PENDING DECISION — D-01 (#890) whatsapp-bridge source-mirror regression

**Diagnosis (verified):** `scripts/build-with-builder.js:prepareWhatsAppBridgeResources` runs
`verifySourceMirror` (in `verify-packaged-resources.js:647`) which pins exact size+sha256 of each bridge
source file via `scripts/whatsapp-bridge-source.json`. D-01's fork→spawn / pino→fd2 migration (`f2a4a4bce`):

- **CHANGED `src/process/channels/whatsapp-bridge/backends/baileys.js`** — actual sha `d174babb…` size 15582
  vs pinned `655a1959…` size 15207.
- **ADDED `src/process/channels/whatsapp-bridge/backends/bridgeLogger.js`** — not in the authority at all.
- did NOT regenerate `scripts/whatsapp-bridge-source.json` (last touched pre-D01 at `791fccb34`).

Effect: `verifySourceMirror` returns false → **every packaged build fails**, incl. CI release. Invisible
until now only because D-01 is unpushed and the seal gate blocked local packaged builds until D-08.

**Recommended fix (Sean to confirm — supply-chain trust re-pin, different packet):** regenerate
`scripts/whatsapp-bridge-source.json` to pin the current bridge source (there is NO generator script — pins
are hand-authored: recompute size+`sha256` for each file under `src/process/channels/whatsapp-bridge/`
matching the authority's `files` map, ADD the `backends/bridgeLogger.js` entry, and confirm the other
gates in `verifySourceMirror` still pass: `verifyBridgeLock`, `verifyWhatsAppNativeTarget`,
`validateOmittedEmptyPlaceholders`, and the exact source-vs-bundle inventory match). The bridge source IS
our own reviewed D-01 code we intend to ship, so re-pinning to match is the correct action, not masking.
After regen: re-run `bun run dist:verify:mac` → should complete → run the smoke.

## NEXT (once D-01 pin is regenerated — the batched pre-publish pass, was blocked on a packaged build)

1. `bun run dist:verify:mac` → `WAYLAND_CDP_PORT=9340 node scripts/packaged-cockpit-smoke.mjs` GREEN
   (boot + all cockpit surfaces + IPC + chat round-trip via burner key `~/.config/wayland-smoke/flux-test-key`),
   then `git checkout -- src/process/services/constitution/constitutionFsAuthority.generated.ts`.
2. Packaged-GUI live-verify of D-03/D-04/D-05/D-06 surfaces against this real `.app` (dev-mode a11y already
   GREEN this session, 6 surfaces; conversations-surface tabs (#910/#882) still want the packaged pass).
3. **D-07 token-cost sweep** (money): ≥4-step tool-heavy wcore workflow → per-step `session_cost` stays FLAT.
4. `tests/integration/i18n-packaged.test.ts` now runnable (needs `APP_ASAR_PATH` from the packaged app).
5. **#910b "Chats"** ratify (recommend RATIFY — 3-line English-`defaultValue` swap, route untouched, aligns
   with the approved Pin/Chats vocab) or `git revert 8f713ea04`.
6. **#537** close comment on Sean's nod (`D-02-CLOSE-COMMENT.md`); none of #909/#910/#885/#891/#853/#508/#882
   can be `fixed-pending-release` until pushed/shipped.

## Cross-audit method (CORRECTED — carry forward)

4-model panel on the same diff, native subscription CLIs: Codex 5.6 Sol (`codex exec --skip-git-repo-check
-m gpt-5.6-sol -s read-only "$PROMPT" < /dev/null`) + Gemini (`cat combined.txt | gemini -m
gemini-3.1-pro-preview --skip-trust -p "…"` — model id is `-preview`; plain `gemini-3.1-pro` 404s) + Kimi K3
(`/Users/seandonahoe/.kimi-code/bin/kimi -p "$PROMPT" --output-format text`, NOT Flux) + internal
`ferrox-code-reviewer`. Panel harness (prompt.txt/combined.txt drivers) in scratchpad `xaudit-d08/`.
Calibration lesson reaffirmed: close the CLASS with a fail-closed invariant instead of chasing each Codex
edge across rounds.

## Guardrails (unchanged)

LOCAL only — no push/merge/release without Sean. gh writes = FerroxLabs (re-assert; drifts to TradeCanyon).
Sean Writer voice, zero em dashes, no backticks in comment bodies, no AI signatures in commits/PRs. Never
touch `~/dev/wayland/app` directly. Source of truth: this file → `.planning/STATE.md` → D-08-SUMMARY.
Note: `AGENTS.md` shows as modified in the tree — that is IJFW project-detection auto-churn (frontmatter
confidence/timestamp), NOT part of any packet; leave it unstaged.
