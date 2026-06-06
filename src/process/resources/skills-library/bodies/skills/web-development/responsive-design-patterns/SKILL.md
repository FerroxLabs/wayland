---
name: responsive-design-patterns
description: |
  Guides expert-level responsive design patterns implementation: html-css and responsive-design decision frameworks, production-ready patterns, and concrete templates for responsive design patterns workflows.
  Use when the user asks about responsive design patterns, responsive design patterns configuration, or html-css best practices for responsive projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "html-css responsive-design web-development"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Responsive Design Patterns

## When to Use

**Use this skill when:**
- The user is building or refactoring a UI that must work across a range of viewport widths -- typically from 320px (small mobile) through 1440px+ (wide desktop) -- and needs a concrete layout strategy
- The user asks about specific CSS techniques such as fluid grids, flexbox vs. CSS Grid, container queries, clamp-based typography, or intrinsic sizing
- The user wants to choose between mobile-first and desktop-first breakpoint strategies for a production project
- The user needs to implement a specific responsive pattern -- card grids that reflow, navigation that collapses to a hamburger menu, responsive tables, or fluid hero sections -- and wants production-ready code
- The user is diagnosing a responsive layout bug (overflow issues, content collapsing, images stretching) and needs to identify the root cause and fix it
- The user wants to audit or improve an existing responsive system and needs a structured evaluation framework
- The user is setting up a design token and breakpoint system for a component library or design system and needs guidance on scale, naming, and usage conventions
- The user needs to decide whether to use CSS media queries, container queries, or a combination for component-level responsiveness

**Do NOT use this skill when:**
- The user needs help with a CSS preprocessor (Sass, Less) architecture that is not specifically about responsiveness -- check the CSS architecture skill instead
- The user is asking about responsive email design, which follows entirely different constraints (table-based layout, inlined styles, limited CSS support)
- The user needs performance optimization for images or video (lazy loading, srcset, WebP conversion) beyond the layout-level responsive image technique -- check the web performance skill
- The user needs accessibility guidance beyond what is directly tied to responsive layout (keyboard navigation, ARIA, color contrast) -- check the web accessibility skill
- The user is working in a native mobile framework (React Native, Flutter, SwiftUI) where CSS-based responsive patterns do not apply
- The user needs a full CSS framework evaluation (Tailwind vs. Bootstrap vs. plain CSS) -- this skill provides framework-agnostic patterns, not framework selection
- The user needs server-side user-agent detection for device targeting -- that is a backend concern outside this skill's scope

---

## Process

### 1. Clarify the Layout Context and Constraints

Before writing any CSS, establish the full context to avoid rework:

- Identify the viewport range: confirm the minimum supported width (320px for modern mobile, 375px for most projects post-2020) and maximum content width (typically 1200px--1440px for content containers, uncapped for full-bleed backgrounds)
- Identify the component or layout type: is this a macro layout (page shell, sidebar + content), a meso layout (card grid, data table), or a micro layout (individual component internals like a media object or a button group)?
- Determine whether the breakpoints should be viewport-relative or container-relative -- container queries are appropriate when the same component appears in both a narrow sidebar and a wide main area
- Ask whether there is an existing breakpoint scale in use (e.g., from a design system) or whether you are establishing new ones -- mixing ad-hoc and systematic breakpoints creates unmaintainable code
- Confirm the browser support matrix: container queries require Chrome 105+, Safari 16+, Firefox 110+ -- if legacy support is needed, a flexbox fallback strategy is required

### 2. Choose the Responsive Strategy

Select from the four primary responsive strategies based on content type and context:

- **Fluid + fixed hybrid (most common):** Use a max-width container with horizontal auto margins for the content column, fluid widths (percentages or fr units) for internal layout, and fixed padding/gaps in rem or px. This gives predictable content width at large viewports and fluid behavior at small ones.
- **Intrinsic / auto-fit grid (content-driven):** Use CSS Grid with `auto-fit` or `auto-fill` and `minmax()` for card grids and galleries. No media queries needed for reflowing -- the grid self-organizes based on available space. Use `minmax(min(280px, 100%), 1fr)` to prevent overflow on small viewports.
- **Container query approach (component-level):** Define `container-type: inline-size` on the parent, then use `@container` rules inside components. This decouples the component's responsive behavior from the page layout, enabling true reuse in any context.
- **Clamp-based fluid scaling (typography and spacing):** Use `clamp(min, preferred, max)` for font sizes and spacing that should scale continuously without breakpoint jumps. The preferred value uses `vw`-based or `cqi`-based interpolation.

