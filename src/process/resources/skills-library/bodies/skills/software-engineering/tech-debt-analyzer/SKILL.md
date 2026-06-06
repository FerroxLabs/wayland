---
name: tech-debt-analyzer
description: |
  Technical debt assessment covering debt categorization, measurement metrics, prioritization matrix, repayment strategies, stakeholder communication, tracking systems, and refactoring budget allocation.
  Use when the user asks about tech debt analyzer, tech debt analyzer best practices, or needs guidance on tech debt analyzer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices refactoring guide"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Tech Debt Analyzer

You are an expert in technical debt assessment and management. Identify, measure, prioritize, and systematically repay technical debt. Tech debt is not inherently bad. It is a tool, like financial debt. The problem is unmanaged debt that compounds silently until it cripples development velocity.

## Technical Debt Definition

Technical debt is the implied cost of future rework caused by choosing an expedient solution now instead of a better approach that would take longer. It includes both intentional shortcuts and unintentional quality degradation.

## Debt Categorization

### The Technical Debt Quadrant (Martin Fowler)

```
                  Reckless                      Prudent
             +------------------+------------------+
             |                  |                  |
 Deliberate  | "We don't have   | "We must ship   |
             |  time for design" |  now and deal    |
             |                  |  with consequences"|
             +------------------+------------------+
             |                  |                  |
Inadvertent  | "What's          | "Now we know how |
             |  layering?"      |  we should have  |
             |                  |  done it"        |
             +------------------+------------------+
```

### Deliberate-Prudent (Strategic Debt)
- Knowingly taking a shortcut with a plan to fix it.
- Example: Hardcoding a configuration value to ship a feature by the deadline, with a ticket to make it configurable.
- Acceptable when: The business value of shipping sooner outweighs the cost of the shortcut.

### Deliberate-Reckless (Lazy Debt)
- Knowingly ignoring best practices without a plan.
- Example: "We don't have time for tests."
- Never acceptable. This is not debt; it is negligence.

### Inadvertent-Prudent (Learning Debt)
- The team built the best solution they could, then learned a better approach.
- Example: After building the system, realizing a different architecture would be better.
- Inevitable and normal. Plan time to apply learnings.

### Inadvertent-Reckless (Ignorance Debt)
- Poor solutions due to lack of knowledge.
- Example: Junior developer not knowing about SQL injection prevention.
- Fix through code review, training, and mentoring.

### Debt Types by Category

| Category | Examples |
|----------|---------|
| **Architecture debt** | Wrong architectural pattern, tight coupling, missing abstraction layers |
| **Code debt** | Code smells, duplicated logic, complex functions, poor naming |
| **Testing debt** | Missing tests, flaky tests, untestable code |
| **Documentation debt** | Outdated docs, missing API documentation, no runbooks |
| **Infrastructure debt** | Manual deployments, missing monitoring, outdated dependencies |
| **Design debt** | Broken abstractions, god classes, circular dependencies |
| **Process debt** | No code review, no CI/CD, missing coding standards |
| **Data debt** | Missing migrations, inconsistent schemas, orphaned data |
| **Dependency debt** | Outdated libraries, unpatched vulnerabilities, deprecated APIs |

## Measurement Metrics

### Code Quality Metrics

| Metric | Tool | Threshold |
|--------|------|-----------|
| Cyclomatic complexity | SonarQube, ESLint | < 10 per method |
| Cognitive complexity | SonarQube | < 15 per method |
| Code duplication | SonarQube, jsinspect | < 3% of codebase |
| Test coverage | Istanbul, JaCoCo | > 80% line coverage |
| Dependency freshness | Dependabot, Renovate | < 1 major version behind |
| Vulnerability count | Snyk, npm audit | 0 critical/high |
| Build time | CI metrics | Trend should be flat or decreasing |
| Deployment frequency | DORA metrics | Weekly or better |

### Velocity Metrics

These indirect metrics reveal debt impact:

| Metric | What it reveals |
|--------|----------------|
| **Lead time for changes** | How long from commit to production. Increasing = debt friction. |
| **Change failure rate** | Percentage of deployments causing failures. High = testing/quality debt. |
| **Mean time to recovery** | Time to recover from failures. Increasing = observability/architecture debt. |
| **Developer onboarding time** | Time for new developer to ship first PR. Increasing = documentation/complexity debt. |
| **Effort per feature** | Story points per feature trending up = accumulating debt. |
| **Bug escape rate** | Bugs reaching production trending up = testing debt. |

### Calculating the Cost of Debt

For each debt item, estimate:

```
Cost of Debt = (Time lost per developer per week) * (Number of developers affected) * (Weeks until fix)

Example:
  - Flaky CI pipeline causes 30 min lost per developer per day
  - Team of 8 developers
  - Fix estimated in 3 weeks if prioritized

  Weekly cost: 0.5 hours * 5 days * 8 developers = 20 developer-hours/week
  Total cost until fix: 20 * 3 = 60 developer-hours
  Cost of fix: ~16 developer-hours
  ROI of fixing: 60/16 = 3.75x return
```

## Prioritization Matrix

### Impact vs Effort Matrix

```
High Impact |  Quick Wins    |  Major Projects
            |  (Do first)   |  (Plan and schedule)
            |               |
            +---------------+------------------
            |  Fill-ins     |  Thankless Tasks
            |  (Do when     |  (Deprioritize or
            |   convenient) |   accept the debt)
            |               |
Low Impact  +---------------+------------------
             Low Effort       High Effort
```

### Prioritization Scoring

Score each debt item on a 1-5 scale:

| Factor | Weight | Score (1-5) |
|--------|--------|-------------|
| Developer productivity impact | 3x | How much does this slow down daily work? |
| Risk of incident | 3x | Could this cause production outage or data loss? |
| Number of developers affected | 2x | How many people hit this regularly? |
| Customer impact | 2x | Does this affect user experience or reliability? |
| Effort to fix | -1x | How much work is the fix? (higher = worse) |

```
Priority Score = (productivity * 3) + (risk * 3) + (affected * 2) + (customer * 2) - (effort * 1)

Example: Flaky CI pipeline
  Productivity: 4 (blocks merges multiple times daily)
  Risk: 2 (not a production risk)
  Affected: 5 (entire engineering team)
  Customer: 1 (no direct customer impact)
  Effort: 2 (moderate fix)

  Score = (4*3) + (2*3) + (5*2) + (1*2) - (2*1) = 12 + 6 + 10 + 2 - 2 = 28
```

### Priority Queue
Maintain a ranked backlog of debt items. Review and re-rank monthly.

## Debt Repayment Strategies

### 1. The Boy Scout Rule
"Leave the code better than you found it."
- When touching code for a feature, fix small debt items in the same PR.
- Rename a variable, extract a method, add a missing test.
- Scope: Small. Budget: Zero (part of feature work).

### 2. Dedicated Debt Sprints
- Allocate 1 sprint per quarter entirely to debt repayment.
- Focus on high-impact items from the priority queue.
- Scope: Large. Budget: ~10% of engineering capacity per quarter.

### 3. The 20% Rule
- Allocate 20% of every sprint to debt repayment.
- Each developer picks 1 day per week for debt work.
- Scope: Medium. Budget: 20% of ongoing capacity.

### 4. Strangler Fig for Architecture Debt
- Build the replacement alongside the legacy system.
- Migrate traffic gradually.
- Scope: Very large. Budget: Dedicated team or project.

### 5. Tech Debt Fridays
- Every Friday afternoon is dedicated to debt repayment.
- Developers choose from the priority queue.
- Scope: Small-medium. Budget: ~10% of capacity.

### 6. Debt Firebreaks
- Before starting a new major feature, pay down debt in the affected area.
- Reduces risk of the new feature being built on a shaky foundation.
- Scope: Medium. Budget: 1-2 weeks before major features.

### Choosing a Strategy

| Situation | Strategy |
|-----------|----------|
| Small, distributed debt | Boy Scout Rule + 20% Rule |
| Large architectural debt | Strangler Fig + dedicated team |
| Sudden quality crisis | Dedicated debt sprint |
| Steady accumulation | Tech Debt Fridays + 20% Rule |
| Pre-major-feature | Debt Firebreak |

## Communicating Debt to Stakeholders

### Translating Technical Debt to Business Impact

Do not say: "We need to refactor the authentication module."

Say: "The authentication code takes 3x longer to modify than other parts of the system. Every auth-related feature takes 2 extra weeks because of this. Investing 3 weeks to improve it will save 2 weeks on every subsequent auth feature."

### Framework for Stakeholder Communication

```markdown
## Technical Debt Item: [Name]

### Business Impact
- [Impact on delivery speed, quality, or risk]
- [Quantified in developer-hours/week or incident frequency]

### Cost of Inaction
- [What happens if we do nothing for 6 months?]
- [Growing cost, increasing risk, or competitive disadvantage]

### Proposed Fix
- [What we will do]
- [How long it will take]
- [Expected improvement]

### ROI
- Investment: [X developer-weeks]
- Return: [Y developer-weeks saved per quarter]
- Break-even: [Z weeks/months]
```

### Visualization for Non-Technical Stakeholders

Use a debt dashboard showing:
1. **Total debt count** by severity (critical, high, medium, low).
2. **Trend line**: Is debt growing or shrinking?
3. **Velocity impact**: Feature delivery speed trend.
4. **Risk exposure**: Number of known vulnerabilities, unpatched systems.
5. **Cost estimate**: Estimated developer-hours consumed by debt per month.

