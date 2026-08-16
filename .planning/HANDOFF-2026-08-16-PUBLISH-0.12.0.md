# Handoff — publishing 0.12.0. START HERE.

**Sean's goal, his words: "get Nano integrated and publish Wayland Desktop."**
Nano is integrated. Desktop is what ships.

**Standing authorization (given 2026-08-16 as he left):** keep fixing and re-tagging
autonomously until 0.12.0 is actually published. Merge, tag, diagnose, fix, re-tag,
repeat. Stop only for something money-touching, irreversible, or a genuine product
tradeoff — and then leave it clearly flagged rather than guess.

`[V]` = established by executing it, not by reading code.

---

## 1. State

| Thing         | Value                                                     |
| ------------- | --------------------------------------------------------- |
| `main`        | `260463d77` [V]                                           |
| Version       | 0.12.0                                                    |
| Tag `v0.12.0` | on `260463d77`; **never published** [V]                   |
| Open PR       | **#969** — Windows ARM64 bun declaration                  |
| Attempts      | 7, all failed closed. No draft, nothing reached users [V] |

### Attempt 7 (`31920809840`) — the high-water mark

| Platform      | Result                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| linux-x64     | ✅                                                                                                                                           |
| linux-arm64   | ✅                                                                                                                                           |
| macos-x64     | ✅                                                                                                                                           |
| macos-arm64   | ✅                                                                                                                                           |
| windows-x64   | ❌ **flake** — puppeteer postinstall got a truncated Chrome zip ("end of central directory record signature not found"). Passed on attempt 6 |
| windows-arm64 | ❌ bundled-bun — fixed by **#969**                                                                                                           |

**Every platform has now built green at least once.** Nothing is known-broken except
what #969 fixes.

---

## 2. Do this

1. Wait for **#969** required checks.
2. Squash-merge #969.
3. Move the tag (below). The tag push is what fires `build-and-release.yml`.
4. Watch attempt 8. Expect six green builds.
5. **The remaining unknown**: three jobs have never executed —
   `Release Smoke Gate (macOS install)`, `Release Smoke Gate (Windows signature)`,
   `Publish Release (both gates passed)`. Every never-run gate so far has failed on
   first contact. Diagnose, fix, re-tag. Keep going.
6. On publish: the release flips to latest, `getwayland` goes to npm, auto-update
   starts serving. Then tell Sean, with the announcement link.

```
git push ferrox :refs/tags/v0.12.0
git tag -d v0.12.0
git tag -a v0.12.0 <new-main-sha> -m "Wayland Desktop 0.12.0 ..."
git push ferrox v0.12.0
```

**A transient failure does not need a re-tag.** Wait for the run to finish, then
`gh run rerun <run-id> --failed`; GitHub re-evaluates the dependent publish jobs.
Use this for the puppeteer/bun-install flakes.

---

## 3. Ten bugs fixed. All were never-executed gates, none were regressions

| PR       | Bug                                                                                         |
| -------- | ------------------------------------------------------------------------------------------- |
| #961     | OfficeCLI **self-updates over the network** mid-build, replacing the digest-verified binary |
| #963     | Linux rejected musl sharp builds; bun's `--os/--cpu` has no libc axis                       |
| #963     | OfficeCLI mutation guard + long-path config home                                            |
| #965     | DMG smoke counted one bundle as two (`/var` vs `/private/var`); mis-detached partitions     |
| #966     | `ps eww -axo` is BSD-only; procps rejects it                                                |
| #966     | `signal-cli-runtime/bin/` untracked and unignored, tripping the clean-worktree gate         |
| #967     | `Browser.close` treated as shutdown _evidence_ rather than a _request_                      |
| #967     | **Windows re-signed the bundled third-party runtimes**, breaking their pinned digests       |
| #968     | macOS never quits on window-close; smoke asserted non-macOS behaviour                       |
| #968     | wayland-nano `--no-wnano-runtime` opt-out for win32-arm64                                   |
| **#969** | bun publishes no win32-arm64 build; declare the absence                                     |

