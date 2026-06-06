---
name: wireframe-specification
description: |
  Produces tool-agnostic wireframe specifications with component lists, layout grids, content hierarchy annotations, and interaction notes for any screen or page.
  Use when the user asks to wireframe a page, plan a screen layout, define page structure, or create a low-fidelity design spec.
  Do NOT use for high-fidelity visual design (use design-system-foundations), user flow diagrams (use user-flow-mapping), or interactive prototype definitions (use prototype-spec).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design planning template"
  category: "design-creative"
  subcategory: "ui-ux-design"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Wireframe Specification

## When to Use

**Use this skill when:**
- The user asks to wireframe a specific page, screen, or view and needs a structured specification document -- not just a verbal description of layout
- The user wants to plan a new screen before any visual design begins, including establishing the component inventory, grid system, and content hierarchy
- The user has a content inventory (text blocks, images, data, forms) and needs help organizing it into a structured layout with clear prioritization logic
- The user is handing off a design intent to developers or stakeholders who need a precise structural blueprint without visual design artifacts
- The user wants to compare multiple layout options for the same screen before committing to a direction (produce two abbreviated specs and annotate the trade-offs)
- The user is redesigning an existing screen and needs to document which components are retained, repositioned, or replaced
- The user is building a design system-backed interface and needs to document which existing components from a component library map to each zone before visual design begins

**Do NOT use when:**
- The user wants pixel-level visual design choices including color palettes, typography scales, spacing tokens, or visual style -- use `design-system-foundations` instead
- The user wants to map the navigation flow between multiple screens or define how users move through a product -- use `user-flow-mapping` instead
- The user wants to define micro-interactions, animation timing, easing curves, or transition choreography between states -- use `prototype-spec` instead
- The user wants a working clickable prototype built in code or described as interactive behavior chains -- use `prototype-spec` instead
- The user wants an accessibility audit of an existing design -- this skill informs accessible structure but is not an audit tool
- The user asks for branding, logo design, or illustration direction -- those are visual design concerns outside structural wireframing
- The user needs a full information architecture sitemap rather than a single-screen specification -- use `information-architecture-mapping` instead

---

## Process

### Step 1: Clarify Screen Context and Goals

Before producing any specification, gather the minimum viable context. Ask only if the information is missing -- do not ask questions the user has already answered.

- **Screen identity:** What is the screen called, and what single job does it do for the user? (e.g., "Checkout -- Payment Step," "Admin Dashboard -- Campaign Overview," "Mobile Onboarding -- Step 2 of 4")
- **Business goal vs. user goal:** Distinguish between what the business wants (conversion, signups, engagement) and what the user wants (complete a task, find information, make a decision). Both must be served -- the primary action bridges them.
- **User type and mental model:** Who is using this screen? A first-time visitor has different expectations than a returning power user. This affects where the L1 element lands and how much instruction or affordance to include.
- **Device target:** Desktop (1280px+ viewport), tablet (768px-1024px), mobile (320px-767px), or responsive across all three. If the user says "responsive," clarify whether desktop or mobile is the design-first direction -- this determines which grid is canonical and which adapts.
- **Existing constraints:** Fixed header height, persistent sidebar width, bottom navigation bar on mobile, modal overlay context. These are non-negotiable structural facts that shape every zone below them.
- **Technical constraints:** If the user mentions a framework or component library (e.g., Material Design, Bootstrap, Ant Design), note that the grid and component names should align with those conventions. Do not embed tool-specific syntax, but do align naming so handoff is precise.

### Step 2: Define the Layout Grid

The grid is the structural skeleton. Every component position is relative to it. Avoid vague terms like "wide" or "narrow" -- always use explicit column counts, pixel widths, and gutter measurements.

- **Standard desktop grid:** 12 columns, 1280px or 1440px max-width (1440px for marketing pages, 1280px for application screens), 24px gutters, 80px column width at 1280px. Use 32px gutters at 1440px for breathing room.
- **Tablet grid:** 8 columns at 768px, 12 columns at 1024px if content complexity warrants it. 16px gutters are standard. 24px outer margins preserve thumb reach zones on the sides.
- **Mobile grid:** 4 columns at 375px (iPhone baseline) or 360px (Android baseline). 16px gutters, 16px outer margins. A 2-column mobile grid is only appropriate for dense card grids (e-commerce thumbnails, icon grids). Never use a 1-column mobile grid for data-heavy screens -- two columns give visual rhythm even for stacked content.
- **Fixed vs. fluid:** Application screens (dashboards, SaaS tools) typically use a fixed max-width grid centered in the viewport. Marketing and editorial pages often use full-bleed sections that ignore the content grid for backgrounds while keeping content within it.
- **Vertical rhythm baseline:** Establish an 8px baseline grid for vertical spacing. All row heights and spacing between zones should be multiples of 8px (8, 16, 24, 32, 40, 48, 64, 80). This is the single most important practice for achieving visual consistency across zones.
- **Row notation:** Estimate row spans in units of 8px blocks, not arbitrary row numbers. For example, the header zone is typically 64px tall (8 units) on desktop, 56px on mobile. The hero zone is 400-600px depending on content density. Use these estimates to flag when a screen will exceed a single viewport height and require scrolling.

### Step 3: Map Content Zones

Content zones are the named structural regions of the screen. Every zone has a clear purpose. Never create a zone without a reason -- the most common wireframe error is inventing zones that fragment what should be a single content area.

