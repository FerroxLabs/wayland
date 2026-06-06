---
name: create-design-system
description: >-
  Comprehensive workflow for building a design system from initial audit through
  design tokens, component library creation, documentation, and organizational
  adoption. Covers the full lifecycle from visual inconsistency to a shared
  design language that scales across teams and products.

  Use when the user wants to create design system or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  component-library css-master tailwind-designer accessibility-auditor
  typescript-guru react-architect docs-site-builder unit-test-writer
  visual-regression-tester changelog-writer
trigger_phrases: >-
  I want to create a design system I need to build a component library How do I
  establish design tokens I want to standardize our UI components
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: accessibility documentation frontend step-by-step planning
  category: software-project
  depends: >-
    component-library css-master tailwind-designer accessibility-auditor
    typescript-guru react-architect docs-site-builder unit-test-writer
    visual-regression-tester changelog-writer
  disclaimer: none
  difficulty: advanced
---
# Create Design System

**Estimated time:** 6-12 weeks

A design system is the single source of truth for your organization's visual language and UI components. It reduces duplication, enforces consistency, improves accessibility, and accelerates development by providing pre-built, tested, documented components. This workflow takes you from a UI audit through design token definition, component development, documentation, and the hardest part: organizational adoption.

The workflow is structured to deliver value incrementally. You will start by auditing what exists, define the foundational tokens, build a small set of core components, document them thoroughly, and then expand based on adoption feedback. A design system that nobody uses is worse than no design system at all -- so adoption strategy is woven throughout.

## When to Use

- User wants to create design system
- User needs a structured, step-by-step process for create design system
- User wants to create a design system
- I need to build a component library
- How do I establish design tokens
- Do NOT use when: the request is outside the scope of create design system or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- An existing product (or products) with UI inconsistencies to resolve
- Design team or design lead who can define visual standards
- Frontend engineering capacity for component development
- Stakeholder support for the investment (design systems take time to pay off)
- Chosen framework (React, Vue, or framework-agnostic Web Components)

## Steps

**Step 1: Audit Existing UI** (uses: accessibility-auditor)

evaluate the current state of your UI. Conduct a visual audit: screenshot every unique button, form element, color, typography style, spacing value, and icon across all products. Catalog the inconsistencies. Run an accessibility audit (WCAG 2.2 Level AA) to identify violations that the design system must address. This audit becomes your "before" baseline and prioritization input.

- Input: Existing product(s) with their UI, Any existing style guides or brand guidelines, Known accessibility issues
- Output: Visual inventory: catalog of every unique UI pattern in use, Inconsistency report (e.g., "17 different button styles found"), Accessibility audit report with WCAG violations
- Key focus: Use the Accessibility Auditor skill to evaluate the current state of your UI

**Step 2: Define Design Tokens** (uses: css-master)

define your design token architecture: the atomic values (colors, spacing, typography, shadows, borders, breakpoints) that every component will reference. Use the Tailwind Designer skill if you are using Tailwind to map tokens to a custom theme configuration. Design tokens in three tiers: global (raw values), semantic (purpose-based aliases), and component (component-specific supersedes). Ensure tokens support dark mode and high-contrast themes from the start.

- Input: Brand guidelines (colors, typography, spacing), Audit results from Step 1, Multi-theme requirements (dark mode, high contrast)
- Output: Design token specification (JSON/YAML format), Color palette with semantic aliases (primary, secondary, success, error, etc.), Typography scale (font families, sizes, weights, line heights)
- Key focus: Use the CSS Master skill to define your design token architecture: the atomic values (colors, spacing, typography, shadows, borders, breakpoints) that every component will reference

**Step 3: Build Core Components** (uses: component-library)

design component APIs that are composable, accessible, and flexible. Use the React Architect skill (or equivalent for your framework) to implement the components with proper TypeScript types, ref forwarding, and polymorphic props (as/component pattern). Start with the 8-12 foundational components: Button, Input, Select, Checkbox, Radio, TextArea, Card, Modal, Toast, Badge, Avatar, and Spinner. Each component must be fully accessible by default (keyboard navigation, ARIA attributes, focus management).

- Input: Design tokens from Step 2, Prioritized component list from Step 1, Framework choice (React, Vue, etc.)
- Output: 8-12 core components with full TypeScript types, Component API documentation (props, variants, sizes), Accessibility implementation (ARIA, keyboard nav, focus management)
- Key focus: Use the Component Library skill to design component APIs that are composable, accessible, and flexible

**Step 4: Test Components Thoroughly** (uses: unit-test-writer)

write unit tests for component behavior (interactions, state changes, prop variations). Use the Visual Regression skill to set up visual regression testing that catches unintended visual changes. Re-run the Accessibility Auditor skill to verify every component meets WCAG 2.2 Level AA. Test across supported browsers and devices. The test suite must be fast enough to run in CI on every PR.

- Input: Components from Step 3, Visual design specifications, Browser/device support requirements
- Output: Unit test suite (behavior and interaction tests), Visual regression test baseline screenshots, Accessibility test suite (automated axe-core + manual checklist)
- Key focus: Use the Unit Test Writer skill to write unit tests for component behavior (interactions, state changes, prop variations)

**Step 5: Build Documentation Site** (uses: docs-site-builder)

