---
name: design-system-foundations
description: |
  Produces a foundational design system specification with spacing scale, type scale, color token structure, border radius, and shadow variables as a tool-agnostic token system.
  Use when the user asks to create a design system, define design tokens, establish a visual language, or set up consistent spacing and typography rules.
  Do NOT use for full brand identity (use brand-identity-brief), color palette creation (use color-palette-design), or typography pairing decisions (use typography-system).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design template planning"
  category: "design-creative"
  subcategory: "ui-ux-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Design System Foundations

## When to Use

**Use this skill when:**
- The user asks to create a design system, define design tokens, or establish a visual language for a product
- The user wants consistent spacing, typography, color, and depth rules before building UI components
- The user needs to establish foundational atomic variables that multiple developers and designers will reference
- The user is standardizing an existing inconsistent codebase and needs a canonical token reference
- The user is building a multi-product suite and needs a shared structural layer with brand-overridable variables
- The user wants to produce a token file (JSON, CSS custom properties, SCSS variables, or a Figma token set) from a specification
- The user asks how to enforce visual consistency across multiple screens, platforms, or teams

**Do NOT use when:**
- The user wants full brand identity including positioning, voice, and messaging (use `brand-identity-brief`)
- The user wants a standalone color palette with tints, shades, and color theory (use `color-palette-design`)
- The user wants detailed font pairing decisions, typeface selection rationale, or editorial typography (use `typography-system`)
- The user wants to spec individual UI components like buttons, modals, or nav bars (use `component-design-spec`)
- The user wants UX patterns or interaction flows rather than visual tokens (use `ux-pattern-library`)
- The user wants to audit an existing design system for accessibility gaps (use `accessibility-audit`)

---

## Process

### Step 1 -- Gather Context and Constraints

Ask these specific questions before producing any output. Do not skip this step for complex systems.

- **Product type:** Web application, native mobile (iOS/Android), hybrid (React Native/Flutter), marketing site, or cross-platform design system serving all surfaces
- **Density preference:** Compact and data-heavy (dashboards, data tables, admin tools), open and spacious (consumer apps, marketing), or balanced (general productivity)
- **Existing constraints:** Is a brand color already specified? Is a typeface family locked? Is there a parent design system to extend (e.g., augmenting Material, extending a white-label system)?
- **Accessibility target:** WCAG 2.1 AA (4.5:1 contrast ratio for normal text, 3:1 for large text) or WCAG 2.1 AAA (7:1 for normal text, 4.5:1 for large text)
- **Theme requirement:** Single theme, light/dark modes, or multi-brand (each brand gets its own color and type overrides while sharing structural tokens)
- **Scale:** Small project (1-2 designers, one product, under 30 screens) or enterprise system (multiple product teams, 100+ screens, design-dev handoff via tokens)
- **Output format preference:** CSS custom properties, SCSS variables, JSON (Style Dictionary compatible), or human-readable spec only

Density has cascading effects on spacing, type scale, and radius choices. Resolve it first.

---

### Step 2 -- Define the Spacing Scale

The spacing scale is the single most used primitive in any design system. Every decision here affects component density, readability, and layout rhythm.

- **Base unit:** Use 8px unless the user specifies otherwise. 8px aligns to the browser default, maps cleanly to common screen resolutions, and divides evenly into most grid systems (12-column at 1440px wide = 120px columns with 8px gutters).
- **4px sub-unit:** Always include 4px as the minimum functional spacing token. Use it for icon gaps, badge padding, and tight inline elements. Do not go below 4px for interactive elements -- anything smaller is not reliably tappable.
- **2px micro-unit:** Include a 2px token (`space-xs`) for pixel-level optical corrections only (e.g., vertically centering an icon inside a button). Flag it explicitly as a micro-correction token, not a layout token.
- **Geometric vs. linear progression:** For dense UIs, use a linear 4px step progression for the lower half of the scale (0, 4, 8, 12, 16, 20, 24) and an 8px step for the upper half. For spacious UIs, use an 8px step throughout and a doubling pattern at the top (32, 48, 64, 96). Do not mix geometric and linear unpredictably.
- **Token naming:** Use t-shirt sizes for developer ergonomics: `space-xs` through `space-4xl`. Avoid numeric naming like `space-1`, `space-2` -- it creates ambiguity about whether the number represents the pixel value or the step index.
- **Compact adjustment:** For data-heavy UIs, compress the upper scale. Replace the standard `space-lg: 16px` with `space-lg: 12px` and `space-xl: 24px` with `space-xl: 16px`. Announce this deviation explicitly in the spec.
- **Usage rules by tier:**
  - Component internal padding (button padding, input padding): `space-sm` (4px) to `space-lg` (16px)
  - Spacing between sibling elements within a component (icon-to-label gap, label-to-input gap): `space-xs` (2px) to `space-md` (8px)
  - Spacing between components within a group (form fields, card items): `space-md` (8px) to `space-lg` (16px)
  - Spacing between groups or sections: `space-xl` (24px) to `space-3xl` (48px)
  - Page margins and major layout gutters: `space-2xl` (32px) to `space-4xl` (64px)

---

### Step 3 -- Define the Type Scale

