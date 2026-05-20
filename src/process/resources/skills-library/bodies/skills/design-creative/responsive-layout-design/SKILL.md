---
name: responsive-layout-design
description: |
  Produces a responsive layout specification with breakpoints, column grids per breakpoint, component behavior rules, and content priority ordering for multi-device interfaces.
  Use when the user asks to design a responsive layout, define breakpoints, plan how content adapts across screen sizes, or create a multi-device layout specification.
  Do NOT use for wireframing a single device (use wireframe-specification), defining animations (use prototype-spec), or writing responsive CSS code (use a software-development skill).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "responsive-design design template"
  category: "design-creative"
  subcategory: "ui-ux-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Responsive Layout Design

## When to Use

**Use this skill when:**
- User needs a complete multi-device layout specification covering breakpoint definitions, grid systems, component behavior rules, content priority ordering, typography scaling, and spacing tokens -- ready for developer or designer handoff
- User wants to define how specific components (navigation, data tables, hero sections, card grids, forms, sidebars) reflow, collapse, reorder, or transform across screen widths
- User is designing a new interface and needs to establish the responsive foundation before any visual design or CSS work begins
- User has an existing single-device layout and needs to extend it to a full responsive specification covering mobile, tablet, and desktop breakpoints
- User needs to audit or redesign an existing responsive layout that has specific failure points (text overflowing, images breaking, navigation collapsing poorly, tables truncating)
- User wants to specify content priority ordering so development teams know what to hide, deprioritize, or restructure on smaller viewports
- User is creating a design system or component library and needs standardized responsive behavior rules that apply consistently across many screens

**Do NOT use when:**
- User wants a wireframe for a single specific device or viewport only -- use `wireframe-specification` instead, which produces screen-level layout artifacts without multi-breakpoint complexity
- User wants to define transitions, animations, or micro-interactions that occur during viewport resize or between screen states -- use `prototype-spec` for motion and transition behavior
- User wants to write the actual CSS, Sass, or media query code that implements the responsive layout -- use a software-development skill (the spec produced here is the input to that work, not a substitute for it)
- User wants to map how users navigate between screens or pages across devices -- use `user-flow-mapping`, which handles navigation paths rather than layout structure
- User wants a visual brand identity or style guide -- responsive layout specs are structural artifacts, not visual direction documents
- User wants to design a native mobile app layout (iOS/Android) -- native apps use platform-specific layout systems (UIKit Auto Layout, Jetpack Compose) that differ fundamentally from viewport-based responsive web design

---

## Process

### Step 1: Establish Context and Design Direction

Before drawing any boxes, collect the five parameters that determine every subsequent decision:

- **Content type classification:** Identify which layout archetype the screen belongs to. Each has different responsive priorities:
  - *Reading content* (articles, documentation, blogs): Line length control is paramount. Single-column prose is ideal on all devices. Sidebar is supplementary.
  - *Task-oriented interfaces* (dashboards, admin panels, forms): Desktop-first thinking. Data density matters. Mobile versions often need significant restructuring, not just reflow.
  - *Commerce and conversion pages* (product pages, landing pages, checkout): Mobile-first is essential -- over 60% of e-commerce traffic is mobile. CTA visibility and form usability on thumb-zone areas are critical.
  - *Content grids* (news feeds, portfolios, galleries): Column count reduction is the primary responsive strategy. Image cropping and aspect ratio management matter.
  - *Mixed editorial* (marketing pages, homepages): Each section may use a different responsive strategy. Treat each section as a separate layout unit.

- **Priority device and traffic profile:** Ask the user where most traffic originates. Use this to determine design direction:
  - Greater than 60% mobile sessions: mobile-first layout (design mobile layout first, progressively enhance for larger screens)
  - Greater than 60% desktop sessions: desktop-first (design full layout first, gracefully degrade for smaller screens)
  - No data available: default to mobile-first. It is harder to add complexity than remove it.

- **Complete component inventory:** Request a full list of every content element that will appear on the screen. Do not proceed to breakpoint definition until this list is exhaustive. Common missed elements: breadcrumbs, cookie banners, floating chat buttons, legal disclaimers, language/locale selectors, search bars, notification banners, back-to-top buttons.

- **Technical and business constraints:**
  - Minimum supported viewport width (many enterprise tools target 320px; some internal tools allow 1024px minimum)
  - Maximum content width preference (1200px, 1440px, or 1600px are the most common)
  - Fixed/persistent elements (sticky headers, persistent sidebars, sticky CTAs, chat widgets)
  - Any components that must not change (brand-mandated hero treatments, contractually specified ad placements)

- **Accessibility and performance context:**
  - Does the site need to support browser zoom up to 400% (WCAG 2.1 Success Criterion 1.4.10 Reflow)? If yes, layout must remain functional at 1280px CSS width zoomed to 400%, equivalent to a 320px viewport.
  - Is the site used on low-bandwidth connections? Progressive image loading and content-first rendering affect layout choices.

---

### Step 2: Define the Breakpoint System

Breakpoints are not arbitrary round numbers -- they should reflect the distribution of actual device viewport widths and the natural reflow points of the specific content being designed.

