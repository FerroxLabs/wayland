---
name: accessibility-review
description: |
  Conducts a WCAG 2.1 AA accessibility review covering color contrast, keyboard navigation, screen reader markup, touch targets, and ARIA labels with a structured remediation checklist.
  Use when the user asks to review accessibility, check WCAG compliance, audit for screen reader compatibility, or evaluate keyboard navigation.
  Do NOT use for general UX audits (use ux-audit), visual hierarchy critique (use visual-hierarchy-review), or responsive layout testing (use responsive-layout-design).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "accessibility design checklist"
  category: "design-creative"
  subcategory: "ui-ux-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Accessibility Review

## When to Use

**Use this skill when:**
- The user asks for a WCAG 2.1 AA (or AAA) compliance review of a specific interface, page, or component
- The user wants to audit color contrast ratios, keyboard navigation flows, or screen reader markup on a design mockup or live interface
- The user needs a structured remediation checklist before handing a design off to developers or before a product launch
- The user asks how to make a specific interface element -- modal dialog, data table, custom dropdown, date picker, carousel -- accessible
- The user wants to evaluate touch target sizes, gesture alternatives, or mobile accessibility for an iOS or Android interface
- The user needs to assess form accessibility including label associations, error identification, and autocomplete attributes
- The user wants to validate ARIA usage on a component and confirm roles, states, and properties are correctly applied
- The user describes an accessibility complaint received from a user with a disability or a result from an automated accessibility scan and wants to understand severity and remediation

**Do NOT use when:**
- The user wants a general usability audit covering task completion, information architecture, or cognitive load beyond disability-specific concerns -- use `ux-audit`
- The user wants to critique visual hierarchy, typography scale, or design aesthetics -- use `visual-hierarchy-review`
- The user wants to design or test responsive breakpoints and fluid layouts -- use `responsive-layout-design`
- The user wants to write the actual accessible HTML, CSS, or JavaScript implementation -- use a software-development skill for that implementation work; this skill covers the review and specification of what needs to be implemented
- The user wants to conduct user research with participants who have disabilities -- this requires participant recruitment, consent protocols, and research methodology beyond an audit
- The user wants a legal compliance opinion on whether an interface meets ADA, Section 508, or EN 301 549 requirements -- recommend consulting a qualified accessibility attorney or certified auditor for legal opinions

---

## Process

### Step 1 -- Gather Context and Scope the Review

Before evaluating anything, establish what you are reviewing and at what fidelity. Ask or infer:

- **Interface type:** Web page (document vs. web app), native mobile app (iOS/Android), desktop application, PDF document, or design mockup (static image, Figma/Sketch spec, wireframe)
- **Target conformance level:** Default to WCAG 2.1 AA unless the user specifies AAA or a regulatory framework (Section 508 references WCAG 2.0 AA; EN 301 549 references WCAG 2.1 AA)
- **Component inventory:** What interactive components exist? Identify forms, modals, dropdowns, carousels, data tables, accordions, tabs, date pickers, rich text editors, media players, maps, and any custom widgets
- **User population considerations:** Any specific disability groups to prioritize -- low vision users (contrast, zoom), blind users (screen reader), motor impairment (keyboard only, switch access), cognitive disabilities (plain language, error prevention), deaf or hard of hearing (captions, transcripts)
- **Artifacts available:** Live URL, design file screenshots, HTML source snippet, component specification, or verbal description. Note what cannot be evaluated without running code.
- **Existing findings:** Any prior audit results, automated scan reports (axe, Lighthouse, Deque), or user-reported issues that should anchor the review

If the user provides a verbal description only, state explicitly which findings are inferred from the description and which would require live testing to confirm.

---

### Step 2 -- Evaluate Perceivable Criteria (WCAG Principle 1)

Work through each sub-principle systematically. For each finding, record the criterion number, a specific finding, and a specific fix.

**1.1 -- Text Alternatives (SC 1.1.1)**
- Every non-text element (image, icon, chart, infographic, CAPTCHA, video thumbnail, decorative divider) needs a text alternative or must be explicitly marked decorative
- Decorative images: `alt=""` on `<img>` or `role="presentation"` / `aria-hidden="true"` on SVG and icon fonts
- Informative images: `alt` text that conveys the meaning, not just a file name or "image of..."
- Functional images (logo linked to home, icon button): `alt` text describes the function, not the appearance ("Return to homepage", not "Company logo")
- Complex images: charts and infographics need a short alt plus a long description -- either adjacent visible text, a `<figure>` with `<figcaption>`, or `aria-describedby` pointing to a descriptive paragraph. The description must convey the same data insight as the visual.
- Icon fonts (Font Awesome, Material Icons rendered via CSS): These are invisible to screen readers unless `aria-hidden="true"` is on the icon element and a visually hidden label is provided to the parent button/link
- Animated GIFs that convey information need a text alternative; purely decorative animated GIFs should be `aria-hidden`

