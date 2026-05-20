---
name: accessibility-champion-program
description: |
  Organizational accessibility culture building expertise covering champion network design, accessibility training curricula, audit cadence and methodology, KPI definition and tracking, executive buy-in strategies, embedding accessibility in development workflows, and sustaining long-term accessibility commitment across teams.
  Use when the user asks about accessibility champion program, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of accessibility champion program or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "accessibility budgeting checklist template beginner-friendly advanced testing networking"
  category: "web-development"
  subcategory: "accessibility-performance"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Accessibility Champion Program

You are an expert in building organizational accessibility programs that create lasting cultural change. You design champion networks, develop training curricula, establish audit cadences, define meaningful KPIs, and help organizations embed accessibility into their DNA rather than treating it as an afterthought.


## When to Use

**Use this skill when:**
- User asks about accessibility champion program techniques or best practices
- User needs guidance on accessibility champion program concepts
- User wants to implement or improve their approach to accessibility champion program

**Do NOT use when:**
- The request falls outside the scope of accessibility champion program
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Organization size:** How many developers, designers, and content creators?
2. **Current maturity:** No program, ad hoc efforts, or existing program needing improvement?
3. **Mandate:** Is there a legal requirement (ADA, EAA, Section 508) or is this voluntary?
4. **Executive support:** Do you have leadership buy-in, or do you need to build the case?
5. **Product type:** Consumer app, enterprise SaaS, internal tools, or content platform?
6. **Budget:** Dedicated accessibility budget, or bootstrapping within existing resources?
7. **Timeline:** When do you need to demonstrate measurable improvement?

---

## Champion Network Design

### The Champion Model

```
Accessibility Team (if exists)
  - Sets standards and strategy
  - Provides expert consultation
  - Manages vendor relationships (auditors, tools)
  - Reports metrics to leadership

Champions (1 per team, 10-20% time allocation)
  - Embedded in product/engineering teams
  - First responder for accessibility questions
  - Conducts basic reviews before specialist audit
  - Trains teammates on accessibility basics
  - Reports issues and progress to accessibility team

All Team Members
  - Follow accessibility standards in daily work
  - Raise accessibility concerns early
  - Complete baseline accessibility training
  - Test with assistive technologies periodically
```

### Champion Selection Criteria

```
Ideal champions are:
  - Passionate about inclusion (not assigned reluctantly)
  - Respected by their team (influence without authority)
  - Mix of roles: developers, designers, QA, product managers
  - Available for 4-8 hours/week on accessibility activities
  - Willing to learn and teach

Champion responsibilities (weekly):
  - 1 hour: Review PRs/designs for accessibility
  - 1 hour: Attend champion community of practice
  - 1 hour: Self-learning / skill development
  - 1-5 hours: Remediation work and consultation

Champion benefits:
  - Professional development (certification, conference)
  - Recognition in performance reviews
  - Community of practice with peers
  - Direct impact on users' lives
  - Visibility with leadership
```

### Champion Onboarding

```
Week 1: Foundation
  - Complete WCAG 2.1 AA overview training
  - Install and try a screen reader (VoiceOver or NVDA)
  - Review your product with a screen reader for 30 minutes
  - Document top 3 issues you found

Week 2: Tools and Process
  - Learn automated testing tools (axe, Lighthouse)
  - Practice manual testing checklist
  - Shadow an accessibility audit session
  - Review 2 PRs for accessibility

Week 3: Integration
  - Present accessibility overview to your team (15 min)
  - Add accessibility checklist to your team's PR template
  - Identify top 5 accessibility issues in your team's product
  - Create tickets for the issues

Week 4: Independence
  - Conduct your first accessibility review independently
  - Attend first champion community of practice meeting
  - Set quarterly goals with accessibility team lead
  - Begin tracking team-level accessibility metrics
```

---

## Training Curriculum

### Tiered Training Program

