---
name: component-design-spec
description: |
  Produces a complete UI component specification with states, props, accessibility requirements, and usage guidelines as a tool-agnostic design artifact.
  Use when the user asks to spec out a UI component, define component states and variants, document a design component, or create component design requirements.
  Do NOT use for full page wireframes (use wireframe-specification), design token systems (use design-system-foundations), or coded component implementation (use a software-development skill).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design accessibility template"
  category: "design-creative"
  subcategory: "ui-ux-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Component Design Spec

## When to Use

**Use this skill when:**
- The user asks to spec out a discrete, reusable UI component -- a Button, Combobox, Data Table, Toast, Modal, Tooltip, Chip, Toggle, Pagination control, File Upload, or similar atomic or molecular unit
- The user wants to document all interactive states of a component as a design artifact that can be handed off to engineers, reviewed in design critique, or published in a design system
- The user needs to define component variants and their precise visual and behavioral differences so that contributors create consistent implementations
- The user wants to establish the accessibility contract for a component -- ARIA roles, keyboard patterns, focus management, and screen reader announcements -- before any code is written
- The user is building or extending a design system and needs a canonical reference for how a component should look and behave across all contexts
- The user is auditing an existing component and wants a structured format to capture what it currently does versus what it should do
- The user wants to align a design team and an engineering team on a shared component definition before design or development begins

**Do NOT use when:**
- The user wants to compose a full page layout from multiple components (use `wireframe-specification` -- the correct level of abstraction is a layout, not a single component)
- The user needs to define the primitive design tokens -- color scales, type ramp, spacing scale, elevation, radius -- that feed INTO component specs (use `design-system-foundations`)
- The user wants the actual code implementation of a component in React, Vue, or any framework (use a software-development skill -- this artifact is language-agnostic)
- The user wants to specify screen-to-screen transitions, animated flows, or micro-interaction timing beyond state-level changes (use `prototype-spec`)
- The user wants to define icon assets, illustration guidelines, or brand identity elements (use `visual-identity-spec`)
- The user is asking for a general UI/UX best practices overview with no specific component in mind (use a conceptual explanation skill instead)

---

## Process

### Step 1: Identify and Classify the Component

Before writing a single spec line, establish exactly what kind of component is being designed. The type of component determines which sections, states, and ARIA patterns apply.

- **Classify by atomic level:** Is this an atom (Button, Badge, Input), a molecule (Search Field = Input + Button + Icon), or an organism (Data Table = Header + Row + Pagination)? Molecules and organisms require sub-component specs for each constituent part.
- **Classify by interaction type:** Is it a static display component (Badge, Avatar, Skeleton), a form control (Input, Select, Checkbox, Radio), a triggering element (Button, FAB, Link Button), an overlay component (Modal, Drawer, Tooltip, Popover), a navigation component (Tabs, Breadcrumb, Pagination), or a feedback component (Toast, Alert, Progress, Spinner)?
- **Gather context from the user:** Ask what product surface this component lives on (marketing site, web app, native-web hybrid), who the end users are (general public, enterprise users, accessibility-critical populations), and what design token vocabulary is already established. If no tokens exist, use semantic placeholder names (e.g., `color-primary`, `color-surface`, `color-error`) throughout.
- **Check for an existing ARIA Authoring Practices Guide (APG) pattern:** Many components have a well-defined interaction model from the WAI-ARIA APG (Combobox, Listbox, Tree, Menu, Dialog, Disclosure). If one exists, the keyboard pattern is not optional -- it must match.
- **Clarify scope before writing:** How many variants? Are sizes required? Is theming needed (light/dark mode)? Is right-to-left (RTL) support required? Record these answers in the header of the spec.

### Step 2: Define the Anatomy

A component anatomy breaks the component into named, documented parts. This is the shared vocabulary between designers and engineers.

- **Name every visible part** with a noun that will become a CSS class, a slot name, or a sub-element reference. Do not use vague names like "area" or "zone" -- use precise names like `control-label`, `helper-text`, `validation-message`, `leading-icon`, `clear-button`.
- **Distinguish required from optional parts.** A required part must always render; an optional part renders only when its corresponding prop is provided. If removing an optional part would break visual balance (e.g., a trailing icon creates asymmetric padding), document the layout adjustment.
- **Identify slot regions** -- areas where arbitrary child content is injected by the consumer. Slots require special documentation: what content is allowed, what layout constraints apply, and who is responsible for the slot content's accessibility.
- **Specify dimensional constraints for each part:** minimum width, maximum width, min/max height, whether the part is fixed-size or flexible. For text parts, document overflow behavior (truncate with ellipsis at N characters, wrap to N lines max, scroll).
- **Create a simple ASCII or prose diagram** for complex components (Modal, Data Table, Combobox) showing spatial relationships between parts. This is faster to produce than a visual mockup and eliminates layout ambiguity.
- **For compound components** (e.g., Tabs = TabList + Tab + TabPanel), list the sub-components and their parent-child relationships. Each sub-component needs its own anatomy section.

### Step 3: Define Variants and Their Decision Rules

Variants are not just visual options -- each variant must have a specific, unambiguous use case that tells the designer or engineer which one to choose.