- **Standard zone vocabulary:** Header, Hero, Value Proposition, Content Body, Sidebar, Data Panel, Form Section, Interstitial (notification bars, banners), Footer. Use these names consistently so stakeholders and developers share a common vocabulary.
- **Zone sizing heuristics:**
  - Standard desktop header: 64-80px tall
  - Full-bleed hero: 400-600px (marketing); 120-200px (application screen header bar)
  - Primary content zone: fills remaining viewport minus header and footer
  - Sidebar: 240-280px fixed width on desktop, collapses to hidden drawer on mobile
  - Footer: 240-320px for marketing sites (multi-column links); 64px for application screens (status bar or pagination)
- **Above-fold discipline:** On desktop at 768px viewport height (conservative -- some viewports are 900px or 1080px), everything above 768px from the top of the page is above the fold. On mobile at 667px (iPhone SE landscape is a useful constraint), the fold is even higher. Priority 1 components must land within this window. Document the estimated fold line explicitly in the spec.
- **Zone ordering principle:** Zones should be ordered by decreasing immediacy. What the user needs to orient (header), then what they need to understand the page purpose (hero or title), then what they need to accomplish the primary action (content/form zone), then supporting details (sidebar or secondary content), then closure (footer). Deviating from this order requires an explicit rationale.
- **Zone dependency:** Flag when zones are conditional. For example, a notification banner zone only appears when there is an active alert. A zero-state zone appears when a data table has no rows. Document these conditions as "conditional zones" with their trigger described.

### Step 4: Enumerate Components Per Zone

For each zone, produce a complete component inventory. Being incomplete here causes missed requirements during development.

- **Component naming discipline:** Use specific noun phrases that describe the component's function, not its appearance. "Primary CTA Button" not "Big Button." "Contextual Help Tooltip" not "Tooltip." "Persistent Breadcrumb Trail" not "Breadcrumbs." This naming survives design and development handoff.
- **Component taxonomy:** Assign each component one of five types: **Text** (headings, body copy, labels, legal), **Media** (images, video, icons, illustrations), **Interactive** (buttons, links, toggles, selects, inputs), **Data Display** (tables, charts, lists, cards, grids), **Container** (accordion, modal, tab panel, drawer -- components that house other components). Containers must list their child components.
- **Priority scoring (1-3):**
  - Priority 1: Must be visible above the fold. Removing it breaks the screen's primary purpose.
  - Priority 2: Important, but can be below the fold. Enhances understanding or supports secondary actions.
  - Priority 3: Supplementary. Can be hidden on mobile, deferred to an overlay, or collapsed into an accordion without damaging the core experience.
