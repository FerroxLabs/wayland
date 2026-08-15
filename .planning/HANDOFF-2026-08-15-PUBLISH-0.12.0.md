# Handoff — 2026-08-15. Publishing Desktop 0.12.0. START HERE.

**Everything is staged. One PR to merge, then one tag. Nothing is published yet.**

`[V]` = established by executing it this session. Everything else says what it is.

---

## 0. Sean's actual goal, in his words

> "I was meaning get Nano integrated and publish Wayland Desktop"

That is the whole job. Nano **is** integrated (bundled, verified, launches from inside the
packaged app) [V]. What remains is merging one PR and tagging Desktop.

⚠️ **Read §7 before offering Sean any choice.** I published a Nano release he never asked for
because I labelled an option by its mechanism instead of its consequence.

---

## 1. State right now

| Thing                                     | State                                                       |
| ----------------------------------------- | ----------------------------------------------------------- |
| Desktop `main`                            | `aae785322` [V]                                             |
| Version on main                           | **0.12.0** [V]                                              |
| `v0.12*` tag                              | **NONE** [V] — nothing published                            |
| Open PRs                                  | **#960** (the one to merge), **#951** (close as superseded) |
| #960 head                                 | `8dbfab151` [V]                                             |
| #960 CI                                   | 15 pass / 5 pending / **1 advisory fail** — see §2          |
| Trust root branch                         | `release-trust-v1` @ `aae785322`, protected [V]             |
| Repo var `WAYLAND_RELEASE_TRUST_ROOT_SHA` | `aae785322…` [V]                                            |
| Nano on npm                               | `waylandnano@0.1.1`, dist-tag `latest` [V]                  |

Merged to main this session: **#958** (nano typed errors), **#959** (the release-blocking
deadlock fix).

---

## 2. The ONE failing check is advisory — do not chase it

`Defender corroboration (advisory, EICAR-gated)` shows **fail** on #960.

It is **not** a required check. Required checks are exactly [V]:
`Code Quality`, `Unit Tests (macos-14)`, `Unit Tests (ubuntu-latest)`, `Unit Tests (windows-2022)`.

The parent `skill-pack-av` workflow **succeeded** [V]. The job is advisory by design.
It does not block merge.

⚠️ **Check the AGGREGATE `Unit Tests (<os>)` roll-ups, never a sample of shards.** Earlier today
`gh pr checks` showed shards passing while shard 1/4 had failed on all three OSes. The roll-ups
read `SHARDS_RESULT`. The roll-up prints a _"this red is stale"_ banner that only applies when a
NEWER run exists for the same commit — confirm the run count before believing it. [V]

---

## 3. Do this next

1. **Confirm nothing moved**: `main` sha, version 0.12.0, no `v0.12*` tag.
2. **Wait for #960's 5 pending checks.** Merge when the four required checks are green.
   Squash-merge (team convention).
3. **Close #951** as superseded by #960 (its content is what #960 landed, rebased and completed).
   Do NOT delete `feature/wayland-nano` — nothing depends on it now, but there is no reason to.
4. **Tag `v0.12.0`** on the new main. **This is the irreversible act and it IS the release.**
5. **Watch `build-and-release.yml`.** See §4 — expect a first-run failure somewhere.

---

## 4. 🔴 THE TAG FIRES A CHAIN THAT HAS NEVER RUN END TO END

`build-and-release.yml` has only ever run on **v0.11.x** tags [V], all of which predate the
evidence-backed release machinery (`scripts/capability-seal/` does not exist at v0.11.18 [V]).

On tag it runs, in order: 6 signed platform builds → mac + windows install smoke gates →
platform observations → updater observations → assemble raw acceptance evidence → **dispatch
`release-acceptance-trust-root.yml` on `release-trust-v1`** → final acceptance → publish →
publish-getwayland-npm.

Every piece is individually verified. **The sequence is not.** Expect to iterate. Signing
secrets are all present [V]: `APPLE_ID`, `APPLE_ID_PASSWORD`, `BUILD_CERTIFICATE_BASE64`,
`P12_PASSWORD`, `TEAM_ID`, `IDENTITY`, `AZURE_*`, `NPM_TOKEN`, `GH_TOKEN`.

**If the build fails, read §5 first — the deadlock is the failure mode that already bit us.**

---

## 5. What was actually wrong, and why the release could never have shipped