- **Separate visual variants from functional variants from size variants.** Visual variants (Primary, Secondary, Ghost) change appearance. Functional variants (Destructive, Success, Warning) change meaning. Size variants (sm, md, lg) change density. These three axes can combine -- document valid and invalid combinations in a variant matrix.
- **For each variant, specify the decision rule:** "Use Primary when there is ONE dominant action on the screen. Use Secondary when supporting that action. Use Ghost for tertiary actions in dense toolbars." Ambiguous rules lead to inconsistent usage.
- **Identify the default variant** -- the one that renders when no variant prop is specified. The default should be the most commonly used option.
- **Document invalid combinations explicitly:** For example, a Destructive variant should not also be Ghost because it reduces visual urgency. A Loading state should not combine with Disabled because loading implies the action was already triggered.
- **If there are more than 8 variants on a single axis,** the component may need to be split into multiple components. Flag this as a design system concern.

### Step 4: Define All States

States are one of the most under-documented aspects of component specs. Every interactive component must have a complete state inventory.

- **Universal interactive states (required for all interactive components):** default, hover, focus, active/pressed, disabled. These five are non-negotiable.
- **Conditional states (include when applicable):**
  - `loading` -- required for any component that triggers an async operation (form submit button, data fetch trigger)
  - `error` -- required for any form control or any component that can reflect a system error
  - `success` -- document if a component has a post-submission success state distinct from default
  - `selected` / `checked` / `expanded` / `pressed` -- required for toggle buttons, checkboxes, tree items, accordions
  - `empty` -- required for any component that displays data (table, list, card with fetched content)
  - `indeterminate` -- required for checkboxes that represent a mixed selection
  - `read-only` -- distinct from disabled: the value is visible but not editable, still tab-focusable
- **For each state on each variant,** document: background color token, border color/style/width token, text color token, icon color token, opacity, cursor value, box shadow, and any additional visual indicator (e.g., focus ring offset, error icon, spinner position).
- **Focus state rule:** The focus indicator must be visible on keyboard navigation. It must have a minimum 3:1 contrast ratio against the adjacent background color (WCAG 2.1 SC 1.4.11). The recommended pattern is a 2px solid outline with a 2px offset, using a high-contrast color (often the primary color or a high-contrast neutral). Do NOT suppress the focus ring for mouse users using `:focus-visible` -- document this interaction model explicitly.
- **Disabled vs. read-only distinction:** Disabled elements are removed from tab order and announce as "unavailable" to screen readers. Read-only elements remain in tab order and announce their value. Never conflate these states.
- **State transitions:** For each state change that involves animation (hover background fade, loading spinner appearance, error shake), document the transition property, duration, and easing function. Typical values: hover background transition at 150ms ease, modal open at 200ms ease-out, error message at 200ms ease. These values matter for performance -- avoid transitions longer than 300ms on interactive controls.

### Step 5: Define Props

Props are the API surface of the component. A well-defined prop table is the contract between design and engineering.

- **Every prop needs:** name (in camelCase), type (primitive, enum, boolean, function, slot/ReactNode), default value, valid options for enums, and a plain-English description of what the prop controls.
- **Use semantic prop names** that describe behavior, not implementation. `isLoading` is better than `showSpinner`. `isDisabled` is better than `preventClick`. `onValueChange` is better than `callbackFunc`.
- **Separate data props from behavior props from appearance props.** Data props supply content (label, value, placeholder). Behavior props control interaction (isDisabled, isLoading, onSubmit). Appearance props control visual variants (variant, size, intent). This separation predicts how engineers will structure the component internally.
- **Document which props are mutually exclusive.** You cannot be both `isLoading` and `isDisabled` simultaneously -- document the priority rule (loading takes precedence over disabled when both are true).
- **For slot props** (children, leadingIcon, trailingIcon), document: what content is allowed, what the maximum size constraint is, who owns the accessibility of slotted content (parent component or consumer).
- **Document deprecated props** if speccing a revised version of an existing component. Include the migration path.
- **Boolean props should default to false.** A prop like `isFullWidth: false` is predictable. A prop like `isVisible: true` creates awkward double-negatives (`isVisible={false}`). Design for the false default.

### Step 6: Define Accessibility Requirements

Accessibility is a first-class requirement, not a post-hoc addition. This section specifies the full accessibility contract.

- **ARIA role:** Specify the role precisely. Use native HTML semantics wherever possible (a `<button>` element has a built-in button role; a `<div>` with `role="button"` requires manual keyboard handling and is error-prone). For complex components, list ALL roles in the compound structure (e.g., Tabs: `tablist` on the container, `tab` on each tab button, `tabpanel` on each panel).
- **Required ARIA attributes by state:** `aria-expanded` (for disclosure components), `aria-selected` (for tabs and listbox options), `aria-checked` (for checkboxes and radio buttons), `aria-disabled` (when using JS-based disabling separate from the `disabled` attribute), `aria-live` (for dynamic regions -- use `polite` for most updates, `assertive` only for critical errors). Never use `aria-live="assertive"` for non-critical content -- it interrupts screen reader users.
- **Keyboard interaction patterns:** Use the WAI-ARIA APG keyboard patterns as the canonical reference. Key patterns include:
  - **Tab / Shift+Tab:** Moves focus between components
  - **Enter / Space:** Activates buttons; Enter submits forms; Space toggles checkboxes
  - **Arrow keys:** Navigate within a composite widget (Tabs, Listbox, Menu, Radio Group, Slider)
  - **Escape:** Closes overlays (Modal, Popover, Combobox dropdown, Menu) and returns focus to the trigger
  - **Home / End:** Jump to first/last item in a list or slider
