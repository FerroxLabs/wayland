---
name: web-components
description: |
  Expert guidance for building custom elements with shadow DOM, lifecycle callbacks, slots, form participation, and framework interoperability patterns.
  Use when the user asks about web components, web components best practices, or needs guidance on web components implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "web-development frontend design-patterns html-css"
  category: "web-development"
  subcategory: "html-css-web"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Web Components

You are an expert in web components and the custom elements API. You guide developers through building reusable, framework-agnostic UI components using native browser standards: custom elements, shadow DOM, HTML templates, slots, and the CSS parts API. You emphasize progressive enhancement, accessibility, form participation, and interoperability with any framework.

## Custom Element Fundamentals

### Basic Custom Element

```javascript
class AppAlert extends HTMLElement {
  static observedAttributes = ['type', 'dismissible'];

  #type = 'info';
  #dismissible = false;
  #shadow;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.#render();
    this.#setupListeners();
  }

  disconnectedCallback() {
    this.#controller?.abort();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    switch (name) {
      case 'type':
        this.#type = newValue || 'info';
        break;
      case 'dismissible':
        this.#dismissible = newValue !== null;
        break;
    }
    if (this.isConnected) this.#render();
  }

  get type() { return this.#type; }
  set type(val) { this.setAttribute('type', val); }

  get dismissible() { return this.#dismissible; }
  set dismissible(val) { this.toggleAttribute('dismissible', Boolean(val)); }

  #controller;

  #setupListeners() {
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.#shadow.querySelector('.dismiss')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true, composed: true }));
      this.remove();
    }, { signal });
  }

  // NOTE: For production use, prefer template cloning (see Performance
  // Patterns below) or a DOM-building helper over setting shadow root
  // content directly. Always sanitize any user-provided data before
  // inserting it into the DOM.
  #render() {
    const typeStyles = {
      info:    { bg: '#e8f4fd', border: '#2196F3' },
      success: { bg: '#e8f5e9', border: '#4CAF50' },
      warning: { bg: '#fff8e1', border: '#FF9800' },
      error:   { bg: '#fde8e8', border: '#f44336' },
    };
    const colors = typeStyles[this.#type] || typeStyles.info;

    // Clear and rebuild using safe DOM methods
    const root = this.#shadow;
    root.replaceChildren();

    const style = document.createElement('style');
    style.textContent = `
      :host { display: block; margin: 0.5rem 0; }
      :host([hidden]) { display: none; }
      .alert {
        display: flex; align-items: flex-start; gap: 0.75rem;
        padding: 0.75rem 1rem; border-radius: 6px;
        border-left: 4px solid ${colors.border};
        background: ${colors.bg};
        font-family: inherit; font-size: 0.95rem;
      }
      .content { flex: 1; }
      .dismiss {
        background: none; border: none; cursor: pointer;
        font-size: 1.2rem; padding: 0; line-height: 1; opacity: 0.6;
      }
      .dismiss:hover { opacity: 1; }
    `;
    root.appendChild(style);

    const alert = document.createElement('div');
    alert.className = 'alert';
    alert.setAttribute('role', 'alert');

    const content = document.createElement('div');
    content.className = 'content';
    content.appendChild(document.createElement('slot'));
    alert.appendChild(content);

    if (this.#dismissible) {
      const btn = document.createElement('button');
      btn.className = 'dismiss';
      btn.setAttribute('aria-label', 'Dismiss');
      btn.textContent = '\u00D7';
      alert.appendChild(btn);
    }

    root.appendChild(alert);
  }
}

customElements.define('app-alert', AppAlert);
```

### Usage

```html
<app-alert type="success" dismissible>
  Your changes have been saved.
</app-alert>

<script>
  document.querySelector('app-alert').addEventListener('dismiss', (e) => {
    console.log('Alert dismissed');
  });
</script>
```

## Shadow DOM Deep Dive

### Encapsulation Modes

```javascript
// Open shadow DOM - shadowRoot accessible from outside
this.attachShadow({ mode: 'open' });
// el.shadowRoot returns the shadow root

// Closed shadow DOM - shadowRoot not accessible
this.attachShadow({ mode: 'closed' });
// el.shadowRoot returns null
// Store reference privately: this.#shadow = this.attachShadow({ mode: 'closed' });
```

### Styling with CSS Custom Properties and Parts

```javascript
class AppCard extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        --card-padding: 1.5rem;
        --card-radius: 8px;
        --card-bg: #ffffff;
        --card-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      :host([variant="outlined"]) {
        --card-shadow: none;
        --card-border: 1px solid #ddd;
      }
      .card {
        padding: var(--card-padding);
        border-radius: var(--card-radius);
        background: var(--card-bg);
        box-shadow: var(--card-shadow);
        border: var(--card-border, none);
      }
      .header { margin-bottom: 1rem; }
      [part="title"] { font-size: 1.25rem; font-weight: 600; margin: 0; }
      [part="body"] { line-height: 1.6; }
    `;
    shadow.appendChild(style);

    // Build DOM structure programmatically
    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'header';
    const title = document.createElement('h3');
    title.setAttribute('part', 'title');
    const titleSlot = document.createElement('slot');
    titleSlot.name = 'title';
    titleSlot.textContent = 'Card Title';
    title.appendChild(titleSlot);
    header.appendChild(title);

    const body = document.createElement('div');
    body.setAttribute('part', 'body');
    body.appendChild(document.createElement('slot'));

    const footer = document.createElement('div');
    footer.setAttribute('part', 'footer');
    const footerSlot = document.createElement('slot');
    footerSlot.name = 'footer';
    footer.appendChild(footerSlot);

    card.append(header, body, footer);
    shadow.appendChild(card);
  }
}
customElements.define('app-card', AppCard);
```

```css
/* External styling via custom properties */
app-card {
  --card-padding: 2rem;
  --card-bg: #f9fafb;
}

