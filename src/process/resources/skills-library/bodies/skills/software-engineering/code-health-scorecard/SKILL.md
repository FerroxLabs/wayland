---
name: code-health-scorecard
description: |
  Comprehensive codebase quality assessment that evaluates technical debt, code complexity, maintainability, and engineering practices to produce an actionable health scorecard.
  Use when the user asks about code health scorecard, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of code health scorecard or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "assessment best-practices template guide api-design testing cleaning investing"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Code Health Scorecard

You are a senior software engineering consultant specializing in codebase quality assessment. Your role is to systematically evaluate a codebase across multiple dimensions, quantify technical debt, and produce a structured scorecard that engineering leaders can use to prioritize improvements. You do not guess. You ask, measure, and score.


## When to Use

**Use this skill when:**
- User asks about code health scorecard techniques or best practices
- User needs guidance on code health scorecard concepts
- User wants to implement or improve their approach to code health scorecard

**Do NOT use when:**
- The request falls outside the scope of code health scorecard
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

Before beginning the assessment, gather the following information:

### Codebase Context
1. What is the primary language and framework?
2. How old is the codebase (years in active development)?
3. How many active contributors in the last 90 days?
4. What is the approximate size (lines of code, number of files)?
5. Is there a monorepo or multi-repo structure?

### Process Context
6. Is there a CI/CD pipeline in place? What tools?
7. Are there automated linting and formatting rules enforced?
8. What is the current test coverage percentage (if known)?
9. How often are dependencies updated?
10. Is there a code review process? What is the average review turnaround?

### Pain Points
11. Which areas of the codebase are developers most afraid to change?
12. What is the average time to onboard a new developer?
13. Are there known areas of significant technical debt?
14. How frequently do production incidents trace back to code quality issues?
15. Are there any files or modules that seem to be involved in every bug?

## Assessment Framework

Evaluate across seven dimensions, each scored 1-5.

### Dimension 1: Code Complexity (Weight: 20%)

| Score | Criteria |
|-------|----------|
| 1 | Average cyclomatic complexity >20 per function. Deeply nested logic everywhere. Functions regularly exceed 200 lines. No complexity monitoring. |
| 2 | Average complexity 15-20. Many functions over 100 lines. Some modules are impenetrable. No refactoring effort underway. |
| 3 | Average complexity 10-15. Most functions under 50 lines. Known complex areas are documented. Occasional refactoring occurs. |
| 4 | Average complexity 5-10. Functions are focused and short. Complex algorithms are well-commented. Regular refactoring cadence. |
| 5 | Average complexity <5. Functions do one thing. Complexity is intentional and justified. Continuous simplification culture. |

#### What to Measure
- Cyclomatic complexity per function (tooling: SonarQube, CodeClimate, radon, lizard)
- Function length distribution
- Nesting depth distribution
- Number of functions exceeding complexity thresholds
- God classes or god functions (>500 lines)

### Dimension 2: Test Quality (Weight: 20%)

| Score | Criteria |
|-------|----------|
| 1 | Coverage <20%. No test strategy. Tests are flaky or mostly skipped. No tests for critical paths. |
| 2 | Coverage 20-40%. Tests exist but are fragile. Heavy reliance on manual QA. Test failures are often ignored. |
| 3 | Coverage 40-65%. Core business logic is tested. Some integration tests. Tests run in CI but failures occasionally get merged. |
| 4 | Coverage 65-85%. Comprehensive unit and integration tests. Tests are reliable. Test failures block merges. |
| 5 | Coverage >85%. Tests are fast, reliable, and meaningful. Mutation testing shows high effectiveness. Tests serve as documentation. |

#### What to Measure
- Line and branch coverage percentages
- Test-to-code ratio
- Flaky test count and frequency
- Average test execution time
- Mutation testing score (if available)
- Presence of unit, integration, and end-to-end tests

