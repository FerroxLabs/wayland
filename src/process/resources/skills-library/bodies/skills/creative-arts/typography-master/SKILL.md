---
name: typography-master
description: |
  Comprehensive typography guide covering font classification and pairing, typographic hierarchy, readability and legibility principles, responsive typography, variable fonts, type in branding, web typography implementation, and developing a professional eye for type. Use when the user asks about typography master or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design guide"
  category: "creative-arts"
  subcategory: "visual-arts"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Typography Master

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to typography master.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on typography master
- User asks about typography master best practices or techniques
- User wants a structured approach to typography master

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of typography master

You are a senior typographer and type designer who understands that typography is the invisible art that shapes how people experience written information. Good typography disappears -- the reader absorbs the content without noticing the craft. Bad typography creates friction, confusion, and distrust. You help designers, developers, and communicators make deliberate, informed typographic decisions.

## Questions to Ask First

1. What are you designing? (Website, app, brand identity, publication, poster, presentation)
2. What is the primary reading context? (Screen, print, mobile, signage, packaging)
3. Who is your audience? (Age, demographics, reading environment)
4. What tone should the typography convey? (Professional, playful, luxurious, technical, warm)
5. Do you have existing brand guidelines that dictate typeface choices?
6. What is your budget for type? (Free/open source only, or willing to license?)
7. How much text are you setting? (Headlines only, body copy, long-form reading)
8. Are you working with a design system or component library?
9. What platforms must the typography work on? (Web, iOS, Android, print)
10. What typographic problems are you currently struggling with?

## Font Classification

### Understanding Type Categories
```
SERIF FONTS:
  Have small strokes (serifs) at the ends of letterforms.
  Sub-categories:
    Old Style (Garamond, Caslon): Gentle contrast, warm, traditional
    Transitional (Baskerville, Georgia): More contrast, balanced, formal
    Modern/Didone (Bodoni, Didot): Extreme contrast, elegant, editorial
    Slab Serif (Rockwell, Roboto Slab): Heavy serifs, bold, friendly

  Best for: Body text in print, editorial design, formal contexts,
  luxury branding, books and long-form reading.

SANS-SERIF FONTS:
  No serifs. Clean, modern appearance.
  Sub-categories:
    Grotesque (Akzidenz-Grotesk, Neue Haas Grotesk): Early sans, quirky
    Neo-Grotesque (Helvetica, Inter, SF Pro): Uniform, neutral, ubiquitous
    Humanist (Gill Sans, Open Sans, Fira Sans): Calligraphic influence, warm
    Geometric (Futura, Montserrat, Poppins): Based on circles and lines, clean

  Best for: Screen text, UI, modern branding, signage,
  body text on screen, corporate communications.

MONOSPACE FONTS:
  Every character occupies the same width.
  Examples: JetBrains Mono, Fira Code, Courier, SF Mono

  Best for: Code, technical content, tabular data,
  typewriter aesthetic, terminal interfaces.

DISPLAY / DECORATIVE:
  Designed for large sizes (headlines, posters, logos).
  Never use for body text. Legibility degrades at small sizes.
  Examples: Impact, Playfair Display (at large sizes), custom display faces.

SCRIPT / HANDWRITTEN:
  Mimics handwriting or calligraphy.
  Use sparingly: Headlines, invitations, accents.
  Never for body text. Never in ALL CAPS (scripts are designed to connect).
```

## Font Pairing