## Debt Tracking Systems

### Tracking in Issue Trackers

Create a standardized template:

```markdown
## Tech Debt: [Brief title]

**Category**: [Architecture / Code / Testing / Infrastructure / etc.]
**Quadrant**: [Deliberate-Prudent / Deliberate-Reckless / Inadvertent-Prudent / Inadvertent-Reckless]
**Priority Score**: [Calculated score]
**Affected Area**: [Module/service/feature]

### Description
[What is the debt? How did it arise?]

### Impact
[How does this affect development speed, reliability, or maintainability?]
[Quantify: hours lost per week, incidents caused, etc.]

### Proposed Resolution
[What changes are needed?]
[Estimated effort in developer-days]

### Acceptance Criteria
- [ ] [Specific measurable outcome]
- [ ] [Tests added/passing]
- [ ] [Documentation updated]
```

### Label System
```
type:tech-debt
severity:critical | severity:high | severity:medium | severity:low
category:architecture | category:code | category:testing | category:infrastructure
status:identified | status:planned | status:in-progress | status:resolved
```

### Regular Review Cadence
- **Weekly**: Team reviews new debt items, triages severity.
- **Monthly**: Prioritize debt backlog, allocate capacity.
- **Quarterly**: Report to stakeholders on debt trends and impact.
- **Annually**: Strategic review of architectural debt and multi-quarter paydown plans.

## Refactoring Budget Allocation

### How Much to Invest

| Team Maturity | Recommended Allocation | Rationale |
|--------------|----------------------|-----------|
| Startup / MVP | 5-10% | Debt is expected. Ship fast, track debt. |
| Growing team | 15-20% | Debt from MVP phase needs paydown. |
| Mature product | 20-25% | Maintain quality, prevent accumulation. |
| Legacy rescue | 30-40% | Temporary. Intensive paydown period. |

### Budget Enforcement

1. **Track debt work separately** in the issue tracker.
2. **Measure velocity on debt items** the same way as features.
3. **Make debt visible** in sprint planning. Do not hide it as "refactoring" inside feature stories.
4. **Celebrate debt paydown** the same way as feature delivery.
5. **Alert on budget underuse**: If the team is not using their debt allocation, investigate why (could be prioritization pressure from management).

### Debt Prevention

The cheapest debt is debt you never create:

1. **Code review**: Catch debt before it merges.
2. **Automated quality gates**: Fail CI on complexity, coverage drops, lint violations.
3. **Architecture decision records (ADRs)**: Document decisions so future developers understand trade-offs.
4. **Definition of Done**: Include "no new tech debt without a tracking ticket."
5. **Regular refactoring**: Refactor as part of feature development (Boy Scout Rule).
6. **Invest in developer experience**: Good tooling, fast CI, clear documentation.

## Tech Debt Assessment Checklist

Run this assessment quarterly:

### Architecture
- [ ] Are there circular dependencies between modules?
- [ ] Is the dependency direction correct (domain does not depend on infrastructure)?
- [ ] Are there single points of failure?
- [ ] Is the system horizontally scalable?
- [ ] Are service boundaries well-defined?

### Code Quality
- [ ] What is the average cyclomatic complexity? Trending up or down?
- [ ] What percentage of code is duplicated?
- [ ] Are there functions longer than 50 lines?
- [ ] Are there classes longer than 500 lines?
- [ ] Is naming consistent across the codebase?

### Testing
- [ ] What is the test coverage? Is it improving?
- [ ] How many flaky tests exist?
- [ ] Are critical paths covered by integration tests?
- [ ] How long does the test suite take to run?
- [ ] Are tests maintainable (not overly coupled to implementation)?

### Infrastructure
- [ ] Are all dependencies up to date (within 1 major version)?
- [ ] Are there known security vulnerabilities?
- [ ] Is deployment fully automated?
- [ ] Is monitoring and alerting in place for all services?
- [ ] Are runbooks up to date for incident response?

### Process
- [ ] Is code review happening on every PR?
- [ ] Is CI running on every commit?
- [ ] Are coding standards documented and enforced?
- [ ] Is the team tracking and reviewing tech debt regularly?
- [ ] Is there a defined process for introducing new dependencies?

## When to Use

**Use this skill when:**
- Designing or implementing tech debt analyzer solutions
- Reviewing or improving existing tech debt analyzer approaches
- Making architectural or implementation decisions about tech debt analyzer
- Learning tech debt analyzer patterns and best practices
- Troubleshooting tech debt analyzer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Tech Debt Analyzer Analysis

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

**Input:** "Help me implement tech debt analyzer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended tech debt analyzer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When tech debt analyzer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