- **Column span specificity:** Don't say "full width" -- say "cols 1-12." Don't say "half the page" -- say "cols 1-6 of 12." This precision prevents misinterpretation in handoff. For centered content that doesn't use the full grid, specify offset: "cols 3-10 of 12 (centered, 8-column content column)."
- **Component count thresholds:** If a single zone contains more than 7-8 components at the same hierarchy level, it is likely doing too much. Recommend splitting the zone or introducing sub-zones. The human eye can parse approximately 7 items at the same priority level before the display creates cognitive overload (Miller's Law applied to layout).

### Step 5: Assign Visual Hierarchy

Visual hierarchy determines where the eye goes first, second, and third. Getting this wrong is the most common reason wireframes produce poor visual designs downstream.

- **The one-L1 rule:** Every screen has exactly one Level 1 (dominant) element. This is the single element with the most visual weight. On a landing page it is usually the hero headline. On a dashboard it is the primary KPI. On a checkout screen it is the order total or the CTA. If you cannot identify it, the screen lacks a clear purpose -- go back to Step 1.
- **L1 characteristics:** Occupies the most prominent position (top-center, or the largest single element). Is at minimum 2x the visual weight of surrounding L2 elements. On text-dominated screens, this means the largest type size on the page. On data screens, this means the largest or most isolated data element.
- **L2 characteristics (2-4 per screen):** Support the L1 by providing context, action, or navigation. On a pricing page, the CTA button on each plan card is L2. On a dashboard, section headings and chart titles are L2. L2 elements guide the user toward the primary action.
- **L3 characteristics (everything else):** Labels, metadata, secondary links, legal text, supporting descriptions. These are necessary but not attention-seeking. They answer questions the user asks after engaging with L1 and L2.
- **Hierarchy annotation in tables:** Mark L1, L2, L3 in the component table. After completing the table, audit it: confirm there is exactly 1 L1, 2-4 L2 components, and that no Priority 1 component is marked L3 (a Priority 1 component must be at least L2 -- if it is worth being above the fold, it deserves L2 visual weight).

### Step 6: Write Interaction Annotations

Interaction annotations are the behavioral contract for each interactive component. They specify what happens without specifying how it looks -- that is for visual design.

- **Trigger vocabulary:** Use precise terms: `click` (desktop mouse), `tap` (touch), `hover` (desktop-only -- do not specify hover behavior for mobile components), `keyboard focus` (required for accessibility), `scroll` (viewport event), `load` (page or component initialization).
- **Response vocabulary:** Specify the behavioral outcome: `navigate to [screen name]`, `reveal [component name]`, `collapse [component name]`, `filter list by [criterion]`, `submit form and show [state]`, `expand accordion panel`, `open [overlay type]`. Vague responses like "something happens" or "shows more info" are unacceptable annotations.
- **State inventory:** Every interactive component must have its full state inventory documented. Minimum viable state sets:
  - Button: default, hover, active (pressed), focused, disabled, loading, success
  - Input field: default, focused, filled, error, disabled
  - Toggle: on, off, disabled
  - Link: default, hover, visited, focused
  - Card (clickable): default, hover, selected, disabled
  - Accordion: collapsed, expanded, loading (if dynamic)
- **Empty and error states are not optional:** Any component that displays data must document its empty state (no data yet) and its error state (data failed to load). These states are consistently the most forgotten in wireframe specs and the most painful to discover during development.
- **Accessibility interaction note:** For each interactive component, add a one-line keyboard interaction: what Tab order it appears in, and what happens on Enter/Space. This is not a full accessibility audit, but it flags keyboard traps and navigation assumptions early.

### Step 7: Define Responsive Behavior Per Component

For responsive designs, do not produce three separate wireframe specs. Instead, annotate each component with its cross-breakpoint behavior.

- **Four responsive behaviors:** Assign each component one of four labels:
  - **Stays:** Appears at all breakpoints in the same position and function
  - **Reorders:** Appears at all breakpoints but moves in the layout (common for sidebars that drop below content on mobile)
  - **Collapses:** Visible at desktop but hidden or abbreviated at mobile (e.g., navigation becomes hamburger menu; comparison table collapses to card format)
  - **Hides:** Removed entirely at a smaller breakpoint (e.g., decorative illustration removed on mobile; secondary marketing copy hidden)
- **Reorder priority:** When content reorders on mobile, document the new vertical order explicitly. "Sidebar drops below content" is not sufficient -- specify: "Sidebar content appears between content zone and footer, in this order: filter panel (collapsed by default), related articles list."
- **Touch target sizes:** On mobile, every interactive component must have a minimum touch target of 44x44px (Apple HIG) or 48x48dp (Material Design). Flag any component that is likely to violate this -- small inline links, dense icon buttons, tightly packed list items.
- **Content truncation decisions:** When text content cannot fit at mobile widths, specify the truncation strategy: clamp to N lines with "read more" expand, truncate with ellipsis (for labels only), or wrap to additional lines. Never leave this unspecified -- developers will make inconsistent choices.

### Step 8: Compile and Validate the Specification

Before delivering the spec, run this validation checklist internally:

- [ ] Exactly one L1 component exists on the screen
- [ ] At least one Priority 1 component is in the above-fold zone
- [ ] Every interactive component has at minimum 2 states documented
- [ ] Every data display component has an empty state documented
- [ ] No zone contains more than 7-8 peer-level components (split if needed)
- [ ] Grid column spans are specific numbers, not vague descriptors
- [ ] Mobile responsive behavior is documented for every Priority 1 and Priority 2 component
- [ ] The primary action is identified and corresponds to at least one L1 or L2 component
- [ ] Component names are specific noun phrases, not generic labels

---

## Output Format

```
## Wireframe Specification: [Screen Name]

### Overview
| Field                | Value                                                    |
|----------------------|----------------------------------------------------------|
| Screen name          | [e.g., "Checkout -- Payment Step"]                       |
| Screen purpose       | [One sentence: what job this screen does for the user]   |
| Primary action       | [The single most important thing a user does here]       |
| Target device(s)     | [Desktop / Tablet / Mobile / Responsive -- desktop-first / Responsive -- mobile-first] |
| Design-first breakpoint | [The canonical breakpoint this spec is designed for] |
| Estimated scroll depth | [e.g., "1.8x viewport height" or "single viewport"]   |
| Above-fold line      | [e.g., "768px from top on desktop, 667px on mobile"]     |
| Conditional display  | [Any conditions under which this screen appears or changes, if applicable] |

---

### Layout Grid

| Property          | Desktop (1280px) | Tablet (768px) | Mobile (375px) |
|-------------------|------------------|----------------|----------------|
| Columns           | 12               | 8              | 4              |
| Max content width | 1280px           | 768px          | 375px          |
| Column width      | ~80px            | ~80px          | ~72px          |
| Gutter width      | 24px             | 16px           | 16px           |
| Outer margin      | auto (centered)  | 16px           | 16px           |
| Baseline grid     | 8px              | 8px            | 8px            |

[Note: Omit Tablet column if the screen has no tablet-specific behavior distinct from desktop]

---

### Content Zones

#### Zone 1: [Zone Name]
- **Purpose:** [What this zone accomplishes structurally]
- **Estimated height (desktop):** [e.g., 64px, 400px, auto]
- **Above fold?** [Yes / Partially / No]
- **Conditional?** [No / Yes -- appears when [condition]]

| Component               | Type         | Priority | Grid Span (desktop) | Hierarchy | Responsive Behavior |
|-------------------------|--------------|----------|---------------------|-----------|---------------------|
| [Component name]        | [type]       | [1/2/3]  | cols [X]-[Y] of 12  | L[1/2/3]  | [Stays/Reorders/Collapses/Hides] |
| [Component name]        | [type]       | [1/2/3]  | cols [X]-[Y] of 12  | L[1/2/3]  | [Stays/Reorders/Collapses/Hides] |

**Zone notes:** [Any structural decisions specific to this zone, e.g., "sticky on scroll," "full-bleed background," "max-width does not apply here"]

---

(Repeat Zone block for each zone)

---

### Interaction Annotations

| Component               | Trigger        | Response                              | States                                     | Keyboard Interaction             |
|-------------------------|----------------|---------------------------------------|--------------------------------------------|----------------------------------|
| [Component name]        | [click/tap/hover/scroll/load] | [Specific behavioral outcome] | [List all states: default, hover, ...]     | [Tab order position; Enter/Space behavior] |

---

### Responsive Behavior Summary

| Component               | Desktop                        | Tablet                          | Mobile                          |
|-------------------------|--------------------------------|---------------------------------|---------------------------------|
| [Component name]        | [desktop behavior]             | [tablet behavior or "same as desktop"] | [mobile behavior]          |

---

### Content Priority Summary

**Above fold (Priority 1 components):**
- [List each Priority 1 component with its zone and L-level]

**Below fold (Priority 2 components):**
- [List each Priority 2 component with its zone]

**Supplementary / deprioritized (Priority 3):**
- [List each Priority 3 component with its zone]

**Hidden or collapsed on mobile:**
- [List each component marked Hides or Collapses, with the collapsed behavior described]

---

### Empty and Error States

| Component               | Empty State                          | Error State                          |
|-------------------------|--------------------------------------|--------------------------------------|
| [Data component name]   | [What appears when no data exists]   | [What appears when data fails]       |

---

### Wireframe Annotations (Structural Decisions)

1. [Decision: e.g., "Navigation is sticky on desktop to provide persistent wayfinding during long scroll. On mobile, it is fixed at the bottom as a tab bar rather than a hamburger menu, reducing tap depth to 1."]
2. [Decision: e.g., "Comparison table is hidden on mobile because 15-column data tables are not legible at 375px. Mobile users see a feature checklist per card instead."]
3. [Additional structural rationale as needed]
```

---

## Rules

1. **One L1 per screen, always.** Multiple L1-designated components cancel each other out -- the eye has no clear anchor and the screen feels chaotic. If you are tempted to designate two L1 elements, you are probably looking at two separate screens or a screen that needs a dominant organizing element introduced.

2. **Grid column spans must be specific integers.** Never write "full width," "half width," or "centered." Write "cols 1-12," "cols 1-6," "cols 3-10 (centered, 8 of 12 columns used)." Vague span descriptions produce inconsistent implementations.

3. **Hover states are desktop-only.** Never specify hover behavior for mobile components. Touch devices have no hover event. Mobile interactive states are: default, pressed (active), focused, disabled, loading, error. A common mistake is writing a hover state for a mobile card -- this creates a broken interaction expectation.

4. **Priority 1 components must be above the fold without exception.** If a component is Priority 1 and it falls below the estimated fold line, either the fold estimate is wrong or the component priority is wrong. Recalculate -- do not leave the contradiction unresolved.

5. **Empty states and error states are required for all data display components.** Tables, card grids, charts, lists, and feeds that display dynamic data must document what appears when there is no data and when the data load fails. Omitting these causes UI gaps during development that get patched inconsistently.

6. **Do not name design tools.** Produce tool-agnostic specifications. A wireframe spec should be implementable in any design environment. Avoid references to any specific design application. Use terms like "wireframe tool," "design file," or "component library."

7. **Mobile touch targets must be flagged when at risk.** Any interactive component that could render below 44x44px at mobile -- inline text links, icon-only buttons, tightly spaced list items -- must include a note: "Minimum 44x44px touch target required. Pad with invisible hit area if visual size is smaller."

8. **Sidebar zones do not exist on mobile.** Any component in a desktop sidebar must have an explicit mobile disposition: collapsed into an off-canvas drawer, moved above content, moved below content, or hidden entirely. "Sidebar collapses on mobile" is not a complete annotation -- specify what happens to each sidebar component individually.

9. **Component names survive across all deliverables.** The names given in this spec become the vocabulary for design files, developer tickets, QA test cases, and analytics event names. Use the same specific noun phrases everywhere. "Primary CTA Button" in the wireframe spec should be "Primary CTA Button" in the component library and the developer ticket -- not "submit-btn" in one and "actionButton" in another.

10. **Every interactive component must list its disabled state if it can be disabled.** Form submit buttons, navigation links, filter controls, and CTAs frequently have disabled states that depend on application logic (form not yet valid, user lacks permission, feature is unavailable). If the component can be disabled, document it. Undocumented disabled states become accessibility and UX defects.

11. **Conditional zones must document their trigger.** A notification banner, promotional ribbon, or contextual help panel that only appears sometimes must document the condition: "appears when user has not completed email verification," "appears when A/B test variant B is active," "appears when cart is empty." Unconditional zones have no trigger annotation.

12. **Validate against Miller's Law before finalizing.** Each zone should contain no more than 7 (plus or minus 2) peer-level components. If a zone has 10+ components at the same priority and hierarchy level, split it into logical sub-zones or introduce a container component (tabs, accordion, card grid) to create internal grouping.

---

## Edge Cases

### Single-Purpose Landing Page (Minimal Content)
When a landing page has one message and one action -- a product launch page, a waitlist signup, a countdown page -- resist the urge to add zones. The entire page may be: Header (logo only, no nav), Hero (headline + subheadline + single CTA + optional supporting image), and minimal Footer (legal text only). The hero zone IS the content zone. The L1 is the headline. The L2 is the CTA button. Everything else is L3. The spec will be short. That is correct. Do not pad it with unnecessary zones to make it look thorough -- a sparse wireframe for a sparse page is the right output.

### Data-Dense Dashboard
Dashboards break the standard zone hierarchy because there is no single hero moment -- the entire screen is the content. Handle this as follows: eliminate the Hero zone; replace it with a KPI Summary Bar (a horizontal strip of 3-5 primary metrics, each as a Priority 1 component). The Content zone becomes a Panel Grid. Each panel is a container component with its own internal L2 hierarchy (panel title is L2, chart or data inside is the data, controls are L3). For desktop, use a 2x2 or 3x2 panel grid. Document which panels are fixed in the viewport (visible without scrolling) and which require vertical scroll. Critically, every chart and data panel must document its empty state, loading state, and error state -- dashboards with live data will encounter all three constantly.

### Form-Heavy Screen (Multi-Step Checkout, Registration, Survey)
Forms that exceed 5-7 fields benefit from section grouping. Treat each logical form section as its own zone (Personal Information zone, Payment Details zone, Order Review zone). Each zone has a section heading (L2), field list, and inline validation rules. The primary action is always the final submit or "Next Step" button -- it is L2 in the final section zone and should be the only CTA visible at each step. Progress indicators (step 1 of 4) are Priority 1, L2, placed in the header zone. Document field-level validation states: empty, focused, filled-valid, filled-invalid (with error message), and disabled. Specify tab order explicitly for complex forms -- keyboard navigation through multi-column form layouts is frequently broken without explicit annotation.

### Content-Rich Editorial or Blog Page
Editorial pages have high content volume but low interaction density. The primary action is usually implicit (reading, sharing, subscribing). Treat the article body as a single "Article Content" zone with an internal content model annotation: pull quotes, inline images, code blocks, callout boxes, embedded media. These are not separate components -- they are content variants within a single zone. The sidebar on editorial pages typically contains: Author bio, Table of contents (anchor-linked), Related articles, Social share. On mobile, the table of contents collapses to a sticky bar at top, the sidebar content moves below the article body, and social share converts to a bottom-fixed share bar. Document this transformation explicitly.

### Modal or Overlay Screens
Modals are screens within screens. When wireframing a modal, produce a separate mini-spec for the overlay itself, then annotate the trigger component in the parent screen's interaction table. The modal spec must include: overlay backdrop (does clicking it close the modal? -- document the behavior), modal container dimensions (e.g., 640px wide, max 80vh tall, vertically centered), close affordance (X button, Escape key), scroll behavior within the modal (does the modal scroll or does it grow?), and focus trap annotation (keyboard focus must be contained within the modal while it is open -- this is an accessibility requirement, not optional). Modal zones are typically: Modal Header (title + close button), Modal Body (form or content), Modal Footer (primary and secondary CTAs).

### Authenticated vs. Unauthenticated State for the Same Screen
Some screens have meaningfully different layouts depending on login state. A homepage may show a hero + marketing content when logged out and a dashboard + personalized content when logged in. Do not produce one wireframe with ambiguous annotations. Produce two specifications: "[Screen Name] -- Logged Out" and "[Screen Name] -- Logged In." Call out the architectural decision explicitly: "These are treated as separate screens despite sharing the same URL because their component inventories, hierarchy, and primary actions differ fundamentally."

### Zero-Data and First-Use States
The first time a user reaches a screen after onboarding -- before they have created any content, connected any data, or performed any actions -- the screen may be nearly empty. This is the zero-data state, and it requires its own wireframe annotation. For dashboards: show an empty panel grid with onboarding prompts inside each panel ("Connect your data to see this chart"). For list screens: show the empty list illustration + a single prominent CTA ("Create your first [item]"). For feed screens: show a curated default feed or an explicit empty state with guidance. Document the zero-data layout as a conditional variant within the spec -- do not leave it undocumented.

### Right-to-Left (RTL) Language Support
If the product supports Arabic, Hebrew, Persian, or other RTL languages, every directional layout decision in the spec must include an RTL note. Grid columns mirror (col 1 becomes col 12), navigation items flip order, icons with directional meaning (arrows, chevrons, breadcrumbs) reverse direction, left-aligned text becomes right-aligned. Flag this at the top of the spec as a global constraint rather than annotating every individual component. Note which components have non-obvious RTL behavior: data tables (column order reversal), progress steps (reverse flow direction), carousels (reverse swipe direction).

---

## Example

**Input:** "I need a wireframe spec for a B2B SaaS application -- specifically the 'Campaign Performance' dashboard screen. Desktop-first, responsive. The user is a marketing manager who wants to see how their email campaigns are performing. They need to see open rates, click rates, and revenue attributed. They can drill down into individual campaigns. There's a persistent left sidebar navigation in the app shell."

---

## Wireframe Specification: Campaign Performance Dashboard

### Overview

| Field                   | Value                                                                                    |
|-------------------------|------------------------------------------------------------------------------------------|
| Screen name             | Campaign Performance Dashboard                                                           |
| Screen purpose          | Give marketing managers a consolidated view of email campaign metrics so they can identify high- and low-performing campaigns and take action                     |
| Primary action          | Drill down into an individual campaign to view detailed performance data                 |
| Target device(s)        | Responsive -- desktop-first (desktop primary, mobile secondary)                          |
| Design-first breakpoint | 1280px desktop                                                                           |
| Estimated scroll depth  | ~1.5x viewport height (KPI bar + filters + campaign table require scroll for 10+ campaigns) |
| Above-fold line         | 768px from top of content area (excluding app shell header and sidebar)                  |
| Conditional display     | Full data view when campaigns exist; zero-data state when no campaigns have been created |

---

### Layout Grid

| Property          | Desktop (1280px)              | Mobile (375px)                          |
|-------------------|-------------------------------|-----------------------------------------|
| Columns           | 12 (within content area)      | 4                                       |
| Max content width | Fluid within sidebar layout   | 375px                                   |
| Content area width | ~992px (1280px minus 240px sidebar minus 48px padding) | 343px (375px minus 16px margins) |
| Column width      | ~72px                         | ~72px                                   |
| Gutter width      | 24px                          | 16px                                    |
| Outer margin      | 24px padding inside content area | 16px                                 |
| Baseline grid     | 8px                           | 8px                                     |

**Grid note:** The left sidebar is a fixed 240px app shell element. The 12-column grid applies only to the content area to the right of the sidebar. All column references in this spec are relative to the content area grid, not the full viewport.

---

### Content Zones

#### Zone 1: App Shell -- Persistent Left Sidebar
- **Purpose:** Primary application navigation. Persistent across all application screens.
- **Estimated height (desktop):** 100% viewport height, fixed
- **Above fold?** Yes -- always visible
- **Conditional?** No

| Component               | Type         | Priority | Grid Span (content area) | Hierarchy | Responsive Behavior |
|-------------------------|--------------|----------|--------------------------|-----------|---------------------|
| App logo / wordmark     | Media        | 2        | N/A (sidebar)            | L3        | Collapses to icon-only top bar on mobile |
| Primary nav links (5 items) | Interactive | 2     | N/A (sidebar)            | L3        | Collapses to bottom tab bar on mobile (top 4 items; overflow in More tab) |
| Active nav indicator (Campaigns) | Text | 2   | N/A (sidebar)            | L3        | Stays -- active state reflected in bottom tab bar |
| User account menu       | Interactive  | 3        | N/A (sidebar)            | L3        | Collapses to avatar icon in top-right corner on mobile |
| Workspace switcher      | Interactive  | 3        | N/A (sidebar)            | L3        | Hides on mobile (accessible via account menu) |

**Zone notes:** Sidebar is fixed-position and does not scroll with page content. It is a pre-existing app shell component -- this spec does not redesign it, only documents its presence as a layout constraint.

---

#### Zone 2: Page Header Bar
- **Purpose:** Orient the user to the current screen, enable date range filtering, and provide page-level actions.
- **Estimated height (desktop):** 72px
- **Above fold?** Yes
- **Conditional?** No

| Component               | Type         | Priority | Grid Span (content area) | Hierarchy | Responsive Behavior |
|-------------------------|--------------|----------|--------------------------|-----------|---------------------|
| Page title ("Campaign Performance") | Text | 1 | cols 1-5 of 12         | L2        | Stays -- single line, 20px type |
| Date range selector     | Interactive  | 1        | cols 7-9 of 12           | L2        | Stays -- collapses to icon + label on mobile |
| Export report button    | Interactive  | 3        | cols 10-11 of 12         | L3        | Hides on mobile (available via overflow menu) |
| Create campaign button  | Interactive  | 2        | cols 12 of 12            | L2        | Stays -- icon-only on mobile with 44x44px tap target |

**Zone notes:** Date range selector is the second most important control on this screen -- changing it re-queries all data. Default range is last 30 days. The selector is positioned in the top-right content area, not toolbar-right, because the sidebar occupies the far-left position.

---

#### Zone 3: KPI Summary Bar
- **Purpose:** Surface the three headline metrics (Open Rate, Click Rate, Revenue Attributed) at a glance so the user can assess overall performance before drilling into campaign data.
- **Estimated height (desktop):** 120px
- **Above fold?** Yes
- **Conditional?** Yes -- shows skeleton loading state while data fetches; shows error state if query fails

| Component               | Type         | Priority | Grid Span (content area) | Hierarchy | Responsive Behavior |
|-------------------------|--------------|----------|--------------------------|-----------|---------------------|
| Open Rate KPI card      | Data Display | 1        | cols 1-4 of 12           | L1        | Reorders -- stacks vertically on mobile, full width |
| Click Rate KPI card     | Data Display | 1        | cols 5-8 of 12           | L1        | Reorders -- stacks vertically, second in order |
| Revenue Attributed KPI card | Data Display | 1   | cols 9-12 of 12          | L1        | Reorders -- stacks vertically, third in order |

**L1 note:** These three KPI cards collectively constitute the L1 element for this dashboard. Each card has internal hierarchy: the metric value (e.g., "24.3%") is L1 within the card, the metric label ("Open Rate") is L2, and the comparison to previous period ("+2.1% vs last period") is L3. This is an intentional exception to the single-L1 rule -- on dashboards with a KPI summary bar, the bar as a group functions as L1, with no single metric elevated above the others.

Each KPI card contains:
- Metric label (text, L3 within card): "Open Rate," "Click Rate," "Revenue Attributed"
- Primary metric value (data display, L1 within card): large numeral + unit (%, %, $)
- Period-over-period comparison (text, L3 within card): delta value + directional arrow icon + color coding (green up, red down)
- Sparkline mini-chart (data display, L3 within card): 30-day trend, no axis labels, 5px stroke

---

#### Zone 4: Filter and Segment Bar
- **Purpose:** Allow users to filter the campaign table by status, channel, tag, or campaign owner.
- **Estimated height (desktop):** 56px
- **Above fold?** Yes (combined with Page Header Bar and KPI Summary Bar, total above-fold height = 72 + 120 + 56 = 248px, leaving ~520px of campaign table above fold)
- **Conditional?** No

| Component               | Type         | Priority | Grid Span (content area) | Hierarchy | Responsive Behavior |
|-------------------------|--------------|----------|--------------------------|-----------|---------------------|
| Status filter dropdown  | Interactive  | 2        | cols 1-2 of 12           | L3        | Collapses into "Filters" button on mobile that opens filter drawer |
| Channel filter dropdown | Interactive  | 2        | cols 3-4 of 12           | L3        | Collapses into filter drawer on mobile |
| Tag filter dropdown     | Interactive  | 3        | cols 5-6 of 12           | L3        | Collapses into filter drawer on mobile |
| Search campaigns input  | Interactive  | 2        | cols 8-11 of 12          | L3        | Stays -- full width on mobile |
| Active filter chips     | Interactive  | 2        | cols 1-7 of 12 (dynamic) | L3        | Stays -- scrollable horizontally on mobile |

**Zone notes:** When filters are active, filter chips appear below the filter dropdowns and push the campaign table down. This zone grows dynamically. The search input always stays visible at desktop; it is the primary fallback when filters are unknown.

---

#### Zone 5: Campaign Performance Table
- **Purpose:** List all campaigns within the selected date range with their key metrics. Enable sorting, row-level drill-down, and bulk actions.
- **Estimated height (desktop):** ~480px for 10 rows at 48px row height; scrollable for additional rows
- **Above fold?** Partially -- first 5-6 rows visible above fold; remainder requires scroll
- **Conditional?** Yes -- zero-data state when no campaigns exist; empty-results state when filters return no matches

| Component               | Type         | Priority | Grid Span (content area) | Hierarchy | Responsive Behavior |
|-------------------------|--------------|----------|--------------------------|-----------|---------------------|
| Table column headers (sortable) | Interactive | 1 | cols 1-12 of 12        | L2        | Collapses -- mobile uses card list format, not table |
| Campaign name + status badge | Interactive | 1 | cols 1-4 of 12         | L2        | Stays -- primary cell in mobile card |
| Sent date               | Text         | 2        | col 5 of 12              | L3        | Hides on mobile |
| Recipients count        | Data Display | 2        | col 6 of 12              | L3        | Hides on mobile |
| Open rate (%)           | Data Display | 1        | col 7 of 12              | L2        | Stays -- shown in mobile card |
| Click rate (%)          | Data Display | 1        | col 8 of 12              | L2        | Stays -- shown in mobile card |
| Revenue attributed ($)  | Data Display | 1        | col 9 of 12              | L2        | Stays -- shown in mobile card |
| Unsubscribes count      | Data Display | 3        | col 10 of 12             | L3        | Hides on mobile |
| Row action menu (overflow) | Interactive | 2      | col 12 of 12             | L3        | Stays -- accessible via long-press or swipe on mobile |
| Bulk select checkbox    | Interactive  | 3        | col 1 (leftmost, 32px)   | L3        | Hides on mobile |
| Pagination controls     | Interactive  | 2        | cols 1-12 (table footer) | L3        | Stays -- page size reduced to 10 on mobile |

**Zone notes:** Table rows are the primary navigation mechanism -- clicking any row navigates to the Campaign Detail screen. Row height is 48px at desktop (accommodates two-line campaign names). Column widths are proportional, not equal -- Campaign Name column is the widest (approximately 28% of table width). Sortable columns are: Campaign Name, Sent Date, Open Rate, Click Rate, Revenue Attributed. Default sort is Sent Date descending (most recent first).

---

#### Zone 6: Zero-Data State (Conditional -- replaces Zone 5 when no campaigns exist)
- **Purpose:** Guide new users to create their first campaign when the table would otherwise be empty.
- **Estimated height (desktop):** 320px centered in the table area
- **Above fold?** Yes
- **Conditional?** Yes -- displays only when the user has zero campaigns in the account

| Component               | Type         | Priority | Grid Span (content area) | Hierarchy | Responsive Behavior |
|-------------------------|--------------|----------|--------------------------|-----------|---------------------|
| Empty state illustration | Media       | 2        | cols 4-9 of 12 (centered) | L2       | Stays -- scaled to 120px on mobile |
| Zero-state heading      | Text         | 1        | cols 3-10 of 12 (centered) | L2      | Stays                |
| Zero-state body text    | Text         | 2        | cols 4-9 of 12 (centered) | L3       | Stays                |
| Create First Campaign CTA | Interactive | 1       | cols 5-8 of 12 (centered) | L2       | Stays -- full width on mobile |

---

### Interaction Annotations

| Component               | Trigger    | Response                                                       | States                                                              | Keyboard Interaction                                                 |
|-------------------------|------------|----------------------------------------------------------------|---------------------------------------------------------------------|----------------------------------------------------------------------|
| Date range selector     | click/tap  | Opens a date range picker overlay with preset options (Last 7d, 30d, 90d, Custom) | default, open, selecting-start, selecting-end, applied, error  | Tab to focus; Enter to open; arrow keys to navigate dates; Escape to close |
| KPI card                | load       | Fetches metric data for selected date range; displays value    | loading (skeleton), populated, error (failed to load)               | N/A (not interactive -- data display only)                           |
| Status filter dropdown  | click/tap  | Opens dropdown with status options: All, Draft, Scheduled, Sent, Paused, Archived | default, open, option-hovered, option-selected, multi-selected, applied | Tab to focus; Enter to open; arrow keys to navigate options; Enter to select; Escape to close |
| Active filter chip      | click/tap  | Removes that filter from the active set; re-queries table data | default, hover, removing                                            | Tab to focus; Enter or Delete to remove chip                         |
| Search campaigns input  | type (300ms debounce) | Filters campaign table rows to matching campaign names in real time | default, focused, filled, no-results                       | Tab to focus; typing begins search; Escape to clear                  |
| Table column header (sortable) | click | Sorts table by that column; second click reverses sort order; icon shows current sort direction | default, sort-asc, sort-desc, hover       | Tab to focus header; Enter to sort; second Enter to reverse           |
| Table row               | click/tap  | Navigates to Campaign Detail screen for that campaign (full-page navigation, not overlay) | default, hover, active (click/tap)          | Tab to focus row; Enter to navigate                                  |
| Row action menu (overflow) | click/tap | Opens a contextual menu: View, Duplicate, Archive, Delete   | default, hover, open, destructive-hover (red for Delete)            | Tab to focus; Enter to open; arrow keys to navigate; Enter to select; Escape to close |
| Bulk select checkbox (row) | click    | Selects that row for bulk action; updates header checkbox state | unchecked, checked, indeterminate (header only when partial selection) | Tab to focus; Space to toggle                                        |
| Export report button    | click      | Initiates report download (CSV) for current filter state; shows inline loading state in button | default, hover, loading, success (brief checkmark), error | Tab to focus; Enter to trigger |
| Create campaign button  | click/tap  | Navigates to Campaign Creation flow (first step)               | default, hover, active                                              | Tab to focus; Enter to navigate                                      |
| FAQ accordion (if present) | click   | Expands panel                                                  | collapsed, expanded                                                 | Tab to focus; Enter or Space to toggle                               |
| Mobile "Filters" button | tap        | Opens filter drawer from bottom of screen (bottom sheet pattern) | default, active, drawer-open                                    | N/A (mobile-only component)                                          |
| Pagination controls     | click/tap  | Navigates to next/previous page of campaigns; re-queries table | default, hover, active, disabled (at first/last page)               | Tab to focus controls; Enter to activate                             |

---

### Responsive Behavior Summary

| Component                    | Desktop (1280px)                               | Mobile (375px)                                          |
|------------------------------|------------------------------------------------|---------------------------------------------------------|
| Left sidebar navigation      | Fixed 240px, full height                       | Bottom tab bar, 4 primary items + More                  |
| Page title                   | Inline in page header bar                      | Top of page, stacked above controls                     |
| Date range selector          | Inline in page header bar (right-aligned)      | Icon + date label, reduced to abbreviated text          |
| Export button                | Visible in page header bar                     | Hidden -- accessible via overflow menu (3-dot)          |
| KPI cards                    | 3 cards in a horizontal row, full content area | Stacked vertically, full width, same order              |
| Sparkline in KPI card        | Visible                                        | Hidden (insufficient width)                             |
| Filter dropdowns             | Inline horizontal row                          | Collapsed into "Filters" bottom-sheet drawer            |
| Search input                 | Right-aligned in filter bar                    | Full width, above filter button row                     |
| Campaign table               | Full data table, 10 visible columns            | Card list format: Campaign name, Open Rate, Click Rate, Revenue, Status badge, row action |
| Table column headers         | Visible and sortable                           | Hidden -- sorting via "Sort by" option in filter drawer |
| Unsubscribes column          | Visible                                        | Hidden                                                  |
| Sent date column             | Visible                                        | Hidden                                                  |
| Recipients count column      | Visible                                        | Hidden                                                  |
| Bulk select checkboxes       | Visible                                        | Hidden                                                  |
| Pagination controls          | Bottom of table, page size 25                  | Bottom of list, page size 10                            |

---

### Empty and Error States

| Component               | Empty State                                                                 | Error State                                                                   |
|-------------------------|-----------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| Open Rate KPI card      | "--" displayed as metric value; label reads "No data for selected period"   | Error icon + "Failed to load" text + Retry link                               |
| Click Rate KPI card     | Same as Open Rate KPI card empty state                                      | Same as Open Rate KPI card error state                                        |
| Revenue Attributed KPI card | Same as Open Rate KPI card empty state                                  | Same as Open Rate KPI card error state                                        |
| Campaign Performance Table | Zero-data state (Zone 6 spec above) OR empty-results state: icon + "No campaigns match your filters" text + "Clear filters" link | Error state: icon + "Failed to load campaigns" text + Retry button |
| Date range selector     | N/A (always has a default value)                                            | If custom date range is invalid (end before start): inline error below selector |

---

### Content Priority Summary

**Above fold (Priority 1 components -- visible without scrolling at 1280x768 viewport):**
- Page title ("Campaign Performance") -- Page Header Bar, L2
- Date range selector -- Page Header Bar, L2
- Open Rate KPI card -- KPI Summary Bar, L1
- Click Rate KPI card -- KPI Summary Bar, L1
- Revenue Attributed KPI card -- KPI Summary Bar, L1
- Campaign Performance Table (first 5-6 rows) -- Campaign Table Zone, L2
- Table column headers (sortable) -- Campaign Table Zone, L2

**Below fold (Priority 2 components):**
- Campaign rows 7+ (requires scroll for 7+ campaigns)
- Pagination controls
- Filter and segment bar (technically above fold but low visual priority)

**Supplementary / deprioritized (Priority 3):**
- Export report button
- Bulk select checkboxes
- Unsubscribes column
- Workspace switcher (sidebar)
- User account menu (sidebar)

**Hidden or collapsed on mobile:**
- Left sidebar nav -- Collapses to bottom tab bar (top 4 nav items; Workspace Switcher moves to account menu)
- Export button -- Hides; accessible via
