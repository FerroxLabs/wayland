---
name: typography-system
description: |
  Produces a complete typography system with type scale, weight assignments, line-height per role, font pairing rationale, and usage rules as a tool-agnostic specification.
  Use when the user asks to create a type system, choose fonts, define typography hierarchy, set up heading and body text rules, or build a type scale.
  Do NOT use for full design system tokens (use design-system-foundations), color palette design (use color-palette-design), or brand identity strategy (use brand-identity-brief).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design template branding"
  category: "design-creative"
  subcategory: "graphic-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Typography System

## When to Use

**Use this skill when:**
- The user asks to create a type system, choose fonts, or establish a typography hierarchy for a digital or print project
- The user wants to define heading sizes, body text styles, caption rules, and label conventions as a cohesive specification
- The user needs a modular type scale -- asking for a "font size system," "text hierarchy," or "typographic rhythm"
- The user is pairing fonts and wants rationale for why specific families work together structurally and tonally
- The user is building a web application, mobile app, marketing site, or print document and needs all typographic decisions resolved in one document
- The user has an existing partial type system (e.g., a brand font) and needs to complete or extend it with a full scale and rules
- The user needs to specify typography for a design handoff to developers -- requiring exact sizes, weights, line-heights, and letter-spacing per role

**Do NOT use when:**
- The user wants a full design system including spacing tokens, color palettes, elevation, shadows, and border radii -- use `design-system-foundations`
- The user wants to design or choose a color palette -- use `color-palette-design`
- The user wants a brand identity strategy including logo, visual voice, and positioning -- use `brand-identity-brief`
- The user wants CSS implementation of a type system (converting these specs to code) -- use a software-development skill
- The user only needs a single font recommendation without system construction -- answer the question directly without invoking this full workflow
- The user is asking about editorial layout, grid systems, or page composition -- those are layout skills beyond type specification

---

## Process

### Step 1: Gather Typography Requirements

Before choosing a single font, collect the following. Missing context leads to wrong font choices and unusable scale ratios.

- **Medium and platform:** Web (viewport-responsive), native mobile (iOS/Android with system font options), print (pt-based sizing), multi-platform product (needs cross-medium consistency). The answer changes which base size, units, and scale ratios apply.
- **Content type and density:** Long-form reading (articles, documentation) needs generous line-height and larger body size. Data-dense interfaces (dashboards, tables, forms) need compact metrics and a smaller base. Marketing and display contexts prioritize impact over reading comfort.
- **Brand tone:** Formal/institutional, technical/neutral, friendly/approachable, editorial/cultural, playful/expressive. Tone eliminates entire font categories -- you will not recommend a geometric sans-serif for a law firm or a didone serif for a children's app.
- **Constraints:** Free fonts only (Google Fonts, Font Squirrel licensed), licensed fonts already owned, performance budget (maximum font file weight in KB), existing brand font that cannot change, specific languages and scripts required.
- **Audience:** Reading-heavy professionals (developers, analysts) tolerate tighter metrics. General consumers need more breathing room. Accessibility-first products must prioritize legibility over aesthetics at every size.
- **Existing assets:** Does the user have a brand guide, existing font choices, or a partial type scale? Extending an existing system is different from designing one from scratch.

If the user has not provided medium, content type, and tone, ask for these three specifically before proceeding. Do not produce a generic output and ask for feedback -- resolve requirements first.

---

### Step 2: Select Font Families Using a Structured Pairing Framework

Font selection is the highest-leverage decision in the system. Use this decision tree:

**Determine how many font families are needed:**
- Single-family systems: Use when the interface is dense, performance matters, or the brand requires restraint. A variable font (e.g., Inter, Source Sans 3) gives full weight range from one file.
- Two-family systems: Use when heading and body text play meaningfully different roles -- editorial sites, marketing, branding-forward products.
- Never use three or more font families in a production system.

**Select the pairing strategy based on tone and content:**

| Strategy | Description | When to Use |
|---|---|---|
| Serif heading + sans-serif body | Classic editorial contrast; the serif provides character, sans provides legibility | Publishing, editorial, finance, legal, luxury |
| Sans-serif heading + sans-serif body (different families) | Modern contrast via weight and structure; humanist + geometric works well | Tech, SaaS, healthcare, productivity tools |
| Sans-serif heading + sans-serif body (same family) | Maximum consistency and restraint; weight-only hierarchy | Dashboards, data interfaces, developer tools |
| Display/slab heading + sans-serif body | High visual impact; the display font is expressive, body stays neutral | Marketing, portfolios, landing pages, brand campaigns |
| Serif heading + serif body (different optical sizes) | Rare; works when both families have distinct optical characteristics | Academic, literary, high-end print |

**Pairing mechanics -- the structural criteria that make fonts work together:**
- **Shared x-height:** Fonts with similar x-heights (the height of lowercase letters relative to caps) feel harmonious when set at the same size. Fonts with very different x-heights fight each other in mixed-size contexts.
- **Contrasting structure:** Pair a geometric sans (circular bowls, uniform stroke width) with a humanist serif (calligraphic variation, bracketed serifs) for maximum personality contrast with visual harmony.
- **Avoid near-misses:** Two different geometric sans-serifs (e.g., Futura and Avenir) look like a mistake, not a choice. If pairing within a category, the difference must be unmistakable.
- **Optical weight matching:** When set at the same size, the heading font's Regular should feel slightly heavier than the body font's Regular. This natural contrast reduces how aggressively you need to scale sizes.
- **Legibility at intended sizes:** Test the body font candidate at 14-16px before committing. Fonts with small apertures (tight counters in letters like 'e', 'a', 'c') become illegible at small sizes.

