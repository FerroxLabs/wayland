---
name: web-accessibility-patterns
description: |
  Guides expert-level web accessibility patterns implementation: accessibility and web-development decision frameworks, production-ready patterns, and concrete templates for web accessibility patterns workflows.
  Use when the user asks about web accessibility patterns, web accessibility patterns configuration, or accessibility best practices for web projects.
  Do NOT use when the user needs a different web development capability -- check sibling skills in the web development subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "accessibility web-development html-css"
  category: "web-development"
  subcategory: "web-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Web Accessibility Patterns

## When to Use

**Use this skill when:**
- User asks how to implement ARIA roles, properties, or states on custom interactive components (accordions, modals, tooltips, carousels, comboboxes)
- User needs guidance on keyboard navigation patterns -- focus management, tab order, roving tabindex, focus traps
- User wants to audit or remediate WCAG 2.1/2.2 failures in an existing codebase -- specific criterion violations like 1.4.3 (contrast), 2.1.1 (keyboard), 4.1.2 (name, role, value)
- User is building a design system or component library and needs each component to ship accessible by default
- User asks how to test accessibility -- automated tooling, screen reader testing, manual audit checklists
- User needs to implement accessible forms -- error handling, labeling, live region announcements
- User asks about semantic HTML choices that reduce the need for ARIA
- User needs accessible patterns for dynamic content -- SPAs, infinite scroll, toast notifications, skeleton screens
- User is preparing for a VPAT (Voluntary Product Accessibility Template) or Section 508 conformance documentation

**Do NOT use this skill when:**
- User needs general CSS layout or styling help unrelated to accessibility -- use the CSS layout skill
- User is asking about backend API design or server-side rendering architecture -- use the appropriate backend skill
- User needs mobile-native accessibility (iOS UIAccessibility, Android AccessibilityNodeInfo) -- those platforms have different patterns from web ARIA
- User asks about performance optimization (Core Web Vitals, bundle splitting) -- use the web performance skill
- User needs help with internationalization or RTL layout -- use the i18n skill even though it intersects with accessibility
- User is asking about PDF or document accessibility -- that is a separate domain from web accessibility
- User wants SEO metadata optimization -- while semantic HTML overlaps, the decision drivers are different

---

## Process

### 1. Identify the WCAG Success Criteria Under Pressure

Before writing any code, map the user's problem to specific WCAG 2.1/2.2 success criteria at the correct conformance level (A, AA, AAA).

- **Perceivable failures** (Principle 1): missing alt text (1.1.1), no captions on video (1.2.2), insufficient color contrast (1.4.3 requires 4.5:1 for normal text, 3:1 for large text ≥18pt or ≥14pt bold, 3:1 for non-text UI per 1.4.11), missing focus indicator (1.4.11, 2.4.7, 2.4.11 in WCAG 2.2)
- **Operable failures** (Principle 2): keyboard inaccessibility (2.1.1), focus trap without escape (2.1.2), insufficient focus visibility, no skip links (2.4.1), missing page titles (2.4.2), missing link purpose (2.4.4)
- **Understandable failures** (Principle 3): no language attribute (3.1.1), forms that lack error identification (3.3.1, 3.3.2)
- **Robust failures** (Principle 4): invalid ARIA usage (4.1.2), status messages not exposed to AT (4.1.3)
- Map each user complaint or requirement to a criterion before recommending a fix -- this prevents over-engineering and under-engineering

### 2. Choose the Correct Semantic Foundation

The single highest-leverage decision in accessibility is choosing the right HTML element before reaching for ARIA.

- Prefer native HTML elements: `<button>` over `<div role="button">`, `<a href>` over `<span role="link">`, `<input type="checkbox">` over a custom ARIA checkbox
- Native elements get keyboard behavior, implicit ARIA roles, and focus management for free -- a `<button>` is focusable, activatable with Enter and Space, and announces as "button" to screen readers without any extra code
- Use the "ARIA first resort, not last resort" rule in reverse: only add ARIA when no native element exists for the semantic need (e.g., `role="tablist"`, `role="combobox"`, `role="treegrid"`)
- Audit the element choice before adding ARIA attributes -- an `<a>` without an `href` attribute becomes a non-interactive element; add `href` or switch to `<button>` rather than patching with `tabindex="0"` and ARIA
- Check the HTML spec's "prohibited ARIA" table -- some elements like `<input>`, `<select>`, and landmark elements have roles that must not be overridden

