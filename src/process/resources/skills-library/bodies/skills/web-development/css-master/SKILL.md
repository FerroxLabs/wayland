---
name: css-master
description: |
  Advanced CSS expertise covering Grid and Flexbox mastery, custom properties architecture, responsive design methodology, CSS methodology selection, animation performance, container queries, cascade layers, and specificity management.
  Use when the user asks about css master, css master best practices, or needs guidance on css master implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "web-development frontend html-css"
  category: "web-development"
  subcategory: "html-css-web"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# CSS Master

## Purpose

Provide expert-level CSS guidance for building maintainable, performant, and responsive user interfaces. This skill covers layout systems, architectural patterns, modern CSS features, and methodology selection for teams of any size.

## Grid vs Flexbox Decision Framework

```
LAYOUT DECISION TREE:

Is the layout one-dimensional (row OR column)?
  YES -> Flexbox
  NO  -> Is it two-dimensional (rows AND columns)?
    YES -> Grid

Additional signals for Grid:
  - Content needs to align to a defined grid structure
  - Overlapping elements needed (grid-area overlap)
  - Template-based layout (named areas)
  - Item placement should be independent of source order

Additional signals for Flexbox:
  - Items should distribute along a single axis
  - Content size should drive layout
  - Simple centering needed
  - Navigation bars, toolbars, card rows
```

### Grid Mastery

```css
/* Responsive grid without media queries */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 1.5rem;
}

/* Named template areas for page layout */
.page-layout {
  display: grid;
  grid-template-areas:
    "header  header  header"
    "sidebar content aside"
    "footer  footer  footer";
  grid-template-columns: 250px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
}

/* Subgrid for aligned child layouts */
.card-grid {
  display: grid;
  # ... (condensed) ...
}
.hero > * {
  grid-area: 1 / 1;
}
.hero-overlay {
  z-index: 1;
  align-self: end;
}
```

### Flexbox Mastery

```css
/* Holy grail centering */
.center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Sticky footer with flex */
body {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}
main { flex: 1; }

/* Space-between with wrapping fallback */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;
}

/* Flex basis for responsive columns without media queries */
.flex-columns > * {
  flex: 1 1 300px; /* Grow, shrink, break at 300px */
}
```

## CSS Custom Properties Architecture

### Token System

```css
/* Layer 1: Primitive tokens (design-agnostic) */
:root {
  --color-blue-50: #eff6ff;
  --color-blue-500: #3b82f6;
  --color-blue-900: #1e3a5c;
  --color-gray-100: #f3f4f6;
  --color-gray-900: #111827;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-8: 2rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-full: 9999px;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
}

/* Layer 2: Semantic tokens (intent-based) */
:root {
  --color-text-primary: var(--color-gray-900);
  # ... (condensed) ...

/* Dark mode via semantic token supersede */
[data-theme="dark"] {
  --color-text-primary: var(--color-gray-100);
  --color-bg-primary: var(--color-gray-900);
  --color-bg-surface: var(--color-gray-800);
  --color-border: var(--color-gray-700);
}
```

### Responsive Custom Properties

```css
:root {
  --content-width: 90vw;
  --sidebar-width: 0px;
  --header-height: 3.5rem;
}

@media (min-width: 768px) {
  :root {
    --content-width: min(80vw, 1200px);
    --sidebar-width: 250px;
    --header-height: 4rem;
  }
}
```

## Responsive Design Methodology

### Mobile-First Breakpoint System

```css
/* Base: Mobile (0px+) -- no media query needed */
.container { padding: var(--space-4); }

/* Tablet (768px+) */
@media (min-width: 48em) {
  .container { padding: var(--space-8); }
}

/* Desktop (1024px+) */
@media (min-width: 64em) {
  .container { max-width: 1200px; margin-inline: auto; }
}

/* Wide (1440px+) */
@media (min-width: 90em) {
  .container { max-width: 1400px; }
}
```

### Fluid Typography

```css
/* clamp(min, preferred, max) */
:root {
  --font-size-h1: clamp(2rem, 1.5rem + 2.5vw, 4rem);
  --font-size-h2: clamp(1.5rem, 1.25rem + 1.25vw, 2.5rem);
  --font-size-body: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
}

/* Fluid spacing */
:root {
  --space-fluid-sm: clamp(0.5rem, 0.4rem + 0.5vw, 1rem);
  --space-fluid-md: clamp(1rem, 0.75rem + 1.25vw, 2rem);
  --space-fluid-lg: clamp(2rem, 1.5rem + 2.5vw, 4rem);
}
```

## Container Queries

```css
/* Define containment context */
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* Query container size (not viewport) */
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
  }
}

@container card (min-width: 600px) {
  .card {
    grid-template-columns: 250px 1fr 150px;
  }
}

/* Container query units */
.card-title {
  font-size: clamp(1rem, 3cqi, 1.5rem); /* cqi = container query inline */
}

/* Style queries (check custom property values) */
@container style(--variant: compact) {
  .card { padding: var(--space-2); }
}
```

## Cascade Layers

