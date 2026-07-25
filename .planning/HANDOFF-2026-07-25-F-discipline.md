# HANDOFF — 2026-07-25 (late) — Milestone F: F-01 + F-07 done, discipline installed

**Read this, then `.planning/phases/WLD-F-ci-truth/F-STATE.md`.** F-STATE is authoritative for status
and carries the build-discipline gates (G1–G8). This file is the narrative: what happened, what it cost,
and exactly where to pick up.

Work location `~/dev/wayland-worktrees/desktop-integration`, branch
`worktree-agent-desktop-integration`, HEAD `76ab096d3` (pushed, tree clean).
PR #925 → `main`. **Nothing merged. Nothing tagged.**

Supersedes `.planning/HANDOFF-2026-07-25-E02-ci-first-run.md`.

---

## 0. What PR #925 actually is

It is not a side quest, and it must not be abandoned. It is the whole desktop body of work: **552
commits** covering Milestones A, B and D, the onboarding provider-key fix Sean found by live-testing,
the WhatsApp bridge supply-chain re-pin, Milestone F-01, and nine Memory commits from this session.

The ONLY reason it is not merged is that its unit tests genuinely fail on CI. That is now a visible,
honest signal rather than a hidden one — see F-01.

## 1. Shipped this session

### F-01 · The required-checks bypass (`3844b2e1e`)

`main`'s required checks could be satisfied **without running a single test.** `pr-checks-docs.yml`
published three of the four required names as literal `echo "Docs-only PR, skipping unit tests."` jobs.
GitHub `paths:` fires when ANY changed file matches, so a mixed PR (code + one markdown file) ran both
workflows and the stub reported green under the required names. Demonstrated live on #925: **7 of 8 unit
shards failing while all three required `Unit Tests (...)` checks reported PASS.**

The obvious fix does not work, and the workflow's own comments say why: **GitHub counts a SKIPPED
required check as a PASS.** Gating the stub behind an `if:` leaves a green stub.

So the required names now have exactly ONE owner. Deleted the stub workflow, dropped `paths-ignore` so
`pr-checks.yml` runs on every PR, added a `Classify Changed Files` job backed by
`scripts/docs-only-changes.mjs` (the only docs-path list in the repo, 10 unit tests), and the
aggregators always run and always stamp a real verdict. `Code Quality` has no `needs:` for the same
skip-is-a-pass reason and fails fast on drafts.

**Verified live on throwaway PRs #926 / #927** (both closed, all three branches deleted):

| case | result |
|---|---|
| docs-only PR | all 4 required checks green, shards correctly skipped |
| mixed PR + one failing test | all 3 required `Unit Tests` **RED** — the exact old bypass shape |
| draft PR | required checks **RED**, not green-by-skip |

Side benefit: main's own suite is healthy. On #927 only the deliberately-failing test failed, which is
how we know #925's ~38 failures belong to this branch.

### F-07 · IJFW Memory was a dead end (9 commits, `b80ad8beb..d79558053`)

Sean's live find on shipped 0.11.18: Settings reported "Not installed yet" and "Waiting for install"
while IJFW 1.6.5 sat in `~/.ijfw/mcp-server`, Test said "Memory did not respond", and toggling Skip off,
on, and off again fixed nothing. Reinstalling fixed nothing.

**Two independent bugs.**

1. The toggle only persisted `ijfw.skipSetup`. Bootstrap had already run at boot and short-circuited on
   `opt_out`, so turning Skip off re-ran nothing — status stayed stale, `runtimeMode` was never enabled,
   and only an app restart could recover it. Nothing on the page said so.
2. The health probe and Test button called `brainInvoke({verb:'state'})`. `resolveToolCall` direct-maps
   `state` to tool `ijfw_state` and forwards args verbatim, but `ijfw_state` is itself a FACADE that
   requires its own inner `verb` and answers `{"ok":false,"error":"verb (string) is required"}` without
   one. **That probe could never succeed on any install, healthy ones included.** Confirmed against a
   real IJFW 1.6.5 server over stdio: `ijfw_state {}` errors, `ijfw_metrics {}` returns cleanly.

Plus the structural cause: `WAYLAND_E2E_TEST=1` was BOTH the profile-isolation switch and a term in the
IJFW kill switch, so **no packaged smoke could ever exercise Memory.** That is why the packaged cockpit
smoke reported PASS on a build where Memory was dead.

**Live-verified packaged** via the new `bun run smoke:ijfw`, which reproduces the exact symptom then:

```
TOGGLE RECOVERY: PASS
MEMORY TEST PROBE: pass -> Memory responded. All good.
RUNTIME ROW: ok (Memory runtime | Live)
OVERALL: PASS   SMOKE_EXIT=0   DIST_EXIT=0
```

### The cross-audit earned its cost

