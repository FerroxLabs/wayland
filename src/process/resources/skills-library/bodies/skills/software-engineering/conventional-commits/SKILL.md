---
name: conventional-commits
description: |
  Guides expert-level conventional commits implementation: version-control and best-practices decision frameworks, production-ready patterns, and concrete templates for conventional commits workflows.
  Use when the user asks about conventional commits, conventional commits configuration, or version-control best practices for conventional projects.
  Do NOT use when the user needs a different developer tools capability -- check sibling skills in the developer tools subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "version-control best-practices automation"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Conventional Commits

## When to Use

**Use this skill when:**
- User wants to implement the Conventional Commits specification (v1.0.0) in a project from scratch -- including commit message format, tooling setup, and enforcement hooks
- User needs to configure commitlint, commitizen, semantic-release, or standard-version for automated versioning and changelog generation
- User asks how to enforce commit message standards across a team using Git hooks (husky, lefthook, pre-commit) or CI pipeline checks
- User wants to understand how commit types map to semantic version bumps (patch/minor/major) and how breaking changes are expressed
- User is migrating an existing project to Conventional Commits and needs a phased adoption plan with backward-compatible tooling
- User wants to generate CHANGELOGs automatically from commit history or configure release automation pipelines
- User asks about scopes, footers, breaking change notation, multi-scope commits, or revert commit conventions
- User needs to write or review a specific commit message and wants guidance on correct format

**Do NOT use this skill when:**
- User needs help with Git branching strategy (e.g., GitFlow, trunk-based development, release branches) -- use the git-branching-strategy skill instead
- User is asking about pull request or code review workflows -- use the pull-request-workflow skill
- User needs general semantic versioning guidance (SemVer 2.0.0 rules independent of commit messages) -- use the semver skill
- User wants to configure CI/CD pipeline stages unrelated to release automation -- use the cicd-pipeline skill
- User asks about monorepo tooling beyond commit scope conventions (Nx, Turborepo, Lerna configurations) -- use the monorepo-tooling skill
- User wants GitHub Actions or GitLab CI syntax help beyond commit validation -- use the ci-automation skill
- User is asking about Git internals, rebase strategies, or conflict resolution unrelated to commit message standards

---

## Process

### 1. Establish the Conventional Commits Format Foundation

Before configuring any tooling, ensure the user understands the exact specification structure:

- The canonical format is: `<type>[optional scope]: <description>` followed by an optional body and optional footer(s)
- The `<type>` field is mandatory. Standard types: `feat` (new feature), `fix` (bug fix), `docs` (documentation only), `style` (formatting, no logic change), `refactor` (neither fix nor feat), `perf` (performance improvement), `test` (adding or correcting tests), `build` (build system or external dependency changes), `ci` (CI configuration), `chore` (maintenance tasks not covered above), `revert` (reverting a previous commit)
- The `<scope>` is optional and parenthesized: `feat(auth): add OAuth2 provider support`. Scope should name the module, package, or domain area affected -- not a file name
- The `<description>` must be in the imperative mood, present tense, lowercase, no trailing period: "add" not "adds" or "added"
- The body is separated from the description by one blank line. Use it to explain the motivation for the change, what changed, and why -- not how (the code shows how)
- Footers are token-value pairs separated by `: ` or ` #`. Footer `BREAKING CHANGE: <description>` triggers a major version bump regardless of commit type
- The `!` shorthand after type/scope (e.g., `feat!: redesign API`) also signals a breaking change and must be accompanied by a `BREAKING CHANGE` footer for full compliance
- Revert commits must have the form `revert: <original header>` with a body containing `Refs: <sha>` for tooling to recognize them correctly

### 2. Map Commit Types to SemVer Outcomes

Understanding the version bump rules is essential for configuring automated release tools correctly:

- `fix:` commits trigger a **PATCH** bump (0.0.X) -- they indicate backward-compatible bug fixes
- `feat:` commits trigger a **MINOR** bump (0.X.0) -- they indicate new backward-compatible functionality
- Any commit with `BREAKING CHANGE:` in the footer or `!` after the type triggers a **MAJOR** bump (X.0.0) -- regardless of whether the type is `fix`, `feat`, or anything else
- `docs:`, `style:`, `test:`, `chore:`, `ci:`, `refactor:`, `perf:`, `build:` by default do **NOT** trigger a version bump in most release tools unless explicitly configured to do so
- `perf:` is treated as a PATCH bump in semantic-release's default configuration because performance fixes are considered equivalent to bug fixes
- If no triggering commit is present since the last tag, no release is created -- this is intentional and prevents spurious version bumps from housekeeping commits
- In pre-release mode (version 0.x.x), some tools treat all changes as non-breaking because the API is considered unstable -- be explicit about this behavior with the user

### 3. Choose and Configure the Right Toolchain

Select tools based on the project's runtime, CI environment, and team size:

**Commit Message Linting:**
- `commitlint` (Node.js) with `@commitlint/config-conventional` is the de facto standard. Install with: `npm install --save-dev @commitlint/cli @commitlint/config-conventional`
- Create `commitlint.config.js` or `.commitlintrc.json` at repo root. The minimal config is: `module.exports = { extends: ['@commitlint/config-conventional'] }`
- For Python projects, `commitizen` (Python package, not the Node one) or `pre-commit` hooks with a shell script work well
- `gitlint` is a Python-native alternative that supports `.gitlint` config files

**Interactive Commit Authoring:**
- `commitizen` (Node.js, `cz-cli`) provides an interactive CLI prompt: `npm install --save-dev commitizen` then `npx commitizen init cz-conventional-changelog --save-dev --save-exact`
- After setup, `git cz` or `npx cz` replaces `git commit` with a guided wizard
- `cz-customizable` adapter allows custom types, scopes, and validation beyond the conventional defaults

**Git Hook Management:**
- `husky` v8+ (Node.js) integrates commitlint into the `commit-msg` hook: add `"prepare": "husky install"` to package.json scripts, then `npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'`
- `lefthook` (Go binary, language-agnostic) is an alternative that works without Node.js in the project: configure via `lefthook.yml`
- For CI enforcement independent of local hooks (hooks can be bypassed with `--no-verify`), run `commitlint --from=HEAD~1 --to=HEAD` or lint the PR title/all commits in a PR range

**Automated Release and Changelog:**
- `semantic-release` is the most powerful option for full automation: reads commit history since the last tag, determines version bump, writes CHANGELOG, creates Git tag, publishes to registries. Requires CI token with push rights
- `standard-version` is a lighter-weight local alternative (deprecated but still widely used): run manually with `npx standard-version`. It bumps package.json version, writes CHANGELOG.md, commits the change, and creates a tag
- `release-please` (Google) integrates with GitHub/GitLab as a bot that opens a release PR when unreleased commits accumulate -- good for teams that want a human review step before releasing
- `changie` is a Go-based tool that uses YAML change fragments to build changelogs -- useful when commits are not granular enough for meaningful changelogs

### 4. Configure commitlint Rules in Detail

The default `@commitlint/config-conventional` is a good start but most projects need customization:

- **Enforce an allowed scope list** to prevent typos and divergent conventions: `'scope-enum': [2, 'always', ['auth', 'api', 'ui', 'db', 'infra', 'ci']]`. Level `2` means error (blocks commit), `1` means warning
- **Set subject case**: `'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']]` enforces lowercase start
- **Limit subject length**: `'header-max-length': [2, 'always', 72]` -- 72 characters is the Git convention for terminal readability
- **Require body for breaking changes**: Not a built-in rule -- implement via a custom plugin or CI script that checks for `BREAKING CHANGE` footer whenever `!` is present in the header
- **Allow empty scopes**: Default behavior -- if scopes are required, add `'scope-empty': [2, 'never']`
- **Custom types**: Override `'type-enum'` to add types like `security`, `deps`, or `i18n` that your team uses: `'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert', 'security', 'deps']]`
- Commitlint supports extending multiple configs and merging rules -- use `extends: ['@commitlint/config-conventional']` as the base, then override specific rules

### 5. Set Up CI Enforcement (Beyond Local Hooks)

Local hooks are bypassed with `--no-verify` and don't run in most CI environments. Always add server-side validation:

- **GitHub Actions**: Create `.github/workflows/commitlint.yml`. The key step uses `commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose` to lint all commits in a PR range. Use `actions/checkout@v4` with `fetch-depth: 0` to ensure full history is available
- **GitLab CI**: Use a `before_script` or dedicated `lint:commits` job with `git log origin/${CI_MERGE_REQUEST_TARGET_BRANCH_NAME}..HEAD --pretty=format:'%s' | npx commitlint`
- **PR title enforcement**: For squash-merge workflows, the PR title becomes the commit message. Enforce the PR title format using GitHub's `pull-request-target` event with a title-checking action -- the individual commit messages matter less than the squash title
- **Branch protection**: Require the commit-lint CI check to pass before merging. This is the only way to guarantee compliance in a team setting
- **Pre-receive hooks on self-hosted Git**: For Bitbucket Server or Gitea, implement a pre-receive hook script that runs commitlint on every pushed commit ref

### 6. Configure Automated Changelog and Release

Set up the release automation pipeline based on the chosen tool:

**For semantic-release:**
- Create `.releaserc.json` at repo root. Minimal config: `{ "branches": ["main"], "plugins": ["@semantic-release/commit-analyzer", "@semantic-release/release-notes-generator", "@semantic-release/changelog", "@semantic-release/npm", "@semantic-release/git", "@semantic-release/github"] }`
- Install all plugins: `npm install --save-dev semantic-release @semantic-release/changelog @semantic-release/git`
- The `@semantic-release/commit-analyzer` plugin maps commit types to version bumps. Override with `releaseRules` to make `refactor:` trigger a patch: `{ "type": "refactor", "release": "patch" }`
- The `@semantic-release/git` plugin commits the updated `CHANGELOG.md` and `package.json` back to the branch with message `chore(release): ${nextRelease.version} [skip ci]` -- the `[skip ci]` is critical to prevent infinite pipeline loops
- For monorepos, use `semantic-release` with the `--extends` flag per package, or use `multi-semantic-release` for workspace-aware releases

**For release-please:**
- Add `.github/workflows/release-please.yml` using `googleapis/release-please-action@v4`
- Configure `release-please-config.json` and `.release-please-manifest.json` at repo root
- Release Please groups commits since the last release into a draft PR with a pre-computed CHANGELOG. Merging the PR triggers the actual release
- Supports `release-type: node`, `python`, `go`, `java`, and others with language-specific version file handling

**CHANGELOG format:** By default, `@semantic-release/release-notes-generator` uses Angular changelog format with sections: "Bug Fixes", "Features", "Performance Improvements", "Reverts", and "BREAKING CHANGES". Customize section headers via the `writerOpts` configuration

### 7. Handle Monorepo and Multi-Package Scopes

Monorepos require extra conventions to make commit scopes meaningful and release tools functional:

- Mandate that the scope matches the package name or workspace directory: `feat(payment-service): add Stripe webhook handler` where `payment-service` is a directory under `packages/`
- Use `nx affected` or `turbo` with commit range detection to run tests/builds only for affected packages -- this depends on scope accuracy in commit messages
- For `semantic-release` in monorepos, use `multi-semantic-release` or configure per-package `.releaserc` files with a `tagFormat` of `package-name-v${version}` to create namespaced tags
- `release-please` has first-class monorepo support via the `packages` key in `release-please-config.json`, which maps each package path to a release configuration
- If a single commit affects multiple packages (e.g., a shared utility change), prefer separate commits per package or use the primary affected package as scope and note secondary effects in the body
- Enforce scope-to-package mapping with a custom commitlint plugin that reads the workspace manifest to dynamically validate allowed scopes

### 8. Document Team Conventions in a CONTRIBUTING.md

No tooling substitutes for clear human documentation:

- Write a `CONTRIBUTING.md` section titled "Commit Message Guidelines" with: the full format, an allowed types table, an allowed scopes table (if enforced), 5-6 good/bad examples, and FAQ for common edge cases
- Include examples for: multi-paragraph body, breaking change footer, co-authored commits, revert commits, and commits with multiple footers
- Document the team's squash-vs-merge policy: if you squash PRs, only the PR title follows Conventional Commits; if you merge with all commits, every commit must comply
- Explain that `git commit --amend` and interactive rebase (`git rebase -i`) are acceptable ways to fix commit messages before pushing
- Provide the `git cz` command as the recommended way to author commits if commitizen is configured
- Include a "debugging the commit-msg hook" section explaining common failures: Node not in PATH, husky not installed after `npm install`, `--no-verify` bypass procedure for emergencies