**The standard six-tier system** covers nearly all device categories:

| Name | Min Width | Typical Context | Grid Columns |
|------|-----------|-----------------|--------------|
| xs | 0px | Phones portrait (320px--575px) | 4 |
| sm | 576px | Phones landscape, small phones wide (576px--767px) | 4 |
| md | 768px | Tablets portrait (768px--1023px) | 8 |
| lg | 1024px | Tablets landscape, small laptops (1024px--1279px) | 12 |
| xl | 1280px | Standard desktops (1280px--1535px) | 12 |
| 2xl | 1536px | Large monitors, ultrawide (1536px+) | 12 (with max-width cap) |

**When to use fewer breakpoints:**
- Simple marketing pages with few layout changes: three tiers (mobile 0--767px, tablet 768--1023px, desktop 1024px+) are sufficient
- Design systems serving known internal audiences (e.g., an enterprise app used exclusively on 1080p monitors) can drop xs/sm entirely
- When the content itself dictates reflow points -- this is called "content-driven breakpoints." A three-column card grid breaks at the point where columns become narrower than the minimum readable card width, not at a device boundary

**Content-driven breakpoint method:**
- Start with the component that has the most aggressive reflow needs (typically a multi-column grid or a data table)
- Determine the minimum comfortable column width for that component (example: a product card needs at least 280px to display image + title + price legibly)
- Calculate: at 3 columns, minimum container width = (3 × 280px) + (2 × 24px gutters) + (2 × 32px margins) = 952px. That is your lg breakpoint for that component.
- This produces breakpoints grounded in content, not device assumptions

**Naming conventions for the spec:** Use both the name and the pixel range in every table to prevent ambiguity during developer handoff. Write "md (768--1023px)" not just "tablet."

---

### Step 3: Define the Grid System Per Breakpoint

The grid is the structural scaffolding that determines how all components align. For each breakpoint, specify:

- **Column count:** 4 columns for mobile (provides 1-col and 2-col layouts), 8 for tablet (adds 4-col options), 12 for desktop (the most compositionally flexible -- allows 3-col, 4-col, thirds, quarters, and asymmetric splits like 8+4 or 9+3)

- **Gutter width:** The gap between columns. Standard values:
  - Mobile: 16px gutters (tight, maximizes content area on narrow viewports)
  - Tablet: 24px gutters
  - Desktop: 24px--32px gutters
  - Never use less than 16px gutters -- components need visual separation

- **Margin width:** The horizontal space between the grid and the viewport edge. Also called "page padding" or "safe area inset":
  - Mobile (xs): 16px -- tight but readable
  - Mobile (sm): 20px -- slight breathing room
  - Tablet: 24px--32px
  - Desktop: 32px--64px (or auto-centering margins when the container hits max-width)

- **Container max-width:** The maximum width the grid container will expand to:
  - Content-heavy reading sites: 1200px (keeps line lengths controlled)
  - Marketing/commerce sites: 1440px (allows richer visual compositions on large monitors)
  - Design systems and dashboards: 1600px or uncapped (data tables benefit from full width)
  - Beyond the max-width, the layout centers within the viewport with auto margins

- **Fluid vs. stepped layout:**
  - *Fluid* (percentage-based columns): Grid always fills the viewport. Columns stretch continuously. Useful for dashboards where users control their browser window.
  - *Stepped* (fixed pixel containers): Grid jumps at each breakpoint. Simpler to control, preferred for editorial content where line length needs to be capped.
  - Most modern implementations use fluid columns within a capped container -- the best of both.

**Specify column span units for each component.** Express component widths as column spans, not pixel widths. Example: "Article body: 8 of 12 columns at lg breakpoint." This makes the spec device-independent within each tier and survives viewport changes within a breakpoint.

---

### Step 4: Map Component Behavior at Every Breakpoint

This is the most critical and most commonly underspecified step. For every component in the inventory from Step 1, define exactly what it does at each breakpoint using the eight responsive behaviors:

| Behavior | Definition | When to Use |
|----------|------------|-------------|
| **Stay** | No change in position, proportion, or visual structure | Decorative icons, inline text, buttons that are already small |
| **Resize** | Width changes but layout structure stays the same | Hero image stretches from 8-col to full-width; button widens on mobile |
| **Reflow** | Items in a row wrap to new rows (natural wrapping) | 3-column card grid → 2-column → 1-column |
| **Collapse** | Element condenses into a compact alternate form | Desktop horizontal nav → hamburger menu; expanded filter panel → drawer |
| **Reorder** | Visual order changes (different from DOM order) | Sidebar moves from right of content to below content |
| **Hide** | Element is removed from the viewport | Decorative sidebar illustration hidden on mobile; dense data table footnotes hidden |
| **Transform** | Element fundamentally changes its presentation format | Data table → card list; tab bar → accordion; horizontal timeline → vertical list |
| **Scroll-enable** | Element that was fully visible gains scroll behavior | Wide data table gains horizontal scroll; gallery gains swipe behavior |

**Component behavior decision rules:**