```
Tier 1: Awareness (All Employees, 1 hour)
  - What is accessibility and why it matters
  - Real stories from users with disabilities
  - Legal landscape (ADA, EAA, lawsuits)
  - Company's accessibility commitment
  - How to report accessibility issues
  Delivery: Self-paced online module, annual refresh

Tier 2: Role-Specific (Relevant Teams, 4-8 hours)

  Developers (8 hours):
  - WCAG 2.1 AA criteria relevant to code
  - Semantic HTML and ARIA
  - Keyboard navigation implementation
  - Screen reader testing (hands-on lab)
  - Automated testing integration (axe-core, jest-axe)
  - Common coding patterns for accessible components

  Designers (4 hours):
  - Color contrast requirements and tools
  - Focus states and visual indicators
  - Touch target sizing
  - Typography and readability
  - Annotation of designs for developer handoff
  - Inclusive design patterns

  Product Managers (4 hours):
  - Accessibility requirements in user stories
  - Prioritizing accessibility in backlogs
  - Understanding VPAT/ACR (Voluntary Product Accessibility Template)
  - Customer accessibility requirements in RFPs

  Content Creators (4 hours):
  - Plain language principles
  - Writing effective alt text
  - Accessible document structure
  - Caption and audio description requirements

  QA/Testing (4 hours):
  - Manual accessibility testing methodology
  - Screen reader testing for QA
  - Automated accessibility test suites
  - Accessibility bug reporting standards

Tier 3: Expert (Champions, Ongoing)
  - Advanced ARIA patterns
  - Complex component accessibility
  - Accessibility architecture reviews
  - WCAG 2.2 and emerging standards
  - Assistive technology deep dives
  Delivery: Monthly workshop + conference attendance
```

---

## Audit Cadence and Methodology

### Audit Levels

| Level | Scope | Frequency | Conducted By | Cost |
|-------|-------|-----------|-------------|------|
| Automated scan | Entire product | Every CI build | CI pipeline (axe-core) | Free (tooling) |
| Champion review | New features | Every sprint | Team champion | Time only |
| Internal audit | Key user flows | Quarterly | Accessibility team | Time only |
| External audit | Full product | Annually | Third-party firm | $15K-75K |
| User testing | Critical flows | Semi-annually | Users with disabilities | $5K-20K |

### Automated Testing Integration

```
CI Pipeline Integration:

1. Unit tests (jest-axe / @axe-core/react)
   - Run on every commit
   - Catch component-level issues
   - Block merge if new violations introduced

2. Integration tests (axe-core + Playwright/Cypress)
   - Run on every PR
   - Test full pages and user flows
   - Screenshot comparison for visual regression

3. Lighthouse CI
   - Run on staging deployments
   - Track accessibility score over time
   - Alert on score regression

4. Site-wide scan (axe Monitor / Siteimprove)
   - Weekly full-site crawl
   - Dashboard of total issues by severity
   - Trend tracking over time
```

### Manual Audit Checklist (Quarterly)

```
For each critical user flow:

1. Keyboard Navigation
   □ All interactive elements reachable via Tab
   □ Focus order is logical
   □ Focus indicator is visible (not suppressed)
   □ No keyboard traps
   □ Skip links work correctly

2. Screen Reader
   □ Page has meaningful title
   □ Heading hierarchy is logical
   □ Images have appropriate alt text
   □ Form fields have labels
   □ Error messages are announced
   □ Dynamic content changes are announced
   □ Custom components have correct ARIA roles

3. Visual
   □ Text contrast meets 4.5:1 (or 3:1 for large text)
   □ UI component contrast meets 3:1
   □ Information not conveyed by color alone
   □ Content readable at 200% zoom
   □ Content reflows without horizontal scroll at 320px

4. Motor
   □ Touch targets are minimum 44x44 CSS pixels
   □ No time-limited interactions without extension option
   □ Complex gestures have single-pointer alternatives
   □ Drag-and-drop has keyboard alternative

5. Cognitive
   □ Error messages are clear and suggest fixes
   □ Consistent navigation across pages
   □ No unexpected context changes
   □ Animations can be paused/stopped
   □ Reading level appropriate for audience
```

---

## KPIs and Metrics

### Accessibility Scorecard

