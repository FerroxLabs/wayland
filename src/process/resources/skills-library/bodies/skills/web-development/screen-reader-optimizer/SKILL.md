---
name: screen-reader-optimizer
description: |
  Optimize web content for screen reader compatibility using semantic HTML, ARIA patterns, and live region management, with testing workflows for NVDA, VoiceOver, and JAWS.
  Use when the user asks about screen reader optimizer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of screen reader optimizer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "accessibility checklist guide javascript testing email presentation fashion"
  category: "web-development"
  subcategory: "accessibility-performance"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Screen Reader Optimizer

You are an expert in screen reader accessibility, specializing in making web interfaces fully usable through NVDA, VoiceOver, JAWS, and TalkBack. You understand how assistive technology parses the accessibility tree, when ARIA is necessary versus harmful, and how to test efficiently across the major screen reader and browser combinations.


## When to Use

**Use this skill when:**
- User asks about screen reader optimizer techniques or best practices
- User needs guidance on screen reader optimizer concepts
- User wants to implement or improve their approach to screen reader optimizer

**Do NOT use when:**
- The request falls outside the scope of screen reader optimizer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. Which framework are you building with (React, Angular, Vue, vanilla HTML)?
2. What are the most complex interactive patterns in your UI (tables, trees, drag-and-drop, live updates)?
3. Which screen readers does your user base primarily use?
4. Are you fixing existing screen reader issues or building new components?
5. Do you have access to Windows (for NVDA/JAWS) and macOS/iOS (for VoiceOver)?

## Core Principle: The Accessibility Tree

Screen readers do not read the DOM. They read the **accessibility tree** — a parallel structure the browser builds from your HTML and ARIA attributes. Every optimization you make is about shaping this tree.

```
Visual DOM                    Accessibility Tree
-----------                   ------------------
<nav>                    -->  navigation landmark
  <ul>                   -->  list (3 items)
    <li><a href="/">     -->  link "Home"
    <li><a href="/about">-->  link "About"
    <li><a href="/blog"> -->  link "Blog"
```

### What the Accessibility Tree Exposes

For every node: **Name**, **Role**, **State**, and **Value**.

| Property | Source | Example |
|----------|--------|---------|
| Name | Text content, `aria-label`, `aria-labelledby`, `alt`, `<label>` | "Submit order" |
| Role | HTML element or `role` attribute | button, link, heading, dialog |
| State | HTML attributes or `aria-*` states | disabled, expanded, checked, selected |
| Value | Input value, `aria-valuenow` | "42", "50%" |

## First Rule: Use Semantic HTML

Native HTML elements have built-in roles, states, keyboard behavior, and screen reader announcements. ARIA should only fill gaps that HTML cannot.

```html
<!-- WRONG: div with ARIA trying to be a button -->
<div role="button" tabindex="0" aria-pressed="false"
     onclick="toggle()" onkeydown="handleKey(event)">
  Toggle Setting
</div>

<!-- RIGHT: native button with full behavior for free -->
<button type="button" aria-pressed="false" onclick="toggle()">
  Toggle Setting
</button>
```

### Semantic Element Reference

| Instead of... | Use... | Why |
|---------------|--------|-----|
| `<div onclick>` | `<button>` | Keyboard, role, focus for free |
| `<span class="link">` | `<a href>` | Announced as link, Enter activates |
| `<div class="header">` | `<h1>`-`<h6>` | Heading navigation (H key in screen readers) |
| `<div class="nav">` | `<nav>` | Landmark navigation |
| `<div class="list">` | `<ul>` / `<ol>` | "List, 5 items" announcement |
| `<div class="table">` | `<table>` with `<th>` | Cell-to-header association |
| `<div class="input">` | `<input>` / `<select>` | Form mode, label association |

## ARIA Patterns for Complex Widgets

When native HTML is insufficient, follow the ARIA Authoring Practices Guide (APG) patterns exactly.

### Tabs

```html
<div role="tablist" aria-label="Account settings">
  <button role="tab" id="tab-1" aria-selected="true"
          aria-controls="panel-1" tabindex="0">
    Profile
  </button>
  <button role="tab" id="tab-2" aria-selected="false"
          aria-controls="panel-2" tabindex="-1">
    Security
  </button>
  <button role="tab" id="tab-3" aria-selected="false"
          aria-controls="panel-3" tabindex="-1">
    Notifications
  </button>
</div>

<div role="tabpanel" id="panel-1" aria-labelledby="tab-1" tabindex="0">
  <!-- Profile content -->
</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2" tabindex="0" hidden>
  <!-- Security content -->
</div>
<div role="tabpanel" id="panel-3" aria-labelledby="tab-3" tabindex="0" hidden>
  <!-- Notifications content -->
</div>
```

**Keyboard behavior:**
- Arrow Left/Right moves between tabs
- Home/End goes to first/last tab
- Only the active tab is in the Tab order (`tabindex="0"`); others are `tabindex="-1"`

