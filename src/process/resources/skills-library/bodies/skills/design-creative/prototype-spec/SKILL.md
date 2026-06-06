---
name: prototype-spec
description: |
  Produces an interactive prototype specification defining screen transitions, animation types, durations, easing curves, and interaction triggers in a tool-agnostic table format.
  Use when the user asks to define prototype interactions, specify screen transitions, document animations between states, or plan interaction flows for handoff to developers.
  Do NOT use for wireframing static layouts (use wireframe-specification), mapping user flows without animation detail (use user-flow-mapping), or building coded prototypes.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design planning template"
  category: "design-creative"
  subcategory: "ui-ux-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Prototype Spec

## When to Use

**Use this skill when:**
- The user needs to specify screen transitions, micro-interactions, gesture responses, or state animations for a prototype that will be handed off to developers or used as a reference for a design tool prototype build
- The user has completed layout design and needs to add motion intent -- defining what moves, how it moves, how fast, and what triggers it
- The user needs a formal interaction specification document for a design review, sprint planning, or engineering handoff meeting
- The user wants to document complex animation sequences such as onboarding flows, multi-step form progression, or wizard navigation where timing dependencies between elements matter
- The user is working on a design system and needs to codify animation tokens -- duration scales, easing curves, and motion principles -- that will be reused across components
- The user is defining interactions for accessibility compliance and must document `prefers-reduced-motion` behavior, focus state animations, and ARIA-live region update feedback
- The user needs to reconcile animation behavior across platforms (iOS, Android, web) where native motion conventions differ significantly

**Do NOT use when:**
- The user needs to create or document static screen layouts -- use the `wireframe-specification` skill instead
- The user wants to map the logical navigation paths between screens without caring about how transitions animate -- use the `user-flow-mapping` skill instead
- The user wants to write working animation code in CSS, JavaScript, Swift, or Kotlin -- this skill produces specifications, not implementation code
- The user wants motion graphics, video animation, or illustration animation (After Effects-style storytelling that is not tied to user interaction)
- The user needs a component library documentation of visual styles only (colors, typography, spacing) -- use a design token or component spec skill instead
- The user is in early discovery and has not yet defined what screens exist -- the prototype spec requires a settled information architecture to be meaningful

---

## Process

### Step 1: Establish Interaction Context

Before writing a single table row, gather critical context that shapes every decision in the document.

- **Platform(s):** Web (desktop, mobile-web), iOS native, Android native, or cross-platform (React Native, Flutter). Platform determines which motion conventions users have been trained to expect. iOS uses spring physics for nearly all navigation and element reveals. Android uses the Material Design motion system with shared-element transitions and predictive back gestures. Web has no default animation system and requires explicit definition.
- **Interaction tone:** Ask the user to choose one of three archetypes or describe a blend: (a) Minimal -- animations serve clarity only, durations under 200ms, no spring or bounce; (b) Professional -- smooth, purposeful motion that communicates state change, durations 150-350ms, ease-in-out curves; (c) Expressive -- motion carries brand personality, springs and overshoots are appropriate, stagger sequences create delight. A fintech app targeting enterprise users wants minimal. A consumer social app wants expressive.
- **Performance constraints:** Will this run on low-end Android devices (Snapdragon 400 series, under 2GB RAM)? Is this a progressive web app where paint performance is a concern? Will animations need to hit 60fps or 120fps (ProMotion displays)? Low-end targets eliminate transform-heavy animations and require GPU-composited properties only (transform and opacity).
- **Reduced-motion requirement:** Is `prefers-reduced-motion: reduce` support mandatory (healthcare, government, accessibility-first product)? Document this upfront because it affects every interaction definition.
- **Existing tokens:** Does the product already have an animation token system (e.g., `--duration-fast: 100ms`)? If yes, map to those tokens. If no, you will define them.
- **Handoff target:** Will this spec be used by engineers writing CSS/JS, engineers building iOS UIKit/SwiftUI, Android Jetpack Compose, or React Native Animated? Each has different capabilities. CSS can express cubic-bezier precisely. SwiftUI's `.spring(response:dampingFraction:)` uses different parameters. Note this so engineers receive appropriately formatted values.

### Step 2: Catalog All Interaction Points

Build a complete inventory before specifying any details. Missing interactions discovered late break the numbering system and create gaps in developer handoff.

- Walk through each screen in the scope systematically: (a) navigation-level interactions -- what takes the user to another screen; (b) component-level interactions -- what changes state within the current screen; (c) ambient interactions -- what happens without direct user action (loading, auto-play, real-time data update)
- Categorize each interaction by type to apply the correct duration and motion vocabulary:
  - **Navigation transitions** -- screen replaces screen (push/pop), modal overlays, full-screen takeovers
  - **Panel reveals** -- bottom sheets, side drawers, modals, popovers, dropdowns that layer over existing content
  - **State toggles** -- selected/unselected, expanded/collapsed, enabled/disabled, checked/unchecked
  - **Feedback responses** -- button press, form submit, success/error confirmation, haptic-paired visual feedback
  - **Loading states** -- skeleton screens, spinners, progress indicators, content fade-in
  - **Scroll-driven interactions** -- sticky headers, parallax, scroll-to-trigger reveals, lazy load
  - **Gesture continuations** -- swipe-to-dismiss, pull-to-refresh, drag-and-drop, pinch-to-zoom
