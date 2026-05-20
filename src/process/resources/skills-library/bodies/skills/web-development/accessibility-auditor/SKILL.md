---
name: accessibility-auditor
description: |
  Web accessibility expertise covering WCAG 2.2 conformance, audit methodology, ARIA patterns, keyboard navigation, screen reader testing, focus management, form accessibility, and automated vs manual testing strategies.
  Use when the user asks about accessibility auditor, accessibility auditor best practices, or needs guidance on accessibility auditor implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "web-development frontend accessibility"
  category: "web-development"
  subcategory: "accessibility-performance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Accessibility Auditor

## Purpose

Guide comprehensive accessibility implementation and auditing for web applications. This skill covers WCAG 2.2 conformance at all levels, practical ARIA patterns, testing methodology, and building accessibility into the development lifecycle.

## WCAG 2.2 Conformance Levels

```
Level A (Minimum):
  - All non-text content has text alternatives
  - Captions for prerecorded audio
  - Content is meaningful without color alone
  - Keyboard accessible (no keyboard traps)
  - No content that flashes more than 3 times/second
  - Pages have descriptive titles
  - Focus order is logical
  - Link purpose is determinable

Level AA (Standard -- target for most projects):
  - Everything in A, plus:
  - Captions for live audio
  - Color contrast 4.5:1 (text), 3:1 (large text)
  - Text resizable to 200% without loss
  - Images of text avoided (use real text)
  - Multiple ways to find pages (nav, search, sitemap)
  - Headings and labels are descriptive
  - Focus visible
  - Consistent navigation and identification
  - Error suggestion and prevention on forms

Level AAA (Enhanced):
  - Everything in AA, plus:
  - Sign language for prerecorded audio
  - Color contrast 7:1 (text), 4.5:1 (large text)
  - No timing limits
  - No interruptions (user controls all)
  - Re-authentication without data loss
```

## Audit Methodology

### Phase 1: Automated Testing (30% of issues)

```
Tools to run:
  1. axe-core (via browser extension or CI)
  2. Lighthouse accessibility audit
  3. WAVE browser extension
  4. ESLint with eslint-plugin-jsx-a11y

Automated tests catch:
  - Missing alt text
  - Missing form labels
  - Color contrast violations
  - Missing document language
  - Duplicate IDs
  - Missing landmark regions
  - Invalid ARIA attributes
```

### Phase 2: Keyboard Testing (20% of issues)

```
Keyboard testing checklist:
  [ ] Tab through entire page -- can you reach all interactive elements?
  [ ] Shift+Tab -- does reverse order make sense?
  [ ] Enter/Space -- do buttons and links activate?
  [ ] Arrow keys -- do composite widgets (tabs, menus, listboxes) work?
  [ ] Escape -- do modals and dropdowns close?
  [ ] Focus is never trapped (except modals -- which should trap)
  [ ] Focus indicator is always visible
  [ ] Skip link present and functional
  [ ] Focus order matches visual order
  [ ] No unexpected focus changes
```

### Phase 3: Screen Reader Testing (30% of issues)

```
Test with at minimum:
  - NVDA + Firefox (Windows)
  - VoiceOver + Safari (macOS/iOS)
  - TalkBack + Chrome (Android)

Screen reader testing checklist:
  [ ] Page title announced on load
  [ ] Headings create logical outline (h1 -> h2 -> h3)
  [ ] Landmarks navigable (main, nav, aside, footer)
  [ ] Images have meaningful alt text (or empty alt for decorative)
  [ ] Form fields announce labels, required state, errors
  [ ] Dynamic content changes announced (live regions)
  [ ] Tables have headers and captions
  [ ] Links and buttons announce their purpose
  [ ] Custom components announce role, name, state
  [ ] Modal focus management works correctly
```

### Phase 4: Manual Inspection (20% of issues)

```
Manual checks:
  [ ] Content is understandable at 200% zoom
  [ ] Content reflows at 320px width (no horizontal scroll)
  [ ] Motion/animation respects prefers-reduced-motion
  [ ] Touch targets are at least 24x24px (WCAG 2.2)
  [ ] Error messages are clear and suggest fixes
  [ ] Timeout warnings given with option to extend
  [ ] Content makes sense with CSS disabled
  [ ] Reading order matches visual order
```

## ARIA Patterns

### ARIA First Rule: Don't Use ARIA