- **Focus management rules for overlays:** When a Modal, Drawer, or non-modal Dialog opens, focus MUST move to the first focusable element inside it (or to the dialog container if no focusable element exists). When it closes, focus MUST return to the element that triggered it. For non-modal popovers, focus does NOT move automatically -- only keyboard users who Tab into the popover will enter it.
- **Touch and pointer accessibility:** For components with hover-only interactions (Tooltip triggered on hover), provide an equivalent touch/keyboard trigger. Minimum touch target size is 44x44px (WCAG 2.5.5 Level AAA) or 24x24px with sufficient spacing (WCAG 2.5.8 Level AA).
- **Color contrast requirements:** Normal text (under 18pt / 14pt bold): minimum 4.5:1 ratio (WCAG AA). Large text (18pt+ / 14pt+ bold): minimum 3:1 ratio. UI components and graphical objects (borders of inputs, icons that convey meaning): minimum 3:1 ratio. Focus indicators: minimum 3:1 ratio against adjacent colors.
- **Motion and animation:** If the component has transitions or animations, provide a `prefers-reduced-motion` alternative. Specify which animations collapse to instant transitions and which collapse to simpler alternatives (fade instead of slide).

### Step 7: Define Usage Guidelines and Composition Rules

Usage guidelines prevent the component from being misused after it ships.

- **For each variant, write one sentence describing the exact scenario when it is correct.** If you cannot write a clear, unambiguous sentence, the variant may be unnecessary.
- **Document anti-patterns explicitly** -- real examples of incorrect usage that you have seen or anticipate. "Do not use Primary Button for navigation -- use a link. Do not use Ghost Button as the only action on a page -- it will be visually missed."
- **Content guidelines:** Maximum label length in characters (with rationale), required vs. optional fields, text formatting rules (sentence case vs. title case for labels), placeholder text rules (do not use placeholder as a substitute for a label).
- **Composition rules:** What can this component be placed inside? What can be placed inside it? Which components can be adjacent to it? For example: "Button may appear in: Toolbar, Card Footer, Modal Footer, Form Actions area. Button must NOT be nested inside a Link or another Button. Button must NOT be the only interactive element in a Modal -- always pair with a secondary action."
- **Density and spacing rules:** When placed in a `Toolbar`, buttons use the `sm` size. When placed as a standalone page CTA, use `lg`. Document these context-specific size rules.
- **Theming rules:** If the product supports light and dark modes, specify which tokens change and which remain constant. If the component has a surface-specific variant (e.g., a white button for use on dark hero images), document it here.

### Step 8: Compile and Quality-Check the Specification

Before delivering the spec, run through this quality checklist:

- Every state has a defined visual change for every visual property (background, border, text, cursor, opacity). No vague entries like "slightly different."
- Every prop has a default value. No prop is listed as "N/A" for default.
- The accessibility section has: role, keyboard pattern, screen reader announcement text, and focus management rules.
- Every variant has an unambiguous, one-sentence use case rule.
- The sizing table includes height, horizontal padding, font size, icon size, and minimum width for every size tier.
- At least one anti-pattern is documented in usage guidelines.
- The spec is internally consistent -- a prop listed in the props table must correspond to a state or variant in the states/variants table.

---

## Output Format

