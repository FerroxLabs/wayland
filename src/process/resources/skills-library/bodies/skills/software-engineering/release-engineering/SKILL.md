---
name: release-engineering
description: |
  Release engineering expertise covering release trains, semantic versioning, changelog automation, feature freezes, rollback procedures, release notes generation, branching strategies, deployment orchestration, and release readiness validation.
  Use when the user asks about release engineering, release engineering best practices, or needs guidance on release engineering implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices version-control guide"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Release Engineering

You are a release engineer who ensures software gets from "code complete" to "running in production" reliably, repeatedly, and with full auditability. Release engineering is the discipline that makes deployments boring, which is exactly what they should be. If your releases are exciting, your process is broken.

## Release Strategy Selection

### Choosing a Release Model

| Model | Cadence | Best For | Risk Profile |
|-------|---------|----------|-------------|
| **Continuous Deployment** | Every merged PR | SaaS products, small teams | Low per-release, high automation needed |
| **Release Trains** | Fixed schedule (weekly/biweekly) | Medium teams, B2B SaaS | Medium, predictable |
| **Feature-Based** | When feature complete | Mobile apps, embedded | Higher per-release, thorough testing |
| **LTS + Current** | Dual track | Libraries, frameworks, platforms | Complex, two active branches |

### Release Train Model

```
RELEASE TRAIN SCHEDULE (biweekly example):

Week 1 (Development):
  Mon: Sprint starts, previous release in production monitoring
  Tue-Fri: Feature development, daily merges to main

Week 2 (Stabilization):
  Mon: Cut release branch (release/v2.5.0)
  Tue-Wed: Bug fixes on release branch only. No new features.
  Thu: Release candidate build + QA sign-off
  Fri: Deploy to production

RULES:
  - The train leaves on schedule whether your feature is ready or not
  - Incomplete features stay behind feature flags (disabled)
  - Only bug fixes cherry-picked to release branch after cut
  - If a release is not stable by Thursday, it slips to next train
```

## Semantic Versioning

### The Rules (SemVer 2.0.0)

```
MAJOR.MINOR.PATCH (e.g., 3.2.1)

PATCH (3.2.1 -> 3.2.2):
  - Bug fixes
  - Security patches
  - Performance improvements with no API change
  - Documentation fixes

MINOR (3.2.1 -> 3.3.0):
  - New features (backwards compatible)
  - New API endpoints or methods
  - Deprecation warnings (but old API still works)
  - New optional parameters

MAJOR (3.2.1 -> 4.0.0):
  - Breaking API changes
  - Removed deprecated features
  - Changed return types or parameter requirements
  - Minimum dependency version bumps that affect consumers
```

### Pre-release and Build Metadata

```
1.0.0-alpha.1       First alpha release
1.0.0-beta.1        First beta release
1.0.0-rc.1          Release candidate 1
1.0.0-rc.2          Release candidate 2 (bug fix)
1.0.0               Stable release
1.0.0+build.123     Build metadata (ignored in precedence)

PRECEDENCE ORDER:
  1.0.0-alpha.1 < 1.0.0-beta.1 < 1.0.0-rc.1 < 1.0.0
```

### Versioning Decision Tree

```
Did you change the public API?
├── No: Is it a bug fix?
│   ├── Yes: PATCH bump
│   └── No: Is it a new feature?
│       ├── Yes: MINOR bump
│       └── No: PATCH bump (refactoring, perf, docs)
└── Yes: Is the change backwards compatible?
    ├── Yes: MINOR bump (new feature, old API still works)
    └── No: MAJOR bump (breaking change)

SPECIAL CASES:
  - 0.x.y: Anything can change at any time (pre-1.0 = unstable API)
  - Dependency bump: If your dep bumps MAJOR, you MAY need MAJOR too
    (only if the break is exposed through your API)
```

## Changelog Automation

### Conventional Commits

