---
name: changelog-writer
description: |
  Expert changelog and release notes covering Keep a Changelog format, semantic versioning, conventional commits, automated changelog generation, migration guides, deprecation notices, breaking change communication, and audience-appropriate language.
  Use when the user asks about changelog writer, changelog writer best practices, or needs guidance on changelog writer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation version-control"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Changelog Writer

## Overview

This skill provides comprehensive expertise in writing changelogs and release notes that effectively communicate software changes to their intended audiences. It covers the Keep a Changelog standard, semantic versioning alignment, conventional commit conventions, automation tooling, migration guides for breaking changes, deprecation communication, and strategies for writing to different audience levels (developers, end users, stakeholders).

## Keep a Changelog Format

### Standard Template

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog]([reference URL]),
and this project adheres to [Semantic Versioning]([reference URL]).

## [Unreleased]

### Added
- Support for batch product imports via CSV upload

### Fixed
- Cart total calculation rounding error for currencies with 3 decimal places

## [2.3.0] - 2025-01-15

### Added
- Full-text search endpoint (`GET /products/search`) with relevance scoring
- `metadata` field on Product resource for arbitrary key-value data
- Idempotency key support on all write endpoints
- Rate limit headers (`X-Rate-Limit-Remaining`, `X-Rate-Limit-Reset`)

### Changed
- Default pagination limit increased from 10 to 20 items per page
- Product image upload now accepts WebP format in addition to JPEG and PNG
- Error responses now include `request_id` field for support reference

### Deprecated
- `GET /products?q=` query parameter. Use `GET /products/search` instead.
  Will be removed in v3.0.0 (scheduled Q3 2025).

### Fixed
- Order creation failing when shipping address contains Unicode characters
- Memory leak in WebSocket connection handler during high traffic
- Incorrect HTTP status code (200 instead of 201) on successful resource creation

### Security
- Upgraded `jsonwebtoken` from 8.5.1 to 9.0.0 to address CVE-2022-23529
- API keys are now hashed in database (previously stored in plaintext)

## [2.2.1] - 2024-12-20

### Fixed
- Critical: Database connection pool exhaustion under sustained load
- Webhook retry logic not respecting exponential backoff

## [2.2.0] - 2024-12-01

### Added
- Webhook support for order status changes
- Product category hierarchy (nested categories up to 5 levels)

### Changed
- Minimum Node.js version raised from 16 to 18

[Unreleased]: [reference URL]
[2.3.0]: [reference URL]
[2.2.1]: [reference URL]
[2.2.0]: [reference URL]
```

### Change Categories

| Category | Meaning | Example |
|----------|---------|---------|
| Added | New features | New API endpoint, new CLI command |
| Changed | Changes to existing functionality | Default value change, behavior modification |
| Deprecated | Features marked for future removal | Old API version, legacy parameter |
| Removed | Features removed in this release | Deleted endpoint, dropped platform support |
| Fixed | Bug fixes | Corrected calculation, resolved crash |
| Security | Security-related changes | Vulnerability patches, auth improvements |

### Rules for Good Changelog Entries

```
Writing Changelog Entries:
├── Start with a verb (Added, Fixed, Changed, Removed)
├── Describe the user impact, not the code change
│   ├── GOOD: "Fixed cart total rounding error for JPY currency"
│   ├── BAD: "Fixed floating point arithmetic in calculateTotal()"
├── Be specific but concise (one line per change)
├── Group related changes together
├── Include issue/PR references for traceability
│   └── "Fixed memory leak in WebSocket handler (#423)"
├── Order by importance within each category
├── Include context for non-obvious changes
│   └── "Changed: Increased rate limit from 100 to 200 req/min
│         (based on usage analysis showing legitimate users were throttled)"
└── Never include internal-only changes
    ├── Skip: "Refactored helper functions"
    ├── Skip: "Updated CI pipeline"
    └── Skip: "Fixed typo in internal docs"
```

## Semantic Versioning

### Version Number Decision Tree

```
Determining the Next Version Number:

Current version: X.Y.Z

Did you make backward-incompatible API changes?
├── YES → Bump MAJOR: (X+1).0.0
│   Examples:
│   ├── Removed an endpoint or field
│   ├── Changed the type of an existing field
│   ├── Renamed an existing field or parameter
│   ├── Changed error response format
│   └── Dropped support for a platform/runtime
│
├── NO → Did you add new functionality in a backward-compatible way?
│   ├── YES → Bump MINOR: X.(Y+1).0
│   │   Examples:
│   │   ├── New endpoint added
│   │   ├── New optional parameter added
│   │   ├── New optional response field added
│   │   └── New configuration option added
│   │
│   └── NO → Did you fix bugs or make internal changes?
│       └── YES → Bump PATCH: X.Y.(Z+1)
│           Examples:
│           ├── Bug fix
│           ├── Performance improvement
│           ├── Documentation correction
│           └── Security patch

