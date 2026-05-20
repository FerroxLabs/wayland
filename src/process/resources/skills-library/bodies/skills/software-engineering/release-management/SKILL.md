---
name: release-management
description: |
  Guides expert-level release management implementation: version-control and devops decision frameworks, production-ready patterns, and concrete templates for release management workflows.
  Use when the user asks about release management, release management configuration, or version-control best practices for release projects.
  Do NOT use when the user needs a different developer tools capability -- check sibling skills in the developer tools subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "version-control devops automation"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Release Management

## When to Use

**Use this skill when:**
- A user wants to design or implement a versioning and release workflow for a software project -- including choosing between trunk-based development, GitFlow, GitHub Flow, or release branching strategies
- A user asks how to automate changelog generation, semantic versioning, or release tagging in their CI/CD pipeline
- A user needs to manage multiple concurrent release trains (e.g., a v2.x maintenance branch alongside a v3.x active development line)
- A user is setting up release automation tooling such as release-please, semantic-release, changesets, or conventional commits enforcement
- A user needs to coordinate a release across multiple services or repositories (monorepo or polyrepo), including dependency sequencing and rollback planning
- A user is introducing formal release management into a team that previously had no process -- including adoption sequencing and tooling selection
- A user needs to design hotfix, patch, or emergency release procedures distinct from their normal release cadence
- A user is operating in a regulated environment (SOC 2, FDA, HIPAA, PCI-DSS) and needs change control traceability baked into their release process

**Do NOT use this skill when:**
- The user is asking specifically about CI/CD pipeline configuration (build steps, test parallelization, artifact storage) -- use the CI/CD pipeline skill instead
- The user needs help with infrastructure deployment orchestration (Kubernetes rollouts, Helm chart management, canary deploys) -- use the deployment strategy skill
- The user is asking about feature flag management as a runtime toggle system (LaunchDarkly, Flagsmith) -- use the feature flag skill
- The user needs code review process design or pull request workflow guidance independent of release gating -- use the code review workflow skill
- The user is asking about incident response or production post-mortems -- use the incident management skill
- The user needs dependency update automation (Dependabot, Renovate) without a release process context -- use the dependency management skill

---

## Process

### 1. Establish Project Context and Constraints

Before recommending any strategy, gather the following information explicitly. The wrong defaults cause months of friction.

- **Team size and topology:** Solo developers can use trunk-based development with tagged releases. Teams of 2--8 benefit from GitHub Flow with release tags. Teams of 8+ with multiple feature squads need explicit release branch or GitFlow discipline to prevent integration chaos.
- **Release cadence:** Continuous delivery (multiple deploys per day) is incompatible with long-lived release branches. Quarterly or fixed-schedule releases require coordinated code freezes and branch stabilization windows.
- **Deployment model:** Is there a single production environment, or are there multiple tenants on different release tracks (e.g., SaaS with enterprise customers on older versions)? Multi-tenant support forces long-lived maintenance branches.
- **Regulatory and compliance requirements:** SOC 2 Type II, FDA 21 CFR Part 11, PCI-DSS, and HIPAA all require evidence of change approval, separation of duties between developers and deployers, and immutable audit logs tied to release artifacts.
- **Monorepo vs. polyrepo:** Monorepos with multiple deployable units require per-package versioning (changesets is the standard tool). Polyrepos require inter-service release coordination, typically via a release manifest or dependency lock convention.
- **Current tooling:** Identify the source control platform (GitHub, GitLab, Bitbucket, Azure DevOps) because branch protection, required reviews, and environment gates are platform-specific. The automation tooling must match.

### 2. Select the Branching and Release Strategy

Apply this decision framework based on the constraints gathered in Step 1:

- **Trunk-Based Development with Tagged Releases:** Best for teams of 1--5, continuous delivery pipelines, and single-environment deployments. All work lands on `main`. Releases are semver tags on `main`. Short-lived feature branches (< 2 days) are acceptable. Requires a high-quality automated test suite (>80% coverage, < 10 minute CI time) to be safe.
- **GitHub Flow:** Best for teams of 3--10 deploying from `main` on a weekly or biweekly cadence. Feature branches merge to `main` via pull request. A release is a tagged commit on `main`, optionally promoted through staging. Simpler than GitFlow; avoids the dual-branch confusion of `main`/`develop`.
- **GitFlow:** Best for teams with fixed release schedules (monthly, quarterly), long QA cycles, or multiple simultaneous release candidates. Uses `main`, `develop`, `feature/*`, `release/*`, and `hotfix/*` branches. The `develop` branch is the integration target. A `release/x.y.z` branch is cut from `develop` for stabilization, then merged to both `main` and `develop` on ship. Only use GitFlow if you have explicit QA freeze periods -- it is operationally expensive otherwise.
- **Release Branch Strategy (without full GitFlow):** Best for open-source projects or products supporting multiple major versions simultaneously. Maintain `main` as the bleeding edge. Cut `release/2.x` and `release/3.x` branches that receive only cherry-picked security and bug fixes. Tag releases from those branches. This is the model used by Node.js, Python, and most major open-source projects.
- **Environment-Promotion Model:** Best for enterprise environments where code must pass through dev → staging → UAT → production gates. Branches or tags correspond to environment promotion events. Often combined with GitHub Flow or release branches.