---

## Output Format

When helping a user set up Conventional Commits, produce a structured implementation plan using this format:

```markdown
## Conventional Commits Implementation Plan

### Project Profile
| Attribute          | Value                              |
|--------------------|------------------------------------|
| Runtime/Language   | [e.g., Node.js 20, Python 3.11]    |
| Package Manager    | [npm / yarn / pnpm / pip / go mod] |
| Repo Structure     | [single-package / monorepo]        |
| CI Platform        | [GitHub Actions / GitLab CI / etc] |
| Merge Strategy     | [squash / merge commit / rebase]   |
| Release Target     | [npm / PyPI / Docker / internal]   |
| Automation Level   | [manual / semi-auto / full-auto]   |

---

### Commit Message Format Reference

**Structure:**
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

**Type → SemVer Mapping:**
| Type       | Version Bump | Included in CHANGELOG |
|------------|-------------|----------------------|
| feat       | MINOR       | Yes                  |
| fix        | PATCH       | Yes                  |
| perf       | PATCH       | Yes                  |
| revert     | PATCH       | Yes                  |
| docs       | none        | No (default)         |
| style      | none        | No                   |
| refactor   | none        | No (default)         |
| test       | none        | No                   |
| build      | none        | No                   |
| ci         | none        | No                   |
| chore      | none        | No                   |
| BREAKING CHANGE (footer) | MAJOR | Yes          |
| ! suffix   | MAJOR       | Yes                  |

**Allowed Scopes:** [list scopes specific to this project]

---

### Toolchain Configuration

#### commitlint.config.js
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'build', 'ci', 'chore', 'revert'
    ]],
    'scope-enum': [2, 'always', [/* project-specific scopes */]],
    'scope-empty': [1, 'never'],          // warn if scope missing
    'subject-case': [2, 'never', ['sentence-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    'footer-max-line-length': [2, 'always', 100],
  }
};
```

#### .husky/commit-msg
```sh
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx --no -- commitlint --edit "$1"
```

#### package.json scripts
```json
{
  "scripts": {
    "prepare": "husky install",
    "commit": "cz",
    "release": "semantic-release"
  }
}
```

#### CI Commit Lint Workflow (GitHub Actions)
```yaml
name: Lint Commits
on:
  pull_request:
    types: [opened, synchronize, reopened, edited]
jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose
```

---

### Release Configuration

#### .releaserc.json (semantic-release)
```json
{
  "branches": ["main"],
  "plugins": [
    ["@semantic-release/commit-analyzer", {
      "releaseRules": [
        { "type": "refactor", "release": "patch" },
        { "type": "docs", "scope": "README", "release": "patch" }
      ]
    }],
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", {
      "changelogFile": "CHANGELOG.md"
    }],
    "@semantic-release/npm",
    ["@semantic-release/git", {
      "assets": ["CHANGELOG.md", "package.json", "package-lock.json"],
      "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
    }],
    "@semantic-release/github"
  ]
}
```

---

### Good Commit Examples

```
feat(auth): add OAuth2 PKCE flow for mobile clients

Implements RFC 7636 proof key for code exchange to support
public clients that cannot securely store a client secret.
Affects the /oauth/authorize and /oauth/token endpoints.

Closes #142
```

```
fix(api): handle null response from payment gateway

The Stripe SDK returns null for declined cards in sandbox mode.
Previous code assumed a non-null response object, causing a
TypeError on the /checkout endpoint.

Fixes #389
```

```
feat(api)!: rename /users endpoint to /accounts

BREAKING CHANGE: The /users REST endpoint has been renamed to
/accounts across all API versions. Clients must update their
base URLs. Migration guide available in docs/migration/v4.md.
```

---