**Font category knowledge for recommendations:**
- **Humanist sans-serif (Inter, Source Sans, Fira Sans, Nunito Sans):** Best all-purpose body fonts for screen. High x-height, open apertures, strong legibility at small sizes.
- **Geometric sans-serif (Montserrat, Raleway, DM Sans, Plus Jakarta Sans):** Strong for headings and display; less comfortable for long-form body text due to uniform strokes.
- **Transitional serif (Georgia, Merriweather, Lora, IBM Plex Serif):** Built for screen rendering; sturdy strokes survive low-DPI displays. Good body serif for reading contexts.
- **Humanist serif (Crimson Pro, EB Garamond, Freight Text):** Elegant, literary feel. Body text for premium editorial and long-form content. Requires larger body size (17-18px) for comfortable screen reading.
- **Didone/modern serif (Playfair Display, DM Serif, Libre Bodoni):** High-contrast strokes are expressive at display sizes but collapse at body sizes. Heading-only use.
- **Slab serif (Roboto Slab, Zilla Slab, Courier Prime):** Strong visual personality; can work as heading fonts or in technical/editorial contexts.
- **Variable fonts:** Source Sans 3, Inter, Recursive, Fraunces, and Raleway all have variable font versions. Specify the variable font when available -- it provides the full weight axis from a single file, reducing HTTP requests.

---

### Step 3: Build the Type Scale Using a Mathematical Ratio

A type scale is not a list of arbitrary sizes -- it is a geometric progression. Every size is a precise multiple of the previous, creating visual rhythm.

**How to calculate a modular scale:**
- Choose a base size (typically 16px for web reading, 14px for dense data interfaces, 12pt for print body text)
- Choose a ratio from the table below
- Multiply the base upward for headings: base × ratio¹, × ratio², × ratio³, etc.
- Divide the base downward for small text: base ÷ ratio¹, base ÷ ratio², etc.
- Round to the nearest whole pixel (or 0.5px) for implementation precision

**Ratio selection guide:**

| Ratio | Name | Heading-to-body contrast | Best-fit contexts |
|---|---|---|---|
| 1.067 | Minor Second | Minimal -- almost imperceptible jumps | Avoid; insufficient hierarchy |
| 1.125 | Major Second | Subtle, compact | Data-dense dashboards, admin panels, dense forms |
| 1.200 | Minor Third | Moderate, balanced | General SaaS, documentation, productivity apps |
| 1.250 | Major Third | Clear contrast, versatile | Marketing sites, editorial, general-purpose |
| 1.333 | Perfect Fourth | Strong, noticeable | Landing pages, brand sites, content marketing |
| 1.414 | Augmented Fourth | Dramatic | Portfolio sites, hero-heavy pages, expressive marketing |
| 1.500 | Perfect Fifth | Very dramatic | Minimal content, artistic, typographic showcase |
| 1.618 | Golden Ratio | Extreme | Avoid for multi-role systems; too few sizes are usable |

**Scale calculation worked example (base 16px, ratio 1.250 Major Third):**
- xs: 16 ÷ 1.250² = 10.24 → 10px (caption minimum)
- sm: 16 ÷ 1.250 = 12.8 → 13px (caption/label)
- base: 16px (body)
- md: 16 × 1.250 = 20px (body-large / H4)
- lg: 16 × 1.250² = 25px (H3)
- xl: 16 × 1.250³ = 31px (H2)
- 2xl: 16 × 1.250⁴ = 39px (H1)
- 3xl: 16 × 1.250⁵ = 49px (display)

Round to: 10, 13, 16, 20, 25, 31, 39, 49

**When to deviate from strict modular math:** A purely mathematical scale sometimes produces awkward intermediate values. Apply these corrections:
- If a heading size lands within 2px of another role, adjust one by 1-2px to create clear visual separation
- If the body-large size is smaller than 16px due to scale math, override it to 16px -- readability takes precedence over ratio purity
- For very large display sizes (above 60px), you may flatten slightly to avoid taking too much viewport space

---

### Step 4: Assign Roles and Map Scale Steps to Functions

Every size in the scale needs a functional role. Roles connect typographic values to content types.

**Standard role definitions:**