```
## Component Spec: [Component Name]

**Classification:** [Atom / Molecule / Organism] | [Form Control / Triggering / Overlay / Navigation / Feedback / Display]
**ARIA Pattern:** [APG pattern reference, e.g., "Button Pattern", "Combobox Pattern", "Dialog (Modal) Pattern"]
**Scope:** [List of variants, sizes, modes, RTL support, theming as determined in Step 1]

---

### Purpose
[One sentence describing what this component does and the specific user need it addresses. Format: "The [Component Name] [verb describing action] so that [user outcome]."]

---

### Anatomy
| Part              | CSS / Slot Name         | Description                                        | Required | Overflow Behavior              |
|-------------------|-------------------------|----------------------------------------------------|----------|-------------------------------|
| [Part Name]       | [class or slot name]    | [What this part is and what it displays]           | Yes / No | [truncate at Npx / wrap / N lines max / none] |

**Spatial relationship:** [ASCII diagram or prose describing how parts are positioned relative to each other]

---

### Variants

#### Visual Variants
| Variant    | Background        | Border                  | Text Color        | Use Case (one sentence, unambiguous)                |
|------------|-------------------|-------------------------|-------------------|-----------------------------------------------------|
| [name]     | [token]           | [token or "none"]       | [token]           | [exact scenario when this variant is correct]       |

#### Functional / Intent Variants (if applicable)
| Intent     | Icon              | Color Override          | ARIA              | Use Case                                            |
|------------|-------------------|-------------------------|-------------------|-----------------------------------------------------|
| [name]     | [icon name]       | [token]                 | [aria-live value] | [exact scenario]                                    |

#### Size Variants
| Size | Height | Horizontal Padding | Vertical Padding | Font Size | Icon Size | Min Width | Use Context                              |
|------|--------|--------------------|------------------|-----------|-----------|-----------|------------------------------------------|
| xs   | [px]   | [px]               | [px]             | [px]      | [px]      | [px]      | [when to use this size]                  |
| sm   | [px]   | [px]               | [px]             | [px]      | [px]      | [px]      | [when to use this size]                  |
| md   | [px]   | [px]               | [px]             | [px]      | [px]      | [px]      | [when to use this size -- the default]   |
| lg   | [px]   | [px]               | [px]             | [px]      | [px]      | [px]      | [when to use this size]                  |

#### Valid Variant Combinations Matrix
| Visual Variant | sm | md | lg | Destructive | Loading | Disabled |
|----------------|----|----|----|-------------|---------|----------|
| Primary        | ✓  | ✓  | ✓  | ✓           | ✓       | ✓        |
| Secondary      | ✓  | ✓  | ✓  | ✓           | ✓       | ✓        |
| Ghost          | ✓  | ✓  | ✓  | ✗ (note)    | ✓       | ✓        |

[Note: explain any ✗ combinations]

---

### States

**[Variant Name] States** (repeat table per variant group, or note deltas)

| State        | Background     | Border              | Text Color     | Icon Color     | Opacity | Cursor       | Additional Visual Indicator       |
|--------------|----------------|---------------------|----------------|----------------|---------|--------------|-----------------------------------|
| default      | [token]        | [token or "none"]   | [token]        | [token]        | 1       | pointer      | --                                |
| hover        | [token]        | [token or "none"]   | [token]        | [token]        | 1       | pointer      | [e.g., box-shadow change]         |
| focus        | [token]        | [token or "none"]   | [token]        | [token]        | 1       | pointer      | 2px solid [token], 2px offset     |
| active       | [token]        | [token or "none"]   | [token]        | [token]        | 1       | pointer      | [e.g., translate-y: 1px]         |
| disabled     | [token]        | [token or "none"]   | [token]        | [token]        | 0.5     | not-allowed  | pointer-events: none              |
| loading      | [token]        | [token or "none"]   | transparent    | transparent    | 0.8     | wait         | Spinner overlaid at center, 16px  |
| error        | [token]        | 2px solid [token]   | [token]        | [token]        | 1       | pointer      | Error icon at leading position    |
| selected     | [token]        | [token or "none"]   | [token]        | [token]        | 1       | pointer      | [e.g., checkmark icon appears]    |
| read-only    | [token]        | 1px dashed [token]  | [token]        | [token]        | 1       | default      | No hover state applies            |

**State Transitions:**
| From State | To State  | Trigger                 | Transition                              |
|------------|-----------|-------------------------|-----------------------------------------|
| default    | hover     | mouseenter              | background 150ms ease                   |
| default    | focus     | Tab / programmatic      | outline appears immediately (no delay)  |
| default    | loading   | onClick                 | label fades out 100ms, spinner fades in |
| loading    | default   | async resolve           | spinner fades out 100ms, label fades in |
| loading    | error     | async rejection         | border color change 200ms ease          |

---

### Props
| Prop           | Type              | Default       | Valid Options                          | Mutually Exclusive With | Description                                      |
|----------------|-------------------|---------------|----------------------------------------|-------------------------|--------------------------------------------------|
| [propName]     | [type]            | [default]     | [options for enum / range for number]  | [propName or "none"]    | [what it controls -- behavioral description]     |

**Priority rules for conflicting props:**
- [e.g., "When both isLoading and isDisabled are true, isLoading takes visual precedence. The disabled behavior (no click handler) still applies."]

---

### Accessibility

- **ARIA Role:** [role, with note on whether native HTML element provides it or role attribute is needed]
- **Required ARIA Attributes:**
  - `[attribute]`: [when required and what value it takes]
- **Conditional ARIA Attributes:**
  - `[attribute]`: [what triggers it and what value it takes]
- **Keyboard Interaction:**
  | Key             | Action                                                       |
  |-----------------|--------------------------------------------------------------|
  | Tab             | [behavior]                                                   |
  | Shift+Tab       | [behavior]                                                   |
  | Enter           | [behavior]                                                   |
  | Space           | [behavior]                                                   |
  | Escape          | [behavior or "not applicable"]                               |
  | Arrow keys      | [behavior or "not applicable"]                               |
- **Screen Reader Announcement:**
  - On focus: "[exact announcement text or template, e.g., '{label}, button']"
  - On activation: "[what is announced, e.g., 'Loading, please wait' if loading state begins]"
  - On state change: "[e.g., 'Expanded' when aria-expanded changes to true]"
  - On error: "[e.g., Error message announced via aria-live='polite' region]"
- **Focus Management:**
  - [Where focus is before interaction]
  - [Where focus moves on activation]
  - [Where focus returns on close/dismiss, if applicable]
- **Touch Target:** Minimum [N]x[N]px tap target. If visual size is smaller, extend the interactive area using padding or pseudo-element overlay.
- **Reduced Motion:** [Which animations collapse to instant; which transition to a simpler alternative]
- **Contrast Requirements:**
  | Element          | Foreground Token | Background Token | Required Ratio | Pass/Verify     |
  |------------------|------------------|------------------|----------------|-----------------|
  | Label text       | [token]          | [token]          | 4.5:1          | Verify at build |
  | Border (default) | [token]          | [token]          | 3:1            | Verify at build |
  | Focus ring       | [token]          | [token]          | 3:1            | Verify at build |

---

### Usage Guidelines

**Use when:**
- [Specific, unambiguous scenario 1]
- [Specific, unambiguous scenario 2]

**Do NOT use when:**
- [Anti-pattern 1] -- use [alternative component] instead
- [Anti-pattern 2] -- use [alternative component] instead

**Content Guidelines:**
- Label text: [case convention, max character count, verb-first / noun-first rule]
- Helper text: [max length, tone, punctuation]
- Error messages: [tone, actionability requirement -- must tell user what to do, not just that an error occurred]
- Placeholder text: [rules -- do not use as substitute for label]

**Composition Rules:**
- MAY be placed inside: [list of parent components / layout containers]
- MUST NOT be placed inside: [list of forbidden parent contexts]
- MAY contain: [allowed child elements]
- MUST NOT contain: [forbidden child content]
- When adjacent to [Component X]: [spacing / alignment rule]

**Theming:**
- Light mode: [which tokens apply]
- Dark mode: [which tokens change and to what]
- High-contrast mode: [any overrides needed for Windows High Contrast / forced-colors media query]
```

