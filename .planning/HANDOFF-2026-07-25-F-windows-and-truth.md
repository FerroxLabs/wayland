# HANDOFF — 2026-07-25 (evening) — Windows class, Code Quality green, readme truth

**Read this, then `.planning/phases/WLD-F-ci-truth/F-STATE.md`.** Supersedes
`.planning/HANDOFF-2026-07-25-F-discipline.md` for status; that file is still the record of F-01/F-07
and the GSD removal.

Work location `~/dev/wayland-worktrees/desktop-integration`, branch
`worktree-agent-desktop-integration`, HEAD `93fd3965e`, pushed, tree clean.
PR #925 → `main`, `MERGEABLE` but `BLOCKED`. **Nothing merged. Nothing tagged.**

---

## 1. The one thing to do first

Read CI for `93fd3965e` and split the failures by runner, the way
`F-STATE.md` §3 describes. Do NOT read an aggregate "Unit Tests (windows-2022)" result and conclude
anything — it goes red when a single shard is cancelled by the next push.

```bash
gh run view <id> --json jobs --jq '.jobs[] | "\(.conclusion // .status)\t\(.name)"' | sort
```

Last known, on `5d915ff8b`:

| runner           | state                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| **Code Quality** | **SUCCESS** — F-03 is done and proven on CI                                                    |
| macOS            | 3/4 green; the 4th died on `bun install` `ConnectionRefused`, a runner network fault, not code |
| ubuntu           | 3/4 green                                                                                      |
| Windows          | shard 1 was 7 failed / 360 passed, down from near-total failure                                |

`93fd3965e` targets 5 of those 7 Windows files. The two I have not touched are the `chmod ':memory:'`
noise and "Services not registered".

## 2. What landed since the last handoff

### The Windows durability bug was real, shipped-breaking, and mine to find

`f7dd56c86` on this branch added fsync-based durability that Windows cannot perform. `main` has no
`fsyncSync` in `atomicWrite.ts` at all. The CI log spelled out the consequence:
`[Storage] Failed to persist C:\Users\...\wayland-config.txt` — **config never persisted on Windows.**
286 error lines were this one bug. Had #925 merged, every Windows user got a broken app.

Proved on the Windows box rather than reasoned about:

```
file O_RDONLY fsync -> EPERM      file O_RDWR fsync -> OK
dir  O_RDONLY fsync -> EPERM      dir + '.'   fsync -> EPERM
```

That last line matters: the `path.join(dir, '.')` workaround already in the code never worked.

**My first fix pass was incomplete and the commit says so.** It grepped the literal string `fsync` and
missed every `await handle.sync()`. Nine sites fixed, seven missed, EPERM fell 286 → 46 instead of 0.
`3b3918132` enumerated both forms, found nine hand-rolled `syncDirectory` helpers, and routed all seven
broken ones through `src/process/utils/durabilitySync.ts`. **Result on CI: EPERM fsync is now 0, as are
`Failed to persist` and `PUBLICATION_NOT_DURABLE`.**

### External recovery was broken on Windows for a different reason (`93fd3965e`)

Vault files were named from the key id verbatim, and a key id is `rk1:<43 base64url>`. A colon cannot
appear in a Windows filename — NTFS reads `name:stream` as an alternate data stream — so `open()`
created a stream instead of a file and the publishing `link()` failed `EINVAL`. Safe to fix without a
migration: that authority is absent from `main` and from v0.11.16–18.

### F-03 done, and the pinned-artifact trap has FOUR doors

Code Quality is green on CI. It cost three rounds because the trap is wider than oxfmt:

1. **oxfmt** on the delta (288 of 1,337 files).
2. **end-of-file-fixer** wanted to append a newline to `resources/modelsdev-snapshot.json` — the same
   pinned artifact `aea1b4820` broke, through a different hook — plus two `.enc` fixtures and 24
   captured evidence `.log` files.
3. **digest-pinned trees** that no hook checks: `src/process/resources/skills/**` (SHA-256 by
   `prepareOfficeCli.js`) and `tests/fixtures/**` + `strike/**` (digest AND byte size, including a `.ts`
   generator whose own hash is asserted). Only the **full unit suite** caught it — 8 tests, 4 suites.
4. **`src/process/channels/whatsapp-bridge/**`** — pinned by `whatsapp-bridge-source.json`. Reformatting
`baileys.js` (15,582 → 15,420 bytes) broke every packaged build.

`.pre-commit-config.yaml` now records WHY for every exclude. **A formatter exclusion list is only as
good as the last thing that broke it** — expect a fifth door and check the full suite plus a packaged
build after any formatting work.

**Two traps for whoever verifies this next.** oxfmt 0.41.0 produces DIFFERENT output on `linux-x64` vs
`darwin-arm64` for those pinned files, so a green local prek can be a false negative — reproduce with
`docker run --rm -v "$PWD":/repo:ro -w /repo node:22-slim` + `npm i -g oxfmt@0.41.0`. And the UI Tokens
hook found a real defect, not a nit: `StorageSettings/index.tsx:39` used `var(--text-tertiary)`, defined
nowhere, so that line fell back to browser-default text and was near-invisible in dark mode.