### Installation Commands
```bash
# Core tooling
npm install --save-dev \
  @commitlint/cli \
  @commitlint/config-conventional \
  commitizen \
  cz-conventional-changelog \
  husky

# Release automation
npm install --save-dev \
  semantic-release \
  @semantic-release/changelog \
  @semantic-release/git \
  @semantic-release/github

# Initialize
npx commitizen init cz-conventional-changelog --save-dev --save-exact
npx husky install
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```
```

---

## Rules

1. **NEVER allow the `!` breaking change shorthand without also requiring a `BREAKING CHANGE:` footer.** The `!` is a visual hint for humans but many tools (including older versions of semantic-release) only detect the footer. Require both for maximum compatibility.

2. **NEVER lint only the HEAD commit in CI.** Feature branches accumulate commits over time. Always lint the full range from the base branch SHA to the head SHA -- use `--from $BASE_SHA --to $HEAD_SHA`. Linting only HEAD misses all intermediate commits.

3. **ALWAYS use `fetch-depth: 0` in CI checkout steps.** Without full history, `git log` and `commitlint --from` cannot resolve ancestor SHAs and will fail silently or throw errors about missing refs.

4. **NEVER configure release tools to run on every push to a feature branch.** Release automation must only run on protected branches (typically `main`, `master`, or named release branches). Running semantic-release on feature branches will create spurious tags and publish pre-release versions unexpectedly.

5. **ALWAYS include `[skip ci]` in the release commit message.** The automated commit that bumps version files and writes CHANGELOG.md must not trigger another CI run. Omitting `[skip ci]` (or the CI platform's equivalent) creates an infinite pipeline loop.

6. **NEVER enforce scope as required globally without documenting the exact allowed scope list.** If `scope-empty` is set to error level, every developer must know the allowed values. Undocumented scope enforcement causes constant commitlint failures and forces `--no-verify` bypasses.

7. **ALWAYS configure the `commit-msg` hook to receive the message file path (`$1`), not pipe stdin.** Commitlint requires the file path argument: `commitlint --edit "$1"`. Piping `git log -1 --pretty=%B | commitlint` will not work for pre-commit hooks and bypasses the actual staged message file.

8. **NEVER use generic scopes like `misc`, `various`, `other`, or `general`.** These defeat the purpose of scopes entirely. If a commit affects too many areas to name a scope, it should be split into multiple commits. If it truly cannot be scoped, omit the scope rather than use a meaningless value.

9. **ALWAYS configure commitlint's `body-max-line-length` rule.** Without this, automated changelog generators can produce malformatted entries from commits with very long unbroken body text. 100 characters per line is the recommended maximum.

10. **NEVER rely solely on local Git hooks for enforcement in a team setting.** Any developer can bypass hooks with `--no-verify`, and hooks are not installed automatically when someone clones the repo (unless `npm install` triggers `prepare`). CI-side linting is the authoritative enforcement layer -- local hooks are a developer convenience, not a security control.

---

## Edge Cases

### Squash-Merge Workflows
When the team uses GitHub's "Squash and Merge" strategy, individual commit messages within a PR are discarded. Only the squash commit message (defaulting to the PR title) ends up in the main branch history. In this case:
- Enforce Conventional Commits format on the **PR title**, not individual commits
- Use a GitHub Action with `pull_request.types: [opened, edited, synchronize]` that reads `github.event.pull_request.title` and validates it with commitlint
- Individual commit messages within the PR can follow any convention -- they exist only for the developer's own history before merging
- Configure semantic-release's `@semantic-release/commit-analyzer` to read the squash commit message, which it does automatically
- Document this clearly: engineers often spend time crafting individual commit messages that will be discarded

### Monorepo with Independent Package Versioning
When a monorepo contains packages with independent version lifecycles (e.g., a CLI tool at v3.x and a UI library at v1.x):
- Require that every commit scope matches exactly one package name: `feat(cli): ...` or `fix(ui-lib): ...`
- Use `multi-semantic-release` or `release-please` with per-package configuration to generate independent tags (e.g., `cli-v3.2.0`, `ui-lib-v1.4.1`)
- A single commit that modifies shared infrastructure (e.g., a shared TypeScript config) should use a scope like `(root)` or `(workspace)` and manually trigger releases for affected packages via workflow dispatch if needed
- Enforce scope-to-package mapping with a custom commitlint plugin that reads `package.json` workspaces or a `.commitlintscopes` file listing valid package names
- Avoid `perf:` or `refactor:` commits that span many packages -- they make the version bump logic ambiguous

### Introducing Conventional Commits to an Existing Repository
When a repository has years of unstructured commit history and the team wants to adopt Conventional Commits:
- Do NOT rewrite history. Never `git rebase` or `git filter-branch` an existing shared branch to retroactively format old commits -- this destroys collaboration integrity
- Set the adoption start date as a Git tag: `git tag conventional-commits-start` at the current HEAD, and configure semantic-release with `"tagFormat": "v${version}"` starting from the next release tag
- Enable commitlint enforcement on new commits only -- old history is irrelevant to the linter
- For the first CHANGELOG.md, write a hand-crafted entry summarizing changes before the adoption point rather than generating from history
- Expect a 2-4 week adjustment period. Set commitlint rules to `warn` (level `1`) for the first two weeks, then escalate to `error` (level `2`) after the team has practiced

### Pre-release Versions and Release Channels
For projects that publish alpha, beta, or release-candidate versions:
- Configure semantic-release branches as: `{ "name": "alpha", "prerelease": true }` and `{ "name": "beta", "prerelease": true }` alongside the stable `"main"` branch
- Pre-release versions are published as `1.2.0-alpha.1`, `1.2.0-beta.3`, etc. -- the prerelease identifier comes from the branch name
- `BREAKING CHANGE` on a pre-release branch does NOT increment the major version -- it increments the pre-release counter (e.g., `1.2.0-alpha.1` becomes `1.2.0-alpha.2`)
- The major version only bumps when the pre-release branch is merged into `main` and a release is cut there
- Commits on pre-release branches that are later squashed into `main` via a merge commit will be re-analyzed -- ensure the merge commit itself follows Conventional Commits format

### Python and Non-Node.js Projects
For projects where Node.js is not part of the technology stack:
- `commitlint` still works if Node.js is available even in a Python project -- add it to `devDependencies` or install it via `npx` in CI without adding it to the project's dependency manifest
- `pre-commit` (the Python tool) with a custom hook using `commitlint` or a shell script is a clean integration: define a `commit-msg` stage in `.pre-commit-config.yaml`
- `gitlint` is a pure Python commitlint alternative. Install via pip and configure with `.gitlint`. It supports custom rules written in Python and works well for Python-native teams
- For Go projects, `commitsar` is a Go binary that validates commits against Conventional Commits with no Node.js dependency -- ideal for Go modules where adding a `package.json` is undesirable
- For version bumping without npm, `semantic-release` with `--no-ci` flag and Docker-based execution works, or use `release-please` which runs as a GitHub Action without local tooling

### Handling Revert Commits
Revert commits have special rules that most teams overlook:
- The correct format is `revert: feat(auth): add OAuth2 PKCE flow` -- the description is the full header of the reverted commit
- The body MUST contain `Refs: <sha-of-reverted-commit>` for semantic-release and other tools to detect the revert and cancel out the version bump of the reverted commit
- If a `feat:` commit is reverted within the same release cycle (before the next version tag), semantic-release will detect the pair and not increment the minor version
- If the revert crosses a release boundary (the original feat was in a previous release), it is treated as a `fix:` and triggers a PATCH bump
- `git revert <sha>` generates a revert message that does NOT follow Conventional Commits format by default. Always edit the auto-generated message to match the specification

### Repository Without an Existing package.json (Non-npm Projects)
When commitlint is needed in a repo that has no `package.json` (a pure Go service, Terraform modules, Helm charts):
- Create a minimal `package.json` with only devDependencies for linting tools -- this does not make the project an npm package
- Alternatively, use a Docker-based commitlint in CI: `docker run --rm -v $(pwd):/app -w /app node:20-alpine sh -c "npm install -g @commitlint/cli @commitlint/config-conventional && commitlint --from HEAD~5"`
- `lefthook` is the cleanest option for polyglot repos -- it installs as a single binary, is configured in `lefthook.yml`, and does not require Node.js. Configure the `commit-msg` hook to call a shell script that invokes commitlint if Node is available, or implement the regex check directly in shell

---

## Example

**Input:** "We have a Node.js REST API project with 5 developers, a monorepo with two packages (`api-server` and `sdk-client`), deploying to npm for the SDK and to Docker Hub for the API. We use GitHub and GitHub Actions, with a squash-merge PR strategy. We want full release automation with separate versions for each package. How do we implement Conventional Commits end to end?"

---

**Output:**

## Conventional Commits Implementation Plan

### Project Profile
| Attribute        | Value                                     |
|------------------|-------------------------------------------|
| Runtime/Language | Node.js 20, TypeScript                    |
| Package Manager  | npm workspaces                            |
| Repo Structure   | Monorepo -- `packages/api-server`, `packages/sdk-client` |
| CI Platform      | GitHub Actions                            |
| Merge Strategy   | Squash merge (PR title = commit message)  |
| Release Targets  | `sdk-client` -- npm; `api-server` -- Docker Hub |
| Automation Level | Full auto via release-please              |

---

### Commit Message Format Reference

**Structure:**
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Type → SemVer Mapping:**
| Type       | Version Bump | Included in CHANGELOG |
|------------|-------------|----------------------|
| feat       | MINOR       | Yes                  |
| fix        | PATCH       | Yes                  |
| perf       | PATCH       | Yes                  |
| revert     | PATCH       | Yes                  |
| docs       | none        | No (default)         |
| style      | none        | No                   |
| refactor   | none        | No                   |
| test       | none        | No                   |
| build      | none        | No                   |
| ci         | none        | No                   |
| chore      | none        | No                   |
| BREAKING CHANGE (footer) | MAJOR | Yes          |
| ! suffix   | MAJOR       | Yes                  |

**Allowed Scopes for this repo:**
- `api-server` -- changes to the REST API package
- `sdk-client` -- changes to the SDK package
- `workspace` -- changes to root-level config (tsconfig, eslint, husky, etc.)
- `ci` -- changes to GitHub Actions workflows (also usable as type; use scope for clarity)
- `deps` -- dependency updates affecting a specific package (pair with package scope: `chore(sdk-client/deps)`)

---

### Squash-Merge PR Title Enforcement

Because the team uses squash merges, the PR title becomes the commit on `main`. Enforce the PR title directly:

**.github/workflows/pr-title-lint.yml:**
```yaml
name: Lint PR Title
on:
  pull_request:
    types: [opened, edited, synchronize, reopened]