- **Display:** The single largest size. Reserved for hero headlines, splash screens, full-page feature text. Used once per page. Should stop a viewer's eye completely.
- **H1 (Page Title):** The primary structural heading. One per page in web contexts. Establishes what the page is about. Not for decorative use.
- **H2 (Section Heading):** Divides the page into major content sections. Multiple per page. The most-used heading level in long-form content.
- **H3 (Subsection Heading):** Organizes content within an H2 section. Panel titles in dashboards. Card headings.
- **H4 (Group Label):** Low-level content grouping. Form section headings, accordion labels, sidebar section titles.
- **Body Large (Lead):** Introductory paragraphs, pull quotes, larger UI body text (modals, tooltips). Creates visual emphasis without heading weight.
- **Body (Default):** The workhorse role. Primary reading text, standard form labels in sentence case, default UI text.
- **Body Small:** Secondary contextual text, helper text under form fields, supplementary metadata.
- **Caption:** Photo captions, table cell labels, chart annotations, footnote text. Smallest comfortable reading size.
- **Label:** Short non-sentence text. Navigation items, button text, chip labels, badge text. Often set in Medium weight or uppercase with extra tracking.
- **Overline (optional):** Small uppercase text above a heading, used to indicate category or context. 10-11px, uppercase, wide letter-spacing (0.08-0.12em).
- **Data Value (optional):** For dashboards -- KPI numbers, metric values. Often same size as H3 but displayed in tabular-nums figure alignment.
- **Code (optional):** Monospace text within prose or standalone code blocks. Always a separate monospace font family.

**Determining which scale step maps to which role:** Start from the bottom. Body = base. Body large = one step up. H4 = one step up from body-large (or same step if the interface is compact). Then continue upward. If you have more roles than scale steps at the top, use weight and case to create distinction rather than forcing additional sizes.

---

### Step 5: Define Weight Assignments Per Role

Font weight is the second most powerful hierarchy tool after size. Use weight with strict discipline.

**Weight naming conventions and values:**
- Thin / Hairline: 100
- ExtraLight / UltraLight: 200
- Light: 300
- Regular / Book: 400
- Medium: 500
- SemiBold / DemiBold: 600
- Bold: 700
- ExtraBold / UltraBold: 800
- Black / Heavy: 900

**Weight assignment rules by role:**

| Role | Recommended Weight | Rationale |
|---|---|---|
| Display | 700 or 800 | Maximum impact; the size already dominates, weight reinforces |
| H1 | 700 | Clear primary heading authority |
| H2 | 600-700 | Strong enough to restart scanning; lighter than H1 |
| H3 | 600 | Panel-level heading; semibold is visible without shouting |
| H4 | 500-600 | Light touch; distinguishable from body through combination of size and weight |
| Body Large | 400 | Reading comfort at lead size |
| Body | 400 | The foundation of the entire system; never change this |
| Body Small | 400 | Matches body weight for consistency |
| Caption | 500 | Small text needs weight compensation to reach the same perceived size as larger 400-weight text |
| Label | 500-600 | Short strings at small sizes need slightly more weight for immediate readability |
| Data Value | 600-700 | Scannable at a glance; this is the KPI number, make it count |

**Critical rule:** Never use Bold (700) for body text emphasis -- use SemiBold (600) instead. Reserve 700 for headings. This preserves the weight hierarchy. If body uses 400 and emphasis uses 600, the heading at 700 still clearly outranks both.

**Weight axis for variable fonts:** If using a variable font (e.g., Inter, Source Sans 3), you can specify non-standard weights like 450, 550, or 650. Use this capability thoughtfully -- non-standard weights are useful for optical refinement but should be rounded to the nearest 50 for token/variable naming clarity.

---

### Step 6: Define Line-Height Per Role

Line-height (leading) determines vertical rhythm and reading comfort. It is the most commonly mis-specified typographic property.

**Why line-height must vary by size:** Large text (headings) already has visual separation between baselines due to its physical size. Adding generous line-height makes headlines feel disconnected and hard to read as a unit. Small text (body, caption) needs generous leading so the eye can track from the end of one line to the beginning of the next without losing its place.

**Line-height values by role (unitless multipliers):**

| Role | Line-Height | Reasoning |
|---|---|---|
| Display | 1.0 -- 1.1 | Single line or very close-set; creates monolithic impact |
| H1 | 1.1 -- 1.2 | Tight but allows two-line titles to breathe |
| H2 | 1.2 -- 1.3 | Section headings may wrap; needs a little more room |
| H3 | 1.25 -- 1.35 | Panel titles often wrap to two lines in responsive layouts |
| H4 | 1.3 -- 1.4 | Group labels near body text; transition toward reading metrics |
| Body Large | 1.5 -- 1.6 | Reading-optimized; generous leading for lead paragraphs |
| Body | 1.5 -- 1.6 | The canonical reading range; never below 1.4 for web |
| Body Small | 1.4 -- 1.5 | Slightly tighter than body due to context (helper text, metadata) |
| Caption | 1.3 -- 1.4 | Short, contextual strings; not running prose |
| Label | 1.2 -- 1.3 | Single-line non-prose; tight is appropriate |
| Code | 1.4 -- 1.5 | Allows line-scanning without cramping code structure |

**Always express line-height as a unitless multiplier** (1.5 not 150% or 24px). Unitless values scale correctly when font size changes, avoiding compound inheritance bugs.

**Optical adjustment for specific fonts:** Fonts with tall ascenders (e.g., Garamond variants) appear to have more vertical space than their metrics indicate. You may reduce line-height by 0.05 compared to the standard recommendations. Fonts with tight vertical metrics (e.g., Helvetica, Arial) may need an increase of 0.05.

---

### Step 7: Define Letter-Spacing Per Role

Letter-spacing (tracking) makes the difference between type that feels designed and type that feels default. Apply it with restraint.