---

## Rules

1. **Never suppress the focus ring.** The focus state must be visible and must meet 3:1 contrast against its adjacent background. Using `outline: none` without a replacement focus indicator is a WCAG 2.1 failure (SC 1.4.11, 2.4.7). The acceptable pattern is `:focus-visible` with a clearly defined replacement outline.

2. **Never mark accessibility as optional.** Every component spec MUST include ARIA role, keyboard interaction table, screen reader announcement text, and focus management rules. "TBD" in the accessibility section is not acceptable -- if the information is unknown, the spec is incomplete.

3. **Disabled state must be implemented with both visual muting AND cursor change.** Opacity must be reduced (0.4--0.6 range) OR background/text colors must shift to neutral tokens. Cursor must be `not-allowed`. The `pointer-events: none` CSS rule alone is insufficient -- it does not communicate the disabled state to keyboard or screen reader users.

4. **Distinguish disabled from read-only.** Disabled removes the element from tab order and announces it as unavailable. Read-only keeps it in tab order, announces its value, and uses a `default` cursor. Conflating them causes both keyboard traps and missing information for screen reader users.

5. **Every prop must have an explicit default value -- never "none" or "N/A".** If a prop is optional and has no meaningful default, the default is `undefined` or `null`, and you must document what the component renders when the prop is omitted. Undocumented defaults create inconsistent implementations across teams.

6. **Document invalid variant combinations explicitly.** A Ghost Destructive button reduces the urgency of a dangerous action. A Loading Disabled button creates contradictory semantics. Each invalid combination must be listed with a rationale so engineers can add validation and designers can avoid the combination.

7. **Specify exact token names, not hex values.** Component specs must reference design token names (e.g., `color-action-primary`, `color-text-inverse`) -- never raw hex codes or CSS named colors. This ensures the spec stays valid when tokens are updated and works across themes.

8. **Text overflow behavior is mandatory for every part that displays text.** Every text element needs: maximum character count OR maximum container width with an overflow rule (truncate with ellipsis, wrap to N lines, scroll). "It wraps" is not a complete overflow rule.

9. **State transitions must include timing values.** "The background changes on hover" is incomplete. The correct form is "background transitions over 150ms ease-in-out." This prevents engineers from using inconsistent durations and ensures the motion system is coherent. For `prefers-reduced-motion`, all decorative transitions collapse to `transition: none`.

10. **The loading state must preserve the component's dimensions.** When a Button enters loading state, its width must not change -- the spinner replaces the label visually but the container holds its size. Layout shift during state changes is a UX failure and may fail WCAG 2.5.3 (Label in Name) if the label disappears.

11. **Compound components require a parent-child relationship table.** If the component is a composite widget (Tabs, Accordion, Menu, Select, Combobox), each sub-component must be specced, and the required DOM nesting order must be documented. ARIA roles for composite widgets have strict parent-child requirements -- for example, `tab` elements must be owned by a `tablist`.

12. **Usage guidelines must contain at least one documented anti-pattern per variant.** Listing only correct usage is insufficient. Real anti-patterns (e.g., using a Primary Button for navigation, using an Alert for promotional content, using a Tooltip on a disabled element) must be named explicitly to prevent recurring misuse.

---

## Edge Cases

### Compound Components (Tabs, Accordion, Combobox, Menu, RadioGroup)
Spec each sub-component in its own anatomy and states section. Then add a "Composition Structure" section documenting the required nesting order, owner-owned ARIA relationships, and data flow. For Tabs: `tablist` owns `tab` elements; each `tab` controls a `tabpanel` via `aria-controls`; each `tabpanel` is labelled by its `tab` via `aria-labelledby`. Arrow key navigation moves between tabs (not Tab key) -- this is a roving tabindex pattern, where only the active tab is in the tab sequence. Document this explicitly because engineers frequently implement it incorrectly.