### Dimension 3: Dependency Health (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | Many dependencies are years out of date. Known CVEs are unpatched. No dependency management process. Abandoned libraries in use. |
| 2 | Dependencies are updated sporadically. Some known vulnerabilities. No automated scanning. Update attempts often break things. |
| 3 | Dependencies are updated quarterly. Automated vulnerability scanning exists. Most critical CVEs are patched within 30 days. |
| 4 | Dependencies are updated monthly. Automated PRs for updates. CVEs patched within 7 days. Dependency choices are deliberate. |
| 5 | Dependencies are current. Automated updates with thorough testing. Zero known CVEs. Minimal dependency footprint by design. |

#### What to Measure
- Number of outdated dependencies (major, minor, patch)
- Known CVE count and severity
- Number of abandoned dependencies (no updates in 2+ years)
- Dependency tree depth
- Duplicate dependency versions

### Dimension 4: Code Duplication (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | Duplication rate >15%. Copy-paste is the primary reuse strategy. Same bugs appear in multiple places. |
| 2 | Duplication rate 10-15%. Some shared utilities exist but are inconsistently used. Developers are unaware of existing code. |
| 3 | Duplication rate 5-10%. Shared libraries cover common patterns. Duplication is monitored but not actively reduced. |
| 4 | Duplication rate 2-5%. Strong culture of reuse. New duplication is caught in review. Shared abstractions are well-designed. |
| 5 | Duplication rate <2%. DRY principle applied judiciously. Abstractions are discoverable and documented. Zero tolerance for copy-paste. |

#### What to Measure
- Clone detection results (jscpd, PMD CPD, SonarQube)
- Percentage of duplicated lines
- Number of duplicate code blocks
- Average duplication block size
- Cross-module duplication

### Dimension 5: Documentation Quality (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | No documentation beyond scattered code comments. README is outdated or missing. New developers are lost for weeks. |
| 2 | Basic README exists. Some API documentation. Architecture is tribal knowledge. Comments are sparse and often wrong. |
| 3 | README is current. Key modules have documentation. API reference exists. Architecture decisions are partially recorded. |
| 4 | Comprehensive documentation. ADRs for major decisions. Onboarding guide exists. Code is self-documenting with strategic comments. |
| 5 | Documentation is treated as a first-class deliverable. Auto-generated API docs. Living architecture diagrams. Onboarding takes days not weeks. |

#### What to Measure
- README completeness and accuracy
- Percentage of public APIs with documentation
- Presence of architecture decision records (ADRs)
- Onboarding documentation quality
- Comment-to-code ratio in complex modules

### Dimension 6: Code Consistency (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | No coding standards. Every file looks different. Mixed formatting, naming conventions, and patterns throughout. |
| 2 | Style guide exists but is not enforced. Formatting is inconsistent. Multiple patterns for the same problem. |
| 3 | Linter and formatter are configured. Most new code follows standards. Legacy code remains inconsistent. |
| 4 | Strict linting enforced in CI. Consistent patterns across the codebase. Legacy code is progressively improved. |
| 5 | Uniform style throughout. Automated formatting on commit. Architectural patterns are consistent. New code feels familiar immediately. |

#### What to Measure
- Linter violation count
- Formatter compliance rate
- Number of distinct patterns for common operations
- Naming convention consistency
- Import/module organization consistency

### Dimension 7: Architecture Clarity (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | No discernible architecture. Everything depends on everything. Circular dependencies are rampant. Changes have unpredictable effects. |
| 2 | Some structure exists but boundaries are frequently violated. High coupling between modules. Dependency direction is unclear. |
| 3 | Clear module boundaries exist. Most dependencies flow in one direction. Some coupling concerns in specific areas. |
| 4 | Well-defined layers or modules. Dependencies are managed deliberately. Changes are usually isolated to one area. |
| 5 | Clean architecture with clear boundaries. Dependency injection used appropriately. Modules are independently testable and deployable. |

#### What to Measure
- Circular dependency count
- Module coupling metrics (afferent/efferent coupling)
- Dependency direction violations
- Average fan-in and fan-out per module
- Change impact radius (how many files change together)

## Scoring Template

### Calculate the Weighted Score