**The physics of letter-spacing:** At large sizes, glyphs feel visually spaced apart because our eyes perceive the negative space between large forms as proportionally larger. Tightening tracking compensates. At small sizes, glyphs crowd together optically; loosening tracking maintains distinction between letterforms.

**Letter-spacing values per role (em units):**

| Role | Letter-Spacing | Notes |
|---|---|---|
| Display (48px+) | -0.02em to -0.03em | Aggressive tightening for tight, impactful headlines |
| H1 (32-48px) | -0.01em to -0.02em | Moderate tightening |
| H2 (24-32px) | -0.01em | Light tightening |
| H3 (20-24px) | 0 to -0.005em | Near-neutral |
| H4 | 0 | Default tracking |
| Body all sizes | 0 | Never adjust body text tracking; the type designer set it correctly |
| Caption | +0.01em | Small text benefits from slight opening |
| Label | +0.01em to +0.02em | Short strings at small sizes |
| Overline (uppercase) | +0.08em to +0.12em | All-caps text always needs wide tracking to avoid letterform collisions |
| Data value | 0 to -0.01em | Numeric tabular figures; slight tightening for large KPI numbers |

**Critical rule:** Never apply letter-spacing to sentence-case body text. The only exception is uppercase labels and overlines. Loosened tracking on lowercase body text creates a broken, amateur look.

---

### Step 8: Define Responsive Scaling Strategy

Typography must adapt across breakpoints. Define a clear strategy rather than ad-hoc adjustments.

**Three approaches to responsive type:**

1. **Fixed scaling (most common):** Define specific sizes per breakpoint. Simple, predictable, easy to implement. Use for most projects.
2. **Fluid scaling (CSS clamp):** Sizes scale continuously between a minimum and maximum value based on viewport width. Eliminates breakpoint jumps but requires precise min/max calculation. Specify as: clamp(minimum, preferred, maximum), e.g., clamp(28px, 4vw, 48px).
3. **Step-down scaling:** Desktop uses a large ratio (1.333), mobile uses a smaller ratio (1.200). Only heading sizes change; body stays constant.

**Fixed breakpoint scaling rules:**
- Body text stays at 16px (or 14px for dense interfaces) across all breakpoints -- never reduce it on mobile
- Display and H1 reduce by 20-35% on mobile compared to desktop
- H2 and H3 reduce by 10-20% on mobile
- H4 and smaller roles do not change between breakpoints
- Use three breakpoints maximum: mobile (< 768px), tablet (768-1199px), desktop (1200px+)

**Scaling decision framework:**
- If display text is above 56px on desktop, reduce to 36-44px on mobile
- If the ratio between two adjacent heading levels drops below 1.1× on any breakpoint, combine or eliminate one level for that breakpoint
- Always verify that responsive heading text does not exceed the viewport width on any breakpoint -- a single-word heading at 64px may overflow a 320px mobile screen

---

### Step 9: Define Usage Rules and Compile the Specification

Usage rules prevent misapplication of the system by future designers and developers.

**Essential rules to always include:**
- How many times each heading level appears per page
- What role handles what content type (e.g., "panel titles use H3, not H2")
- How to create emphasis within body text (SemiBold only, not italic, not underline outside of links)
- Restrictions on decorative use (display font not for panel headings)
- Line length specification with a maximum character width or pixel constraint
- Rules about combining roles (never use Body Small directly under a Display heading without a Body role in between)

**Line length (measure) specification:**
- The optimal reading measure for proportional Latin body text is 45-75 characters per line (CPL)
- At 16px with most sans-serif fonts, this corresponds to approximately 480-680px container width
- At 14px, the corresponding width is approximately 420-580px
- For headings, wider measures are acceptable because they are not sustained reading
- Always specify line length as a max-width constraint in the spec, not just a CPL number

**Compile into the output format below.** Every role must have all five values (size, weight, line-height, letter-spacing, font family). No role may be left partially specified.

---

## Output Format

