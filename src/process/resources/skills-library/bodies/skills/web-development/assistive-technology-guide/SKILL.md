---
name: assistive-technology-guide
description: |
  Guide developers and designers in supporting the full range of assistive technologies including switch access, eye tracking, voice control, screen magnification, and alternative input devices.
  Use when the user asks about assistive technology guide, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of assistive technology guide or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "accessibility breathing checklist template guide testing automation best-practices"
  category: "web-development"
  subcategory: "accessibility-performance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Assistive Technology Guide

You are an expert in assistive technology compatibility, specializing in ensuring digital products work with the full range of input and output devices that people with disabilities use. Beyond screen readers, you cover switch access, eye tracking, voice control, screen magnification, braille displays, head pointers, and mouth sticks. You help teams understand these technologies, design for them, and test with them.


## When to Use

**Use this skill when:**
- User asks about assistive technology guide techniques or best practices
- User needs guidance on assistive technology guide concepts
- User wants to implement or improve their approach to assistive technology guide

**Do NOT use when:**
- The request falls outside the scope of assistive technology guide
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. What assistive technologies do your users currently rely on?
2. Is this a web, mobile, or desktop application?
3. What input methods do you currently support (mouse, keyboard, touch)?
4. Are there any time-sensitive or precision-dependent interactions in your UI?
5. What is your testing capability (do you have access to assistive technology hardware/software)?
6. Are you designing for a specific population (e.g., ALS patients, elderly care, education)?

## Overview of Assistive Technologies

### Input Technologies

| Technology | Users | How It Works |
|-----------|-------|-------------|
| **Screen reader** | Blind, low vision | Reads content aloud; keyboard navigation |
| **Screen magnifier** | Low vision | Enlarges portion of screen 2x-16x |
| **Voice control** | Motor disabilities, RSI | Speaks commands and dictates text |
| **Switch access** | Severe motor disabilities | One or two buttons scan through options |
| **Eye tracking** | ALS, spinal cord injury, cerebral palsy | Camera tracks gaze to move cursor |
| **Head pointer** | Limited hand use | Head-mounted pointer controls cursor |
| **Mouth stick / head wand** | Quadriplegia | Physical pointer for keyboard/screen |
| **Sip-and-puff** | Severe motor disabilities | Breath pressure acts as switch input |
| **Braille display** | Blind, deafblind | Tactile output of text; input via braille keys |
| **Alternative keyboard** | Motor, cognitive | Large keys, key guards, reduced layouts |
| **Joystick / trackball** | Motor disabilities | Alternative pointing devices |
| **On-screen keyboard** | Motor disabilities | Virtual keyboard operated by any pointer |

### Output Technologies

| Technology | Users | What It Provides |
|-----------|-------|-----------------|
| **Screen reader speech** | Blind | Audio output of screen content |
| **Braille display** | Deafblind, blind | Tactile text output |
| **Screen magnifier** | Low vision | Enlarged visual content |
| **Captions** | Deaf, hard of hearing | Text for audio content |
| **Audio descriptions** | Blind | Narration of visual content |
| **Haptic feedback** | Deaf, deafblind | Vibration alerts |

## Switch Access

### How Switch Access Works

Switch users interact with digital interfaces using one or more physical switches. The most common pattern:

1. **Auto-scan**: The system highlights items one at a time in sequence
2. **User presses switch**: Selects the currently highlighted item
3. **Group scanning**: Items are grouped; first select a group, then scan within it

Switch configurations:
- **One switch**: Auto-scan with single press to select (most common)
- **Two switches**: One to advance, one to select
- **Multiple switches**: Directional scanning or direct selection

### Design Requirements for Switch Access

**Target Size:**
```css
/* Switch users need large, well-spaced targets */
.interactive-element {
  min-width: 44px;
  min-height: 44px;
  /* WCAG 2.5.8 requires 24x24 minimum, but 44x44 is
     strongly recommended for switch and eye tracking users */
}

/* Generous spacing between targets */
.button + .button {
  margin-left: 16px;
}

.list-item {
  padding: 12px 16px;
  /* Avoid adjacent targets with no spacing */
}
```

**Logical Focus Order:**
Switch scanning follows the focus/tab order. If your tab order is wrong, switch users will experience a confusing scan sequence.

```html
<!-- Ensure source order matches visual order -->
<nav>
  <a href="/">Home</a>
  <a href="/products">Products</a>
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
</nav>

<!-- Group related actions -->
<div role="group" aria-label="Message actions">
  <button>Reply</button>
  <button>Forward</button>
  <button>Archive</button>
  <button>Delete</button>
</div>
```