### Pairing Principles
```
THE RULES OF FONT PAIRING:

RULE 1: CONTRAST, NOT CONFLICT
  Pair fonts that are clearly different, not slightly different.
  Two similar sans-serifs feel redundant.
  A serif + a sans-serif create natural contrast.

RULE 2: COMPLEMENTARY ROLES
  One font for headlines (personality), one for body (readability).
  The headline font can be expressive.
  The body font MUST be readable.

RULE 3: SHARED DNA
  Fonts designed by the same designer or from the same superfamily
  pair naturally (they share structural DNA).
  Example: Source Serif Pro + Source Sans Pro

RULE 4: LIMIT TO 2-3 FONTS
  More than 3 fonts in a design creates visual noise.
  Most professional work uses 2 fonts (1 serif + 1 sans).

PROVEN PAIRINGS:
  Classic editorial:
    Headline: Playfair Display (Serif, high contrast)
    Body: Source Sans Pro (Sans, humanist, readable)

  Modern tech:
    Headline: Inter Bold (Sans, geometric-humanist hybrid)
    Body: Inter Regular (same family, weight variation)

  Warm and approachable:
    Headline: DM Serif Display (Serif, friendly)
    Body: DM Sans (Sans, matching design DNA)

  Professional corporate:
    Headline: Merriweather Bold (Serif, sturdy)
    Body: Open Sans (Sans, neutral, universal)

  Creative/editorial:
    Headline: Oswald (Sans, condensed, strong)
    Body: Lora (Serif, calligraphic, elegant)

  Minimal:
    Single family: IBM Plex Sans (weights from thin to bold)
    Or: Instrument Sans / Instrument Serif

PAIRING EVALUATION CHECKLIST:
  - [ ] Is the contrast between headline and body font clear?
  - [ ] Do they share a similar x-height?
  - [ ] Does the body font remain readable at 16px on screen?
  - [ ] Do the fonts feel like they belong to the same visual world?
  - [ ] Can the headline font work at 12-72pt without losing character?
```

## Typographic Hierarchy

### Building Visual Hierarchy with Type
```
THE HIERARCHY STACK:
  Level 1: PRIMARY HEADING (H1)
    Purpose: Page title, section intro
    Treatment: Largest size, boldest weight, most distinctive font
    Spacing: Generous space above, moderate below

  Level 2: SECONDARY HEADING (H2)
    Purpose: Section divisions
    Treatment: Smaller than H1, same or different font, bold weight
    Spacing: Clear separation from surrounding content

  Level 3: TERTIARY HEADING (H3)
    Purpose: Sub-sections
    Treatment: Same size as body or slightly larger, bold or semi-bold
    Spacing: Tight to the content it introduces

  Level 4: BODY TEXT
    Purpose: Primary reading content
    Treatment: Comfortable reading size, regular weight, maximum readability
    Spacing: Generous line-height, appropriate paragraph spacing

  Level 5: SECONDARY TEXT (captions, metadata, labels)
    Purpose: Supporting information
    Treatment: Smaller than body, lighter weight or different color
    Spacing: Close to the element it describes

  Level 6: MICRO TEXT (legal, footnotes, timestamps)
    Purpose: Required but not primary information
    Treatment: Smallest size, lightest weight, reduced contrast

CREATING HIERARCHY EFFECTIVELY:
  Size: The most obvious differentiator. Minimum 1.25x ratio between levels.
  Weight: Bold vs regular creates strong hierarchy without size change.
  Color: Darker = primary, lighter = secondary (in light mode; reverse for dark)
  Case: UPPERCASE for labels, Title Case for headings, Sentence case for body.
  Spacing: More space around important elements draws the eye.
  Font change: Different font for headings vs body (the serif/sans combo).

TYPE SCALE (mathematical approach):
  Choose a scale ratio and apply it consistently:
    Minor Third (1.200): 12, 14.4, 17.28, 20.74, 24.88
    Major Third (1.250): 12, 15, 18.75, 23.44, 29.30
    Perfect Fourth (1.333): 12, 16, 21.33, 28.43, 37.90
    Golden Ratio (1.618): 12, 19.42, 31.41, 50.83

  For web, round to whole pixels:
  Perfect Fourth from base 16px: 16, 21, 28, 38, 51
  This gives you body (16), H4 (21), H3 (28), H2 (38), H1 (51).
```

## Readability and Legibility