```
## Typography System: [Project Name or Context]

### Overview
- Platform: [web / native mobile / print / multi-platform]
- Content type: [long-form reading / data-dense / marketing-display / mixed]
- Base size: [X]px | Scale ratio: [ratio name] ([ratio value])
- Font families: [1 / 2] -- [family name(s)]

---

### Font Selection
| Role     | Font Family       | Style Category           | Weight Range Available | Fallback Stack                              |
|----------|-------------------|--------------------------|------------------------|---------------------------------------------|
| Headings | [family name]     | [e.g., humanist sans]    | [e.g., 400-700]        | [specific fallback 1], [fallback 2], [generic] |
| Body     | [family name]     | [e.g., transitional serif] | [e.g., 400-700]      | [specific fallback 1], [fallback 2], [generic] |

### Pairing Rationale
[2-4 sentences explaining the structural and tonal logic: contrast type (structural/weight/classification), 
shared characteristics (x-height, aperture, optical weight at set sizes), and why these choices serve the 
specific platform and content type.]

---

### Type Scale
Base: [X]px | Ratio: [ratio name] [ratio value] | Scale steps used: [list actual pixel values in sequence]

| Role        | Size    | Weight | Line Height | Letter Spacing | Font Family  | Notes                              |
|-------------|---------|--------|-------------|----------------|--------------|-------------------------------------|
| display     | [X]px   | [wt]   | [X.X]       | [X.Xem / 0]    | [family]     | [usage context note]               |
| h1          | [X]px   | [wt]   | [X.X]       | [X.Xem / 0]    | [family]     | [one per page]                     |
| h2          | [X]px   | [wt]   | [X.X]       | [X.Xem / 0]    | [family]     | [section-level]                    |
| h3          | [X]px   | [wt]   | [X.X]       | [X.Xem / 0]    | [family]     | [subsection / panel title]         |
| h4          | [X]px   | [wt]   | [X.X]       | [X.Xem / 0]    | [family]     | [group label]                      |
| body-large  | [X]px   | [wt]   | [X.X]       | 0              | [family]     | [lead text, introductory paragraph]|
| body        | [X]px   | [wt]   | [X.X]       | 0              | [family]     | [default reading text]             |
| body-small  | [X]px   | [wt]   | [X.X]       | 0              | [family]     | [helper text, metadata]            |
| caption     | [X]px   | [wt]   | [X.X]       | +0.01em        | [family]     | [labels, captions, footnotes]      |
| label       | [X]px   | [wt]   | [X.X]       | +0.01em        | [family]     | [button text, nav, chips]          |

[Add additional rows for optional roles: overline, data-value, code, as applicable]

---

### Responsive Scaling
Strategy: [fixed breakpoints / fluid clamp / step-down ratio]

| Role     | Mobile (<768px) | Tablet (768-1199px) | Desktop (1200px+) |
|----------|-----------------|----------------------|--------------------|
| display  | [X]px           | [X]px                | [X]px              |
| h1       | [X]px           | [X]px                | [X]px              |
| h2       | [X]px           | [X]px                | [X]px              |
| h3       | [X]px           | [X]px                | [X]px              |
| body     | [X]px (fixed)   | [X]px (fixed)        | [X]px (fixed)      |
| caption  | [X]px (fixed)   | [X]px (fixed)        | [X]px (fixed)      |

[Note: roles not listed above do not change across breakpoints.]

---

### Line Length Constraints
| Context                          | Max Container Width | Approximate CPL |
|----------------------------------|---------------------|-----------------|
| Body text (articles, docs)       | [X]px               | ~[X] characters |
| Body small / helper text         | [X]px               | ~[X] characters |
| Headings (H1-H2)                 | No constraint       | N/A             |

---

### Usage Rules
1. [Heading hierarchy rule -- how many times each level appears per page]
2. [Body text emphasis rule -- which weight to use, what NOT to use]
3. [Role assignment rule -- what content type maps to what role]
4. [Line length enforcement rule]
5. [Responsive rule -- what changes at which breakpoint and what stays fixed]
6. [Data / special content rule if applicable]

### Do NOT Use
- [Anti-pattern 1 with specific consequence if violated]
- [Anti-pattern 2 with specific consequence if violated]
- [Anti-pattern 3]
- [Anti-pattern 4]
```

---

## Rules

1. **Never specify body text below 16px for primary reading contexts on web.** The only exception is data-dense interfaces where body is 14px -- and in that case, body-large must be 16px for any prose context within that same interface. Below 14px is never acceptable for body text under any circumstances.

2. **A type scale must be generated from a mathematical ratio.** Never produce a list of arbitrary pixel sizes and present them as a system. If scale math produces an awkward value (e.g., 27px instead of 28px), round to the nearest whole pixel and note the deviation. Do not silently use arbitrary sizes.

3. **No more than two font families in any type system.** A third family (typically monospace for code) may appear as a supplementary role, but it is not part of the heading/body pairing. Introduce it explicitly in the spec as a functional exception, not a third design choice.

4. **Every role must specify all five typographic properties: size, weight, line-height, letter-spacing, and font family.** A partially specified role is an incomplete specification. Developers will make arbitrary decisions to fill gaps, and those decisions will be inconsistent.

5. **Line-height for body text must fall between 1.4 and 1.65.** Below 1.4, lines stack too close for eye-tracking at normal reading sizes. Above 1.65, the white space between lines disconnects sentences visually, fragmenting reading flow. The 1.5-1.6 range is optimal for most Latin-script fonts.

6. **Letter-spacing on body text must be 0.** Do not open or tighten tracking on sentence-case body text. Font designers set the sidebearings and kerning tables for the text size range -- overriding them with global letter-spacing degrades legibility. Apply tracking only to headings (slight tightening), labels, captions, and uppercase text.

7. **Specify fallback font stacks for every font family.** Every stack must end with a CSS generic family keyword (serif, sans-serif, monospace, cursive, fantasy). Fallback stacks prevent invisible or unstyled text if the primary font fails to load. Prefer platform fonts as immediate fallbacks: -apple-system and BlinkMacSystemFont for Mac/iOS, "Segoe UI" for Windows, Roboto for Android.

8. **State the responsive scaling strategy explicitly.** Do not produce a desktop scale without addressing mobile. If the user has not requested responsive handling, default to fixed breakpoints and include a mobile column with appropriate reductions for display and H1.