/* External styling via ::part() */
app-card::part(title) {
  color: navy;
  font-size: 1.5rem;
}

app-card::part(footer) {
  border-top: 1px solid #eee;
  padding-top: 1rem;
  margin-top: 1rem;
}
```

## Slots and Composition

### Slot Patterns

```javascript
connectedCallback() {
  const slot = this.shadowRoot.querySelector('slot:not([name])');
  slot.addEventListener('slotchange', () => {
    const assigned = slot.assignedElements();
    console.log(`${assigned.length} elements slotted`);
    this.#updateLayout(assigned);
  });
}
```

## Form-Associated Custom Elements

To make a custom element participate in `<form>` natively (works with `FormData`, validation, reset):

```javascript
class AppRating extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ['value', 'max', 'required', 'disabled'];

  #internals;
  #value = 0;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
  }

  // Key form integration points:
  get value() { return this.#value; }
  set value(val) {
    this.#value = Number(val);
    this.#internals.setFormValue(String(this.#value));  // Submit value
    this.#validate();
    this.#render();
  }

  get form() { return this.#internals.form; }
  get validity() { return this.#internals.validity; }

  #validate() {
    if (this.hasAttribute('required') && this.#value === 0) {
      this.#internals.setValidity({ valueMissing: true }, 'Required');
    } else {
      this.#internals.setValidity({});
    }
  }

  formResetCallback() { this.value = 0; }          // Called on form.reset()
  formDisabledCallback(disabled) { this.#render(); } // Called when disabled changes
  // formStateRestoreCallback(state, mode)           // Called on browser back/forward

  #render() { /* build star rating UI */ }
}
customElements.define('app-rating', AppRating);
```

Usage: `<form><app-rating name="rating" required></app-rating></form>` -- the value appears in `new FormData(form).get('rating')`.

## Lifecycle Callback Reference

| Callback | When It Fires | Common Uses |
|---|---|---|
| `constructor()` | Element created | Attach shadow DOM, init state |
| `connectedCallback()` | Added to document | Render, add listeners, get data |
| `disconnectedCallback()` | Removed from document | Cleanup listeners, timers, observers |
| `attributeChangedCallback(name, old, new)` | Observed attribute changes | Update state, re-render |
| `adoptedCallback()` | Moved to new document | Re-initialize document-dependent code |
| `formAssociatedCallback(form)` | Associated with a form | Store form reference |
| `formResetCallback()` | Form is reset | Reset to default value |
| `formDisabledCallback(disabled)` | Disabled state changes | Update UI disabled state |
| `formStateRestoreCallback(state, mode)` | Browser restores form state | Restore saved value |

## Framework Interoperability

- **React**: Use a `useRef` + `useEffect` wrapper to set properties (not just attributes) and attach event listeners on custom elements. React 19+ has improved custom element support natively.
- **Vue**: Add `compilerOptions.isCustomElement` in vite config: `tag => tag.startsWith('app-')`. Vue handles attributes, properties, and `@event` bindings on custom elements.
- **Angular**: Custom elements work natively. Add `CUSTOM_ELEMENTS_SCHEMA` to your module or component schemas.
- **Svelte**: Bind to custom element properties with `bind:property` and listen to events with `on:eventname`.

## Performance Patterns

### Key Techniques

- **Template cloning**: Create a `<template>` element once, then use `template.content.cloneNode(true)` in the constructor. Significantly faster than rebuilding DOM each render.
- **adoptedStyleSheets**: Create `CSSStyleSheet` objects and assign to `shadow.adoptedStyleSheets`. Shares memory across instances and enables dynamic style updates via `replaceSync()`.

## Accessibility Checklist

- [ ] Set appropriate ARIA `role` for non-standard semantics (slider, tablist, dialog, etc.)
- [ ] Manage `tabindex` for focusable shadow DOM elements
- [ ] Use `delegatesFocus: true` when shadow root should delegate focus
- [ ] Dispatch composed events (`composed: true`) when events must cross shadow boundaries
- [ ] Provide keyboard navigation matching the expected ARIA pattern
- [ ] Use `:host(:focus-visible)` for visible focus indicators
- [ ] Ensure `aria-label` or `aria-labelledby` for non-text content
- [ ] Test with screen readers (VoiceOver, NVDA) since shadow DOM can behave differently
- [ ] Implement `formAssociated` for form controls so they participate in validation

## Performance Checklist

- [ ] Use template cloning (`cloneNode`) instead of rebuilding DOM per render
- [ ] Use `adoptedStyleSheets` for shared stylesheets across instances to reduce memory
- [ ] Debounce `attributeChangedCallback` when multiple attributes change together
- [ ] Use `requestAnimationFrame` for visual updates triggered by events
- [ ] Lazy-load heavy shadow DOM content until the element is visible

## Decision Matrix: Component Approach

| Factor | Web Components | Framework Component |
|---|---|---|
| Cross-framework reuse needed | Preferred | Not possible |
| Design system / shared library | Preferred | Only if single framework |
| Requires complex state management | Consider carefully | Preferred |
| Form integration needed | Use `formAssociated` | Native framework forms |
| SSR required | Needs declarative shadow DOM | Better framework support |
| Team expertise | Standards knowledge | Framework knowledge |
| Style encapsulation critical | Shadow DOM enforces it | CSS modules / scoped styles |

## When to Use

**Use this skill when:**
- Designing or implementing web components solutions
- Reviewing or improving existing web components approaches
- Making architectural or implementation decisions about web components
- Learning web components patterns and best practices
- Troubleshooting web components-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Web Components Analysis

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

**Input:** "Help me implement web components for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended web components approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When web components must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
