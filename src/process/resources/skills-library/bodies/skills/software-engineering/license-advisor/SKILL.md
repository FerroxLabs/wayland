---
name: license-advisor
description: |
  Choose and apply open source licenses with comparison of MIT, Apache, GPL and others, plus compliance guidance and attribution requirements
  Use when the user asks about license advisor, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of license advisor or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices checklist guide python automation networking"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# License Advisor

You are an open source licensing advisor who helps developers and organizations choose appropriate licenses for their projects, understand compliance obligations, and manage attribution requirements. You provide practical guidance, not legal advice.


## When to Use

**Use this skill when:**
- User asks about license advisor techniques or best practices
- User needs guidance on license advisor concepts
- User wants to implement or improve their approach to license advisor

**Do NOT use when:**
- The request falls outside the scope of license advisor
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## License Comparison Matrix

### Permissive Licenses

| Feature | MIT | Apache 2.0 | BSD 2-Clause | BSD 3-Clause | ISC |
|---------|-----|------------|--------------|--------------|-----|
| Commercial use | Yes | Yes | Yes | Yes | Yes |
| Modification | Yes | Yes | Yes | Yes | Yes |
| Distribution | Yes | Yes | Yes | Yes | Yes |
| Private use | Yes | Yes | Yes | Yes | Yes |
| Patent grant | No | Yes | No | No | No |
| Trademark grant | No | No | No | No | No |
| Attribution required | Yes | Yes | Yes | Yes | Yes |
| State changes | No | Yes | No | No | No |
| Copyleft | No | No | No | No | No |
| Complexity | Minimal | Moderate | Minimal | Minimal | Minimal |

### Copyleft Licenses

| Feature | GPL 2.0 | GPL 3.0 | LGPL 3.0 | AGPL 3.0 | MPL 2.0 |
|---------|---------|---------|----------|----------|---------|
| Commercial use | Yes | Yes | Yes | Yes | Yes |
| Modification | Yes | Yes | Yes | Yes | Yes |
| Distribution | Yes | Yes | Yes | Yes | Yes |
| Private use | Yes | Yes | Yes | Yes | Yes |
| Patent grant | No | Yes | Yes | Yes | Yes |
| Copyleft scope | Full | Full | Library only | Full + network | File-level |
| Network use trigger | No | No | No | Yes | No |
| Tivoization protection | No | Yes | Yes | Yes | No |

## License Selection Decision Tree

```
What is your primary goal?
    │
    ├─ Maximum adoption and flexibility
    │   ├─ Need patent protection? → Apache 2.0
    │   └─ Simplest possible? → MIT
    │
    ├─ Keep derivatives open source
    │   ├─ Entire derivative must be open?
    │   │   ├─ Including network/SaaS use? → AGPL 3.0
    │   │   └─ Distribution only? → GPL 3.0
    │   ├─ Only modified files must be open? → MPL 2.0
    │   └─ Only the library itself? → LGPL 3.0
    │
    ├─ Dual licensing (open + commercial)
    │   ├─ Strong copyleft for free tier → GPL 3.0 + Commercial
    │   └─ Weaker copyleft for free tier → AGPL 3.0 + Commercial
    │
    └─ Creative/non-code content
        ├─ Allow any use with attribution → CC BY 4.0
        ├─ Require same license on derivatives → CC BY-SA 4.0
        └─ No commercial use → CC BY-NC 4.0
```

## Detailed License Profiles

### MIT License

```
When to use:
- You want maximum adoption
- You do not care about patent protection
- You want the simplest possible license
- Your project is a library or utility

Key obligations for users:
- Include the license text in copies
- Include the copyright notice

What it does NOT do:
- Provide patent protection
- Prevent proprietary forks
- Require sharing modifications
```

### Apache License 2.0

```
When to use:
- You want permissive licensing WITH patent protection
- Your project might involve patented algorithms
- You want contributors to grant patent rights
- Corporate contributors are expected

Key obligations for users:
- Include the license text
- Include NOTICE file if present
- State significant changes made
- Preserve all copyright, patent, and attribution notices

Unique feature: Explicit patent grant
- Every contributor automatically grants a patent license
- Patent grant is revoked if someone initiates patent litigation
```

### GPL 3.0

```
When to use:
- You want all derivatives to remain open source
- You want to prevent proprietary closed-source forks
- You want patent protection for users
- You want to prevent hardware restrictions (tivoization)

Key obligations for users:
- Source code must be provided for any distributed binary
- Derivative works must use GPL 3.0
- Cannot add further restrictions
- Must preserve all notices and license texts

Common misconception:
- Using a GPL library does NOT affect your code unless
  you DISTRIBUTE the combined work
- Internal use (even commercial) does not trigger copyleft
- SaaS use does not trigger copyleft (use AGPL for that)
```

### AGPL 3.0

```
When to use:
- GPL 3.0 requirements PLUS network use coverage
- You run a service and want to prevent SaaS competitors
  from using your code without contributing back
- You offer dual licensing (AGPL free + commercial paid)

Key obligations for users:
- All GPL 3.0 obligations apply
- Additionally: users who interact with the software over
  a network must be able to receive the source code
- This closes the "SaaS loophole" in GPL

Common use: Dual licensing strategy
  Free tier: AGPL (must open-source modifications)
  Paid tier: Commercial license (proprietary use allowed)
```

### MPL 2.0 (Mozilla Public License)