9. **Paragraph line length must be constrained.** Express the constraint as a max-width pixel value (not just CPL count, which is implementation-dependent). For 16px Latin body text, specify max-width between 480-680px. For 14px, between 420-580px. Failing to specify line length produces rivers of text on wide viewports.

10. **Distinguish heading font from display font explicitly.** Many teams misuse the display role, applying it to section headings. The display role is a dedicated class for the single largest element on a page -- a hero headline, a splash title. It is not the same as H1, even if they use the same font family. Make this distinction explicit in the usage rules.

11. **Never use more than three distinct font weights in a single layout.** Within the overall system, you may specify more (e.g., 400, 500, 600, 700), but any individual screen or page should not actively use more than three simultaneously. More than three weights in view simultaneously creates visual noise rather than hierarchy.

12. **Overline text must use uppercase and wide letter-spacing (+0.08em minimum).** All-caps text rendered at normal letter-spacing creates collisions between capital letterforms, particularly with rounded capitals (O, C, G, Q) adjacent to straight ones (I, L, H). This is not an aesthetic preference -- it is a legibility requirement.

---

## Edge Cases

### Monospace-Dominant Interface (Code Editors, Terminal Emulators, Developer Tools)
Proportional and monospace type systems coexist in developer tools. Handle them as two parallel tracks. For the monospace track: the base size is 13-15px (not 16px) because monospace characters are already wider per character and a given viewport accommodates fewer characters. Set line-height for code blocks at 1.4-1.6 to make scanning vertical structure (indentation, brackets) comfortable. Never use Bold weight for code syntax highlighting -- weight variation in monospace text is less controlled optically and creates inconsistent glyph advance widths in older mono fonts. Use color contrast for code highlighting, not weight. Specify monospace font families: JetBrains Mono, Fira Code, Cascadia Code, or the system monospace stack (ui-monospace, SFMono-Regular, Menlo, Consolas, "Courier New") as fallback.

### Multi-Script Requirements (CJK, Arabic, Cyrillic, Devanagari)
Latin-optimized fonts must not be assumed to extend to other scripts. For each additional script:
- **CJK (Chinese, Japanese, Korean):** Characters are full-width and visually denser than Latin. Increase line-height to 1.6-1.8 for CJK body text. Font size may need to be 1-2px larger to match the optical weight of Latin text at the same nominal size. Specify CJK-specific fallback fonts (e.g., "PingFang SC" for Simplified Chinese, "Hiragino Sans" for Japanese, "Malgun Gothic" for Korean).
- **Arabic / Persian / Urdu:** Right-to-left scripts. The heading and body fonts must have verified Arabic character support, not just Latin. Verify with the Latin font's character map -- many geometric sans-serifs have no Arabic support. If using a Latin-only heading font, specify a separate Arabic-compatible heading font in the fallback stack. IBM Plex Arabic, Noto Kufi Arabic, and Almarai are reliable choices. Line-height for Arabic body: 1.6-1.8 (Arabic descenders and vowel marks require vertical space).
- **Cyrillic:** Most quality Latin fonts have Cyrillic support (Inter, Source Sans 3, PT Sans, Roboto). Verify Cyrillic coverage before finalizing. Bold Cyrillic can look heavier optically than the same weight in Latin -- you may reduce heading weight by one step (700 → 600) for Cyrillic display contexts.
- **Devanagari:** Indian scripts require specialized fonts. Poppins and Hind families have Latin/Devanagari pairs designed to harmonize. Specify the paired family, not the Latin font, as the Devanagari fallback.

### Print and High-Quality PDF Export
Print typography operates on different units and physics. Specify in points (1pt = 1/72 inch). Standard print body: 10-12pt for professional documents, 11-13pt for books and reports. Leading (line-height equivalent) is typically specified as absolute: "11pt on 15pt leading" or "12/16" meaning 12pt type on 16pt line grid. Web font performance is irrelevant in print -- prioritize optical quality. For CMYK print at 300+ DPI, traditional text-weight serifs (Times, Garamond, Minion, Caslon) are technically superior because hairline strokes in transitional and old-style serifs reproduce cleanly at print resolution, whereas low-contrast geometric sans fonts can look thin and weak. For screen-to-print PDF (browser-rendered), specify print-specific styles separately: headings reduce by 15-20% in pt compared to their pixel equivalents, and line-height tightens (1.4 is appropriate for print body, versus 1.5-1.6 for screen).

### Performance-Constrained Environments (Low Bandwidth, Offline-First, Enterprise Intranet)
When web font loading is unreliable or prohibited, system font stacks eliminate the problem entirely. Specify the complete modern system font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Segoe UI Variable", Roboto, "Helvetica Neue", Arial, sans-serif`. This stack targets: macOS/iOS (SF Pro via -apple-system), Windows 10 (Segoe UI Variable), Android (Roboto), and falls back to platform defaults for other systems. If web fonts are required but performance is constrained: load only two weights (400 and 700) per family; use the variable font file format when available to get the full weight axis from one file; add `font-display: swap` to eliminate render-blocking; subset fonts to Latin characters only (reduces Inter Regular from ~380KB to ~25KB). Specify subsetting in the spec as a deployment note.