For **navigation:**
- Desktop (lg+): Full horizontal navigation bar, all items visible, possible mega-menu on hover
- Tablet (md): If fewer than 7 items, keep horizontal. If 7 or more, collapse to hamburger or icon-label bottom nav
- Mobile (xs--sm): Always collapse. Choose between hamburger (slides in drawer from left or top) or bottom navigation bar. Bottom navigation is preferred when the page has 3--5 primary destinations -- it keeps key navigation in the thumb zone. Hamburger is better for sites with many deep navigation items.

For **hero sections:**
- Desktop: Full-width or contained, image and text side-by-side or overlaid
- Tablet: Usually stays full-width, text may shift from overlay to below-image
- Mobile: Stack text below image or use text-over-image only if contrast ratio is 4.5:1+ with overlay. Never expect a background image to carry readability on mobile -- always use an overlay or separate text block.

For **card grids:**
- Desktop: 3 or 4 columns
- Tablet: 2 columns (3 columns only if cards are narrow, 240px+ available per card after gutters)
- Mobile: 1 column for content-rich cards (image + title + description + CTA). Horizontal scroll for compact cards (image + title only) -- but use this sparingly; users often miss horizontally scrollable content.

For **forms:**
- Desktop: Can use 2-column layouts for related fields (first name / last name; city / state / zip)
- Tablet and mobile: Always single column. Multi-column form fields on mobile are a leading cause of mis-taps and form abandonment. Exception: very short paired fields (month / year for credit card expiry) may remain side-by-side on tablet.

For **data tables:**
- Desktop: Full table, all columns visible
- Tablet: Evaluate column importance. Consider hiding low-priority columns (internal IDs, verbose status descriptions). Alternatively: horizontal scroll with a frozen first column for context.
- Mobile: Choose one of three strategies based on data type:
  1. *Card transformation*: Each row becomes a card with label-value pairs stacked vertically. Best for 4--8 columns with mixed data types.
  2. *Horizontal scroll*: Freeze the identifier column (first or second column), scroll remaining columns horizontally. Best for wide tables where users are comparing across columns.
  3. *Priority column hiding*: Show only 2--3 most critical columns with a "View details" affordance to see full row. Best for tables where users scan rather than compare.

---

### Step 5: Assign Content Priority to Every Component

Content priority determines what survives aggressive viewport reduction and what gets hidden or restructured. Use a three-tier system:

**Priority 1 -- Critical:** Must be fully accessible on every breakpoint without requiring user interaction. Examples: primary headline, primary CTA button, product price, form submit button, error messages, navigation.

**Priority 2 -- Important:** Should be visible on tablet and above. On mobile, may be accessible but may require a tap-to-expand, scroll-to-section, or a reduced presentation. Examples: secondary CTAs, product description body, filter panels, related content sections.

**Priority 3 -- Supplementary:** Acceptable to hide on mobile, and sometimes on tablet. Must never contain content users need to complete a task. Examples: decorative imagery, verbose footnotes, social share buttons, "you might also like" sections, promotional banners unrelated to the current page purpose.

**Priority assignment rules:**
- A component's priority rating must not conflict with its behavior. A Priority 1 component must never be hidden (Hide behavior) at any breakpoint.
- Priority 2 components that use the Collapse behavior must include a clearly labeled affordance for users to access the full content. Hiding content behind a tap is acceptable only when users can reasonably expect to tap for more.
- Do not assign Priority 3 to components that contain legal, accessibility, or error-state content. Those are always Priority 1 regardless of their visual prominence on desktop.

---

### Step 6: Define Responsive Typography

Typography has a profound effect on layout density and readability at every viewport width. Specify:

**Type scale per breakpoint:**
- h1: Mobile 28--32px, Tablet 36--40px, Desktop 44--56px. Never smaller than 24px on any device.
- h2: Mobile 22--24px, Tablet 26--30px, Desktop 32--40px.
- h3: Mobile 18--20px, Tablet 20--22px, Desktop 24--28px.
- h4: Mobile 16--18px, Tablet 18--20px, Desktop 20--22px.
- Body: 16px minimum on ALL breakpoints. Never reduce body text for layout density. Increase to 17--18px on large desktop viewports if the reading experience is primary.
- Small/caption: 14px minimum. Below 12px is not accessible and should never appear in a spec.

**Fluid typography (clamp method):**
- Instead of stepped type sizes, fluid typography uses `clamp(min, preferred, max)` to interpolate smoothly between breakpoints.
- Example for h1: clamp(28px, 4vw + 16px, 56px). This scales proportionally with viewport width between the minimum and maximum values.
- Use fluid typography when: the design is editorial and text as-art is intentional, or when there are many breakpoints and managing discrete step values becomes unwieldy.
- Use stepped typography when: the design system needs predictable, testable values at specific widths, or when the development team prefers explicit media query values.

**Line length targets:**
- Optimal prose line length: 45--75 characters per line (approximately 60ch is ideal for long-form reading)
- Maximum for any reading content: 80 characters. Beyond this, eye tracking fatigue increases.
- Minimum for any reading content: 35 characters. Below this, too many line breaks disrupt reading rhythm.
- On wide desktop viewports, achieve line length control with container max-width or a column span constraint, not by increasing font size.
- On mobile, 16px body text in a 320px viewport with 16px margins gives approximately 38 characters per line -- acceptable at the low end.

