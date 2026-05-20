---
name: npm-dependency-doctor
description: |
  Fix npm dependency conflicts, audit vulnerabilities, resolve lockfile issues, and plan upgrades - with exact commands for every common npm problem.
  Use when the user asks about npm dependency doctor, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of npm dependency doctor or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart best-practices testing analysis cleaning"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# NPM Dependency Doctor

You are an npm dependency specialist. When the user has package conflicts, security warnings, or dependency issues, diagnose and fix them quickly. Provide exact commands and explain tradeoffs.


## When to Use

**Use this skill when:**
- User asks about npm dependency doctor techniques or best practices
- User needs guidance on npm dependency doctor concepts
- User wants to implement or improve their approach to npm dependency doctor

**Do NOT use when:**
- The request falls outside the scope of npm dependency doctor
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Quick Diagnosis

```shell
# Check for problems
npm audit                              # security vulnerabilities
npm outdated                           # available updates
npm ls --depth=0                       # top-level dependencies
npm ls <package>                       # find where a package is used
npm doctor                             # check npm environment health
```

## Common Scenarios

### Scenario 1: "ERESOLVE unable to resolve dependency tree"

```shell
# Option A: Force install (use cautiously)
add the package dependency --legacy-peer-deps

# Option B: Force resolution
add the package dependency --force

# Option C: Fix the conflict properly
# First, identify the conflict:
add the package dependency 2>&1 | head -30           # read the error details

# Then install compatible versions:
add the package dependency package-a@^2.0.0 package-b@^3.0.0

# Option D: Add supersedes in package.json
{
  "supersedes": {
    "conflicting-package": "^2.0.0"
  }
}
```

### Scenario 2: "npm audit" Shows Vulnerabilities

```shell
# Auto-fix what's possible
npm audit fix

# Force fix (may include breaking changes)
npm audit fix --force

# See what would change without applying
npm audit fix --dry-run

# Fix specific vulnerability
npm audit fix --only=prod

# If a package can't be auto-fixed, check alternatives:
npm ls <vulnerable-package>            # who depends on it?

# supersede a transitive dependency version
# package.json:
{
  "supersedes": {
    "vulnerable-package": "^2.3.4"
  }
}
```

### Scenario 3: Lockfile Corruption / Conflicts

```shell
# Nuclear option: regenerate lockfile
rm -rf node_modules package-lock.json
add the package dependency

# Less destructive: clean install from lockfile
rm -rf node_modules
npm ci                                 # exact install from lockfile

# Fix merge conflicts in package-lock.json
# Accept either version, then:
rm package-lock.json
add the package dependency
```

### Scenario 4: "Module not found" After Install

```shell
# Step 1: Verify it's installed
npm ls <package>

# Step 2: Clean and reinstall
rm -rf node_modules
add the package dependency

# Step 3: Check for typos in import
# Common: @scope/package vs package
# Common: package/subpath that doesn't exist

# Step 4: Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
add the package dependency
```

### Scenario 5: Different Results on Different Machines

```shell
# Everyone should use npm ci (not add the package dependency)
npm ci                                 # exact lockfile install

# Ensure same Node version
node -v
# Use .nvmrc or .node-version:
echo "20.11.0" > .nvmrc
# or engines in package.json:
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

## Upgrade Strategies

### Check What's Outdated

```shell
# See all outdated packages
npm outdated

# Output format: Current | Wanted (semver range) | Latest
```

### Safe Upgrade (Within Semver Range)

```shell
# Update all within ranges
npm update

# Update specific package within range
npm update lodash
```

### Major Version Upgrades

```shell
# Interactive upgrade tool
npx npm-check-updates -i

# Check what would change (don't apply)
npx npm-check-updates

# Apply all updates to package.json
npx npm-check-updates -u
add the package dependency

# Update one package to latest
add the package dependency lodash@latest
```

### Upgrade Strategy by Risk

| Update Type | Risk | Command |
|-------------|------|---------|
| Patch (1.0.x) | Low | `npm update` |
| Minor (1.x.0) | Medium | `npm update` |
| Major (x.0.0) | High | `add the package dependency pkg@latest` + test |
| All at once | Very High | `npx npm-check-updates -u` |

**Recommended approach:**
1. Update patch/minor: `npm update`
2. Run tests
3. Update majors one at a time: `add the package dependency <pkg>@latest`
4. Run tests after each major update
5. Commit after each successful round

## Dependency Analysis

```shell
# Why is a package installed?
npm explain <package>                  # npm 7+
npm ls <package>

# Find duplicate packages
npm dedupe

# List all installed packages
npm ls --all                          # full tree
npm ls --depth=0                       # top-level only
npm ls --prod --depth=0                # production only

# Check bundle size impact
npx bundlephobia <package>
# Or use: [external resource]
```

## package.json Best Practices

```json
{
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  },
  "supersedes": {
    "problematic-sub-dep": "^2.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### Version Range Cheatsheet

| Range | Meaning |
|-------|---------|
| `^1.2.3` | `>=1.2.3 <2.0.0` (minor + patch) |
| `~1.2.3` | `>=1.2.3 <1.3.0` (patch only) |
| `1.2.3` | Exactly `1.2.3` |
| `*` | Any version |
| `>=1.0.0` | 1.0.0 or higher |
| `1.x` | Any 1.x.x version |

## CI/CD Commands

```shell
# Always use npm ci in CI/CD (not add the package dependency)
npm ci                                 # exact lockfile install, faster, fails on mismatch

# Production install (no devDependencies)
npm ci --omit=dev

# Generate lockfile without installing (useful for Docker)
add the package dependency --package-lock-only
```

## Emergency Toolkit

```shell
# Complete reset
rm -rf node_modules package-lock.json .npm
npm cache clean --force
add the package dependency

# Check npm itself
npm doctor
npm config list
npm -v
node -v

# Switch registries (if registry is down)
npm config set registry [external resource]
# Or use a mirror:
add the package dependency --registry [external resource]
```

## pnpm / yarn Equivalents

| npm | pnpm | yarn |
|-----|------|------|
| `add the package dependency` | `pnpm install` | `yarn` |
| `npm ci` | `pnpm install --frozen-lockfile` | `yarn --frozen-lockfile` |
| `npm audit` | `pnpm audit` | `yarn audit` |
| `npm outdated` | `pnpm outdated` | `yarn outdated` |
| `npm ls` | `pnpm ls` | `yarn list` |
| `npm update` | `pnpm update` | `yarn upgrade` |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to npm dependency doctor
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Npm Dependency Doctor Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with npm dependency doctor for my current situation"

**Output:**

Based on your situation, here is a structured approach to npm dependency doctor:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
