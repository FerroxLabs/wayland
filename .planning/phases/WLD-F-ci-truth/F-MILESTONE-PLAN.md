# Milestone F — CI Truth (make the gate mean something)

**Why this milestone exists:** Milestone E got the branch onto CI for the first time (PR #925) and CI
immediately proved that a green check on this repo does not mean the code works. Everything below is
open work carried out of E, ordered by blast radius.

**Standing rule for every packet here (Sean, 2026-07-25):** green code tests are not the test. The test
is booting the PACKAGED artifact and using it as a user. Every packet ends with a live run, not a report.

---

## F-01 · Close the required-checks bypass (HIGHEST — do first)

**Problem (proven live on #925):** `main` protection is `enforce_admins: true`, `required_reviews: 0`,
required checks = `Code Quality`, `Unit Tests (macos-14)`, `Unit Tests (ubuntu-latest)`,
`Unit Tests (windows-2022)`. `pr-checks-docs.yml` publishes three of those as literal
`echo "Docs-only PR, skipping unit tests."` jobs. Its `paths: ['**/*.md', ...]` trigger fires when ANY
changed file matches, so a mixed PR (code + one markdown) runs BOTH workflows and the stub reports green
under the required names. The real `pr-checks.yml` additionally gates all 9 jobs on
`draft == false` while the stub's echo jobs have no draft gate, so a draft PR runs zero real checks and
still shows required checks green.

Observed on #925: 7 of 8 unit shards FAILING, I18n FAILING, Code Quality FAILING, all three required
`Unit Tests (...)` reporting PASS.

The real aggregator already states the principle the stub breaks: "a required check must never report
green when the tests it gates did not actually run."

**Do:** make the stub mutually exclusive with the real gate. A `paths:` filter cannot express
"docs-only", so compute it: a first job that diffs base..head and exits early unless EVERY changed file
is docs. Alternatively stop reusing the required-check names in the stub and give the docs path its own
names. Prefer the former so docs-only PRs still satisfy protection.

**Verify:** on a scratch branch, (a) a docs-only PR satisfies the required checks, (b) a mixed PR does
NOT get green required checks while real tests fail, (c) a draft PR does not report green required
checks. Evidence pasted into the packet, not asserted.

**Until this lands: do not merge #925 on a green required check.** See
[[ci-required-checks-bypass-docs-stub]].

## F-02 · recoveryCapture SNAPSHOT_FILE_TYPE on ubuntu

**Diagnosed, not fixed.** `tests/unit/process/services/recovery/recoveryCapture.test.ts` fails on the
Linux runner with "Built recovery point failed verification: SNAPSHOT_FILE_TYPE".
`recoveryManifest.ts:1129/1153` raises that code when a snapshot inventory contains a symbolic link or
an unsupported entry. So the capture tree differs on Linux (bun's installs create symlinks that macOS
layout does not), which makes this the same defect class as the two already fixed this session: a test
inheriting ambient machine state instead of controlling it.

**Do:** make the capture tree explicit (fixture dir the test builds), not whatever is on disk. Do NOT
relax the symlink assertion — it is a real integrity rule.

**Verify:** passes on ubuntu, macos and windows shards in CI, plus locally.

## F-03 · Redo the formatting pass safely

**Reverted in `aea1b4820` because it broke the build.** oxfmt pretty-printed
`resources/modelsdev-snapshot.json` (a minified, SHA-256-and-size-pinned supply-chain snapshot) from 1
line to 103,798, so `verify:modelsdev-snapshot` failed the pinned hash and no packaged build could
complete. It also reformatted 20+ `contracts/` wire schemas and compat fixtures. The full unit suite,
tsc, and CI's own formatter all approved that change; only running the build caught it.

**Do:**
1. Fix the hook first: `.pre-commit-config.yaml` oxfmt `exclude:` currently covers only
   `src/process/resources/(skills-library|bundled-workflows)/index.json`. It must also exclude
   `resources/modelsdev-snapshot.json`, `contracts/**`, and any other pinned/generated artifact. Its
   `files:` regex also omits `.mjs`, so 4 such files were never routed to the formatter.
2. Then reformat only this branch's delta minus those exclusions (~358 files last time).

**Verify:** `bun run verify:modelsdev-snapshot` passes, packaged build completes, packaged smoke PASSES.
Code Quality (Oxfmt) is red until this lands — accepted, documented.

## F-04 · Issue + decision hygiene

- **#910b "Chats"** — ratified (keep `8f713ea04`); record the ratification, no code change.
- Confirm no other issue was marked fixed while unreleased. #537 is correctly
  `state:fixed-pending-release`, comment posted, left open.

## F-05 · Reconcile the external cleanup plan (`~/Downloads/wayland-desktop-cleanup-plan.md`)

**Key insight: that audit was taken at commit `1b1c1e9`, which is exactly this branch's merge-base.** It
describes shipped v0.11.18, not this branch — its acceptance bars cite "968 unit tests" where this branch
has 15,718. So some findings may already be fixed here.

**Do:** produce a truthful per-packet status (already-fixed / still-open / superseded) before anyone
starts work, so nothing is redone. Its P0-1 (ACP bridges resolved via `bunx @latest` at spawn time =
RCE on every user if any of those npm packages is compromised) is the same supply-chain class as the two
pin problems hit this session and wants the same pinned-manifest treatment.

**Note its guardrails:** never weaken the security shell, never touch the signing pipeline, one packet
per PR, no bulk cleanup bombs (F-03 is the cautionary example), no history rewriting.

## F-06 · Sealed build — GATED ON SEAN

Needs a protected `release-trust-v1` branch and repo variable `WAYLAND_RELEASE_TRUST_ROOT_SHA` pinned to
its reviewed commit. Neither exists. **Deliberately not done by the agent:** the agent that builds
releases must not mint the authority that validates them — the same boundary D-08 refused to cross.

**Verify:** packaged smoke PASS against a SEALED distributable, plus notarization confirmed on the
artifact (notarization itself is already fully wired: `afterSign.js` for the .app, `notarizeDmg.js` for
the dmg, all six Apple/Azure secrets present).

---

## Order

F-01 → F-02 → F-03 → F-05 → F-04, with F-06 whenever Sean sets the trust root.