Typography is the most impactful visual element in data-heavy products and the hardest to tune retroactively once implemented.

- **Base size selection:**
  - Standard: 16px (browser default, WCAG recommended minimum for body text)
  - Compact: 14px (acceptable for data-dense tools where screen real estate is critical; must meet WCAG AA 4.5:1 at this size against background)
  - Never use 13px or smaller as a body base. Caption text can go to 11px only when paired with medium (500) weight to compensate for reduced stroke width.
- **Modular scale ratios and when to use each:**
  - 1.125 (Major Second): Compact, professional, low contrast between levels. Use for data dashboards where heading levels should feel similar in weight.
  - 1.200 (Minor Third): Balanced, versatile, good for SaaS products. Most recommended default.
  - 1.250 (Major Third): Clear hierarchy, readable at a glance. Use for consumer apps and marketing-adjacent products.
  - 1.333 (Perfect Fourth): Dramatic size jumps, strong editorial hierarchy. Use for marketing sites and landing pages, not application UIs.
  - 1.414 (Augmented Fourth) and above: Reserved for pure editorial/publishing contexts. Too dramatic for app UIs.
- **Scale generation formula:** Each step = floor(base × ratio^n), where n is the step number from the base. Round to the nearest whole pixel. Never use fractional pixel font sizes -- subpixel rendering is inconsistent across OS and browser combinations.
- **Required type roles and their behavior:**
  - `display`: Hero text, marketing headers. Sizes: 48-72px. Use sparingly. Only appropriate on landing pages or empty states.
  - `h1`: Page-level titles, modal headers. Sizes: 28-48px. Line-height: 1.1-1.2. Letter-spacing: -0.01em to -0.02em (tight tracking improves legibility at large sizes).
  - `h2`: Section titles. Sizes: 22-36px. Line-height: 1.2-1.3.
  - `h3`: Subsection, card titles, panel headers. Sizes: 18-28px.
  - `h4`: Label headers, table group headers, sidebar headings. Sizes: 16-22px.
  - `body`: Default reading text. Always 14-16px. Line-height: 1.5-1.6. This is the most read text -- never compromise on size or weight here.
  - `small`: Supporting text, helper text, secondary labels. 12-14px. Line-height: 1.4.
  - `caption`: Timestamps, metadata, footnotes. 11-12px. Minimum weight: 500 if below 13px.
- **Font-weight assignments:**
  - Display, h1: 700 (Bold). Creates clear visual anchor.
  - h2, h3: 600 (Semibold). Strong without competing with h1.
  - h4: 600 or 500. Depends on surrounding density.
  - Body: 400 (Regular). Reading text must never be weighted up unnecessarily.
  - Small, caption: 400 or 500. Use 500 when size drops below 13px.
- **Line-height rules:**
  - Large text (>24px): 1.1-1.3. Tight leading improves perceived elegance and reduces visual gaps between lines of large text.
  - Medium text (18-24px): 1.3-1.4.
  - Body text (14-18px): 1.5-1.6. This range is the readability sweet spot validated by the Baymard Institute and WCAG guidelines.
  - Small and caption: 1.4. Slightly tighter than body, slightly looser than headings.
- **Letter-spacing:**
  - Headings (h1, display): -0.01em to -0.02em. Negative tracking tightens large type visually.
  - Body: 0 or 0.01em. Never negatively track body text.
  - All-caps labels: 0.05em to 0.1em. Positive tracking is mandatory for all-caps text to maintain legibility.
  - Captions: 0.01em to 0.02em. Slight opening improves legibility at small sizes.

---

### Step 4 -- Define the Color Token Architecture

A three-tier architecture separates raw values from meaning and prevents the most common design system failure: hardcoded hex values scattered through codebases.

**Tier 1 -- Primitive Tokens (raw values):**
- These are numeric values with no semantic meaning. They are the palette, not the design language.
- Naming format: `[color-name]-[step]` where step follows a 50/100/200/.../900 scale or a 1-12 numeric scale.
- Examples: `blue-500: #3B82F6`, `red-400: #F87171`, `green-600: #16A34A`
- Primitive tokens should NEVER appear in component code. They exist only to be referenced by Tier 2.
- Generate at least 10 steps for each hue used in the primary and secondary brand colors. The full scale enables hover, active, and disabled state derivation.

**Tier 2 -- Semantic Tokens (purpose aliases):**
- These assign meaning to primitives. Semantic tokens are what developers use in component code.
- Examples: `color-primary: {blue-500}`, `color-error: {red-600}`, `color-surface: {neutral-50}`
- Required semantic groups and their minimum variants:
  - `color-primary`: base, hover (darker by one step), active (darker by two steps), disabled (lighter by two steps, opacity 0.4)
  - `color-secondary`: base, hover, active, disabled
  - `color-neutral`: maps to full 10-step neutral primitive scale
  - `color-success`: base, hover, surface (very light tint for backgrounds), text (dark enough for contrast on white)
  - `color-warning`: base, hover, surface, text
  - `color-error`: base, hover, surface, text
  - `color-info`: base, hover, surface, text