---

## 4. Two decisions already made — do not reopen

**Windows signing (Sean's call).** Don't sign what isn't ours. Authenticode asserts
Ferrox Labs produced the binary; bun, OfficeCLI, Core and Nano are not ours to vouch
for. Implemented as negative `win.signExts` patterns; **the Azure signing pipeline is
untouched**. Validated against all 34 real signed paths: 20 skipped, 14 still signed
including `Wayland.exe`, the installer, the uninstaller, `elevate.exe`, node-pty, 7za.
Pinned by `tests/unit/windowsSignExclusions.test.ts`.

**Windows ARM64 ships without a bundled bun.** Not a regression — it has always been
this way and `verifyBunBundle` didn't exist at v0.11.18, so nothing ever checked.
#969 keeps the behaviour and makes it declared and enforced. **This does not give
ARM64 users bun**; npx-based local MCP servers there still have no bundled runtime,
exactly as in 0.11.18.

---

## 5. Traps that cost real time

- **`gh pr checks` shard rows are not the required checks.** The four required
  contexts are `Code Quality` and `Unit Tests (macos-14|ubuntu-latest|windows-2022)`,
  roll-ups posted only after every shard finishes. Poll the check-runs API.
- **A cancelled shard reds out the roll-up exactly like a failure.** Pushing a new
  commit cancels the in-flight run; that is not a test failure. Check `conclusion`.
- **`Defender corroboration (advisory, EICAR-gated)` fails and is not required.**
- **Never push docs to a PR branch.** It restarts the whole CI cycle. Cost 15 min.
- **New accepting specs need `itAcceptedSweep`**, which skips on Windows — the
  fixture cannot reproduce POSIX executable modes. A plain `it` reds out
  windows-2022 3/4 on `managed-cli-shims/officecli`, which looks unrelated.
- **Run `prek run --from-ref ferrox/main --to-ref HEAD` AFTER committing.** oxfmt
  rewrites rather than checks; it has caught me out repeatedly.
- **Branch off `ferrox/main`.** Twice I built on a branch whose predecessor was
  squash-merged; both conflicted and CI never ran.
- **Infrastructure flakes are common**: `bun install` tarball extraction, puppeteer's
  Chrome download. Re-run, don't debug.
- **Verify on the real platform.** Two conclusions I reached by reasoning were wrong
  until executed: the Windows OfficeCLI env override (disproved on Sean's Windows
  box, `ssh -i ~/.ssh/wayland_win seand@100.109.207.54`) and the signing hypothesis,
  which I wrongly abandoned after grepping a truncated log and then confirmed by
  counting all 34 signing operations.
- **Docker is available** for Linux verification (`docker run --rm ubuntu:24.04`).
  It settled the procps `ps` question definitively.

---

## 6. Deliverables done

- **Changelog**: written for 0.12.0.
- **Announcement**: https://claude.ai/code/artifact/28487405-13e1-4e75-9182-7c005b2f2618
  Rebuilt around Wayland Desktop, not Nano. "We spent two months breaking it on
  purpose", proof being 107,992 lines of test code against 103,225 of app code. Nano
  is a "one more thing" beat: lighter, faster, alongside Core, may succeed it one day,
  explicitly not today's promise. **Post-publish, re-check the copy still matches
  what shipped.**

---

## 7. Follow-ups, deliberately after the release

1. **`build-matrix.yml` has no capability-acceptance job** (task #11). This is why
   "Build Matrix green" on `main` caught none of these ten bugs. Fixing it is how this
   stops being a release-day discovery process. **Highest-value follow-up.**
2. **Bundle the x64 bun for Windows ARM64** under emulation — would give that platform
   a working runtime for the first time. Needs the verifier to accept a deliberately
   cross-architecture binary.
3. **OfficeCLI's self-updater ships to users.** It can replace an attested runtime on
   their machine, unasked. The build is protected now; the installed app is not.
