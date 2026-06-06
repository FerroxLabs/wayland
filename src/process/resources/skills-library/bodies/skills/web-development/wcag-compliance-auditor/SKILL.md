---
name: wcag-compliance-auditor
description: |
  Audit digital products against WCAG 2.1/2.2 standards, determine conformance levels, identify failures, and produce actionable remediation plans with prioritized fixes.
  Use when the user asks about wcag compliance auditor, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of wcag compliance auditor or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "accessibility checklist template guide javascript testing analysis planning"
  category: "web-development"
  subcategory: "accessibility-performance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# WCAG Compliance Auditor

You are an expert web accessibility auditor specializing in WCAG 2.1 and 2.2 conformance testing. You help teams understand which success criteria apply to their product, identify violations through systematic evaluation, and produce clear remediation guidance that developers and designers can act on immediately.


## When to Use

**Use this skill when:**
- User asks about wcag compliance auditor techniques or best practices
- User needs guidance on wcag compliance auditor concepts
- User wants to implement or improve their approach to wcag compliance auditor

**Do NOT use when:**
- The request falls outside the scope of wcag compliance auditor
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. What is the target conformance level (A, AA, or AAA)?
2. Is this a new build, a redesign, or an audit of an existing product?
3. What technologies are in use (HTML, React, Angular, Vue, mobile native, PDF)?
4. Are there legal or contractual requirements driving the audit (ADA, Section 508, EN 301 549, EAA)?
5. What is the scope - full site, critical user journeys, or specific components?
6. Do you have access to a staging environment or only production?

## WCAG Structure Overview

### The Four Principles (POUR)

| Principle | Meaning | Key Areas |
|-----------|---------|-----------|
| **Perceivable** | Users can perceive all content | Text alternatives, captions, contrast, reflow |
| **Operable** | Users can operate all controls | Keyboard, timing, seizures, navigation |
| **Understandable** | Users can understand content and UI | Readable, predictable, input assistance |
| **Robust** | Content works with assistive technologies | Parsing, name/role/value, status messages |

### Conformance Levels

- **Level A** - Minimum baseline. Removes the most severe barriers. 30 criteria in WCAG 2.1.
- **Level AA** - Standard target for most regulations worldwide. 20 additional criteria.
- **Level AAA** - Highest level. Aspirational for most sites; required for specific contexts.
- **WCAG 2.2** - Adds 9 new success criteria (6 at A/AA) focused on cognitive, mobile, and authentication.

## Audit Methodology

### Phase 1: Scope and Planning

Define the audit sample using the WCAG-EM (Website Accessibility Conformance Evaluation Methodology):

1. **Define the evaluation scope** - URLs, states, user flows
2. **Explore the target website** - Identify technologies, templates, components
3. **Select a representative sample** - Structured sample (common pages) + random sample
4. **Audit the sample** - Test each page against all applicable success criteria
5. **Report the findings** - Document results with evidence

Sample selection checklist:
- Home page
- Login / authentication flow
- Primary navigation path
- Search results page
- Form submission flow (at least one)
- Error state pages
- Content-heavy page (articles, documentation)
- Interactive component page (modals, tabs, accordions)
- Account settings or profile page
- At least 10% random pages from the full sitemap

### Phase 2: Automated Testing

Run automated tools first to catch the low-hanging fruit. Automated tools typically find 30-40% of WCAG issues.

```shell
# axe-core CLI scan
npx @axe-core/cli [your-site-url] --tags wcag2a,wcag2aa,wcag22aa

# Lighthouse accessibility audit
npx lighthouse [your-site-url] --only-categories=accessibility --output=json

# Pa11y with WCAG 2.2 AA standard
npx pa11y [your-site-url] --standard WCAG2AA --runner axe --runner htmlcs
```

```javascript
// axe-core in-browser or integration tests
import axe from 'axe-core';

async function auditPage() {
  const results = await axe.run(document, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag22aa']
    }
  });

  console.log('Violations:', results.violations.length);
  results.violations.forEach(v => {
    console.log(`[${v.impact}] ${v.id}: ${v.description}`);
    console.log(`  WCAG: ${v.tags.filter(t => t.startsWith('wcag')).join(', ')}`);
    console.log(`  Nodes affected: ${v.nodes.length}`);
  });
}
```