```css
/* Define layer order (lowest to highest priority) */
@layer reset, base, components, utilities;

/* Reset layer (lowest priority) */
@layer reset {
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
  }
}

/* Base layer */
@layer base {
  body {
    font-family: system-ui, sans-serif;
    color: var(--color-text-primary);
    background: var(--color-bg-primary);
    line-height: 1.6;
  }
  a { color: var(--color-brand); }
}

# ... (condensed) ...
  .text-center { text-align: center; }
  .hidden { display: none; }
}

/* Third-party CSS in low-priority layer */
@layer vendor {
  @import url('third-party.css');
}
```

## CSS Methodology Selection

### Decision Matrix

| Factor | BEM | Utility-First (Tailwind) | CSS Modules | CSS-in-JS |
|---|---|---|---|---|
| Team size | Any | Any | Small-Medium | Small-Medium |
| Framework | Any | Any | React/Vue | React |
| Runtime cost | None | None | None | Variable |
| Learning curve | Low | Medium | Low | Medium |
| Component scoping | Convention | N/A (class collision safe) | Automatic | Automatic |
| Design system | Good | Excellent | Good | Excellent |
| SSR support | Full | Full | Full | Requires setup |
| Bundle size | Medium | Small (purge) | Small | Variable |

### BEM Naming Convention

```css
/* Block */
.card { }

/* Element (part of block) */
.card__header { }
.card__body { }
.card__footer { }

/* Modifier (variation) */
.card--featured { }
.card--compact { }
.card__header--sticky { }
```

## Specificity Management

### Specificity Hierarchy (Low to High)

```
1. Universal selector (*)          -> 0,0,0
2. Element selectors (div, p)      -> 0,0,1
3. Class, attribute, pseudo-class  -> 0,1,0
4. ID selectors (#id)              -> 1,0,0
5. Inline styles                   -> 1,0,0,0
6. !important                      -> Supersedes all

CASCADE LAYERS supersede specificity:
  Unlayered styles beat layered styles (regardless of specificity).
  Within a layer, normal specificity rules apply.
```

### Specificity Strategies

```css
/* AVOID: Specificity wars */
#sidebar .nav .nav-item a.active { }  /* 1,3,1 -- nightmare */

/* PREFER: Flat selectors */
.nav-item-active { }                   /* 0,1,0 -- manageable */

/* Use :where() to zero-out specificity */
:where(.card, .panel, .modal) {
  border-radius: var(--radius-md);     /* 0,0,0 specificity */
}

/* Use :is() for grouping (takes highest specificity) */
:is(h1, h2, h3) {
  line-height: 1.2;                   /* 0,0,1 specificity */
}

/* Use @layer to manage third-party CSS conflicts */
@layer vendor, app;
@layer vendor { /* third-party CSS here */ }
@layer app { /* your CSS always wins */ }
```

## Animation Performance

### Rules for Performant Animation

```
ANIMATE ONLY (compositor-friendly properties):
  - transform (translate, scale, rotate)
  - opacity
  - filter (with caution)

NEVER ANIMATE:
  - width, height (triggers layout)
  - top, left, right, bottom (triggers layout)
  - margin, padding (triggers layout)
  - border-width (triggers layout)
  - font-size (triggers layout)
```

### High-Performance Animation Patterns

```css
/* Promote to own compositor layer */
.animated-element {
  will-change: transform;  /* Only when actively animating */
  transform: translateZ(0); /* Fallback for older browsers */
}

/* Use transform instead of position changes */
.slide-in {
  transform: translateX(-100%);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-in.active {
  transform: translateX(0);
}

/* View Transitions API */
.page-element {
  view-transition-name: hero-image;
}
::view-transition-old(hero-image) {
  animation: fade-out 200ms ease-out;
}
# ... (condensed) ...
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Modern CSS Features Checklist

```
WIDELY SUPPORTED (use freely):
  [x] CSS Grid (including subgrid)
  [x] CSS Custom Properties
  [x] clamp(), min(), max()
  [x] aspect-ratio
  [x] gap (in flexbox and grid)
  [x] :is(), :where()
  [x] logical properties (margin-inline, padding-block)
  [x] color-scheme
  [x] accent-color
  [x] Container queries (@container)
  [x] Cascade layers (@layer)
  [x] :has() selector
  [x] Nesting

PROGRESSIVE ENHANCEMENT:
  [~] View Transitions API
  [~] Scroll-driven animations
  [~] anchor positioning
  [~] @scope
  [~] CSS @property (registered custom properties)
```

## CSS Architecture Checklist

- [ ] Custom properties organized in primitive, semantic, component layers
- [ ] Mobile-first responsive approach with consistent breakpoints
- [ ] Fluid typography with clamp() replacing fixed breakpoint sizes
- [ ] Grid used for 2D layouts, Flexbox for 1D distribution
- [ ] Container queries for component-level responsiveness
- [ ] Cascade layers ordering third-party CSS appropriately
- [ ] Specificity kept flat (avoid IDs, deep nesting)
- [ ] Animations use only transform and opacity
- [ ] prefers-reduced-motion respected globally
- [ ] prefers-color-scheme handled for dark mode
- [ ] Logical properties used instead of physical (margin-inline vs margin-left)
- [ ] No !important except in utility layer
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus styles visible and consistent

## When to Use

**Use this skill when:**
- Designing or implementing css master solutions
- Reviewing or improving existing css master approaches
- Making architectural or implementation decisions about css master
- Learning css master patterns and best practices
- Troubleshooting css master-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Css Master Analysis

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

**Input:** "Help me implement css master for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended css master approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When css master must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