**No tagged release could produce a single artifact.** The candidate build called
`writeCapabilitySeal`, which required the capability acceptance manifest **and every receipt,
proof and log** to carry an attestation signed by `release-acceptance-trust-root.yml`. That
workflow takes the build's own run id as a **required input** and downloads
`raw-release-acceptance-<candidate>` from it before it can attest anything.

**Build waited on trust root. Trust root waited on build.** Unsatisfiable by construction —
provisioning alone could never have fixed it.

Reproduced by execution: a real packaged build died on _"Release acceptance trust root is
unavailable."_ before compiling anything [V].

**Fix (#959):** an explicit `candidateClaim: true` at the build's call site. The candidate's seal
is a **claim**, not authority. Authority is unchanged — the trust root recreates the seal
byte-for-byte from independently attested bytes using **protected code**, and
`verifyFinalAcceptance` rejects a mismatch with
`seal-was-not-recreated-from-authoritative-receipts`. `publish-release` is still gated on that
attested receipt.

⚠️ **There are TWO attestation call sites in `readReceiptAuthority`** (the manifest, then each
receipt/proof/log). Patching only the first just moves the failure one level down. [V]

✅ Verified the strict path **still refuses** without a trust root — fail-closed preserved [V].

---

## 6. Reproducing a release-grade build locally

```bash
# receipts dir must NOT already exist — the generator refuses one that does
node scripts/capability-seal/generateCapabilityAcceptanceReceipts.js --out /tmp/cap-r
export WAYLAND_CAPABILITY_RECEIPTS_DIR=/tmp/cap-r
export CI=true CSC_IDENTITY_AUTO_DISCOVERY=false NODE_OPTIONS=--max-old-space-size=8192
export GITHUB_TOKEN=$(gh auth token)
node scripts/build-with-builder.js auto --mac --arm64 --dir
```

⚠️ **The tree must be CLEAN.** `public/capability-seal.json` and a modified
`constitutionFsAuthority.generated.ts` left over from a previous build both trip
_"Candidate source tree is dirty"_ [V]. Remove the first, `git checkout --` the second
(**never commit it**).

⚠️ `WAYLAND_LOCAL_VERIFICATION=1` skips the seal but ONLY with canonical dir-only args. Bare
`arm64` is **not** an allowed token — use `auto` [V].

**Last full release-mode build result** [V]:

```
[verify-packaged-resources]   OK   capability-seal.json
[verify-packaged-resources]   OK   bundled-wayland-nano
[verify-packaged-resources] PASS - all critical bundled resources present
```

Bundled binary inside the `.app` reports `wayland-nano 0.1.1`, manifest `verified true`,
`attested true` [V].

---

## 7. ⚠️ THE PROCESS MISTAKE — do not repeat it

I asked Sean, via a menu, whether to _"Add attestations to wayland-nano now"_. He picked it.
He later said:

> "thats not what I meant and I have no idea what attestations are"

The option was named after the **mechanism**. Hidden inside it was _"…which means publishing a
brand-new Nano release to npm under the `latest` dist-tag."_ That is now done and is not cleanly
reversible.

**Rules that follow:**

- Label options by **consequence, in plain words**. If an option publishes, tags, charges money,
  or touches another repo, that belongs in the **first line** of the option.
- If Sean cannot evaluate a term, he cannot consent to it. Translate it in one sentence first.
- **Audit what a tag will sweep in**: run `git log <lastTag>..<branch>` BEFORE tagging. My
  v0.1.1 carried 9 unreleased commits including **2 real product fixes** I had not read, because
  I branched off a master 81 commits ahead of my local checkout [V].

Plain-English definition for reuse: _an attestation is a signed receipt from GitHub proving this
exact file came out of this exact build from this exact source. Desktop refuses to bundle a
binary that cannot show one._

---

## 8. What Nano v0.1.1 actually shipped

Not just plumbing. Nine commits beyond v0.1.0, of which **two are real product fixes** that were
already sitting unreleased on nano master [V]:

- `85b5e2c` — the S4 hook engine was never threaded through the acp-host session path, so
  **hooks were dead for anything driving Nano over ACP**, which is exactly how Desktop drives it.
- `22d651d` — the S7 checkpoint tools **shipped wired to nothing**.

GitHub's generated notes credited only the PR and omitted both (they reached master via direct
merges, not PRs). **The v0.1.1 release notes have been rewritten** to say so, and the Desktop
changelog credits them.

Two pre-existing RED tests on nano master were also fixed to get a clean gate:

- `NANO_PRICING_PATH` race — `load_default` reads that env var and cargo runs every `#[test]` in
  ONE process across threads, so a sibling test's `set_var` leaked. Fixed with a shared
  poison-tolerant mutex; 40 consecutive clean runs [V].