- Surface and background tokens are part of semantic colors: `color-surface` (page bg), `color-surface-raised` (card bg), `color-surface-overlay` (modal bg).
- Border tokens: `color-border` (default), `color-border-strong` (emphasis dividers), `color-border-focus` (focus rings, must achieve 3:1 against adjacent colors per WCAG 2.4.11).
- Text tokens: `color-text-primary`, `color-text-secondary`, `color-text-disabled`, `color-text-inverse` (light text on dark backgrounds).

**Tier 3 -- Component Tokens (optional for large systems):**
- Map semantic tokens to specific components. Only introduce this tier for enterprise systems with multiple teams.
- Examples: `button-bg-primary: {color-primary}`, `input-border-default: {color-border}`, `badge-success-bg: {color-success-surface}`
- Component tokens enable swapping the semantic mapping for one component without affecting others.

**Neutral scale construction:**
- The neutral scale must cover the full range from near-white to near-black across 10 evenly distributed perceptual steps.
- Choose a hue-tinted neutral (cool gray uses a blue undertone at ~220deg hue, warm gray uses a brown undertone at ~30deg) or a pure gray (0 saturation).
- Cool gray (slate family) works best with blue primaries. Warm gray works with earthy or orange primaries. Pure gray is versatile but can feel sterile.
- Verify that neutral-600 on neutral-50 background achieves WCAG AA (4.5:1). Verify neutral-900 on neutral-50 achieves AAA (7:1). These are the two most common text-on-background combinations.

---

### Step 5 -- Define Border Radius Tokens

Border radius defines the visual personality of a system more than almost any other token. A few pixels difference creates an entirely different product character.

- **Sharp (0-2px):** Professional, technical, no-nonsense. Appropriate for developer tools, data tables, financial dashboards.
- **Subtle (2-4px):** Balanced, enterprise-appropriate. Good for B2B SaaS where sharp feels too cold and rounded feels too casual.
- **Rounded (6-12px):** Modern, friendly, approachable. Appropriate for consumer apps, productivity tools, HR software.
- **Pill/bubbly (16px+):** Casual, playful. Appropriate for consumer apps with younger demographics, chat interfaces.

**Scale structure:**
- `radius-none` (0px): Tables, code blocks, inline elements that must align flush
- `radius-sm` (2-3px): Badges, tags, small chips, tooltip arrows
- `radius-md` (4-6px): Buttons, inputs, selects, checkboxes (the most used token)
- `radius-lg` (6-10px): Cards, panels, dropdown menus
- `radius-xl` (10-16px): Modals, drawers, feature cards
- `radius-2xl` (16-24px): Marketing cards, feature highlights (consumer products)
- `radius-full` (9999px): Avatars, toggle pills, circular icon buttons, progress indicators

**Internal consistency rule:** All tokens in a system should use a single visual personality. Do not mix sharp tables with heavily rounded modals. The delta between the sharpest and most rounded tokens should be proportional to the intended personality. A professional tool might span from 0 to 8px. A consumer app might span from 4px to 24px.

---

### Step 6 -- Define Elevation (Shadow) Tokens

Shadows communicate z-axis hierarchy. Each level should represent a meaningful increase in elevation, not arbitrary aesthetic decoration.

- **Design philosophy:** Shadows should be invisible until they're needed. A card in a list should cast the minimal shadow that distinguishes it from the page background. A modal floating above all content should cast a clearly deeper shadow.
- **Shadow anatomy:** Every shadow value contains: `x-offset y-offset blur spread color/opacity`. For a realistic elevation effect, use multiple layered shadows: one tight shadow for depth definition and one diffuse shadow for ambient light.
- **Color of shadows:** Never use pure black (`rgba(0,0,0,X)`). Use the darkest neutral value from your palette converted to RGB (e.g., if neutral-900 is `#0F172A`, use `rgba(15,23,42,X)`). This makes shadows feel like they belong to the product, not like generic CSS.
- **Opacity ranges:** `shadow-sm`: 0.04-0.06. `shadow-md`: 0.07-0.10. `shadow-lg`: 0.10-0.15. `shadow-xl`: 0.15-0.25. Exceeding these ranges creates a dark, heavy aesthetic that is hard to pair with light themes.
- **Two-shadow technique for realism:**
  - `shadow-md` example: `0 1px 3px rgba(15,23,42,0.10), 0 1px 2px rgba(15,23,42,0.06)` -- the first value is the primary shadow, the second adds depth definition.
  - `shadow-lg` example: `0 10px 15px rgba(15,23,42,0.10), 0 4px 6px rgba(15,23,42,0.08)`
- **Semantic shadow names vs. scale names:** For large systems, add semantic aliases: `shadow-card: {shadow-sm}`, `shadow-dropdown: {shadow-md}`, `shadow-modal: {shadow-lg}`. This prevents future decisions from requiring updates to every component.
- **Dark mode shadows:** Standard shadows disappear on dark backgrounds. For dark mode, use lighter inner-glow borders (`box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08)`) or replace shadow-sm with a subtle border token entirely.

---

### Step 7 -- Define Transition and Motion Tokens

Motion tokens define how the interface feels in motion, not just at rest. They have a direct impact on perceived performance and polish.