**Minimize Interactions:**
Every switch press takes significant effort. Minimize the number of presses needed.

| Bad Pattern | Good Pattern |
|-------------|-------------|
| 3 confirmations to delete | 1 delete with undo |
| Nested dropdown menus 3 levels deep | Flat navigation with search |
| Multi-step wizards with many fields per page | Fewer fields, smart defaults |
| Hover menus | Click/tap to open menus |
| Double-click actions | Single click with alternatives |
| Drag-and-drop only | Drag-and-drop plus button alternatives |

**Switch Access on Mobile:**

iOS Switch Control and Android Switch Access are built into the operating systems. They scan through all accessible elements. Your app must:
- Have every interactive element in the accessibility tree
- Provide meaningful labels for all controls
- Support the standard element types (buttons, links, form fields)
- Avoid custom gesture requirements without alternatives

### Testing with Switch Access

**iOS Switch Control:**
1. Settings > Accessibility > Switch Control > Switches > Add New Switch
2. Use the screen as a switch (tap left side = Move, tap right side = Select)
3. Enable Switch Control
4. Observe: Can you reach and activate every control?

**Android Switch Access:**
1. Settings > Accessibility > Switch Access
2. Set up two switches (volume buttons work for testing)
3. Enable and navigate your app
4. Observe: Is the scanning order logical? Are all elements reachable?

**Windows Switch Access:**
Use the on-screen keyboard with scanning mode, or dedicated switch interface software.

## Eye Tracking

### How Eye Tracking Works

Eye tracking systems use infrared cameras to detect where the user is looking. The gaze position maps to a cursor on screen. Dwell time (looking at a target for a set duration) or a separate switch triggers a click.

**Common systems:** Tobii Dynavox, EyeTech, Irisbond

### Design Requirements for Eye Tracking

**Large Targets:**
Eye tracking has lower precision than a mouse, typically 0.5-1 degree of visual angle, which translates to roughly 30-50 pixels of error at typical viewing distances.

```css
/* Eye tracking requires even larger targets than switch access */
.eye-tracking-friendly {
  min-width: 60px;
  min-height: 60px;
  padding: 16px 24px;
}

/* Wide spacing prevents mis-selection */
.action-button + .action-button {
  margin: 20px;
}

/* Avoid placing destructive actions next to common actions */
.actions-row {
  display: flex;
  gap: 24px;
}
.actions-row .danger-button {
  margin-left: auto; /* Push to far side */
}
```

**Dwell Activation Considerations:**
- Dwell time is usually 400-1000ms of sustained gaze
- Any element the user looks at for that duration will activate
- Avoid placing interactive elements near content the user needs to read at length
- Provide visual feedback during dwell (countdown animation)

```css
/* Dwell feedback animation */
.dwell-target:hover {
  position: relative;
}

.dwell-target:hover::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 3px solid #1a73e8;
  border-radius: inherit;
  animation: dwell-progress 800ms linear forwards;
}

@keyframes dwell-progress {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0 0 0 0); }
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .dwell-target:hover::after {
    animation: none;
    opacity: 0.5;
  }
}
```

**Avoid Gaze-Dependent Scrolling:**
- Provide explicit scroll buttons (up/down arrows) rather than edge-of-screen scrolling
- Keep key actions visible without scrolling
- Use pagination over infinite scroll

**Fatigue Management:**
Eye tracking is physically tiring. Design for efficiency:
- Minimize the number of gaze movements needed per task
- Cluster related controls together
- Provide keyboard shortcuts as alternatives
- Support customizable dwell time

## Voice Control

### How Voice Control Works

Voice control software lets users speak commands to control their computer, navigate interfaces, and dictate text.

**Common systems:**
- **Dragon NaturallySpeaking** (Windows) -- the professional standard
- **Voice Control** (macOS/iOS) -- built-in
- **Voice Access** (Android) -- built-in
- **Windows Voice Access** -- built into Windows 11
- **Talon** -- open-source, programmable voice control

### Design Requirements for Voice Control

**Visible Labels:**
Voice control users say "click [label]" to activate controls. The visible text label must match the accessible name.

```html
<!-- GOOD: visible label matches accessible name -->
<button>Submit Order</button>
<!-- User says: "Click Submit Order" -->

<!-- BAD: aria-label doesn't match visible text -->
<button aria-label="Send your order to us">Submit Order</button>
<!-- User says "Click Submit Order" but the accessible name is different -->
<!-- This fails WCAG 2.5.3 Label in Name -->

<!-- GOOD: aria-label starts with visible text -->
<button aria-label="Submit Order - opens confirmation dialog">Submit Order</button>
<!-- Accessible name starts with visible text, so voice command works -->
```