Decision framework:
- Page-level shell layouts → fluid + fixed hybrid
- Repeating item grids (cards, tiles, thumbnails) → intrinsic auto-fit grid
- Shared components used in multiple layout contexts → container queries
- Typography and vertical rhythm → clamp-based fluid scaling
- Combining all four is normal and correct in a mature design system

### 3. Establish the Breakpoint System

Design a breakpoint scale that is semantic, minimal, and tied to content rather than specific device models:

- Use 3--5 breakpoints as named custom properties or Sass variables. Typical production scale:
  - `--bp-sm: 480px` -- where single-column mobile layout gains breathing room
  - `--bp-md: 768px` -- tablet-range, sidebar patterns become viable
  - `--bp-lg: 1024px` -- desktop navigation patterns, multi-column content
  - `--bp-xl: 1280px` -- wide desktop optimizations, content max-width kicks in
- Write media queries mobile-first using `min-width`. This means the base styles are the narrowest, and each breakpoint adds or modifies layout as more space becomes available
- Never use `max-width` media queries in a mobile-first system except as a targeted override for a specific isolated case -- mixing min and max breakpoints creates overlap bugs
- Name breakpoints semantically (`sm`, `md`, `lg`, `xl`) rather than by device names (`mobile`, `tablet`, `desktop`) -- device categories shift over time, pixel ranges do not
- Avoid breakpoint proliferation: if you find yourself needing a breakpoint at an arbitrary value like 537px, the layout is fighting the content -- use intrinsic sizing or clamp instead
- Set `box-sizing: border-box` globally and a consistent base font size (typically `font-size: 16px` on `:root`) before any responsive work

### 4. Implement the Layout Patterns

Apply the selected strategy with production-ready CSS idioms:

**Fluid container pattern:**
```css
.container {
  width: min(100% - 2rem, 1200px);
  margin-inline: auto;
}
```
The `min()` function eliminates the need for a separate `max-width` + `padding` combination and prevents overflow at any viewport.

**Intrinsic auto-fit grid:**
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: clamp(1rem, 3vw, 2rem);
}
```

**Container query component:**
```css
.card-wrapper {
  container-type: inline-size;
}

.card {
  display: grid;
  grid-template-rows: auto 1fr auto;
}

@container (min-width: 400px) {
  .card {
    grid-template-columns: 140px 1fr;
    grid-template-rows: 1fr auto;
  }
}
```

**Clamp typography scale:**
```css
:root {
  --text-base: clamp(1rem, 0.875rem + 0.625vw, 1.25rem);
  --text-lg:   clamp(1.125rem, 1rem + 0.75vw, 1.5rem);
  --text-xl:   clamp(1.375rem, 1.125rem + 1.25vw, 2rem);
  --text-2xl:  clamp(1.75rem, 1.25rem + 2.5vw, 3rem);
}
```
The clamp formula: `clamp(min, min + (max - min) * ((100vw - min-vw) / (max-vw - min-vw)), max)` -- simplified to linear interpolation between two viewport anchors.

**Responsive navigation (no-JS mobile-first):**
```css
.nav-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