```
FORMAT: <type>(<scope>): <description>

TYPES:
  feat:     New feature                    -> MINOR bump
  fix:      Bug fix                        -> PATCH bump
  docs:     Documentation only             -> No bump
  style:    Formatting, missing semi colons -> No bump
  refactor: Code change that neither fixes nor adds -> No bump
  perf:     Performance improvement        -> PATCH bump
  test:     Adding missing tests           -> No bump
  chore:    Build process, auxiliary tools  -> No bump
  ci:       CI configuration changes       -> No bump

BREAKING CHANGE:
  feat!: remove deprecated API endpoint   -> MAJOR bump
  feat(auth): add OAuth2 support          -> MINOR bump

  OR add BREAKING CHANGE footer:
  feat(auth): replace session with JWT

  BREAKING CHANGE: Sessions are no longer supported.
  Migrate to JWT tokens using the migration guide.
```

### Automated Changelog Generation

```shell
# Using conventional-changelog
npx conventional-changelog -p angular -i CHANGELOG.md -s

# Using release-please (Google's tool)
# .github/workflows/release-please.yml
name: release-please
on:
  push:
    branches: [main]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          release-type: node
          # Automatically:
          # 1. Creates/updates a release PR with changelog
          # 2. Bumps version based on conventional commits
          # 3. Creates GitHub release when PR is merged

# Using changesets (popular for monorepos)
npx changeset add        # Developer describes their change
npx changeset version     # Bumps versions, generates changelog
npx changeset publish     # Publishes to npm
```

### Changelog Format

```markdown
# Changelog

## [3.2.0] - 2025-01-15

### Added
- OAuth2 authentication support (#342)
- Bulk import API for user management (#356)
- Rate limiting configuration per API key (#361)

### Changed
- Improved error messages for validation failures (#358)
- Upgraded PostgreSQL driver to v8.x (#360)

### Fixed
- Fixed race condition in concurrent order creation (#355)
- Fixed memory leak in WebSocket connection pool (#359)

### Deprecated
- Session-based authentication (will be removed in v4.0.0)

### Security
- Updated dependencies to patch CVE-2025-1234 (#363)
```

## Branching Strategy for Releases

### Git Flow (Release Branches)

```
main (production)
  │
  ├── release/v3.2.0 (cut from develop)
  │   ├── fix: patch critical bug
  │   ├── fix: update translations
  │   └── merge -> main (tag v3.2.0), merge back -> develop
  │
  develop (integration)
  │
  ├── feature/oauth2 -> merge to develop
  ├── feature/bulk-import -> merge to develop
  └── feature/rate-limiting -> merge to develop

HOTFIX:
  main
  ├── hotfix/v3.2.1 (branch from main)
  │   ├── fix: critical security patch
  │   └── merge -> main (tag v3.2.1), merge -> develop
```

### Trunk-Based with Release Branches

```
main (always deployable)
  │
  ├── feature/oauth2 (short-lived, 1-3 days)
  │   └── merge to main via PR
  │
  ├── release/v3.2 (cut when ready to stabilize)
  │   ├── cherry-pick fixes from main
  │   └── tag v3.2.0, v3.2.1, etc.
  │
  └── release/v3.3 (next release)
```

## Feature Freeze Process

### Feature Freeze Checklist

```markdown
## Release v3.2.0 Feature Freeze

### Freeze Date: [DATE]
### Release Date: [DATE + 5 business days]

### Pre-Freeze (1 day before)
- [ ] All feature PRs merged or deferred to next release
- [ ] Feature flags: incomplete features disabled in release config
- [ ] Release branch cut from main
- [ ] CI pipeline configured for release branch

### During Freeze
- [ ] Only bug fixes merged to release branch
- [ ] Each fix requires release manager approval
- [ ] Fix categories allowed:
  - [ ] P0/P1 bugs (crashes, data loss, security)
  - [ ] P2 bugs (incorrect behavior affecting users)
  - [ ] NOT allowed: P3 bugs, improvements, refactoring

### Release Candidate Validation
- [ ] RC1 build successful
- [ ] Automated test suite passes (unit, integration, E2E)
- [ ] Manual QA sign-off on critical paths
- [ ] Performance benchmarks within acceptable range
- [ ] Security scan clean (no new Critical/High findings)
- [ ] Database migration tested on staging with production-like data
```

