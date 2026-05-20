---
name: readme-writer
description: |
  Expert README and project documentation covering README structure template, badges, installation instructions, quick start guide, configuration reference, contributing guide, license selection, architecture overview, and FAQ section.
  Use when the user asks about readme writer, readme writer best practices, or needs guidance on readme writer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation guide"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# README Writer

## Overview

This skill provides comprehensive expertise in creating effective README files and project documentation. A README is the front door of any software project -- it determines whether developers invest time exploring further or move on. This skill covers every section of a professional README, from visual badges through architecture overviews, with templates and best practices that apply across languages and project types.

## README Structure Template

### Recommended Section Order

```
1. Project name + logo (optional)
2. One-line description
3. Badges (build status, version, license, coverage)
4. Key features (bullet list, 4-6 items)
5. Quick start (fewest steps to "hello world")
6. Installation (detailed, all platforms)
7. Usage examples (common scenarios with code)
8. Configuration reference (all options)
9. Architecture overview (for larger projects)
10. API reference (or link to full docs)
11. Contributing guide (or link to CONTRIBUTING.md)
12. FAQ / Troubleshooting
13. License
14. Acknowledgments (optional)
```

### Complete README Template

```markdown
# ProjectName

> One-line description that explains what this project does and why it matters.

[![CI]([reference URL])]([reference URL])
[![npm version]([reference URL])]([reference URL])
[![License: MIT]([reference URL])](LICENSE)
[![codecov]([reference URL])]([reference URL])

Short paragraph (2-3 sentences) expanding on the one-liner. Explain the problem
this project solves and who it is for. Mention what makes it different from
alternatives.

## Features

- **Feature one** - Brief description of what it does
- **Feature two** - Brief description of what it does
- **Feature three** - Brief description of what it does
# ... (condensed) ...

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Library A]([reference URL]) - Used for feature X
- Inspired by [Project B]([reference URL])
```

## Badge Strategy

### Essential Badges

| Badge | Purpose | Service |
|-------|---------|---------|
| Build status | Shows CI passes | GitHub Actions, CircleCI |
| Version | Current release | npm, PyPI, crates.io |
| License | Quick legal check | shields.io |
| Coverage | Code quality signal | Codecov, Coveralls |
| Downloads | Popularity signal | npm, PyPI |

### Badge Syntax

```markdown
<!-- Static badge -->
![Badge]([reference URL])

<!-- Dynamic badges from shields.io -->
[![npm]([reference URL])]([reference URL])
[![Build]([reference URL])]([reference URL])
[![License]([reference URL])](LICENSE)
[![Downloads]([reference URL])]([reference URL])
[![TypeScript]([reference URL])]([reference URL])
[![PRs Welcome]([reference URL])](CONTRIBUTING.md)
```

### Badge Ordering Rules

1. Build/CI status (most important signal)
2. Version/release
3. Test coverage
4. License
5. Downloads/popularity
6. Language/framework version
7. Community badges (PRs welcome, Discord, etc.)

## Installation Instructions

### Writing Effective Install Sections

```
Installation Section Checklist:
├── List ALL prerequisites with minimum versions
├── Provide commands for ALL popular package managers
├── Include platform-specific instructions if needed
│   ├── macOS (Homebrew)
│   ├── Linux (apt, yum, pacman)
│   └── Windows (winget, choco, scoop)
├── Show "from source" instructions for contributors
├── Provide Docker option if applicable
├── Include verification step ("run X to confirm it works")
└── Note any post-install configuration needed
```

### Multi-Platform Install Template

```markdown
## Installation

### macOS

\```shell
brew install project-name
\```

### Linux

> **Security Note:** Piping scripts directly from the internet to a shell (`HTTP client request | shell-cmd`) executes unverified code. Download the script first, inspect it, then execute it.

\```shell
# Debian/Ubuntu
HTTP client request -fsSL [reference URL] | shell-cmd

# Or via apt repository (with proper GPG verification)
HTTP client request -fsSL [reference URL] | sudo gpg --dearmor -o [system-path]
# ... (condensed) ...

### Verify Installation

\```shell
project-name --version
# Expected output: project-name v1.2.3
\```
```

## Quick Start Guide

### Principles

1. **Minimize time to first success**: Fewest possible steps
2. **Copy-pasteable**: Every command should work as-is
3. **Show output**: Include expected output so users know it worked
4. **One happy path**: Do not show options or alternatives here
5. **Under 30 seconds**: If it takes longer, simplify or provide a sandbox

### Quick Start Template

```markdown
## Quick Start

### 1. Install

\```shell
install via npm: -g myproject
\```

### 2. Initialize

\```shell
myproject init my-app
cd my-app
\```

### 3. Run

\```shell
myproject dev
\```

Open [[reference URL]]([reference URL]) to see your app running.

### 4. Make a Change

Edit `src/index.ts` and save. The browser refreshes automatically.
```

## Configuration Reference