**Unique, Descriptive Labels:**
If multiple elements have the same label, voice control shows numbered overlays and the user must choose. Unique labels eliminate this friction.

```html
<!-- BAD: Three identical "Read more" links -->
<a href="/post-1">Read more</a>
<a href="/post-2">Read more</a>
<a href="/post-3">Read more</a>

<!-- GOOD: Unique link text -->
<a href="/post-1">Read more about accessible forms</a>
<a href="/post-2">Read more about color contrast</a>
<a href="/post-3">Read more about keyboard navigation</a>

<!-- ALTERNATIVE: Visually hidden but unique accessible name -->
<a href="/post-1">Read more<span class="sr-only"> about accessible forms</span></a>
```

**WCAG 2.5.3 Label in Name:**
The accessible name must contain the visible text label. This ensures voice commands work.

| Visible Text | Accessible Name | Passes? |
|-------------|-----------------|---------|
| "Search" | "Search" | Yes |
| "Search" | "Search products" | Yes (starts with visible text) |
| "Search" | "Find products" | No (visible text not in name) |
| "Submit" | "Submit form for review" | Yes (starts with visible text) |
| "Submit" | "Send" | No (visible text not in name) |

**Number Overlays:**
macOS Voice Control and Windows Voice Access can show numbers on every interactive element. Ensure your layout has enough space for overlay numbers near each control.

### Testing with Voice Control

**macOS Voice Control:**
1. System Settings > Accessibility > Voice Control > Enable
2. Say "Show numbers" to see numbered overlays on all interactive elements
3. Say "Click [number]" or "Click [label]" to activate elements
4. Test: Can you complete every user flow by voice alone?

**Windows Voice Access (Windows 11):**
1. Settings > Accessibility > Speech > Voice Access
2. Say "Show numbers" or "Show grid"
3. Navigate and interact by voice

**Common voice control issues to test for:**
- [ ] Every interactive element has a visible label
- [ ] Visible labels match accessible names (WCAG 2.5.3)
- [ ] No two adjacent controls have identical labels
- [ ] Custom controls are reachable and activatable by voice
- [ ] Form fields can be filled by dictation
- [ ] Scrolling is possible by voice command

## Screen Magnification

### How Screen Magnification Works

Screen magnifiers enlarge a portion of the screen, typically 2x to 16x. The user sees a small viewport of the full page and must pan around to find content.

**Common tools:**
- **ZoomText** (Windows) -- commercial, most feature-rich
- **Windows Magnifier** -- built-in, basic
- **macOS Zoom** -- built-in, good quality
- **iOS/Android Zoom** -- built-in

### Design Requirements for Screen Magnification

**Proximity Principle:**
At high magnification, related elements must be physically close. If an error message appears far from the field it describes, magnifier users may never see it.

```html
<!-- BAD: Error summary at page top, fields at bottom -->
<div class="errors" style="position: fixed; top: 0;">
  Email is invalid
</div>
<!-- ... many elements ... -->
<input type="email" id="email">

<!-- GOOD: Error message immediately adjacent to field -->
<div class="field-group">
  <label for="email">Email</label>
  <input type="email" id="email" aria-invalid="true"
         aria-describedby="email-error">
  <p id="email-error" class="error">Enter a valid email address</p>
</div>
```

**Avoid Fixed Positioning:**
Fixed headers and footers consume precious viewport space at high magnification.

```css
/* At high zoom, fixed elements can cover most of the viewport */
/* Consider making fixed elements scrollable or collapsible */
@media (min-resolution: 192dpi), (min-zoom: 2) {
  .fixed-header {
    position: relative; /* Un-fix at high zoom */
  }
}

/* Or use a thin fixed header that collapses on scroll */
.header {
  position: sticky;
  top: 0;
  height: auto; /* Minimal height */
}
```

**Responsive Reflow (WCAG 1.4.10):**
At 400% zoom (equivalent to 320px viewport width), content must reflow to a single column with no horizontal scrolling.

```css
/* Ensure content reflows at narrow widths */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

/* Tables may need responsive alternatives */
@media (max-width: 600px) {
  .responsive-table thead {
    display: none;
  }
  .responsive-table tr {
    display: block;
    margin-bottom: 16px;
    border: 1px solid #ccc;
  }
  .responsive-table td {
    display: flex;
    justify-content: space-between;
    padding: 8px;
  }
  .responsive-table td::before {
    content: attr(data-label);
    font-weight: bold;
  }
}
```

**Status Messages Near Triggers:**
Magnifier users have a narrow viewport. Place feedback near the action that triggered it.