## Rollback Procedures

### Rollback Decision Framework

```
INCIDENT DETECTED
  │
  ├── Is the new release the cause?
  │   ├── Unclear: Investigate (15-minute timebox)
  │   └── Yes: How severe?
  │       ├── P0 (data loss, security breach, full outage)
  │       │   └── ROLLBACK IMMEDIATELY (no discussion needed)
  │       ├── P1 (significant feature broken, partial outage)
  │       │   └── ROLLBACK within 30 minutes unless fix is trivial
  │       └── P2 (minor feature broken, workaround exists)
  │           └── ROLL FORWARD with hotfix (1-4 hour window)
  │
  └── No: Standard incident response
```

### Rollback Types

| Type | Speed | Data Impact | Use When |
|------|-------|-------------|----------|
| **Revert deployment** | Fast (minutes) | None if stateless | Application-only change, no DB migration |
| **Feature flag disable** | Fastest (seconds) | None | Feature is behind a flag |
| **Database rollback** | Slow (varies) | Possible data loss | Migration was destructive (last resort) |
| **Blue-green switch** | Fast (seconds) | None | Previous version still running |
| **Canary stop** | Fast (seconds) | Minimal | Caught during canary rollout |

### Rollback Runbook Template

```markdown
## Rollback Runbook: v3.2.0

### Prerequisites
- [ ] Previous version (v3.1.2) artifact available in registry
- [ ] Database migration is reversible (down migration exists and tested)
- [ ] Rollback has been tested in staging

### Application Rollback
1. Set deployment target to v3.1.2:
   ```shell
   kubectl set image deployment/api api=registry.com/api:v3.1.2
   # OR
   aws ecs update-service --cluster prod --service api --task-definition api:v3.1.2
   ```
2. Monitor: Watch error rates for 5 minutes
3. Verify: Hit health check endpoints, run smoke tests

### Database Rollback (if needed)
1. STOP: Confirm data loss implications with on-call lead
2. Run down migration:
   ```shell
   npm run migrate:down -- --to v3.1.2
   ```
3. WARNING: Data written to new columns/tables since deploy will be lost

### Feature Flag Rollback (preferred)
1. Disable flag in LaunchDarkly/Unleash/config:
   ```shell
   HTTP client request -X PATCH [reference URL] \
     -d '{"enabled": false}'
   ```
2. No deployment needed. Change takes effect in < 60 seconds.

### Post-Rollback
- [ ] Notify stakeholders: "v3.2.0 rolled back due to [reason]"
- [ ] Create incident ticket
- [ ] Schedule post-mortem within 48 hours
```

## Release Notes

### Audience-Appropriate Notes

Write different notes for different audiences:

```markdown
## v3.2.0 Release Notes

### For Users (public changelog)
**New Features:**
- Sign in with Google and GitHub accounts
- Import users in bulk via CSV upload
- Set custom rate limits per API key

**Improvements:**
- Error messages now include specific field names and suggestions
- Dashboard loads 40% faster on initial page load

**Bug Fixes:**
- Fixed an issue where exports could be empty for large datasets
- Fixed incorrect timezone display for users in UTC+ timezones

---

### For Engineers (internal release notes)
**Breaking Changes:**
- `AuthService.authenticate()` now returns `Promise<AuthResult>` instead of `Promise<User>`
- Removed deprecated `GET /api/v1/users` (use `/api/v2/users`)

**Migration Required:**
- Run `npm run migrate` (adds `oauth_providers` table, `api_key_rate_limits` column)
- Update nginx config: new route `/auth/callback/*` must proxy to API

**Infrastructure:**
- Redis 7.x now required (was 6.x) for rate limiting features
- New env var: `OAUTH_GOOGLE_CLIENT_ID`, `OAUTH_GITHUB_CLIENT_ID`

**Known Issues:**
- CSV import timeout for files > 50MB (fix planned for v3.2.1)
- Rate limiting metrics not yet visible in Grafana (dashboard PR pending)
```

## Release Readiness Checklist

### Go/No-Go Decision Matrix

| Criterion | Go | No-Go |
|-----------|-----|-------|
| Automated tests | All pass | Any failure in critical path |
| Performance | Within 10% of baseline | >20% regression |
| Security scan | No new Critical/High | Any new Critical |
| Staging validation | All scenarios pass | Any P0/P1 scenario fails |
| Database migration | Tested on staging | Not tested or irreversible |
| Rollback tested | Verified on staging | Not verified |
| Documentation | Updated for breaking changes | Breaking changes undocumented |
| Monitoring | Alerts configured for new features | No monitoring for new code paths |
| On-call | Engineer available for 4 hours post-deploy | No one available |

## Release Automation Pipeline

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run build
      - run: npm run test:e2e

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs

  build-and-publish:
    needs: [validate, security-scan]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: docker build -t registry.com/api:${{ github.ref_name }} .
      - run: docker push registry.com/api:${{ github.ref_name }}

  deploy-staging:
    needs: build-and-publish
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - run: kubectl set image deployment/api api=registry.com/api:${{ github.ref_name }}
      - run: ./scripts/wait-for-healthy.shell-cmd staging
      - run: ./scripts/smoke-test.shell-cmd staging

  deploy-production:
    needs: deploy-staging
    environment: production  # Requires manual approval in GitHub
    runs-on: ubuntu-latest
    steps:
      - run: kubectl set image deployment/api api=registry.com/api:${{ github.ref_name }}
      - run: ./scripts/wait-for-healthy.shell-cmd production
      - run: ./scripts/smoke-test.shell-cmd production

  create-release:
    needs: deploy-production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx conventional-changelog -p angular -r 1 > RELEASE_NOTES.md
      - uses: softprops/action-gh-release@v2
        with:
          body_path: RELEASE_NOTES.md
          generate_release_notes: true
```

## Common Anti-Patterns

1. **"We'll test it in production"**: Not a release strategy. Even with feature flags, untested code in production is a liability. Test in staging with production-like data.

2. **Manual release steps**: If your release process has a wiki page with 20 manual steps, it will fail. Automate everything. The runbook should be executable, not readable.

3. **Big-bang releases**: Accumulating 3 months of changes and releasing all at once. If something breaks, you have 3 months of changes to bisect. Release frequently with small batches.

4. **No rollback plan**: "We'll just fix forward." You need both options. Sometimes a fix takes hours and your users are down now.

5. **Version number vanity**: Avoiding major version bumps because "v2.0 sounds bad." SemVer is a communication protocol, not a marketing tool. If you break the API, bump the major version.

## Release Engineering Checklist

- [ ] Release model chosen and documented (train, continuous, feature-based)
- [ ] Semantic versioning policy defined and enforced
- [ ] Conventional commits enforced via commit hooks
- [ ] Changelog generated automatically from commits
- [ ] Release branch strategy documented
- [ ] Feature freeze process defined with allowed change categories
- [ ] Rollback procedure documented and tested in staging
- [ ] Release notes template covers both user and engineer audiences
- [ ] Go/no-go criteria defined for release readiness
- [ ] CI/CD pipeline automates build, test, scan, deploy, and release notes
- [ ] On-call rotation covers the post-deployment monitoring window

## When to Use

**Use this skill when:**
- Designing or implementing release engineering solutions
- Reviewing or improving existing release engineering approaches
- Making architectural or implementation decisions about release engineering
- Learning release engineering patterns and best practices
- Troubleshooting release engineering-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Release Engineering Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement release engineering for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended release engineering approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When release engineering must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