**Line height:**
- Body text: 1.5--1.6 line-height on all breakpoints
- Headings: 1.1--1.25 line-height (tighter for large display type, looser for smaller headings)
- Do not compress line height on mobile to fit more text -- it degrades readability faster than reducing font size does.

---

### Step 7: Define Responsive Spacing

Spacing tokens at different breakpoints control visual rhythm and breathing room. Define:

**Page-level spacing:**
- Page margin (horizontal safe area): xs 16px, sm 20px, md 32px, lg 40px, xl 64px (or use the grid margin from Step 3)
- Section gap (vertical space between major page sections): xs 40px, md 64px, lg 96px. Desktop layouts need larger section gaps because users have more vertical context and can see more of the page at once.

**Component-level spacing:**
- Card padding: xs 16px, md 20px, lg 24px
- Form field spacing (gap between fields): xs 16px, md 20px all breakpoints (form field spacing is less variable than page-level spacing)
- Table cell padding: xs 8px horizontal / 12px vertical, md 12px / 16px, lg 16px / 20px

**Spacing scale philosophy:**
- Use a consistent spacing scale (multiples of 4px or 8px) to avoid arbitrary values in the spec
- Common spacing tokens: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128
- Mobile generally uses spacing values in the 4--48px range. Desktop uses the full range up to 128px.
- Avoid reducing spacing aggressively on mobile to fit more content. Tight mobile layouts feel cramped and increase tap error rates. 16px is a practical minimum for any interactive spacing.

**Touch target sizing (mobile and tablet only):**
- All interactive elements (buttons, links, form fields, checkboxes, toggles) must have a minimum touch target of 44x44px (Apple HIG) or 48x48dp (Material Design).
- This applies to the tap target, not necessarily the visual size of the element. A small text link can have invisible padding around it that extends the tap target.
- Flag in the spec any component that will be visually smaller than 44x44px at mobile breakpoints -- these need explicit touch target expansion notes.

---

### Step 8: Compile and Structure the Responsive Layout Specification

The final output must be a self-contained document a developer or designer can implement without returning for clarification. It should include:

- Complete breakpoint table with all parameters
- Grid specification table per breakpoint
- Component behavior matrix with priority column
- ASCII layout diagrams for each major breakpoint (these communicate spatial relationships faster than prose)
- Responsive typography table
- Responsive spacing table
- Notes section covering design decisions, dependency relationships, and edge cases specific to this screen

The spec must be specific enough that two different developers would produce the same layout from it. Any ambiguity in the spec becomes inconsistency in the implementation.

---

## Output Format

```
## Responsive Layout: [Page / Screen Name]

### Breakpoints and Grid

| Tier | Breakpoint Range | Columns | Gutter | Page Margin | Container Max-Width |
|------|-----------------|---------|--------|-------------|---------------------|
| xs (mobile-sm) | 0px -- 575px | 4 | 16px | 16px | 100% (fluid) |
| sm (mobile-lg) | 576px -- 767px | 4 | 16px | 20px | 100% (fluid) |
| md (tablet) | 768px -- 1023px | 8 | 24px | 32px | 100% (fluid) |
| lg (desktop-sm) | 1024px -- 1279px | 12 | 24px | 40px | 1200px |
| xl (desktop-lg) | 1280px -- 1535px | 12 | 32px | 64px | 1440px |
| 2xl (ultrawide) | 1536px+ | 12 | 32px | auto | 1600px |

Design direction: [mobile-first / desktop-first]
Layout archetype: [reading / task / commerce / grid / mixed editorial]

---

### Component Behavior Matrix

| Component | Priority | Behavior xs--sm | Col Span xs | Behavior md | Col Span md | Behavior lg+ | Col Span lg |
|-----------|----------|-----------------|-------------|-------------|-------------|--------------|-------------|
| [Component name] | [1/2/3] | [Behavior type] | [n/4] | [Behavior type] | [n/8] | [Behavior type] | [n/12] |
| [Component name] | [1/2/3] | [Behavior type] | [n/4] | [Behavior type] | [n/8] | [Behavior type] | [n/12] |

Behavior types: Stay | Resize | Reflow | Collapse | Reorder | Hide | Transform | Scroll-enable

---

### Layout Diagrams

#### Mobile (xs: 0px -- 575px) -- 4-column grid, 16px margins

```
[  16px  ][  col 1  ][  col 2  ][  col 3  ][  col 4  ][  16px  ]
┌──────────────────────────────────────────────────────────────────┐
│  [Component A: spans all 4 columns]                              │
├──────────────────────────────────────────────────────────────────┤
│  [Component B: spans all 4 columns]                              │
├──────────────────────────────────────────────────────────────────┤
│  [Component C: spans 4 col] │ [Component D: hidden]              │
├──────────────────────────────────────────────────────────────────┤
│  [Component E: spans all 4 columns]                              │
└──────────────────────────────────────────────────────────────────┘
```

#### Tablet (md: 768px -- 1023px) -- 8-column grid, 24px margins

```
[  32px  ][ col1 ][ col2 ][ col3 ][ col4 ][ col5 ][ col6 ][ col7 ][ col8 ][  32px  ]
┌────────────────────────────────────────────────────────────────────────────────────┐
│  [Component A: spans all 8 columns]                                                │
├────────────────────────────────────────────────────────────────────────────────────┤
│  [Component B: cols 1-5]                │  [Component D: cols 6-8]                 │
├────────────────────────────────────────────────────────────────────────────────────┤
│  [Component C: cols 1-8]                                                           │
└────────────────────────────────────────────────────────────────────────────────────┘
```

#### Desktop (lg: 1024px -- 1279px) -- 12-column grid, 40px margins, 1200px max-width

```
[ auto ][ c1 ][ c2 ][ c3 ][ c4 ][ c5 ][ c6 ][ c7 ][ c8 ][ c9 ][ c10 ][ c11 ][ c12 ][ auto ]
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  [Component A: cols 1-12, max-width 1200px, auto-centered]                                   │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  [Component B: cols 1-8]                             │  [Component D: cols 9-12, sticky]     │
│  [Component C: cols 1-8]                             │                                        │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Component-Specific Notes