### Phase 3: Manual Testing

Manual testing catches the remaining 60-70% of issues. Work through each category systematically.

#### Keyboard Testing Checklist

| Test | Pass Criteria |
|------|---------------|
| Tab through entire page | All interactive elements receive focus in logical order |
| Activate links and buttons | Enter activates links; Enter/Space activates buttons |
| Operate dropdowns and menus | Arrow keys navigate; Escape closes |
| Navigate modals | Focus trapped inside; Escape closes; focus returns to trigger |
| Skip navigation | Skip link present and functional |
| No keyboard traps | Can always Tab away from every element |
| Focus visible | Clear visible focus indicator on every interactive element |
| Custom widgets | Follow ARIA Authoring Practices Guide patterns |

#### Screen Reader Testing Matrix

| Screen Reader | Browser | OS | Priority |
|---------------|---------|-----|----------|
| NVDA | Firefox | Windows | High |
| NVDA | Chrome | Windows | High |
| JAWS | Chrome | Windows | High |
| VoiceOver | Safari | macOS | High |
| VoiceOver | Safari | iOS | High |
| TalkBack | Chrome | Android | Medium |

#### Visual Testing Checklist

- Zoom to 200% - no loss of content or functionality (1.4.4)
- Zoom to 400% - content reflows to single column (1.4.10)
- Test with Windows High Contrast Mode
- Verify color contrast ratios (4.5:1 normal text, 3:1 large text at AA)
- Confirm information is not conveyed by color alone (1.4.1)
- Check text spacing supersede: line-height 1.5, paragraph spacing 2x, word spacing 0.16em, letter spacing 0.12em (1.4.12)

### Phase 4: WCAG 2.2 Specific Criteria

These criteria were added in WCAG 2.2 and are often missed:

| Criterion | Level | What to Test |
|-----------|-------|-------------|
| 2.4.11 Focus Not Obscured (Minimum) | AA | Focused element is not entirely hidden by sticky headers/footers |
| 2.4.12 Focus Not Obscured (Enhanced) | AAA | Focused element is fully visible |
| 2.4.13 Focus Appearance | AAA | Focus indicator meets minimum area and contrast |
| 2.5.7 Dragging Movements | AA | Single-pointer alternative exists for drag operations |
| 2.5.8 Target Size (Minimum) | AA | Touch targets at least 24x24 CSS px (with exceptions) |
| 3.2.6 Consistent Help | A | Help mechanisms in same relative location across pages |
| 3.3.7 Redundant Entry | A | Previously entered info is auto-populated or selectable |
| 3.3.8 Accessible Authentication (Minimum) | AA | No cognitive function test for login (unless alternative provided) |
| 3.3.9 Accessible Authentication (Enhanced) | AAA | No cognitive function test, no object recognition |

## Reporting Template

### Issue Documentation Format

For each violation, document:

```markdown
### Issue: [Short Description]

- **WCAG Criterion**: [Number] [Name] (Level [A/AA/AAA])
- **Severity**: Critical / Major / Minor / Advisory
- **Impact**: [Which users are affected and how]
- **Page/Component**: [URL or component name]
- **Current State**: [What happens now - include screenshot]
- **Expected State**: [What should happen]
- **Remediation**: [Specific code fix or design change]
- **Effort Estimate**: Low / Medium / High
```

### Severity Definitions

| Severity | Definition | SLA Guidance |
|----------|-----------|--------------|
| **Critical** | Blocks a user group from completing a core task | Fix before launch or within 1 sprint |
| **Major** | Significantly degrades the experience for a user group | Fix within 2 sprints |
| **Minor** | Causes friction but workarounds exist | Fix within 1 quarter |
| **Advisory** | Best practice improvement, not a WCAG failure | Backlog |

### Prioritization Matrix

Prioritize fixes using this order:
1. Critical issues on high-traffic pages or core flows
2. Critical issues on secondary pages
3. Major issues on high-traffic pages
4. Systematic issues (affects every page - fix once, fix everywhere)
5. Major issues on secondary pages
6. Minor issues by page traffic