```javascript
const tabs = document.querySelectorAll('[role="tab"]');

tabs.forEach(tab => {
  tab.addEventListener('keydown', (e) => {
    const index = Array.from(tabs).indexOf(e.target);
    let newIndex;

    switch (e.key) {
      case 'ArrowRight':
        newIndex = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        newIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    activateTab(tabs[newIndex]);
  });
});

function activateTab(tab) {
  tabs.forEach(t => {
    t.setAttribute('aria-selected', 'false');
    t.setAttribute('tabindex', '-1');
    document.getElementById(t.getAttribute('aria-controls')).hidden = true;
  });

  tab.setAttribute('aria-selected', 'true');
  tab.setAttribute('tabindex', '0');
  tab.focus();
  document.getElementById(tab.getAttribute('aria-controls')).hidden = false;
}
```

### Modal Dialog

```html
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title"
     aria-describedby="dialog-desc">
  <h2 id="dialog-title">Confirm Deletion</h2>
  <p id="dialog-desc">
    This will permanently delete 3 files. This action cannot be undone.
  </p>
  <div class="dialog-actions">
    <button type="button" onclick="closeDialog()">Cancel</button>
    <button type="button" onclick="confirmDelete()" class="danger">
      Delete Files
    </button>
  </div>
</div>
```

**Required behavior:**
- Focus moves into dialog on open (to first focusable element or the dialog itself)
- Tab/Shift+Tab cycles within dialog only (focus trap)
- Escape closes the dialog
- Focus returns to the element that triggered the dialog

### Accordion / Disclosure

```html
<div class="accordion">
  <h3>
    <button aria-expanded="false" aria-controls="sect1-content"
            id="sect1-header">
      Shipping Information
    </button>
  </h3>
  <div id="sect1-content" role="region" aria-labelledby="sect1-header"
       hidden>
    <p>We ship to all 50 states...</p>
  </div>
</div>
```

### Combobox / Autocomplete

```html
<label for="city-input">City</label>
<div class="combobox-wrapper">
  <input type="text" id="city-input" role="combobox"
         aria-expanded="false" aria-autocomplete="list"
         aria-controls="city-listbox" aria-activedescendant="">
  <ul id="city-listbox" role="listbox" hidden>
    <li role="option" id="city-1">Chicago</li>
    <li role="option" id="city-2">Charlotte</li>
    <li role="option" id="city-3">Charleston</li>
  </ul>
</div>
```

When suggestions appear, set `aria-expanded="true"`, show the listbox, and update `aria-activedescendant` to the highlighted option's ID as the user arrows through.

## Live Regions

Live regions announce dynamic content changes without moving focus.

### Types of Live Regions

```html
<!-- Polite: announced after current speech finishes -->
<div aria-live="polite" aria-atomic="true">
  3 results found
</div>

<!-- Assertive: interrupts current speech immediately -->
<div aria-live="assertive" aria-atomic="true">
  Error: Session expired. Please log in again.
</div>

<!-- Status role: implicit aria-live="polite" -->
<div role="status">
  File uploaded successfully
</div>

<!-- Alert role: implicit aria-live="assertive" -->
<div role="alert">
  Payment failed. Please check your card details.
</div>

<!-- Log role: implicit aria-live="polite", aria-relevant="additions" -->
<div role="log" aria-label="Chat messages">
  <!-- New messages appended here -->
</div>

<!-- Progress updates -->
<div role="progressbar" aria-valuenow="65" aria-valuemin="0"
     aria-valuemax="100" aria-label="Upload progress">
</div>
```

### Live Region Rules

1. The container must exist in the DOM **before** content changes
2. Only inject or change text inside an existing live region
3. Use `aria-atomic="true"` when the entire region should be re-read
4. Use `polite` for most updates; `assertive` only for errors or critical alerts
5. Do not flood live regions with rapid updates — debounce to at most every 1-2 seconds

```javascript
// Debounced live region update
const statusRegion = document.getElementById('search-status');
let debounceTimer;

function updateResultCount(count) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    statusRegion.textContent = `${count} results found`;
  }, 1000);
}
```

## Labeling Strategies

### Naming Priority (Browser Resolution Order)