### Overlay Components (Modal, Drawer, Tooltip, Popover, Dropdown Menu)
These require three additional sections beyond standard state tables: (1) **Positioning rules** -- how the overlay positions relative to its trigger (above, below, start, end), collision detection behavior when near viewport edges (flip vs. shift vs. clip), and offset distance from the trigger (typically 4--8px). (2) **Focus trap rules** -- Modals and Dialogs require focus to be trapped inside using a focus trap pattern (Tab cycles through all focusable elements inside; Shift+Tab cycles in reverse; focus does not leave the dialog). Popovers and Tooltips do NOT trap focus. (3) **Dismiss rules** -- clicking the backdrop closes modals; Escape closes all overlays; clicking outside a popover closes it; Tooltips close on `mouseleave` and `blur`. Z-index layering must be documented to prevent stacking conflicts (typical values: Tooltip at 1100, Modal at 1300, Toast at 1400).

### Components With Async States (Form Submit Button, Data Table, Search Input)
Define the complete state lifecycle as a directed graph: `idle → loading → success | error → idle`. Each transition must have a defined trigger (user action or system event), a defined duration rule (minimum 300ms display time for loading state to prevent flash-of-loading; this threshold prevents the spinner from flashing for fast network responses), and a defined UI change. Error states must be specific -- a generic "something went wrong" error fails WCAG SC 3.3.1 (Error Identification), which requires that errors be described in text. Specify the error message format and where it appears relative to the component.

### Components That Must Support Right-to-Left (RTL) Layout
Mirror the horizontal anatomy: leading icon becomes trailing icon, leading padding becomes trailing padding. Use logical CSS properties (`padding-inline-start`, `margin-inline-end`, `text-align: start`) instead of physical properties (`padding-left`, `margin-right`, `text-align: left`) in all dimensional specs. For directional icons (chevrons, arrows, play buttons), specify whether they flip in RTL or remain unchanged. Progress bars always fill left-to-right in LTR and right-to-left in RTL. Document the mirroring rule for each part individually rather than assuming a global flip applies correctly.

### Components With Dynamic Content (Data Table, List, Virtualized Scroll)
When a component renders variable amounts of data, specify: (1) the empty state (what renders when there is no data -- never a blank space; always a defined empty state with a message and optional action), (2) the loading state (skeleton rows vs. spinner overlay vs. progressive loading), (3) the error state (inline error with retry action), and (4) the maximum density threshold (e.g., a Data Table row height should not go below 40px in compact mode to maintain legibility and touch targets). For virtualized lists, document which ARIA attributes are required (`aria-setsize`, `aria-posinset` on each item) to communicate the total list size to screen readers even when items are not rendered in the DOM.

### Icon-Only Components (Icon Button, FAB, Close Button)
When a component has no visible text label, `aria-label` is mandatory -- not optional. The spec must specify the exact label string format for every variant. "Close" for a close button, "Open navigation menu" for a hamburger button, "Add new item" for an add FAB. The visual icon alone does not satisfy WCAG SC 1.1.1 (Non-text Content). Additionally, the minimum touch target must be explicitly enforced at 44x44px even if the visible icon is 24x24px -- specify the padding or pseudo-element technique used to extend the tap target without expanding the visual size.

### Components With Many States That Interact (Form Input with Validation)
A text Input can simultaneously be focused AND in error state, or focused AND read-only, or disabled AND prefilled. Document state combinations as a priority order: disabled > read-only > error > loading > focused > hover > default. When two states apply simultaneously, the higher-priority state's visual properties win for conflicting attributes, but both states' ARIA attributes must be present (e.g., a focused error input shows both the focus ring AND the error border, with `aria-invalid="true"` AND `:focus-visible` styling both active).

### Dark Mode and High-Contrast Mode
Do not create a separate spec for dark mode -- add a token delta table showing which tokens change between modes. The component structure is identical; only the token assignments change. For Windows High Contrast / `forced-colors` media query, CSS custom properties are overridden by the system. Specify which parts need `forced-colors: active` overrides to preserve meaningful visual differentiation (focus rings, disabled states, interactive boundaries). A border that is defined only by color (e.g., a ghost button with no background but a transparent border) becomes invisible in forced-colors mode and must have a `ButtonBorder` or `Highlight` system color fallback specified.

---

## Example

**Input:** "Spec out a Combobox component for our design system. It should support single selection, have a filterable dropdown list, and work with keyboard navigation."

**Output:**

## Component Spec: Combobox

**Classification:** Molecule | Form Control
**ARIA Pattern:** WAI-ARIA APG Combobox Pattern (List autocomplete with manual selection)
**Scope:** Single selection only; filterable input; dropdown list; sm / md / lg sizes; light and dark mode; no RTL in v1.

---

### Purpose
The Combobox allows a user to select a single value from a predefined list by typing to filter visible options, so that users can efficiently find and select from large option sets without scrolling through every item.

---

### Anatomy