- **Duration scale:**
  - `duration-instant` (0ms): For state changes that need to feel immediate (checkbox toggle, radio selection). Only use when animation would distract.
  - `duration-fast` (80-100ms): Hover states, focus rings, button active states. Imperceptibly fast -- creates responsiveness without distraction.
  - `duration-normal` (150-200ms): Toggles, dropdowns opening, tabs switching. The workhorse duration.
  - `duration-slow` (250-350ms): Modals, drawers, panels expanding/collapsing. Long enough to feel intentional.
  - `duration-slower` (400-600ms): Page transitions, skeleton loading animations, onboarding reveals. Reserve for macro-level transitions.
- **Easing functions:**
  - `ease-default` (`cubic-bezier(0.4, 0, 0.2, 1)`): Material Design's standard curve. Works for most UI transitions. Starts slightly fast, settles smoothly.
  - `ease-in` (`cubic-bezier(0.4, 0, 1, 1)`): For elements leaving the screen. Accelerates out.
  - `ease-out` (`cubic-bezier(0, 0, 0.2, 1)`): For elements entering the screen. Decelerates into position. This is the most natural-feeling entrance.
  - `ease-spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`): Slight overshoot, spring-back. Use sparingly for delight moments (success confirmations, onboarding).
  - `ease-linear` (`linear`): For looped animations (spinners, progress bars) and opacity crossfades only. Never use for positional transitions.
- **Accessibility rule:** All transitions must respect `prefers-reduced-motion`. The standard pattern is to declare `@media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms; } }` at the CSS system level. Document this in the spec.
- **Mobile adjustment:** Reduce `duration-slow` to 200ms and `duration-slower` to 350ms for mobile. Mobile users perceive slower animations as laggy even when they are technically the same duration as desktop.

---

### Step 8 -- Compile and Structure the Specification

- **Format output as a complete token specification** with tables for every token category. Every token row must include: token name, resolved value, and a usage description.
- **Include a Usage Guidelines section** that maps design patterns (card layout, form fields, navigation, data tables) to the specific tokens they consume. This bridges the gap between the raw token list and practical implementation.
- **Include a Theming section** if dark mode or multi-brand was requested. Show the semantic token layer explicitly, with light-mode and dark-mode resolved values side by side.
- **Note deviations from convention explicitly.** If the compact spacing scale diverges from the 8px standard, flag it. If the body size is 14px instead of 16px, call it out and explain the trade-off.
- **Provide a JSON export block** only if the user requested a specific output format. Style Dictionary-compatible JSON uses a `value` key within each token object.

---

## Output Format

