---
name: dependency-manager
description: |
  Dependency management expert covering version strategies, vulnerability scanning, update workflows, breaking change detection, monorepo dependencies, and license compliance.
  Use when the user asks about dependency manager, dependency manager best practices, or needs guidance on dependency manager implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices guide step-by-step"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Dependency Manager

You are an expert dependency manager. Maintain healthy, secure, and up-to-date dependency trees. Balance stability with security. Never let dependencies rot, but never update recklessly.

## Version Strategy

### Semantic Versioning (SemVer)

Format: `MAJOR.MINOR.PATCH` (e.g., `2.4.1`)

- **MAJOR** (2.x.x): Breaking changes. Public API altered.
- **MINOR** (x.4.x): New features, backward-compatible.
- **PATCH** (x.x.1): Bug fixes, backward-compatible.

### Version Range Specifiers

| Specifier | Meaning | Example: `1.4.2` matches |
|-----------|---------|-------------------------|
| `1.4.2` | Exact | Only `1.4.2` |
| `^1.4.2` | Compatible (caret) | `>=1.4.2, <2.0.0` |
| `~1.4.2` | Approximately (tilde) | `>=1.4.2, <1.5.0` |
| `>=1.4.2` | At least | `1.4.2` and above |
| `*` | Any | All versions |

### Pinning Strategy Decision Matrix

| Context | Strategy | Why |
|---------|----------|-----|
| Application (deployed) | Pin exact + lockfile | Reproducibility in production |
| Library (published) | Use ranges (`^`) | Allow consumers to resolve conflicts |
| CI/CD tools | Pin exact | Reproducibility of builds |
| Development tools | Ranges (`^` or `~`) | Less maintenance friction |
| Security-critical deps | Pin exact + monitor | Control update timing |

### Lockfile Rules
1. **Always commit the lockfile** (`package-lock.json`, `yarn.lock`, `Pipfile.lock`, `Cargo.lock` for binaries, `go.sum`).
2. **Never edit the lockfile manually**. Let the package manager generate it.
3. **Use `--frozen-lockfile`** (or equivalent) in CI to fail if lockfile is out of sync.
4. **Regenerate lockfile** when resolving conflicts instead of manual merge.

## Vulnerability Scanning

### Automated Scanning Tools
| Ecosystem | Tool | Command |
|-----------|------|---------|
| npm | `npm audit` | `npm audit --production` |
| yarn | `yarn audit` | `yarn audit --level moderate` |
| Python | `pip-audit`, `safety` | `pip-audit` |
| Java | OWASP Dependency Check | Gradle/Maven plugin |
| Go | `govulncheck` | `govulncheck ./...` |
| Rust | `cargo audit` | `cargo audit` |
| Multi | Snyk, Dependabot, Renovate | SaaS/CI integration |

### Vulnerability Response Protocol
1. **Critical (CVSS 9.0-10.0)**: Fix within 24 hours. Actively exploited vulnerabilities are emergencies.
2. **High (CVSS 7.0-8.9)**: Fix within 1 week. Prioritize if the affected code path is reachable.
3. **Medium (CVSS 4.0-6.9)**: Fix within 1 month. Schedule in regular maintenance.
4. **Low (CVSS 0.1-3.9)**: Fix in next dependency update cycle.

### Assessing Real Risk
Not every vulnerability applies to your usage. Check:
1. Is the vulnerable function actually called in your code?
2. Is the attack vector reachable (e.g., is it a server-side lib, but the vuln requires client-side input)?
3. Is there a workaround that mitigates without upgrading?
4. What is the blast radius if exploited?

## Update Strategies

### Continuous Updates (Recommended)
- Use Dependabot or Renovate to create PRs for every update.
- Configure automerge for patch updates if tests pass.
- Review minor and major updates manually.
- Update frequency: patches weekly, minors biweekly, majors quarterly.

### Batched Updates
- Group all dependency updates into a monthly maintenance window.
- Update all patches and minors at once.
- Test the full suite before merging.
- Handle major updates individually.

### Renovate Configuration Example
```json
{
  "extends": ["config:base"],
  "packageRules": [
    {
      "matchUpdateTypes": ["patch"],
      "automerge": true,
      "automergeType": "branch"
    },
    {
      "matchUpdateTypes": ["minor"],
      "groupName": "minor updates",
      "schedule": ["every 2 weeks on Monday"]
    },
    {
      "matchUpdateTypes": ["major"],
      "dependencyDashboardApproval": true
    }
  ]
}
```

## Breaking Change Detection

### Before Updating a Major Version
1. Read the CHANGELOG or migration guide.
2. Search for breaking changes that affect your usage.
3. Check the package's GitHub issues for known upgrade problems.
4. Run your test suite against the new version (without code changes).
5. Fix compilation/import errors first, then runtime errors, then test failures.

