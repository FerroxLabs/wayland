---
name: release-new-version
description: >-
  Orchestrates the process of shipping a new software version by chaining
  four engineering skills into a structured release pipeline. Covers
  release planning with changelog generation, commit history analysis,
  deployment execution, and post-release monitoring verification.
  Use when the user needs to ship a release with proper versioning,
  documentation, and deployment verification.
  Do NOT use for hotfixes that bypass the normal release process or
  for continuous deployment where every merge auto-deploys.
license: Apache-2.0
type: workflow
skills: release-management conventional-commits deployment-strategies monitoring-alerting
trigger_phrases: release new version ship a release cut a release deploy new version version bump
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: devops ci-cd planning step-by-step
  category: software-project
  depends: release-management conventional-commits deployment-strategies monitoring-alerting
  disclaimer: none
  difficulty: intermediate
---

# Release New Version

**Estimated time:** 2-8 hours (depending on release complexity and verification requirements)

This workflow chains four atomic skills into the process of shipping a new software version from preparation through deployment and monitoring verification. It covers version determination, changelog generation, deployment execution, and post-release validation. The workflow ensures every release is documented, verified, and recoverable.

## When to Use

- User needs to ship a new version of their software with proper versioning and documentation
- User wants a structured release process that produces traceable artifacts
- User is preparing a release for a library, API, application, or service
- User needs to coordinate version bumps, changelogs, and deployment as a single process
- Do NOT use when: the project uses continuous deployment (every merge deploys automatically), shipping a hotfix that bypasses the normal release cadence (use a simplified hotfix process), or the release is documentation-only with no code changes

## Prerequisites

Before starting this workflow, ensure:

1. **All changes are merged:** The features and fixes intended for this release are merged to the release branch (main, develop, or a release branch depending on branching strategy)
2. **CI is green:** All tests pass on the branch being released. Do not release with failing tests.
3. **Release scope is defined:** You know which changes are included in this release and can verify they match the intended scope
4. **Deployment access is ready:** You have credentials and permissions to deploy to staging and production environments

## Steps

**Step 1: Plan the Release** (uses: release-management)

Determine the version number, scope, and release timeline. This step inventories all changes since the last release and determines the appropriate version bump based on the nature of the changes.

- Input: Commit history since last release, previous version number, pending issues or tickets, release schedule
- Output: Release plan with: version number (major, minor, or patch based on changes), release scope (list of features, fixes, and breaking changes), pre-release checklist (blocking items that must be resolved), release timeline (cut date, staging verification period, production deployment window), and rollback criteria (conditions under which the release should be reverted)
- Key focus: Version number follows semantic versioning: breaking changes increment major, new features increment minor, bug fixes increment patch. If any commit since the last release introduces a breaking change, this is a major version bump regardless of how many features or fixes are also included.

**Step 2: Generate Changelog from Commits** (uses: conventional-commits)

Analyze the commit history to generate a structured changelog that documents what changed, why, and how it affects users. This step transforms developer-facing commit messages into user-facing release notes.

- Input: Commit log since last release, conventional commit format, previous changelog entries for style reference
- Output: Changelog entry with: version header and date, grouped changes by type (features, fixes, breaking changes, performance improvements), migration instructions for breaking changes, contributor acknowledgments, and linked ticket or issue references for each change
- Key focus: The changelog serves two audiences: developers (detailed technical changes) and users (impact on their workflow). Breaking changes must include specific migration instructions: "Previously, the login endpoint returned a 200 status for invalid credentials. It now returns 401. Update your client code to handle 401 responses." Features should explain the user benefit, not just the implementation.

**Step 3: Deploy the Release** (uses: deployment-strategies)

Execute the deployment plan from Step 1, promoting the release through staging verification to production deployment with health check verification.

- Input: Release artifacts (built code, container images, compiled binaries), deployment configuration, staging environment, production environment, rollback procedure from Step 1
- Output: Deployed release with: staging deployment verified (all tests pass against staging, manual smoke test completed), production deployment executed (with appropriate strategy: rolling, blue-green, or canary), health checks confirming the new version is serving traffic correctly, and deployment timestamp recorded for monitoring correlation
- Key focus: Verify in staging before deploying to production. Run the full test suite against the staging deployment, not just the CI tests against the build artifacts. For user-facing applications, perform manual smoke testing of critical paths. Keep the previous version's artifacts available for instant rollback during the production deployment.

