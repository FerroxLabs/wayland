# M0B Baseline Machinery — Engineering Candidate

Status: **PARTIAL / NOT AN M0B PASS RECEIPT**
Date: 2026-07-16
Observation state: **NOT STARTED**
Invited alpha: **DISABLED**

## Implemented

- Closed schema version `1`; no arbitrary metadata or free text.
- Pseudonymous participant identity plus bounded opaque session, event, and journey-run IDs.
- Explicit novice, knowledge-work, developer, and operator cohorts.
- Explicit Classic/Cockpit shell identity and five primary journeys.
- Session started/ended/crashed semantics; silence remains incomplete, never inferred as a crash.
- Journey-start denominator with completed, failed, and unresolved outcomes.
- p50/p95 latency from correlated start/terminal timestamps.
- Closed accessibility, support, and return-to-Classic reason enums.
- Automatic stop for data loss/corruption, permission widening, approval bypass, cross-Project leakage, or receipt forgery.
- Identical event deduplication; conflicting IDs and invalid lifecycle transitions fail data quality.
- Consent-gated recording: disabled means no write, invalid/out-of-window events never reach storage, and persistence failures are explicit.
- Aggregate-only export contains no raw participant, session, event, or journey-run identifiers.
- A 14-day unsigned default policy with Sean Donahoe as decision owner.
- Minimums: 20 total participants, 5 per cohort, 10 starts per primary journey.
- Default comparison thresholds:
  - no journey-failure-rate regression;
  - p95 latency no worse than `1.15x` Classic;
  - crash-free-session delta no worse than `-0.005`;
  - no support-contact or serious/critical accessibility-rate regression;
  - return-to-Classic rate no higher than `0.10`.

## Privacy boundary

The parser rejects prompt, message, content, text, file/path, URL/URI, tool
argument, command, query, response/output/input, token, password, API key,
secret, and arbitrary metadata fields. Unknown fields are rejected rather than
silently stripped. Generic `usage_events.metadata_json` is not accepted as M0B
authority.

## Exact local proof

```text
rtk bunx vitest run tests/unit/process/services/cohort/CohortBaselineAggregator.test.ts
```

Result: 22 tests passed; zero failures.

```text
rtk bun run typecheck
rtk bunx oxlint src/process/services/cohort/types.ts src/process/services/cohort/privacy.ts src/process/services/cohort/CohortBaselineAggregator.ts src/process/services/cohort/CohortBaselineService.ts src/process/services/cohort/policy.ts tests/unit/process/services/cohort/CohortBaselineAggregator.test.ts
rtk bunx prettier --check src/process/services/cohort/types.ts src/process/services/cohort/privacy.ts src/process/services/cohort/CohortBaselineAggregator.ts src/process/services/cohort/CohortBaselineService.ts src/process/services/cohort/policy.ts tests/unit/process/services/cohort/CohortBaselineAggregator.test.ts
rtk git diff --check
```

Result: TypeScript passed; targeted lint reported zero warnings and zero errors;
format and diff whitespace checks passed after one mechanical policy-file wrap.

## Still absent

- product repository wiring;
- consent, privacy visibility, deletion, and aggregate-only export UI;
- a started/completed 14-calendar-day Classic observation;
- real cohort/sample counts;
- structured UAT operator workflow;
- a post-window signature;
- `receipts/M0B.json`.

This candidate cannot authorize a real-user cohort or invited alpha.