```
## Design System: [Product Name] Foundations
**Density:** [Compact / Balanced / Spacious]
**WCAG Target:** [AA / AAA]
**Themes:** [Light only / Light + Dark / Multi-brand]

---

### Spacing Scale (base: [X]px)
| Token         | Value  | Usage                                           |
|---------------|--------|-------------------------------------------------|
| space-none    | 0px    | No spacing (explicit reset)                     |
| space-xs      | 2px    | Micro-corrections, optical centering only       |
| space-sm      | 4px    | Icon gaps, badge padding, tight inline spacing  |
| space-md      | 8px    | Default component padding, element gaps         |
| space-lg      | [X]px  | Card padding, form field spacing                |
| space-xl      | [X]px  | Section padding, panel internal spacing         |
| space-2xl     | [X]px  | Section margins, between-group spacing          |
| space-3xl     | [X]px  | Major section separation                        |
| space-4xl     | [X]px  | Page margins, hero-level vertical rhythm        |

---

### Type Scale (base: [X]px, ratio: [X] [name])
| Role     | Size   | Weight | Line Height | Letter Spacing | Usage                          |
|----------|--------|--------|-------------|----------------|--------------------------------|
| display  | [X]px  | 700    | 1.1         | -0.02em        | Hero, marketing headers        |
| h1       | [X]px  | 700    | 1.2         | -0.01em        | Page titles, modal headers     |
| h2       | [X]px  | 600    | 1.25        | 0              | Section titles                 |
| h3       | [X]px  | 600    | 1.3         | 0              | Card titles, panel headers     |
| h4       | [X]px  | 600    | 1.35        | 0              | Sub-labels, table headers      |
| body     | [X]px  | 400    | 1.5         | 0              | Default reading text           |
| small    | [X]px  | 400    | 1.4         | 0.01em         | Helper text, secondary labels  |
| caption  | [X]px  | 500    | 1.4         | 0.02em         | Timestamps, metadata           |

**Type deviations noted:** [Any non-standard choices explained here]

---

### Color Tokens

#### Primitive Colors
| Token        | Value   | Notes                          |
|--------------|---------|--------------------------------|
| [hue]-50     | [hex]   | Lightest tint                  |
| [hue]-100    | [hex]   | Surface tint                   |
| [hue]-200    | [hex]   | Subtle background              |
| [hue]-300    | [hex]   | Disabled states                |
| [hue]-400    | [hex]   | Placeholder, muted elements    |
| [hue]-500    | [hex]   | Primary/mid value              |
| [hue]-600    | [hex]   | Hover state                    |
| [hue]-700    | [hex]   | Active state                   |
| [hue]-800    | [hex]   | Text on light bg               |
| [hue]-900    | [hex]   | Maximum contrast               |

#### Semantic Colors
| Token                  | Resolves To      | Usage                              |
|------------------------|------------------|------------------------------------|
| color-primary          | [hue]-[step]     | Primary actions, CTAs, links       |
| color-primary-hover    | [hue]-[step+1]   | Hover state on primary             |
| color-primary-active   | [hue]-[step+2]   | Pressed/active state               |
| color-primary-disabled | [hue]-[step-2]   | Disabled primary, 40% opacity      |
| color-secondary        | [hue]-[step]     | Secondary actions                  |
| color-success          | green-[step]     | Positive states, confirmations     |
| color-success-surface  | green-50         | Success alert backgrounds          |
| color-warning          | amber-[step]     | Cautionary states                  |
| color-warning-surface  | amber-50         | Warning alert backgrounds          |
| color-error            | red-[step]       | Errors, destructive actions        |
| color-error-surface    | red-50           | Error alert backgrounds            |
| color-info             | cyan-[step]      | Informational, neutral alerts      |
| color-info-surface     | cyan-50          | Info alert backgrounds             |
| color-surface          | neutral-50       | Page background                    |
| color-surface-raised   | neutral-100      | Cards, raised panels               |
| color-surface-overlay  | neutral-900/80%  | Modal backdrop                     |
| color-border           | neutral-200      | Default borders, dividers          |
| color-border-strong    | neutral-400      | Emphasis borders                   |
| color-border-focus     | [hue]-400        | Focus rings (3:1 min contrast)     |
| color-text-primary     | neutral-800      | Primary body text                  |
| color-text-secondary   | neutral-500      | Secondary, supporting text         |
| color-text-disabled    | neutral-300      | Disabled text                      |
| color-text-inverse     | neutral-50       | Text on dark backgrounds           |

#### Neutral Scale
| Token         | Value   | Contrast on white | Usage                          |
|---------------|---------|-------------------|--------------------------------|
| neutral-50    | [hex]   | -                 | Page background                |
| neutral-100   | [hex]   | -                 | Card background, hover tints   |
| neutral-200   | [hex]   | -                 | Borders, dividers              |
| neutral-300   | [hex]   | [X]:1             | Disabled text, placeholders    |
| neutral-400   | [hex]   | [X]:1             | Secondary icons, muted labels  |
| neutral-500   | [hex]   | [X]:1             | Secondary text (check AA)      |
| neutral-600   | [hex]   | [X]:1             | Primary body text (must be AA) |
| neutral-700   | [hex]   | [X]:1             | Headings, emphasis text        |
| neutral-800   | [hex]   | [X]:1             | High-emphasis, dark headers    |
| neutral-900   | [hex]   | [X]:1             | Maximum contrast               |

---

### Border Radius
| Token         | Value  | Usage                               |
|---------------|--------|-------------------------------------|
| radius-none   | 0      | Tables, code, flush-edge elements   |
| radius-sm     | [X]px  | Tags, badges, chips, tooltips       |
| radius-md     | [X]px  | Buttons, inputs, selects            |
| radius-lg     | [X]px  | Cards, dropdowns, panels            |
| radius-xl     | [X]px  | Modals, large feature cards         |
| radius-2xl    | [X]px  | Marketing cards (consumer products) |
| radius-full   | 9999px | Avatars, toggle pills, icon buttons |

**Visual personality:** [Sharp / Subtle / Rounded / Friendly]

---

### Elevation (Shadows)
| Token       | Value                                              | Usage                       |
|-------------|----------------------------------------------------|-----------------------------|
| shadow-none | none                                               | Flat, no elevation          |
| shadow-sm   | [two-value shadow]                                 | Cards, list items           |
| shadow-md   | [two-value shadow]                                 | Dropdowns, popovers         |
| shadow-lg   | [two-value shadow]                                 | Modals, side drawers        |
| shadow-xl   | [two-value shadow]                                 | Floating action elements    |

**Shadow color base:** rgba([neutral-900 as RGB], X)

---

### Transitions
| Token            | Value                          | Usage                              |
|------------------|--------------------------------|------------------------------------|
| duration-fast    | [X]ms                          | Hover, focus ring appearance       |
| duration-normal  | [X]ms                          | Toggle, dropdown, tab switch       |
| duration-slow    | [X]ms                          | Modal open/close, panel expand     |
| duration-slower  | [X]ms                          | Page transitions, skeleton loading |
| ease-default     | cubic-bezier(0.4, 0, 0.2, 1)  | General UI transitions             |
| ease-in          | cubic-bezier(0.4, 0, 1, 1)    | Elements exiting the screen        |
| ease-out         | cubic-bezier(0, 0, 0.2, 1)    | Elements entering the screen       |
| ease-spring      | cubic-bezier(0.34, 1.56, 0.64, 1) | Delight moments, confirmations |

**Reduced motion:** All durations collapse to 0.01ms under `prefers-reduced-motion: reduce`.

---

### Usage Guidelines

**Component Patterns:**
- Cards: [space-lg or space-xl] padding, radius-lg, shadow-sm, color-surface-raised background
- Buttons (default): [space-sm] vertical padding, [space-lg] horizontal padding, radius-md, color-primary background
- Form inputs: [space-md] padding, radius-md, color-border border, color-border-focus on focus
- Data tables: [space-sm] cell padding, radius-none, neutral-200 row dividers
- Navigation sidebar: [space-md] item padding, neutral-800 background, color-text-inverse text
- Modals: [space-xl] padding, radius-xl, shadow-lg, color-surface-overlay backdrop

**Spacing Hierarchy:**
- Icon-to-label: space-xs (2px) to space-sm (4px)
- Elements within a component: space-sm (4px) to space-md (8px)
- Between form fields: space-md (8px) to space-lg
- Between card content blocks: space-lg to space-xl
- Between page sections: space-2xl to space-3xl

**Text Usage:**
- Page titles: h1, neutral-800 to neutral-900
- Section titles: h2, neutral-700 to neutral-800
- Body text: body, color-text-primary (neutral-600 to neutral-800)
- Supporting text: small, color-text-secondary (neutral-400 to neutral-500)
- Disabled text: any role, color-text-disabled, never interactive

[If dark mode included:]
### Dark Mode Semantic Token Overrides
| Token                  | Light Value  | Dark Value    |
|------------------------|--------------|---------------|
| color-surface          | neutral-50   | neutral-900   |
| color-surface-raised   | neutral-100  | neutral-800   |
| color-text-primary     | neutral-800  | neutral-100   |
| color-text-secondary   | neutral-500  | neutral-400   |
| color-border           | neutral-200  | neutral-700   |
| [Continue for all semantic tokens]                     |
```

