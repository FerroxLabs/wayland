# Handoff — 0.12.0 publish, 2026-08-16

**Sean's goal, in his words: "get Nano integrated and publish Wayland Desktop."**
Nothing else. Nano is integrated. Desktop is what ships.

`[V]` = established by executing it, not by reading code.

---

## 1. State right now

| Thing         | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| `main`        | `2d55e18b9` [V]                                                              |
| Version       | 0.12.0 [V]                                                                   |
| Tag `v0.12.0` | on `2d55e18b9`, release **never published** [V]                              |
| Open PR       | **#968** — the last two fixes                                                |
| Released?     | **No.** Six attempts, all failed closed. No draft, nothing reached users [V] |

Attempt 6 (`31916969171`) is the high-water mark: **three of six platforms fully
green** — linux-x64, linux-arm64, windows-x64 — through packaging, install, launch,
shutdown and the payload smoke.

---

## 2. Next actions, in order

1. Wait for **#968** required checks (Code Quality + Unit Tests ×3).
2. Squash-merge #968.
3. Move the tag: delete `v0.12.0` remote + local, recreate on new `main`, push.
   The push is what fires `build-and-release.yml`.
4. Watch attempt 7. Expect the six builds to pass.
5. **The unknown**: three jobs have never run once — `Release Smoke Gate (macOS
install)`, `Release Smoke Gate (Windows signature)`, `Publish Release`. Every
   never-run gate so far has failed on first contact. Budget for one more round.

Tag move (the only irreversible step, already authorised and done six times):

```
git push ferrox :refs/tags/v0.12.0
git tag -d v0.12.0
git tag -a v0.12.0 <new-main-sha> -m "Wayland Desktop 0.12.0 ..."
git push ferrox v0.12.0
```

---

## 3. The nine bugs fixed (all merged unless noted)

Every one was a gate that had **never executed**, because no release had ever run
end to end. None were regressions.

| #   | PR       | Bug                                                                                            |
| --- | -------- | ---------------------------------------------------------------------------------------------- |
| 1   | #961     | OfficeCLI **self-updates over the network** mid-build, replacing the digest-verified binary    |
| 2   | #963     | Linux inventory rejected musl sharp builds; bun's `--os/--cpu` has no libc axis                |
| 3   | #963     | OfficeCLI mutation guard + long-path config home                                               |
| 4   | #965     | DMG smoke counted one app bundle as two (`/var` vs `/private/var`) and mis-detached partitions |
| 5   | #966     | `ps eww -axo` is BSD-only; procps rejects it                                                   |
| 6   | #966     | `signal-cli-runtime/bin/` untracked and unignored, tripping the clean-worktree gate            |
| 7   | #967     | `Browser.close` treated as shutdown _evidence_ rather than a _request_                         |
| 8   | #967     | **Windows re-signed the bundled third-party runtimes**, breaking their pinned digests          |
| 9   | **#968** | macOS quit signal + wayland-nano `--no-wnano-runtime` opt-out                                  |

---

## 4. Things that will mislead you

- **`gh pr checks` shard rows are not the required checks.** The four required
  contexts are `Code Quality` and `Unit Tests (macos-14|ubuntu-latest|windows-2022)`
  — roll-ups posted only after _all_ shards finish. Poll the check-runs API.
- **`Defender corroboration (advisory, EICAR-gated)` fails and is not required.**
  Ignore it.
- **Branch off `ferrox/main`, always.** I twice built a PR on a branch whose
  predecessor had been squash-merged; both conflicted and CI never ran.
- **Run `prek run --from-ref ferrox/main --to-ref HEAD` after committing**, not
  before — oxfmt rewrites rather than checks, and it reformatted markdown and JS
  after a commit twice.
- **`bun install` tarball extraction fails intermittently** on CI shards. That is
  infrastructure, not a regression. Re-run.
- **Verify on the real platform.** Two conclusions I reached by reasoning were
  wrong until I executed them: the Windows OfficeCLI env override (disproved on
  Sean's Windows box) and the signing hypothesis (which I wrongly abandoned after
  grepping a truncated log, then confirmed by counting all 34 signing operations).

---

## 5. Windows signing — the one decision Sean made

Azure Trusted Signing walks the packaged app and signs every `.exe`, including the
four bundled third-party runtimes and the WhatsApp bridge's npm shims. Signing
rewrites bytes, so the packaged files no longer matched the upstream digests we pin
and attest.

**Sean's call: don't sign what isn't ours.** An Authenticode signature asserts
Ferrox Labs produced the binary; bun, OfficeCLI, Core and Nano are not ours to
vouch for. macOS already did this via `mac.signIgnore`; the Windows asymmetry was
the defect.

Implemented as negative `win.signExts` patterns (electron-builder matches with
`endsWith` against the full path). **The Azure signing pipeline itself is
untouched.** Validated against all 34 real signed paths: 20 skipped, 14 still
signed including `Wayland.exe`, the installer, the uninstaller, `elevate.exe`,
node-pty and 7za. `tests/unit/windowsSignExclusions.test.ts` pins all three
properties.

---

## 6. Deliverables already done

- **Changelog**: written for 0.12.0.
- **Announcement**: https://claude.ai/code/artifact/28487405-13e1-4e75-9182-7c005b2f2618
  Rebuilt around Wayland Desktop, not Nano. Headline "We spent two months breaking
  it on purpose", with 107,992 lines of test code against 103,225 of app code as
  the proof. Nano is a "one more thing" beat: lighter, faster, runs alongside Core,
  may succeed it one day, explicitly not today's promise.

---

## 7. Known-open, deliberately after the release

- **Task #11 — `build-matrix.yml` has no capability-acceptance job.** This is why
  "Build Matrix green" on `main` never caught any of these nine bugs. Fixing it is
  how this stops being a release-day discovery process.
- **OfficeCLI's self-updater is in the binary shipped to users.** It can replace an
  attested runtime after installation, on the user's machine, without asking. The
  build is now protected; the shipped app is not. Needs a decision.