| Part               | CSS / Slot Name       | Description                                                               | Required | Overflow Behavior                       |
|--------------------|-----------------------|---------------------------------------------------------------------------|----------|-----------------------------------------|
| Wrapper            | `.combobox`           | Outer container scoping layout and positioning context for the listbox     | Yes      | Fixed width (consumer sets width)       |
| Input              | `.combobox__input`    | Text input where user types to filter; displays selected value at rest     | Yes      | Truncate selected value with ellipsis   |
| Chevron button     | `.combobox__toggle`   | Icon button (chevron-down) that opens/closes the listbox                  | Yes      | Fixed 40px wide; icon rotates on open  |
| Clear button       | `.combobox__clear`    | Icon button (x) to clear the selected value; visible only when value set  | No       | Fixed 32px wide                         |
| Listbox            | `.combobox__listbox`  | Dropdown panel containing filtered options                                | Yes      | Max-height 280px; overflow-y: scroll    |
| Option             | `.combobox__option`   | Selectable row in the listbox                                             | Yes      | Truncate at container width with ellipsis|
| Option group label | `.combobox__group`    | Non-interactive section label for grouped options                         | No       | Truncate at container width             |
| No-results message | `.combobox__empty`    | Shown when filter input matches no options                                | Yes      | Single line, 14px, color-text-subtle    |
| Helper text        | `.combobox__helper`   | Descriptive text below the wrapper                                        | No       | Wrap, max 2 lines                       |
| Validation message | `.combobox__error`    | Error message below the wrapper, replaces helper text                     | No       | Wrap, max 2 lines                       |

**Spatial relationship:**
```
┌─────────────────────────────────────────┐
│ [Input field..................] [x] [▾] │  ← Wrapper (flex row)
└─────────────────────────────────────────┘
  Helper text or validation message         ← Below wrapper

When open:
┌─────────────────────────────────────────┐
│ [Input field..................] [x] [▾] │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Group Label (if grouped)                │  ← Listbox (absolute positioned)
│ ● Option 1                              │
│   Option 2                              │
│   Option 3                              │
│ ...                                     │
└─────────────────────────────────────────┘
  ↑ 4px gap between wrapper bottom and listbox top
```

---

### Variants

#### Visual Variants
| Variant  | Background           | Border                    | Text Color             | Use Case                                                            |
|----------|----------------------|---------------------------|------------------------|---------------------------------------------------------------------|
| Default  | color-surface        | 1px solid color-border    | color-text-primary     | Standard form fields in all contexts                                |
| Filled   | color-surface-raised | none                      | color-text-primary     | Fields embedded in surfaces with their own border (sidebars, cards)|

#### Functional / Intent Variants
| Intent   | Icon                | Color Override              | ARIA                    | Use Case                                           |
|----------|---------------------|-----------------------------|-------------------------|----------------------------------------------------|
| Error    | icon-alert-circle   | color-border-error          | aria-invalid="true"     | Validation failure after submit or on-blur         |
| Success  | icon-check-circle   | color-border-success        | aria-invalid="false"    | Confirmed valid selection (used sparingly)         |
| Disabled | --                  | color-surface-disabled      | aria-disabled="true"    | Field is not interactive in current context        |

#### Size Variants
| Size | Height | Horizontal Padding | Vertical Padding | Font Size | Icon Size | Min Width | Use Context                              |
|------|--------|--------------------|------------------|-----------|-----------|-----------|------------------------------------------|
| sm   | 32px   | 10px               | 5px              | 13px      | 16px      | 120px     | Dense forms, filter toolbars, data table inline editors |
| md   | 40px   | 12px               | 9px              | 14px      | 20px      | 160px     | Default form context (standard page forms) |
| lg   | 48px   | 14px               | 12px             | 16px      | 24px      | 200px     | High-prominence forms, onboarding, mobile-first layouts |

#### Valid Variant Combinations Matrix
| Visual Variant | sm | md | lg | Error | Success | Disabled |
|----------------|----|----|----|-------|---------|----------|
| Default        | ✓  | ✓  | ✓  | ✓     | ✓       | ✓        |
| Filled         | ✓  | ✓  | ✓  | ✓     | ✗ (note)| ✓        |

Note: Filled + Success is invalid because the filled variant is used in surfaces where success states add visual noise. Use the default variant if validation feedback is required.

---

### States

#### Input Wrapper States (Default Variant, md Size)
| State     | Background       | Border                          | Text Color          | Opacity | Cursor       | Additional Visual                        |
|-----------|------------------|---------------------------------|---------------------|---------|--------------|------------------------------------------|
| default   | color-surface    | 1px solid color-border          | color-text-primary  | 1       | text         | Chevron: color-icon-subtle               |
| hover     | color-surface    | 1px solid color-border-hover    | color-text-primary  | 1       | text         | Chevron: color-icon-default              |
| focus     | color-surface    | 1px solid color-border-focus    | color-text-primary  | 1       | text         | 2px solid color-focus-ring, 2px offset   |
| open      | color-surface    | 1px solid color-border-focus    | color-text-primary  | 1       | text         | Chevron rotates 180deg, listbox appears  |
| disabled  | color-surface-disabled | 1px solid color-border-disabled | color-text-disabled | 0.5 | not-allowed  | Clear and chevron buttons also disabled  |
| error     | color-surface    | 1px solid color-border-error    | color-text-primary  | 1       | text         | Error icon at trailing position of input |
| read-only | color-surface-subtle | 1px dashed color-border      | color-text-primary  | 1       | default      | No hover/focus border change             |

#### Option States (within Listbox)
| State         | Background              | Text Color             | Cursor  | Additional Visual                            |
|---------------|-------------------------|------------------------|---------|----------------------------------------------|
| default       | transparent             | color-text-primary     | pointer | --                                           |
| hover         | color-surface-hover     | color-text-primary     | pointer | --                                           |
| keyboard focus| color-surface-hover     | color-text-primary     | pointer | 2px inset focus ring color-focus-ring        |
| selected      | color-surface-selected  | color-action-primary   | pointer | Checkmark icon (16px) at leading position    |
| selected+focus| color-surface-selected  | color-action-primary   | pointer | Both checkmark and focus ring visible        |
| disabled      | transparent             | color-text-disabled    | not-allowed | No hover state; skip in keyboard navigation |