### Configuration Documentation Format

```markdown
## Configuration

### Configuration File

ProjectName looks for configuration in the following locations (in order):

1. `--config <path>` CLI argument
2. `project.config.ts` in project root
3. `project.config.js` in project root
4. `project` key in `package.json`

### Options Reference

#### `input` (required)

- **Type:** `string`
- **CLI:** `--input <path>`
- **Env:** `PROJECT_INPUT`
# ... (condensed) ...

export default {
  plugins: [
    pluginA({ option: true }),
  ],
};
\```
```

## Contributing Guide

### CONTRIBUTING.md Template

```markdown
# Contributing to ProjectName

Thank you for your interest in contributing! This guide will help you
get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `add the package dependency`
3. Create a branch: `git checkout -b feature/my-feature`
4. Make your changes
5. Run tests: `npm test`
6. Submit a pull request

## Coding Standards

- Follow the existing code style (enforced by ESLint + Prettier)
- Write tests for new functionality
# ... (condensed) ...
## Requesting Features

Open a feature request issue. Describe:

- The problem you are trying to solve
- Your proposed solution
- Alternative approaches you considered
```

## License Selection

### Decision Guide

```
License Selection Decision Tree:
├── Want maximum adoption?
│   └── MIT License
│       ├── Permits commercial use, modification, distribution
│       ├── Only requires: include license text
│       └── Most popular choice for open source libraries
├── Want copyleft (derivatives must also be open)?
│   ├── Strong copyleft → GPL v3
│   └── Weak copyleft (library) → LGPL v3 or MPL 2.0
├── Want patent protection?
│   └── Apache License 2.0
│       ├── Like MIT but includes patent grant
│       └── Good for projects with patentable innovations
├── Want no restrictions at all?
│   └── The Unlicense or 0BSD
│       └── Public domain equivalent
├── Internal / proprietary?
│   └── No open source license
│       └── Add "All rights reserved" or custom license
└── Unsure?
    └── Default to MIT (safest, most widely understood)
```

## Architecture Overview Section

### Writing Architecture for Different Audiences

```markdown
## Architecture

### High-Level Overview

ProjectName follows a layered architecture with clear separation of concerns:

\```
┌─────────────────────────────────────┐
│          CLI / HTTP API             │  ← Entry points
├─────────────────────────────────────┤
│          Application Layer          │  ← Use cases, orchestration
├─────────────────────────────────────┤
│           Domain Layer              │  ← Business rules, entities
├─────────────────────────────────────┤
│        Infrastructure Layer         │  ← Database, external services
└─────────────────────────────────────┘
\```

# ... (condensed) ...
### Data Flow

1. Request enters via Router
2. Middleware handles auth, validation, logging
3. Service orchestrates business logic
4. Repository reads/writes data
5. Response formatted and returned
```

## FAQ Section

### FAQ Writing Guidelines

1. **Source from real questions**: Use support tickets, GitHub issues, Stack Overflow
2. **Keep answers concise**: 2-4 sentences or a short code snippet
3. **Link to detail docs**: FAQs should point to full documentation
4. **Group by topic**: Use sub-headings for different concern areas
5. **Update regularly**: Add new FAQs monthly based on common questions

```markdown
## FAQ

### General

**Q: What Node.js versions are supported?**
A: Node.js 18.x and above. We test against the current LTS and latest releases.

**Q: Does this work with TypeScript?**
A: Yes. Type definitions are included in the package. No additional `@types/`
package is needed.

### Troubleshooting

**Q: I get `EACCES permission denied` during install.**
A: This usually means npm is trying to write to a directory that requires
elevated permissions. See the
[npm docs on fixing permissions]([reference URL]).

**Q: The build fails with "Cannot find module X".**
A: Run `add the package dependency` to ensure all dependencies are installed. If the error
persists, delete `node_modules` and `package-lock.json`, then run
`add the package dependency` again.
```

## README Quality Checklist

- [ ] Project purpose is clear within 10 seconds of reading
- [ ] One-line description is under 120 characters
- [ ] Badges show build status, version, and license
- [ ] Quick start works in under 5 commands
- [ ] Installation covers all target platforms and package managers
- [ ] Code examples are copy-pasteable and actually work
- [ ] Configuration options are fully documented with defaults
- [ ] Contributing guide exists (inline or linked)
- [ ] License is specified and LICENSE file exists
- [ ] No broken links (run a link checker)
- [ ] No outdated version numbers or screenshots
- [ ] Table of contents for READMEs longer than 300 lines
- [ ] Tested by someone unfamiliar with the project

## When to Use

**Use this skill when:**
- Designing or implementing readme writer solutions
- Reviewing or improving existing readme writer approaches
- Making architectural or implementation decisions about readme writer
- Learning readme writer patterns and best practices
- Troubleshooting readme writer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Readme Writer Analysis

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

**Input:** "Help me implement readme writer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended readme writer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When readme writer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