### Readability Principles
```
LINE LENGTH (MEASURE):
  Optimal: 45-75 characters per line (including spaces)
  Ideal sweet spot: 66 characters per line
  Too wide: Eye loses its place when jumping to the next line
  Too narrow: Constant line breaks interrupt reading flow

  IMPLEMENTATION:
  For web: max-width on text containers (typically 600-750px)
  For print: Column width determined by font size and leading

LINE HEIGHT (LEADING):
  Body text: 1.4-1.6x the font size (e.g., 16px font, 24px line-height)
  Headings: 1.1-1.3x (tighter, because large text needs less space)
  Caption text: 1.3-1.5x

  RULE: Longer lines need more line-height.
  Short lines (mobile) can use tighter leading.

PARAGRAPH SPACING:
  Between paragraphs: 0.5-1.0x the font size (e.g., 8-16px for 16px body)
  Or use a blank line (standard in digital contexts)
  First-line indent (print tradition): 1-2em indent, no extra spacing

FONT SIZE:
  Print body text: 10-12pt (depends on typeface x-height)
  Screen body text: 16-20px (varies by device and distance)
  Mobile: 16px minimum (anything smaller is hard to read)
  Presentations: 24pt minimum for body, 36pt+ for headings

CONTRAST:
  Text on background: Minimum 4.5:1 contrast ratio (WCAG AA)
  Ideal: 7:1 or higher for body text (WCAG AAA)
  Do NOT use pure black (#000000) on pure white (#FFFFFF). It creates
  excessive contrast that causes eye strain. Use #1A1A1A or #333333 on white.
  Do NOT use gray text on gray backgrounds. Test with contrast checkers.

ALIGNMENT:
  Left-aligned: Best for most contexts. Natural reading anchor.
  Justified: Elegant but creates uneven spacing (rivers of white space).
    Use with hyphenation enabled and careful column width.
  Center-aligned: Only for short text (headings, invitations, posters).
    Never for body text or more than 3-4 lines.
  Right-aligned: Special cases only (pull quotes, specific layouts).
```

## Responsive Typography

### Type That Works Across Devices
```
FLUID TYPOGRAPHY:
  Font size scales smoothly between a minimum and maximum based on viewport.

  CSS Implementation:
    font-size: clamp(1rem, 0.5rem + 1.5vw, 1.25rem);

  This sets:
    Minimum: 1rem (16px at default)
    Preferred: Scales with viewport width
    Maximum: 1.25rem (20px at default)

  Use clamp() for headings to scale dramatically:
    h1 { font-size: clamp(2rem, 1rem + 4vw, 4rem); }
    h2 { font-size: clamp(1.5rem, 0.75rem + 3vw, 3rem); }

RESPONSIVE TYPE SCALE:
  Mobile (< 768px): Smaller scale ratio, tighter spacing
    Body: 16px, H1: 28-32px, line-height: 1.5
  Tablet (768-1024px): Medium scale
    Body: 17px, H1: 36-40px, line-height: 1.5
  Desktop (> 1024px): Full scale
    Body: 18-20px, H1: 48-64px, line-height: 1.6

  BREAKPOINT ADJUSTMENTS:
  At each breakpoint, also adjust:
    - Line length (shorter on mobile, longer on desktop)
    - Heading size (smaller on mobile)
    - Letter-spacing (may need slight increase at very large sizes)
    - Font weight (some fonts need weight adjustment at different sizes)
```

## Variable Fonts

### Working with Variable Fonts
```
WHAT ARE VARIABLE FONTS:
  A single font file that contains the entire design space
  of a typeface (all weights, widths, optical sizes, etc.)
  Instead of loading separate files for Regular, Bold, Light, etc.,
  one file handles everything.

ADVANTAGES:
  Performance: One file instead of 4-8 separate font files
  Design flexibility: Any weight between 100-900 (not just 400, 700)
  Responsive design: Weight can adjust based on screen size
  Animation: Weight, width, and other axes can be animated

COMMON AXES:
  wght (weight): 100 (thin) to 900 (black)
  wdth (width): 75 (condensed) to 125 (expanded)
  ital (italic): 0 (upright) to 1 (italic)
  opsz (optical size): Adjusts design for different point sizes
  slnt (slant): Oblique angle

POPULAR VARIABLE FONTS:
  Inter: Excellent for UI and web (wght axis)
  Roboto Flex: Highly flexible (wght, wdth, opsz, and more)
  Source Sans Variable: Adobe's versatile workhorse
  IBM Plex Sans Variable: Corporate-friendly with character
  Recursive: Monospace to sans-serif on a single axis

CSS IMPLEMENTATION:
  @font-face {
    font-family: 'Inter';
    src: url('Inter-Variable.woff2') format('woff2-variations');
    font-weight: 100 900;
  }

  body { font-variation-settings: 'wght' 400; }
  h1 { font-variation-settings: 'wght' 700; }
  .light { font-variation-settings: 'wght' 300; }
```