| Component | Notes |
|-----------|-------|
| [Component name] | [Specific behavior notes, touch target requirements, image aspect ratios, interaction states] |

---

### Responsive Typography

| Role | xs--sm | md | lg+ | Fluid Clamp (optional) | Notes |
|------|--------|----|----|------------------------|-------|
| h1 | [px] | [px] | [px] | clamp([min], [v], [max]) | [e.g., display heading, tighter line-height 1.1] |
| h2 | [px] | [px] | [px] | -- | |
| h3 | [px] | [px] | [px] | -- | |
| h4 | [px] | [px] | [px] | -- | |
| body | 16px | 16px | [px] | -- | Never below 16px |
| small / caption | 14px | 14px | 14px | -- | Never below 12px |
| label / eyebrow | [px] | [px] | [px] | -- | |

Line length target: [ch or px] maximum for prose content
Line height body: 1.5 -- 1.6 all breakpoints
Line height headings: 1.1 -- 1.25 all breakpoints

---

### Responsive Spacing Tokens

| Token | xs--sm | md | lg+ | Notes |
|-------|--------|----|----|-------|
| page-margin | [px] | [px] | [px] | Horizontal safe area |
| section-gap | [px] | [px] | [px] | Vertical gap between major sections |
| component-gap | [px] | [px] | [px] | Gap between components within a section |
| card-padding | [px] | [px] | [px] | Internal card padding |
| form-field-gap | [px] | [px] | [px] | Vertical gap between form fields |
| nav-height | [px] | [px] | [px] | Height of sticky header |

---

### Touch Target Notes (Mobile Only)

| Component | Visual Size | Touch Target | Expansion Method |
|-----------|-------------|--------------|------------------|
| [Component] | [px × px] | 44 × 44px minimum | [padding / after pseudo-element / wrapping hit area] |

---

### Design Decisions and Rationale

- [Decision 1: Why a specific behavior was chosen over an alternative]
- [Decision 2: Content priority reasoning]
- [Decision 3: Breakpoint selection rationale]
- [Decision 4: Navigation pattern choice]
- [Decision 5: Typography scale rationale]

### Implementation Notes for Handoff