**Step 4: Monitor Post-Release** (uses: monitoring-alerting)

Monitor the production deployment to verify the release performs as expected and catch regressions before users report them. This step closes the release process by confirming success or triggering rollback.

- Input: Deployed production release from Step 3, monitoring dashboards, pre-release baseline metrics, rollback criteria from Step 1
- Output: Post-release verification report with: metric comparison against pre-release baseline (error rate, response time, throughput), new feature metrics (usage, performance), alert status (any alerts triggered since deployment), and release status declaration (success, monitoring, or rollback initiated)
- Key focus: Monitor for at least 30 minutes after production deployment (longer for major releases or releases with breaking changes). Compare key metrics: error rate should not increase, response time percentiles should not worsen, and throughput should be stable or growing. If any metric violates the rollback criteria defined in Step 1, initiate rollback immediately.

## Decision Points

- **Before Step 1:** If the release includes only dependency updates or documentation changes, consider skipping the full workflow and using a simplified patch release process (version bump, changelog update, deploy).

- **At Step 1:** Determine release type: if this is a **scheduled release** (every 2 weeks), include all merged changes. If this is a **feature release** (specific feature completed), verify the feature is complete and all related changes are merged.

- **At Step 3:** Choose deployment strategy based on change risk. Patch releases with only bug fixes can use rolling updates. Minor releases with new features should use blue-green for instant rollback capability. Major releases with breaking changes should use canary deployment with gradual traffic migration.

- **After Step 4:** If monitoring shows degradation within the first hour, decide: rollback (if the degradation is significant and the root cause is unclear) or investigate (if the degradation is minor and you have a hypothesis for the cause).

## Failure Handling

- **Step 1 reveals unresolved blocking issues:** If the release scope includes incomplete features or known bugs, either delay the release until they are resolved or descope them by reverting their changes and proceeding with a smaller release.

- **Step 2 commit history is inconsistent:** If commit messages do not follow conventional format, manually review the diff since the last release and write the changelog by hand. Add commit convention enforcement to the CI pipeline as a follow-up action.

- **Step 3 staging verification fails:** If tests fail against staging, investigate whether the failure is in the release code (fix before retrying) or in the staging environment (fix environment, not code). Do not deploy to production until staging passes.

- **Step 4 metrics degrade after production deployment:** Initiate rollback if the degradation exceeds the criteria from Step 1. If the degradation is minor (error rate increased from 0.1 percent to 0.3 percent), investigate whether the increase is caused by the release or by external factors (traffic pattern change, third-party service issue).

- **Rollback required after Step 4:** Execute the rollback procedure. After rollback is confirmed, analyze the failure: was it a code issue (fix and re-release), a configuration issue (fix config and re-deploy), or an infrastructure issue (fix infrastructure before retrying)? Update the rollback criteria for future releases based on what was learned.

## Expected Outcome

When this workflow is complete, the user will have:

1. A determined version number following semantic versioning based on the nature of changes
2. A structured changelog documenting features, fixes, breaking changes, and migration instructions
3. The release deployed to production through staging with health check verification
4. Post-release monitoring confirming metrics are within acceptable ranges
5. Release artifacts tagged and stored for traceability and potential rollback

## Output Format

```
RELEASE CHECKLIST
==================

Version: [version number]
Previous: [previous version]
Release Date: [date]
Release Manager: [name]

Changes:
  Features: [count]
  Fixes: [count]
  Breaking: [count]

[ ] Step 1: Release Planning
    Version: v[X.Y.Z]
    Scope: [summary]
    Blocking issues: [count resolved/total]

[ ] Step 2: Changelog
    Entry written: [yes/no]
    Breaking change migration: [yes/no/N/A]

[ ] Step 3: Deployment
    Staging: [verified/pending/failed]
    Production: [deployed/pending/rolled-back]
    Strategy: [rolling/blue-green/canary]

[ ] Step 4: Monitoring
    Error rate: [before] -> [after]
    Response time: [before] -> [after]
    Alerts triggered: [count]
    Status: [success/monitoring/rolled-back]

Timeline: ______ hours
Overall Status: [RELEASED / MONITORING / ROLLED BACK]
```

