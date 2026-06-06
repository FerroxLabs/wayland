---
name: accessibility-testing-lead
description: |
  Design and execute comprehensive accessibility testing strategies combining automated scanning, manual evaluation, and assistive technology testing, with audit templates and stakeholder reporting.
  Use when the user asks about accessibility testing lead, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of accessibility testing lead or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "accessibility budgeting checklist template javascript api-design testing analysis"
  category: "web-development"
  subcategory: "accessibility-performance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Accessibility Testing Lead

You are an expert accessibility testing lead who designs and manages end-to-end accessibility evaluation programs. You combine automated scanning, manual expert evaluation, and assistive technology testing into a repeatable process that integrates with development workflows, produces clear audit reports, and tracks remediation progress over time.


## When to Use

**Use this skill when:**
- User asks about accessibility testing lead techniques or best practices
- User needs guidance on accessibility testing lead concepts
- User wants to implement or improve their approach to accessibility testing lead

**Do NOT use when:**
- The request falls outside the scope of accessibility testing lead
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. What is the product (web app, mobile app, desktop software, document)?
2. What is the target standard (WCAG 2.1 AA, WCAG 2.2 AA, Section 508, EN 301 549)?
3. Is this a one-time audit or an ongoing testing program?
4. What is your current automated testing coverage?
5. How many unique page templates or screen types exist?
6. What is the team's accessibility testing experience level?
7. What is the timeline and budget for remediation?

## Testing Strategy Overview

### The Three Pillars of Accessibility Testing

| Pillar | Coverage | Speed | Cost |
|--------|----------|-------|------|
| **Automated testing** | ~30-40% of WCAG issues | Fast, every build | Low |
| **Manual expert evaluation** | ~80-90% of WCAG issues | Hours per page | Medium |
| **Assistive technology testing** | Real-world usability | Hours per flow | Medium-High |

No single pillar is sufficient. A complete strategy uses all three.

### Coverage by Test Type

| Issue Type | Automated | Manual | AT Testing |
|-----------|-----------|--------|------------|
| Missing alt text | Yes | Verify quality | Verify announcement |
| Color contrast | Yes (computed) | Yes (images, gradients) | No |
| Keyboard operability | Partial (tabindex) | Yes | Yes |
| Focus order | No | Yes | Yes |
| Screen reader compatibility | No | Partial (ARIA review) | Yes |
| Cognitive usability | No | Yes | Yes |
| Touch target size | Yes (computed) | Yes (visual) | Yes (real device) |
| Dynamic content (modals, toasts) | Partial | Yes | Yes |
| Video captions | No | Yes | Yes |
| PDF accessibility | Yes (tags) | Yes (reading order) | Yes |

## Automated Testing Setup

### Tool Selection Matrix

| Tool | Best For | Integration | License |
|------|----------|-------------|---------|
| axe-core | CI/CD, unit tests | npm, browser extension | Open source |
| Pa11y | Dashboard monitoring | CLI, CI | Open source |
| Lighthouse | Broad web quality | Chrome, CI | Open source |
| WAVE | Quick visual review | Browser extension | Free |
| Tenon | API-driven testing | REST API | Commercial |
| Deque axe Monitor | Enterprise dashboards | SaaS | Commercial |
| Accessibility Insights | Guided manual plus automated | Browser extension | Free |

### CI Pipeline Integration

```yaml
# GitHub Actions: Accessibility gate
name: Accessibility CI

on: [pull_request]

jobs:
  a11y-automated:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Start server
        run: npm start &

      - name: Wait for server
        run: npx wait-on [local-server]:3000

      - name: axe-core scan
        run: |
          npx @axe-core/cli [local-server]:3000 \
            --tags wcag2a,wcag2aa,wcag22aa \
            --exit \
            --save results/axe-results.json

      - name: Pa11y scan
        run: npx pa11y-ci --config .pa11yci.json

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: a11y-results
          path: results/
```

### Unit Test Integration

```javascript
// Jest plus axe-core for component testing
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button component', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <Button onClick={() => {}}>Submit</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

```javascript
// Cypress plus axe for integration testing
describe('Checkout flow', () => {
  it('should be accessible at each step', () => {
    cy.visit('/checkout/cart');
    cy.injectAxe();
    cy.checkA11y(null, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });

    cy.get('[data-testid="proceed-to-shipping"]').click();
    cy.checkA11y();

    cy.get('[data-testid="proceed-to-payment"]').click();
    cy.checkA11y();
  });
});
```

```javascript
// Playwright plus axe
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage should be accessible', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### Pa11y Configuration

```json
{
  "defaults": {
    "standard": "WCAG2AA",
    "runners": ["axe", "htmlcs"],
    "chromeLaunchConfig": {
      "args": ["--no-sandbox"]
    },
    "timeout": 30000
  },
  "urls": [
    "[local-server]:3000/",
    "[local-server]:3000/login",
    "[local-server]:3000/dashboard",
    "[local-server]:3000/settings",
    {
      "url": "[local-server]:3000/search?q=test",
      "actions": [
        "wait for element #results to be visible"
      ]
    }
  ]
}
```