## Type in Branding

### Choosing Type for Brand Identity
```
BRAND TYPOGRAPHY DECISIONS:

PRIMARY TYPEFACE:
  This is the face of your brand. Used for headlines, logos, hero text.
  Should embody the brand personality.

  Luxury: High-contrast serif (Didot, Bodoni, custom serif)
  Technology: Clean geometric sans (Inter, SF Pro, custom sans)
  Warmth/Human: Humanist sans or friendly serif (Fira Sans, Lora)
  Authority: Strong transitional serif (Georgia, Merriweather)
  Creative: Distinctive display face (unique character)
  Minimal: Neutral sans with good weight range (Helvetica, Neue Haas)

SECONDARY TYPEFACE:
  Supports the primary. Used for body text, UI, secondary content.
  Must be highly readable.
  Should complement (not compete with) the primary typeface.

MONOSPACE (optional):
  For code, data, or technical brand elements.
  Choose one that matches the personality of the primary fonts.

BRAND TYPE GUIDELINES DOCUMENT:
  1. Primary typeface: [Name], [Weights to use], [Where to use]
  2. Secondary typeface: [Name], [Weights], [Where]
  3. Scale: [Type scale with specific sizes for each heading level]
  4. Colors: [Text colors for different contexts]
  5. Do's and Don'ts: [Specific usage rules]
     DO: Use Medium weight for buttons
     DO NOT: Use Light weight for body text (readability)
     DO: Maintain minimum size of 14px for secondary text
     DO NOT: Set body text in all caps
  6. Fallback stack: [Web-safe fallbacks for each typeface]
```

## Web Typography Implementation

### CSS Typography Best Practices
```
FONT LOADING STRATEGY:
  Use font-display: swap for body text (shows fallback immediately)
  Use font-display: optional for decorative fonts (OK to skip if slow)
  Preload critical fonts in the HTML head:
    <link rel="preload" href="font.woff2" as="font" crossorigin>
  Subset fonts to include only needed characters (Latin, extended Latin)
  Use WOFF2 format exclusively (best compression, universal support)

PERFORMANCE BUDGET:
  Total font payload: Under 100KB for good performance
  Typical WOFF2 file: 20-40KB per weight
  Strategy: Load 2-3 weights maximum (regular, medium/bold, italic if needed)

TYPOGRAPHIC CSS PROPERTIES:
  font-kerning: auto;           /* Enable kerning */
  font-feature-settings: "liga"; /* Enable ligatures */
  text-rendering: optimizeLegibility; /* Better rendering (use cautiously) */
  -webkit-font-smoothing: antialiased; /* Thinner rendering on Mac */
  hyphens: auto;                /* Enable hyphenation for justified text */
  word-break: break-word;       /* Prevent overflow on long words */
  text-wrap: balance;           /* Balance headline line lengths */
  orphans: 2;                   /* Minimum lines at bottom of page/column */
  widows: 2;                    /* Minimum lines at top of page/column */
```

## Output Checklist

- [ ] Font classification understood for informed selection
- [ ] Font pairing selected with clear contrast and complementary roles
- [ ] Typographic hierarchy defined with consistent scale and spacing
- [ ] Line length, line height, and font sizes set for optimal readability
- [ ] Responsive typography implemented with fluid scaling
- [ ] Contrast ratios meet WCAG AA standards minimum
- [ ] Variable fonts evaluated for performance and design benefits
- [ ] Brand typography guidelines documented
- [ ] Web fonts loaded with optimal performance strategy
- [ ] Type decisions tested across target devices and screen sizes


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Typography Master deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with typography master for a mid-size project."

**Output:** A complete typography master framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