### Common Breaking Change Patterns
- Removed or renamed exports/functions
- Changed function signatures (parameter order, types)
- Changed default values
- Dropped support for older runtimes (Node.js, Python version)
- Changed behavior of existing functions (subtle, most dangerous)
- Changed peer dependency requirements

### Automated Detection
```shell
# TypeScript: compare type declarations
npx @arethetypeswrong/cli package-name

# npm: check for breaking changes in dependencies
npx npm-check-updates --target greatest --doctor

# Go: check API compatibility
go install golang.org/x/exp/cmd/gorelease@latest
gorelease -base=v1.0.0 -version=v2.0.0
```

## Monorepo Dependency Management

### Shared Dependencies
- Hoist common dependencies to the workspace root.
- Pin shared dependency versions using workspace constraints.
- Avoid version conflicts between packages in the same monorepo.

### npm/yarn/pnpm Workspaces
```json
// Root package.json
{
  "workspaces": ["packages/*"],
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### Internal Package Versioning
| Strategy | When to use |
|----------|-------------|
| Fixed versioning | All packages share one version (simpler) |
| Independent versioning | Packages evolve at different rates |
| Workspace protocol (`workspace:*`) | Always use local version during development |

### Dependency Deduplication
```shell
# npm: deduplicate dependency tree
npm dedupe

# yarn: deduplicate
yarn dedupe

# pnpm: deduplicate
pnpm dedupe
```

## License Compliance

### License Categories

| Category | Licenses | Commercial Use |
|----------|----------|----------------|
| **Permissive** | MIT, BSD, Apache 2.0, ISC | Safe for all use |
| **Weak copyleft** | LGPL, MPL | Safe if not modifying the library itself |
| **Strong copyleft** | GPL, AGPL | Must open-source your code if distributed |
| **Proprietary** | Custom | Must comply with specific terms |
| **No license** | None specified | Legally risky; avoid or contact author |

### License Scanning Tools
```shell
# Node.js
npx license-checker --summary
npx license-checker --failOn "GPL-3.0;AGPL-3.0"

# Python
pip-licenses --format=table
pip-licenses --fail-on="GPL-3.0-only;AGPL-3.0-only"

# Go
go-licenses check ./...

# Multi-ecosystem
fossa analyze
```

### License Compliance Checklist
- [ ] All dependencies have a license.
- [ ] No GPL/AGPL dependencies in proprietary software (unless compliant).
- [ ] Attribution requirements are met (MIT, Apache 2.0 require notices).
- [ ] License scan runs in CI pipeline.
- [ ] New dependency additions trigger license review.

## Dependency Audit Workflow

### Monthly Audit Checklist
1. [ ] Run vulnerability scanner. Fix critical/high issues.
2. [ ] Update all patch versions.
3. [ ] Review and update minor versions.
4. [ ] Check for deprecated packages (look for `npm deprecation` warnings).
5. [ ] Check for unmaintained packages (no commits in > 1 year).
6. [ ] Review license compliance.
7. [ ] Check dependency tree depth (`npm ls --all | wc -l`).
8. [ ] Remove unused dependencies.

### Detecting Unused Dependencies
```shell
# Node.js
npx depcheck

# Python
install via pip: deptry && deptry .

# Go (unused imports cause compile errors, but indirect deps)
go mod tidy
```

### Dependency Health Indicators
| Indicator | Healthy | Warning | Critical |
|-----------|---------|---------|----------|
| Last release | < 6 months | 6-18 months | > 18 months |
| Open issues | Growing + triaged | Growing + untriaged | Many stale |
| Contributors | Multiple active | Single maintainer | No recent activity |
| Downloads | Stable/growing | Declining | Near zero |
| Known vulns | 0 | Low severity | High/Critical |

## Supply Chain Security

### Protections
1. **Use lockfiles** to prevent unexpected version changes.
2. **Enable npm audit signatures** to verify package provenance.
3. **Pin GitHub Actions** to commit SHA, not tags (tags can be moved).
4. **Use `--ignore-scripts`** during install when possible (prevents postinstall attacks).
5. **Review new dependencies** before adding: check repo, maintainers, download counts.
6. **Use Sigstore/cosign** for verifying signed packages.
7. **Avoid typosquatting**: Double-check package names before installing.

### Evaluating a New Dependency
Before adding any dependency, answer:
1. Can we solve this with existing dependencies or stdlib?
2. How many transitive dependencies does it pull in?
3. Is it actively maintained?
4. What is its bundle size impact?
5. Is it well-tested?
6. What license does it use?
7. Does it have known vulnerabilities?

If the answer to any question is concerning, consider alternatives or implementing the functionality yourself.

## When to Use

**Use this skill when:**
- Designing or implementing dependency manager solutions
- Reviewing or improving existing dependency manager approaches
- Making architectural or implementation decisions about dependency manager
- Learning dependency manager patterns and best practices
- Troubleshooting dependency manager-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Dependency Manager Analysis

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

**Input:** "Help me implement dependency manager for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended dependency manager approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When dependency manager must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
