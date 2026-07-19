---
phase: WLD-01-safety-foundation
plan: 01-01
reviewed: 2026-07-19T07:17:28Z
depth: deep
candidate_commit: 76eec4b4813b6b7f8ba738eaac0befb70a5eb02c
implementation_commit: dbef48a1dfa435fc7f18ed9e063065ee81555580
files_reviewed: 25
files_reviewed_list:
  - src/common/config/storage.ts
  - src/process/services/cohort/types.ts
  - src/process/services/cohort/ProductionCohortController.ts
  - src/common/types/cohortRollout.ts
  - src/process/bridge/cohortBridge.ts
  - src/preload/main.ts
  - src/common/types/electron.ts
  - src/renderer/pages/settings/NavigationSettings/CohortEvidenceConsent.tsx
  - tests/unit/process/services/cohort/ProductionCohortController.test.ts
  - tests/unit/process/bridge/cohortBridge.test.ts
  - tests/unit/cohortPreloadBridge.test.ts
  - tests/unit/renderer/cohortEvidenceConsent.dom.test.tsx
  - src/renderer/services/i18n/locales/de-DE/settings.json
  - src/renderer/services/i18n/locales/en-US/settings.json
  - src/renderer/services/i18n/locales/es-ES/settings.json
  - src/renderer/services/i18n/locales/fr-FR/settings.json
  - src/renderer/services/i18n/locales/ja-JP/settings.json
  - src/renderer/services/i18n/locales/ko-KR/settings.json
  - src/renderer/services/i18n/locales/pt-BR/settings.json
  - src/renderer/services/i18n/locales/ru-RU/settings.json
  - src/renderer/services/i18n/locales/tr-TR/settings.json
  - src/renderer/services/i18n/locales/uk-UA/settings.json
  - src/renderer/services/i18n/locales/zh-CN/settings.json
  - src/renderer/services/i18n/locales/zh-TW/settings.json
  - src/renderer/services/i18n/i18n-keys.d.ts
findings:
  critical: 5
  warning: 2
  info: 0
  total: 7
status: issues_found
---

# Phase WLD-01: Code Review Report

**Reviewed:** 2026-07-19T07:17:28Z  
**Depth:** deep  
**Candidate:** `76eec4b4813b6b7f8ba738eaac0befb70a5eb02c`  
**Implementation:** `dbef48a1dfa435fc7f18ed9e063065ee81555580`  
**Files Reviewed:** 25  
**Status:** issues_found

## Narrative Findings (AI reviewer)

The closed enums, sender-frame validation, strict renderer decoders, explicit locale keys, and mid-window relabel rejection are useful foundations. The candidate nevertheless does not yet establish the claimed authority boundary. Structurally valid forged records are accepted, renderer input is copied directly into the effective assignment, consent and assignment are persisted non-atomically, rollout receipts are not bound to the current assignment, and an expired evidence window can be replaced. These are acceptance-blocking authority and evidence-integrity defects.

## Critical Issues

### CR-01 (HIGH): Structurally valid forged persisted assignments are accepted as process authority

**File:** `src/process/services/cohort/ProductionCohortController.ts:384-455`  
**Issue:** Startup authenticates only JSON shape. Any actor able to edit `wayland-config.txt` can create a schema-2 record with an allowed cohort, matching requested/effective fields, and a mathematically valid window. `parsePersistedAssignment()` accepts it, and `assignmentMatchesConsent()` accepts any windowed assignment whenever consent parses as disabled. The resulting record is then exposed as the process-owned effective assignment. This contradicts the plan's forged-persistence fail-closed requirement; the current hostile tests exercise malformed shapes, not a correctly shaped forgery.  
**Fix:** Persist assignment and consent in one versioned authority envelope with a monotonic generation and an integrity authenticator bound to the installation (for example, an HMAC key held in OS secure storage). Verify the authenticator before parsing fields, reject unsigned legacy schema except through the one explicit migration path, and add a restart test using a valid-looking record whose authenticator does not verify.

### CR-02 (HIGH): Consent and assignment updates are not transactional and rollback is best effort

**File:** `src/process/services/cohort/ProductionCohortController.ts:162-205,229-232`  
**Issue:** `setConsent()` writes `cohort.assignment` and `cohort.evidenceConsent` as two separate durable mutations. If the first succeeds and the second fails, `restorePersistedState()` performs two more independent writes and its failure is swallowed. Disk can therefore contain a new assignment/window with old consent while the renderer is told `storage-error` and the in-memory state remains unchanged. On restart, line 450 treats any windowed assignment plus disabled consent as consistent, promoting the partial write to a locked authoritative assignment. The existing test fails only the consent write while allowing rollback to succeed, so it does not prove crash/failure atomicity.  
**Fix:** Replace the two-key store abstraction with one atomic `ProcessConfig` mutation that persists a single consent-plus-assignment authority envelope in one `JsonFileBuilder.mutate`/`setJson` publication. If compatibility requires separate projections, derive them from the one envelope after commit. Add hostile tests for failure before publication, failure during publication, failed rollback, and restart from every possible partial predecessor.

### CR-03 (HIGH): The renderer request directly mints the effective cohort