```
When to use:
- You want a middle ground between permissive and copyleft
- Modified files must stay open, but new files can be proprietary
- You want to allow mixing with proprietary code

Key obligations for users:
- Modified MPL-licensed files must remain under MPL
- New files can use any license
- Source for MPL files must be available
- Compatible with GPL (can be combined)

Unique feature: File-level copyleft
- Only modified files are affected, not the entire project
- Allows proprietary extensions alongside open source core
```

## Compliance Guide

### Compliance Checklist for Using Open Source

```markdown
## For Every Dependency

- [ ] Identified the license of each dependency
- [ ] Checked license compatibility with your project license
- [ ] Preserved all copyright notices
- [ ] Included required license texts in distribution
- [ ] Created NOTICE or THIRD-PARTY file as needed
- [ ] Documented any modifications to licensed code
- [ ] Verified no license conflicts in the dependency tree

## For Copyleft Dependencies

- [ ] Determined if your use triggers copyleft obligations
- [ ] If distributing: source code available for copyleft components
- [ ] If GPL: entire combined work under compatible license
- [ ] If LGPL: dynamic linking or other allowed integration method
- [ ] If AGPL: network users can access source code
- [ ] If MPL: modified files available under MPL

## For Patent-Granting Licenses

- [ ] Understand the scope of patent grants received
- [ ] Aware of patent retaliation clauses
- [ ] Internal patent review if contributing back
```

### License Compatibility Matrix

```
Can you combine code under these licenses in one project?

             MIT   Apache  BSD   MPL   LGPL  GPL3  AGPL
MIT           Y     Y      Y     Y     Y     Y     Y
Apache 2.0    Y     Y      Y     Y     Y     Y     Y
BSD           Y     Y      Y     Y     Y     Y     Y
MPL 2.0       Y     Y      Y     Y     Y     Y     Y
LGPL 3.0      -     -      -     -     Y     Y     Y
GPL 3.0       -     -      -     -     -     Y     Y
AGPL 3.0      -     -      -     -     -     -     Y

Y = Compatible (result uses the more restrictive license)
- = One-way only (permissive code can go into copyleft,
    but copyleft code cannot go into permissive project)

Note: GPL 2.0 only is NOT compatible with Apache 2.0.
GPL 2.0 or later IS compatible with Apache 2.0 via GPL 3.0.
```

## Attribution Requirements

### NOTICE File Format

```
Project Name
Copyright 2025 Your Name or Organization

This product includes software developed by:

---

Component: library-name
License: MIT
Copyright (c) 2023 Library Author
[GitHub repository]

---

Component: another-library
License: Apache License 2.0
Copyright 2024 Another Author
[GitHub repository]

This product includes software developed at
The Organization ([external resource]).

---
```

### Attribution Best Practices

```markdown
## Where to Place Attribution

### For Libraries (distributed as code)
- LICENSE file in the root of the repository
- NOTICE or THIRD-PARTY-LICENSES file
- License headers in source files (if required by license)

### For Applications (distributed as binaries)
- "About" or "Legal" screen in the application
- Bundled LICENSE file alongside the binary
- Documentation or help section

### For Web Applications
- /licenses or /legal page
- Footer link to open source notices
- Bundled notice file accessible via URL

### For Documentation or Content
- Credits section in the document
- Footnotes or endnotes with attribution
- Separate CREDITS file
```

### Source File Header Templates

```python
# Apache 2.0 header
# Copyright 2025 Your Name
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     [external resource]
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
```

```python
# MIT header (shorter)
# Copyright (c) 2025 Your Name
# Licensed under the MIT License. See LICENSE file in the project root.
```

```python
# GPL 3.0 header
# Copyright (C) 2025 Your Name
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
```

## License Scanning Tools

### Automated Compliance Workflow

```yaml
# CI pipeline license check
name: License Compliance
on: [pull_request]
jobs:
  license-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check dependency licenses
        run: |
          # Node.js projects
          npx license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC"

          # Python projects
          pip-licenses --allow-only="MIT License;Apache Software License;BSD License"

          # Go projects
          go-licenses check ./... --allowed_licenses=MIT,Apache-2.0,BSD-2-Clause
```

### Common License Scanning Tools

| Tool | Language | Purpose |
|------|----------|---------|
| license-checker | Node.js | List and filter npm dependency licenses |
| pip-licenses | Python | List pip package licenses |
| go-licenses | Go | Check Go module licenses |
| cargo-deny | Rust | License and advisory checking |
| FOSSA | Multi-language | Commercial compliance platform |
| Licensee | Ruby | Detect project license from files |
| ScanCode | Multi-language | Deep license and copyright scanner |
| OSS Review Toolkit | Multi-language | End-to-end compliance workflow |

## Frequently Asked Questions

| Question | Answer |
|----------|--------|
| Can I change my project's license? | Yes, if you hold copyright or have contributor agreements allowing it |
| Does MIT allow commercial use? | Yes, with no restrictions beyond attribution |
| Can I use GPL code in a commercial product? | Yes, but the combined work must also be GPL |
| What if a dependency has no license? | Assume all rights reserved; contact the author |
| Do I need a CLA for contributions? | Not required, but helpful for relicensing flexibility |
| Can I dual-license? | Yes, offer the same code under multiple licenses |
| What about code snippets from Stack Overflow? | CC BY-SA 4.0; check compatibility with your license |
| Is "public domain" a valid license? | Varies by jurisdiction; use CC0 or Unlicense for clarity |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to license advisor
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## License Advisor Analysis

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

**Input:** "Help me with license advisor for my current situation"

**Output:**

Based on your situation, here is a structured approach to license advisor:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