- Assign a reference number to each interaction immediately. Numbers should persist through the entire document -- never renumber after assignment. If an interaction is removed, leave a note "(removed)" at that number rather than shifting all subsequent IDs.
- Note any animation dependencies: "Interaction 7 cannot play until Interaction 6 completes" -- these are sequenced animations that require explicit timing documentation.

### Step 3: Specify Screen Transitions

Screen transitions are the highest-visibility animations and must precisely communicate spatial relationships and hierarchy.

- **Apply the spatial model rule:** Every screen transition must be consistent with a spatial metaphor. In a tab-based app, tabs are side by side -- switching tabs slides horizontally. In a hierarchical drill-down, child screens push from the right and pop back to the left (iOS convention). Modal dialogs float above the current screen and should slide up or fade in, never push sideways, because they are not spatially adjacent to the source. Violating the spatial model disorients users.
- **Duration thresholds by type:**
  - Full-screen navigation push/pop: 300-400ms (iOS system default is 350ms; Android predictive back is ~320ms)
  - Modal bottom sheet reveal: 280-320ms
  - Dialog/alert overlay: 200-250ms
  - Tab switch (no spatial push): 150-200ms with cross-fade
  - Drawer (side nav): 250-300ms
  - Tooltip/popover appear: 150-200ms
  - Never exceed 400ms for any navigation transition. Users lose sense of causal connection above 400ms.
- **Easing by transition direction:**
  - Entering elements (sliding into view): ease-out (starts fast, decelerates to rest) -- cubic-bezier(0.0, 0.0, 0.2, 1) is Material Design's standard deceleration curve
  - Exiting elements (leaving the screen): ease-in (starts slow, accelerates out) -- cubic-bezier(0.4, 0.0, 1, 1)
  - Elements that enter and exit within a single view (expanding, collapsing): ease-in-out -- cubic-bezier(0.4, 0.0, 0.2, 1)
  - Spring physics for natural feel: iOS spring equivalent in CSS is approximately cubic-bezier(0.34, 1.56, 0.64, 1) for a slight overshoot, or cubic-bezier(0.175, 0.885, 0.32, 1.275) for a more pronounced bounce