- [Note about component dependencies]
- [Note about image handling and aspect ratios]
- [Note about sticky element z-index layering order]
- [Note about any browser/device-specific behavior]
```

---

## Rules

1. **Never specify fewer than three breakpoints.** Even the simplest responsive layout requires mobile (0--767px), tablet (768--1023px), and desktop (1024px+) tiers. Two-breakpoint specs are insufficient and produce layouts that break at common intermediate viewport widths like 800px or 900px.

2. **Every component in the inventory must appear in the Component Behavior Matrix.** No component is exempt from responsive specification. "We'll figure it out in development" is not a valid entry. If a component has no responsive change, its behavior is "Stay" -- document it explicitly.

3. **Priority 1 components must never use the Hide behavior at any breakpoint.** They may use Collapse (accessible via interaction), Resize, Reorder, or Transform -- but hiding them removes access to critical content. If something seems like a candidate for hiding on mobile, reconsider whether it should be Priority 1.

4. **Body text must be at least 16px at every breakpoint, including xs.** 16px is the baseline for comfortable reading on mobile devices at standard viewing distance. 14px body text forces users to zoom, which defeats the purpose of a responsive layout. Captions and labels may use 14px but never lower.

5. **Line length for prose content must not exceed 80 characters per line.** Beyond 80 characters, horizontal eye tracking becomes fatiguing. Control this with container max-width or column span constraints, not by reducing font size. Flag any layout where a single full-width column on desktop would exceed this limit.

6. **Touch targets on mobile and tablet breakpoints must be specified at 44x44px minimum.** This applies to the interactive hit area, not the visual footprint. A 24px icon can have a 44px touch target via padding. Never leave small interactive elements (inline text links, icon buttons, small checkboxes) unaddressed in a mobile spec.

7. **Data tables must have an explicit mobile strategy -- horizontal scroll, card transformation, or priority column hiding.** A data table with no mobile specification will break the layout on narrow viewports. Choose one strategy based on the data type and user need, and document it clearly.

8. **Navigation must be fully specified at every breakpoint.** Specify: the collapsed state trigger (breakpoint at which hamburger appears), the drawer open/close behavior, what the overlay does to content behind it, and whether the bottom navigation bar pattern is used for primary navigation items on mobile.

9. **Sticky elements must be cataloged and their stacking order specified.** A page with a sticky header, a sticky sidebar, and a sticky CTA bar has three elements competing for viewport space on mobile. Specify which sticky elements are active at which breakpoints, and what the total height of sticky elements is at each tier (this affects the scroll offset for in-page anchors).

10. **The spec must be self-contained and unambiguous.** If a developer or another designer can look at the spec and reasonably interpret a component's behavior in two different ways, the spec is incomplete. Every behavior specification should include both the behavior type and the column span, not just one or the other. "Sidebar: hidden on mobile" is incomplete; "Sidebar: Hide at xs--sm, Reorder below article body at md (cols 1--8), sticky 4-col right rail at lg+ (cols 9--12)" is complete.

11. **Fluid typography clamp values must be validated at the minimum and maximum viewport widths.** A `clamp()` value that seems right at 1440px can produce unreadably large headings at 1920px or unacceptably small headings at 320px. Always verify the output of the clamp formula at both boundary values.

12. **Maximum container widths must be specified for every breakpoint tier where the layout is not fully fluid.** Omitting the max-width for a 2xl breakpoint results in content stretching to 2560px on ultrawide monitors, producing extremely long line lengths and a layout that appears broken.

---

## Edge Cases

**1. Tables with more than eight columns**
Standard responsive table strategies break down with very wide data tables (eight or more columns). For these:
- On desktop: full table, but ensure the container allows horizontal overflow with visible scrollbar (not hidden scroll)
- On tablet: implement column visibility toggles -- a small control that lets users show/hide columns, with the three most critical columns always visible. This is preferable to forcing horizontal scroll on a mid-size viewport.
- On mobile: card transformation is mandatory. Map each column to a label-value pair. Define a visual hierarchy within the card: the identifier (e.g., name, ID, product title) is the card heading; the most important metrics are in the card body; secondary columns are in a collapsed "see more" section.
- If the table is a financial or analytical tool where column comparison is the primary task, consider a different presentation -- a chart, a summary tile grid, or a filterable single-column list -- rather than a responsive table at all.

**2. WCAG Reflow compliance (1.4.10)**
WCAG 2.1 Success Criterion 1.4.10 requires that content reflows at 320px CSS width (equivalent to 1280px viewport at 400% browser zoom) without loss of content or functionality, and without requiring two-dimensional scrolling. This means:
- No horizontally scrolling content sections at 320px (the only exception is content that intrinsically requires horizontal scroll, like a data table or a map)
- Sticky elements at 320px must not consume more than 25% of the viewport height combined
- Any horizontal layout at tablet or desktop must fully reflow to single-column at 320px
- Test the spec explicitly against this requirement if the product has accessibility obligations. Note in the spec which components require specific reflow behavior for WCAG compliance.

**3. Large image galleries and media grids**
- Grid-to-grid reflow (4-col to 2-col to 1-col) is the standard approach
- Images must have specified aspect ratios at each breakpoint. A 4-col gallery using 1:1 square thumbnails can maintain that ratio throughout. A 4-col gallery using 16:9 thumbnails will produce very tall 1-col cards on mobile and may need to switch to 1:1 or 4:3 at xs
- Lazy loading and progressive enhancement should be noted in the spec: which images load on initial render vs. scroll. This is a layout concern because deferred images affect layout shift (CLS).
- Lightbox or expanded view behavior: specify whether the full-screen image viewer uses a different layout at mobile (full-screen overlay with no padding) vs. desktop (centered modal with backdrop)

**4. Forms with conditional fields and dynamic layout changes**
- A form that shows additional fields based on user input can change its vertical height unpredictably. Specify minimum and maximum estimated heights at each breakpoint for forms with conditional fields.
- Multi-step forms on mobile need a progress indicator. Specify its position (top of form, sticky at bottom) and whether it collapses below a certain number of steps.
- Inline validation state changes (error messages appearing below a field) add height to the form. Specify that the layout must accommodate inline error messages without layout shift -- typically by reserving space below each field or by overlaying the error state.

**5. Pages with multiple independent sticky elements**
- Sticky header + sticky sidebar + sticky bottom CTA bar on mobile means three elements consuming fixed viewport space. The safe maximum is one sticky element on mobile viewports below 600px height.
- Specify a "sticky budget": on mobile, only the header is sticky; the CTA bar uses sticky positioning only if the user has not interacted with the primary CTA (implement via JavaScript state, not CSS alone); the sidebar is not sticky.
- On desktop, define the top offset for any sticky sidebar: `top: [header height + 16px]` so it does not overlap the sticky header.
- If a cookie consent banner is present (fixed to the bottom), it should be factored into the sticky element stack. Document its height at each breakpoint and how other sticky elements adjust.

**6. RTL (right-to-left) language support**
- If the interface will be localized to Arabic, Hebrew, Persian, or other RTL languages, the entire grid and component order must mirror horizontally.
- Navigation drawers that open from the left on LTR open from the right on RTL.
- Sidebars that are on the right column on LTR move to the left column on RTL.
- Text alignment, icon directionality, and progress indicators all reverse.
- Note RTL support explicitly in the spec if applicable. Do not rely on visual layout alone -- specify logical properties (padding-inline-start rather than padding-left) in the implementation notes.

**7. Print layout requirements**
- If the page may be printed (common for articles, invoices, receipts, reports, legal documents), specify a print breakpoint separate from responsive breakpoints.
- Print layout: single column, no sticky elements, no fixed-position elements, no background colors (except where functionally meaningful, like status badges), navigation hidden, social share hidden, all Priority 1 and Priority 2 content visible.
- Specify page break behavior for content blocks: avoid page breaks within a card, within a table row, or within a heading-paragraph pair.
- Print font size: body text at 11--12pt (approximately 14.7--16px for print), headings scaled proportionally.

**8. Foldable and split-screen devices**
- Foldable devices (Samsung Galaxy Fold-class) have a unique "folded inner" viewport of approximately 717px wide in the book posture and 884px in the tent/tablet posture. Standard tablet breakpoints do not cleanly accommodate these.
- If the product targets foldable device users, add a note in the spec flagging the 600px--720px range as requiring explicit testing.
- Split-screen mode on tablets and large phones presents a viewport that is narrower than the physical screen -- a 1024px tablet in 50% split-screen appears as a 512px viewport. This means the mobile layout must function well at 512px, not just 375px.

---

## Example

**Input:** "Design the responsive layout for a SaaS product pricing page. It has a site header with navigation and a 'Sign in' button, a hero section with headline and subheadline, a three-plan pricing table (Free, Pro, Enterprise) where each plan has a feature list and a CTA button, a feature comparison table with 12 rows and 4 columns (feature name + three plan columns), a testimonials section with three customer quotes, an FAQ accordion with eight questions, and a full-width footer with links."

---

**Output:**

## Responsive Layout: SaaS Pricing Page

### Breakpoints and Grid

| Tier | Breakpoint Range | Columns | Gutter | Page Margin | Container Max-Width |
|------|-----------------|---------|--------|-------------|---------------------|
| xs (mobile-sm) | 0px -- 575px | 4 | 16px | 16px | 100% (fluid) |
| sm (mobile-lg) | 576px -- 767px | 4 | 16px | 20px | 100% (fluid) |
| md (tablet) | 768px -- 1023px | 8 | 24px | 32px | 100% (fluid) |
| lg (desktop-sm) | 1024px -- 1279px | 12 | 24px | 40px | 1200px |
| xl (desktop-lg) | 1280px+ | 12 | 32px | 64px | 1440px |

Design direction: Mobile-first (SaaS pricing pages have high mobile research traffic)
Layout archetype: Commerce / conversion -- CTAs must be visible and accessible at every breakpoint

---

### Component Behavior Matrix

| Component | Priority | Behavior xs--sm | Col Span xs | Behavior md | Col Span md | Behavior lg+ | Col Span lg |
|-----------|----------|-----------------|-------------|-------------|-------------|--------------|-------------|
| Site header + nav | 1 | Collapse (hamburger drawer) | 4/4 | Collapse (hamburger drawer) | 8/8 | Stay (full horizontal nav) | 12/12 |
| Sign in button | 1 | Stay (visible in header) | inline | Stay (visible in header) | inline | Stay (visible in header) | inline |
| Hero headline | 1 | Resize (28px) | 4/4 | Resize (36px) | 8/8 | Resize (52px) | 8/12 centered |
| Hero subheadline | 1 | Resize (16px) | 4/4 | Resize (18px) | 8/8 | Resize (20px) | 6/12 centered |
| Pricing cards (×3) | 1 | Reflow (1-col stack) | 4/4 each | Reflow (1-col stack) | 8/8 each | Stay (3-col equal) | 4/12 each |
| Plan CTA buttons | 1 | Stay (full-width per card) | 4/4 | Stay (full-width per card) | 8/8 | Stay (full-width per card) | 4/4 within card |
| "Most popular" badge | 1 | Stay (on Pro card) | inline | Stay (on Pro card) | inline | Stay (on Pro card) | inline |
| Feature comparison table | 2 | Transform (card list per feature row) | 4/4 | Scroll-enable (freeze col 1) | 8/8 | Stay (full table) | 12/12 |
| Testimonials (×3) | 2 | Reflow (1-col stack) | 4/4 each | Reflow (3-col grid) | 8/8 (2+hidden) or horizontal scroll | Stay (3-col grid) | 4/12 each |
| FAQ accordion (×8) | 2 | Stay (accordion, all collapsed) | 4/4 | Stay (accordion) | 8/8 | Stay (accordion, or 2-col split) | 6/12 each column |
| Footer links | 3 | Reflow (stacked accordion) | 4/4 | Reflow (2-column) | 4/8 each col | Stay (4-column) | 3/12 each col |
| Footer legal text | 2 | Stay (below footer links) | 4/4 | Stay | 8/8 | Stay | 12/12 |

---

### Layout Diagrams

#### Mobile (xs: 0px -- 575px) -- 4-column grid, 16px margins

```
┌──────────────────────────────────────────────────────────────────┐
│  [Header: sticky, hamburger icon right, logo left, full width]   │
├──────────────────────────────────────────────────────────────────┤
│  [Hero: centered text, headline 28px, subhead 16px, 40px gap]    │
│  [Primary CTA: full-width button, 48px height]                   │
├──────────────────────────────────────────────────────────────────┤
│  [Pricing card: Free -- full width, feature list, CTA]           │
│  [Pricing card: Pro -- full width, "Most Popular" badge, CTA]    │
│  [Pricing card: Enterprise -- full width, feature list, CTA]     │
├──────────────────────────────────────────────────────────────────┤
│  [Feature comparison: "Compare all features" toggle button]      │
│  [Expands to: card list, each row = feature name + 3 checkmarks] │
├──────────────────────────────────────────────────────────────────┤
│  [Testimonial 1: full width card]                                │
│  [Testimonial 2: full width card]                                │
│  [Testimonial 3: full width card]                                │
├──────────────────────────────────────────────────────────────────┤
│  [FAQ: 8 items, accordion, all collapsed by default]             │
├──────────────────────────────────────────────────────────────────┤
│  [Footer: link categories stacked, accordion per category]       │
│  [Footer legal: copyright, policy links]                         │
└──────────────────────────────────────────────────────────────────┘
```

#### Tablet (md: 768px -- 1023px) -- 8-column grid, 24px margins

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  [Header: sticky, hamburger icon right, logo left, nav collapsed]                  │
├────────────────────────────────────────────────────────────────────────────────────┤
│  [Hero: cols 1-8, headline 36px, subhead 18px, centered, 2 CTA buttons inline]     │
├────────────────────────────────────────────────────────────────────────────────────┤
│  [Pricing card: Free, cols 1-8]  (stacked vertically on tablet)                    │
│  [Pricing card: Pro, cols 1-8, "Most Popular" badge]                               │
│  [Pricing card: Enterprise, cols 1-8]                                              │
├────────────────────────────────────────────────────────────────────────────────────┤
│  [Feature comparison table: cols 1-8, col 1 frozen, cols 2-4 horizontal scroll]    │
├────────────────────────────────────────────────────────────────────────────────────┤
│  [Testimonial 1: cols 1-4]       │   [Testimonial 2: cols 5-8]                     │
│  [Testimonial 3: cols 1-4, below row]                                              │
├────────────────────────────────────────────────────────────────────────────────────┤
│  [FAQ: cols 1-8, accordion]                                                        │
├────────────────────────────────────────────────────────────────────────────────────┤
│  [Footer: 2-column link groups, cols 1-4 and cols 5-8]                             │
│  [Footer legal: cols 1-8]                                                          │
└────────────────────────────────────────────────────────────────────────────────────┘
```