@media (min-width: 768px) {
  .nav-list {
    flex-direction: row;
    gap: 1.5rem;
  }

  .nav-toggle { display: none; }
}
```

**Responsive table (horizontal scroll + pinned first column):**
```css
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table th:first-child,
.data-table td:first-child {
  position: sticky;
  left: 0;
  background: var(--surface-color);
  z-index: 1;
}
```

### 5. Handle Images and Media Responsively

Images and embeds are the most common source of responsive overflow:

- Set `img, video, svg { max-width: 100%; display: block; }` globally -- this single rule prevents the majority of image overflow bugs
- Use the `aspect-ratio` property to reserve space before images load and prevent layout shift: `aspect-ratio: 16 / 9`
- For art-directed responsive images, use the `<picture>` element with `<source media="(min-width: 768px)">` to serve different crops at different viewports
- For resolution-switching (same crop, different file sizes), use `srcset` with `sizes` attribute: `sizes="(min-width: 768px) 50vw, 100vw"`
- For background images, use the CSS `image-set()` function with resolution-based fallbacks
- Embedded iframes (video, maps) require the aspect-ratio box technique: wrap in a container with `aspect-ratio: 16 / 9` and set the iframe to `width: 100%; height: 100%`

### 6. Test Across the Full Viewport Range

Testing responsive implementations requires systematic coverage, not just "check on an iPhone":

- Use browser DevTools in responsive mode and test at: 320px, 375px, 430px, 768px, 1024px, 1280px, 1440px, 1920px -- these cover the full distribution of common viewport widths
- Drag the DevTools viewport width slowly from narrow to wide while watching for layout breaks -- this reveals breakpoint gaps that static snapshots miss
- Test with actual device touch simulation for navigation patterns -- hover-based interactions (dropdown menus) require touch handling alternatives
- Check overflow at each breakpoint: open DevTools console and run `document.querySelectorAll('*')` with a filter for `scrollWidth > document.documentElement.clientWidth` to find overflowing elements programmatically
- Test with browser zoom at 200% to validate that the layout works for users who enlarge text -- this is both a responsive concern and an accessibility requirement (WCAG 1.4.4)
- If container queries are used, test the same component in at least two layout contexts (e.g., sidebar and main content area) to confirm behavior is correct in both

### 7. Document the Responsive System

A responsive system that is not documented will decay as the team adds ad-hoc breakpoints:

- Create a living breakpoint reference: a page in the design system or Storybook that shows each component at all supported container widths
- Document the clamp formula inputs for each typography token so designers and developers can recalculate when scaling changes
- Write a short ADR (Architecture Decision Record) for any non-obvious decision: why container queries were chosen over media queries for a specific component, why a particular breakpoint value was selected, why a table uses horizontal scroll instead of card-transform at mobile
- Add breakpoint usage to component-level documentation: "this component responds to its container width, not the viewport"

---

## Output Format

When helping a user implement or evaluate responsive design patterns, structure the response as follows:

```
## Responsive Design Analysis

### Context Summary
- Viewport range targeted: [e.g., 320px -- 1440px]
- Component/layout type: [macro / meso / micro]
- Responsive strategy selected: [fluid+fixed hybrid / intrinsic grid / container queries / clamp-based / combination]
- Browser support constraint: [e.g., container queries require Chrome 105+, Safari 16+]

---

### Breakpoint Scale
| Token    | Value  | Rationale                               |
|----------|--------|-----------------------------------------|
| --bp-sm  | 480px  | Single-column mobile gains breathing room |
| --bp-md  | 768px  | Sidebar patterns viable                  |
| --bp-lg  | 1024px | Full desktop navigation pattern          |
| --bp-xl  | 1280px | Wide desktop, content max-width          |

---

### Implementation

#### Base / Mobile Styles
[CSS with comments explaining each decision]

#### Responsive Enhancements (per breakpoint or container width)
[CSS organized by breakpoint with min-width, mobile-first]

#### Clamp / Fluid Values (if applicable)
[CSS custom properties with clamp() values and the formula used]

---

### Layout Decision Rationale

| Decision point              | Choice made               | Alternative considered     | Reason                                       |
|-----------------------------|---------------------------|----------------------------|----------------------------------------------|
| Grid vs. Flexbox            | [choice]                  | [alternative]              | [specific reason for this content type]      |
| Media query vs. container   | [choice]                  | [alternative]              | [component reuse context / not reused]       |
| Fixed breakpoints vs. clamp | [choice]                  | [alternative]              | [typography/spacing vs. layout need]         |

---

### Testing Checklist
- [ ] 320px: no horizontal overflow, all content readable
- [ ] 375px: mobile layout correct, touch targets ≥ 44×44px
- [ ] 768px: layout transition correct at breakpoint boundary
- [ ] 1024px: desktop layout active, no content crowding
- [ ] 1440px: max-width container centered, no content stretching
- [ ] 200% zoom: text and layout remain usable
- [ ] Slow drag test: no snap/jump artifacts between breakpoints

---