jobs:
  lint-pr-title:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Validate PR title
        run: echo "${{ github.event.pull_request.title }}" | npx commitlint --verbose
```

Individual commit messages within the PR branch are developer convenience only -- they are not enforced and do not reach `main`. Document this in CONTRIBUTING.md to prevent confusion.

---

### commitlint Configuration

**commitlint.config.js (repo root):**
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'build', 'ci', 'chore', 'revert', 'deps'
    ]],
    'scope-enum': [2, 'always', [
      'api-server', 'sdk-client', 'workspace', 'ci',
      'api-server/deps', 'sdk-client/deps'
    ]],
    'scope-empty': [2, 'never'],           // scope is required for this monorepo
    'subject-case': [2, 'never', ['sentence-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    'footer-max-line-length': [2, 'always', 100],
  }
};
```

**package.json (repo root):**
```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "prepare": "husky install",
    "commit": "cz"
  },
  "devDependencies": {
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0",
    "commitizen": "^4.3.0",
    "cz-conventional-changelog": "^3.3.0",
    "husky": "^9.0.0"
  },
  "config": {
    "commitizen": {
      "path": "./node_modules/cz-conventional-changelog"
    }
  }
}
```

**.husky/commit-msg:**
```sh
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx --no -- commitlint --edit "$1"
```