Pre-release versions:
├── Alpha: 1.0.0-alpha.1 (unstable, incomplete features)
├── Beta: 1.0.0-beta.1 (feature-complete, may have bugs)
├── RC: 1.0.0-rc.1 (release candidate, should be stable)
```

## Conventional Commits

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types and Changelog Mapping

| Commit Type | Changelog Section | Version Bump |
|-------------|------------------|-------------|
| `feat:` | Added | MINOR |
| `fix:` | Fixed | PATCH |
| `perf:` | Changed (performance) | PATCH |
| `docs:` | (not in changelog) | None |
| `style:` | (not in changelog) | None |
| `refactor:` | (not in changelog) | None |
| `test:` | (not in changelog) | None |
| `chore:` | (not in changelog) | None |
| `ci:` | (not in changelog) | None |
| Any type with `!` or `BREAKING CHANGE:` | Breaking Changes | MAJOR |

### Examples

```
feat(auth): add OAuth2 PKCE flow support

Implement the Authorization Code with PKCE flow for public clients
(mobile apps, SPAs) as recommended by OAuth 2.1.

Closes #234

---

fix(orders): correct tax calculation for Canadian provinces

GST/HST was being applied at the federal rate for all provinces.
Now correctly uses province-specific rates.

Fixes #567

---

feat(api)!: change product ID format from integer to UUID

BREAKING CHANGE: All product IDs in API responses are now UUIDs.
Requests using integer IDs will receive a 400 error.
See migration guide: [reference URL]
```

## Automated Changelog Generation

### Tool Comparison

| Tool | Language | Features |
|------|----------|----------|
| conventional-changelog | Node.js | Git log → CHANGELOG.md |
| release-please | Node.js | GitHub Action, auto PR for releases |
| semantic-release | Node.js | Full automation: version, changelog, publish |
| changesets | Node.js | Monorepo support, manual changeset files |
| git-cliff | Rust | Configurable, fast, template-based |
| towncrier | Python | Fragment-based, manual review |

### release-please Configuration

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/release-please-action@v4
        with:
          release-type: node
          changelog-types: |
            [
              {"type": "feat", "section": "Features", "hidden": false},
              {"type": "fix", "section": "Bug Fixes", "hidden": false},
              {"type": "perf", "section": "Performance", "hidden": false},
              {"type": "deps", "section": "Dependencies", "hidden": false}
            ]
```

### Changeset-Based Workflow (Monorepo)

```markdown
<!-- .changeset/add-search-endpoint.md -->
---
"@myorg/api": minor
"@myorg/sdk-js": minor
---

Added full-text search endpoint (`GET /products/search`) with relevance
scoring. The JavaScript SDK now includes a `client.products.search()` method.
```

```shell
# Developer workflow
npx changeset                 # Interactive: select packages, bump type, description
git add .changeset/*.md
git commit -m "docs: add changeset for search feature"
git push

# Release workflow (CI)
npx changeset version         # Updates CHANGELOG.md and package.json versions
npx changeset publish         # Publishes to npm and creates git tags
```

## Migration Guides

### Migration Guide Template

```markdown
# Migration Guide: v2 to v3

## Overview

Version 3.0 introduces a new authentication system, updates the product ID
format, and removes several deprecated endpoints. This guide walks through
each breaking change and provides step-by-step migration instructions.

**Estimated migration time**: 2-4 hours for most integrations.

## Prerequisites

- Update the SDK to v3.x: `install @example/sdk@^3.0.0 via npm`
- Ensure your application handles the new error response format

## Breaking Changes

### 1. Product IDs changed from integer to UUID

**Before (v2):**
```json
{ "id": 12345, "name": "Widget" }
```

**After (v3):**
```json
{ "id": "550e8400-e29b-41d4-a716-446655440000", "name": "Widget" }
```

**Migration steps:**
1. Update your database schema: `ALTER TABLE products ALTER COLUMN external_id TYPE uuid;`
2. Update API response parsing to handle string IDs
3. A mapping endpoint is available during the transition period:
   `GET /v3/products/id-mapping?legacy_id=12345`
4. The mapping endpoint will be available until 2025-12-31

### 2. Authentication moved to OAuth 2.0

**Before (v2):**
```shell
HTTP client request -H "X-API-Key: sk_test_EXAMPLE_KEY_REPLACE_ME" [reference URL]
```

**After (v3):**
```shell
# Step 1: Get token
TOKEN=$(HTTP client request -s -X POST [reference URL] \
  -d "grant_type=client_credentials&client_id=xxx&client_secret=yyy" \
  | jq -r '.access_token')