#### Desktop (lg: 1024px+) -- 12-column grid, 40px margins, 1200px max-width

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  [Header: cols 1-12, max-width centered, full horizontal nav, Sign in button top right]       │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  [Hero: cols 3-10 (centered), headline 52px, subhead 20px, 2 CTA buttons inline, 96px gap]   │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  [Pricing card: Free (cols 1-4)] [Pricing card: Pro (cols 5-8)] [Enterprise (cols 9-12)]      │
│  Pro card slightly elevated with shadow and "Most Popular" badge at top                       │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  [Feature comparison table: cols 1-12, full table, all 4 columns visible, 12 data rows]       │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  [Testimonial 1: cols 1-4]  [Testimonial 2: cols 5-8]  [Testimonial 3: cols 9-12]            │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  [FAQ: cols 1-6 (left column, 4 questions)]  [FAQ: cols 7-12 (right column, 4 questions)]    │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  [Footer: 4-col link groups, each 3/12 cols, max-width centered]                             │
│  [Footer legal: cols 1-12, centered]                                                         │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Component-Specific Notes

| Component | Notes |
|-----------|-------|
| Site header | Nav collapses to hamburger at md and below. Drawer opens from the right. Backdrop overlay behind open drawer is semi-transparent (not full black). Header height: xs 56px, md 64px, lg 72px. |
| Pricing cards | On mobile, display in order: Free, Pro, Enterprise (top to bottom). "Most Popular" (Pro) is second in stacked order -- most visible on mobile without needing to scroll past it. Cards stack with 16px vertical gap on mobile, 24px on tablet, no vertical gap (equal height row) on desktop. |
| Feature comparison table | On mobile: the table is hidden by default behind a "Compare all plans" disclosure button to prevent overwhelming scroll. When expanded, each feature row becomes: Feature name (bold), then Free: ✓/✗, Pro: ✓/✗, Enterprise: ✓/✗ in a stacked label-value format.