### I was wrong about "pending Sean" — twice, on the same item

I told Sean the `whatsapp-bridge-source.json` regen was waiting on him. Both halves were wrong. The
D-01 staleness was already fixed by `e29ccb85a`; I was repeating a stale memory note. And the break that
existed was **mine**, from the formatting pass. Replayed to prove it: 0 drift at `e29ccb85a`, 0 at
`2879f62c6`, 1 file at `e62a6401a`. Fixed in `cca59c5a1`, plus the test that closes the detection gap —
`verifyPackagedResources.test.ts` has 47 cases but every one builds a synthetic tree in a tmpdir and
passes a fabricated authority, so nothing bound the real manifest to the real files. **Verify a "pending
$PERSON" claim before repeating it.**

### readme was telling users two false things (`78949bb14`)

It said macOS builds are "not notarized" and Windows installers "not code-signed yet". Verified against
the shipped artifact, not the wiring: the v0.11.18 dmg is signed by
`Developer ID Application: Ferrox Labs, LLC (PX6SP9GPWJ)` chaining to Apple Root CA, and
`xcrun stapler validate` confirms the notarization ticket is stapled. It also claimed AGPL for "app and
engine both" in two places; Core's own LICENSE is Apache-2.0, which misleads embedders into a legal
conclusion. Both corrected, Windows landed quietly with no announcement.

### AGENTS.md churn is gone, and the last stale worktree is gone

Deleting the 86-line frontmatter alone does NOT stop it — `hoist-frontmatter.js` injects a fresh block
when none is present. The project-local `.ijfw/no-inject` flag gates the whole AGENTS.md merge in
`session-start.sh`, so that is set too. Scoped to this repo, not global.
`wt-desktop-audit-v0.11.18` removed and branch `codex/desktop-cockpit-wave0` deleted at Sean's call;
recoverable via `git branch <name> 5be427bdc` while the object survives.

## 3. Two local flakes, NOT regressions

The final full run was 15,768 passed / 2 failed. Both pass in isolation (27 tests):

- `constitutionFsService.test.ts` — "Constitution filesystem helper timed out". **Takes 115s even alone**,
  because it invokes the real native helper. Under full-suite parallelism it exceeds its budget. This is
  a genuine flake risk on CI too and deserves a proper timeout, same as the `cargo build` case in
  `23f47688b`.
- `useProviderReadiness.dom.test.tsx` — readiness false where true expected; nothing in this arc touched
  provider readiness.

Do not report the suite as green without saying these two exist.

## 4. Still open

- **F-02 remainder:** ubuntu `SNAPSHOT_FILE_TYPE` in `recoveryCapture`/`recoveryPointBuilder` (the
  error now names the offending path and reason, so the next CI log will say what it is),
  `chmod ':memory:'`, "Services not registered", the OfficeCLI runtime message, and whatever survives
  in Windows shards 2–4.
- **F-06 trust root — explained, not yet created.** See §5.
- **P0-1** (pin ACP bridges), **P0-4** (SHA256SUMS asset), **P1-1** (`eval('require')` sandbox),
  **P1-3** (deb/rpm notify-only) — all still open, per `F-04-F-05-RECONCILIATION.md`. **P1-4 must NOT be
  done as written**: it proposes per-user NSIS, reversing the deliberate per-machine UPD-04 decision.
- **Canonical tree `~/dev/wayland/app`:** 16 uncommitted files, 10 commits behind `ferrox/main`. I
  overstated this earlier — it does NOT fail the pin verifier, because that script does not exist at
  that commit, and the modelsdev-snapshot edit is a legitimate catalog regeneration
  (2,201,691 → 3,171,711 bytes), not corruption. It needs triage before anyone builds or branches from
  it, and the refreshed snapshot will need a matching pin once the tree moves to current main.

## 5. F-06, in plain terms

The design separates _running_ a release candidate from _blessing_ it.

- Job `candidate-gates` checks out the exact candidate and runs its gates with **every credential
  stripped** (`GH_TOKEN: ''`, no id-token), so candidate code can never sign or attest.
- Job `final-acceptance` holds `attestations: write` and `id-token: write`, but checks out **its own**
  code from a protected source and treats the candidate as inert data.

Two things anchor that: the workflow refuses to run unless `GITHUB_REF == refs/heads/release-trust-v1`,
and repo variable `WAYLAND_RELEASE_TRUST_ROOT_SHA` pins that branch's exact reviewed commit, because a
branch name alone can move. **Neither exists** (verified: branch 404s, variable unset), so the sealed
build cannot run. It does **not** block merging #925 — it blocks sealed releases.

**Recommendation:** create `release-trust-v1` from `ferrox/main`'s tip (`1b1c1e911`, the line v0.11.18
shipped from), set the variable to that exact SHA, and protect the branch against force-push and
deletion. Point it at `main`, never at this 552-commit branch: the trust root should lag the work it
blesses, not lead it. The human-review step is the whole point of the design, so whoever creates it
should read the pinned commit rather than take the SHA on trust.