**Initialization commands:**
```bash
npm install
npx husky install
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
chmod +x .husky/commit-msg
```

---

### Release Automation with release-please

`release-please` is chosen over `semantic-release` here because:
- It produces a review PR before publishing, giving the team a human checkpoint before npm publish
- It has first-class monorepo support with per-package versioning
- It does not require the CI runner to have npm publish credentials during analysis -- only during the final release merge

**.github/workflows/release-please.yml:**
```yaml
name: Release Please
on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json

      # Only publish sdk-client to npm if its release PR was merged
      - uses: actions/checkout@v4
        if: ${{ steps.release.outputs['packages/sdk-client--release_created'] }}
      - uses: actions/setup-node@v4
        if: ${{ steps.release.outputs['packages/sdk-client--release_created'] }}
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: cd packages/sdk-client && npm ci && npm publish
        if: ${{ steps.release.outputs['packages/sdk-client--release_created'] }}
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      # Only build and push Docker image if api-server release was created
      - name: Build and push Docker image
        if: ${{ steps.release.outputs['packages/api-server--release_created'] }}
        uses: docker/build-push-action@v5
        with:
          context: packages/api-server
          push: true
          tags: |
            myorg/api-server:${{ steps.release.outputs['packages/api-server--version'] }}
            myorg/api-server:latest
```