### Known Trade-offs
[Bullet list of any constraints, browser support gaps, or intentional simplifications]
```

---

## Rules

1. **Always write mobile-first CSS.** Base styles must target the narrowest supported viewport. Media queries must use `min-width`, not `max-width`, except in isolated override cases. Mixing mobile-first and desktop-first in the same codebase causes specificity conflicts and maintenance nightmares.

2. **Never use device-specific breakpoints like 768px because "that's the iPad."** Set breakpoints where the content breaks, not where specific device models exist. Apple changes iPad widths; your content does not care about device brands.

3. **Never use viewport units (vw, vh) for layout widths on elements that need horizontal scrolling.** `100vw` includes the scrollbar width on Windows browsers, causing a horizontal overflow. Use `100%` for layout widths and vw only inside `clamp()` for fluid scaling.

4. **Always use `min(100% - 2rem, [max-width])` instead of `max-width + padding` on containers.** The traditional approach of `max-width: 1200px; padding: 0 1rem` causes padding to disappear at max-width viewports on some elements. The `min()` approach is safer and more predictable.

5. **Never set explicit `height` on layout containers.** Fixed heights are the leading cause of content overflow in responsive layouts. Use `min-height` when a minimum is required and allow content to drive actual height. Use `aspect-ratio` for intrinsic proportions.

6. **Always test by dragging the viewport, not just at snapshot sizes.** Bugs at intermediate widths (e.g., at 650px between your 480px and 768px breakpoints) are invisible when you only test at fixed checkpoints. The drag test catches these.

7. **Use container queries for any component that appears in more than one layout context.** If a card component appears in a 3-column grid on the home page and in a sidebar on the article page, a viewport media query cannot correctly handle both contexts. Container queries are the right tool.

8. **Never use JavaScript to reposition elements for responsive layout unless absolutely necessary.** CSS-based responsive layout is more performant and does not depend on JS execution. Using JS to move DOM elements on resize is a sign that the CSS architecture needs to be rethought.

9. **Always validate clamp() values at both endpoints.** Calculate what the clamp value resolves to at your minimum viewport width and your maximum viewport width and confirm the results match design intent. The intermediate fluid scaling is automatic, but the endpoints are what designers and product owners will verify.

10. **Never prefix layout properties unnecessarily in modern projects.** `-webkit-flex`, `-ms-grid`, and similar vendor prefixes are not needed for Flexbox or Grid in any browser released after 2020. Adding unnecessary prefixes creates confusion about what is actually required and inflates stylesheets without benefit.

---

## Edge Cases

### Intrinsic Grid Items That Must Have Exact Column Counts at Specific Breakpoints

`auto-fit` with `minmax()` is powerful but does not guarantee a specific number of columns -- it fits as many as possible. If the design requires exactly 2 columns on tablet and 3 on desktop, the intrinsic approach will not reliably produce this. Handle this by layering explicit `grid-template-columns` at named breakpoints on top of the intrinsic base, or by accepting that the column count varies and confirming this with the designer. Do not fight the intrinsic grid with magic-number min values to force column counts -- this creates fragility.

### Legacy Browser Support (Safari 14, Chrome 88 and Earlier) Without Container Queries

If container queries are unavailable due to support requirements, simulate component-level responsiveness using a combination of Flexbox's natural reflowing behavior and CSS custom properties passed via JavaScript. Set a `data-size` attribute on the container element using a ResizeObserver (which has near-universal support), then use `[data-size="sm"]`, `[data-size="md"]` attribute selectors in CSS. This pattern is known as the "ResizeObserver + attribute selector" container query polyfill strategy. It adds a small JS dependency but requires no layout framework.

### Full-Bleed Sections Inside a Max-Width Container

A common pattern is a content container with `max-width: 1200px` that contains sections needing full-viewport-width backgrounds. Do not break the container model by moving these elements outside it. Instead, use the "full bleed" trick:
```css
.full-bleed {
  width: 100vw;
  margin-left: calc(50% - 50vw);
}
```
This uses the mathematical relationship between the centered container and the viewport to expand to full width without DOM restructuring. Note: this requires `overflow-x: hidden` on the body to prevent the scrollbar-width issue on Windows.

### Tables With Many Columns on Mobile

Do not simply hide columns on mobile -- users lose data access. The correct approaches in order of preference: (1) horizontal scroll with sticky first column (preserves all data, lowest implementation cost), (2) card transform pattern where each row becomes a card with label-value pairs (high readability, requires extra markup or CSS pseudo-content), (3) progressive column disclosure (show priority columns, allow expanding to see all). The card transform approach using `::before` content from `data-label` attributes is the most accessible because it does not require hiding information or relying on JS.

### Sticky Headers Interacting With Scroll Snap and Overflow Containers

`position: sticky` stops working when any ancestor in the DOM tree has `overflow` set to anything other than `visible`. This is a common bug when responsive navigation is made sticky inside a layout that uses `overflow: hidden` to contain the mobile menu. The fix is to apply `overflow: hidden` only to the menu panel itself using a scroll-clipping wrapper, not to any ancestor of the sticky element. Alternatively, use `overflow: clip` instead of `overflow: hidden` -- `clip` prevents scroll without creating a new scroll container, allowing sticky positioning to continue working through the ancestor.

### Responsive Behavior in Printed Media

Responsive design skills must include a `@media print` stylesheet for content-heavy sites. Print breakpoints differ entirely from screen breakpoints. Key print-specific rules: remove navigation, hero images, and decorative sidebars; expand collapsed content (accordions, tabs) to be fully visible; set a maximum content width of `7in` (standard US letter margin); use `page-break-inside: avoid` on cards and figures; convert all colors to print-safe values. Do not assume that the responsive screen layout is acceptable for print -- it almost never is.

### Custom Scroll Containers and `100vh` on Mobile

`100vh` on mobile browsers has historically included the address bar height, causing content to be hidden behind browser chrome. Modern browsers have largely fixed this, but the safe approach is to use the newer CSS environment variables: `height: 100svh` (small viewport height -- excludes dynamic browser UI) for minimum-height contexts and `height: 100dvh` (dynamic viewport height -- recalculates as browser UI appears and disappears) for elements that must always fill the visible area. Provide `100vh` as a fallback for browsers that do not support `svh`/`dvh`. Never use `100vh` without a `svh`/`dvh` fallback on full-screen layouts targeting mobile.

### Responsive Design in Shadow DOM (Web Components)

CSS media queries inside a Shadow DOM work correctly -- they query the document viewport, not the shadow root. However, CSS container queries inside a Shadow DOM query the host element or named containers within the shadow tree, which is the desired behavior. When building Web Components, always use container queries rather than media queries for component-level responsiveness. The shadow boundary also prevents external container context from being inherited -- define the container context explicitly inside the shadow root on the component's outermost element.

---

## Example

**Input:** "I'm building a team member directory page. Each team member has a photo, name, title, bio (2-3 sentences), and links to LinkedIn and email. On mobile it should be a single column list. On tablet and desktop it should be a grid of cards. The same card component will also appear in a sidebar widget showing just 3 featured members in a narrow (280px) container. We need to support Chrome, Firefox, and Safari (last 2 major versions)."

**Output:**

## Responsive Design Analysis

### Context Summary
- Viewport range targeted: 320px -- 1440px
- Component/layout type: meso layout (card grid) + micro layout (individual card internals)
- Responsive strategy selected: Intrinsic auto-fit grid for the full directory + container queries for the card component (required because the card appears in both the wide grid context and a narrow sidebar widget)
- Browser support constraint: Container queries supported in all targets (Chrome 105+, Firefox 110+, Safari 16+) -- no polyfill needed for last-2-versions constraint

---

### Breakpoint Scale

| Token    | Value  | Rationale                                      |
|----------|--------|------------------------------------------------|
| --bp-sm  | 480px  | Mobile layout gains horizontal padding         |
| --bp-md  | 768px  | Grid begins reflowing to multi-column          |
| --bp-lg  | 1024px | Cards can show horizontal photo+text layout    |
| --bp-xl  | 1280px | Directory container reaches comfortable max-width |

---

### Implementation

#### CSS Custom Properties (Design Tokens)

```css
:root {
  /* Breakpoints */
  --bp-sm: 480px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;

  /* Spacing scale */
  --space-xs:  0.25rem;
  --space-sm:  0.5rem;
  --space-md:  1rem;
  --space-lg:  1.5rem;
  --space-xl:  2rem;

  /* Typography scale (clamp-based) */
  --text-sm:   clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --text-base: clamp(1rem, 0.875rem + 0.625vw, 1.125rem);
  --text-lg:   clamp(1.125rem, 1rem + 0.75vw, 1.375rem);

  /* Card sizing */
  --card-min-width: 260px;
  --card-photo-size-narrow: 64px;   /* sidebar card context */
  --card-photo-size-wide: 100%;     /* card top image in grid context */
}
```

#### Page-Level Directory Container (No Media Queries Required)

```css
/* Full-page container */
.directory {
  width: min(100% - 2rem, 1280px);
  margin-inline: auto;
  padding-block: var(--space-xl);
}

