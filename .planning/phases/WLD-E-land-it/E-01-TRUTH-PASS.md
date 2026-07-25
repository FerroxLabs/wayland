# E-01 — Truth pass (DONE)

What is actually inside the 552 unshipped commits. Measured, not estimated. No product code written
except the one test fix below.

## 1. Suite state

**15,718 passed / 0 failed / 147 pending**, 4,636 suites, `success: true`.

Getting there took one fix. The initial run was 15,715 / **1 failed**:

`tests/unit/coworkAuthorityIsolation.test.ts` — *"resolves no executable when the verified lockstep
capability is unavailable (fail closed)"*. It asserted `resolveVerifiedOfficecliCommand()` returns
`null` but never established that precondition: `getBundledOfficeCliDir()` resolves
`${cwd}/resources` outside a packaged app, so the test only passed on a machine that had never staged
an OfficeCLI bundle. Running the legitimate `prepareOfficeCli` step turned it red with zero product
change, and in CI it would pass or fail purely on job ordering.

That is worse than flakiness: the assertion guards a **fail-closed security boundary**, so a green
that depends on absence is a false green.

Fixed (`76ad0fb40`) by mocking `getBundledOfficeCliDir` so the test owns its precondition, plus two
cases the original could not distinguish:
- a throw from digest re-validation must also fail closed rather than fall through
- a positive control proving the `null` comes from the authority refusing, not the resolver being inert

5 tests → 7. The "2 failed suites" in the first run was that one file counted twice (file + describe),
not a second broken file.

## 2. Hygiene

| check | result |
|---|---|
| AI signatures in commit messages | **0** |
| AI signatures in the diff | **0** |
| Leftover debug/probe scaffolding | none (4 probe scripts created and deleted during diagnosis) |
| Debug/temp files in the delta | 0 |
| Working tree | clean except `AGENTS.md` (IJFW project-detection auto-churn, not part of any packet) |

`STRIKE.md` is a 51KB **file**, not a directory — an earlier report of `STRIKE.md/` was an artifact of
path-splitting in the analysis script, not a real oddity.

## 3. Credential sweep

1,636 text files scanned across the changed set (binaries, lockfiles, `node_modules`, `out`,
`resources` excluded). High-confidence patterns: OpenAI/Anthropic keys, GitHub PATs, AWS access key
IDs, Google API keys, Slack tokens, private-key blocks, Flux keys.

**18 hits, all synthetic.** Notable ones examined individually rather than pattern-matched away:

- `tests/unit/capabilityProjection.test.ts:1152` — a **redaction test**; asserts a private-key block is
  scrubbed from text. Fixture value is `abcDEF123+/=`. This is a good test, not a leak.
- `tests/unit/renderer/modelsSettings.dom.test.tsx:451-452` — a provider **key-shape recognition**
  table; the comment documents them as structural variants (32-hex DeepSeek, 48-mixed-alnum Moonshot).
- `AKIAIOSFODNN7EXAMPLE` — AWS's own published documentation example.
- The rest are obvious placeholders (`sk-ant-SECRETSECRET…`, `github_pat_11_AAabcdefgh…`).

**One low-priority flag, not a blocker:** the two `modelsSettings` fixtures are *shaped* like real
DeepSeek/Moonshot keys. Nothing here proves a live key was not pasted as a fixture. Cheap to confirm
or rotate.

## 4. Inventory

552 commits:

| type | count |
|---|---|
| fix | 222 |
| docs | 115 |
| test | 96 |
| feat | 77 |
| (no conventional prefix) | 25 |
| chore / refactor / integrate | 3 / 3 / 3 |
| style / build / wip / install / merge / audit / perf | 1–2 each |

**17 issues referenced:** #457 #484 #508 #537 #706 #723 #746 #836 #842 #853 #882 #885 #890 #891 #896
#909 #910

**Packet tags:** A-01 ×1, A-02 ×2, B-01 ×4, B-02 ×2, D-01 ×4, D-03 ×3, D-04 ×3, D-05 ×2, D-06 ×15,
D-07 ×8, D-08 ×6.

### The finding that changes E-03

The 25 unprefixed commits are overwhelmingly the **old Phase-1 cohort work** ("Integrate packet
01-XX", "Seal cohort work-journey terminals", "Bind ToolSearch candidate gate"). That work was later
**killed** and deleted (`9b661a948`, −11.4k LOC).

So the branch history contains a large body of code that does not exist in the final state. Splitting
the branch into per-milestone PRs would ask reviewers to review cohort code that was already deleted.
**E-03 revised: review the net diff, split the review by area, do not split the branch.** There is no
mechanical pressure to split it — `main` is 0 behind.

## 5. Exit bar

- [x] Full suite green on HEAD
- [x] No AI signatures
- [x] No leftover scaffolding
- [x] Credential sweep clean (one confirm-or-rotate flag recorded)
- [x] Commit/issue inventory produced
- [x] E-03 strategy corrected by evidence

**E-02 is the next packet and needs Sean's authorization to push.**