- **Simultaneous vs. staggered enter/exit:** When one screen leaves and another enters simultaneously (cross-dissolve, push), document both outgoing and incoming element behavior. A push right means source slides out to the left while target slides in from the right -- these must be defined separately if they differ in timing or easing.
- **Overlay backdrop:** Any panel, modal, or drawer that layers over content must specify backdrop behavior: opacity value (0.4-0.6 black is standard), animation duration (match the panel's enter duration), and whether tapping the backdrop dismisses the overlay (define that dismissal animation too).

### Step 4: Specify Micro-Interactions

Micro-interactions operate at component level and are the layer of feedback that makes interfaces feel responsive and alive.

- **Button interaction states** -- the minimum required set for any interactive button:
  - Rest state (defined in visual design, referenced here)
  - Hover state (web only): background/border color shift, 100-150ms ease-out. Never animate font-weight on hover (causes layout shift).
  - Press/active state: scale to 0.96-0.97 over 80-100ms ease-in, release back to 1.0 over 100-150ms ease-out. On mobile, this provides tactile-equivalent feedback.
  - Disabled state: opacity 0.4-0.5, no transition needed (state is set programmatically)
  - Loading state (async action): button content swaps to a spinner, button width locks to prevent layout collapse, 150ms cross-fade
  - Success state: content swaps to checkmark + confirmation text, 200ms ease-out, auto-resets after 2000-3000ms
  - Error state: horizontal shake (translate X: 0, -8px, 8px, -8px, 0) over 400ms total, no easing (linear oscillation)
- **Form field interactions:**
  - Focus border animation: 150ms ease-out, border color change + optional border-width increase from 1px to 2px
  - Label float (material-style): label translates up and scales from 1.0 to 0.75 over 150ms ease-out when field receives focus or has content
  - Validation feedback: error state shows shake (see above) + error text fades in below field over 200ms; success shows checkmark fade-in on trailing icon
  - Character counter: no animation, numerical update is instant
- **Toggle and selection components:**
  - Checkbox: checkmark path draws in via SVG stroke animation, 150ms ease-out, background fill 100ms ease-out
  - Radio button: inner dot scales from 0 to 1.0, 150ms cubic-bezier(0.34, 1.56, 0.64, 1) (spring feel)
  - Toggle/switch: thumb translates horizontally over 200ms ease-in-out, track color changes 200ms ease-in-out -- both properties animate simultaneously
  - Tab selection: active indicator (underline or pill) slides to selected tab position, 200ms ease-in-out, width morphs if tabs have different widths
- **Reveal interactions:**
  - Accordion expand: height animates from 0 to content height, 200ms ease-out. Note: animating height in CSS requires `max-height` trick or the Web Animations API `auto` keyword -- document which approach is expected.
  - Dropdown menu: transform: scaleY(0) to scaleY(1) with transform-origin at top, 150ms ease-out. Simultaneously fade from opacity 0 to 1.
  - Tooltip: fade-in only (no transform) after 300-500ms hover delay, fade-out on mouse-leave 100ms ease-in. Tooltip appears above/below based on available space -- document both variants.
  - Popover/context menu: scale from 0.95 to 1.0 + fade from 0 to 1, 150ms ease-out, transform-origin at trigger point
- **Scroll-driven interactions:**
  - Sticky header: box-shadow appears at scroll position > 0px, 200ms ease-out. Optional: header compresses height from 64px to 48px over first 100px of scroll.
  - Scroll-to-reveal (intersection observer pattern): elements fade + translate from Y+20px to Y+0px as they enter viewport, 300ms ease-out, stagger 50-100ms per element in a group
  - Pull-to-refresh: loading indicator appears at top, rubber-band over-scroll effect (content translates with diminishing returns beyond threshold), 60px threshold for release

### Step 5: Define Loading State Animations

Loading states are not a single animation -- they are a coordinated set of states that bridge empty and populated UI.

- **Skeleton screens vs. spinners:** Use skeleton screens (placeholder shapes matching content layout) for content that takes 300ms-3000ms to load. Skeleton screens reduce perceived wait time by 15-25% compared to spinners in user research. Use spinners (or progress bars) for operations with a defined duration or completion percentage. Use nothing (instant update) for operations under 300ms -- adding a loading state to a fast operation creates perceived slowness.
- **Skeleton shimmer animation:** A gradient that sweeps from left to right, repeating. CSS implementation uses a background-gradient on the skeleton element animated with keyframes. Duration: 1.5s, linear, infinite. The shimmer should move in the same direction as reading direction (left-to-right for LTR languages, reverse for RTL).
- **Content fade-in:** When content replaces skeleton, the skeleton fades out (opacity 1 to 0, 150ms) and real content fades in (opacity 0 to 1, 200ms ease-in). These can overlap slightly for a seamless handoff.
- **Progressive loading:** For lists, images in a grid, or feeds, use staggered fade-in. Each item fades in 50-75ms after the previous. Cap the stagger at 8 items (400ms total delay for the 8th item) -- beyond that, stagger becomes annoying rather than delightful.
- **Error states:** Define the transition from loading to error. The loading indicator should exit (fade out, 150ms), then the error state enters (fade in, 200ms). Error states should never animate with bouncy springs -- the tone must be calm and informative.

### Step 6: Define Sequenced and Dependent Animations

Complex flows like onboarding, empty states, and celebration moments require choreographed multi-element sequences.

- **Document sequences with a numbered dependency chain:** Each animation in a sequence must state whether it starts (a) at time T+Nms from sequence start (absolute), (b) after a specific preceding animation completes (relative), or (c) in parallel with another animation.
- **Stagger patterns for lists and grids:**
  - Linear stagger: each item delays by a fixed interval (50ms is readable; 100ms feels slow for lists longer than 5 items)
  - Wave stagger: items delay based on distance from a point of origin (useful for grid reveals, radial stagger)
  - Cap total stagger sequence at 400-500ms maximum. A 20-item list at 50ms stagger = 1000ms total, which is too slow. At 20+ items, reduce stagger to 20-25ms or stop staggering after the 8th visible item.
- **Hero element entrance:** In onboarding screens or empty states, one element animates first to establish visual hierarchy, then supporting elements follow. Hero entrance: 300ms, ease-out. Supporting elements: stagger starts 100ms after hero animation begins, not after it completes (parallel overlap creates energy).
- **Exit sequences:** When a screen or section leaves, animations play in reverse order relative to entry (last element in is first element out) to create coherent spatial storytelling.

### Step 7: Define Animation Tokens

Tokens ensure consistency, reduce designer-developer translation errors, and create a shared vocabulary.

- **Duration scale:** Define a system of 4-5 duration values, not ad-hoc millisecond values per interaction:
  - `--duration-instant`: 0ms (reduced motion, programmatic state changes)
  - `--duration-fast`: 100ms (micro-feedback: button press, hover, icon swap)
  - `--duration-normal`: 200ms (state changes, toggles, field interactions)
  - `--duration-moderate`: 300ms (panel reveals, screen transitions)
  - `--duration-slow`: 400ms (complex sequences, deliberate emphasis moments)
  - Avoid values outside this scale unless specifically justified in a note.
- **Easing scale:** Define named curves:
  - `--ease-out`: cubic-bezier(0.0, 0.0, 0.2, 1) -- entering elements
  - `--ease-in`: cubic-bezier(0.4, 0.0, 1, 1) -- exiting elements
  - `--ease-in-out`: cubic-bezier(0.4, 0.0, 0.2, 1) -- within-screen state changes
  - `--ease-spring`: cubic-bezier(0.34, 1.56, 0.64, 1) -- expressive reveals, playful selections
  - `--ease-linear`: cubic-bezier(0, 0, 1, 1) -- shimmer animations, spinners only
- **Platform equivalents:** If the product ships on iOS or Android, include the native equivalent of each token:
  - `--ease-spring` iOS equivalent: `.spring(response: 0.4, dampingFraction: 0.7)`
  - `--ease-out` Android equivalent: `FastOutLinearInInterpolator`
  - `--ease-in` Android equivalent: `LinearOutSlowInInterpolator`
- **Flag every interaction that does NOT map to a token** -- these are candidates for either adding a new token or rationalizing the value to the nearest existing token.

### Step 8: Compile and Validate the Specification

Review the complete document for consistency, coverage, and accessibility before delivering.

- **Coverage check:** Every interactive element identified in Step 2 must appear in at least one table. If an element was intentionally left without animation, add it with Animation: "none" and a brief reason.
- **Consistency check:** The same component appearing in multiple contexts (e.g., a primary button on 5 different screens) must have identical micro-interaction specs. If the spec references "primary button -- see Animation Token `transition-fast`" it is acceptable to reference rather than repeat.
- **Duration sanity check:** Flag any duration above 400ms outside a deliberate sequence. Flag any micro-interaction above 250ms. Flag any screen transition below 200ms (will likely feel broken rather than fast).
- **Easing logic check:** Entering elements must use ease-out. Exiting elements must use ease-in. Elements that animate within the viewport and end in place must use ease-in-out or spring. Any deviation must have a justification note.
- **Reduced-motion completeness:** Every animation in the Screen Transitions table and Micro-Interactions table must have a corresponding row in the Reduced-Motion Alternatives table. No exceptions.
- **Handoff notes:** Add implementation notes for anything that cannot be achieved with CSS transitions alone (e.g., height:auto animation, SVG path drawing, physics-based spring animations requiring JavaScript, shared-element transitions requiring native implementation).

---

## Output Format

```
## Prototype Spec: [Flow or Feature Name]
**Version:** [1.0]  **Date:** [date]  **Platform:** [web / iOS / Android / cross-platform]

---

### Overview
| Property              | Value                                              |
|-----------------------|----------------------------------------------------|
| Screens in scope      | [list]                                             |
| Total interactions    | [count]                                            |
| Animation tone        | [Minimal / Professional / Expressive]              |
| Reduced-motion support| [Required / Optional / Not required]               |
| Handoff target        | [CSS+JS / SwiftUI / Jetpack Compose / React Native]|
| Token system          | [Existing system name, or "Defined in this spec"]  |

---

### Screen Transitions

| ID  | Trigger            | Source Screen       | Target Screen       | Animation Type | Direction     | Duration        | Easing              | Delay | Backdrop                  |
|-----|--------------------|---------------------|---------------------|----------------|---------------|-----------------|---------------------|-------|---------------------------|
| ST1 | [user action]      | [screen name]       | [screen name]       | [type]         | [direction]   | [Nms]           | [named/cubic]       | [Nms] | [opacity value or none]   |

---

### Micro-Interactions

| ID  | Component          | State/Trigger   | Property Animated        | From Value     | To Value       | Duration  | Easing          | Notes                     |
|-----|--------------------|-----------------|--------------------------|----------------|----------------|-----------|-----------------|---------------------------|
| MI1 | [component name]   | [trigger]       | [CSS property or visual] | [start value]  | [end value]    | [Nms]     | [named/cubic]   | [constraint or dependency]|

---

### Loading States

| ID  | Screen / Component | Loading Indicator  | Shimmer  | Duration / Condition          | Exit Animation         | Error State Transition     |
|-----|--------------------|--------------------|----------|-------------------------------|------------------------|----------------------------|
| LS1 | [name]             | [skeleton/spinner] | [yes/no] | [until event]                 | [fade-in content Nms]  | [fade-in error state Nms]  |

---

### Sequenced Animations (complex flows only)

| Seq | Step | Element            | Animation          | Start Condition               | Duration  | Easing     |
|-----|------|--------------------|--------------------|------------------------------ |-----------|------------|
| S1  | 1    | [element]          | [animation]        | T+0ms (sequence start)        | [Nms]     | [easing]   |
| S1  | 2    | [element]          | [animation]        | T+[N]ms (after Step 1 starts) | [Nms]     | [easing]   |

---

### Reduced-Motion Alternatives
(Required for all ST and MI entries)

| Interaction ID | Standard Animation             | Reduced-Motion Alternative    | Property Used      |
|----------------|--------------------------------|-------------------------------|--------------------|
| ST1            | [animation description]        | [instant / opacity 0→1, 1ms]  | [opacity only]     |
| MI1            | [animation description]        | [no animation / state only]   | [none]             |

---

### Animation Tokens

| Token Name          | Duration | Easing                              | iOS Equivalent                              | Android Equivalent                     | Usage                          |
|---------------------|----------|-------------------------------------|---------------------------------------------|----------------------------------------|--------------------------------|
| transition-fast     | 100ms    | cubic-bezier(0.0, 0.0, 0.2, 1)      | .easeOut (0.1s)                             | FastOutLinearInInterpolator (100ms)    | Hover, button press, icon swap |
| transition-normal   | 200ms    | cubic-bezier(0.4, 0.0, 0.2, 1)      | .easeInOut (0.2s)                           | LinearOutSlowInInterpolator (200ms)    | Toggles, field states          |
| transition-moderate | 300ms    | cubic-bezier(0.0, 0.0, 0.2, 1)      | .easeOut (0.3s)                             | LinearOutSlowInInterpolator (300ms)    | Panel reveals, modals          |
| transition-spring   | 400ms    | cubic-bezier(0.34, 1.56, 0.64, 1)   | .spring(response: 0.4, dampingFraction: 0.7)| SpringForce STIFFNESS_MEDIUM           | Expressive selections, reveals |
| transition-linear   | 1500ms   | cubic-bezier(0, 0, 1, 1)            | .linear (1.5s)                              | LinearInterpolator (1500ms)            | Shimmer, spinner rotation      |

---

### Implementation Notes

- [Note about any animation requiring JavaScript / native API rather than CSS]
- [Note about shared-element transitions, if applicable]
- [Note about GPU compositing hints (will-change, translate3d)]
- [Note about RTL (right-to-left) language support, if direction-dependent animations exist]
- [Note about any interaction that differs between platforms]
```

---

## Rules

1. **Never specify animation on layout properties.** `width`, `height`, `padding`, `margin`, and `top/left/right/bottom` trigger browser layout recalculation on every frame and will cause jank below 60fps. Animate `transform: scale()` instead of width/height. Animate `transform: translate()` instead of top/left. Animate `opacity` for show/hide. Only `transform` and `opacity` are guaranteed GPU-composited in all major browsers and native platforms.

2. **Entering elements use ease-out; exiting elements use ease-in. This is non-negotiable.** Ease-out mimics physical objects decelerating as they arrive, which the human visual system reads as intentional and controlled. Ease-in mimics objects accelerating away, which reads as being dismissed or retreating. Reversing these (ease-in for entering content) creates subconscious unease even when users cannot articulate why.

3. **Specify both the `from` and `to` values for every animation, not just the direction.** "Button fades in" is incomplete. "Button opacity: 0 to 1" is a specification. Engineers should not have to infer starting values. An element not in the DOM has no implicit starting state.

4. **Screen transition durations must be 200-400ms. Never below 200ms, never above 400ms** for navigation-level transitions. Below 200ms, the brain cannot process spatial context and the transition appears as a flash. Above 400ms, the user's mental model moves on before the animation completes, creating cognitive lag. This range applies regardless of how much content is on screen.

5. **Every animation that communicates a state change must also change a non-animated property.** Animation alone is not accessible. A selected state cannot rely solely on a color animation -- it must also change an underlying value (aria-selected="true", a class, a border, an icon). This rule prevents accessibility failures where reduced-motion users see no state change at all.

6. **Micro-interaction durations must not exceed 200ms.** Feedback interactions (button press, selection, hover) are responses to user action. The user initiated the action; they do not want to wait for the UI to catch up. Micro-interactions above 200ms create a perception of sluggishness regardless of the actual system response time.

7. **Never add animation delay to primary interaction feedback.** The first frame of feedback must appear within 16ms (one frame at 60fps) of the user's action. Delay is acceptable only for: (a) secondary elements in a stagger sequence, (b) tooltips that intentionally require sustained hover intent, (c) elements that must wait for a preceding animation to avoid visual collision. Never delay button press response, never delay navigation initiation.

8. **Define the `prefers-reduced-motion` alternative before marking any interaction as complete.** Reduced-motion support is not a post-spec cleanup task -- it is part of the interaction definition. Healthcare products, government products, and any product expecting users above age 45 in significant numbers must treat this as a hard requirement. The reduced-motion alternative is always: (a) instant state change (0ms) or (b) opacity-only fade at 1ms duration. Never substitute a "slower" version of the same animation -- the user preference is to eliminate motion, not slow it down.

9. **Avoid animating more than three properties simultaneously on a single element.** Stacking transforms is acceptable (translate + scale in a single `transform` declaration counts as one property). But animating transform + opacity + filter + background-color simultaneously on one element creates visual noise, GPU overdraw risk, and makes the interaction semantically ambiguous -- the user cannot parse what the animation is communicating.

10. **Assign an explicit interaction ID to every defined animation before delivery.** IDs must be stable (never renumber), prefixed by category (ST for screen transition, MI for micro-interaction, LS for loading state, SQ for sequence). Engineers must be able to file a bug report referencing "MI7 does not match spec" -- this is impossible without stable IDs. A spec without IDs is a draft, not a handoff document.

---

## Edge Cases

### Gesture-Driven Navigation With Interruption States

Swipe gestures (iOS back swipe, Android predictive back, bottom-sheet drag-to-dismiss) create partially-completed animation states that must be documented separately from tap-triggered transitions.

Define the **gesture thresholds** explicitly: minimum swipe distance (50px for incidental-touch rejection), velocity threshold for fling-to-complete (300px/s minimum), and the cancellation snap-back. If the user swipes 40% across and lifts their finger without reaching the threshold or sufficient velocity, the screen must animate back to origin: 200ms ease-out, same axis as the gesture direction. If the user exceeds threshold or velocity, the screen completes the transition: 200ms ease-out from current position (not from start, so duration feels proportional to remaining distance). For swipe gestures, specify all three states: in-progress (1:1 with finger, no easing), complete (from release position to target, 200ms ease-out), and cancelled (from release position back to origin, 200ms ease-out).

### Height Animation on Dynamic Content

Animating from `height: 0` to `height: auto` (accordions, expandable sections, dynamic content) cannot be done with CSS transitions alone because `auto` is not a calculable interpolation value.

Document one of three acceptable approaches and note which is expected:
- **max-height trick:** `max-height: 0` to `max-height: [generous estimate]px` -- works but creates timing distortion when actual content is much shorter than max-height. Acceptable for content under 300px.
- **Web Animations API:** `element.animate([{height: '0px'}, {height: element.scrollHeight + 'px'}])` -- accurate but requires JavaScript. Specify that this is the expected implementation.
- **CSS Grid trick:** Parent has `display: grid; grid-template-rows: 0fr` animating to `grid-template-rows: 1fr` -- pure CSS, accurate, works in modern browsers (Chrome 107+, Safari 16+). Specify browser support requirement to determine if this is viable.

### Cross-Platform Motion Convention Conflicts

When a product ships on both iOS and Android (or web and mobile), native motion conventions differ in ways that create design conflicts.

iOS navigation default: right-to-left push for forward navigation, left-to-right reveal on back. Android navigation (Material You): upward vertical push for all navigation, predictive back shows destination screen behind source at reduced scale. If the spec demands consistent behavior across platforms, document the compromise explicitly (usually: match the more conservative platform's conventions) and note that this deviates from native expectations on one platform. If the spec demands platform-native behavior, produce separate ST tables for iOS and Android. Never silently apply iOS conventions to an Android spec -- engineers will produce incorrect animations.

### Celebration and Confirmation Animations

High-stakes completion moments (successful purchase, goal achieved, onboarding complete) often require multi-element celebration animations (confetti, checkmark draw, trophy reveal) that go beyond standard interaction patterns.

These must be documented as full sequences with a timeline (see Step 6 format). Key rules: (a) the primary success indicator (checkmark, success icon) must appear within the first 300ms regardless of how long the full celebration lasts; (b) celebration animations must have a defined end state -- the UI must settle into a readable state within 2000ms total; (c) the celebration must be skippable (tap to skip on mobile, or automatically resolves); (d) reduced-motion alternative is a single-frame success state with no animation whatsoever, never a "quieter celebration."

### Right-to-Left (RTL) Language Support

Any product supporting Arabic, Hebrew, Persian, or Urdu requires mirrored directional animations.

Horizontal slide transitions reverse direction: what is normally a right-to-left push in LTR becomes a left-to-right push in RTL because the spatial model is mirrored. Document the RTL variant for every direction-dependent animation in the ST table. Animations that are not directional (fade, scale, vertical slide) do not change. Shimmer animations should reverse direction (right-to-left shimmer in RTL). Specify whether this is handled via CSS `direction` and `logical properties` (which handle mirroring automatically in modern implementations) or requires explicit RTL class variants.

### Scroll-Linked Animation Performance

Scroll-triggered animations (parallax, scroll-driven reveals, sticky header compression) can cause serious performance degradation if implemented naively because scroll events fire on the main thread.

Flag any scroll-linked animation in the spec with a performance note: specify that implementation must use either (a) CSS `@scroll-timeline` / `animation-timeline: scroll()` (pure CSS, compositor thread, no jank -- Chrome 115+, Safari 17.2+), (b) `IntersectionObserver` for enter-viewport reveals (fires on compositor thread, accurate), or (c) JavaScript scroll listener with `requestAnimationFrame` throttling for more complex effects. Never use a raw `scroll` event listener without throttling -- this is the single most common cause of janky scroll animations in production web apps. Note the browser support matrix if the CSS approach is used.

### Animation Conflicts With Keyboard and Focus Management

Animated state changes can break keyboard navigation if focus management is not coordinated with animation timing.

When a modal, drawer, or panel opens with a 300ms reveal animation, focus must be moved to the first focusable element inside the new panel. If focus moves at animation start (T+0ms), the focus ring appears on an element inside a panel that is not yet visible, which is disorienting. If focus moves after animation completes (T+300ms), keyboard users experience a 300ms gap where the Tab key focus location is ambiguous. The correct approach: move focus at T+0ms but apply `opacity: 0` to the focus ring using a CSS class that is removed at T+300ms. Alternatively, use `aria-busy="true"` on the container during animation and move focus on `transitionend`. Document whichever approach is expected so engineers and accessibility reviewers have a shared contract.

---

## Example

**Input:** "Specify the prototype interactions for a web dashboard onboarding flow. New users see an empty state screen, then a 3-step setup wizard (steps: connect data source, configure settings, invite team). After completing step 3, they land on the populated dashboard. The product is professional tone, desktop web only, reduced-motion support required."

---

## Prototype Spec: Dashboard Onboarding Flow
**Version:** 1.0  **Platform:** Web (desktop)  **Tone:** Professional

---

### Overview

| Property              | Value                                                    |
|-----------------------|----------------------------------------------------------|
| Screens in scope      | Empty State, Wizard Step 1, Step 2, Step 3, Dashboard    |
| Total interactions    | 18 (4 screen transitions, 11 micro-interactions, 3 loading states) |
| Animation tone        | Professional -- smooth, purposeful, no spring overshoot  |
| Reduced-motion support| Required                                                 |
| Handoff target        | CSS + JavaScript (React)                                 |
| Token system          | Defined in this spec (no existing system)                |

---

### Screen Transitions

| ID  | Trigger                  | Source Screen   | Target Screen   | Animation Type     | Direction     | Duration | Easing                          | Delay | Backdrop        |
|-----|--------------------------|-----------------|-----------------|--------------------|---------------|----------|---------------------------------|-------|-----------------|
| ST1 | Click "Get Started"      | Empty State     | Wizard Step 1   | Fade + Scale-up    | Center-out    | 300ms    | cubic-bezier(0.0, 0.0, 0.2, 1)  | 0ms   | None            |
| ST2 | Click "Next" (Steps 1→2) | Wizard Step 1   | Wizard Step 2   | Slide (content only)| Right-to-left | 250ms    | cubic-bezier(0.4, 0.0, 0.2, 1)  | 0ms   | None            |
| ST3 | Click "Next" (Steps 2→3) | Wizard Step 2   | Wizard Step 3   | Slide (content only)| Right-to-left | 250ms    | cubic-bezier(0.4, 0.0, 0.2, 1)  | 0ms   | None            |
| ST4 | Click "Back" (any step)  | Wizard Step N   | Wizard Step N-1 | Slide (content only)| Left-to-right | 250ms    | cubic-bezier(0.4, 0.0, 0.2, 1)  | 0ms   | None            |
| ST5 | Click "Finish" (Step 3)  | Wizard Step 3   | Dashboard       | Cross-fade         | N/A           | 400ms    | cubic-bezier(0.0, 0.0, 0.2, 1)  | 0ms   | None            |

**ST1 note:** Only the wizard modal/card animates. The background empty state does not animate. Wizard card: opacity 0→1 + transform scale(0.97)→scale(1.0).

**ST2/ST3/ST4 note:** The wizard chrome (step indicator, header, footer buttons) does not animate -- only the inner content panel slides. This avoids the step indicator animating repeatedly during progression. Outgoing content panel: opacity 1→0 + translateX(0→-40px), duration 150ms, ease-in. Incoming content panel: opacity 0→1 + translateX(40px→0), duration 250ms, ease-out, starts at T+100ms (after outgoing begins, 50ms overlap).

**ST5 note:** Total cross-fade. Wizard fades out (opacity 1→0, 200ms ease-in), dashboard fades in (opacity 0→1, 300ms ease-out, begins at T+100ms).

---

### Micro-Interactions

| ID   | Component            | State / Trigger       | Property Animated          | From Value         | To Value           | Duration | Easing                          | Notes                                    |
|------|----------------------|-----------------------|----------------------------|--------------------|--------------------|---------|---------------------------------|------------------------------------------|
| MI1  | "Get Started" button | Hover                 | background-color           | #1A56DB            | #1E429F            | 150ms   | cubic-bezier(0.0, 0.0, 0.2, 1)  | Also transition box-shadow: add 0 4px 12px rgba(0,0,0,0.15) |
| MI2  | "Get Started" button | Mouse-down / press    | transform: scale           | 1.0                | 0.97               | 80ms    | cubic-bezier(0.4, 0.0, 1, 1)    | Release: scale 0.97→1.0, 120ms ease-out  |
| MI3  | Step indicator dots  | Step advance          | background-color + scale   | inactive (#D1D5DB) → active (#1A56DB) | N/A | 200ms | cubic-bezier(0.4, 0.0, 0.2, 1) | Active dot scale: 1.0→1.2→1.0 over 200ms; completed dots show checkmark, 150ms fade-in |
| MI4  | "Next" / "Back" btns | Hover                 | background-color           | transparent        | #F3F4F6            | 150ms   | cubic-bezier(0.0, 0.0, 0.2, 1)  | Border-color: #D1D5DB→#9CA3AF simultaneously |
| MI5  | "Next" / "Back" btns | Press                 | transform: scale           | 1.0                | 0.97               | 80ms    | cubic-bezier(0.4, 0.0, 1, 1)    | Release: 120ms ease-out                  |
| MI6  | "Next" btn           | Disabled state        | opacity                    | 1.0                | 0.4                | 200ms   | cubic-bezier(0.4, 0.0, 0.2, 1)  | Disabled when required fields in step are empty; no transition needed on programmatic disable, only on re-enable |
| MI7  | Text input fields    | Focus                 | border-color               | #D1D5DB            | #1A56DB            | 150ms   | cubic-bezier(0.0, 0.0, 0.2, 1)  | border-width: 1px→2px simultaneously     |
| MI8  | Text input fields    | Validation error      | transform: translateX      | 0px                | -8px, 8px, -6px, 6px, 0px (shake) | 400ms | linear (oscillation) | Shake triggers on click "Next" with empty required field; error text below field fades in: opacity 0→1, 200ms ease-out, T+0ms |
| MI9  | Checkbox (settings)  | Check / uncheck       | opacity (checkmark SVG)    | 0                  | 1                  | 150ms   | cubic-bezier(0.0, 0.0, 0.2, 1)  | Background fill: 200ms ease-out simultaneously |
| MI10 | "Finish" button      | Loading (API call)    | content swap               | "Finish" text      | Spinner            | 150ms   | cubic-bezier(0.0, 0.0, 0.2, 1)  | Button width locked at current width to prevent collapse; spinner replaces text via cross-fade |
| MI11 | Progress bar (wizard)| Step advance          | width                      | 33%                | 66% or 100%        | 300ms   | cubic-bezier(0.4, 0.0, 0.2, 1)  | Animates simultaneously with ST2/ST3     |

---

### Loading States

| ID  | Screen / Component       | Loading Indicator    | Shimmer | Duration / Condition              | Exit Animation               | Error State Transition               |
|-----|--------------------------|----------------------|---------|-----------------------------------|------------------------------|--------------------------------------|
| LS1 | Step 1: Data source list | Skeleton rows (5)    | Yes     | Until data source API responds    | Skeleton fades out 150ms ease-in; rows fade in staggered 50ms each, 200ms ease-out | Skeleton out 150ms; error message fades in 200ms ease-out |
| LS2 | Step 3: Team invite      | Spinner (inline btn) | No      | Until invitation API confirms     | Spinner cross-fades to "Invited ✓" text, 200ms ease-out | Spinner out 150ms; inline error text fades in 200ms |
| LS3 | Dashboard initial load   | Full skeleton layout | Yes     | Until dashboard data API responds | Column-by-column fade-in: left column T+0ms, center T+100ms, right T+200ms; each 300ms ease-out | Full error state fades in 300ms, no skeleton |

**LS1 shimmer spec:** background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%); background-size: 200% 100%; animation: shimmer 1.5s linear infinite. Sweep direction: left-to-right.

---

### Sequenced Animations

**Sequence S1: Dashboard Entrance (fires after ST5 cross-fade completes)**

| Seq | Step | Element                  | Animation                         | Start Condition               | Duration | Easing                          |
|-----|------|--------------------------|-----------------------------------|-------------------------------|----------|---------------------------------|
| S1  | 1    | Page header / nav bar    | opacity 0→1 + translateY(-8px→0)  | T+0ms (dashboard visible)     | 300ms    | cubic-bezier(0.0, 0.0, 0.2, 1)  |
| S1  | 2    | Left sidebar             | opacity 0→1 + translateX(-8px→0)  | T+50ms                        | 300ms    | cubic-bezier(0.0, 0.0, 0.2, 1)  |
| S1  | 3    | Main content area        | opacity 0→1                       | T+100ms                       | 300ms    | cubic-bezier(0.0, 0.0, 0.2, 1)  |
| S1  | 4    | Stat cards (3 cards)     | opacity 0→1 + translateY(8px→0), stagger 75ms each | T+150ms | 250ms | cubic-bezier(0.0, 0.0, 0.2, 1) |
| S1  | 5    | "Setup complete" toast   | opacity 0→1 + translateY(8px→0)   | T+400ms (after cards begin)   | 250ms    | cubic-bezier(0.0, 0.0, 0.2, 1)  |

**S1 total sequence duration:** ~650ms (T+400ms start of toast + 250ms toast animation). Toast auto-dismisses after 4000ms with opacity 1→0, 200ms ease-in.

---

### Reduced-Motion Alternatives

| Interaction ID | Standard Animation                              | Reduced-Motion Alternative           | Property Used       |
|----------------|-------------------------------------------------|--------------------------------------|---------------------|
| ST1            | Fade + scale-up 300ms                           | Instant appear (opacity 0→1, 1ms)    | opacity only        |
| ST2            | Slide right-to-left 250ms with overlap          | Cross-fade 1ms (instant swap)        | opacity only        |
| ST3            | Slide right-to-left 250ms                       | Cross-fade 1ms                       | opacity only        |
| ST4            | Slide left-to-right 250ms                       | Cross-fade 1ms                       | opacity only        |
| ST5            | Cross-fade 400ms                                | Instant swap (1ms opacity)           | opacity only        |
| MI1            | Background-color 150ms                          | No transition (instant color change) | none                |
| MI2            | Scale press 80ms                                | No scale (remove entirely)           | none                |
| MI3            | Dot scale + color 200ms                         | Instant color change, no scale       | none                |
| MI8            | Shake translateX 400ms                          | No shake; error text appears instant | opacity only (error)|
| MI10           | Cross-fade to spinner 150ms                     | Instant swap to spinner              | none                |
| MI11           | Progress bar width 300ms                        | Instant width update                 | none                |
| LS1/LS2/LS3    | Shimmer 1.5s infinite                           | Static gray skeleton (no shimmer)    | none                |
| S1 (all steps) | Staggered entrance sequence                     | All elements appear at T+0ms, opacity 0→1, 1ms | opacity only |

---

### Animation Tokens

| Token Name           | Duration | Easing                              | iOS Equivalent                                   | React Equivalent (CSS var)       | Usage                                   |
|----------------------|----------|-------------------------------------|--------------------------------------------------|----------------------------------|-----------------------------------------|
| `--duration-fast`    | 100ms    | --                                  | --                                               | --                               | Duration only; pair with easing token   |
| `--duration-normal`  | 200ms    | --                                  | --                                               | --                               | Duration only                           |
| `--duration-moderate`| 300ms    | --                                  | --                                               | --                               | Duration only                           |
| `--duration-slow`    | 400ms    | --                                  | --                                               | --                               | Duration only; screen transitions max   |
| `--ease-decelerate`  | --       | cubic-bezier(0.0, 0.0, 0.2, 1)      | .easeOut                                         | --ease-decelerate                | Entering elements                       |
| `--ease-accelerate`  | --       | cubic-bezier(0.4, 0.0, 1, 1)        | .easeIn                                          | --ease-accelerate                | Exiting elements                        |
| `--ease-standard`    | --       | cubic-bezier(0.4, 0.0, 0.2, 1)      | .easeInOut                                       | --ease-standard                  | Within-view state changes               |
| `--ease-linear`      | --       | cubic-bezier(0, 0, 1, 1)            | .linear                                          | --ease-linear                    | Shimmer, spinner only                   |

**Composed tokens (duration + easing):**

| Token Name                | Value                                              | Usage                         |
|---------------------------|----------------------------------------------------|-------------------------------|
| `transition-micro`        | 100ms cubic-bezier(0.0, 0.0, 0.2, 1)              | Button hover                  |
| `transition-press`        | 80ms cubic-bezier(0.