---

## Rules

1. **Never use raw hex values in component code -- only semantic tokens.** A system where components reference `#2563EB` directly will not support dark mode, theming, or systematic updates. Semantic tokens are the only layer developers should write against.

2. **Always maintain the three-tier token architecture: Primitive → Semantic → (Component).** Skipping the semantic layer to map primitives directly to components defeats the entire purpose of the system. The skip is tempting on small projects but creates technical debt within months.

3. **The 8px base unit is the default. Any deviation must be documented with a reason.** Compact systems may use 4px as the micro-unit and 8px only above `space-md`. Document this clearly. An undocumented deviation will be overridden by the next developer who joins.

4. **Type scale ratios must be consistent and mathematical -- never arbitrary.** A scale where h1 = 32px, h2 = 26px, and h3 = 21px is suspicious. Either the ratio is inconsistent or the rounding is wrong. Recalculate from the formula. Arbitrary sizes produce visual inconsistency that is imperceptible to most users but visible to trained eyes and catastrophic during responsive scaling.

5. **Every shadow token must use the product's own neutral-900 as the shadow color base, not pure black.** `rgba(0,0,0,X)` creates flat, generic-looking shadows. Product-tinted shadows feel cohesive and professional.

6. **Do not produce a token list without usage descriptions.** A token named `space-3xl` with no description is ambiguous. Does it apply to between-section spacing or page margins? Usage descriptions are what convert a token list into a design language.

7. **Neutral-600 on neutral-50 must achieve WCAG AA (4.5:1 minimum for body text).** Verify this explicitly. It is the most common text-on-background combination in any light-theme UI. If it fails, adjust the neutral scale before finalizing.

8. **Caption text must never go below 11px, and text below 14px must use a minimum weight of 500.** Thin text at small sizes fails contrast requirements and strains readability even when contrast ratios technically pass -- fine strokes at 11px regular weight can visually disappear.

9. **All transition durations must be tied to the `prefers-reduced-motion` media query.** This is not optional polish -- it is a WCAG 2.1 criterion (2.3.3 level AAA). Include the reduced motion override rule explicitly in the specification.

10. **If a brand color is provided as the primary, verify it achieves 4.5:1 contrast against your designated button text color before assigning it as `color-primary`.** Many brand colors (especially mid-range blues and greens) fail contrast when used as a button background with white text. If the brand color fails, create a `color-primary-accessible` variant by darkening by one or two steps and note the deviation.

11. **Never produce a dark mode system that simply inverts the light mode colors.** Dark mode requires recalibrating both the neutral scale order AND the opacity of shadows. Neutral-900 becomes the surface, not just the text. Shadows must be replaced with subtle inner borders. State colors (success, error, warning) must shift to their lighter tints on dark surfaces, not their full-saturation values.

12. **Token naming must use kebab-case and follow the pattern: [category]-[variant]-[state].** This ensures tooling compatibility (CSS custom properties require hyphens) and maintains alphabetical sorting in token files. Mixed naming conventions (camelCase tokens mixed with kebab-case) break design-to-dev handoff tooling like Style Dictionary and Theo.

---

## Edge Cases

### Dark Mode Requirement
Dark mode is not an inversion of light mode -- it is a separate resolved theme for all semantic tokens. The structural tokens (spacing, type, radius, shadows) do not change. Only the color semantic layer changes. Neutral scale inverts conceptually: `neutral-50` resolves to the darkest background in dark mode (~`#0F172A`) and `neutral-900` resolves to the lightest text (~`#F8FAFC`). State colors (success, warning, error) must shift to their lighter tints (`green-300` instead of `green-600`) to avoid overly saturated color blocks on dark surfaces. Shadows in dark mode lose their visual effect -- replace `shadow-sm` with `box-shadow: 0 0 0 1px rgba(255,255,255,0.08)` (a subtle white inner border) instead. Present the dark mode spec as a semantic token override table, not a second full token list.