```
Priority order:
  1. Use native HTML elements (button, input, select, dialog, details)
  2. If native element exists but needs styling, style the native element
  3. Only use ARIA when no native element provides the semantics

Native HTML equivalents:
  <button>           instead of  <div role="button">
  <a href>           instead of  <span role="link">
  <input type="checkbox">  instead of  <div role="checkbox">
  <dialog>           instead of  <div role="dialog">
  <nav>              instead of  <div role="navigation">
  <details> ./<summary> instead of custom accordion
```

### Common ARIA Patterns

```html
<!-- Tabs -->
<div role="tablist" aria-label="Account settings">
  <button role="tab" id="tab-1" aria-selected="true" aria-controls="panel-1">
    Profile
  </button>
  <button role="tab" id="tab-2" aria-selected="false" aria-controls="panel-2" tabindex="-1">
    Security
  </button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
  <!-- Profile content -->
</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>
  <!-- Security content -->
</div>

<!-- Disclosure (use <details> if possible) -->
<button aria-expanded="false" aria-controls="faq-1">
  What is your return policy?
</button>
<div id="faq-1" hidden>
  <p>You can return items within 30 days.</p>
# ... (condensed) ...
<div role="alert">
  Your session will expire in 5 minutes.
</div>

<!-- Status -->
<div role="status" aria-live="polite">
  3 results found
</div>
```

### ARIA States Reference

```
aria-expanded="true|false"    -> Disclosure, accordion, dropdown
aria-selected="true|false"    -> Tabs, options, tree items
aria-checked="true|false|mixed" -> Checkboxes, switches
aria-pressed="true|false"     -> Toggle buttons
aria-current="page|step|location|date|true" -> Current item
aria-disabled="true"          -> Disabled (but still focusable)
aria-hidden="true"            -> Hidden from assistive tech (NOT visually)
aria-invalid="true"           -> Form validation error
aria-required="true"          -> Required field
aria-busy="true"              -> Loading state
aria-describedby="id"         -> Additional description
aria-labelledby="id"          -> Labelled by another element
aria-errormessage="id"        -> Error message reference
```

## Keyboard Navigation Implementation

### Focus Management

```tsx
// Focus trap for modals
function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      // Focus first focusable element in modal
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
    return () => {
      // Restore focus on close
      previousFocus.current?.focus();
    };
  }, [isOpen]);

  // Trap Tab key within modal
  function handleKeyDown(e: KeyboardEvent) {
    # ... (condensed) ...
    <div className="modal-overlay" onClick={onClose}>
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="modal-title"
           onKeyDown={handleKeyDown} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
```

### Skip Navigation Link

```html
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header><!-- navigation --></header>
  <main id="main-content" tabindex="-1">
    <!-- Main content -->
  </main>
</body>

<style>
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 9999;
  padding: 1rem;
  background: var(--color-brand);
  color: white;
}
.skip-link:focus {
  top: 0;
}
</style>
```

### Roving Tabindex Pattern

```tsx
// For composite widgets: tabs, toolbars, menu bars
function Toolbar({ items }: ToolbarProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    let newIndex = index;
    switch (e.key) {
      case 'ArrowRight': newIndex = (index + 1) % items.length; break;
      case 'ArrowLeft': newIndex = (index - 1 + items.length) % items.length; break;
      case 'Home': newIndex = 0; break;
      case 'End': newIndex = items.length - 1; break;
      default: return;
    }
    e.preventDefault();
    setActiveIndex(newIndex);
  }

  useEffect(() => {
    document.getElementById(`tool-${activeIndex}`)?.focus();
  }, [activeIndex]);

  return (
    <div role="toolbar" aria-label="Formatting">
      {items.map((item, i) => (
        <button key={i} id={`tool-${i}`} tabIndex={i === activeIndex ? 0 : -1}
                onKeyDown={(e) => handleKeyDown(e, i)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

## Color Contrast

```
WCAG AA Requirements:
  Normal text (< 18pt or < 14pt bold):  4.5:1 contrast ratio
  Large text (>= 18pt or >= 14pt bold): 3:1 contrast ratio
  UI components and graphical objects:   3:1 contrast ratio

WCAG AAA Requirements:
  Normal text: 7:1
  Large text:  4.5:1

Tools:
  - Chrome DevTools (inspect element -> color picker shows ratio)
  - WebAIM Contrast Checker: [reference URL]
  - Stark browser extension
  - Polypane browser

Common failures:
  - Placeholder text with insufficient contrast
  - Disabled state text that is too faint
  - Text over images without overlay
  - Focus indicators that blend into background
  - Links distinguished only by color (no underline)
