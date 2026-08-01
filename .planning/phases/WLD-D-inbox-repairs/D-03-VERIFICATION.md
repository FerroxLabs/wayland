---
phase: WLD-D-inbox-repairs / D-03
verified: 2026-07-24T02:40:17Z
status: human_needed
score: 6/6 must-haves verified (code-provable), 1 packaged live-verify pending
behavior_unverified: 1
overrides_applied: 0
github_issue: 885
behavior_unverified_items:
  - truth: 'In the PACKAGED app a previously-blocked builtin/library skill (security/credential-referencing) now loads and is retrievable, while a deliberately-malicious imported skill is still blocked'
    test: 'bun run package (then revert the regenerated src/process/services/constitution/constitutionFsAuthority.generated.ts). In the running app open a builtin/library skill that previously showed blocked (e.g. security-review or a CLI/API-docs skill) and confirm it loads + is retrievable; separately confirm a deliberately-malicious imported skill is still blocked.'
    expected: 'Builtin skill loads and body is retrievable; malicious imported skill stays quarantined (blocked).'
    why_human: 'The #885 symptom manifests in the shipped/packaged app boot sweep against the real bundled index.json + skill-bodies.bin. Unit tests prove the producer behavior end-to-end with the real code path, but the packaged-artifact acceptance (real vendored bodies, real extraResources layout) is the Milestone D acceptance and is run by hand by the orchestrator + Sean. Do NOT build the packaged app in this verification pass.'
human_verification:
  - test: 'Packaged live-verify — bun run package, open a previously-blocked builtin/library skill, confirm it loads + retrievable; confirm a malicious imported skill still blocks.'
    expected: 'Builtin loads; imported malicious stays blocked.'
    why_human: 'Packaged-artifact acceptance against the real bundled index + body blob; the single remaining Milestone D acceptance step.'
---

# Phase D-03: Skill Guard trusted-bundle exemption (#885) — Verification Report

**Phase Goal:** Builtin/library skills (`source: 'wayland-library'`, shipped read-only inside the signed bundle) load without being quarantined by the Skill Guard, WITHOUT weakening the guard for genuinely untrusted (imported / cli-discovered / team) skills.
**Verified:** 2026-07-24T02:40:17Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Verdict

**GOAL MET** at the level unit-verification + static analysis can prove, with the packaged live-verify as the single named remaining Milestone D acceptance (expected, not a gap).

Every one of the 6 goal-backward points is demonstrably true in the code and locked by a passing test. The fix is exactly the LOCKED producer-only boundary the plan promised: a single 60-line addition to `SkillLibrary.ts` (two pure helpers + two producer short-circuits), zero edits to any of the 8 enforcement gates, and an un-spoofable two-fact trust predicate. Tests were authored first (commit `109ebadc7`) and the fix commit (`e8edc12c2`) flips the exemption test green while the anti-spoof / imported / team regression tests stay green.