create a documentation site that serves as the design system's home. Include: live component playground (interactive props), copy-pasteable code examples, design token reference, accessibility guidelines, getting started guide, contribution guide, and migration guide from old patterns. The docs site is the design system's marketing material -- it must be excellent.

- Input: Components from Step 3, Design tokens from Step 2, Target audience (designers, developers, product managers)
- Output: Documentation site with live component playground, Getting started guide (install, configure, use first component), Component API reference with interactive examples
- Key focus: Use the Docs Site Builder skill to create a documentation site that serves as the design system's home

**Step 6: Establish Versioning and Release Process** (uses: changelog-writer)

establish a versioning and release process. Follow semantic versioning strictly: patch for bug fixes, minor for new features and new components, major for breaking API changes. Automate changelog generation from conventional commits. Set up a release pipeline that publishes to your package registry (npm, internal registry). Create a deprecation policy: components and props get deprecated warnings for at least one major version before removal.

- Input: Component library package, Consumer applications, Breaking change expectations
- Output: Semantic versioning policy, Automated changelog generation, Release pipeline (npm publish on tag)
- Key focus: Use the Changelog Writer skill to establish a versioning and release process

**Step 7: Drive Adoption** (uses: component-library)

develop an adoption strategy. Start with one willing team as a pilot. Help them migrate their most-used components and measure the reduction in CSS and custom component code. Create codemods or migration scripts for common patterns. Track adoption metrics: percentage of UI using design system components, number of custom components replaced, and developer satisfaction scores. Address resistance by showing time savings and quality improvements.

- Input: Published design system package, Product teams as consumers, Existing component usage in products
- Output: Adoption metrics dashboard, Migration scripts/codemods for common patterns, Pilot team case study with measured improvements
- Key focus: Use the Component Library skill to develop an adoption strategy

## Decision Points

- **After Step ?:** 
  - If **After Step 1**: Expand audit scope to cover missed surfaces
  - If **After Step 3**: Fix accessibility issues before testing and docs
  - If **After Step 5**: Improve docs until a developer can self-serve
  - If **After Step 7 (pilot)**: Address pilot team feedback before wider rollout

## Failure Handling

- **Building too many components too fast:** -- Start with 8-12 core components and prove adoption before expanding. Unused components are wasted effort.
- **Designing in isolation:** -- A design system built without consumer input will not match consumer needs. Co-design with product teams.
- **Accessibility as an afterthought:** -- Retrofitting accessibility is expensive. Build it in from the first component.
- **No adoption strategy:** -- "Build it and they will come" does not work. Actively drive adoption with migration support, codemods, and measurement.
- **Token inconsistency:** -- If tokens are not used consistently, the design system's visual consistency breaks. Lint for direct color/spacing values.

## Expected Outcome

When this workflow is complete, the user will have:

1. Design system covers 80%+ of UI patterns across products
2. New features are built with design system components by default
3. Accessibility compliance improves measurably across all products
4. Developer velocity increases (measured by reduced CSS and custom component code)
5. Visual consistency score improves (measured by reduced unique design patterns)
6. Design system documentation has high satisfaction scores (> 4/5)

## Output Format

```
CREATE DESIGN SYSTEM TRACKER
============================

[ ] Step 1: Audit Existing UI
    Status: [pending/in-progress/complete]
[ ] Step 2: Define Design Tokens
    Status: [pending/in-progress/complete]
[ ] Step 3: Build Core Components
    Status: [pending/in-progress/complete]
[ ] Step 4: Test Components Thoroughly
    Status: [pending/in-progress/complete]
[ ] Step 5: Build Documentation Site
    Status: [pending/in-progress/complete]
[ ] Step 6: Establish Versioning and Release Process
    Status: [pending/in-progress/complete]
[ ] Step 7: Drive Adoption
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Building too many components too fast:** -- Start with 8-12 core components and prove adoption before expanding. Unused components are wasted effort.
- **Designing in isolation:** -- A design system built without consumer input will not match consumer needs. Co-design with product teams.
- **Accessibility as an afterthought:** -- Retrofitting accessibility is expensive. Build it in from the first component.
- **No adoption strategy:** -- "Build it and they will come" does not work. Actively drive adoption with migration support, codemods, and measurement.

## Example

**Input:** "I want to create design system and need a structured plan to follow step by step."

**Output:**

**Step 1 (accessibility-auditor):** Audit Existing UI -- produces concrete deliverables for this phase.

**Step 2 (css-master-tailwind-designer):** Define Design Tokens -- produces concrete deliverables for this phase.

**Step 3 (component-library-react-architect-typescript-guru):** Build Core Components -- produces concrete deliverables for this phase.

**Step 4 (unit-test-writer-visual-regression-accessibility-auditor):** Test Components Thoroughly -- produces concrete deliverables for this phase.

**Step 5 (docs-site-builder):** Build Documentation Site -- produces concrete deliverables for this phase.

**Step 6 (changelog-writer):** Establish Versioning and Release Process -- produces concrete deliverables for this phase.

**Step 7 (component-library):** Drive Adoption -- produces concrete deliverables for this phase.

**Result:** User has a complete create design system plan with all deliverables produced, validated, and ready for implementation.