# Step 2: Use token
HTTP client request -H "Authorization: Bearer $TOKEN" [reference URL]
```

**Migration steps:**
1. Generate OAuth2 credentials in the dashboard
2. Implement token refresh logic (tokens expire after 1 hour)
3. Legacy API keys will continue to work until 2025-06-30

## Deprecation Removal

The following deprecated features have been removed in v3:

| Feature | Deprecated In | Alternative |
|---------|--------------|-------------|
| `GET /v2/products?q=` | v2.3.0 | `GET /v3/products/search` |
| `X-API-Key` auth | v2.5.0 | OAuth 2.0 Bearer token |
| `product.category` (string) | v2.1.0 | `product.category_id` (UUID) |

## Rollback Plan

If you encounter issues after migrating:
1. The v2 API remains available at `[reference URL] until 2025-12-31
2. Pin your SDK to v2: `install @example/sdk@^2.0.0 via npm`
3. Contact support@example.com for migration assistance
```

## Deprecation Notices

### Deprecation Communication Timeline

```
Deprecation Lifecycle:
├── T-6 months: Announce deprecation
│   ├── Changelog entry under "Deprecated"
│   ├── API response header: Deprecation: true
│   ├── Documentation banner on deprecated features
│   ├── Email notification to API key owners
│   └── Blog post for major deprecations
├── T-3 months: Warning intensification
│   ├── API response header: Sunset: <date>
│   ├── Console warnings in SDK
│   └── Dashboard notification
├── T-1 month: Final notice
│   ├── Email reminder to remaining users
│   └── Dashboard alert
├── T-0: Removal
│   ├── Feature removed
│   ├── Requests return 410 Gone with migration link
│   └── Changelog entry under "Removed"
└── T+3 months: Cleanup
    └── Remove 410 handler, return 404
```

### Deprecation Header Standards

```
HTTP Response Headers for Deprecated Endpoints:

Deprecation: true
Sunset: Sat, 01 Jul 2025 00:00:00 GMT
Link: <[reference URL]>; rel="successor-version"
```

## Audience-Specific Release Notes

### Developer-Facing (Changelog)

```markdown
## [2.3.0] - 2025-01-15

### Added
- `GET /products/search` endpoint with full-text search and relevance scoring
- `metadata` JSONB field on Product resource
- Idempotency-Key header support on POST, PUT, PATCH endpoints

### Fixed
- Order creation returns 500 when shipping address contains emoji (#423)
```

### End-User-Facing (App Release Notes)

```markdown
## What's New in Version 2.3

**Better Search**: Find products faster with our improved search. Results
are now ranked by relevance, so the best matches appear first.

**Bug Fixes**: Fixed an issue where orders could fail if your address
contained special characters. Various stability improvements.
```

### Stakeholder-Facing (Executive Summary)

```markdown
## Release 2.3 Summary - January 2025

**Key Improvements:**
- New search functionality expected to improve product discovery by 15-20%
- Security: API keys now encrypted at rest (SOC2 compliance requirement)
- Performance: Average API response time reduced from 180ms to 120ms

**Metrics Impact:**
- Enables A/B testing of search results
- Reduces support tickets related to order failures (~50 tickets/month)

**No downtime required for deployment.**
```

## Production Checklist

- [ ] Changelog follows Keep a Changelog format
- [ ] Version number follows semantic versioning rules
- [ ] All user-facing changes are documented
- [ ] Breaking changes are clearly labeled and explained
- [ ] Migration guide provided for all breaking changes
- [ ] Deprecated features have sunset dates
- [ ] Compare links at bottom of CHANGELOG.md are correct
- [ ] Release notes written for target audience (developer/user/stakeholder)
- [ ] Conventional commits used consistently
- [ ] Automated changelog generation configured in CI
- [ ] Deprecation notices sent to affected users
- [ ] Internal-only changes excluded from public changelog
- [ ] Security fixes reference CVE numbers where applicable

## When to Use

**Use this skill when:**
- Designing or implementing changelog writer solutions
- Reviewing or improving existing changelog writer approaches
- Making architectural or implementation decisions about changelog writer
- Learning changelog writer patterns and best practices
- Troubleshooting changelog writer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Changelog Writer Analysis

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

**Input:** "Help me implement changelog writer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended changelog writer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When changelog writer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