Four legs (Codex 5.6 Sol, Gemini, Kimi K3, internal reviewer) on the F-07 diff. All three external legs
independently found the same lead defect, and the internal leg found **three regressions I had
introduced**: a toggle that could wedge forever on a timeout-free `npm view`, a rollback that wrote the
opposite of the persisted flag, and a missing disposed guard. It also caught a test of mine asserting a
`{ok:false}` shape the bridge can never produce — coverage of the single hardest case that was pure
fiction. All fixed in `6e15e47fb`, plus lock contention made observable and two comments that asserted
mechanisms which do not exist.

**Gemini's recorded model ID is dead:** `gemini-3.1-pro` → 404 ModelNotFoundError, **and the run still
exits 0**, so a failed audit leg reads as a clean pass. Use the CLI default and fix
[[cross-audit-panel-invocations]].

## 2. Two mistakes I made, so nobody repeats them

**I wrote to Sean's live profile.** A live-test harness redirected `HOME` and I assumed that isolated
the app. It does not — Electron resolves userData independently of `$HOME` on macOS, so the run attached
to the real profile and flipped `ijfw.skipSetup` true→false at 12:23:28. I killed it immediately and
verified the config intact (42 keys, spot-checks present). Now gate **G6**, and `bun run smoke:ijfw`
isolates correctly with `WAYLAND_E2E_USER_DATA_DIR` **and** a redirected `HOME`.

**I shipped tests asserting contracts that could not hold** — twice, on top of the CI stub doing the
same thing structurally. Now gate **G5**.

## 3. Where to pick up — one unambiguous first move

`0859c11a5` fixed the biggest share of F-02: `wcore-profileStore` (27 of ~38 failures) never cleared
`XDG_CONFIG_HOME`, which `profilePaths.platformConfigBase()` prefers over the mocked `homedir()` on its
Linux branch. Every test profile was therefore written to the runner's real
`/home/runner/.config/wayland-core-profiles`, and tests collided with each other. macOS never showed it
because the darwin branch ignores XDG — which is exactly why it passed locally 57/57 and failed only on
CI.

**Verification is inconclusive on macOS by construction. CI is the only proof.**

1. Read CI on PR #925 for the `0859c11a5` run.
   - **Green** → the one-class thesis holds. Continue F-02 with `recoveryCapture` +
     `recoveryPointBuilder` (both `SNAPSHOT_FILE_TYPE`; Linux symlinks in the snapshot inventory; make
     the capture tree an explicit fixture; do NOT relax the symlink assertion). Then
     `constitutionFsTransaction`, `wcoreStderrSurfacing`, `installSignalCli`.
   - **Red** → re-diagnose from the shard log before writing any more code.
2. Then F-03 (formatting, with the pinned-artifact excludes fixed FIRST), F-05, F-04.
3. F-06 whenever Sean sets the trust root.

## 4. GSD is legacy and should be gone — here is why it is not

Sean is right that we migrated to Ferrox. GSD survives in two places:

**Five stale worktrees under `~/gsd-workspaces/`, and ALL FIVE ARE DIRTY** — 101, 101, 5, 3 and 2
uncommitted files, last touched 7–9 days ago, all on `codex/*` strike branches. That is why they were
never removed: deleting them would destroy uncommitted work. They need triage, not a `rm`.

**Legacy `gsd-*` agent definitions still exist alongside every `ferrox-*` equivalent** (`gsd-executor`,
`gsd-planner`, `gsd-verifier`, …). Harmless but confusing, and a live invitation to dispatch the wrong
one. Worth deleting from the agent registry once Sean confirms nothing references them.

**Full worktree picture (31 trees against a canonical layout of 2):**

| group | trees | dirty |
|---|---|---|
| canonical (`~/dev/wayland/app`, `~/dev/wayland-worktrees/`) | 2 | 1 — **`~/dev/wayland/app` on main has 16 uncommitted files** |
| `~/dev/app-worktrees/` | 25 | 1 (`codex/desktop-cockpit-wave0`) |
| `~/gsd-workspaces/` (LEGACY) | 5 | 5 |

**Recommendation:** the 24 clean `app-worktrees` trees are safe to prune now — a clean tree means no
uncommitted loss, and `git worktree remove` does not delete branch refs. The 5 GSD trees, the 1 dirty
app-worktree, and the 16 dirty files in the canonical `main` tree each need a look before anything is
removed. Audit command in F-STATE §5.

## 5. Open decisions that are Sean's

- **Release trust root.** Create protected branch `release-trust-v1`, set repo variable
  `WAYLAND_RELEASE_TRUST_ROOT_SHA` to its reviewed commit. I have the scope and still decline: the agent
  that builds releases must not mint the authority that validates them.
- **`AGENTS.md` churn.** The IJFW hook rewrites its frontmatter every session, which permanently
  conflicts with a clean-tree gate. Either move the frontmatter out of the tracked file or accept
  periodic churn commits. Project policy, not a bug.
- **Worktree pruning**, per §4.

## 6. Guardrails (unchanged)

No merge, no tag, no release without Sean — `build-and-release.yml` fires on ANY tag. `gh` must be
FerroxLabs (drifts to TradeCanyon). No AI signatures in commits or PRs. Never mark an issue fixed before
it ships; the label is `state:fixed-pending-release`. Never touch `~/dev/wayland/app` directly.