- Toast notifications should appear near the triggering button, not in a fixed corner
- Loading indicators should be adjacent to the content being loaded
- Form validation should be inline, not in a remote summary only

### Testing with Screen Magnification

1. Set Windows Magnifier to 200% (Win+Plus key)
2. Navigate the application by panning
3. Increase to 400%
4. Check:
   - [ ] Can you find all content by panning?
   - [ ] Are related elements (label/field, action/feedback) visible together?
   - [ ] Does content reflow to single column at 400%?
   - [ ] Do fixed/sticky elements consume too much viewport?
   - [ ] Do tooltips and popups appear near their triggers?
   - [ ] Is focus visible and near the content it refers to?

## Braille Displays

### How Braille Displays Work

Refreshable braille displays have a row of cells (typically 14-80 cells) with retractable pins that form braille characters. They connect to screen readers and display the current line of text. Users read by touch and navigate using buttons on the display.

### Design Requirements for Braille

- **Keep content concise** -- an 80-cell display shows about 80 characters; a 20-cell mobile display shows 20
- **Use proper punctuation and structure** -- braille users rely on structural cues
- **Avoid emoji and special symbols for meaning** -- many do not have braille translations
- **Ensure all ARIA live regions work** -- braille users rely on these for updates
- **Test table navigation** -- braille users navigate cell by cell using screen reader table commands

## General Design Principles for All Assistive Technologies

### The Universal Requirements

1. **Everything keyboard accessible** -- This is the foundation. Every AT builds on keyboard support.

2. **Clear, consistent focus management** -- All ATs need to track where the user is.

3. **Semantic HTML** -- Assistive technologies rely on the accessibility tree. Semantic elements create correct tree nodes automatically.

4. **Visible, descriptive labels** -- Voice control needs them. Screen readers need them. Magnifier users need them near their controls.

5. **Large, well-spaced targets** -- Switch, eye tracking, and magnification all benefit.

6. **No time pressure** -- Switch and eye tracking users are slower. Voice users need time to formulate commands.

7. **Simple, predictable interactions** -- Every additional step multiplies effort for AT users.

8. **Multiple ways to accomplish tasks** -- Mouse, keyboard, touch, voice. Never require only one input method.

### AT Compatibility Checklist

| Requirement | Screen Reader | Switch | Eye Tracking | Voice | Magnifier | Braille |
|-------------|:---:|:---:|:---:|:---:|:---:|:---:|
| Keyboard accessible | Yes | Yes | -- | -- | Yes | Yes |
| Large targets (44px+) | -- | Yes | Yes | -- | Yes | -- |
| Visible labels | -- | -- | -- | Yes | Yes | -- |
| Label in name (2.5.3) | -- | -- | -- | Yes | -- | -- |
| No hover-only interactions | Yes | Yes | Yes | Yes | -- | Yes |
| No time limits | -- | Yes | Yes | Yes | -- | -- |
| Content reflows at 400% | -- | -- | -- | -- | Yes | -- |
| Semantic HTML | Yes | Yes | -- | -- | -- | Yes |
| ARIA live regions | Yes | -- | -- | -- | -- | Yes |
| Proximity of related info | -- | -- | -- | -- | Yes | -- |
| Drag alternatives (2.5.7) | Yes | Yes | Yes | Yes | -- | Yes |

### Testing Priority Matrix

If you can only test with limited assistive technologies, prioritize in this order:

1. **Keyboard only** -- Catches the most issues; foundation for all AT
2. **Screen reader (NVDA or VoiceOver)** -- Validates the accessibility tree
3. **Screen magnifier at 400% zoom** -- Catches layout and proximity issues
4. **Voice control** -- Catches label-in-name issues
5. **Switch access** -- Validates scan order and interaction efficiency

## Resources

| Resource | URL | Content |
|----------|-----|---------|
| ARIA Authoring Practices Guide | w3.org/WAI/ARIA/apg | Widget patterns and keyboard interaction |
| Switch Access on Android | support.google.com | Setup and configuration guide |
| iOS Switch Control | support.apple.com | Setup and configuration guide |
| Tobii Eye Tracking | tobii.com | Eye tracking hardware and software |
| Dragon NaturallySpeaking | nuance.com | Professional voice control |
| Talon Voice | talonvoice.com | Open-source programmable voice control |
| ZoomText | freedomscientific.com | Professional screen magnification |
| NVDA | nvaccess.org | Free screen reader for Windows |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to assistive technology guide
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Assistive Technology Guide Analysis

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

**Input:** "Help me with assistive technology guide for my current situation"

**Output:**

Based on your situation, here is a structured approach to assistive technology guide:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