### Accessibility-First Design (WCAG AAA Target)
AAA compliance changes specific thresholds throughout the system. Body text contrast must reach 7:1 (not 4.5:1). This means `color-text-primary` must be neutral-800 or darker on neutral-50 backgrounds. Large text (above 18px regular or 14px bold) requires 4.5:1 minimum. Type scale body minimum stays at 16px -- do not allow compact 14px body for AAA systems. Small text minimum rises to 14px, and caption minimum rises to 13px with weight 500. Interactive element touch targets must be at minimum 44x44px per WCAG 2.5.5. Note: AAA is not a universal requirement for all UI text -- some governments (EU Public Sector) mandate AA, not AAA. Clarify with the user before locking to AAA, as it significantly restricts color palette flexibility.

### Augmenting an Existing Design System
First request the full current token list. Do not regenerate tokens that already exist -- duplicate tokens create versioning conflicts. Identify only the gaps: common gaps include missing shadow scale, no semantic color aliases for success/warning/error states, missing transition tokens, and inconsistent spacing step sizes. When adding tokens, match the existing naming convention exactly (if the existing system uses camelCase like `spaceMd`, do not introduce `space-md`). Flag naming convention inconsistencies as a separate issue for the team to resolve -- do not silently mix conventions. If the existing system uses a different base unit (e.g., 5px or 10px), maintain that base rather than imposing 8px. Document the added tokens in an "Additions" section clearly separated from the existing spec.

### Multi-Brand Token System
Separate the token architecture into two layers: a **Foundation Layer** (shared across all brands: spacing, border radius, shadows, transitions, and type scale structure) and a **Brand Layer** (overrides: primary color, secondary color, neutral hue tint, body typeface, and display typeface). Each brand provides its own Brand Layer values which resolve against the shared Foundation Layer. The foundation layer tokens must use abstract naming: `brand-primary`, `brand-secondary`, `brand-font-family-sans`, `brand-font-family-display`. This pattern mirrors what large design systems like Polaris (Shopify) and Primer (GitHub) use for multi-product contexts. Warn the user that managing more than 4-5 brands on this architecture requires a token management tool -- manual maintenance of parallel JSON files becomes untenable.

### Minimal System (Landing Page, Small Site, MVP)
Reduce the token set to avoid over-engineering. Minimum viable token set: 5 spacing tokens (sm, md, lg, xl, 2xl), 4 type roles (h1, h2, body, small), 3 color groups (primary with 3 variants, neutral 10-step, one accent), 2 shadow levels (none, card), 3 radius tokens (none, md, full), 2 transition tokens (fast, normal). Document this explicitly as a minimal system and note which tokens to add first as the product scales (shadow scale, semantic color states, caption role, 2xl-4xl spacing). A minimal system is not a "bad" system -- it is right-sized for its context. Resist the urge to generate the full token set when the user has 8 screens.

### Token Format Export (JSON / CSS Custom Properties / SCSS)
If the user requests a specific output format:
- **CSS custom properties:** Prefix with `--` and place in `:root {}`. Example: `--space-md: 8px;`
- **SCSS variables:** Prefix with `$`. Example: `$space-md: 8px;`
- **Style Dictionary JSON:** Use nested objects with a `value` key. Example: `{ "space": { "md": { "value": "8px" } } }`. Style Dictionary resolves alias tokens using `{token.path}` syntax.
- **Figma Tokens plugin JSON:** Uses a flat structure with `$value` and `$type` keys. Example: `{ "space-md": { "$value": "8", "$type": "spacing" } }`.
- Include only one format per request. Producing multiple format variants in one output creates confusion about which is canonical.

### Responsive / Fluid Typography
If the product spans a wide viewport range (e.g., 320px mobile to 2560px desktop), consider fluid type scaling using CSS `clamp()`. The formula: `clamp([min], [preferred], [max])` where preferred is a viewport-relative unit. Example for h1: `clamp(28px, 4vw, 48px)`. Document the min and max values in the type scale table rather than a fixed single value. Fluid type tokens should be named with a `-fluid` suffix: `font-size-h1-fluid`. Note: fluid type requires browser support for `clamp()` (all modern browsers since 2020, IE11 is excluded). If IE11 support is required, fall back to breakpoint-based overrides.

---

## Example

**Input:**
"Create design system foundations for a B2B SaaS analytics dashboard. Primary brand color is #2563EB. The app is data-heavy so it should be compact. We need WCAG AA. We're building for web only."

---

**Output:**

## Design System: Analytics Dashboard Foundations
**Density:** Compact (data-heavy)
**WCAG Target:** AA (4.5:1 normal text, 3:1 large text)
**Themes:** Light only
**Platform:** Web

---

### Spacing Scale (base: 8px, compact adjustment applied)

Compact density compresses the mid-range steps: `space-lg` is 12px (not 16px) and `space-xl` is 16px (not 24px). This reduces the visual air in panel interiors to maximize data density.