### 3. Apply the Correct ARIA Pattern from APG

The ARIA Authoring Practices Guide (APG) defines the keyboard and ARIA specification for each widget pattern. Follow it precisely.

- **Accordion:** `role="region"` on panel, `aria-expanded` on button trigger, `aria-controls` linking button to panel id, `aria-labelledby` on panel referencing button
- **Modal Dialog:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` referencing visible title, `aria-describedby` referencing body text, focus moved to first focusable element on open, focus trapped inside, Escape key closes and returns focus to trigger element
- **Combobox (autocomplete):** `role="combobox"` on input, `aria-expanded`, `aria-autocomplete="list"`, `aria-controls` pointing to listbox, `role="listbox"` with `role="option"` children, `aria-activedescendant` on input reflecting highlighted option id
- **Tab interface:** `role="tablist"` on container, `role="tab"` on each tab, `role="tabpanel"` on each panel, `aria-selected="true/false"` on tabs, `aria-controls`/`aria-labelledby` cross-references, roving tabindex (Arrow keys move between tabs, Tab moves into panel)
- **Tooltip:** `role="tooltip"`, `aria-describedby` on trigger referencing tooltip id, shown on focus AND hover, never uses `title` attribute alone
- Never invent ARIA patterns -- if the APG does not have a pattern for a widget, look for the closest analog and adapt, documenting the rationale

### 4. Implement Keyboard Navigation Correctly

Keyboard support is the most commonly broken accessibility requirement and the one most visible in audits.

- **Tab order:** Must follow visual reading order (left-to-right, top-to-bottom in LTR layouts). Never use positive `tabindex` values (tabindex="1", tabindex="2") -- they override natural DOM order and create unpredictable navigation. Use only `tabindex="0"` to add to tab order or `tabindex="-1"` to allow programmatic focus without natural tab stop
- **Focus traps:** Required inside modal dialogs and active menus. Use a focus trap implementation that queries all focusable elements (`a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]`), listens for Tab and Shift+Tab, and redirects focus from last to first and vice versa
- **Roving tabindex:** Required in tab lists, toolbars, menu bars, and radio groups. Set all items to `tabindex="-1"` initially, set the active/selected item to `tabindex="0"`, move focus with arrow keys, update tabindex on arrow key navigation. Only one item in the group is in the natural tab order at any moment
- **Escape key:** Must close dialogs, menus, tooltips, and popovers and return focus to the element that triggered the overlay
- **Skip links:** Add a visually hidden link as the very first focusable element in the DOM: `<a href="#main-content" class="skip-link">Skip to main content</a>`. Make it visible on focus with `position: absolute; top: 0` and high z-index
- **Keyboard shortcuts:** Custom shortcuts must not conflict with OS or browser shortcuts. Document them in the UI. Provide a way to disable or remap them per WCAG 2.1 Success Criterion 2.1.4

### 5. Implement Accessible Forms

Forms are responsible for the majority of accessibility failures in production applications.

- **Every input needs a label:** Use `<label for="inputId">` as the primary technique. Use `aria-label` when a visible label would be redundant (search icon button). Use `aria-labelledby` to compose a label from multiple text nodes. Never rely on `placeholder` alone -- placeholder text fails 1.3.5, disappears on input, and has insufficient contrast in most browsers
- **Error messages:** Must be programmatically associated with the input using `aria-describedby`. Must not rely on color alone (1.4.1). Must be specific ("Enter a date in MM/DD/YYYY format" not "Invalid input"). Set `aria-invalid="true"` on the input when validation fails
- **Required fields:** Use `aria-required="true"` on the input element (or the native `required` attribute, which sets the implicit ARIA). Do not mark required fields with an asterisk alone -- include "(required)" in the label or legend, or provide a legend explaining the asterisk
- **Fieldset and legend:** Group related inputs (radio buttons, checkboxes, date parts) inside `<fieldset>` with `<legend>`. Screen readers announce the legend with each input, providing essential context
- **Live regions for form feedback:** Use `role="alert"` (or `aria-live="assertive"`) for immediate error announcements. Use `aria-live="polite"` for success confirmations and non-critical feedback. Insert content dynamically into the live region container rather than toggling visibility of a pre-populated container -- some screen readers only announce changes to live region content
- **Form submission errors:** Move focus to the error summary or the first field with an error. Do not leave focus stranded on a submit button after validation failure

### 6. Manage Dynamic Content and Live Regions

Single-page applications and dynamic interfaces create unique accessibility challenges around content changes that native HTML cannot automatically announce.

- **Route changes in SPAs:** After navigation, move focus to the `<h1>` of the new page or a skip-to-main-content container. Announce the new page title using a visually hidden `aria-live="polite"` region. Without this, screen reader users hear nothing when a React/Vue/Angular router transition happens
- **Toast notifications and alerts:** Use `role="alert"` for urgent errors (e.g., network failure). Use `role="status"` (equivalent to `aria-live="polite"`) for confirmations (e.g., "Saved successfully"). Ensure the element exists in the DOM before content is inserted -- injecting a live region element and content simultaneously is not reliably announced
- **Loading states:** Do not remove content and replace with a spinner silently. Add `aria-busy="true"` to the loading region. Provide a visually hidden text label inside the spinner container ("Loading results..."). Announce completion with a live region update
- **Infinite scroll:** Add a load-more button as an alternative to automatic loading -- automatic infinite scroll with no keyboard mechanism fails 2.1.1. After loading new items, announce the count with a live region: "12 more results loaded. Showing 1 to 24 of 347 results"
- **Expanding/collapsing content:** Update `aria-expanded` on the trigger synchronously with the DOM change. Do not use only visual transitions to indicate state -- some users have motion reduction enabled and transitions may be skipped

### 7. Test Across the Correct Assistive Technology Matrix

Automated tools catch 30--40% of accessibility issues. Manual testing with real assistive technologies is required.

- **Automated scanning:** Run axe-core (integrated into Playwright, Cypress, or Jest via axe-core library), Lighthouse accessibility audit, and IBM Equal Access Checker in CI/CD. Zero violations should be a merge gate, not a recommendation
- **Keyboard-only testing:** Unplug your mouse. Navigate the entire feature using only Tab, Shift+Tab, Enter, Space, Escape, and Arrow keys. Verify every interactive element is reachable, operable, and that focus is always visible
- **Screen reader + browser matrix (cover at minimum):**
  - NVDA + Chrome on Windows (most common screen reader combination, free)
  - JAWS + Chrome or Edge on Windows (most common in enterprise/government)
  - VoiceOver + Safari on macOS (required for iOS compatibility)
  - VoiceOver + Safari on iOS (mobile coverage)
  - TalkBack + Chrome on Android (mobile coverage)
- **Color contrast:** Use the browser DevTools accessibility panel (Chrome and Firefox both show contrast ratios) or tools like Colour Contrast Analyser desktop app. Test all interactive states: default, hover, focus, disabled, error
- **Reduced motion:** Test with `prefers-reduced-motion: reduce` enabled in OS settings. Animations must pause, reduce, or be eliminated. Use `@media (prefers-reduced-motion: reduce)` in CSS
- **Zoom testing:** Test at 200% and 400% browser zoom. Content must reflow at 400% (WCAG 1.4.10) -- no horizontal scrolling on a viewport width equivalent to 320px CSS pixels
- **High contrast mode:** Test on Windows with High Contrast enabled and in forced-colors media query simulation in Chrome DevTools

### 8. Document Accessibility Decisions and Known Gaps

Production accessibility work requires audit trails and honest disclosure.

- Write an accessibility conformance report (ACR) or VPAT 2.4 if the product is procured by enterprise or government customers. Map each WCAG 2.1 Level AA criterion to "Supports", "Partially Supports", or "Does Not Support" with detailed remarks
- In code comments, document why a non-standard ARIA pattern was used, referencing the APG pattern it deviates from
- Log known accessibility bugs in issue tracking with the WCAG criterion affected, severity (critical: cannot complete task; serious: difficult to complete; moderate: workaround exists; minor: cosmetic), and affected assistive technology
- Define an accessibility statement page on the product that lists conformance level, known issues, and a feedback/contact mechanism -- required for EU Web Accessibility Directive compliance and public sector sites in many jurisdictions

---

## Output Format

When providing accessibility implementation guidance, structure the response as follows:

```
## Accessibility Implementation: [Component or Feature Name]

