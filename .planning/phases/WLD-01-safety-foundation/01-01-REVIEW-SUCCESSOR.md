---
phase: WLD-01-safety-foundation
plan: 01-01
reviewed: 2026-07-19T13:32:46Z
depth: deep
candidate_commit: 9817401a24807041ca22a3c7ade9c3a2ae32f23d
candidate_tree: b5dc08d666c7e92b726ec001a1a7c10a701be4be
original_review: .planning/phases/WLD-01-safety-foundation/01-01-REVIEW.md
findings:
  high: 3
  medium: 4
  low: 3
  total: 10
status: issues_found
acceptance: rejected
---

# Plan 01-01 Independent Successor Review

**Candidate:** `9817401a24807041ca22a3c7ade9c3a2ae32f23d`  
**Tree:** `b5dc08d666c7e92b726ec001a1a7c10a701be4be`  
**Original findings retested:** 5 HIGH + 2 MEDIUM  
**Verdict:** **REJECTED — 3 HIGH, 4 MEDIUM, and 3 LOW findings remain.**

The repair materially improves the design: the process now persists one OS-sealed authority envelope, rejects unknown fields, serializes mutations, uses a native main-process confirmation ceremony, preserves a single observation window, scopes rollout receipts to cohort/window, and refreshes the renderer after ordinary consent changes. It does not yet establish durable installation authority, one-shot migration authority, or lifecycle-bound rollout authority.

## Focused proof

Both commands ran at the exact candidate commit/tree above. The worktree was clean before and after execution.

```text
GSD_RUNTIME=codex bunx vitest run \
  tests/unit/process/services/cohort/ProductionCohortController.test.ts \
  tests/unit/process/services/cohort/ProductionCockpitRolloutStatusProvider.test.ts \
  tests/unit/process/bridge/cohortBridge.test.ts \
  tests/unit/cohortPreloadBridge.test.ts \
  tests/unit/renderer/cohortEvidenceConsent.dom.test.tsx

Result: PASS — 5 files, 43/43 tests
```

```text
GSD_RUNTIME=codex bunx vitest run \
  tests/unit/process/services/cohort/rolloutAuthority.test.ts \
  tests/unit/process/services/cohort/CohortEvidenceRuntime.test.ts \
  tests/unit/process/services/cohort/CohortBaselineAggregator.test.ts \
  tests/unit/process/services/cohort/LocalCohortEventRepository.test.ts

Result: PASS — 4 files, 68/68 tests
```

Focused total: **9 files, 111/111 tests passed**. The findings below are missing hostile boundaries or contradictions not exercised by that green suite.

## HIGH findings

### HF-01: A valid old authority envelope can be replayed; copying the config can defeat installation binding

**Files:**

- `src/process/services/cohort/ProductionCohortController.ts:172-188,379-474`
- `src/process/services/kickoff/installUuid.ts:40-80`
- `src/process/utils/initStorage.ts:77-86`

**Issue:** `generation` and `authorityId` exist only inside the encrypted envelope. Startup accepts any decryptable schema-3 envelope whose generation is at least one and whose installation hash matches the current `app.installUuid`; there is no external monotonic or lineage anchor. The install UUID is stored in the same mutable `wayland-config.txt` root as the authority envelope. OS safe storage authenticates/decrypts a blob for the OS user; it does not prove that the blob is the newest authority for this Wayland installation.

**Reproduction:**

1. Save encrypted authority E1, mutate to E2, then restore E1. On restart E1 is accepted, rolling cohort, consent, window, generation, and lifecycle backward.
2. Under the same OS account/safe-storage domain, copy the complete config root containing both `app.installUuid` and `cohort.authorityEnvelope` to another instance. The copied UUID produces the expected installation hash and the copied envelope remains decryptable.

**Required correction:** keep an install secret/key identifier outside the mutable config root in OS credential storage; keep an externally anchored current generation/authority lineage; reject an older generation or foreign lineage even when the ciphertext decrypts. Add restart tests for same-install replay, copied whole-config state, and cross-install substitution.

### HF-02: Legacy migration can repeatedly authenticate attacker-controlled mutable state

**File:** `src/process/services/cohort/ProductionCohortController.ts:316-324,397-435,495-543`