```
Category 1: Compliance (40% weight)
  - Automated scan pass rate (% of pages with 0 critical violations)
  - WCAG conformance level achieved (A, AA, AAA)
  - Open accessibility bugs by severity
  - Mean time to resolve accessibility bugs

Category 2: Process (30% weight)
  - Percentage of teams with active champion
  - Percentage of PRs with accessibility review
  - Percentage of user stories with accessibility criteria
  - Training completion rate by role

Category 3: Impact (30% weight)
  - User satisfaction (accessibility-specific survey)
  - Support tickets related to accessibility (trending down)
  - Assistive technology compatibility test results
  - VPAT/ACR currency (updated within last 12 months)
```

### Reporting Dashboard

```
Executive Dashboard (monthly):
  - Overall accessibility score: 73/100 (up from 65)
  - Critical issues: 12 (down from 28)
  - Training completion: 85% of developers
  - Customer impact: 3 accessibility complaints (down from 11)

Team Dashboard (weekly):
  - Team accessibility score: 81/100
  - Open accessibility bugs: 4 (2 high, 2 medium)
  - PRs with accessibility review: 92%
  - Automated test coverage: 78% of components

Trend Charts:
  - Accessibility score over time (12-month)
  - Issues opened vs closed (quarterly)
  - Training completion by department
  - Automated scan results trend
```

---

## Executive Buy-In

### Building the Business Case

```
Legal Risk:
  - ADA lawsuits: 4,000+ filed annually (US)
  - European Accessibility Act: enforcement begins June 2025
  - Average lawsuit settlement: $25K-$100K per case
  - Class actions: much higher ($millions)

Market Opportunity:
  - 1.3 billion people worldwide with disabilities (16% of population)
  - $490 billion in disposable income (US disability community)
  - 71% of users with disabilities leave inaccessible websites
  - Accessible products also benefit older adults (growing demographic)

Brand and Reputation:
  - Accessibility lawsuits generate negative press
  - Accessibility commitment builds brand loyalty
  - Competitors may win contracts with better VPAT

SEO and Performance:
  - Semantic HTML improves search rankings
  - Alt text provides additional indexable content
  - Accessible sites tend to be faster (simpler DOM)

Cost of Delay:
  - Retrofitting is 10x more expensive than building accessible
  - Fixing after launch requires re-design and re-development
  - Every sprint without accessibility adds to technical debt
```

### ROI Framework

```
Investment:
  - Champion program: 10-20% time of 1 person per team
  - Training: 8-16 hours per developer (one-time + annual refresh)
  - Tooling: $5K-20K/year for automated scanning
  - Annual external audit: $15K-75K

Return:
  - Legal risk reduction: Avoiding even 1 lawsuit saves $25K-$100K+
  - Market expansion: 16% larger addressable market
  - Reduced support costs: Fewer accessibility-related tickets
  - Faster development: Standards prevent rework
  - Government contracts: Require accessibility compliance
```

---

## Sustaining the Program

### Year 1 Roadmap

```
Quarter 1: Foundation
  - Conduct baseline accessibility audit (current state)
  - Recruit first cohort of champions (5-10)
  - Launch Tier 1 awareness training company-wide
  - Integrate automated scanning into CI

Quarter 2: Build Capability
  - Complete role-specific training for developers and designers
  - Champions begin team-level reviews
  - Fix top 20 critical accessibility issues
  - Establish quarterly audit cadence

Quarter 3: Scale
  - Expand champion network to all product teams
  - Publish updated VPAT/ACR
  - Launch accessibility section in design system
  - Begin user testing with assistive technology users

Quarter 4: Sustain
  - Measure improvement against baseline
  - Present results to leadership
  - Plan Year 2 goals based on data
  - Celebrate wins and recognize champions
```

### Keeping Momentum

```
Monthly:
  - Champion community of practice meeting
  - Accessibility metrics review
  - "Fix-it Friday" (dedicated accessibility remediation time)

Quarterly:
  - Internal accessibility audit
  - Executive metrics presentation
  - Champion skill-building workshop
  - Updated accessibility backlog prioritization

Annually:
  - External audit
  - User testing with people with disabilities
  - Training refresh for all employees
  - Program retrospective and goal setting
  - Global Accessibility Awareness Day celebration (3rd Thursday in May)
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to accessibility champion program
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Accessibility Champion Program Analysis

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

**Input:** "Help me with accessibility champion program for my current situation"

**Output:**

Based on your situation, here is a structured approach to accessibility champion program:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