**Adaptation notes:**
- For libraries and packages, Step 3 is publishing to a package registry instead of deploying
- For services with SLA commitments, extend monitoring in Step 4 to cover a full SLA reporting period
- Adjust staging verification duration based on release risk level

## Edge Cases

- **First release (no previous version):** Set version to 0.1.0 or 1.0.0 based on stability. The changelog covers all features from initial development. Pay extra attention to Step 3 deployment since there is no previous version to compare against.
- **Release includes both features and breaking changes:** Major version bump takes precedence. Ensure the changelog clearly separates breaking changes at the top with migration instructions. Consider a pre-release period (beta tag) for major versions to allow users to test before the final release.
- **Multiple environments (development, staging, QA, production):** Promote through each environment sequentially in Step 3. Each environment is a verification gate. Only proceed to the next environment after the current one passes verification.
- **Open-source library release:** Step 3 includes publishing to the package registry (npm, PyPI, crates.io). Add a verification step that installs the published package in a clean environment and runs integration tests against the published artifact.
- **Canary release showing mixed results:** If the canary (5-10 percent of traffic) shows slightly higher error rates but no critical failures, extend the canary period rather than immediately rolling back. Some metric variation is normal. Only escalate if the canary consistently underperforms the baseline over 30 or more minutes.

## Example

**Scenario:** "Ship version 2.4.0 of a SaaS application API. This release includes 3 new features, 5 bug fixes, and 1 deprecation notice. The team releases every 2 weeks on Wednesdays."

**Input:** Current version: 2.3.2. Changes since last release: 3 feature commits (new reporting endpoint, bulk user import, webhook retry configuration), 5 fix commits (pagination cursor bug, timezone conversion in reports, 3 minor UI fixes), 1 deprecation (old v1 export endpoint deprecated with removal planned for v3.0.0). Team: 6 developers, Wednesday release cadence, blue-green deployment on AWS ECS.

**Output:** Version 2.4.0 released to production with changelog and monitoring confirmation.

**Step 1 (release-management):** Version determined: 2.4.0 (minor bump for new features, no breaking changes). Release scope: 9 commits from 5 developers. Pre-release checklist: all 9 items merged to main, CI green, staging environment reset to match production database schema, release notes drafted. Rollback criteria: error rate above 1 percent for 5 minutes, or any P1 alerts within 2 hours. Release window: Wednesday 10:00-12:00 UTC.

**Step 2 (conventional-commits):** Changelog generated from conventional commits. Features section: "New reporting API endpoint for custom date ranges (GET /v2/reports/custom)", "Bulk user import via CSV upload (POST /v2/users/import)", "Configurable webhook retry policy (PUT /v2/webhooks/:id/retry-policy)". Fixes section: 5 items with ticket references. Deprecation notice: "GET /v1/export is deprecated and will be removed in v3.0.0. Migrate to GET /v2/reports/export." Contributors acknowledged. Changelog committed and PR merged.

**Step 3 (deployment-strategies):** Staging deployed at 09:00 UTC. Full test suite passed against staging (847 tests, 0 failures). Manual smoke test: verified new reporting endpoint returns correct data, bulk import processes a 500-row CSV in under 10 seconds, webhook retry configuration persists across restarts. Production deployed at 10:15 UTC via blue-green: new ECS task definition created, health checks verified over 90 seconds, ALB traffic switched from blue to green. Previous version (blue) kept running for 2 hours as rollback target.

**Step 4 (monitoring-alerting):** Post-release monitoring from 10:15 to 12:15 UTC. Error rate: 0.08 percent (baseline 0.06 percent, within normal variation). Response time p95: 145ms (baseline 140ms, within normal variation). New endpoint metrics: 34 requests to /v2/reports/custom in first 2 hours, 2 bulk imports processed successfully. No alerts triggered. Blue environment (previous version) decommissioned at 12:15 UTC. Release status: success.

**Result:** Version 2.4.0 released successfully. Changelog published to documentation site. Git tag v2.4.0 created. Team notified in release channel. Next release scheduled for 2 weeks.