**1.3 -- Adaptable Structure (SC 1.3.1, 1.3.2, 1.3.3, 1.3.4, 1.3.5)**
- Heading hierarchy must be logical and not skip levels (h1 -> h2 -> h3, never h1 -> h3). A page should have exactly one `<h1>`.
- Landmark regions must be present: `<header>`, `<nav>`, `<main>`, `<footer>`, and optionally `<aside>`, `<section>` (with accessible name). Every visible page region should map to a landmark.
- Lists of items must use `<ul>`, `<ol>`, or `<dl>` -- not manually typed bullets or numbers in a paragraph
- Data tables must use `<table>` with `<th>` for headers and `scope="col"` or `scope="row"` on header cells. Complex tables (multi-level headers) require `id`/`headers` attribute pairings.
- Reading order in the DOM must match visual reading order. If CSS positions content visually out of DOM order, screen readers and keyboard users will encounter a confusing sequence.
- Instructions must not rely solely on sensory characteristics: "click the red button" fails; "click the Submit button" passes. "The form is on the right" fails; "The form below the navigation" passes.
- SC 1.3.4 -- Orientation: Do not lock content to portrait or landscape unless essential (e.g., a piano app)
- SC 1.3.5 -- Identify Input Purpose: For inputs collecting personal data, add `autocomplete` attributes: `autocomplete="name"`, `autocomplete="email"`, `autocomplete="current-password"`, `autocomplete="new-password"`, `autocomplete="tel"`, `autocomplete="street-address"`, `autocomplete="postal-code"`, `autocomplete="cc-number"`, etc. This benefits users with cognitive disabilities and password managers.

**1.4 -- Distinguishable (SC 1.4.1 through 1.4.13)**

Color contrast is the most commonly failed criterion. Apply these exact thresholds:

| Text Type | Minimum (AA) | Enhanced (AAA) |
|---|---|---|
| Normal text (below 18px regular or 14px bold) | 4.5:1 | 7:1 |
| Large text (18px+ regular or 14px+ bold) | 3:1 | 4.5:1 |
| UI component boundaries, icons, focus indicators | 3:1 | N/A (AAA) |
| Inactive/disabled elements | Exempt | Exempt |
| Logo/brand elements | Exempt | Exempt |

