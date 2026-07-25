# Milestone E — Land It

**Goal:** move the entire unshipped body of desktop work from "built and locally verified" to
"merged and released", without a big-bang merge nobody can review.

**Status:** E-01 DONE. E-02 onward gated on Sean (first push is the first outward action in this arc).

---

## Where we are (measured 2026-07-25, not estimated)

| fact | value |
|---|---|
| Branch | `worktree-agent-desktop-integration` |
| Commits ahead of `ferrox/main` | **552** |
| Commits behind | **0** (main has not moved) |
| Files changed | 1,664 |
| Net diff | +207,923 / −10,196 |
| CI runs on any of it | **zero** |
| Full unit suite | **15,718 passed / 0 failed / 147 pending** (4,636 suites) |
| Packaged smoke | **PASS** (`passed: true`, 12/12 surfaces, chat round-trip) |

Delta by area:

| area | added | note |
|---|---|---|
| `tests/unit` | 62,236 | healthy test:source ratio |
| `src/process` | 45,089 | |
| `.planning/*` | ~30,000 | docs, not code |
| `src/renderer` | 14,953 | |
| `src/common` | 9,846 | |
| `native/constitution-fs` | 7,637 | |
| `scripts/release-acceptance` | 5,103 | |
| `.github/workflows` | 1,398 | **the CI config itself is unvalidated** |

## The dominating risk

Nothing has ever been pushed, so **CI has never executed one line of this** — including the workflow
changes themselves. Local verification has already proven insufficient three times in a single session:

- `scripts/whatsapp-bridge-source.json` was stale and would have failed **every** packaged build
  including the CI release path (D-01 regression, fixed `e29ccb85a`).
- A stale `bundled-officecli` binary sat unverified behind that failure.
- The packaged smoke harness was reporting FAIL on a healthy app for a structural reason
  (shadow-DOM-blind assertion, fixed `39f2d1198`).

None of those were reachable by reading code or by unit tests. There are 552 commits of the same
exposure, and one instrument that finds it: CI on a clean runner.

---

## E-01 · Truth pass — DONE

No new product code. Findings in `E-01-TRUTH-PASS.md`. Summary:

- **Suite green**: 15,718 / 0. The one failure was a test depending on ambient machine state while
  guarding a fail-closed security boundary; fixed to own its precondition (`76ad0fb40`).
- **Hygiene clean**: 0 AI signatures in commit messages or diff; no leftover scaffolding; working tree
  clean apart from IJFW's `AGENTS.md` auto-churn.
- **Credential sweep**: 1,636 text files scanned, 18 hits, all synthetic test fixtures or an AWS
  documentation example. One low-priority confirm-or-rotate flag (see the report).
- **Inventory**: 17 issues referenced; packets A-01/02, B-01/02, D-01..D-08.

## E-02 · First CI green — GATED ON SEAN

**Execute:** push the branch; let CI run for the first time; fix what it catches.
**Expect this to be ugly.** Budget for the workflows themselves being wrong.
**Verify:** CI green on branch head, packaged job included, on a clean runner — where the first-launch
Gatekeeper cost and the OfficeCLI staging both behave differently than on a dev machine.

## E-03 · Landing strategy — REVISED by E-01

The original plan was one PR per milestone in dependency order. **E-01 killed that.** The history
contains the old Phase-1 cohort work (25 unprefixed "Integrate packet 01-XX" commits) that was later
KILLED and deleted (`9b661a948`, −11.4k LOC). A per-milestone split would ask reviewers to review code
that does not exist in the final state.

**Revised recommendation: review the NET DIFF, not the history.**

- Merge as a single PR whose reviewable artifact is the net diff (~70k lines of real source; the rest is
  tests and planning docs).
- Split the *review*, not the branch: by area (`src/process`, `src/renderer`, `src/common`, `native`,
  `scripts`), each with its own cross-audit pass.
- No conflict pressure exists (main is 0 behind), so there is no mechanical reason to split the branch.

**Verify:** every area signed off; CI green; packaged smoke green on the merge result.

## E-04 · Sealed build — GATED ON SEAN'S CI TRUST ROOT

D-08 deliberately did NOT forge the capability seal, so a sealed distributable cannot be produced
locally by design. **Verify:** packaged smoke `passed: true` against a *sealed* artifact, not the
verification build.

## E-05 · Release notes + publish

`RELEASE-NOTES-DRAFT-milestone-D.md` exists and needs a sean-writer pass, then version bump + tag.
**Verify:** notes describe only what shipped; no forward-looking claims.

## E-06 · Issue close sweep

`fixed-pending-release` first; close only on release. Nothing is marked fixed before it ships.
Candidates are the 17 referenced issues, each confirmed against the released tag by ancestry.

---

## Gates summary

| packet | blocked on |
|---|---|
| E-01 | nothing — DONE |
| E-02 | **Sean: authorization to push** |
| E-03 | E-02 green |
| E-04 | **Sean: CI trust root** |
| E-05 | E-04 |
| E-06 | E-05 shipped |

Still open from earlier, unrelated to gating: #910b "Chats" ratify (recommend RATIFY), #537 close comment.