Scope integrity holds: the deferred Task 2 (user "unblock" override store) is NOT required to close #885 — the producer exemption alone makes builtin skills load, proven by test 1 asserting `loadBody` returns the body, not merely a flipped verdict.

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                                                               | Status                         | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A `wayland-library` bundle-relative skill with a body that WOULD trip the guard now loads clean and the body is retrievable — the #885 symptom is retired, not just verdict-flipped | ✓ VERIFIED                     | `skillGuardExemption.test.ts:58-82`: fixture body `CRITICAL_BODY` (`:30`) trips two independent critical rules (.env secrets ref + `\| bash`). After `rescanStale()`: `verdict === 'clean'` (`:77`), `SkillGuard.scan` NOT called for it (`:79`), and **`loadBody('trusted-critical')` returns the body** (`:81` `toBe(CRITICAL_BODY)`). Body retrieval asserted via `loadBody`, not verdict alone. Ran: PASS.                                                                                                                                        |
| 2   | The guard still runs and can still block for `imported`, `cli-discovered`, and `team` sources                                                                                       | ✓ VERIFIED                     | `isTrustedBundleSkill` (`SkillLibrary.ts:155-157`) trusts ONLY `source==='wayland-library'` — every other source falls through to the unchanged scan pipeline (`rescanStale:606-668`, `rescanIfStale:545-552`). Tests: imported → `blocked` + scanned + `loadBody` null (`test.ts:84-107`); team → `blocked` + scanned (`:135-156`). `cli-discovered` is not `wayland-library` so it takes the identical non-trusted path (same predicate). Ran: PASS.                                                                                                |
| 3   | Anti-spoof: a skill CLAIMING `wayland-library` with an ABSOLUTE path is NOT exempted (still scanned/blockable) — test exists and passes                                             | ✓ VERIFIED                     | Predicate second fact `!path.isAbsolute(entry.path)` (`SkillLibrary.ts:156`). `skillGuardExemption.test.ts:109-133`: `source:'wayland-library'` + `path:'/evil/spoof.md'` + critical body → `verdict==='blocked'` (`:130`), `SkillGuard.scan` WAS invoked (`:131`), `loadBody` null (`:132`). Ran: PASS.                                                                                                                                                                                                                                              |
| 4   | Zero enforcement-gate edits — `loadBody` blocked-refuse and the other gates byte-untouched vs base                                                                                  | ✓ VERIFIED                     | `git diff 0188de8f6 e8edc12c2 --stat`: only 3 files changed — `SkillLibrary.ts` (+60/-2), the new exemption test, the sweep-test fixture. Diff of `SkillLibrary.ts` contains ONLY `isTrustedBundleSkill` + `trustedBundleReport` + the two producer short-circuits; grep of the diff for `loadBody` / blocked-refuse = 0 hits. None of the 8 gate files (`SkillGuard.ts`, `SkillRetriever`, `agentUtils`, `addToConversation`, `initAgent`, MCP `searchSkillsServer`, `SkillImport`) appear in the changed set. `TRUSTED_SOURCES` (`:342`) untouched. |
| 5   | Exit bar met — skills unit tests + `tsc --noEmit` green                                                                                                                             | ✓ VERIFIED                     | `npx vitest run skillGuardExemption + skillLibrarySweep --project node` → **13/13 pass**. Full skills dir `tests/unit/process/services/skills/` → **157 pass / 1 skipped** (14 files). `npx tsc --noEmit -p tsconfig.json` → **exit 0**. Full 15k suite: executor reported 15,631/0 — REPORTED, NOT RE-VERIFIED here (skills subset confirmed green myself, per instruction).                                                                                                                                                                         |
| 6   | Scope integrity — deferring the user-override store (research Task 2) does NOT leave #885 unresolved                                                                                | ✓ VERIFIED                     | The producer exemption alone closes #885: test 1 proves a builtin skill goes clean AND `loadBody` returns its body with no user action. Task 2 (`D-03-PLAN.md:225-248`) re-admits genuinely-_imported_ quarantined skills — `wayland-library` is explicitly never override-eligible (fixed at producer). Nothing in the #885 path depends on it.                                                                                                                                                                                                      |
| 7   | PACKAGED app: previously-blocked builtin skill loads + retrievable; malicious imported still blocks                                                                                 | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | The packaged-artifact acceptance against the real bundled index.json + skill-bodies.bin. Code path proven by unit tests; packaged run is the Milestone D acceptance, run by hand (orchestrator + Sean). Not attempted here by directive. See Human Verification.                                                                                                                                                                                                                                                                                      |

**Score:** 6/6 code-provable truths verified; 1 packaged live-verify present-but-behavior-unverified (the shipped-artifact acceptance, by construction run by hand).

### Required Artifacts