### 3. Design the Versioning Convention

Versioning is the contract between you and your consumers. Ambiguous versioning causes downstream breakage.

- **Semantic Versioning (semver):** Use `MAJOR.MINOR.PATCH` per the semver 2.0.0 specification. MAJOR bumps for breaking API changes, MINOR for backwards-compatible new features, PATCH for backwards-compatible bug fixes. For pre-release: `1.2.0-alpha.1`, `1.2.0-rc.2`. For build metadata: `1.2.0+20231015`.
- **Commit convention enforcement:** Adopt Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`, `ci:`, `breaking change:`) and enforce with commitlint in a pre-commit hook or CI check. This is the input that drives automated version bumping and changelog generation.
- **Calendar versioning (CalVer):** An alternative for date-driven releases. Format: `YYYY.MM.PATCH` or `YY.MM.DD`. Use when semver semantics are meaningless (e.g., a browser, an OS distro, a pure internal service with no API consumers). Ubuntu, pip, and Twisted use CalVer.
- **Pre-release channels:** Define explicit channels -- `alpha` (internal only, unstable), `beta` (external preview, breaking changes possible), `rc` (release candidate, only critical fixes permitted), `stable`. Each channel maps to an npm dist-tag or package registry label. Automate promotion between channels rather than doing it manually.
- **Version source of truth:** Choose one authoritative location for the version number: the git tag, `package.json`, `pyproject.toml`, `build.gradle`, or a `VERSION` file. Never duplicate the version string in multiple locations without automation to keep them synchronized. The git tag is the most reliable source of truth because it is tied directly to the repository state.

### 4. Configure Automated Release Tooling

Manual releases are error-prone. Automate the mechanical steps.

- **release-please (Google):** Reads Conventional Commits since the last tag, opens a Release PR that bumps the version in config files and writes a CHANGELOG.md section. On merge, it creates the git tag and GitHub Release. Works well for monorepos with multiple packages. Integrates with GitHub Actions natively.
- **semantic-release:** Fully automated -- no PR step. On every merge to the release branch, it analyzes commits, bumps version, writes changelog, publishes to the package registry, and creates the git tag. Requires strict Conventional Commits discipline. Supports 20+ plugins for npm, PyPI, Docker, Slack notifications, and GitHub Releases.
- **changesets (Atlassian):** Best for monorepos. Developers add a "changeset" file to each PR that describes the change type (major/minor/patch) and notes. The changesets CLI aggregates these into a version bump PR. Used by major projects including Svelte, pnpm, and SvelteKit.
- **goreleaser:** Go-specific. Compiles binaries for multiple OS/arch targets, creates archives, generates checksums, publishes GitHub Releases, publishes Docker images, and can push to Homebrew taps and Scoop buckets -- all from a single `.goreleaser.yaml` config.
- **Branch protection rules:** On the target platform, enforce: require pull request reviews (minimum 2 approvers for MAJOR releases), require status checks to pass before merge, require up-to-date branches, restrict who can push directly to `main` and `release/*` branches. In GitHub, use branch ruleset rulesets (the newer system) rather than legacy branch protection for more granular control.
- **Tag protection:** Protect version tags (`v*`) so only the release automation bot or a release manager role can create them. Prevents accidental or unauthorized releases.

### 5. Design the Release Pipeline

The release pipeline is distinct from the build/test pipeline. It runs after artifacts are proven stable.

- **Artifact promotion, not rebuild:** Never rebuild from source at release time. Build once in CI, store the immutable artifact (Docker image, tarball, npm package) in a registry with a unique content-addressed identifier (Git SHA or digest). Promote that exact artifact through environments by changing tags or pointers, not by rebuilding.
- **Release pipeline stages:**
  1. **Validate:** Confirm the release tag matches the version in config files. Run final integration tests against the release artifact.
  2. **Publish artifacts:** Push Docker image with `vX.Y.Z` and `latest` (or channel) tags. Publish to npm/PyPI/Maven under the correct version. Sign artifacts with cosign or GPG.
  3. **Create release notes:** Generate structured notes from commits. Include breaking changes, migration instructions, and deprecation notices in a dedicated section at the top.
  4. **Deploy to production:** Trigger the deployment pipeline with the release artifact reference. This is a separate pipeline, not part of the release pipeline itself.
  5. **Post-release validation:** Run smoke tests against production. Alert on-call if validation fails.
- **Rollback plan:** Every release must have a documented rollback procedure defined before the release starts. For artifacts: re-tag and re-deploy the previous version. For database migrations: test the down migration in staging before running the up migration in production. If the down migration is destructive, the release requires a maintenance window.
- **Release freeze windows:** Define code freeze periods (typically 24--72 hours before a scheduled release) where only critical bug fixes can merge to the release branch. Communicate freeze dates on a shared calendar and enforce with branch protection rules that restrict merges during the window.

### 6. Implement Hotfix Procedures

Hotfixes are the most dangerous part of release management because they occur under pressure. Pre-define the process before an incident.

- **Hotfix branching:** Cut a `hotfix/x.y.z` branch from the production tag (not from `main` or `develop`). Apply the minimal fix. Merge to `main` (or `develop` in GitFlow) to ensure the fix is not lost. Tag the hotfix as a PATCH release (`x.y.z+1`).
- **Expedited review:** Define a minimum approval requirement for hotfixes -- typically 1 senior engineer review and 1 security sign-off if the fix is security-related. Document this explicitly so there is no ambiguity under pressure.
- **Communication protocol:** Before deploying a hotfix, notify the on-call team, relevant stakeholders, and, if user-facing, a status page update. After deploy, file a follow-up ticket for root cause analysis.
- **Security hotfixes:** Coordinate with disclosure timelines. Prepare the fix in a private fork or security advisory branch if using GitHub. Publish a CVE after the fix is deployed. Do not commit security fix details to a public branch before the patch is available.

### 7. Establish Release Documentation and Communication

A release is not complete until it is communicated.

- **CHANGELOG.md format:** Use Keep a Changelog format (`## [x.y.z] - YYYY-MM-DD`, grouped by `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`). Automate generation but allow human editing of the draft before publication.
- **GitHub/GitLab Releases:** Publish a release object on the tag. Include: version number and date, summary of key changes in plain language for non-engineers, list of breaking changes with migration guide links, full commit list or link to CHANGELOG, checksums for published artifacts, link to deployment status.
- **Internal release notes:** For internal teams, write a separate "what changed and what you need to do" document. Distinguish between changes that require action (database migrations, config changes, feature flag updates) and passive improvements.
- **Deprecation notices:** Any deprecated API or behavior must appear in release notes for at minimum 2 MINOR versions before removal. Document the replacement path. Use runtime warnings in the code.
- **Release metrics tracking:** After each release, record: lead time from feature complete to production (target < 3 days for routine releases), deployment frequency (target: multiple times per week for high-performing teams per DORA metrics), change failure rate (target < 5%), and mean time to recovery (target < 1 hour).

### 8. Review, Audit, and Iterate

Release management is a process that requires ongoing calibration.

- **Retrospective cadence:** Conduct a release retrospective after every major or problematic release. For routine releases, a monthly process review is sufficient. Track: release duration, number of release-blocking issues found late, rollback events, and hotfix frequency.
- **Audit log requirements:** For compliance, ensure that every release event is logged with: who triggered it, what artifact was deployed, when it occurred, and what approval chain was completed. GitHub Actions run logs, artifact digests, and deployment records together constitute an audit trail. For formal compliance, export these to an immutable log store (e.g., AWS CloudTrail, Splunk).
- **Process debt:** Identify steps in the release process that require manual intervention. Each manual step is a risk and a bottleneck. Prioritize automating the highest-frequency manual steps first. Target a fully automated release process (zero-touch from merged PR to production) as the long-term goal for teams practicing continuous delivery.
- **Tooling upgrades:** Review major version updates to release tooling quarterly. semantic-release, release-please, and changesets all evolve. Pin versions in CI to avoid unexpected behavior, but schedule intentional upgrades.

---

## Output Format

When responding to a release management request, deliver output in this structure:

```
## Release Management Recommendation: [Project Name or Context]

### Context Summary
- Team size: [N engineers, N squads]
- Release cadence: [continuous / weekly / monthly / quarterly]
- Deployment target: [single env / multi-env / multi-tenant]
- Compliance requirements: [none / SOC 2 / PCI / FDA / other]
- Repository structure: [monorepo / polyrepo / N services]

---

### Recommended Strategy: [Strategy Name]

**Rationale:**
[2-4 sentences explaining why this strategy fits the stated context. Reference the specific
constraints that drove the decision.]

**Branching Model:**
| Branch         | Purpose                        | Lifetime        | Merge Target          |
|----------------|--------------------------------|-----------------|-----------------------|
| main           | Production-ready code          | Permanent       | N/A (merge target)    |
| develop        | Integration branch (if GitFlow)| Permanent       | release/*             |
| feature/[name] | New feature development        | < 5 days ideal  | develop or main       |
| release/[x.y]  | Stabilization branch           | Days to weeks   | main + develop        |
| hotfix/[x.y.z] | Emergency production patch     | Hours to days   | main + develop        |

**Versioning Convention:** [semver / calver / custom]
- Version source of truth: [git tag / package.json / VERSION file]
- Pre-release channels: alpha → beta → rc → stable
- Breaking change signaling: [MAJOR bump / explicit deprecation policy]

---

### Tooling Configuration

**Automation Tool:** [release-please / semantic-release / changesets / goreleaser]

**Commit Convention:** Conventional Commits 1.0.0
- `feat:` → MINOR bump
- `fix:` → PATCH bump
- `feat!:` or `BREAKING CHANGE:` footer → MAJOR bump
- `chore:`, `docs:`, `test:` → no version bump

**Branch Protection Rules:**
- Protected branches: main, release/*
- Required reviewers: [N] (minimum 2 for MAJOR releases)
- Required status checks: [lint, unit-tests, integration-tests, security-scan]
- Restrict force pushes: yes
- Restrict deletions: yes
- Tag protection: v* (restricted to release-bot and release-manager role)

**CI/CD Integration:**
```yaml
# Example: GitHub Actions release workflow trigger
on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'
  pull_request:
    branches:
      - main
      - 'release/**'
```

---

### Release Pipeline Stages

| Stage              | Tool / Mechanism          | Success Criteria                        |
|--------------------|---------------------------|-----------------------------------------|
| Validate           | CI checks on release tag  | All status checks green                 |
| Publish artifacts  | registry push (Docker/npm) | Artifact digest logged, signed         |
| Create release     | release-please / GitHub   | Release notes published, tag created   |
| Deploy to prod     | Deployment pipeline       | Deployment health checks pass          |
| Post-release smoke | Synthetic tests           | P0 user journeys passing in production |
| Rollback standby   | Previous tag re-deployed  | Rollback rehearsed in staging          |

---

### Hotfix Procedure

1. Cut `hotfix/x.y.z+1` from the production tag (`vx.y.z`).
2. Apply minimal fix. Do not bundle unrelated changes.
3. Require [N] reviewer approvals (expedited track).
4. Merge to `main` (and `develop` if using GitFlow) after tag is created.
5. Tag `vx.y.z+1` and deploy via normal release pipeline.
6. Post status update and file root cause analysis ticket within 24 hours.

---

### Release Cadence and Code Freeze Schedule

| Event              | Timing Before Release | Responsible          |
|--------------------|-----------------------|----------------------|
| Feature freeze     | T-5 days              | Engineering lead     |
| Code freeze        | T-2 days              | Release manager      |
| Release candidate  | T-1 day               | QA / Automation      |
| Production deploy  | T-0                   | Release manager      |
| Post-release review| T+1 day               | Full team            |

---

### CHANGELOG Template (Keep a Changelog format)

```markdown
## [x.y.z] - YYYY-MM-DD

### Breaking Changes
- [Description of breaking change and migration path]

### Added
- [New feature description]

### Changed
- [Behavior change description]

### Deprecated
- [Deprecated feature, removal target version]

### Removed
- [Removed capability, replacement]

### Fixed
- [Bug description and impact]

### Security
- [CVE identifier if applicable, severity, patched behavior]
```

---

### DORA Metrics Targets

| Metric                     | Elite        | High         | Medium        | Low           |
|----------------------------|--------------|--------------|---------------|---------------|
| Deployment frequency       | Multiple/day | Weekly       | Monthly       | < Monthly     |
| Lead time for changes      | < 1 hour     | 1 day--1 wk  | 1 wk--1 mo    | > 1 month     |
| Change failure rate        | 0--5%        | 5--10%       | 10--15%       | > 15%         |
| Mean time to recovery      | < 1 hour     | < 1 day      | < 1 week      | > 1 week      |

Current estimated tier: [Elite / High / Medium / Low]
Target tier in 90 days: [tier]
```

---

## Rules

1. **Never rebuild from source at release time.** Build once in CI, tag the immutable artifact with the Git SHA, promote that exact artifact through staging and production. Rebuilding at release time introduces non-determinism -- dependency resolution, environment drift, and time-sensitive external calls can all cause the release artifact to differ from what was tested.

2. **Never put the version string in multiple files without automation to synchronize them.** Version drift between `package.json`, a Docker label, a helm chart `values.yaml`, and a GitHub Release is a classic release management failure mode. Designate one authoritative source (the git tag) and use tooling to propagate it at build time.

3. **Never merge a hotfix directly to production without also merging it to the development trunk.** A fix that exists only on a `hotfix/*` branch will be lost when the next scheduled release overwrites it. The hotfix merge to `main` and `develop` (or equivalent) is mandatory before the hotfix branch is deleted.

4. **Never skip the rollback plan.** Define the rollback procedure for every release before the release deploy starts. For schema migrations, test the rollback in staging first. If the rollback requires a maintenance window or is destructive, that must be communicated and approved before the release begins, not discovered during an incident.

5. **Always enforce Conventional Commits at the CI level, not just as a guideline.** commitlint running in CI (not just a git hook that developers can skip) is the only reliable way to ensure automated changelog and version bump tooling receives correct input. A single non-conforming commit message breaks semantic-release's ability to determine the correct version bump.

6. **Never use a floating tag (like `latest`) as the canonical reference for a production deployment.** `latest` can change beneath you. Reference production deployments by immutable identifiers: a full semver tag, a Docker image digest (`sha256:...`), or a specific commit SHA. `latest` is acceptable as a convenience pointer for development environments only.

7. **Always separate the release pipeline from the deployment pipeline.** The release pipeline produces and publishes a versioned artifact. The deployment pipeline takes a versioned artifact and puts it into a target environment. Conflating these makes it impossible to deploy the same release to multiple environments independently, and makes rollbacks harder to execute cleanly.

8. **Never create a release branch from an untested or unstable commit.** Release branches must be cut from a known-good commit -- one where all CI checks have passed on the integration branch. Cutting a release branch from a broken state means the stabilization period is contaminated from the start.

9. **Always include a `Security` section in release notes, even if it is empty.** Downstream consumers and security teams need to know whether a release includes security fixes. An explicitly empty security section signals "no security changes this release" rather than "we forgot to check." This is especially important for libraries and frameworks.

10. **Never allow direct pushes to protected branches by any human, including administrators.** The "bypass for administrators" option in branch protection is a compliance and safety anti-pattern. Even administrators should go through pull requests. If an emergency requires bypassing this, treat it as an incident requiring a post-mortem, not a routine capability.

---

## Edge Cases

### Multiple Major Versions in Concurrent Maintenance

When your product must maintain v1.x, v2.x, and v3.x simultaneously (common in enterprise software, open-source libraries, and SaaS with long-term support contracts):

- Maintain long-lived `release/1.x`, `release/2.x`, `release/3.x` branches. `main` tracks the bleeding-edge development (v4.x).
- Security fixes and critical bug fixes are applied to `main` first (if applicable), then cherry-picked to each maintained branch using `git cherry-pick -x` (the `-x` flag preserves the original commit reference in the commit message for traceability).
- Define an explicit LTS (Long-Term Support) policy: which versions receive security patches only, which receive bug fixes, which are end-of-life. Publish this as a support matrix in your documentation.
- Tag releases from each branch independently: `v1.4.7`, `v2.11.2`, `v3.2.0` can coexist. Use GitHub Releases or equivalent to mark EOL versions clearly.
- Automate backport PRs with tools like `git-backport` or GitHub's backport action to reduce the manual cherry-picking burden.

### Monorepo with Multiple Independently Versioned Packages

When a single repository contains 10+ packages that each have their own semantic version and release cadence:

- Use **changesets** as the versioning and changelog tool. Each PR that changes a package includes a changeset file specifying which packages changed and by how much (major/minor/patch).
- The changesets bot accumulates changeset files and opens a "Version Packages" PR that atomically bumps all affected package versions. Merging that PR triggers publishing.
- Define a dependency graph within the monorepo. If `package-a` depends on `package-b` and `package-b` has a MINOR bump, changesets can automatically compute that `package-a` needs at minimum a PATCH bump (for the updated dep range).
- Distinguish between "private" packages (internal utilities, never published) and "public" packages. Only public packages need semver discipline and formal changelogs.
- Set a workspace protocol for internal dependencies (`"package-b": "workspace:^"`) so internal consumers always get the local version during development, but the published version at release time.

### Regulated Environment with Change Control (SOC 2, FDA 21 CFR Part 11)

When every production change requires documented evidence of review, approval, and testing:

- Map your release workflow to change management requirements explicitly. A pull request peer review can serve as the documented technical review. A staging environment sign-off by QA serves as the documented test evidence. A deployment approval in GitHub Environments (or ServiceNow, Jira Service Management) serves as the change approval record.
- Use **immutable CI/CD run artifacts** as audit evidence. Store the CI run ID, test result files, artifact digests, and approver identities in an audit log. GitHub Actions run summaries, combined with artifact signing via cosign, provide a verifiable chain of custody.
- Enforce **four-eyes principle** (minimum two approvers, where the deployer cannot be one of the code authors) at the branch protection level.
- For FDA 21 CFR Part 11: the version control system itself must be validated, meaning the configuration of branch protection, required reviews, and audit logging must be documented and tested as part of your system validation. Changes to the release tooling configuration require their own change control process.
- Never squash merge in regulated environments -- the full commit history is part of the audit trail. Merge commits that preserve the branch history are required.

### Emergency Release During an Active Incident

When production is down and the fix is ready but the normal release process takes 45 minutes:

- Define an **emergency release runbook** before the first incident occurs. This is not something to design under pressure.
- The runbook should specify: who can authorize bypassing normal review requirements, what the minimum approval is (e.g., 1 senior engineer verbal approval over video call, documented as a comment on the PR), which automated checks can be deferred post-deploy and which are mandatory.
- Mandatory even in emergencies: artifact integrity check (deploy the thing that was built and tested, not a hotfix built locally on someone's laptop), deployment health check, immediate post-deploy smoke test.
- Deferrable: full integration test suite, non-critical performance benchmarks, manual QA sign-off (replace with post-incident validation).
- After the incident: file a blameless post-mortem that includes a review of whether the emergency process worked correctly. If normal process was bypassed, audit that the bypass was documented and justified.

### Migrating from No Process to Formal Release Management

When a team has been deploying manually from developer laptops or with no version tags, introducing release management incrementally avoids disrupting existing work:

- **Week 1-2:** Introduce Conventional Commits and commitlint in CI without enforcement consequences -- just warnings. Run semantic-release or release-please in `--dry-run` mode so the team can see what would have been released without any side effects.
- **Week 3-4:** Enable automated tagging and GitHub Releases. Do not yet control deployment from tags -- this lets the team get comfortable with the tagging convention before coupling it to production deploys.
- **Week 5-6:** Add branch protection to `main`. Require PRs. Existing direct-push habits will break -- schedule a team session to address friction before enabling this.
- **Week 7-8:** Couple the deployment pipeline to release tags. This is the highest-risk step; validate the deployment automation thoroughly in staging first.
- **Month 3:** Introduce the hotfix procedure with a fire drill -- actually execute a fake hotfix through the process so the team has muscle memory before a real incident occurs.
- Never attempt to retroactively tag historical releases with "correct" semver -- start from a defined point (e.g., tag the current production commit as `v1.0.0`) and move forward.

### Dependency-Driven Release Sequencing in Polyrepo

When releasing a change that spans multiple repositories (e.g., a protocol change requires updating a shared library, then 4 downstream services):

- Create a **release manifest document** that specifies the exact version of each artifact to be deployed, the deployment order, and the validation gate between each step. This is often a simple YAML or Markdown file tracked in a dedicated "releases" repository.
- Version and tag the shared library first. Publish it to the internal package registry. Downstream services update their dependency lock files via an automated PR (Renovate or Dependabot pointed at the internal registry).
- Use **compatibility shims** when a breaking change must be deployed gradually. The shared library ships v2 of the protocol alongside v1 for one release cycle, allowing downstream services to migrate independently before v1 support is removed in a subsequent release.
- Define a **rollback sequence** in the same manifest. If deployment of service C fails, the rollback order may differ from the deployment order depending on the compatibility matrix.
- Track the cross-service release in a single tracking issue or deployment record so the full blast radius and completion status are visible to all stakeholders.

---

## Example

**Input:** "We have a team of 8 engineers split into 2 squads. We ship a SaaS B2B product with a REST API. Some enterprise customers are on a contractual 90-day lag behind our latest release, meaning they stay on older versions we have to patch. We deploy to AWS. We currently have no formal release process -- engineers push to main and deploy manually whenever. We need to set up something real. We use GitHub and Node.js."

---

## Release Management Recommendation: B2B SaaS API with Multi-Version Support

### Context Summary
- Team size: 8 engineers, 2 squads
- Release cadence: Moving from ad-hoc to structured; target weekly scheduled releases
- Deployment target: Multi-tenant SaaS, some customers on 90-day-lag versions (requires long-lived maintenance branches)
- Compliance requirements: None stated, but SOC 2 readiness recommended for B2B
- Repository structure: Assumed polyrepo or monorepo with a single primary API service
- Platform: GitHub, Node.js, AWS

---

### Recommended Strategy: GitHub Flow with Release Branches for Maintenance Versions

**Rationale:**
GitHub Flow (feature branches merging to `main` via PR) provides the simplicity appropriate for a team of 8 moving from no process. The addition of long-lived `release/vN.x` branches handles the 90-day customer lag requirement without the full operational overhead of GitFlow. Since the team is adopting process from scratch, the simpler GitHub Flow base makes the transition more achievable. Two squads can independently merge feature branches without a `develop` integration bottleneck.

**Branching Model:**

| Branch             | Purpose                                       | Lifetime          | Merge Target                       |
|--------------------|-----------------------------------------------|-------------------|------------------------------------|
| `main`             | Always-deployable trunk, latest active release | Permanent         | N/A (merge target for features)    |
| `feature/[name]`   | New feature or bug fix development            | < 5 days ideal    | `main` via PR                      |
| `release/v2.x`     | Maintenance for customers on 90-day lag       | 3--6 months       | Receives cherry-picks from `main`  |
| `release/v3.x`     | Previous stable, nearing EOL                  | Defined sunset     | Receives security patches only     |
| `hotfix/v2.x.y`    | Emergency patch on a maintenance version      | Hours to 2 days   | `release/v2.x` + `main`           |

**Versioning Convention:** Semantic Versioning 2.0.0

- Version source of truth: Git tag on `main` (e.g., `v4.2.1`). The `package.json` version is synchronized by release-please automation.
- Pre-release channels: `v4.3.0-beta.1` → `v4.3.0-rc.1` → `v4.3.0`
- Internal npm dist-tags: `latest` (stable), `beta`, `legacy-v2` (for the maintenance branch artifacts)
- Breaking change signaling: MAJOR bump required; minimum 2 MINOR versions of deprecation notice in release notes before removal

---

### Tooling Configuration

**Automation Tool:** release-please (chosen over semantic-release because release-please opens a human-reviewable PR before tagging, giving the team a checkpoint during the transition period; semantic-release can be adopted later when the team has higher confidence in automated releases)

**Commit Convention:** Conventional Commits 1.0.0 enforced via commitlint in GitHub Actions

```yaml
# .github/workflows/commitlint.yml
name: Lint Commit Messages
on:
  pull_request:
    branches: [main, 'release/**']
jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: wagoid/commitlint-github-action@v5
        with:
          configFile: .commitlintrc.json
```

```json
// .commitlintrc.json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [2, "always", ["feat", "fix", "docs", "chore", "refactor", "perf", "test", "ci", "revert"]],
    "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
    "body-max-line-length": [1, "always", 200]
  }
}
```

**release-please configuration:**

```yaml
# release-please-config.json
{
  "packages": {
    ".": {
      "release-type": "node",
      "changelog-sections": [
        {"type": "feat", "section": "Features"},
        {"type": "fix", "section": "Bug Fixes"},
        {"type": "perf", "section": "Performance Improvements"},
        {"type": "revert", "section": "Reverts"},
        {"type": "docs", "section": "Documentation", "hidden": false},
        {"type": "chore", "section": "Miscellaneous", "hidden": true}
      ],
      "extra-files": ["src/version.js"]
    }
  },
  "bump-minor-pre-major": true
}
```

```yaml
# .github/workflows/release-please.yml
name: Release Please
on:
  push:
    branches: [main]
permissions:
  contents: write
  pull-requests: write
jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/release-please-action@v4
        id: release
        with:
          release-type: node
          token: ${{ secrets.RELEASE_BOT_TOKEN }}
      - name: Publish to npm internal registry
        if: ${{ steps.release.outputs.release_created }}
        run: npm ci && npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - name: Build and push Docker image
        if: ${{ steps.release.outputs.release_created }}
        run: |
          docker build -t myapp:${{ steps.release.outputs.tag_name }} .
          docker tag myapp:${{ steps.release.outputs.tag_name }} 123456789.dkr.ecr.us-east-1.amazonaws.com/myapp:${{ steps.release.outputs.tag_name }}
          docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/myapp:${{ steps.release.outputs.tag_name }}
```

**Branch Protection Rules (GitHub UI or Terraform aws provider configuration):**

```
Protected branches: main, release/**
Required pull request reviews:
  - Required approving reviews: 2
  - Dismiss stale pull request approvals when new commits are pushed: true
  - Require review from Code Owners: true
  - Require approval of the most recent reviewable push: true
Required status checks (must pass before merge):
  - lint
  - test:unit
  - test:integration
  - security:dependency-scan
  - commitlint
Require branches to be up to date before merging: true
Restrict who can push to matching branches: [release-bot, release-manager]
Restrict deletions: true
Block force pushes: true
Tag protection:
  - Pattern: v*
  - Restricted to: [release-bot, release-manager]
```

---

### Release Pipeline Stages

| Stage                  | Tool / Mechanism                         | Success Criteria                                               |
|------------------------|------------------------------------------|----------------------------------------------------------------|
| PR validation          | commitlint, Jest, ESLint, npm audit      | All checks green; 0 high/critical CVEs in npm audit           |
| Release PR review      | release-please PR + 2 human approvers    | Version bump and CHANGELOG reviewed and approved              |
| Artifact build         | GitHub Actions on tag push               | Docker image built, pushed with semver tag and SHA label      |
| Artifact signing       | cosign (keyless via GitHub OIDC)         | Image digest signed and logged to Rekor transparency log      |
| Staging deployment     | AWS ECS task definition update           | Health check endpoint returns 200 within 90 seconds           |
| Integration smoke test | Playwright API tests against staging     | All P0 API endpoints respond correctly with test data         |
| Production deployment  | AWS ECS rolling update                   | < 5% 5xx rate during rollout; health checks pass             |
| Post-deploy validation | Datadog synthetic monitor                | P0 journeys healthy for 10 minutes post-deploy                |
| Release notes publish  | GitHub Release created by release-please | Release notes visible, CHANGELOG.md updated in repo          |

---

### Hotfix Procedure for Maintenance Versions

When enterprise customers on `release/v2.x` need a security patch:

1. Cut `hotfix/v2.3.7` from the `release/v2.x` branch (not from `main`).
2. Apply the fix. Write a test that would have caught the issue.
3. Open a PR targeting `release/v2.x`. Require 1 senior engineer approval (expedited track).
4. Simultaneously open a PR to `main` with the same fix (or confirm the issue does not exist in the current version).
5. After both PRs merge, tag `v2.3.7` on `release/v2.x`. The release pipeline runs automatically.
6. Notify affected enterprise customers via their customer success manager within 2 hours of tag publication.
7. File a root cause analysis ticket in Jira. Complete the RCA document within 5 business days.

---

### Migration Timeline (from current state to target state)

| Week    | Milestone                                                                 | Risk Level |
|---------|---------------------------------------------------------------------------|------------|
| 1--2    | Install commitlint in CI as warnings only. Team practices commit format.   | Low        |
| 3       | Enable release-please in dry-run mode. Review what would have been tagged. | Low        |
| 4       | Enable branch protection on `main`. Require 1 PR review (start with 1).   | Medium     |
| 5       | Enable release-please for real. First automated release tag created.       | Medium     |
| 6       | Increase required reviews to 2. Couple deployment pipeline to tags.        | Medium     |
| 7       | Cut first `release/v1.x` maintenance branch for current enterprise customers.| Low      |
| 8       | Run hotfix fire drill against `release/v1.x`. Document lessons learned.   | Low        |
| 9--10   | Enable cosign artifact signing. Publish SBOM (Software Bill of Materials). | Low        |
| Month 3 | Retrospective: measure cycle time, change failure rate. Set DORA targets. | Low        |

---

### DORA Metrics Baseline and Targets

| Metric                  | Current (estimated) | 90-Day Target | 12-Month Target |
|-------------------------|---------------------|---------------|-----------------|
| Deployment frequency    | Ad-hoc (< monthly) | Weekly        | Multiple/week   |
| Lead time for changes   | Unknown, likely > 1 week | < 3 days | < 1 day       |
| Change failure rate     | Unknown             | < 10%         | < 5%            |
| Mean time to recovery   | Unknown             | < 4 hours     | < 1 hour        |

Begin tracking these metrics immediately using deployment timestamps from GitHub Actions run logs and incident records from your on-call tool (PagerDuty, OpsGenie, or equivalent). Without a baseline, improvement cannot be measured.

---

### CHANGELOG Entry Example (v4.3.0)

```markdown
## [4.3.0] - 2024-03-15

### Breaking Changes
- Removed support for API v1 authentication token format (deprecated since v4.1.0).
  Migration: Use the v2 token format. See docs/auth-migration.md for step-by-step instructions.

### Added
- New `/v2/reports/scheduled` endpoint for asynchronous report generation (#412)
- Rate limit headers now included on all API responses (X-RateLimit-Limit, X-RateLimit-Remaining)

### Changed
- Webhook delivery timeout increased from 10s to 30s to accommodate slow customer endpoints

### Deprecated
- `GET /v2/users/:id/permissions` is deprecated. Use `GET /v2/users/:id/roles` instead.
  Will be removed in v5.0.0.

### Fixed
- Fixed incorrect pagination cursors when filtering by date range and status simultaneously (#398)
- Fixed 500 error when webhook payload exceeded 256KB (now returns 422 with descriptive message)

### Security
- Updated `jsonwebtoken` from 8.5.1 to 9.0.2 to address CVE-2022-23529 (High severity).
  No user action required; fix is server-side.
```