### Existing Brand Font with Severely Limited Weights
When a brand font has only Regular (400) and Bold (700) -- common with legacy custom fonts and some licensed display typefaces -- the system must compensate for the missing weight range using other typographic dimensions:
- Use size contrast aggressively: increase the size differential between heading levels. Instead of a 1.200 ratio (modest steps), step up to 1.333 (more dramatic jumps).
- Use case: Set H4 and labels in uppercase with letter-spacing +0.08em. The uppercase treatment adds a visual dimension that weight alone cannot provide.
- Increase letter-spacing at heading sizes to compensate for Bold feeling heavier than typical 700 weight fonts.
- Pair the brand font (used only for headings at Bold) with a versatile body font (like Inter or Source Sans) that has a full weight range. The body font handles fine-grained hierarchy at body scale.
- Document explicitly in the spec which roles use Bold (700) and which use Regular (400), and note that the limited weight range is a constraint.

### Variable Font Systems
If the selected font is a variable font (e.g., Inter Variable, Source Sans 3 Variable, Recursive, Fraunces), the type system can specify non-standard weight values along the weight axis. Best practices:
- Round variable weights to nearest 50 for naming consistency in tokens: 450 not 453
- Use the opsz (optical size) axis if available: smaller text benefits from optical size values that increase stroke width and letter spacing automatically
- Confirm the variable font version covers the same weight range as the static version before replacing static files
- Document the specific axis values used: `wght: 400, 500, 600, 700` -- developers need exact axis values for implementation
- Variable fonts have one rendering path instead of multiple file requests. Note this as a performance benefit in the spec.

### Icon-Laden or Emoji-Heavy Interface
When the interface uses inline SVG icons or system emoji alongside text, optical alignment issues arise. Emoji have no consistent vertical metrics across platforms -- at 16px, emoji appear larger than Latin text on most systems. Specify: do not use emoji as inline text elements in labels or headings. If emoji appear in body text, specify that surrounding text size should be 16px minimum (smaller sizes exaggerate the emoji size disproportion). For SVG icon alignment in labels and buttons: specify icon size at 1em (matching the label font size) and vertical alignment at -0.125em (a common correction for optical center alignment) as a deployment note.

---

## Example

**Input:** "Design a typography system for a B2B content marketing site -- long articles, case studies, a blog. It needs to feel authoritative and thoughtful, not cold or techie. Hosted on the web, free fonts preferred, and it should work well in English. Desktop and mobile both matter."

**Output:**

---

## Typography System: B2B Content Marketing Site

### Overview
- Platform: Web (responsive)
- Content type: Long-form reading (articles, case studies, blog posts)
- Base size: 18px | Scale ratio: Perfect Fourth (1.333)
- Font families: 2 -- Fraunces (headings), Source Sans 3 (body)

---

### Font Selection
| Role | Font Family | Style Category | Weight Range Available | Fallback Stack |
|---|---|---|---|---|
| Headings | Fraunces | Optical-size variable display serif | 100-900 (variable) | Georgia, "Times New Roman", serif |
| Body | Source Sans 3 | Humanist sans-serif (variable) | 200-900 (variable) | -apple-system, "Helvetica Neue", Arial, sans-serif |

### Pairing Rationale
Fraunces is a "wonky" optical-size display serif with high-contrast thick/thin strokes and expressive ink traps that give headings organic warmth -- it communicates editorial authority without the coldness of a transitional serif. Source Sans 3 pairs with it through strong structural contrast (sans-serif body against serif heading) while sharing a humanist drawing philosophy: both fonts have calligraphic influence in their letterforms, creating visual harmony despite their surface-level differences. Fraunces is used exclusively for headings at Bold (700) and above, where its optical character is legible and impactful. Source Sans 3's tall x-height and open apertures make it exceptionally readable at the 18px body size required for comfortable long-form reading on screen.

---

### Type Scale
Base: 18px | Ratio: Perfect Fourth (1.333) | Scale steps: 10, 13, 15, 18, 24, 32, 43, 57

| Role | Size | Weight | Line Height | Letter Spacing | Font Family | Notes |
|---|---|---|---|---|---|---|
| display | 57px | 700 | 1.05 | -0.02em | Fraunces | Hero headline only; one per page maximum |
| h1 | 43px | 700 | 1.1 | -0.015em | Fraunces | Article title, page title; one per page |
| h2 | 32px | 700 | 1.2 | -0.01em | Fraunces | Major section heading within articles |
| h3 | 24px | 600 | 1.25 | 0 | Fraunces | Subsection heading; sidebar titles; card headlines |
| h4 | 20px | 600 | 1.3 | 0 | Fraunces | Minor grouping within a section |
| body-large | 20px | 400 | 1.6 | 0 | Source Sans 3 | Lede/introductory paragraph; pull quote body |
| body | 18px | 400 | 1.65 | 0 | Source Sans 3 | Default article body, all running prose |
| body-small | 15px | 400 | 1.5 | 0 | Source Sans 3 | Sidebar content, footnotes, related article teasers |
| caption | 13px | 500 | 1.4 | +0.01em | Source Sans 3 | Image captions, figure labels, table cell labels |
| label | 13px | 600 | 1.3 | +0.015em | Source Sans 3 | Tags, category badges, navigation items, button text |
| overline | 11px | 600 | 1.3 | +0.10em | Source Sans 3 | Uppercase category indicator above article title |