1. `aria-labelledby` (references another element's text)
2. `aria-label` (string directly on element)
3. Native label (`<label>`, `alt`, `<caption>`, `<legend>`)
4. `title` attribute (last resort, inconsistent support)
5. Text content (for links, buttons)

### Common Labeling Patterns

```html
<!-- Multiple labels composed together -->
<h2 id="billing">Billing Address</h2>
<label id="street-label" for="street">Street</label>
<input id="street" type="text" aria-labelledby="billing street-label">
<!-- Screen reader announces: "Billing Address Street, edit text" -->

<!-- Icon-only button -->
<button aria-label="Close dialog">
  <svg aria-hidden="true"><!-- X icon --></svg>
</button>

<!-- Redundant link with image and text -->
<a href="/profile">
  <img src="avatar.jpg" alt="">
  My Profile
</a>
<!-- alt="" prevents "avatar.jpg My Profile" double announcement -->

<!-- Group of radio buttons -->
<fieldset>
  <legend>Preferred contact method</legend>
  <label><input type="radio" name="contact" value="email"> Email</label>
  <label><input type="radio" name="contact" value="phone"> Phone</label>
  <label><input type="radio" name="contact" value="text"> Text message</label>
</fieldset>
```

## Hiding Content Correctly

| Technique | Visible | In Accessibility Tree | Use For |
|-----------|---------|----------------------|---------|
| `display: none` | No | No | Fully hidden from everyone |
| `visibility: hidden` | No | No | Same as display:none |
| `hidden` attribute | No | No | Same, HTML native |
| `aria-hidden="true"` | Yes | No | Decorative visuals, icons with labels |
| `.sr-only` class | No | Yes | Screen-reader-only text |
| `role="presentation"` | Yes | Stripped | Remove semantic meaning |

```css
/* Screen-reader only utility class */
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
```

## Testing Workflows

### NVDA + Firefox (Windows)

1. Start NVDA (Ctrl+Alt+N or desktop shortcut)
2. Open Speech Viewer (NVDA menu > Tools > Speech Viewer)
3. Navigate to the page in Firefox
4. Use these commands:

| Action | Keys |
|--------|------|
| Read next item | Down Arrow |
| Read previous item | Up Arrow |
| Next heading | H |
| List all headings | NVDA+F7 |
| Next landmark | D |
| Next form field | F |
| Activate link/button | Enter |
| Toggle forms mode | NVDA+Space |
| Read current line | NVDA+L |
| Read entire page | NVDA+Down Arrow |

### VoiceOver + Safari (macOS)

1. Enable VoiceOver: Cmd+F5
2. Use the rotor: VO+U (then arrow through headings, links, landmarks)
3. Navigate:

| Action | Keys |
|--------|------|
| Next item | VO+Right |
| Previous item | VO+Left |
| Activate | VO+Space |
| Rotor | VO+U |
| Read from cursor | VO+A |
| Web rotor navigation | VO+Cmd+H (headings), VO+Cmd+J (form controls) |

VO = Control+Option

### VoiceOver on iOS

1. Enable: Settings > Accessibility > VoiceOver
2. Swipe right = next item, swipe left = previous
3. Double-tap = activate
4. Rotor (two-finger twist) = change navigation mode

### JAWS + Chrome (Windows)

| Action | Keys |
|--------|------|
| Virtual cursor on/off | JAWS+Z |
| Headings list | JAWS+F6 |
| Next heading | H |
| Next region/landmark | R |
| Forms list | JAWS+F5 |
| Read from cursor | JAWS+Down Arrow |

### Testing Checklist

For each page or component, verify:

- [ ] All content is read in a logical order
- [ ] Headings create a meaningful outline (no skipped levels)
- [ ] All images have appropriate alt text (or are hidden)
- [ ] All form fields announce their labels
- [ ] Error messages are announced when they appear
- [ ] State changes are communicated (expanded/collapsed, selected, checked)
- [ ] Dynamic content updates are announced via live regions
- [ ] Modals trap focus and announce their title
- [ ] Custom widgets follow APG keyboard patterns
- [ ] No content is announced that should be hidden
- [ ] No content is hidden that should be announced

## Common Screen Reader Bugs and Workarounds

### Bug: `aria-label` on `<div>` or `<span>` is ignored
**Fix:** Only use `aria-label` on interactive elements or landmark roles.

### Bug: VoiceOver ignores list semantics with `list-style: none`
**Fix:** Add `role="list"` explicitly on the `<ul>`.

```css
/* This causes VoiceOver to drop list semantics */
ul { list-style: none; }
```
```html
<!-- Fix -->
<ul role="list" style="list-style: none;">
```

### Bug: `aria-live` region does not announce on first insertion
**Fix:** Ensure the container element is in the DOM on page load, then inject text content into it.

### Bug: `display:none` to `display:block` transition not announced
**Fix:** Keep the element visible but empty, then change its text content.

### Bug: Screen reader reads SVG title when it should not
**Fix:** Add `aria-hidden="true"` to decorative SVGs and `focusable="false"` for IE/Edge legacy.

```html
<svg aria-hidden="true" focusable="false">
  <!-- decorative SVG -->
</svg>
```

## Framework-Specific Guidance

### React

```jsx
// Announce route changes in single-page apps
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function RouteAnnouncer() {
  const location = useLocation();
  const announcerRef = useRef(null);

  useEffect(() => {
    const pageTitle = document.title;
    if (announcerRef.current) {
      announcerRef.current.textContent = `Navigated to ${pageTitle}`;
    }
  }, [location]);

  return (
    <div
      ref={announcerRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}
```

### Vue

Use `:aria-pressed="isActive.toString()"` on toggle buttons. Bind ARIA attributes reactively using Vue's `:aria-*` syntax.

### Angular

Use Angular CDK's `LiveAnnouncer` service to announce dynamic content changes: `this.liveAnnouncer.announce('N results found', 'polite')`.


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to screen reader optimizer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Screen Reader Optimizer Analysis

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

**Input:** "Help me with screen reader optimizer for my current situation"

**Output:**

Based on your situation, here is a structured approach to screen reader optimizer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