**Issue:** whenever the new envelope is absent, startup rereads the legacy consent and assignment keys and seals them as fresh authority. There is no one-shot migration marker outside those mutable values, and the legacy keys are not retired. A caller who can delete the envelope and write exact schema-1 legacy values can choose cohort/window state and have the application itself authenticate it. This can be repeated. `legacyMatches()` also accepts any valid windowed assignment when consent is disabled.

**Reproduction:** delete `cohort.authorityEnvelope`, place exact-shaped schema-1 consent/assignment values with a selected cohort and valid 14-day window into the legacy keys, then restart. The application creates a new signed/sealed schema-3 authority from those unauthenticated values.

**Required correction:** make migration a one-time externally anchored epoch, atomically retire legacy sources, and fail closed if the new authority disappears after migration. Do not promote a legacy observation window into rollout authority without new native confirmation and authoritative observation evidence. Test delete-and-reseed, repeated migration, disabled-consent/window abuse, and migration after an established generation.

### HF-03: Rollout authorization is not bound to authority lineage or completed lifecycle

**Files:**

- `src/process/services/cohort/ProductionCohortController.ts:266-277`
- `src/process/services/cohort/ProductionCockpitRolloutStatusProvider.ts:16-19,49-99`
- `src/process/services/cohort/rolloutAuthority.ts:25-72,132-153,200-212`

**Issue:** the rollout scope contains only cohort and start/end timestamps. It is returned whenever a window exists, including while active or after consent is revoked. Neither policy nor receipt binds `authorityId`, `generation`, `windowId`, lifecycle/completion state, or the authority envelope lineage. Receipt issuance/verification also does not require `issuedAt` to follow the observation window end. A matching signed cohort/window receipt can therefore authorize rollout before evidence completion, after revocation, or after replaying an older envelope with the same scope.

**Required correction:** expose rollout authority only for an explicitly completed, accepted evidence lifecycle. Bind receipt and policy to authority ID, generation, immutable window ID, completion timestamp/lifecycle, and baseline aggregate digest. Require receipt issuance after window completion and evidence finalization. Test active, revoked, incomplete, replayed-lineage, pre-completion-issued, and completed-success cases.

## MEDIUM findings

### MF-01: Production OS safe-storage fail-closed behavior has no executable regression

**Files:** `src/process/services/cohort/ProductionCohortController.ts:328-371`; controller tests

The production composition correctly appears to reject unavailable encryption, non-`enc:v1:` fallback ciphertext, and decryption failure. The controller tests bypass this boundary with injected test protect/unprotect functions, so the critical property is inspection-only. Mock/inject the Electron safe-storage seam and prove unavailable safe storage, `file:v1` fallback output, corrupted `enc:v1`, decrypt failure, and backend change cannot publish or activate authority/evidence.

### MF-02: Atomic logical publication is fixed, but crash durability is not proven at the real storage boundary

**Files:**

- `src/process/services/cohort/ProductionCohortController.ts:255-263,337-342`
- `src/process/utils/atomicWrite.ts:91-114`
- `src/process/utils/initStorage.ts:133-173`

The repair replaces two independent keys with one root mutation, resolving logical tearing. The hostile test only makes the mocked `authorityStore.set()` reject. The actual writer uses write-temp/rename but does not fsync the temp file or parent directory and has no restart/fault injection at prewrite, completed-temp, rename, or post-rename boundaries. Add a real temporary config harness proving every injected crash/failure leaves exactly the old or new complete envelope, never absent/partial authority; add durability sync where required by the supported platform contract.

### MF-03: Renderer consent projection still combines two uncorrelated reads

**Files:**

- `src/process/services/cohort/ProductionCohortController.ts:248-252`
- `src/renderer/pages/settings/NavigationSettings/CohortEvidenceConsent.tsx:246-273`

`cohortSetConsent()` returns consent only. The renderer then separately calls `cohortAssignmentStatus()`. Another authorized mutation can run between those operations, allowing consent from generation N to be displayed with assignment from generation N+1. Return one aggregate `{generation, consent, assignment}` projection from the same queued mutation/read and validate it as one exact response.

### MF-04: A normal completed window with consent still enabled is rendered as an error