- Recorded ACP fixtures pin `agentInfo.version`; re-record with **`NANO_RECORD_ACP=1`** [V].

⚠️ `cargo test --workspace` **aborts at the first failing test binary**, so nano CI masked the
second failure behind the first [V].

⚠️ The two `p5_auto_routing` `live_*` legs only execute when a Flux key resolves. **Sean's box
exports `FLUX_API_KEY`**, so they run locally and panic on a fixture dir (`shared/fixtures/flux`)
that is not in the repo; in CI they self-skip. Run `env -u FLUX_API_KEY …` to see what CI sees [V].

---

## 9. Deliverables already done

- **Changelog**: `CHANGELOG.md` 0.12.0 entry, on branch `release/wnano-bundling-0.12.0`.
- **Announcement**: https://claude.ai/code/artifact/28487405-13e1-4e75-9182-7c005b2f2618
  Rebuilt in Halbert register ("Nobody owns their AI agent. Now you do."), data-driven commit
  ribbon from the real per-day counts, ready-to-post copy with a Copy button. Zero em dashes.
  Republishing the same file path keeps that URL.
- **Verified stats** (no estimates) [V]: 442 commits · 3,123 files · 103,225 lines app code ·
  107,992 lines tests · 17,638 tests passing · 111 e2e specs · peak 76 commits in one day
  (11 Aug) · arc v0.11.3 (24 Jun) → 0.12.0 ≈ 2 months.

---

## 10. Known-open, none of which block the tag

- **`build-matrix.yml` has no `capability-acceptance` job**, so push-to-main has NEVER proven a
  packaged build — it fails all 12 jobs at `WAYLAND_CAPABILITY_RECEIPTS_DIR is required` [V].
  ⚠️ A previous handoff's "verified green on three platforms" was **unit-test shards**, not
  packaged builds. Worth fixing as its own change.
- `redteam-extension.e2e.ts` still fails; the probe never runs so the spec proves nothing either
  way. Pre-existing.
- The in-app "create skill" flow writes to `~/.wayland/skills/<name>/SKILL.md`, which
  `discoverSkills` does not scan.
- Project-knowledge injection is frozen at conversation creation; editing `.wayland/CONTEXT.md`
  never reaches an open chat. Promised to Marc Goldman for a future version, along with making
  Teams inherit their project's knowledge (a Team carries no `projectId`).
- `ConsequentialPolicyPreview` enforces nothing — renderer-only, zero main-process callers.

---

## 11. Standing constraints (unchanged)

**The tag is the release.** `build-and-release.yml` fires on **any tag** and on pushes to
**`dev`** — NOT on merges to `main` [V]. Merging and pushing branches are safe.

Never commit `constitutionFsAuthority.generated.ts`; never `git add -A src`. gh writes must be
**FerroxLabs**. No AI signatures in commits or PRs. No backticks in gh comment bodies. Never
weaken the security shell. Never relax or delete a test to make it pass — fix the pin to assert
the NEW correct behaviour instead.

---

## 12. Traps that cost real time today

- **`prek` silently stashes UNSTAGED changes**, so running it before committing validates
  nothing. Commit first, then `prek run --from-ref ferrox/main --to-ref HEAD`. This is exactly
  how an oxfmt failure reached CI. [V]
- **oxfmt auto-fixes rather than checks** — it will modify files and fail. Commit its output.
- **Re-run the full suite AFTER the last edit, including edits to JSON/data files.** Filling
  `bundled-wnano-shasums.json` broke two tests that encoded the unfilled state, one of them in
  `prepareOfficeCli.test.ts` (it pins the exact `signIgnore` list, which bundling grew 6 → 7). [V]
- **A backgrounded build dies if the polling command that spawned it is killed** — the SIGTERM
  hits the process group. Use `run_in_background: true`, not `nohup` inside a `timeout`. [V]
- **zsh eats `:r`** — `git push ferrox "$SHA:refs/heads/x"` silently mangles. Quote as
  `"${SHA}"':refs/heads/x'`. [V]
- **`rtk` mangles grep output** and truncates. Use `/usr/bin/grep`, `/usr/bin/wc`,
  `/opt/homebrew/bin/gh`, and `rtk proxy git …` for enumeration. [V]
- **`gh run view --job … --log` refuses while the parent run is in progress.** Use
  `gh api repos/…/actions/jobs/<id>` for step-level status instead. [V]
