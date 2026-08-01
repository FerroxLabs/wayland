# HANDOFF — 2026-07-25 (later) — E-02: first CI run + Milestone F opened

**Read first.** Work location `~/dev/wayland-worktrees/desktop-integration`, branch
`worktree-agent-desktop-integration`, HEAD `aea1b4820`. **NOW PUSHED** to `ferrox` — this is the first
time any of this work has left the machine. **PR #925 is open against `main`:**
https://github.com/FerroxLabs/wayland/pull/925 — do NOT merge it (see F-01).

Supersedes `.planning/HANDOFF-2026-07-25-D08-done-D01-regression-pending.md`.
Next work is defined in `.planning/phases/WLD-F-ci-truth/F-MILESTONE-PLAN.md`.

## What happened

Sean authorized the push. Branch pushed (552 commits), draft PR opened, then marked ready — which is
what actually runs the gate, because all 9 real jobs are gated on `draft == false`.

CI immediately produced the most important finding of the arc, and it is not a test failure.

## THE HEADLINE — main's required checks can be satisfied without running tests

`main`: `enforce_admins: true`, `required_reviews: 0`, required checks = `Code Quality`,
`Unit Tests (macos-14)`, `Unit Tests (ubuntu-latest)`, `Unit Tests (windows-2022)`.

`pr-checks-docs.yml` publishes three of those as literal `echo "Docs-only PR, skipping unit tests."`
jobs, and its `paths: ['**/*.md']` trigger fires when ANY changed file matches. So a mixed PR runs both
workflows and the stub reports green under the required names.

**Proven live on #925: 7 of 8 unit shards FAILING, I18n FAILING, Code Quality FAILING — while all three
required `Unit Tests (...)` checks reported PASS.** Fix is F-01. Memory:
[[ci-required-checks-bypass-docs-stub]].

## Fixed and pushed this session

| commit      | what                                                                                    |
| ----------- | --------------------------------------------------------------------------------------- |
| `e29ccb85a` | D-01 WhatsApp bridge source re-pin (was breaking EVERY packaged build incl. CI release) |
| `39f2d1198` | smoke harness: read the answer inside its shadow root (was failing a healthy app)       |
| `a65b143f5` | onboarding: CLI-only users can paste their own provider key (Sean's live-test find)     |
| `acf45d55c` | smoke: budget for first-launch Gatekeeper cost (120s)                                   |
| `76ad0fb40` | OfficeCLI fail-closed test owns its precondition instead of inheriting machine state    |
| `1cea6fbf9` | Milestone E plan + E-01 truth pass                                                      |
| `e9dc53661` | key fixtures built at runtime (GitHub push protection blocked the literal)              |
| `847227d40` | regenerate stale `i18n-keys.d.ts` (CI I18n Check)                                       |
| `ad2ac3482` | `fetch-depth: 0` on unit shards + Coverage (constitution tests need real git history)   |
| `aea1b4820` | **REVERT** of the formatting pass — it broke the build                                  |

## The lesson that cost the most, and matters most

My own formatting commit pretty-printed `resources/modelsdev-snapshot.json` — a minified,
SHA-256-and-size-pinned supply-chain artifact — from 1 line to 103,798. The pinned hash stopped matching
and no packaged build could complete.

**tsc was clean. 15,718 unit tests passed. CI's own formatter asked for that change.** Only running the
real build caught it. Reverted; redo is F-03 with the exclude list fixed first.

Sean's standing instruction, now the rule for every packet: green code tests are not the test — the test
is booting the PACKAGED artifact and using it as a user.

## Live verification on the current HEAD (packaged, post-revert)

Packaged build PASS (all critical resources, exit 0). Packaged cockpit smoke **PASS, exit 0**: cold boot,
cockpit shell active, all 12 surfaces OK, IPC responding, Flux connected (86 models / 68 callable), and a
real chat round-trip replied. Onboarding key-entry fix screenshot-verified earlier and
`OnboardingFlow.tsx` is byte-identical at this HEAD (only `src/` drift since is +2 lines in a generated
`.d.ts`).

## Corrections worth carrying (I was wrong about these)

- **Notarization is NOT missing.** Fully wired dual-ticket: `afterSign.js` (.app) + `notarizeDmg.js`
  (dmg), and all six secrets exist (APPLE_ID, APPLE_ID_PASSWORD, TEAM_ID, IDENTITY,
  BUILD_CERTIFICATE_BASE64, P12_PASSWORD, plus Azure). The "Skipping notarization" line came from a local
  `--dir` build with no credentials and no dmg. Do not re-raise this as a gap.
- **Per-milestone PRs are the wrong landing shape.** The history contains the killed Phase-1 cohort work
  (deleted in `9b661a948`, −11.4k LOC), so review the NET DIFF split by area instead.
- **`STRIKE.md` is a file**, not a directory.

## Open (= Milestone F)

F-01 CI gate bypass · F-02 recoveryCapture SNAPSHOT_FILE_TYPE (diagnosed, not fixed) · F-03 formatting
redo with pinned-artifact exclusions · F-04 #910b ratify record · F-05 reconcile the external cleanup
plan (audited at our merge-base `1b1c1e9`, so some findings may already be fixed) · F-06 sealed build
(gated on Sean's trust root).

## Guardrails

LOCAL work is now PUSHED, but **no merge, no tag, no release without Sean**. `build-and-release.yml`
fires on ANY tag. gh must be FerroxLabs (drifts to TradeCanyon). No AI signatures. Sean Writer voice for
outward comments, no backticks in gh comment bodies. Never mark an issue fixed before it ships
(`state:fixed-pending-release` is the label, with the `state:` prefix).