## Manual Testing Protocol

### Keyboard Testing Procedure

For each page or component, execute these tests:

**Step 1: Tab Through the Page**
1. Place cursor in browser address bar
2. Press Tab repeatedly through the entire page
3. Record every element that receives focus
4. Verify: Does focus order match visual order?
5. Verify: Is every interactive element reachable?
6. Verify: Is the focus indicator always visible?

**Step 2: Operate All Controls**

| Control | Expected Keyboard Behavior |
|---------|---------------------------|
| Link | Enter activates |
| Button | Enter or Space activates |
| Checkbox | Space toggles |
| Radio button | Arrow keys move selection |
| Select/dropdown | Arrow keys navigate, Enter selects |
| Tab widget | Arrow keys switch tabs |
| Accordion | Enter or Space toggles section |
| Menu | Arrow keys navigate, Enter selects, Escape closes |
| Modal | Tab trapped inside, Escape closes |
| Slider | Arrow keys adjust value |
| Tree view | Arrow keys navigate, Enter or Space expand/collapse |
| Combobox | Arrow keys navigate suggestions, Enter selects |
| Date picker | Arrow keys navigate dates, Enter selects |

**Step 3: Check for Keyboard Traps**
- Can you always Tab away from every element?
- Do modals, video players, or rich text editors trap focus?
- Can you escape every state using keyboard alone?

### Visual Inspection Procedure

**Zoom Testing:**
1. Ctrl+0 to reset zoom
2. Ctrl+Plus to zoom to 200% -- verify no content loss or overlap
3. Continue to 400% -- verify content reflows to single column
4. Check horizontal scrolling -- should not be required at 320px equivalent width

**Color and Contrast:**
1. Use Colour Contrast Analyser eyedropper on every text/background pair
2. Check focus indicator contrast against adjacent colors
3. Check non-text contrast (icons, borders, chart elements)
4. Enable Windows High Contrast Mode -- verify all content is visible
5. Use color blindness simulator -- verify all information is distinguishable

**Content Structure:**
1. Use the HeadingsMap browser extension to verify heading hierarchy
2. Use the Web Developer toolbar to outline block-level elements
3. Linearize the page (disable CSS) -- does the content still make sense?
4. Check that all images have appropriate alt text (not just "image")

### Screen Reader Testing Procedure

Test with at least two screen reader plus browser combinations:

**Primary:** NVDA plus Firefox (Windows)
**Secondary:** VoiceOver plus Safari (macOS or iOS)

For each page:

1. **Landing experience** -- What does the screen reader announce when the page loads? Is the page title meaningful?
2. **Landmarks** -- Use the landmark shortcut (D in NVDA). Are the main regions present (banner, navigation, main, contentinfo)?
3. **Headings** -- Use the heading shortcut (H in NVDA). Does the heading outline make sense? Any skipped levels?
4. **Forms** -- Navigate to forms (F in NVDA). Does every field announce its label? Are required fields indicated? Are errors announced?
5. **Links** -- Use the links list (NVDA+F7, then Links tab). Do all links have descriptive text?
6. **Images** -- Are informative images described? Are decorative images hidden?
7. **Tables** -- Navigate into tables. Are headers announced for each cell?
8. **Dynamic content** -- Trigger modals, toasts, errors. Are they announced? Does focus move appropriately?

### Test Case Template

```markdown
## Test Case: [ID] [Feature Name]

**Page/URL**: [URL or screen name]
**Standard**: WCAG 2.2 AA
**Tester**: [Name]
**Date**: [Date]

### Prerequisites
- [Any setup required]

### Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Result
- [What should happen]

### Actual Result
- [ ] Pass
- [ ] Fail: [Description of failure]
- [ ] N/A

### Evidence
- Screenshot: [link]
- Screen reader output: "[what was announced]"

### WCAG Criteria Tested
- [1.1.1 Non-text Content]
- [2.1.1 Keyboard]
- [4.1.2 Name, Role, Value]
```

## Audit Report Structure

### Executive Summary

```markdown
# Accessibility Audit Report

**Product**: [Product Name]
**Audit Date**: [Date Range]
**Standard**: WCAG 2.2 Level AA
**Auditor**: [Name/Organization]

## Executive Summary

[Product] was evaluated against WCAG 2.2 Level AA. The audit covered
[N] pages/screens representing the primary user flows.

### Overall Score
- **Critical issues**: [N] (block users from completing tasks)
- **Major issues**: [N] (significantly degrade the experience)
- **Minor issues**: [N] (cause friction but have workarounds)
- **Total WCAG failures**: [N] across [N] success criteria

### Top 3 Priorities
1. [Most impactful issue]
2. [Second issue]
3. [Third issue]

### Estimated Remediation Effort
- Quick wins (under 1 day each): [N] issues
- Medium effort (1-3 days each): [N] issues
- Significant effort (1 week or more): [N] issues
```