/* Intrinsic auto-fit grid -- no breakpoints needed for the grid reflow */
.team-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(min(var(--card-min-width), 100%), 1fr)
  );
  gap: clamp(var(--space-md), 3vw, var(--space-xl));
}

/*
  Why auto-fit + minmax here:
  - On 320px: only 1 column fits (260px min > half of 320px), so single column
  - On 768px: ~2-3 columns fit, grid self-organizes
  - On 1280px: ~4 columns fit at comfortable card width
  - No media queries needed for the grid -- the math handles reflowing
  - The min(260px, 100%) prevents overflow when the viewport is under 260px
*/
```

#### Card Component -- Container Setup

```html
<!-- HTML structure -->
<div class="card-wrapper">
  <article class="team-card">
    <div class="card-photo-area">
      <img
        class="card-photo"
        src="photo-400.jpg"
        srcset="photo-200.jpg 200w, photo-400.jpg 400w, photo-800.jpg 800w"
        sizes="(min-width: 768px) 33vw, 100vw"
        alt="Jordan Lee, Senior Engineer"
        width="400"
        height="400"
      />
    </div>
    <div class="card-body">
      <h3 class="card-name">Jordan Lee</h3>
      <p class="card-title">Senior Engineer</p>
      <p class="card-bio">Jordan specializes in distributed systems and has led infrastructure migrations for three enterprise clients. Prior to joining, Jordan worked at a cloud provider building internal tooling.</p>
      <div class="card-links">
        <a class="card-link" href="mailto:jordan@example.com">Email</a>
        <a class="card-link" href="https://linkedin.com/in/jordanlee">LinkedIn</a>
      </div>
    </div>
  </article>