| Artifact                                                  | Expected                                                                                    | Status     | Details                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/process/services/skills/SkillLibrary.ts`             | producer-only exemption (`isTrustedBundleSkill` + `trustedBundleReport` + 2 short-circuits) | ✓ VERIFIED | `:155-157` predicate; `:165-173` synthesized clean report (`contentHash` omitted, `scannerVersion=SKILL_SCANNER_VERSION` so idempotent); `rescanIfStale:539-544` short-circuit; `rescanStale:602-615` partition. Wired: both producers are the boot/on-demand sweep entry points.           |
| `tests/unit/.../skills/skillGuardExemption.test.ts` (new) | exemption + anti-spoof + imported + team locks                                              | ✓ VERIFIED | 203 lines, 8 tests across `rescanStale` and `rescanIfStale` paths. Covers all four goal cases + single-scan path. 13/13 (with sweep) green.                                                                                                                                                 |
| `tests/unit/.../skills/skillLibrarySweep.test.ts`         | fixtures re-sourced so batching/progress still exercise the scan pipeline                   | ✓ VERIFIED | `sneaky-skill` `wayland-library`→`imported` (still `review`); `BULK_INDEX` 60 entries `wayland-library`→`imported` (chunk `[10,25,25]` batching still exercised); `safe-skill` stays `wayland-library` (now clean via exemption, still counts `verified`). Behavior-preserving on old code. |

### Key Link Verification

| From                   | To                                             | Via                                                                   | Status  |
| ---------------------- | ---------------------------------------------- | --------------------------------------------------------------------- | ------- |
| `rescanStale`          | `isTrustedBundleSkill` → `trustedBundleReport` | partition: trusted stamped in place, untrusted → `scanChunk` pipeline | ✓ WIRED |
| `rescanIfStale`        | `isTrustedBundleSkill` → `trustedBundleReport` | short-circuit before `readScanBody`/`SkillGuard.scan`                 | ✓ WIRED |
| `isTrustedBundleSkill` | anti-spoof gate                                | `entry.source==='wayland-library' && !path.isAbsolute(entry.path)`    | ✓ WIRED |
| trusted entry          | `loadBody`                                     | clean verdict → gate passes → body returned (`test.ts:81`)            | ✓ WIRED |
| untrusted/spoof/team   | `SkillGuard.scan`                              | unchanged scan pipeline → blocked → `loadBody` null                   | ✓ WIRED |

### Behavioral Spot-Checks

| Behavior                | Command                                                               | Result                 | Status         |
| ----------------------- | --------------------------------------------------------------------- | ---------------------- | -------------- |
| Exemption + sweep tests | `npx vitest run skillGuardExemption skillLibrarySweep --project node` | 13 pass / 0 fail       | ✓ PASS         |
| Full skills unit dir    | `npx vitest run tests/unit/process/services/skills/ --project node`   | 157 pass / 1 skipped   | ✓ PASS         |
| Typecheck               | `npx tsc --noEmit -p tsconfig.json`                                   | exit 0                 | ✓ PASS         |
| Gate-untouched grep     | `git diff --name-only 0188de8f6 e8edc12c2 \| grep <gate files>`       | NONE CHANGED           | ✓ PASS         |
| Packaged builtin loads  | `bun run package` + open blocked builtin skill                        | not run (by directive) | ? SKIP → human |

### Anti-Patterns Found

None. No `TODO/FIXME/XXX` introduced. Synthesized report omits `contentHash` deliberately (optional per `skillTypes.ts`, trust-by-provenance) and sets `scannerVersion` so a second sweep is idempotent — not a stub, a documented design choice. No empty-return stubs; `trustedBundleReport()` returns a real, type-valid `SkillSecurityReport` (tsc confirms).

### Requirements Coverage

| Requirement | Source       | Description                                       | Status                                          | Evidence                                 |
| ----------- | ------------ | ------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| #885        | github_issue | Builtin/library skills quarantined by Skill Guard | ✓ SATISFIED (code); packaged acceptance pending | Producer exemption; auto-closes on merge |

### Gaps Summary

No goal-blocking gaps. The fix is the exact LOCKED surgical boundary the plan promised — a single producer-layer change, zero gate edits, un-spoofable by the two-fact bundle anchor — and every goal-backward assertion is pinned by a passing test. Test 1 proves the #885 symptom is genuinely retired (body retrievable via `loadBody`), not merely verdict-flipped. The anti-spoof lock (absolute path + `wayland-library` claim → still scanned → blocked) is present and green, so relaxing the control did not open a bypass. The `team` exclusion is deliberate and tested.

The single outstanding item is the packaged live-verify — opening a previously-blocked builtin skill in the shipped artifact and confirming it loads while a malicious imported skill still blocks. This is the Milestone D acceptance, run by hand by the orchestrator + Sean; it is expected, not a defect. Status is therefore `human_needed`, not `passed`.

---

_Verified: 2026-07-24T02:40:17Z_
_Verifier: Claude (ferrox-verifier)_