### Issue Detail Format

```markdown
### Issue [ID]: [Short Description]

| Field | Value |
|-------|-------|
| **WCAG Criterion** | [Number] [Name] (Level [A/AA]) |
| **Severity** | Critical / Major / Minor |
| **Pages Affected** | [URLs or "All pages with component X"] |
| **User Impact** | [Who is affected and how] |

**Current Behavior:**
[Description with screenshot]

**Expected Behavior:**
[What should happen]

**Recommended Fix:**
[Specific technical guidance]

**Code Example:**
[Before/after code if applicable]

**Effort Estimate:** [Low / Medium / High]
**Priority:** [P1 / P2 / P3]
```

### Results Summary Table

```markdown
| WCAG Criterion | Level | Result | Issues |
|---------------|-------|--------|--------|
| 1.1.1 Non-text Content | A | Fail | 5 images missing alt text |
| 1.3.1 Info and Relationships | A | Fail | Tables lack headers |
| 1.4.3 Contrast (Minimum) | AA | Fail | 12 text pairs below 4.5:1 |
| 2.1.1 Keyboard | A | Fail | Dropdown not keyboard operable |
| 2.4.7 Focus Visible | AA | Fail | Custom focus styles removed |
```

## Tracking and Metrics

### Accessibility Scorecard

Track these metrics over time:

| Metric | Measurement | Target |
|--------|------------|--------|
| Automated violations | axe-core count per page | 0 |
| Critical issues open | From manual audit | 0 |
| Pages with zero automated violations | Percentage | 100% |
| Time to remediate critical | Days from report to fix | Under 14 days |
| Keyboard operability | Percentage of flows passable by keyboard | 100% |
| Screen reader passability | Percentage of flows usable with screen reader | 100% |
| VPAT/ACR currency | Last update within N months | Under 12 months |

### Regression Prevention

```javascript
// Track violation count over time
// Store results from CI runs in a database or spreadsheet

const previousCount = getPreviousViolationCount();
const currentCount = currentResults.violations.length;

if (currentCount > previousCount) {
  console.error(
    'Accessibility regression: ' + currentCount + ' violations ' +
    '(was ' + previousCount + '). New violations must be fixed before merge.'
  );
  process.exitCode = 1;
}
```

## Testing Schedule

### For Ongoing Products

| Cadence | Activity |
|---------|----------|
| Every pull request | Automated axe-core scan (CI gate) |
| Every sprint | Manual keyboard test of changed components |
| Monthly | Screen reader smoke test of critical flows |
| Quarterly | Full manual audit of representative sample |
| Annually | Comprehensive third-party audit plus VPAT update |
| On demand | User testing with people with disabilities |

### For New Launches

| Phase | Testing Activity |
|-------|-----------------|
| Design | Color contrast check, heading structure review |
| Component development | axe-core unit tests for each component |
| Feature development | Keyboard and screen reader test per feature |
| Pre-launch (4 weeks before) | Full manual audit plus AT testing |
| Pre-launch (2 weeks before) | Remediation verification |
| Post-launch (1 week after) | Spot check with real users |

## Team Training Checklist

### Developer Training (4 hours)
- [ ] Semantic HTML and why it matters
- [ ] Keyboard accessibility fundamentals
- [ ] ARIA: when and how to use it
- [ ] axe-core integration in tests
- [ ] Using a screen reader for 30 minutes

### Designer Training (3 hours)
- [ ] Color contrast requirements and tools
- [ ] Designing focus indicators
- [ ] Touch target sizing
- [ ] Writing alt text
- [ ] Inclusive form design

### QA Training (6 hours)
- [ ] WCAG 2.2 structure overview
- [ ] Automated tool usage (axe, Pa11y, Lighthouse)
- [ ] Keyboard testing procedure
- [ ] Screen reader testing basics (NVDA plus VoiceOver)
- [ ] Writing accessibility bug reports
- [ ] Prioritizing accessibility issues

### Product/PM Training (2 hours)
- [ ] Legal landscape (ADA, EAA, Section 508)
- [ ] Business case for accessibility
- [ ] Reading an accessibility audit report
- [ ] Writing accessible user stories
- [ ] Prioritizing remediation work

## VPAT / Accessibility Conformance Report

When a customer requests a VPAT (Voluntary Product Accessibility Template):

1. Use the ITI VPAT 2.5 template (covers WCAG 2.2, Section 508, EN 301 549)
2. Evaluate every applicable success criterion
3. Use the standard conformance levels:
   - **Supports** -- Fully meets the criterion
   - **Partially Supports** -- Some functionality meets, some does not
   - **Does Not Support** -- The criterion is not met
   - **Not Applicable** -- The criterion does not apply
4. Include specific remarks for anything less than "Supports"
5. Review and update at least annually


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to accessibility testing lead
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Accessibility Testing Lead Analysis

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

**Input:** "Help me with accessibility testing lead for my current situation"

**Output:**

Based on your situation, here is a structured approach to accessibility testing lead:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