**Files:**

- `src/process/services/cohort/ProductionCohortController.ts:552-565`
- `src/renderer/pages/settings/NavigationSettings/CohortEvidenceConsent.tsx:174-197`

At `now >= endMs`, the controller correctly reports assignment state `completed`; consent remains enabled unless the user revoked it. The renderer rejects every enabled-consent result whose assignment is not `active`, so the valid completed pair becomes unavailable/error. Add lifecycle-aware pair validation and completed-state UX/tests at `endMs` and after it, preserving visibility and an appropriate control path.

## LOW findings

### LF-01: Native cancellation is omitted from the renderer decoder

**Files:**

- `src/common/types/cohortRollout.ts:32-41`
- `src/renderer/pages/settings/NavigationSettings/CohortEvidenceConsent.tsx:117-127,229-240`

The shared result includes `confirmation-denied`, but `parseAssignmentResult()` rejects it. Cancelling the native dialog therefore becomes a generic update failure. Decode it explicitly and render neutral cancellation behavior.

### LF-02: The cohort control bypasses the project UI component standard

**File:** `src/renderer/pages/settings/NavigationSettings/CohortEvidenceConsent.tsx:292-321`

The feature uses a raw HTML `<select>`/`<option>` control while the project standard calls for Arco interactive controls. Replace it with the project Select component and preserve the hostile DOM coverage.

### LF-03: Native assignment confirmation is not localized

**File:** `src/process/services/cohort/ProductionCohortController.ts:358-368`

The dialog title, message, detail, and buttons are hard-coded English even though the feature plan added explicit locale coverage. Route the main-process ceremony through explicit locale keys and cover all supported locales.

## Original finding retest

| Original | Result | Successor evidence |
|---|---|---|
| CR-01 forged persisted assignment | **PARTIAL** | Byte/shape tamper is rejected; valid-envelope replay/copy and repeated legacy migration remain exploitable (HF-01/HF-02). |
| CR-02 non-atomic consent/assignment | **PARTIAL** | One authority-envelope/root mutation fixes logical tearing; real crash durability remains unproven (MF-02). |
| CR-03 renderer mints cohort | **PASS** | Native main-process confirmation is required and denial does not classify. |
| CR-04 expired window restarts | **PASS (controller)** | Exact controller boundaries and immutable re-enable behavior pass; rollout and completed UI handling remain defective (HF-03/MF-04). |
| CR-05 receipt not cohort/window bound | **PARTIAL** | Cohort/start/end mismatches fail; authority lineage and lifecycle are not bound (HF-03). |
| WR-01 malformed consent becomes disabled | **PASS** | Current and legacy exact parsers reject malformed/unknown-critical fields; migration authority is separately defective (HF-02). |
| WR-02 stale UI after consent change | **PASS (ordinary mutation)** | Enable/revoke refetch assignment; the two-read generation race and completed lifecycle remain (MF-03/MF-04). |

## Adversarial boundary matrix

| Boundary | Result |
|---|---|
| OS safe-storage unavailable/fallback | **PARTIAL** — code fails closed by inspection; production boundary lacks executable proof (MF-01). |
| Authenticator replay/copy/cross-install | **FAIL** — HF-01. |
| Atomic root mutation/crash | **PARTIAL** — logical atomicity fixed; physical crash proof missing (MF-02). |
| Renderer versus native confirmation authority | **PASS**. |
| Immutable lifecycle exact boundaries | **PARTIAL** — controller passes; rollout/UI consumers do not (HF-03/MF-04). |
| Receipt cohort/window binding | **PASS** for cohort/start/end; **FAIL** for lifecycle/lineage (HF-03). |
| Unknown-critical fields | **PASS** — exact-key parsers reject additions in authority, legacy state, policy, and receipt. |
| Migration abuse | **FAIL** — HF-02. |
| UI projection | **FAIL** — MF-03/MF-04/LF-01. |

## Acceptance decision

Plan 01-01 is **not accepted**. The candidate must not integrate until all 3 HIGH, 4 MEDIUM, and 3 LOW findings have executable regressions, repairs, and a new independent successor review reporting zero findings.

---

_Reviewed independently at exact commit/tree on 2026-07-19T13:32:46Z._