- Always state contrast as a specific ratio (e.g., "2.7:1, fails the 4.5:1 AA minimum by 40%"). Never say "low contrast" without a number.
- Common contrast failures to check: placeholder text in inputs (almost always too light), hint/helper text, disabled-looking but actually active elements, ghost buttons with colored text on white, light gray text on white (#767676 is the lightest gray that passes 4.5:1 on white -- anything lighter fails)
- SC 1.4.1 -- Color alone: State indicators, error states, required field markers, and graph series must use more than color. Add an icon, pattern, text label, or border in addition to color.
- SC 1.4.4 -- Resize text: Text must be readable and functional at 200% browser zoom without horizontal scrolling at 320px viewport width (a proxy for SC 1.4.10 Reflow)
- SC 1.4.10 -- Reflow: At 320 CSS pixels wide, content must reflow to a single column without horizontal scroll. This tests zoom behavior on mobile.
- SC 1.4.11 -- Non-text contrast: The visible boundary of an input field, the track of a slider, the check of a checkbox (if custom-styled), and all meaningful icons must have 3:1 contrast against adjacent colors
- SC 1.4.12 -- Text spacing: Text must remain readable when line-height is set to 1.5x font size, letter-spacing 0.12em, word-spacing 0.16em, and paragraph spacing 2x font size -- without loss of content or functionality
- SC 1.4.13 -- Content on hover/focus: Tooltips and hover popups that appear on keyboard focus or mouse hover must be persistent (don't disappear when the mouse moves over them), dismissible (Escape key closes them without moving focus), and hoverable (the user can move the mouse onto the popup itself)

---

### Step 3 -- Evaluate Operable Criteria (WCAG Principle 2)

**2.1 -- Keyboard Accessible (SC 2.1.1, 2.1.2, 2.1.4)**
- The cardinal rule: every action achievable with a mouse must also be achievable with a keyboard alone
- Tab sequence test: Tab forward through all interactive elements, Shift+Tab backward. Verify every button, link, input, select, checkbox, and custom widget receives focus.
- Keyboard trap test: When focus enters a modal, datepicker, or third-party widget, can the user Tab out or press Escape to dismiss? A keyboard trap is a WCAG 2.1.2 critical failure.
- Custom widget keyboard patterns (ARIA Authoring Practices Guide patterns):
  - **Menu/navigation:** Arrow keys move between items, Enter/Space activates, Escape closes, Tab moves out of menu
  - **Tabs:** Arrow keys switch tabs, Tab moves to tab panel content
  - **Accordion:** Enter/Space expands/collapses panel, arrow keys optionally move between headers
  - **Dialog/modal:** Tab cycles within modal only, Escape closes, focus returns to trigger on close
  - **Listbox/combobox:** Arrow keys navigate options, Enter selects, Escape closes dropdown, type-ahead filtering is expected
  - **Date picker:** Arrow keys navigate days, Page Up/Down navigate months, Home/End jump to start/end of week
  - **Carousel/slider:** Arrow keys move between slides, pause button stops autoplay
- SC 2.1.4 -- Character Key Shortcuts: If single-character keyboard shortcuts are implemented, they must be remappable, disableable, or only active on focus

**2.4 -- Navigable (SC 2.4.1 through 2.4.7)**
- SC 2.4.1 -- Skip links: A "Skip to main content" link must be the first focusable element on every page. It can be visually hidden until focused, but must become visible on focus and must work (actually move focus to `<main>` or the landmark).
- SC 2.4.2 -- Page titles: Format as "Page Name -- Site Name". Every page must have a unique title. Single-page apps must update `document.title` on route changes.
- SC 2.4.3 -- Focus order: The tab sequence must follow a logical reading flow. A common failure: modals that open at the bottom of the DOM while visually appearing in the center -- focus continues behind the modal overlay.
- SC 2.4.4 -- Link purpose: "Read more", "Click here", "Learn more", "Download" are failures when appearing multiple times on a page. Each link must be uniquely identifiable from its text or from its text plus programmatic context (the containing heading, list item, table cell, or `aria-label`/`aria-labelledby`).
- SC 2.4.6 -- Headings and labels: Headings must describe their section. Form labels must describe what the field collects, not just format ("Enter your 10-digit phone number" is better than "Phone").
- SC 2.4.7 -- Focus visible: The default browser focus ring must not be removed (`outline: none` or `outline: 0` without a replacement is a critical failure). Replacement focus indicators must meet 3:1 contrast against adjacent colors. WCAG 2.2 SC 2.4.11 (AA) strengthens this to require a minimum 2px perimeter with specified area -- consider flagging this as a forward-looking recommendation.

**2.5 -- Input Modalities (SC 2.5.1 through 2.5.4)**
- SC 2.5.1 -- Pointer gestures: Any functionality using a multipoint (pinch-to-zoom, two-finger swipe) or path-based gesture (swipe to delete, drag-and-drop) must also be operable with a single pointer (tap or click). Alternative: a button labeled "Delete" alongside swipe-to-delete.
- SC 2.5.2 -- Pointer cancellation: For single-pointer events, the action must be completable using the up-event (mouseup, touchend), not the down-event. This allows users to cancel accidentally initiated actions by dragging the pointer off the control before releasing.
- SC 2.5.3 -- Label in name: If a component has a visible text label, its accessible name (from `aria-label`, `aria-labelledby`, or `<label>`) must contain or start with that visible text. A button that says "Submit" must not have `aria-label="Send form"` -- voice control users say what they see.
- SC 2.5.4 -- Motion actuation: Functionality triggered by device motion (shake to undo, tilt to scroll) must have a UI alternative, and motion triggering must be disableable (for users who have involuntary movement).

---

### Step 4 -- Evaluate Understandable Criteria (WCAG Principle 3)

**3.1 -- Readable (SC 3.1.1, 3.1.2)**
- SC 3.1.1: The primary language of the page must be declared in the `<html lang="en">` attribute (or appropriate BCP 47 language code: `fr`, `es`, `zh-Hans`, `ar`, etc.)
- SC 3.1.2: Inline language changes must be marked with `lang` attributes on the specific element. A French phrase in an English page needs `<span lang="fr">...</span>` so screen readers switch pronunciation accordingly.

**3.2 -- Predictable (SC 3.2.1, 3.2.2, 3.2.3, 3.2.4)**
- SC 3.2.1 -- On focus: Receiving focus must not trigger a context change. A dropdown that auto-submits when an option is focused (not selected) fails.
- SC 3.2.2 -- On input: Changing an input value must not cause an unexpected context change. A search field that submits automatically after 3 characters without warning fails. Provide a submit button or warn the user.
- SC 3.2.3 -- Consistent navigation: Navigation menus must appear in the same order and position on every page of a site.
- SC 3.2.4 -- Consistent identification: If a component appears on multiple pages (search field, cart icon, user avatar menu), it must have the same accessible name everywhere.

**3.3 -- Input Assistance (SC 3.3.1 through 3.3.4)**
- SC 3.3.1 -- Error identification: When validation fails, identify the specific field(s) in error and describe what is wrong in text. "Invalid input" fails. "Email address must include an @ symbol" passes.
- SC 3.3.2 -- Labels or instructions: Required fields must be identified (asterisk must be explained before the form, e.g., "* indicates required"). Date formats must be specified inline or in a hint (MM/DD/YYYY vs. YYYY-MM-DD). Password requirements must be visible before submission, not only after an error.
- SC 3.3.3 -- Error suggestion: When a user makes a predictable error (wrong date format, email missing @, zip code wrong length), suggest the correct input format in the error message.
- SC 3.3.4 -- Error prevention: For submissions with legal, financial, health, or data-deletion consequences, provide at least one of: reversibility (undo option), opportunity to review and correct before finalizing, or a confirmation step.

---

### Step 5 -- Evaluate Robust Criteria (WCAG Principle 4)

**4.1 -- Compatible (SC 4.1.1, 4.1.2, 4.1.3)**

SC 4.1.1 (Parsing) is largely addressed by valid HTML, but several patterns still cause real-world screen reader failures:
- Duplicate `id` attributes: If two elements share an `id`, `aria-labelledby` and `<label for>` associations break
- Improperly nested elements: `<button>` inside `<a>`, `<div>` as direct child of `<ul>`, `<p>` wrapping block elements all cause parsing errors
- Unclosed tags or malformed attribute syntax cause assistive technology parsers to misinterpret the tree

SC 4.1.2 -- Name, Role, Value -- is the most technically demanding criterion:
- **Name:** Every interactive element must have an accessible name. Sources in priority order: `aria-labelledby` (references visible text) > `aria-label` (invisible string) > `<label>` (for form controls) > `alt` (for images) > `title` (fallback, not reliable) > element content (for buttons/links)
- **Role:** Native HTML elements carry implicit roles. Custom widgets built from `<div>` or `<span>` must have explicit ARIA roles: `role="button"`, `role="dialog"`, `role="tablist"`, `role="tab"`, `role="tabpanel"`, `role="menu"`, `role="menuitem"`, `role="combobox"`, `role="listbox"`, `role="option"`, `role="grid"`, etc.
- **Value/State:** Interactive elements must expose their current state: `aria-expanded="true/false"` (accordions, dropdowns), `aria-checked="true/false/mixed"` (checkboxes, toggle buttons), `aria-selected="true/false"` (tabs, options), `aria-pressed="true/false"` (toggle buttons), `aria-disabled="true"` (disabled controls that should remain focusable for discovery), `aria-invalid="true"` (fields in error), `aria-required="true"` (required fields, though native `required` attribute is preferred)
- **ARIA rules to enforce:** Never use `aria-label` on an element that already has a matching visible label -- this creates a conflict between what sighted users see and what screen reader users hear. Never use `role="presentation"` or `aria-hidden="true"` on a focusable element. Never place interactive elements inside an `aria-hidden="true"` container.
- SC 4.1.3 -- Status Messages: Messages that appear without a page reload and without receiving focus (success toasts, loading spinners, form error summaries, cart update notices) must be announced to screen readers using `role="status"` (polite), `role="alert"` (assertive, for errors), or `aria-live="polite"/"assertive"`. The live region container must be in the DOM before the message is injected into it.

---

### Step 6 -- Classify, Prioritize, and Assign Remediation Effort

For every finding, assign:

**Result classification:**
- **FAIL** -- Does not meet the applicable WCAG 2.1 AA success criterion. Must be remediated for compliance.
- **WARN** -- Technically passes the criterion but creates a demonstrably poor experience for users with disabilities. Strongly recommended to fix.
- **PASS** -- Meets the criterion.
- **N/A** -- The criterion does not apply (e.g., 1.2.1 Audio-only on a page with no audio content).

**Priority classification:**
- **P1 (Critical):** Blocks access completely -- keyboard trap, no accessible name on primary CTA, missing form labels, media with no alternative. Fix before release.
- **P2 (Serious):** Significantly degrades experience -- low contrast below 3:1, missing focus indicator, error messages not linked to fields. Fix in next sprint.
- **P3 (Moderate):** Creates friction but workaround exists -- missing autocomplete, non-descriptive link text that is still technically unique, small touch targets (30-43px). Fix in backlog.
- **P4 (Minor):** Best practice improvement -- inconsistent focus order that is logical but not optimal, redundant ARIA labels. Fix when convenient.

**Effort estimation:**
- **S (Small):** CSS-only change, single attribute addition -- under 1 hour developer time
- **M (Medium):** HTML restructuring, JavaScript state management, content rewrite -- 1-4 hours
- **L (Large):** Component architecture change, design revision required, third-party replacement -- multi-day

---

### Step 7 -- Compile the Full Review Report

Structure the report using the Output Format below. Include:
- A summary with counts by result type and a highlighted list of P1 critical failures
- Tables for each WCAG principle covering all tested criteria
- A prioritized remediation checklist with P1 items first
- Specific testing recommendations with named tools and assistive technology combinations

---

## Output Format

```
## Accessibility Review: [Interface Name]

### Summary
- **Review date:** [Date or "Based on description provided"]
- **Target level:** WCAG 2.1 AA
- **Artifacts reviewed:** [Live URL / design mockup / component specification / verbal description]
- **Overall result:** [X] failures | [X] warnings | [X] passes | [X] not applicable
- **P1 Critical failures (must fix before release):**
  1. [Criterion X.X.X] -- [One-sentence issue description]
  2. [Criterion X.X.X] -- [One-sentence issue description]

---

### Principle 1 -- Perceivable

| Criterion | SC Title                    | Result | Finding                                         | Required Fix                                              |
|-----------|-----------------------------|--------|-------------------------------------------------|-----------------------------------------------------------|
| 1.1.1     | Non-text content            | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 1.3.1     | Info and relationships      | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 1.3.2     | Meaningful sequence         | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 1.3.3     | Sensory characteristics     | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 1.3.4     | Orientation                 | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 1.3.5     | Identify input purpose      | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 1.4.1     | Use of color                | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 1.4.3     | Contrast (minimum)          | PASS/FAIL/WARN/N/A | [Ratio stated as X.X:1 vs Y.Y:1]   | [Specific hex color fix or N/A]                           |
| 1.4.4     | Resize text                 | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 1.4.10    | Reflow                      | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 1.4.11    | Non-text contrast           | PASS/FAIL/WARN/N/A | [Ratio stated as X.X:1 vs 3:1]     | [Specific fix or N/A]                                     |
| 1.4.12    | Text spacing                | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 1.4.13    | Content on hover or focus   | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |

---

### Principle 2 -- Operable

| Criterion | SC Title                    | Result | Finding                                         | Required Fix                                              |
|-----------|-----------------------------|--------|-------------------------------------------------|-----------------------------------------------------------|
| 2.1.1     | Keyboard                    | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 2.1.2     | No keyboard trap            | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 2.4.1     | Bypass blocks               | PASS/FAIL/WARN/N/A | [Skip link present/absent]          | [Specific fix or N/A]                                     |
| 2.4.2     | Page titled                 | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 2.4.3     | Focus order                 | PASS/FAIL/WARN/N/A | [Tab sequence described]            | [Specific fix or N/A]                                     |
| 2.4.4     | Link purpose                | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 2.4.6     | Headings and labels         | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 2.4.7     | Focus visible               | PASS/FAIL/WARN/N/A | [Focus ring visibility described]   | [Specific CSS fix or N/A]                                 |
| 2.5.1     | Pointer gestures            | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 2.5.3     | Label in name               | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |

---

### Principle 3 -- Understandable

| Criterion | SC Title                    | Result | Finding                                         | Required Fix                                              |
|-----------|-----------------------------|--------|-------------------------------------------------|-----------------------------------------------------------|
| 3.1.1     | Language of page            | PASS/FAIL/WARN/N/A | [lang attribute value or absent]    | [Specific fix or N/A]                                     |
| 3.2.1     | On focus                    | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 3.2.2     | On input                    | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 3.3.1     | Error identification         | PASS/FAIL/WARN/N/A | [Error message description]         | [Specific fix or N/A]                                     |
| 3.3.2     | Labels or instructions      | PASS/FAIL/WARN/N/A | [Label association method noted]    | [Specific fix or N/A]                                     |
| 3.3.3     | Error suggestion            | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |
| 3.3.4     | Error prevention            | PASS/FAIL/WARN/N/A | [Specific observation]              | [Specific fix or N/A]                                     |

---

### Principle 4 -- Robust

| Criterion | SC Title                    | Result | Finding                                         | Required Fix                                              |
|-----------|-----------------------------|--------|-------------------------------------------------|-----------------------------------------------------------|
| 4.1.1     | Parsing                     | PASS/FAIL/WARN/N/A | [Duplicate IDs, nesting issues]     | [Specific fix or N/A]                                     |
| 4.1.2     | Name, role, value           | PASS/FAIL/WARN/N/A | [ARIA usage described]              | [Specific fix or N/A]                                     |
| 4.1.3     | Status messages             | PASS/FAIL/WARN/N/A | [Live region usage described]       | [Specific fix or N/A]                                     |

---

### Remediation Checklist (Ordered by Priority)

| Priority | P-Level | Criterion | Issue Summary                           | Specific Fix                                               | Effort |
|----------|---------|-----------|-----------------------------------------|------------------------------------------------------------|--------|
| 1        | P1      | [X.X.X]   | [Issue in 10 words or fewer]            | [Exact implementation instruction]                         | S/M/L  |
| 2        | P1      | [X.X.X]   | [Issue in 10 words or fewer]            | [Exact implementation instruction]                         | S/M/L  |
| 3        | P2      | [X.X.X]   | [Issue in 10 words or fewer]            | [Exact implementation instruction]                         | S/M/L  |
| 4        | P3      | [X.X.X]   | [Issue in 10 words or fewer]            | [Exact implementation instruction]                         | S/M/L  |

---

### Testing Recommendations

**Automated tools (run these first -- they catch ~30-40% of issues):**
- axe DevTools browser extension: Run against every page template and every interactive component state
- Lighthouse Accessibility audit: Score provides a baseline but miss many issues automated tools cannot detect
- color contrast analyzers: Use the browser's color picker with a contrast calculation tool to test specific color pairs

**Manual keyboard testing (catches issues automated tools miss):**
- [Specific sequences to test for this interface, e.g., "Tab through checkout flow: cart > address > payment > confirmation"]
- Test modal open/close focus management
- Test error state triggering and focus movement
- Verify skip link appears on first Tab press and navigates to `<main>`

**Assistive technology testing combinations:**
| Screen Reader       | Browser          | Platform | Priority |
|---------------------|------------------|----------|----------|
| NVDA (latest)       | Chrome (latest)  | Windows  | High     |
| NVDA (latest)       | Firefox (latest) | Windows  | Medium   |
| JAWS (latest)       | Chrome (latest)  | Windows  | High     |
| VoiceOver           | Safari (latest)  | macOS    | High     |
| VoiceOver           | Safari (latest)  | iOS      | High     |
| TalkBack            | Chrome           | Android  | High     |

**Component-specific testing notes:**
- [Any custom widget found in the interface -- state what screen reader interaction to verify]
```

---

## Rules

1. **Always state contrast ratios as exact numbers.** Never write "low contrast" or "insufficient contrast" without immediately following it with the measured ratio and the required minimum (e.g., "3.1:1, fails the 4.5:1 AA minimum for normal text"). Vague descriptions are not actionable.

2. **Never recommend adding `aria-label` to an element that already has a matching visible text label.** If a button contains visible text that accurately describes its function, no ARIA label is needed. Adding a conflicting `aria-label` breaks SC 2.5.3 (Label in Name) and creates a discrepancy between what sighted users see and what screen reader users hear.

3. **Never recommend `role="button"` on an `<a>` element.** Links (`<a href>`) and buttons serve different semantic and behavioral functions. Links navigate; buttons perform actions. Use the correct native element. If a `<div>` must be interactive, use `<button>` or `<a>` natively before reaching for ARIA roles.

4. **Every FAIL finding must include a concrete implementation fix, not a restatement of the requirement.** "Add a text alternative" is not a fix. "Add `alt='Monthly revenue chart showing 23% growth from Q1 to Q4'` to the `<img>` element" is a fix.

5. **When reviewing a design mockup (not live code), explicitly label interactive/ARIA criteria as "Requires code implementation testing."** Criteria that cannot be assessed from a static design include: keyboard trap (2.1.2), focus order (2.4.3) beyond visual layout, ARIA states (4.1.2), and status message announcements (4.1.3). Provide the design specification (what should happen) rather than a pass/fail verdict.

6. **Validate ARIA against the role's required owned elements and allowed properties.** For example: `role="listbox"` requires children with `role="option"`. `role="combobox"` requires `aria-expanded` and must own a `role="listbox"` or `role="grid"`. `role="dialog"` requires an accessible name via `aria-labelledby` or `aria-label`. A dialog without a name is a critical failure of 4.1.2.

7. **Report `aria-hidden="true"` on focusable elements as a P1 critical failure.** If a keyboard-focusable element (button, link, input) has `aria-hidden="true"`, keyboard users will focus it but screen reader users will receive no announcement -- the element will be silently skipped or announced without context. This is one of the most confusing accessibility failures possible.

8. **Touch target findings must state the estimated or measured pixel dimensions.** "The close button is approximately 20x20px, below the 44x44px minimum" is actionable. "The touch target is too small" is not. When only a design description is available, estimate from proportional context.

9. **Link purpose failures must identify the specific link text that is ambiguous AND provide a proposed fix.** For generic text like "Read more", propose the complete replacement: `"Read more about [article title]"` or the use of `aria-label="Read more about [article title]"` if the visible text must remain truncated for design reasons.

10. **WCAG 2.1 AA does not require AAA criteria -- do not mark AAA-only items as failures.** When a AAA criterion would significantly benefit users (SC 2.4.9 Link Purpose Link Only, SC 1.4.6 Enhanced Contrast, SC 2.5.5 Target Size at 44x44px), list it as a WARN with a note that it exceeds AA requirements. Be explicit that it is a best practice recommendation, not a compliance failure.

11. **Do not evaluate inactive/disabled elements for color contrast.** WCAG 1.4.3 explicitly exempts "inactive user interface components." However, flag if an element appears disabled but is actually active -- that is a different failure of SC 1.3.3 (sensory characteristics) and 3.2.4 (consistent identification).

12. **Order the remediation checklist by P-level first (P1 before P2), then by estimated effort within each P-level (S before M before L).** This prioritizes the highest-impact, lowest-effort fixes at the top.

---

## Edge Cases

### Design Mockup Without Live Code
When only static design artifacts (Figma frames, screenshots, wireframes) are available:
- Evaluate all visual criteria normally: contrast ratios, text alternatives for visible images, touch target sizes (measure against the spec's dimensions), visual focus indicator presence, heading hierarchy from typography styles, landmark regions implied by layout zones, and color-only information encoding.
- For every criterion that requires runtime behavior (keyboard navigation, ARIA state announcements, focus management, error messages, live regions, keyboard traps), write "SPEC REQUIRED" instead of PASS/FAIL and provide the expected behavior specification -- e.g., "When the dropdown opens, focus should move to the first option. Arrow keys should navigate options. Escape should close and return focus to the trigger button."
- Include a section called "Design-Stage Recommendations" that identifies accessibility decisions that must be made in design before development begins: focus indicator style, error state visual design, empty state copy, loading state announcements.

### Single-Page Application (SPA) with Dynamic Route Changes
- The most critical SPA failure: when a route changes, the page title does not update and focus does not move to the new content. Both are WCAG failures (SC 2.4.2 and SC 2.4.3 respectively).
- Recommended pattern: On route change, update `document.title` to the new page title, then move programmatic focus to either the `<h1>` of the new view or to a `role="status"` region that announces the new page name. Do not move focus to `<body>` -- VoiceOver reads the entire page.
- Dynamic content loading (infinite scroll, filtered results, lazy-loaded cards): When new content loads below the current viewport in response to user action, add a `role="status"` announcement like "12 more results loaded" so screen reader users know the page has updated.
- Back-button behavior must restore scroll position and focus to the previously focused element, not always reset to the top.

### Complex Data Visualizations (Charts, Graphs, Maps, Heatmaps)
- A chart's `alt` text must not describe the visual appearance ("A bar chart with blue bars") but must convey the data insight ("Revenue grew from $2.1M in Q1 to $4.7M in Q4 2023, a 124% increase").
- For datasets with more than ~10 data points, a linked or expandable data table is required as an alternative to an exhaustive alt text.
- Color coding in charts (line series, pie segments, legend) must be supplemented with direct labels on data points, distinct patterns/textures, or shapes in addition to color.
- Interactive charts (hover to see value, click to drill down, zoom) must support equivalent keyboard interaction: Tab to the chart, then arrow keys to navigate between data series or individual data points, with values announced via `aria-label` updates or a live region.
- Geographical maps with data overlays (choropleth maps) are among the most difficult to make accessible. At minimum, provide a table with the same data. Consider a textual summary of the geographic patterns. Interactive map controls (zoom, pan) need keyboard equivalents.

### Forms with Complex Validation and Multi-Step Flows
- When a form has multiple error states that appear simultaneously on submit, focus must move to either (a) an error summary at the top of the form listing all errors as links that jump to the relevant fields, or (b) the first field with an error. Never leave focus at the submit button after validation fails.
- Error messages must be programmatically associated with their fields using `aria-describedby`. An error message appearing visually below a field but not connected programmatically fails SC 4.1.2 -- the screen reader user hears the field label but not the error.
- For multi-step forms (wizards, checkout flows), the current step must be announced. Use `aria-current="step"` on the active step indicator, or announce step progress via a live region: "Step 2 of 4: Shipping address."
- Password strength meters must be announced via `aria-live="polite"` so screen reader users receive real-time feedback as they type, not just after blur.
- File upload controls need accessible names. The native `<input type="file">` exposes its label via `<label>`. Custom drag-and-drop upload zones must have `role="button"` or be a native `<button>`, with keyboard instructions in the visible UI or via `aria-describedby`.

### Third-Party Embedded Content
- Identify upfront whether content inside iframes, embedded widgets, maps, chat windows, or social media embeds is within the organization's control or vendor-controlled.
- For vendor-controlled content: Document the failures, note which WCAG criteria are impacted, and provide a recommendation to either contact the vendor with a specific remediation request, evaluate an accessible alternative product, or -- if the embedded content is supplementary -- provide equivalent content outside the iframe.
- For all iframes: The `<iframe>` element must have a `title` attribute that describes its content ("Google Maps showing office location", "Customer support chat window"). An untitled iframe is a 4.1.2 failure for every interactive element within it that a keyboard user encounters.
- Embedded video players (YouTube, Vimeo, third-party): Verify captions are available and accurate -- auto-generated captions alone often fail SC 1.2.2 due to poor accuracy. Keyboard control of the player (play/pause, volume, seek, full screen, caption toggle) must be operable.

### Mobile Native Applications (iOS and Android)
- iOS VoiceOver and Android TalkBack have different interaction models than desktop screen readers. Swipe to navigate between elements (not Tab key). Double-tap to activate (not Enter). Swipe up/down to read through options in a listbox.
- Touch targets on mobile: The 44x44 CSS pixel rule applies to web on mobile. For native apps, Apple HIG recommends 44x44 pt minimum; Material Design recommends 48x48 dp minimum (with 8dp spacing between targets). Both platforms enforce these in their accessibility guidelines.
- Mobile-specific failure: Elements that are visually grouped (e.g., a card with an image, title, and description) should be grouped as a single focusable element for screen reader users rather than exposing three separate focus stops. Use `accessibilityElement(isAccessibilityElement: true)` (iOS) or `importantForAccessibility="yes"` with `focusable="true"` (Android).
- Dynamic type and font scaling: iOS respects the user's preferred text size setting. If the app uses fixed pixel font sizes, text will not scale. Verify text uses relative units and layouts accommodate 2x-3x text size without truncation or overlap.
- Sufficient contrast must be validated in both light and dark mode, as many apps support both and each may have separate contrast issues.

### Video and Audio Content
- SC 1.2.1 (Audio-only and Video-only, Prerecorded): Podcasts and audio clips need a full transcript. Silent videos (animation, product demos without narration) need an alternative describing the visual content.
- SC 1.2.2 (Captions, Prerecorded): Captions must include speaker identification for multi-speaker content, non-speech audio cues ("[doorbell rings]", "[background music]"), and accurate transcription. Auto-generated captions require human review. Caption files should be in a standard format (WebVTT, SRT) served alongside the video, not burned in.
- SC 1.2.3 and 1.2.5 (Audio Description): Prerecorded videos with visual information not conveyed through dialogue need audio descriptions. This is an SC that many teams deprioritize -- flag it clearly and note that audio description requires post-production work and should be planned in the video production phase, not added later.
- SC 1.4.2 (Audio Control): If audio plays automatically for more than 3 seconds, the user must be able to pause, stop, or mute it with a keyboard-operable control that appears at the top of the page.

---

## Example

**Input:** "Can you do an accessibility review of a checkout flow? It's a three-step web form. Step 1 is a shipping address form with fields for full name, address line 1 and 2, city, state (dropdown), and zip code, plus a 'Continue' button. Step 2 is payment with credit card number, expiration date (MM/YY), CVV, and a 'Place Order' button. There's a 'Lock' icon next to the button that means the transaction is secure. The body text color is #767676 on a #FFFFFF background. The placeholder text for all inputs is #B0B0B0. Input borders are #CCCCCC on white. The 'Continue' and 'Place Order' buttons are white text (#FFFFFF) on the brand color #3D8B3D. Required fields are marked only with a red asterisk. There's a step indicator at the top (Step 1, Step 2, Step 3) with the active step shown in green and inactive steps in gray. The form fields have no visible focus rings -- the browser default was removed. State the full review."

---

## Accessibility Review: Checkout Flow (3-Step Form)

### Summary
- **Review date:** Based on description provided
- **Target level:** WCAG 2.1 AA
- **Artifacts reviewed:** Verbal description of design (no live code available)
- **Overall result:** 7 failures | 4 warnings | 14 passes | 3 not applicable
- **P1 Critical failures (must fix before release):**
  1. [2.4.7] Focus indicators removed on all form fields -- keyboard users cannot determine their location in the form
  2. [1.4.11] Input borders (#CCCCCC on #FFFFFF) have 1.6:1 contrast -- fails the 3:1 minimum for UI components; inputs are visually unrecognizable as inputs in low-vision conditions
  3. [3.3.1 / 4.1.2] Required field asterisks are marked only in red with no programmatic association -- screen reader users receive no indication that fields are required
  4. [1.1.1] Lock icon has no accessible name -- screen reader users will not know the transaction is described as secure

---

### Principle 1 -- Perceivable

| Criterion | SC Title                    | Result | Finding                                                                                           | Required Fix                                                                                                                    |
|-----------|-----------------------------|--------|---------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| 1.1.1     | Non-text content            | FAIL   | Lock icon next to "Place Order" has no text alternative. Screen reader users hear nothing or "image". | Add `aria-label="Secure transaction"` to the icon element, or add visually hidden text `<span class="sr-only">Secure transaction</span>` adjacent to the icon. Mark the icon itself `aria-hidden="true"`. |
| 1.3.1     | Info and relationships      | FAIL   | Required fields indicated by red asterisk only; no programmatic `aria-required="true"` or native `required` attribute. Step indicator active state conveyed only by green color. | Add `required` attribute (or `aria-required="true"`) to all required inputs. Add `aria-current="step"` to the active step in the step indicator. |
| 1.3.5     | Identify input purpose      | WARN   | Credit card number, expiration, CVV, name, and address fields are missing `autocomplete` attributes. | Add `autocomplete="cc-number"`, `autocomplete="cc-exp"`, `autocomplete="cc-csc"`, `autocomplete="name"`, `autocomplete="address-line1"`, `autocomplete="address-line2"`, `autocomplete="address-level2"` (city), `autocomplete="address-level1"` (state), `autocomplete="postal-code"`. |
| 1.4.1     | Use of color                | FAIL   | Step indicator distinguishes active vs. inactive steps using only green vs. gray color. Users with color blindness (protanopia, deuteranopia) cannot identify the active step. | Add `aria-current="step"` programmatically. Visually, supplement color with a bold weight, underline, or visible step number text style change (not color alone). |
| 1.4.3     | Contrast (minimum) -- body text | PASS | #767676 on #FFFFFF = 4.48:1. This is the minimum passing value for normal text (≥4.5:1 required). Note: this is a marginal pass. Any antialiasing or rendering variation could push it below threshold. | Consider upgrading to #757575 (4.60:1) or #6B6B6B (5.74:1) for a more robust margin. Technically a pass; flagged as WARN. |
| 1.4.3     | Contrast (minimum) -- placeholder text | FAIL | #B0B0B0 on #FFFFFF = 2.3:1. Fails the 4.5:1 minimum. Placeholder text is not exempt from contrast requirements when it provides instructions or serves as a label substitute. | Darken placeholder text to #767676 (4.48:1, marginal) or #696969 (5.74:1, preferred). Do not use placeholder text as a substitute for visible labels. |
| 1.4.3     