Notes:
- H4 and body-large are both 20px but differentiated by font family (Fraunces vs. Source Sans 3), weight (600 vs. 400), and line-height. They will never appear in the same content position.
- The display role at 57px is for hero section headlines only. It is not used within article content.
- The overline role is always rendered uppercase; letter-spacing +0.10em is required for all-caps legibility.

---

### Responsive Scaling
Strategy: Fixed breakpoints with step-down at mobile

| Role | Mobile (<768px) | Tablet (768-1199px) | Desktop (1200px+) |
|---|---|---|---|
| display | 38px | 48px | 57px |
| h1 | 30px | 36px | 43px |
| h2 | 24px | 28px | 32px |
| h3 | 20px | 22px | 24px |
| h4 | 18px | 19px | 20px |
| body-large | 18px | 19px | 20px |
| body | 18px | 18px | 18px |
| body-small | 15px | 15px | 15px |
| caption | 13px | 13px | 13px |
| label | 13px | 13px | 13px |

Notes:
- Body text holds at 18px across all breakpoints. This is a deliberate choice for an article-heavy site -- reducing body text on mobile degrades reading comfort, which is the site's primary use case.
- H4 at mobile (18px) matches the body size. Differentiation is maintained by font family (Fraunces vs. Source Sans 3) and weight (600 vs. 400). This is acceptable on mobile where screen real estate requires tighter size ranges.
- Display at mobile (38px) was calculated to fit within a 390px viewport without line wrapping on typical 4-6 word hero headlines.

---

### Line Length Constraints
| Context | Max Container Width | Approximate CPL |
|---|---|---|
| Article body (prose) | 660px | ~65 characters at 18px |
| Body-small, footnotes | 600px | ~58 characters at 15px |
| Lede / body-large | 640px | ~58 characters at 20px |
| H1 article title | 760px | No hard CPL limit -- headlines wrap naturally |
| H2 section heading | 760px | No hard CPL limit |

All body content containers must have a max-width of 660px regardless of the outer page layout width. Centering within a wider layout is acceptable; exceeding 660px is not.

---

### Usage Rules

1. **Heading levels must follow document structure strictly.** Every article page has exactly one H1 (the article title). H2 marks major sections. H3 marks subsections within H2 sections. Do not skip heading levels (no H1 directly to H3). This serves both semantic HTML correctness and visual hierarchy.

2. **Body text emphasis uses SemiBold (600) weight only.** Never use Bold (700) within Source Sans 3 body text for inline emphasis. Bold in body text is indistinguishable from a heading when scanning the page and undermines the heading hierarchy. Use 600 for inline emphasis (strong/bold) and italic 400 for softer emphasis (cite, em, quotations). Underline is reserved for hyperlinks only.

3. **The lede (introductory paragraph) uses body-large.** The first paragraph of every article is set in body-large (20px / 400 / 1.6). All subsequent paragraphs use the standard body role (18px). This creates a natural visual entry point without needing a separate heading.

4. **Fraunces is not used below H4 size (20px).** Below 20px, Fraunces's optical character becomes cramped and the ink traps fill in on low-DPI screens. Caption, label, and overline roles all use Source Sans 3.

5. **Overline text must be uppercase.** The overline role (11px, +0.10em) is reserved for category labels that appear above an H1 or H2. It is always uppercase -- in lowercase, 11px Source Sans 3 at normal tracking is too small to read comfortably. The uppercase treatment compensates through perceived visual weight, and the wide tracking prevents collisions between capital letterforms.

6. **Pull quotes use body-large in italic.** Pull quotes are set in Source Sans 3 body-large (20px) italic at line-height 1.6. Do not set pull quotes in Fraunces or in any heading role -- this is a common mistake that makes pull quotes compete visually with section headings.

7. **On mobile, H4 (18px) matches the body size.** This is intentional and acceptable because the font families differ. Never increase body size to 20px on mobile to create contrast -- instead, trust the Fraunces/Source Sans 3 distinction to carry the hierarchy.

8. **Table headers use the label role.** All table column headers use the label role (13px / 600 / uppercase / +0.015em tracking). Table cell body content uses the caption role (13px / 500). This maintains legibility in data tables at the smallest practical size.

---

### Do NOT Use

- Do not use Fraunces at caption or label sizes. Below 16px, its optical character degrades and the hairline strokes become illegible. Source Sans 3 handles all small-size text.
- Do not use the display role (57px) inside article content. It is reserved exclusively for the homepage or campaign hero section. Using it as an article H1 overwhelms the reading experience.
- Do not reduce body text below 18px on any breakpoint. This site's value is the quality of its long-form content. Compromising reading comfort to fit a tighter layout is a wrong trade-off.
- Do not apply letter-spacing to body or body-large text. Source Sans 3's sidebearings are set for 16-20px reading text. Any tracking adjustment at these sizes will make the text feel artificially spaced and amateurish.
- Do not use more than two Fraunces weights on a single page (700 for H1/H2, 600 for H3/H4). Introducing Light or Thin Fraunces weights for decorative purposes visually fragments the type system.
- Do not allow body text containers to exceed 660px max-width, even if the page layout is 1200px wide. Long line lengths are the primary cause of reader fatigue on content sites and will increase bounce rates.