### WCAG Criteria Addressed
| Criterion | Level | Description | Status |
|-----------|-------|-------------|--------|
| 1.1.1 | A | Non-text Content | Addressed |
| 2.1.1 | A | Keyboard | Addressed |
| 4.1.2 | A | Name, Role, Value | Addressed |

### Semantic HTML Foundation
[Explain the native element choices and why they were selected]

### ARIA Roles, Properties, and States
| Attribute | Applied To | Value | Purpose |
|-----------|-----------|-------|---------|
| role="dialog" | wrapper div | static | Identifies modal to AT |
| aria-labelledby | wrapper div | "dialog-title" | Links dialog title |
| aria-modal | wrapper div | "true" | Hides background content |
| aria-expanded | trigger button | "true"/"false" | Communicates open state |

### Keyboard Interaction Model
| Key | Action |
|-----|--------|
| Tab | Move focus to next interactive element |
| Shift+Tab | Move focus to previous interactive element |
| Enter / Space | Activate focused button or option |
| Escape | Close and return focus to trigger |
| Arrow Up/Down | [If applicable: move between options] |

### Implementation

```html
<!-- Annotated, production-ready HTML structure -->
```

```css
/* Required accessibility CSS -- focus styles, visually hidden utility */
```

```javascript
// Focus management and ARIA state update logic
```

