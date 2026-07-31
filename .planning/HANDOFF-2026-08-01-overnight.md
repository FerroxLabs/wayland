# Handoff — overnight 2026-07-31 → 08-01

Branch `packet/attribution-audit`, worktree `~/dev/wayland-worktrees/packet-attribution`, base
`15d6740aa` (stacked on PR #925). **63 commits. NOTHING PUSHED. Nothing tagged. Nothing merged.**
Tree clean except `AGENTS.md`, which IJFW rewrites and which has stayed uncommitted all arc.

## Landed tonight

| commit | what |
|---|---|
| `faeb03636` | storage page said "Conversations" after D-06 renamed everything else to Chats |
| `ce43ed0f7` | coverage job stops asking for an OIDC token it can never be given |
| `fc516fd8d` | #907 — OpenClaw protocol window + auth reader honouring an omitted `mode` |
| `f17b90c6b` | Recent Chats badge counts what the list actually renders |
| `6a3b4d78f` | the desktop-residue analysis |
| `e0b2b7012` | why #838 is NOT built, and what it needs |

**Suite: 14,911 passing.** 8 failed in the full run under contention; **all 8 pass in isolation**
(`ChannelModelSelectionRestore`, `missionControlActivity`, `WCoreConfig.dom`,
`ConstitutionClassicRecovery`, `constitutionRecoveryConsumerJourney`, `recoveryCapture`,
`conversationBridge.tray`). Every one is timeout-shaped and none touches a file changed tonight.
`tsc --noEmit` clean. Every fix has a negative control that was actually run.

## Read this first — I was wrong about the CI gate

I reported that the red Coverage check was blocking all 57 commits. **It is not.** Branch protection
requires only `Code Quality` and the three `Unit Tests` jobs; `Coverage Test` is not among them and
PR #925 reads `MERGEABLE`. I also said the workflow declared no `permissions` block — it does, at
`pr-checks.yml:60-64`. Both corrected by direct check, not by taking an agent's word.

The fix I originally proposed — add `id-token: write` — would have been a **security regression**.
That job runs PR-authored code (`bun install`, `postinstall`, `test:coverage`), so an OIDC token
minted there lets any PR author assert this repo's identity to anything that trusts it.
`trustRootJobSeparation.test.ts` already pins that invariant. A job-level `permissions:` block also
*replaces* the workflow block rather than merging, so the "one line" would have been three keys.
The actual fix is to stop asking: `use_oidc` deleted, defaults to false.

Deliberately **not** added: `continue-on-error` on the upload step. Coverage Test is not required, so
a red there carries signal, and suppressing it would make the summary step's "Uploaded coverage to
Codecov" line assert an upload that never happened. That is a policy call — Sean's.

**Open question this leaves:** whether a tokenless upload is actually accepted. The failing run died
inside the OIDC step before Codecov was ever contacted, so there is no evidence either way. The next
CI run on this branch answers it.

## #838 — deliberately not built

Full design in `.planning/838-TURN-COMPLETION-DESIGN.md`. Short version: the defect is real (four of
six managers never emit `conversation.turn.completed`), but the obvious fix is worse than the bug.
The error path emits a bare `finish` with no error marker, so a completion notify carries the default
`ai_waiting_input` state and `WorkflowSessionService` marks a **failed** step done and advances.
Today those runs stall and the watchdog parks them — the safe outcome. Same for transport disconnect,
app quit, and the user pressing Stop, none of which are turns and none of which the drafted edits
gate on.

The safe design is to emit only on a turn-gated *successful* end of turn. OpenClaw already carries
the `turnActive` flag that makes that small; **NanoBot, Remote and Gemini have no turn state at
all**, and introducing it into three managers is not end-of-session work.

**Two decisions are Sean's:** should a failed turn park or advance, and are we happy for four
backends to start ringing an OS notification they never rang before (the issue asks for exactly that,
but it is a new user-visible stream).

## Method correction worth keeping

Earlier I told Sean seven packets were open. **Four were already built** — D-06 in the PR #925 base
covers #909, #910, #508 and #882, and `730230eaf` fixed #842. My cross-check searched `main`'s log
for issue numbers but only spot-checked the base for a handful. Done properly, the base touches 14
open issues: #457, #508, #537, #723, #836, #842, #853, #882, #885, #890, #891, #896, #909, #910.

**Always cross-check `ferrox/main..15d6740aa` as well as `ferrox/main`.** Stacked-branch work is
invisible to a main-only search.

## Still open, desktop-only

1. **#838** — designed, deferred, needs the two decisions above.
2. **#907 is NOT live-verified** — needs a real gateway on OpenClaw 2026.7. Evidence is static, read
   from the vendored tree.
3. **#909** — reviewer returned BUILD-WITH-CHANGES and refuted the plan's scoping; not attempted.
4. **#910 naming** — done. **#910 functional** — badge/list now agree; whether a scheduled chat
   *belongs* in Recents is still a product question.
5. **#609** — recommend Sean dictates the three skill bodies; an agent rewriting AI filler as
   different AI filler fixes nothing. Two of the three are his own trade.
6. **#656** — recommend closing as substantially satisfied: #628 is fixed on main (`4faa14596`),
   #618 is core not desktop, and rule one shipped via #853 and #891.
7. **~24 desktop issues carry no `area:` label**, so nothing surfaces them as desktop.

## Traps confirmed again tonight

- **`constitutionFsAuthority.generated.ts`** regenerated by `bun run package`; reverted, never
  committed. Caught a 5th time.
- **Mocking `node:fs` by named exports only is not enough** when the module uses `import fs from
  'node:fs'` — the first run of the OpenClaw auth test read the real `~/.openclaw` config and
  asserted against a live token. Mock `default` too.
- **Do not mock `ws`** to test the OpenClaw handshake: the code compares against the static `OPEN` on
  the default import, and a half-right mock fails on fixed and unfixed code alike, proving nothing.
- **`git checkout` will not restore an untracked file** after a negative control. Restore by hand.
- **Suite failures under contention are not regressions** — 8 failed together, 8 passed alone.

## Constraints that never relax

No merge, tag or release without Sean — `build-and-release.yml` fires on **any** tag. Never touch
`~/dev/wayland/app`. gh writes must be FerroxLabs. No AI signatures. Never weaken the security shell.
Never commit the generated trust-root file. PR #925 still lands before any of this merges.