**File:** `src/process/services/cohort/ProductionCohortController.ts:128-153,359-381`  
**Issue:** `classifyCohortRequest()` is only an enum check, and `assignmentRecord()` copies the renderer-supplied cohort into both `requestedCohort` and `effectiveCohort`. Any authorized main-frame renderer (including a compromised renderer) can therefore choose and persist any effective cohort before a window starts. The main process validates syntax but performs no classification, so the statement that the request is merely classifier input and that the renderer cannot mint the effective assignment is false.  
**Fix:** Define a process-owned classification input distinct from `CohortAssignment`, derive the effective cohort using deterministic main-process rules or a separately authenticated enrollment decision, and persist both input and derived result. If manual self-selection is intended instead, change the contract and threat model explicitly and require a process-owned user-confirmation ceremony that a renderer script cannot silently complete. Add a hostile valid-literal request test proving it cannot directly choose the effective result.

### CR-04 (HIGH): Expired evidence windows can be replaced and the original observation boundary is lost

**File:** `src/process/services/cohort/ProductionCohortController.ts:162-193,458-474`  
**Issue:** After a 14-day window expires, `toPublicAssignment()` still reports `active` solely because consent remains enabled. If consent is then disabled and re-enabled, `existingWindow` becomes null and `setConsent(true)` creates a new 14-day window, overwriting the assignment's original window. This lets an ordinary UI sequence silently restart the evidence period and detach the effective assignment from the completed observation evidence, even though observation start and completion are supposed to be distinct authoritative states.  
**Fix:** Model observation lifecycle explicitly (`ready`, `active`, `revoked`, `completed`) using the current time and a durable immutable window identifier. Once a window has started, never replace it through `setConsent`; starting another window must require a separate process-authoritative command and evidence identity. Add exact-boundary tests at `endMs - 1`, `endMs`, and `endMs + 1`, plus disable/re-enable after completion.

### CR-05 (HIGH): Signed rollout eligibility is not bound to the current persisted cohort/window

**File:** `src/process/services/cohort/ProductionCohortController.ts:108-120,234-265`; `src/process/services/cohort/ProductionCockpitRolloutStatusProvider.ts:37-73`  
**Issue:** The rollout provider is constructed without the controller's effective cohort or observation window. It verifies the receipt against the packaged policy's cohort/window, while the evidence runtime independently labels events with the persisted assignment. A receipt scoped to one cohort/window can therefore return `eligible: true` while the current controller records another cohort/window. The successful result also drops `decision.cohort`, preventing downstream detection. This breaks the cohort-to-evidence-to-promotion correlation and means the newly introduced assignment does not actually constrain rollout authority.  
**Fix:** Pass an immutable current authority scope (effective cohort plus exact window identity) into rollout verification and require the signed receipt, packaged policy, persisted envelope, runtime, and public status to match it exactly. Recreate or scope the provider whenever the authority state changes. Add tests where every field matches except cohort, start, or end and require fail-closed `cohort-mismatch`/evidence-gate results.

## Warnings

### WR-01 (MEDIUM): Malformed or unreadable consent is collapsed into a valid disabled state

**File:** `src/process/services/cohort/ProductionCohortController.ts:269-295,447-501`  
**Issue:** `parsePersistedConsent()` returns the same `disabledConsent()` value for absence, an exact valid disabled record, unknown keys, contradictory fields, and malformed enabled data; read errors are also swallowed into that value. Startup consequently cannot distinguish valid opt-out from corruption and may expose a separately valid assignment as `ready` or `locked`. The plan explicitly requires absent, malformed, partial, and contradictory persisted state to yield unavailable.  
**Fix:** Return a discriminated parse result containing presence and validity. Accept an assignment only when it belongs to the same authenticated envelope/generation as an explicitly valid consent record; otherwise construct unavailable state. Add restart tests for missing consent plus assignment, malformed disabled consent plus assignment, consent read failure, and assignment read failure.

### WR-02 (MEDIUM): Successful consent changes leave the renderer's assignment projection stale

**File:** `src/renderer/pages/settings/NavigationSettings/CohortEvidenceConsent.tsx:242-265,291-318`  
**Issue:** After `cohortSetConsent(true)` succeeds, the component updates only `status`; `assignment` remains `ready`, so the cohort selector stays enabled and the text says classification is merely ready even though the main process has entered an active locked window. The inverse transition also retains stale `active` state after revocation. Main-process rejection prevents an actual mid-window relabel, but the UI violates the required freeze/accurate-projection behavior and converts a normal selection attempt into an avoidable error. The current DOM tests assert only the toggle/window text and miss assignment state.  
**Fix:** Return the post-commit assignment projection with `CohortSetConsentResult`, or refetch consent and assignment together after mutation and validate them as one response before updating both state variables. Add DOM assertions that enable immediately disables the selector and shows locked/active, while revoke shows the persisted locked state.

## Severity Mapping

| Finding | GSD severity | Delivery severity |
|---|---|---|
| CR-01 | Critical / BLOCKER | HIGH |
| CR-02 | Critical / BLOCKER | HIGH |
| CR-03 | Critical / BLOCKER | HIGH |
| CR-04 | Critical / BLOCKER | HIGH |
| CR-05 | Critical / BLOCKER | HIGH |
| WR-01 | Warning | MEDIUM |
| WR-02 | Warning | MEDIUM |

No LOW/Info findings were recorded. The candidate must not enter the integration queue until all seven findings have executable regressions and an independent successor review.

---

_Reviewed: 2026-07-19T07:17:28Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: deep_