### Testing Checklist
- [ ] Keyboard-only navigation complete
- [ ] NVDA + Chrome: all states announced correctly
- [ ] VoiceOver + Safari: all states announced correctly
- [ ] axe-core: zero violations
- [ ] Contrast ratios: [actual ratios measured]
- [ ] 200% zoom: no content loss
- [ ] Reduced motion: animation suppressed
```

---

## Rules

1. **Never use `aria-label` on a container that already has visible text.** Use `aria-labelledby` referencing the visible text element's id instead. `aria-label` overrides the accessible name entirely and creates a mismatch between what sighted users and screen reader users hear, which is a WCAG 2.5.3 (Label in Name) violation.

2. **Never suppress the native focus outline without providing an equivalent custom focus indicator.** `outline: none` or `outline: 0` without a replacement is a WCAG 2.4.7 (Focus Visible) failure. The replacement must have a contrast ratio of at least 3:1 against adjacent colors and must be at least a 2px solid outline per WCAG 2.2 Success Criterion 2.4.11.

3. **Never use `role="presentation"` or `role="none"` on interactive elements.** These roles remove semantic meaning and must only be applied to purely decorative layout elements (e.g., spacer table cells, decorative SVG paths). Applying them to focusable elements makes those elements invisible to assistive technology.

4. **Always test ARIA live regions by inserting content dynamically, not by toggling CSS visibility.** `display: none` to `display: block` on a pre-populated live region is not reliably announced by all screen readers. The live region container must exist empty in the DOM, then content is injected -- this is the reliable pattern.

5. **Never use `tabindex` values greater than 0.** Positive tabindex values (tabindex="1", tabindex="5") pull elements to the front of the tab order before all tabindex="0" and natural elements. This creates a navigation order disconnected from visual layout and is nearly impossible to maintain correctly as the DOM grows. Positive tabindex is the single most common cause of broken tab order in production applications.

6. **Always pair icon-only buttons with an accessible name.** A button containing only an SVG icon or icon font character has no accessible name. Use `aria-label="Close dialog"` or visually hidden text with `.sr-only` CSS (`position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap`). Never use `title` attribute as the sole accessible name -- it is not reliably exposed by all screen reader/browser combinations.

7. **Never mark decorative images with non-empty alt text.** Images that are purely decorative (icon repeated from adjacent text label, background flourish) must have `alt=""`. Non-empty alt text on decorative images creates noise for screen reader users who must listen to redundant descriptions. SVG used decoratively must have `aria-hidden="true"`.

8. **Always ensure error identification in forms uses three independent channels: text, visual marker, and programmatic association.** Relying on red border alone fails WCAG 1.4.1 (Use of Color). The error must be described in text, visually distinct, and connected to the input via `aria-describedby` so screen readers announce it when the input receives focus.

9. **Never implement a custom dropdown, select, or listbox using CSS alone on a `<div>` without full keyboard and ARIA support.** The resulting component will fail 2.1.1 (Keyboard), 4.1.2 (Name, Role, Value), and likely 1.3.1 (Info and Relationships). Assess whether `<select>` with CSS customization meets design requirements before building a custom implementation -- native `<select>` with modern CSS is often sufficient and dramatically reduces accessibility risk.

10. **Always recheck accessibility after JavaScript state changes.** Dynamic DOM manipulations -- React re-renders, Vue reactivity updates, Angular change detection -- can strip ARIA attributes, reorder DOM nodes, or destroy and recreate elements in ways that break previously working accessibility implementations. Include axe-core assertions in component integration tests that run after user interactions, not just on initial render.

---

## Edge Cases

**Custom components in a design system consumed by multiple teams:**
When you are the maintainer of a shared component library, accessibility must be enforced at the component level, not delegated to consumers. Build keyboard handling, ARIA roles, and focus management into the component internals. Expose only safe customization APIs -- for example, allow consumers to provide the accessible name via a required `label` prop, but do not allow them to override the internal `role`. Write accessibility documentation alongside API documentation. Include automated axe-core tests in the component's own test suite so regressions are caught before the version is published.

**Legacy codebase using tables for layout:**
When auditing a codebase that uses `<table>` elements for visual layout (common in codebases older than 2010 or in email templates), apply `role="presentation"` to the layout tables and their constituent `<tr>` and `<td>` elements to strip their implicit table roles from the accessibility tree. Do not attempt to re-semanticize the table structure -- remediate incrementally by replacing sections with CSS-based layouts. Prioritize the most user-facing and interactive sections first.

**Third-party embedded widgets:**
Widgets embedded via iframe (payment processors, chat widgets, social embeds) are outside your DOM control. Ensure each iframe has a descriptive `title` attribute that explains the iframe's purpose ("Payment form", "Customer support chat"). For iframes containing purely decorative content, add `aria-hidden="true"` to the iframe element. If the third-party widget itself has accessibility failures, document them in your VPAT as "Partially Supports" with a note that the issue is in a third-party component. Advocate with the vendor using WCAG criteria numbers -- this is more effective than informal requests.

**SVG icons and illustrations:**
Inline SVG used as an icon inside a labeled button: add `aria-hidden="true"` to the SVG element and `focusable="false"` (required for Internet Explorer/Edge legacy) to prevent the SVG from appearing in tab order in those browsers. Standalone SVG used as a meaningful image: add `role="img"` and `aria-label` or `aria-labelledby` referencing a `<title>` element inside the SVG. Complex SVGs (charts, diagrams): provide a `<title>` for the brief name and `<desc>` for the extended description, and consider providing a data table equivalent of chart data as a truly accessible alternative.

**Animations, transitions, and motion-heavy interfaces:**
Any animation that runs for more than 5 seconds and plays automatically must have a pause mechanism (WCAG 2.2.2). For all animations and transitions, implement `@media (prefers-reduced-motion: reduce)` in CSS that either removes the animation or replaces it with a simple instant state change. In JavaScript-driven animations (canvas, WebGL, GSAP), check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before starting the animation sequence. Do not assume reduced motion means "no feedback" -- a simple opacity change or instant state change is acceptable. Users with vestibular disorders can experience physical symptoms from parallax, auto-play carousels, and zoom animations.

**Accessible data tables with complex headers:**
Simple tables (`<table>`) with straightforward row and column headers: use `<th scope="col">` and `<th scope="row">`. Tables with merged cells, multi-level column groups, or irregular header structures: use `id` attributes on each `<th>` and `headers` attributes on each `<td>` listing the space-separated ids of all headers that apply to that cell. Never use a `<table>` for layout and a separate `<table>` for data in adjacent DOM positions without clear separation via `role="presentation"` on the layout table. Consider whether a complex table can be split into multiple simpler tables or visualized differently -- complexity in table headers directly correlates with screen reader comprehension difficulty.

**Focus management after asynchronous operations:**
After an async operation completes and DOM changes occur (e.g., a form submits and the form is replaced by a success confirmation, or a record is deleted from a list), focus must be explicitly managed. If the focused element is removed from the DOM, focus silently moves to `<body>` in most browsers, stranding keyboard users. Patterns: after form success, move focus to the success heading. After delete, move focus to the previous item in the list, or to the list's container heading if the last item was deleted. Implement a `requestAnimationFrame` or `setTimeout(fn, 0)` delay before calling `.focus()` to allow the DOM update to settle -- calling `.focus()` before the element is rendered has no effect.

**Color contrast in dark mode and theming:**
Meeting WCAG 1.4.3 contrast ratios in a single theme does not guarantee compliance when users switch to dark mode or apply custom themes. Implement CSS custom properties (variables) for all color decisions, and define a complete `prefers-color-scheme: dark` set that is audited for contrast independently from the light theme. Test every interactive state (default, hover, focus, active, disabled, error, success) in both themes. Do not calculate contrast ratios by eye -- use programmatic contrast checking in your design token pipeline or in CSS-in-JS theme definitions.

---

## Example

**Input:** "I need to build an accessible modal dialog component in React. It should have a title, body content, a close button, and a confirm action button. It needs to work correctly with keyboard navigation and screen readers."

**Output:**

## Accessibility Implementation: Modal Dialog

### WCAG Criteria Addressed
| Criterion | Level | Description | Status |
|-----------|-------|-------------|--------|
| 1.3.1 | A | Info and Relationships | Addressed via semantic HTML and ARIA |
| 2.1.1 | A | Keyboard | Addressed via focus trap and keyboard handlers |
| 2.1.2 | A | No Keyboard Trap | Addressed -- Escape key exits trap |
| 2.4.3 | A | Focus Order | Addressed via focus-on-open pattern |
| 4.1.2 | A | Name, Role, Value | Addressed via role="dialog" and aria-labelledby |
| 2.4.7 | AA | Focus Visible | Addressed via explicit focus styles |

### Semantic HTML Foundation
The dialog uses a `<div>` with `role="dialog"` because HTML's native `<dialog>` element has inconsistent screen reader support across browser/AT combinations as of 2024 (particularly with JAWS and older NVDA versions). The backdrop overlay uses `aria-hidden="true"` to remove it from the accessibility tree. The title is a `<h2>` because the page already has an `<h1>` -- the modal introduces a new document section at heading level 2. The close button uses a native `<button>` element to get free keyboard activation (Enter and Space) and button role.

### ARIA Roles, Properties, and States
| Attribute | Applied To | Value | Purpose |
|-----------|-----------|-------|---------|
| role="dialog" | modal wrapper div | static | Identifies the region as a dialog to AT |
| aria-modal | modal wrapper div | "true" | Instructs AT to treat background content as inert |
| aria-labelledby | modal wrapper div | "dialog-title" | Links visible title as dialog accessible name |
| aria-describedby | modal wrapper div | "dialog-desc" | Links body paragraph as dialog description |
| aria-hidden | backdrop overlay div | "true" | Removes decorative backdrop from AT |
| aria-label | close icon button | "Close dialog" | Names icon-only button |

### Keyboard Interaction Model
| Key | Action |
|-----|--------|
| Tab | Move focus forward through dialog's interactive elements only |
| Shift+Tab | Move focus backward through dialog's interactive elements only |
| Enter / Space | Activate the focused button |
| Escape | Close dialog and return focus to the trigger button |

### Implementation

```jsx
// ModalDialog.jsx
import { useEffect, useRef } from 'react';