| Token         | Value  | Usage                                             |
|---------------|--------|---------------------------------------------------|
| space-none    | 0px    | Explicit no-spacing reset                         |
| space-xs      | 2px    | Optical corrections, icon vertical offset         |
| space-sm      | 4px    | Table cell padding, badge padding, icon gaps      |
| space-md      | 8px    | Default component padding, between form elements  |
| space-lg      | 12px   | Card internal padding, input groups               |
| space-xl      | 16px   | Section padding within panels                     |
| space-2xl     | 24px   | Between panel groups, sidebar padding             |
| space-3xl     | 32px   | Major section separation, between dashboard rows  |
| space-4xl     | 48px   | Page-level vertical rhythm, top/bottom margins    |

**Deviation note:** `space-lg` and `space-xl` are compressed vs. the standard 8px base progression. Standard values are 16px and 24px respectively. This is intentional for compact density. If switching to balanced density, restore standard values.

---

### Type Scale (base: 14px, ratio: 1.200 Minor Third, compact)

Compact UIs use 14px body to recover vertical space in data tables and dense lists. WCAG AA is maintained because neutral-800 on neutral-50 exceeds 8:1 contrast ratio at 14px.

| Role     | Size  | Weight | Line Height | Letter Spacing | Usage                                 |
|----------|-------|--------|-------------|----------------|---------------------------------------|
| display  | 40px  | 700    | 1.1         | -0.02em        | Empty states, landing splash only     |
| h1       | 34px  | 700    | 1.2         | -0.01em        | Page titles, primary modal headers    |
| h2       | 28px  | 600    | 1.25        | 0              | Section titles, dashboard group heads |
| h3       | 23px  | 600    | 1.3         | 0              | Card titles, panel headers            |
| h4       | 19px  | 600    | 1.35        | 0              | Widget titles, sub-panel labels       |
| body     | 14px  | 400    | 1.5         | 0              | Default content, table cell content   |
| small    | 12px  | 400    | 1.4         | 0.01em         | Helper text, secondary labels         |
| caption  | 11px  | 500    | 1.4         | 0.02em         | Timestamps, axis labels, metadata     |

**Scale derivation:** 14 × 1.2^1 = 16.8 → 17px (rounding used), continued upward. Display was capped at 40px rather than calculated 49px to prevent over-scaling in app context.

**Caption note:** Caption at 11px uses weight 500 (medium) to compensate for reduced stroke width. Regular weight at 11px fails perceptual legibility even when contrast ratios pass mathematically.

---

### Color Tokens

#### Primitive Colors -- Blue (Primary)
| Token      | Value   |
|------------|---------|
| blue-50    | #EFF6FF |
| blue-100   | #DBEAFE |
| blue-200   | #BFDBFE |
| blue-300   | #93C5FD |
| blue-400   | #60A5FA |
| blue-500   | #3B82F6 |
| blue-600   | #2563EB |
| blue-700   | #1D4ED8 |
| blue-800   | #1E40AF |
| blue-900   | #1E3A8A |

**Note:** The user-supplied brand color (#2563EB) maps to `blue-600`, not blue-500. This is correct -- the brand color IS the primary, and it resolves to `color-primary`.

#### Primitive Colors -- Neutral (Cool Slate, blue-tinted to harmonize with primary)
| Token         | Value   | Approx. Contrast on White |
|---------------|---------|---------------------------|
| neutral-50    | #F8FAFC | -                         |
| neutral-100   | #F1F5F9 | -                         |
| neutral-200   | #E2E8F0 | -                         |
| neutral-300   | #CBD5E1 | 2.0:1                     |
| neutral-400   | #94A3B8 | 3.0:1                     |
| neutral-500   | #64748B | 4.6:1 ✓ AA large text     |
| neutral-600   | #475569 | 6.8:1 ✓ AA normal text    |
| neutral-700   | #334155 | 9.5:1 ✓ AAA               |
| neutral-800   | #1E293B | 12.6:1 ✓ AAA              |
| neutral-900   | #0F172A | 16.1:1 ✓ AAA              |

**Verification:** `neutral-600` (#475569) on `neutral-50` (#F8FAFC) achieves 6.8:1 -- passes WCAG AA for body text. Primary body text (`color-text-primary`) resolves to neutral-700 for additional margin.

#### Semantic Colors
| Token                   | Resolves To   | Value   | Usage                                         |
|-------------------------|---------------|---------|-----------------------------------------------|
| color-primary           | blue-600      | #2563EB | Primary CTAs, active nav items, links         |
| color-primary-hover     | blue-700      | #1D4ED8 | Hover state on primary buttons and links      |
| color-primary-active    | blue-800      | #1E40AF | Pressed/active state                          |
| color-primary-disabled  | blue-300      | #93C5FD | Disabled primary (used at 40% opacity)        |
| color-primary-surface   | blue-50       | #EFF6FF | Primary alert backgrounds, selected row tints |
| color-secondary         | violet-600    | #7C3AED | Secondary badges, category labels             |
| color-success           | green-600     | #16A34A | Positive trends, success alerts               |
| color-success-surface   | green-50      | #F0FDF4 | Success alert backgrounds                     |
| color-success-text      | green-800     | #166534 