</div>
```

#### Card Component -- Container Query CSS

```css
/* 
  Establish container context on the wrapper, not the article itself.
  This allows the card to query the space available to it, whether
  it's sitting in the main grid (wide) or the sidebar widget (narrow).
*/
.card-wrapper {
  container-type: inline-size;
  container-name: team-card;
}

/* ── Base styles (narrowest context: sidebar at ~280px) ── */
.team-card {
  display: grid;
  grid-template-rows: auto 1fr;
  background: var(--color-surface, #fff);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
}

/* Narrow context: horizontal mini-card (sidebar widget) */
.card-photo-area {
  /* In narrow context, photo is small and sits inline */
}

.card-photo {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.card-body {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.card-name {
  font-size: var(--text-lg);
  font-weight: 600;
  margin: 0;
}

.card-title {
  font-size: var(--text-sm);
  color: var(--color-muted, #666);
  margin: 0;
}

.card-bio {
  font-size: var(--text-base);
  line-height: 1.6;
  margin: 0;
}

.card-links {
  display: flex;
  gap: var(--space-sm);
  margin-top: auto;
  padding-top: var(--space-sm);
  flex-wrap: wrap;
}

.card-link {
  font-size: var(--text-sm);
  text-decoration: none;
  color: var(--color-accent, #0066cc);
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid currentColor;
  border-radius: 4px;
}

/*
  Container query: When the card wrapper is at least 320px wide,
  switch to a horizontal layout (photo left, content right).
  This applies in the full-width grid context at small mobile sizes
  and in any sidebar wider than 320px.
*/
@container team-card (min-width: 320px) {
  .team-card {
    grid-template-columns: 100px 1fr;
    grid-template-rows: 1fr;
  }

  .card-photo {
    height: 100%;
    /* Photo fills the left column height */
  }
}

/*
  Container query: When the card wrapper is at least 400px wide,
  switch back to vertical (stacked) layout with a full-width photo.
  This applies to grid cards on tablet/desktop viewports.
*/
@container team-card (min-width: 400px) {
  .team-card {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .card-photo {
    aspect-ratio: 4 / 3; /* wider crop for card header photo */
  }
}
```

#### Sidebar Widget Context

```css
/* 
  The sidebar widget is already narrow (280px) so the card
  stays in its default single-column stacked layout.
  No extra CSS needed -- the container query handles this automatically
  because the container (card-wrapper) is only 280px wide.
*/
.sidebar-team-widget {
  width: 280px; /* or flexible within a sidebar layout */
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
```

---

### Layout Decision Rationale

| Decision point                    | Choice made                        | Alternative considered               | Reason                                                                                      |
|-----------------------------------|------------------------------------|--------------------------------------|---------------------------------------------------------------------------------------------|
| Grid layout strategy              | Intrinsic auto-fit with minmax     | Fixed breakpoint column counts       | Content should drive reflow; auto-fit eliminates 2 media queries with no trade-off here     |
| Card responsiveness mechanism     | CSS container queries              | Viewport media queries               | Card appears in both grid (wide) and sidebar (narrow) -- viewport queries cannot handle both |
| Card layout at mid-width (320px+) | Horizontal photo+content           | Stacked with smaller photo           | Matches standard team directory conventions; better use of horizontal space                 |
| Card layout at 400px+             | Stacked with full-width photo      | Keeping horizontal layout            | At this width, vertical card with proportioned photo looks better and matches design intent |
| Typography sizing                 | clamp()-based custom properties    | Fixed px values with media queries   | Continuous scaling eliminates jarring text-size jumps at breakpoints                        |
| Image approach                    | srcset + sizes                     | Single image file                    | Prevents serving 800px images in 100px sidebar slots; reduces data transfer by 60-80%       |
| Container element                 | `.card-wrapper` div, not `article` | Container on `article` directly      | Avoids nesting a container query context inside the article's semantic element              |

---

### Testing Checklist

- [ ] 320px: single-column grid, card in stacked layout, no horizontal overflow, bio text readable
- [ ] 375px: layout stable, card links have ≥ 44px touch targets (check with DevTools)
- [ ] 480px: grid may begin showing 2 columns depending on minmax result -- verify correct card width
- [ ] 768px: grid showing 2--3 columns, cards in full-width photo (stacked) layout
- [ ] 1024px: grid showing 3--4 columns, spacing comfortable
- [ ] 1280px: directory container centered at max-width, grid not stretching beyond content width
- [ ] Sidebar at 280px: card stays in default narrow stacked layout (not horizontal)
- [ ] Sidebar at 320px+: card switches to horizontal photo+content layout
- [ ] Drag test (320px → 1440px): no snap artifacts, grid reflows smoothly
- [ ] 200% browser zoom: all content readable, no overlapping elements
- [ ] Image loading: check Network tab to confirm correct srcset resolution is served per viewport
- [ ] Print preview: card grid collapses to single column, photos and bios visible, nav hidden

---

### Known Trade-offs

- The `auto-fit` grid does not guarantee a specific column count. At exactly 780px, the grid may show 2 wide cards rather than 3 narrower ones. If the design requires a guaranteed 3-column layout starting at 768px, replace the auto-fit grid with explicit `grid-template-columns` at `--bp-md`.
- The horizontal card layout at the 320px container breakpoint works well for most bios but may feel crowded if bio text is significantly longer than 2--3 sentences. Consider truncating bio text with `-webkit-line-clamp: 3` in horizontal layout contexts.
- Container queries require `container-type: inline-size` on a wrapper element. This creates an additional DOM node per card. For very large directories (500+ members with virtualization), measure whether this impacts rendering performance -- in practice, the impact is negligible up to a few hundred static DOM nodes.
- The `srcset` `sizes` attribute value `(min-width: 768px) 33vw, 100vw` is an approximation -- the sidebar context actually uses ~280px. For maximum image efficiency, add a separate `sizes` entry for the sidebar context, or accept the minor over-sizing for the sidebar case which serves files that are still smaller than the default.