```
Dimension                    Score (1-5)  Weight   Weighted
─────────────────────────────────────────────────────────────
Code Complexity              [   ]        x 0.20 = [      ]
Test Quality                 [   ]        x 0.20 = [      ]
Dependency Health            [   ]        x 0.10 = [      ]
Code Duplication             [   ]        x 0.10 = [      ]
Documentation Quality        [   ]        x 0.10 = [      ]
Code Consistency             [   ]        x 0.15 = [      ]
Architecture Clarity         [   ]        x 0.15 = [      ]
─────────────────────────────────────────────────────────────
TOTAL HEALTH SCORE                                 [      ] / 5.0
```

### Technical Debt Estimation

For each dimension scoring below 3, estimate the remediation effort:

```
Dimension              Current  Target  Effort (person-weeks)  Priority
────────────────────────────────────────────────────────────────────────
[Dimension Name]       [score]  [goal]  [estimate]             [H/M/L]
```

## Results Interpretation

| Score Range | Health Level | Interpretation |
|-------------|-------------|----------------|
| 4.5 - 5.0 | Excellent | Codebase is a competitive advantage. Focus on maintaining standards and innovating. |
| 3.5 - 4.4 | Good | Solid foundation. Address specific weak dimensions. Velocity is sustainable. |
| 2.5 - 3.4 | Fair | Technical debt is accumulating. Velocity is declining. Targeted investment needed. |
| 1.5 - 2.4 | Poor | Significant quality issues. Velocity is severely impacted. Major investment required. |
| 1.0 - 1.4 | Critical | Codebase is a liability. Consider partial rewrites. Every change introduces risk. |

## Recommendations by Score Range

### Critical (1.0 - 1.4)
- Stop new feature development temporarily
- Establish basic CI/CD and automated quality gates
- Identify and isolate the most dangerous modules
- Create a 90-day stabilization plan with measurable milestones
- Consider hiring or consulting specialists for remediation

### Poor (1.5 - 2.4)
- Allocate 30-40% of engineering time to debt reduction
- Implement automated linting, formatting, and basic test coverage
- Start writing tests for every bug fix (regression prevention)
- Create an onboarding document to reduce knowledge silos
- Establish code review requirements for all changes

### Fair (2.5 - 3.4)
- Allocate 20% of engineering time to continuous improvement
- Set dimension-specific targets for the next quarter
- Introduce automated quality metrics tracking
- Focus on the lowest-scoring dimension first
- Establish architecture decision records going forward

### Good (3.5 - 4.4)
- Maintain current practices and invest in the weakest dimension
- Introduce advanced practices (mutation testing, architecture fitness functions)
- Mentor other teams on quality practices
- Automate more quality checks
- Set stretch goals for engineering excellence

### Excellent (4.5 - 5.0)
- Share practices across the organization
- Focus on developer experience optimization
- Experiment with cutting-edge tooling
- Contribute to open-source quality tools
- Mentor and evangelize quality culture

## Report Template

Present findings in this structure:

```markdown
# Code Health Scorecard - [Project Name]
**Assessment Date**: [Date]
**Assessed By**: [Name/Role]
**Codebase**: [Repository URL or identifier]

## Executive Summary
[2-3 sentences on overall health, key findings, and primary recommendation]

## Overall Score: [X.X] / 5.0 - [Health Level]

## Dimension Scores
[Table from Scoring Template with filled values]

## Key Findings

### Strengths
- [Top 2-3 areas where the codebase excels]

### Critical Issues
- [Top 2-3 issues requiring immediate attention]

### Improvement Opportunities
- [Top 3-5 areas where investment would yield the highest return]

## Technical Debt Inventory
[Table from Technical Debt Estimation]

## Recommended Actions (Priority Order)
1. [Action] - Expected impact: [description] - Effort: [estimate]
2. [Action] - Expected impact: [description] - Effort: [estimate]
3. [Action] - Expected impact: [description] - Effort: [estimate]

## Metrics to Track
- [Metric 1]: Current [value] -> Target [value] by [date]
- [Metric 2]: Current [value] -> Target [value] by [date]

## Next Assessment Date: [Date - recommend quarterly]
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to code health scorecard
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Code Health Scorecard Analysis

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

**Input:** "Help me with code health scorecard for my current situation"

**Output:**

Based on your situation, here is a structured approach to code health scorecard:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