## Common Violation Patterns and Fixes

### Missing Alternative Text (1.1.1)

```html
<!-- Failure -->
<img src="chart.png">

<!-- Fix: Informative image -->
<img src="chart.png" alt="Bar chart showing Q3 revenue of $4.2M, up 12% from Q2">

<!-- Fix: Decorative image -->
<img src="decorative-line.png" alt="" role="presentation">
```

### Insufficient Color Contrast (1.4.3)

```css
/* Failure: 2.5:1 ratio */
.muted-text {
  color: #999999;
  background: #ffffff;
}

/* Fix: 4.6:1 ratio - meets AA */
.muted-text {
  color: #767676;
  background: #ffffff;
}
```

### Missing Form Labels (1.3.1, 4.1.2)

```html
<!-- Failure -->
<input type="email" placeholder="Email address">

<!-- Fix -->
<label for="email">Email address</label>
<input type="email" id="email" autocomplete="email">
```

### Keyboard Trap (2.1.2)

```javascript
// Failure: traps focus in modal with no escape
modal.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    // cycles focus but no way out
  }
});

// Fix: allow Escape to close
modal.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    triggerButton.focus(); // return focus to trigger
  }
  if (e.key === 'Tab') {
    trapFocusWithinModal(e); // cycle within modal only
  }
});
```

### Missing Skip Navigation (2.4.1)

```html
<!-- Add as first focusable element in the page -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px 16px;
  background: #000;
  color: #fff;
  z-index: 100;
}
.skip-link:focus {
  top: 0;
}
</style>

<main id="main-content" tabindex="-1">
  <!-- Page content -->
</main>
```

## Integration with Development Workflow

### CI/CD Pipeline Integration

```yaml
# GitHub Actions example
accessibility-audit:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Install dependencies
      run: npm ci
    - name: Start dev server
      run: npm start &
    - name: Run axe scan
      run: |
        npx @axe-core/cli [local-dev-url] \
          --tags wcag2a,wcag2aa \
          --exit
    - name: Run Pa11y
      run: |
        npx pa11y-ci --config .pa11yci.json
```

### Definition of Done - Accessibility Criteria

Every feature should meet these before merge:
- [ ] axe-core reports zero violations at AA level
- [ ] All interactive elements are keyboard operable
- [ ] Focus order is logical
- [ ] Color contrast passes 4.5:1 for normal text, 3:1 for large text
- [ ] All images have appropriate alt text
- [ ] Forms have visible labels and error messages
- [ ] Page tested at 200% zoom with no content loss
- [ ] Tested with at least one screen reader

## Regulatory Reference

| Regulation | Region | Standard | Level |
|------------|--------|----------|-------|
| ADA Title III | United States | WCAG 2.1 AA (DOJ 2024 rule) | AA |
| Section 508 | United States (federal) | WCAG 2.0 AA | AA |
| EN 301 549 | European Union | WCAG 2.1 AA | AA |
| European Accessibility Act | EU (from June 2025) | WCAG 2.1 AA minimum | AA |
| AODA | Ontario, Canada | WCAG 2.0 AA | AA |
| Accessibility Regulations 2018 | United Kingdom | WCAG 2.1 AA | AA |

## Tools Reference

| Tool | Type | Strength |
|------|------|----------|
| axe DevTools | Browser extension + CI | Industry standard, low false positives |
| WAVE | Browser extension | Visual overlay of issues |
| Lighthouse | Browser + CI | Broad coverage, performance too |
| Pa11y | CI / CLI | Good for dashboards and monitoring |
| ARC Toolkit | Browser extension | Strong for manual assessment |
| Colour Contrast Analyser | Desktop app | Eyedropper for any on-screen content |
| ANDI | Bookmarklet | Section 508 focused, free |
| Accessibility Insights | Browser + Windows | Guided manual assessments |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to wcag compliance auditor
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Wcag Compliance Auditor Analysis

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

**Input:** "Help me with wcag compliance auditor for my current situation"

**Output:**

Based on your situation, here is a structured approach to wcag compliance auditor:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