**release-please-config.json:**
```json
{
  "packages": {
    "packages/api-server": {
      "release-type": "node",
      "changelog-path": "CHANGELOG.md",
      "tag-name-template": "api-server-v${version}",
      "bump-minor-pre-major": false,
      "draft": false
    },
    "packages/sdk-client": {
      "release-type": "node",
      "changelog-path": "CHANGELOG.md",
      "tag-name-template": "sdk-client-v${version}",
      "bump-minor-pre-major": true
    }
  },
  "bootstrap-sha": "abc1234"
}
```

**.release-please-manifest.json (initial state):**
```json
{
  "packages/api-server": "2.4.1",
  "packages/sdk-client": "0.8.3"
}
```

The `bootstrap-sha` is the SHA of the last commit before adoption -- release-please only analyzes commits after this point.

---

### Good PR Title Examples for This Project

```
feat(sdk-client): add TypeScript generics to request builder
```
- Triggers: sdk-client MINOR bump (0.8.3 -> 0.9.0)

```
fix(api-server): prevent race condition in session token refresh
```
- Triggers: api-server PATCH bump (2.4.1 -> 2.4.2)

```
feat(api-server)!: remove v1 REST endpoints

BREAKING CHANGE: All /v1/* endpoints have been removed.
Consumers must migrate to /v2/* equivalents as documented
in docs/migration/v1-to-v2.md. A compatibility shim is
available for the next 90 days at /v1-compat/*.
```
- Triggers: api-server MAJOR bump (2.4.1 -> 3.0.0)

```
chore(sdk-client/deps): update axios from 1.6.2 to 1.7.0
```
- Triggers: no version bump -- dependency housekeeping

```
feat(workspace): add shared ESLint config for monorepo
```
- Triggers: no version bump for either package -- workspace-level tooling change

---

### Developer Workflow Summary

```
1. Create feature branch:    git checkout -b feature/add-webhook-support
2. Make changes, then commit with wizard:
                             npm run commit
                             (select type: feat, scope: api-server,
                              description: add webhook delivery retry mechanism)
3. Open PR with title:       feat(api-server): add webhook delivery retry mechanism
4. CI validates PR title via commitlint -- must pass before merge allowed
5. Team reviews and approves PR
6. Squash merge to main      (PR title becomes the commit message on main)
7. release-please runs       (analyzes new commit, updates draft release PR)
8. When ready to release:    Merge the release-please PR
9. Post-merge:               sdk-client publishes to npm, api-server image pushes to Docker Hub
```

---

### CONTRIBUTING.md Snippet

````markdown
## Commit Message Guidelines

This repo uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
Because we squash-merge PRs, **your PR title** must follow the convention.
Individual commits within your branch are not enforced.

### Format
```
<type>(<scope>): <description>
```

### Required Scopes
- `api-server` -- REST API changes
- `sdk-client` -- SDK library changes
- `workspace` -- Root-level tooling (eslint, tsconfig, husky)
- `ci` -- GitHub Actions workflow changes
- `api-server/deps` or `sdk-client/deps` -- Dependency updates

### Version Impact
- `feat(sdk-client): ...` -- bumps sdk-client minor version
- `fix(api-server): ...` -- bumps api-server patch version
- `feat(api-server)!: ...` with `BREAKING CHANGE:` footer -- bumps api-server major version
- `chore`, `docs`, `test`, `ci`, `style` -- no version bump

### Examples
```
feat(sdk-client): add batch request support
fix(api-server): handle empty request body in POST /orders
chore(workspace): update TypeScript to 5.4.0
feat(api-server)!: require authentication on all endpoints

BREAKING CHANGE: Previously, GET /health was unauthenticated.
All endpoints now require a Bearer token. See docs/auth.md.
```
````