// All focusable element types that should be captured by the focus trap
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex="0"]',
].join(', ');

export function ModalDialog({ isOpen, onClose, onConfirm, title, children }) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    // Capture the element that triggered the dialog BEFORE opening
    // so we can return focus to it when the dialog closes
    if (isOpen) {
      triggerRef.current = document.activeElement;

      // Move focus into the dialog after render
      // requestAnimationFrame ensures the DOM is painted before we attempt focus
      requestAnimationFrame(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const firstFocusable = dialog.querySelector(FOCUSABLE_SELECTORS);
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          // If no focusable children, focus the dialog container itself
          // tabindex="-1" allows programmatic focus without natural tab stop
          dialog.focus();
        }
      });

      // Make background content inert so AT users cannot navigate outside dialog
      // The inert attribute is supported in all modern browsers as of 2023
      document.getElementById('root').setAttribute('inert', '');
    } else {
      // Re-enable background content
      document.getElementById('root').removeAttribute('inert');

      // Return focus to the trigger element
      if (triggerRef.current) {
        triggerRef.current.focus();
        triggerRef.current = null;
      }
    }
  }, [isOpen]);

  // Focus trap: intercept Tab and Shift+Tab to cycle within dialog
  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const dialog = dialogRef.current;
    const focusableElements = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTORS));
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift+Tab: if focus is on first element, wrap to last
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: if focus is on last element, wrap to first
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop: decorative, hidden from AT */}
      <div
        className="modal-backdrop"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Dialog container */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
        className="modal-dialog"
        onKeyDown={handleKeyDown}
        // tabindex="-1" allows container to receive programmatic focus
        // if no focusable children exist
        tabIndex={-1}
      >
        {/* Dialog header */}
        <div className="modal-header">
          <h2 id="dialog-title" className="modal-title">
            {title}
          </h2>
          {/* Icon-only close button: aria-label provides the accessible name */}
          <button
            type="button"
            className="modal-close-btn"
            aria-label="Close dialog"
            onClick={onClose}
          >
            {/* SVG is decorative -- the button's aria-label is the name */}
            <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        {/* Dialog body */}
        <div id="dialog-desc" className="modal-body">
          {children}
        </div>

        {/* Dialog footer with actions */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </>
  );
}
```

```css
/* modal.css */