**State Transitions:**
| From State | To State    | Trigger                              | Transition                                    |
|------------|-------------|--------------------------------------|-----------------------------------------------|
| default    | open        | click input, click chevron, Alt+Down | listbox: opacity 0→1 over 150ms ease-out      |
| open       | default     | Escape, click outside, select option | listbox: opacity 1→0 over 100ms ease-in       |
| default    | error       | form submit with no value, blur      | border: color transition 150ms ease           |
| loading    | open        | options fetch resolve (min 300ms)    | skeleton rows replaced by real options        |

---

### Props

| Prop             | Type              | Default        | Valid Options / Range                      | Mutually Exclusive With | Description                                                              |
|------------------|-------------------|----------------|--------------------------------------------|-------------------------|--------------------------------------------------------------------------|
| value            | string            | undefined      | Any string matching an option value        | none                    | Controlled selected value                                                |
| defaultValue     | string            | undefined      | Any string matching an option value        | value                   | Uncontrolled initial value                                               |
| options          | Option[]          | []             | { value: string, label: string, disabled?: boolean, group?: string }[] | none | List of selectable options |
| placeholder      | string            | "Select..."    | Any string, max 40 characters              | none                    | Displayed in input when no value selected                                |
| isDisabled       | boolean           | false          | --                                         | isReadOnly              | Removes all interactivity                                                |
| isReadOnly       | boolean           | false          | --                                         | isDisabled              | Keeps value visible but prevents changes; stays in tab order             |
| isLoading        | boolean           | false          | --                                         | isDisabled              | Shows skeleton rows in listbox instead of options                        |
| isInvalid        | boolean           | false          | --                                         | none                    | Applies error visual state                                               |
| errorMessage     | string            | undefined      | Any string                                 | none                    | Error text below field; only renders when isInvalid=true                 |
| helperText       | string            | undefined      | Any string                                 | errorMessage            | Descriptive text below field; hidden when errorMessage present           |
| label            | string            | undefined      | Any string (required if no aria-label)     | none                    | Visible label above field                                                |
| size             | enum              | "md"           | "sm", "md", "lg"                           | none                    | Controls component density                                               |
| variant          | enum              | "default"      | "default", "filled"                        | none                    | Visual style                                                             |
| isClearable      | boolean           | false          | --                                         | isDisabled              | Shows the clear button when a value is selected                          |
| filterFunction   | function          | built-in       | (option: Option, inputValue: string) => boolean | none            | Custom filter logic; defaults to case-insensitive substring match        |
| onValueChange    | function          | undefined      | (value: string) => void                    | none                    | Called when selection changes                                            |
| onInputChange    | function          | undefined      | (inputValue: string) => void               | none                    | Called on every keystroke in the input                                   |
| onOpenChange     | function          | undefined      | (isOpen: boolean) => void                  | none                    | Called when listbox opens or closes                                      |

**Priority rules for conflicting props:**
- When both `isDisabled` and `isLoading` are true, `isDisabled` takes precedence. Loading presumes the component is interactive (user triggered it). If the component should be non-interactive while loading (e.g., a page-level data fetch), use `isDisabled` instead.
- When both `errorMessage` and `helperText` are provided, `errorMessage` renders and `helperText` is hidden (not removed from DOM -- use `aria-hidden` on helper text when error is active).
- When both `value` and `defaultValue` are provided, `value` wins and the component behaves as controlled.

---

### Accessibility

- **ARIA Role:** The component is a composite widget. The input element has `role="combobox"`. The dropdown list has `role="listbox"`. Each option has `role="option"`. Option groups use `role="group"` with `aria-label` for the group name. Native HTML elements do not provide these roles -- they must be applied explicitly.

- **Required ARIA Attributes:**
  - `aria-expanded`: Set on the input element. Value is `"true"` when listbox is open, `"false"` when closed.
  - `aria-haspopup="listbox"`: Set on the input element. Static -- always present.
  - `aria-controls`: Set on the input element. Value is the `id` of the listbox element.
  - `aria-autocomplete="list"`: Set on the input element. Indicates that the list filters as the user types.
  - `role="option"` + `aria-selected`: Set on each option. `"true"` for the selected option, `"false"` for all others (do not omit `aria-selected="false"` -- omitting it is different from false in some screen readers).
  - `aria-label` or `aria-labelledby`: The input must be programmatically associated with its label. Use `<label for>` / `id` association or `aria-labelledby` pointing to the label element.

- **Conditional ARIA Attributes:**
  - `aria-invalid="true"`: Added to input when `isInvalid=true`.
  - `aria-describedby`: Points to the `id` of the error message or helper text element. When both exist, points to the error message element only.
  - `aria-disabled="true"`: Added to input when `isDisabled=true` (in addition to the native `disabled` attribute for redundancy).
  - `aria-activedescendant`: Set on the input. Value is the `id` of the currently keyboard-focused option in the listbox. This communicates the active option to screen readers without moving DOM focus out of the input.

- **Keyboard Interaction:**

  