```

## Form Accessibility

```html
<!-- Properly labeled input -->
<label for="email">Email address</label>
<input id="email" type="email" required aria-describedby="email-hint email-error"
       aria-invalid="true" />
<p id="email-hint" class="hint">We'll never share your email.</p>
<p id="email-error" class="error" role="alert">Please enter a valid email address.</p>

<!-- Group related inputs -->
<fieldset>
  <legend>Shipping Address</legend>
  <label for="street">Street</label>
  <input id="street" type="text" autocomplete="street-address" />
  <label for="city">City</label>
  <input id="city" type="text" autocomplete="address-level2" />
</fieldset>

<!-- Radio group -->
<fieldset>
  <legend>Preferred contact method</legend>
  <label><input type="radio" name="contact" value="email" /> Email</label>
  <label><input type="radio" name="contact" value="phone" /> Phone</label>
  <label><input type="radio" name="contact" value="mail" /> Mail</label>
</fieldset>

<!-- Error summary at top of form -->
<div role="alert" aria-labelledby="error-heading">
  <h2 id="error-heading">There are 2 errors in your form</h2>
  <ul>
    <li><a href="#email">Email address is required</a></li>
    <li><a href="#password">Password must be at least 8 characters</a></li>
  </ul>
</div>
```

## Dynamic Content Accessibility

### Live Regions

```html
<!-- Polite: announced when screen reader is idle -->
<div aria-live="polite">
  Search returned 42 results
</div>

<!-- Assertive: interrupts current announcement -->
<div aria-live="assertive">
  Your session has expired. Please log in again.
</div>

<!-- Role shortcuts -->
<div role="status">...</div>   <!-- Equivalent to aria-live="polite" -->
<div role="alert">...</div>    <!-- Equivalent to aria-live="assertive" -->

<!-- aria-atomic: announce entire region or just changes -->
<div aria-live="polite" aria-atomic="true">
  Cart total: $42.00  <!-- Announces full text on change -->
</div>
```

### Loading States

```html
<!-- Skeleton loading -->
<div aria-busy="true" aria-label="Loading user profile">
  <div class="skeleton" aria-hidden="true"></div>
</div>

<!-- After load -->
<div aria-busy="false">
  <h2>John Doe</h2>
  <p>john@example.com</p>
</div>

<!-- Inline loading indicator -->
<button aria-disabled="true">
  <span class="spinner" aria-hidden="true"></span>
  Saving...
  <span class="sr-only">Please wait, saving your changes</span>
</button>
```

## Screen Reader Only (Visually Hidden) Text

```css
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

/* Focusable variant (for skip links) */
.sr-only-focusable:focus,
.sr-only-focusable:active {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: inherit;
}
```

## Automated Testing Setup

```ts
// vitest + @testing-library + jest-axe
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('LoginForm has no accessibility violations', async () => {
  const { container } = render(<LoginForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// Playwright accessibility testing
test('homepage meets accessibility standards', async ({ page }) => {
  await page.goto('/');
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## Accessibility Audit Checklist

- [ ] Automated scan with axe-core returns zero violations
- [ ] All interactive elements reachable and operable by keyboard
- [ ] Focus indicator visible on all focusable elements
- [ ] Skip navigation link present and functional
- [ ] Headings form logical hierarchy (no skipped levels)
- [ ] All images have appropriate alt text
- [ ] Form inputs have associated labels
- [ ] Error messages are associated with fields via aria-describedby
- [ ] Color contrast meets AA (4.5:1 normal, 3:1 large text)
- [ ] Content is readable at 200% zoom and 320px width
- [ ] Dynamic updates announced via live regions
- [ ] Modals trap focus and restore on close
- [ ] Touch targets are at least 24x24px
- [ ] prefers-reduced-motion is respected
- [ ] Screen reader testing passes with NVDA or VoiceOver
- [ ] Document has lang attribute
- [ ] Page titles are unique and descriptive

## When to Use

**Use this skill when:**
- Designing or implementing accessibility auditor solutions
- Reviewing or improving existing accessibility auditor approaches
- Making architectural or implementation decisions about accessibility auditor
- Learning accessibility auditor patterns and best practices
- Troubleshooting accessibility auditor-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Accessibility Auditor Analysis

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

**Input:** "Help me implement accessibility auditor for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended accessibility auditor approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When accessibility auditor must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