/* Focus styles: never remove outline -- enhance it instead */
/* 2px offset ensures focus ring is visible against all content */
.modal-dialog *:focus-visible {
  outline: 3px solid #005fcc; /* 4.5:1+ contrast against white background */
  outline-offset: 2px;
  border-radius: 2px;
}

/* Visually hidden utility: removes from visual render but keeps in AT tree */
/* Use this for supplementary text that sighted users do not need */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 100;
}

/* Dialog container */
.modal-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 101;
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  width: min(560px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  /* Ensure dialog is not compressed at 400% zoom -- WCAG 1.4.10 reflow */
}

/* Respect reduced motion preference -- remove transform animation if added */
@media (prefers-reduced-motion: reduce) {
  .modal-dialog {
    animation: none;
    transition: none;
  }
}

/* Ensure close button icon-only buttons meet 44x44px touch target -- WCAG 2.5.5 */
.modal-close-btn {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  /* Color: #595959 on #ffffff = 7:1 contrast -- passes AAA */
  color: #595959;
}
```

### Testing Checklist
- [ ] Keyboard-only: Tab cycles only within dialog; Escape closes and returns focus to trigger
- [ ] NVDA + Chrome: dialog announced as "Confirm Account Deletion, dialog" on open; all buttons named correctly
- [ ] VoiceOver + Safari: `aria-modal` hides background content; title and description read on dialog open
- [ ] axe-core integration test: zero violations on open state and closed state
- [ ] Contrast ratios: body text #212121 on #ffffff = 16:1 (AAA); button text meets 4.5:1 for all states
- [ ] 400% zoom: dialog scrolls vertically; no horizontal overflow; all text and buttons visible
- [ ] Reduced motion: no entrance/exit animation runs
- [ ] inert attribute: keyboard navigation cannot reach background content while dialog is open
- [ ] Focus returns to trigger button after close via both Escape and Cancel button
