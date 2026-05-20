---
name: color-palette-design
description: |
  Produces a complete color palette with primary, secondary, and neutral colors including hex codes, tint/shade scales, semantic color assignments, and WCAG contrast verification.
  Use when the user asks to create a color palette, choose brand colors, define color tokens, check color contrast for accessibility, or build a color system.
  Do NOT use for full design system tokens (use design-system-foundations), typography choices (use typography-system), or full brand identity (use brand-identity-brief).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design template accessibility"
  category: "design-creative"
  subcategory: "graphic-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Color Palette Design

## When to Use

**Use this skill when:**
- The user asks to create a color palette for a website, mobile app, SaaS product, or brand from scratch
- The user has an existing brand color (e.g., a logo hex code) and needs a full system built around it
- The user needs to verify whether color combinations pass WCAG AA or AAA contrast requirements for accessibility compliance
- The user wants tint and shade scales (the "50–900" scale used in systems like Tailwind CSS or Material Design) for one or more colors
- The user needs semantic color assignments for UI states: success, warning, error, info, disabled
- The user wants a dark mode color mapping from an existing light mode palette
- The user is building a design token foundation and needs raw color values before naming and referencing them in code
- The user is auditing an existing palette for contrast failures, visual inconsistency, or accessibility gaps

**Do NOT use when:**
- The user wants a complete design system including spacing scales, elevation, radius, and motion tokens -- use `design-system-foundations` instead
- The user wants font pairings, type scale, or typographic hierarchy -- use `typography-system` instead
- The user wants a full brand identity including logo direction, voice, and positioning -- use `brand-identity-brief` instead
- The user wants to generate or prompt images with specific color aesthetics for AI art -- use an AI image generation skill instead
- The user wants icon design, illustration style, or photography art direction -- color is a component of those but the primary need is different
- The user already has a complete, validated palette and only needs it formatted as CSS custom properties or design tokens -- use `design-token-export` instead

---

## Process

### Step 1 -- Gather Color Requirements

Ask the user for the following before generating anything. If the conversation already contains enough context, extract these values without asking.

- **Purpose:** Web app interface, mobile app, marketing site, print collateral, data visualization, or brand identity. Each context has different constraints (e.g., screen vs. print gamut, small UI elements vs. large hero images).
- **Mood and tone:** Professional and institutional, playful and energetic, luxurious and restrained, clinical and precise, natural and organic, technical and futuristic. Mood maps directly to saturation (muted = professional, vibrant = energetic) and hue temperature (warm = approachable, cool = trustworthy).
- **Existing colors:** Any hex codes already committed to -- logo color, existing brand guidelines, a color the user "just likes." If a hex code is provided, it becomes the primary-500 anchor and the scale is derived around it.
- **Industry context:** Healthcare (blues, greens, clean neutrals -- avoid aggressive reds for non-emergency contexts), finance (blues, dark greens, conservative neutrals), education (blues, oranges, accessible contrasts), food and hospitality (warm reds, oranges, earthy neutrals), technology (blues, purples, cool grays), sustainability and environmental (greens, earthy browns, natural tones).
- **Accessibility target:** WCAG 2.1 AA (4.5:1 normal text, 3:1 large text and UI components) is the minimum for most web products. WCAG AAA (7:1 normal text) is required for government, healthcare, and highly regulated industries. Confirm the requirement explicitly.
- **Dark mode requirement:** Yes or no. If yes, plan the semantic color mappings to invert cleanly.
- **Print requirement:** If physical print is in scope, CMYK gamut limitations apply. Many saturated screen colors -- especially bright cyans and vivid greens -- cannot be accurately reproduced in CMYK.
- **Colors to avoid:** Cultural associations (white signals mourning in some East Asian contexts, green has political associations in some regions), competitor brand colors, or user personal preferences.

---

### Step 2 -- Select a Color Harmony Model

Choose the harmonic relationship between the primary, secondary, and accent colors. This is not aesthetic preference -- it is structural.

| Harmony | Construction Method | Best Application |
|---|---|---|
| Monochromatic | Single hue, varying saturation (S) and lightness (L) in HSL | Minimal products, luxury brands, portfolios, B2B SaaS |
| Analogous | 2--3 hues within 30° of each other on the HSL wheel | Consumer apps, lifestyle brands, natural/organic products |
| Complementary | Two hues 180° apart on the HSL wheel | High-contrast marketing, sports, food, entertainment |
| Split-complementary | Base hue + two hues 150° away (not the direct complement) | Balanced contrast without visual harshness; versatile |
| Triadic | Three hues at 120° intervals | Creative agencies, gaming, children's education |
| Tetradic/Square | Four hues at 90° intervals | Complex applications needing multiple category colors; requires careful weighting |

**Decision rule:** For product UI, default to analogous or split-complementary. Complementary harmonies are visually aggressive and require restraint in UI contexts -- they work for CTAs and marketing but not for whole-product color systems. Monochromatic is the safest choice for conservative industries.

**HSL as the working model:** Always reason about hue, saturation, and lightness (HSL) when constructing scales, even though you deliver output in hex. Converting a hex like #10B981 to HSL (160°, 84%, 39%) allows you to make principled adjustments: rotate the hue to find analogous colors, reduce saturation for neutrals, and adjust lightness systematically for scale steps.

---

### Step 3 -- Anchor and Validate the Primary Color

The primary-500 is the most important decision. Everything else derives from it.

- **If the user provides a hex:** Convert it to HSL. Confirm the lightness is in the 35--55% range for optimal flexibility. If it is too light (L > 65%) or too dark (L < 25%), note that it will not serve as a button background with both white and dark text -- recommend adjusting or using it as primary-400 or primary-600 instead.
- **If no hex is provided:** Choose a starting hue based on industry conventions, then set saturation to 65--80% (professional but not garish) and lightness to 42--48% (produces a color with reasonable contrast against both white and dark text at the right scale steps).
- **Hue selection by industry convention:**
  - Trust and finance: 210--230° (medium blue)
  - Health and wellness: 140--170° (green) or 200--220° (medical blue)
  - Energy and action: 10--30° (orange-red) or 340--360° (red)
  - Nature and sustainability: 85--130° (yellow-green to green)
  - Technology and innovation: 240--270° (blue-violet to purple)
  - Luxury and premium: 0° at very low saturation (near-black) or 270--290° (deep violet)
- **Test the anchor immediately:** White text (#FFFFFF) on primary-500 must achieve at least 3:1 contrast. If it does not, the base is too light and will require using primary-600 or darker for button backgrounds.

---

### Step 4 -- Generate the 10-Step Tint/Shade Scale

For each core color (primary, secondary, and any accent), generate a 10-step scale using the 50--900 naming convention. This is the same convention used by Tailwind CSS, Material Design, and Radix UI, making it immediately familiar to developers.

**Construction method using HSL:**
- Hold the hue constant (or allow ±3° of drift for visual warmth/coolness at extremes).
- **50:** L ≈ 97%, S reduced to 30--50% of base saturation. Near-white with a color whisper.
- **100:** L ≈ 93%, S ≈ 50--60% of base saturation.
- **200:** L ≈ 86%, S ≈ 65--75% of base saturation.
- **300:** L ≈ 74%, S ≈ 75--85% of base saturation.
- **400:** L ≈ 62%, S ≈ 85--95% of base saturation.
- **500:** L = base lightness (anchor). S = base saturation.
- **600:** L ≈ base - 8%, S slightly increased (+3--5%) to avoid looking washed out.
- **700:** L ≈ base - 18%, S slightly increased.
- **800:** L ≈ base - 28%, S reduced to 60--70% of base (deep colors lose punch if over-saturated).
- **900:** L ≈ base - 36%, S further reduced. Near-black with color undertone.

**Critical spacing rule:** The perceptual difference between each step must be roughly equal. If the 300 and 400 look nearly identical, widen the lightness gap. Avoid bunching steps in the middle of the scale.

**Usage assignments per step:**
- 50: Page tinted background, selected row background, subtle section divider
- 100: Badge background, tag background, light-mode alert background
- 200: Hover state for list items, interactive surface hover
- 300: Border color for interactive elements, progress bar background
- 400: Icon fill (on white or light backgrounds), secondary inactive text
- 500: Primary interactive color -- buttons, links, active tab indicators, focus rings
- 600: Hover state for primary buttons and links
- 700: Pressed/active state; text color when color is used as text on light backgrounds
- 800: High-emphasis text in color (headings on white backgrounds with strong contrast)
- 900: Maximum contrast variant; rarely used directly, reserved for overlay text

---

### Step 5 -- Define Secondary and Accent Colors

Apply the same 10-step method to secondary and accent hues.

**Secondary color guidance:**
- The secondary color shares the workload of the primary without competing with it.
- For analogous harmony: secondary hue is 20--35° away from primary.
- For split-complementary: secondary is 150° away.
- Secondary saturation should be 10--20% lower than primary, or lightness 5--8% higher at the 500 step, so the eye naturally reads primary as dominant.
- Secondary is used for: secondary buttons (outlined style), category labels, navigation sub-items, data visualization second series.

**Accent color guidance:**
- Accent is a single high-energy color used only for attention-critical moments: promotional banners, "new feature" badges, pricing callouts, notification badges.
- Accent should contrast with both the primary and secondary -- often a complementary or triadic relationship.
- Limit accent presence to less than 5% of any screen. If it appears more than that, it is no longer accent -- it is a third primary.
- Accent does NOT need a full 10-step scale in most products. Generate 100 (bg), 500 (base), and 700 (text/dark) only unless the project scope requires more.

---

### Step 6 -- Construct the Neutral Scale

Neutrals are the backbone of every UI. They carry the bulk of text, backgrounds, and borders. A poorly designed neutral scale is the most common source of visual incoherence in products.

**Undertone strategy:**
- Pure grays (HSL: H=0, S=0%) look clinical and flat. Nearly every successful product uses chromatic neutrals -- grays with a subtle hue tint.
- The neutral hue should match the primary color's temperature: warm primary (oranges, reds, yellows) → warm neutral (hue 30--45°, S 4--8%); cool primary (blues, greens) → cool neutral (hue 200--220°, S 4--8%).
- Keep saturation below 10% for neutrals. Above 10% the neutrals read as colors, not neutral grays.

**10-step neutral construction:**
- Neutral-50: L ≈ 98%, S 3--6%. Page background. Should read as white at a glance.
- Neutral-100: L ≈ 95%, S 4--6%. Card and panel background on neutral-50 pages.
- Neutral-200: L ≈ 90%, S 5--7%. Borders, dividers, table row alternate fill.
- Neutral-300: L ≈ 80%, S 6--8%. Disabled element borders, skeleton loader color.
- Neutral-400: L ≈ 65%, S 7--9%. Placeholder text, muted icons, secondary captions.
- Neutral-500: L ≈ 50%, S 7--9%. Supporting body text (captions, labels, metadata).
- Neutral-600: L ≈ 38%, S 7--9%. Primary body text -- paragraphs, list items.
- Neutral-700: L ≈ 27%, S 6--8%. Section headings, subheadings.
- Neutral-800: L ≈ 17%, S 5--7%. Display headings, high-emphasis text.
- Neutral-900: L ≈ 9%, S 4--6%. Maximum contrast text. Near-black with color undertone.

**Critical rule:** Never use pure #000000 for text. Neutral-900 at L ≈ 9% with a hint of saturation produces softer, more visually comfortable text on screen while still achieving >15:1 contrast against white.

---

### Step 7 -- Define Semantic Colors

Semantic colors are non-negotiable for any UI product. They communicate system state. They must be recognizable regardless of the brand palette.

**Success (green family):**
- Base hue: 130--160° (true green to emerald). Avoid yellow-greens (80--120°), which read as caution in context.
- Exception: If the primary is already green, shift the success hue slightly warmer (140--150°) or use a blue-green (165--175°) and differentiate with saturation.
- Success-500: The action color. Success-100: Alert/banner background. Success-700: Alert text.
- Usage: Completed steps, positive balance, successful transactions, form validation passed.

**Warning (amber/yellow family):**
- Base hue: 35--45° (amber). Pure yellow (60°) fails WCAG contrast on white backgrounds at any useful lightness and should be avoided for text.
- Warning-500 on white background typically achieves only 2.5--3.0:1 contrast -- insufficient for text. Use warning-700 for warning text on warning-100 backgrounds.
- Usage: Approaching limits, pending states, caution notices, reversible destructive actions.

**Error (red family):**
- Base hue: 0--10° (true red to red-orange). Avoid pink-reds (340--360°) for error -- they read as brand accent, not danger.
- Error is the highest-urgency semantic color. It must be immediately distinguishable from the primary brand color.
- Usage: Failed transactions, validation errors, deleted states, destructive action confirmations.

**Info (blue family):**
- Base hue: 205--225° (sky to cornflower blue). If the primary brand color is blue, shift info to 190--200° (cyan-blue) to differentiate.
- Usage: Informational tooltips, help text, neutral system notifications, new feature announcements.

**Each semantic color must have three variants:**
- Light (100-equivalent): Background for alert boxes, banners, inline notifications. Low saturation, very light.
- Base (500-equivalent): Icon color, border color for the alert box, badge background.
- Dark (700-equivalent): Text color within alert boxes on the light background. Must pass 4.5:1 against the light variant.

---

### Step 8 -- Calculate and Verify WCAG Contrast

WCAG contrast ratio is calculated using the relative luminance formula (WCAG 2.x). The ratio ranges from 1:1 (no contrast, identical colors) to 21:1 (pure black on pure white).

**Key thresholds:**
- **WCAG AA normal text (< 18px regular or < 14px bold):** Minimum 4.5:1
- **WCAG AA large text (≥ 18px regular or ≥ 14px bold):** Minimum 3:1
- **WCAG AA UI components and graphical objects (icons, borders, chart lines):** Minimum 3:1
- **WCAG AAA normal text:** Minimum 7:1
- **WCAG AAA large text:** Minimum 4.5:1

**Required pairings to verify for every palette:**
1. White (#FFFFFF) on primary-500 -- determines if the base color works for button backgrounds
2. White (#FFFFFF) on primary-600 -- the typical button background
3. Primary-700 on white -- color as text on light backgrounds
4. Primary-800 on white -- high-emphasis color text
5. Neutral-600 on neutral-50 -- body text on page background
6. Neutral-700 on neutral-50 -- heading text on page background
7. Neutral-400 on neutral-50 -- placeholder/disabled text (intentionally may be < 4.5:1 for disabled state)
8. Error-700 on error-100 -- error text on error background
9. Warning-700 on warning-100 -- warning text on warning background
10. Success-700 on success-100 -- success text on success background
11. White on primary-500 and primary-600 for buttons

**Relative luminance formula (for manual calculation):**
Convert each RGB channel to linear: if channel/255 ≤ 0.04045, divide by 12.92; else use ((channel/255 + 0.055) / 1.055)^2.4. Then: L = 0.2126×R + 0.7152×G + 0.0722×B. Contrast = (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color.

**Reporting:** Always state the computed ratio, the required threshold, and PASS or FAIL. If a common pairing fails, propose a fix (use a darker step, use primary-600 instead of primary-500, etc.) rather than just flagging it.

---

## Output Format

```
## Color Palette: [Project Name]

### Color Strategy
- **Harmony Type:** [Monochromatic / Analogous / Complementary / Split-Complementary / Triadic]
- **Primary Hue:** [Hue in degrees]° -- [color name]
- **Industry Context:** [e.g., fintech, healthcare, consumer app]
- **Accessibility Target:** WCAG [AA / AAA]
- **Dark Mode:** [Yes / No]
- **Rationale:** [2--3 sentences explaining why these specific colors serve the project]

---

### Primary Color: [Color Name]
**Base (500):** #[hex] -- HSL([H]°, [S]%, [L]%)

| Step | Hex     | RGB                | Usage                                   |
|------|---------|--------------------|-----------------------------------------|
| 50   | #[hex]  | rgb([R], [G], [B]) | Page tinted bg, selected row bg         |
| 100  | #[hex]  | rgb([R], [G], [B]) | Badge bg, alert bg, light tag           |
| 200  | #[hex]  | rgb([R], [G], [B]) | List item hover, surface hover          |
| 300  | #[hex]  | rgb([R], [G], [B]) | Interactive borders, progress bar track |
| 400  | #[hex]  | rgb([R], [G], [B]) | Icon fill on light bg, inactive label   |
| 500  | #[hex]  | rgb([R], [G], [B]) | PRIMARY: buttons, links, active tabs    |
| 600  | #[hex]  | rgb([R], [G], [B]) | Button hover, link hover                |
| 700  | #[hex]  | rgb([R], [G], [B]) | Button pressed, color-as-text on light  |
| 800  | #[hex]  | rgb([R], [G], [B]) | High-emphasis color text, dark headings |
| 900  | #[hex]  | rgb([R], [G], [B]) | Max contrast, overlay text              |

---

### Secondary Color: [Color Name]
**Base (500):** #[hex] -- HSL([H]°, [S]%, [L]%)

| Step | Hex     | RGB                | Usage                                   |
|------|---------|--------------------|-----------------------------------------|
| 50   | #[hex]  | rgb([R], [G], [B]) | Secondary tinted bg                     |
| 100  | #[hex]  | rgb([R], [G], [B]) | Secondary badge bg, light tag           |
| 200  | #[hex]  | rgb([R], [G], [B]) | Secondary hover bg                      |
| 300  | #[hex]  | rgb([R], [G], [B]) | Category borders                        |
| 400  | #[hex]  | rgb([R], [G], [B]) | Secondary icon fill                     |
| 500  | #[hex]  | rgb([R], [G], [B]) | Secondary buttons, category indicators  |
| 600  | #[hex]  | rgb([R], [G], [B]) | Secondary hover                         |
| 700  | #[hex]  | rgb([R], [G], [B]) | Secondary pressed, secondary text       |
| 800  | #[hex]  | rgb([R], [G], [B]) | High-contrast secondary text            |
| 900  | #[hex]  | rgb([R], [G], [B]) | Max contrast secondary                  |

---

### Accent Color: [Color Name] (if applicable)
**Base:** #[hex] -- HSL([H]°, [S]%, [L]%)

| Variant | Hex    | RGB                | Usage                                    |
|---------|--------|--------------------|------------------------------------------|
| Light   | #[hex] | rgb([R], [G], [B]) | Promo banner bg, highlight bg            |
| Base    | #[hex] | rgb([R], [G], [B]) | Badge fill, notification dot, CTA accent |
| Dark    | #[hex] | rgb([R], [G], [B]) | Accent text on light bg                  |

---

### Neutral Scale: [Warm / Cool / True] Gray with [hue] undertone
**Undertone:** HSL([H]°, [S]%, variable L%)

| Step | Hex     | RGB                | Usage                                   |
|------|---------|--------------------|-----------------------------------------|
| 50   | #[hex]  | rgb([R], [G], [B]) | Page background                         |
| 100  | #[hex]  | rgb([R], [G], [B]) | Card bg, panel bg, alt table row        |
| 200  | #[hex]  | rgb([R], [G], [B]) | Borders, dividers, table lines          |
| 300  | #[hex]  | rgb([R], [G], [B]) | Disabled borders, skeleton loaders      |
| 400  | #[hex]  | rgb([R], [G], [B]) | Placeholder text, muted icons, captions |
| 500  | #[hex]  | rgb([R], [G], [B]) | Supporting text, metadata, labels       |
| 600  | #[hex]  | rgb([R], [G], [B]) | Primary body text, list items           |
| 700  | #[hex]  | rgb([R], [G], [B]) | Section headings, subheadings           |
| 800  | #[hex]  | rgb([R], [G], [B]) | Display headings, high-emphasis text    |
| 900  | #[hex]  | rgb([R], [G], [B]) | Max contrast text, near-black           |

---

### Semantic Colors
| Purpose | Light (bg/100) | Base (500)  | Dark (text/700) | WCAG (dark on light) | Usage                                |
|---------|----------------|-------------|-----------------|----------------------|--------------------------------------|
| Success | #[hex]         | #[hex]      | #[hex]          | [X.X]:1 -- [PASS]   | Completed states, positive feedback  |
| Warning | #[hex]         | #[hex]      | #[hex]          | [X.X]:1 -- [PASS]   | Caution, limits, pending states      |
| Error   | #[hex]         | #[hex]      | #[hex]          | [X.X]:1 -- [PASS]   | Failures, validation errors          |
| Info    | #[hex]         | #[hex]      | #[hex]          | [X.X]:1 -- [PASS]   | Informational, tips, neutral alerts  |

---

### WCAG Contrast Verification
| Foreground         | Background      | Hex Codes             | Ratio   | Required | Result         |
|--------------------|-----------------|-----------------------|---------|----------|----------------|
| white              | primary-500     | #FFF on #[hex]        | [X.X]:1 | 4.5:1    | [PASS / FAIL]  |
| white              | primary-600     | #FFF on #[hex]        | [X.X]:1 | 4.5:1    | [PASS / FAIL]  |
| primary-700        | white           | #[hex] on #FFF        | [X.X]:1 | 4.5:1    | [PASS / FAIL]  |
| primary-800        | white           | #[hex] on #FFF        | [X.X]:1 | 4.5:1    | [PASS / FAIL]  |
| neutral-600        | neutral-50      | #[hex] on #[hex]      | [X.X]:1 | 4.5:1    | [PASS / FAIL]  |
| neutral-700        | neutral-50      | #[hex] on #[hex]      | [X.X]:1 | 4.5:1    | [PASS / FAIL]  |
| neutral-400        | neutral-50      | #[hex] on #[hex]      | [X.X]:1 | 4.5:1    | INFORMATIONAL  |
| error-700          | error-100       | #[hex] on #[hex]      | [X.X]:1 | 4.5:1    | [PASS / FAIL]  |
| warning-700        | warning-100     | #[hex] on #[hex]      | [X.X]:1 | 4.5:1    | [PASS / FAIL]  |
| success-700        | success-100     | #[hex] on #[hex]      | [X.X]:1 | 4.5:1    | [PASS / FAIL]  |
| info-700           | info-100        | #[hex] on #[hex]      | [X.X]:1 | 4.5:1    | [PASS / FAIL]  |

**Contrast notes:** [List any FAIL results and the recommended fix, e.g., "Use primary-600 for button backgrounds instead of primary-500."]

---

### Dark Mode Mapping (if applicable)
| Token             | Light Mode Value | Dark Mode Value  | Rationale                          |
|-------------------|------------------|------------------|------------------------------------|
| bg-page           | neutral-50       | neutral-900      | Inverted background                |
| bg-surface        | neutral-100      | neutral-800      | Card/panel on page                 |
| bg-raised         | neutral-200      | neutral-700      | Elevated elements                  |
| border-default    | neutral-200      | neutral-700      | Dividers and outlines              |
| border-strong     | neutral-300      | neutral-600      | Input borders, card outlines       |
| text-primary      | neutral-800      | neutral-100      | Headings, high emphasis            |
| text-body         | neutral-600      | neutral-300      | Body text                          |
| text-muted        | neutral-400      | neutral-500      | Captions, metadata                 |
| color-interactive | primary-500      | primary-400      | Links and active indicators        |
| color-button-bg   | primary-600      | primary-500      | Button background                  |
| color-button-text | white            | white            | Button text                        |
| semantic-success  | success-500      | success-400      | Success icons and indicators       |
| semantic-error    | error-500        | error-400        | Error icons and indicators         |

---

### Usage Guidelines
1. [Primary usage rule -- frequency, contexts, constraints]
2. [Secondary usage rule -- relationship to primary, maximum presence]
3. [Neutral usage rule -- text, background, border assignments]
4. [Semantic color rule -- state communication, not decoration]
5. [Contrast rule -- which step to use for which context]
6. [Dark mode override note if applicable]
```

---

## Rules

1. **Always provide hex codes for every single color value.** Never describe a color as "a medium green" or "dark blue." Hex values are the contract. HSL is the working model; hex is the deliverable.

2. **White on primary-500 frequently fails WCAG AA for normal text.** This is the single most common accessibility failure in brand-new color systems. Always test this pairing and explicitly flag when the button background must be primary-600 or darker, not primary-500.

3. **Yellow and bright amber (hue 50--60°) cannot be used as text color on white backgrounds at any accessible lightness.** Yellow at L=50% achieves approximately 1.7:1 against white -- far below 4.5:1. Always use warning-700 (deep amber, L ≈ 25--30%) for warning text on light backgrounds, and use warning-500 only for icons and decorative elements.

4. **Neutral-400 may intentionally fail the 4.5:1 threshold.** This is by design for disabled and placeholder text. Flag it as INFORMATIONAL, not a failure. WCAG 2.1 explicitly exempts inactive UI components and decorative elements from contrast requirements. Never "fix" disabled text contrast by darkening it -- that makes it look active.

5. **Never generate a palette where two semantic colors share a hue within 20° of each other.** Error (red) and warning (amber) must be immediately distinguishable at a glance. If the primary brand color is orange-red, the error semantic color needs to be differentiated with saturation and darkness, not just hue -- add an icon or label alongside any red semantic element.

6. **The primary-500 must have reasonable contrast against BOTH white and primary-100.** If it fails against primary-100, the "active badge on light background" pattern breaks. Check this pairing if the user's use case includes tag or badge components.

7. **Do not reuse brand primary colors as semantic colors.** If the brand is green (#10B981), the success semantic color should be a different green (shifted ±15--20° hue) or a clearly distinct variant, not identical to the primary. Semantic colors and brand colors serve different cognitive functions and must never be interchangeable.

8. **Generate the neutral scale with a chromatic undertone that matches the primary's temperature, not its specific hue.** A blue-violet primary (250°) gets a cool neutral (undertone ~215°), not a purple-gray. Matching undertone temperature creates visual cohesion. Matching the exact hue makes the neutrals look like washed-out tints of the primary.

9. **Dark mode is not color inversion and it is not just darkening every color by 50%.** Dark mode requires remapping scale steps (primary-400 often replaces primary-500 for interactive elements) and changing which neutral step serves as body text vs. background. Surface layers in dark mode use slightly lighter neutrals to create depth, opposite of light mode. Always provide a mapping table when dark mode is required.

10. **The color palette is a system, not a collection.** Every color must have an assigned purpose. If a color has no defined usage, remove it. A palette with 40 colors and no usage rules is decorative. A palette with 15 colors and precise rules is a system. Enforce the constraint: primary + secondary + optional accent + neutral + 4 semantic families = a complete, functional palette.

---

## Edge Cases

### Single-Color Request ("Just give me a blue palette")
Generate a monochromatic palette using a single blue hue (choose an appropriate starting point such as 212° for a balanced sky-to-navy blue). Produce the full 10-step primary scale. For the neutral scale, derive cool grays using the same hue at S ≤ 8%. Add standard semantic colors using industry-standard hues -- green for success, amber for warning, red for error, and differentiate info blue from the primary blue by shifting the info hue 20--30° toward cyan (190--200°) to prevent confusion. Include the full WCAG verification table. Explain that a monochromatic palette works best when the product relies heavily on the neutral scale for layout and uses the blue only for interactive and branded elements.

### Dark Mode Primary Palette
Dark mode is not a simple inversion. Specific adjustments required:
- Page background: neutral-900 (not neutral-50 inverted to black)
- Surface layers: neutral-800 (cards on neutral-900), neutral-700 (popovers on neutral-800) -- each layer uses a slightly lighter neutral to create elevation hierarchy
- Interactive color: shift from primary-500 to primary-400. On dark backgrounds, a lighter primary step provides better visual punch and maintains contrast against dark surfaces. Primary-500 at typical luminance may achieve only 2.8:1 on neutral-800.
- Semantic colors on dark: shift success, error, warning, info each one step lighter (500 → 400) for similar reasons
- Text: neutral-100 for headings, neutral-300 for body, neutral-500 for muted -- these are not the exact inverses of the light mode steps but are tuned for perceptual balance on dark
- Always provide the full mapping table. Never just describe dark mode verbally.

### Colorblind-Accessible Palette
Approximately 8% of males and 0.5% of females have a form of color vision deficiency. Three major types require consideration:
- **Deuteranopia/Deuteranomaly (red-green, green deficiency -- most common):** Red and green are confused. Error (red) and success (green) will be indistinguishable. Mitigation: pair semantic color with an icon (✓ for success, ✗ for error, ⚠ for warning), never rely on hue alone. Adjust success green toward a more blue-green (155--165°) which is more distinguishable under deuteranopia simulation. Adjust error red toward a warmer red-orange (10--15°) rather than pure red (0°).
- **Protanopia/Protanomaly (red-green, red deficiency):** Similar to deuteranopia but reds appear darker. The same mitigations apply.
- **Tritanopia (blue-yellow -- rare):** Blue and green are confused, yellow and violet are confused. If using blue and green in the same semantic hierarchy, differentiate by saturation and lightness, not just hue.
- Flag any palette that uses red-green as the only difference between two data categories in charts or status indicators. Always add a secondary signal (pattern, shape, label).

### Extending an Existing Palette
When the user has partial colors but needs a complete system:
1. Collect all existing hex codes. Convert to HSL to identify the hue temperature and saturation register.
2. Identify which scale steps are already defined (e.g., they have a primary button color but no tint or shade scale).
3. Generate only the missing elements. Do not replace or suggest changing existing anchored colors unless they present accessibility failures -- in which case flag the issue and offer the fix as an option, not a directive.
4. Match saturation levels: if the existing palette is muted (S ≤ 50%), keep new additions muted. If it is vibrant (S ≥ 75%), match that energy.
5. For semantic colors in extended palettes: check that the existing primary color is not already too close in hue to a proposed semantic color (e.g., if brand primary is red, error red needs differentiation).

### Print-First or Print-Also Palette
When the palette must also work in print (brochures, packaging, business cards):
- Provide CMYK values alongside every hex. Hex is RGB; CMYK is the print model.
- **Gamut warning:** Saturated blues (hue 220--240°, S > 80%), vivid cyans (hue 180--200°, S > 85%), and bright greens (hue 120--160°, S > 80%) are often out of CMYK gamut. The printed version will look dull or shifted. Flag these colors explicitly with a note like: "This color is outside standard CMYK gamut. Recommended print substitute: [hex of gamut-safe alternative]."
- For brand hero colors that must be exactly reproduced in print (logos, packaging), recommend specifying a spot color (Pantone/PMS) rather than relying on process CMYK. The PMS system guarantees color consistency across printers.
- Neutrals print reliably in CMYK. Primary text and backgrounds are the safest print elements.

### Multiple Brand Colors Already Defined (Existing Brand Refresh)
When a user comes with 2+ existing brand colors and needs the full system:
1. Identify which is primary (highest visual weight in existing usage) and which is secondary.
2. Check whether the two existing colors already form a valid harmony. If they are 180° apart, they are complementary; if 30° apart, analogous. Name the harmony and note if it is unconventional.
3. Check whether white text on both colors passes WCAG AA. If either fails, discuss the button strategy: can the secondary always use outlined buttons (avoiding the contrast problem), or does it need a darkened variant?
4. Generate neutral scale from the primary's temperature.
5. For semantic colors: check whether any existing brand color is close in hue to a semantic standard (if one brand color is orange, the warning amber must be differentiated). Propose semantic adjustments and explain the cognitive conflict.

### High-Contrast or AAA Target
When WCAG AAA (7:1 normal text) is required:
- Primary-500 used as a text color on white must achieve 7:1. This requires L ≤ 35% in HSL. Many brand-vivid colors fail this at their natural saturation. Options: darken the primary text variant to primary-700 or primary-800, or inform the user that vivid/saturated brand colors are decorative and must be paired with neutral text for body copy.
- Background colors must be near-white or near-black for AAA body text. The "soft background" pattern (using primary-50 as a page background) may reduce the contrast of neutral-600 text below 7:1. Check neutral-600 on primary-50 explicitly for AAA targets.
- Interactive elements still only require 3:1 for WCAG AA -- focus rings, input borders, icon outlines do not need 7:1.

---

## Example

**Input:** "We're building a B2B project management SaaS. Our only existing color is our logo: #5B4FE8 (a purple). We need a full color palette that feels modern and professional, supports dark mode, and meets WCAG AA accessibility. Nothing too playful."

---

## Color Palette: Project Management SaaS

### Color Strategy
- **Harmony Type:** Analogous (violet primary, blue secondary)
- **Primary Hue:** 246° -- violet-blue
- **Industry Context:** B2B SaaS -- project management, team productivity
- **Accessibility Target:** WCAG 2.1 AA (4.5:1 normal text, 3:1 large text and UI components)
- **Dark Mode:** Yes -- full light/dark mapping provided
- **Rationale:** Violet communicates creativity and innovation while reading as professional and premium -- an established convention in B2B productivity software. Blue secondary reinforces trust and stability, a critical signal for enterprise decision-makers. Analogous harmony keeps the palette calm and coherent, avoiding the visual energy of complementary schemes that would conflict with dense data-heavy interfaces.

---

### Primary Color: Violet
**Base (500):** #5B4FE8 -- HSL(246°, 77%, 61%)

| Step | Hex     | RGB                  | Usage                                      |
|------|---------|----------------------|--------------------------------------------|
| 50   | #F3F2FD | rgb(243, 242, 253)   | Page tinted bg, selected row bg            |
| 100  | #E5E3FB | rgb(229, 227, 251)   | Badge bg, alert bg, selected state fill    |
| 200  | #C9C5F7 | rgb(201, 197, 247)   | List item hover bg, tag bg                 |
| 300  | #A49EF0 | rgb(164, 158, 240)   | Interactive element borders, progress bar  |
| 400  | #7B72EC | rgb(123, 114, 236)   | Icon fill on light bg, inactive tab label  |
| 500  | #5B4FE8 | rgb(91, 79, 232)     | PRIMARY: buttons, links, active indicators |
| 600  | #4538D4 | rgb(69, 56, 212)     | Button hover, link hover                   |
| 700  | #3428B0 | rgb(52, 40, 176)     | Button pressed, color-as-text on white     |
| 800  | #241C85 | rgb(36, 28, 133)     | High-emphasis color text, dark headings    |
| 900  | #16115C | rgb(22, 17, 92)      | Max contrast, dark overlays                |

---

### Secondary Color: Slate Blue
**Base (500):** #3D7BE8 -- HSL(216°, 77%, 58%)

The secondary hue is placed 30° counterclockwise from the primary (216° vs 246°), making this an analogous pair. The secondary's saturation matches the primary (77%) but lightness is 3% higher at the 500 step, ensuring the eye reads the primary violet as dominant when both appear together.

| Step | Hex     | RGB                  | Usage                                       |
|------|---------|----------------------|---------------------------------------------|
| 50   | #EEF5FD | rgb(238, 245, 253)   | Secondary tinted bg, info banner bg         |
| 100  | #D9EAFB | rgb(217, 234, 251)   | Secondary badge bg, selected secondary item |
| 200  | #B1D3F7 | rgb(177, 211, 247)   | Secondary hover bg                          |
| 300  | #7DB6F1 | rgb(125, 182, 241)   | Secondary element borders, category chip    |
| 400  | #5B9AEC | rgb(91, 154, 236)    | Secondary icon fill, second-level nav item  |
| 500  | #3D7BE8 | rgb(61, 123, 232)    | Secondary buttons, category color dots      |
| 600  | #2D65CC | rgb(45, 101, 204)    | Secondary button hover                      |
| 700  | #1F4DA8 | rgb(31, 77, 168)     | Secondary pressed, secondary text on white  |
| 800  | #163880 | rgb(22, 56, 128)     | High-contrast secondary text                |
| 900  | #0E2458 | rgb(14, 36, 88)      | Max contrast secondary                      |

---

### Accent Color: Amber
**Base:** #F59E0B -- HSL(38°, 92%, 50%)

Amber sits at 38° -- nearly 210° from the primary violet on the color wheel. It is not a strict complementary (which would be 66°, yellow-green), but functions as a high-contrast accent that stands out immediately against the violet-blue palette. Amber signals "attention" without the urgency connotation of red.

| Variant | Hex     | RGB                  | Usage                                        |
|---------|---------|----------------------|----------------------------------------------|
| Light   | #FFFBEB | rgb(255, 251, 235)   | Promo banner bg, "new" feature highlight bg  |
| Base    | #F59E0B | rgb(245, 158, 11)    | "New" badge, priority indicator, promo CTAs  |
| Dark    | #B45309 | rgb(180, 83, 9)      | Accent text on amber-100 bg (in banners)     |

**Constraint:** Amber accent must not exceed 5% of any screen's color presence. Use exclusively for promotional elements, priority badges, and "new feature" callouts.

---

### Neutral Scale: Cool Gray with violet undertone
**Undertone:** HSL(240°, 7%, variable L%) -- the violet primary's hue reduced to a trace saturation

| Step | Hex     | RGB                  | Usage                                       |
|------|---------|----------------------|---------------------------------------------|
| 50   | #F8F8FC | rgb(248, 248, 252)   | Page background                             |
| 100  | #F1F1F8 | rgb(241, 241, 248)   | Card bg, panel bg, alternating table row    |
| 200  | #E2E2ED | rgb(226, 226, 237)   | Borders, dividers, table lines              |
| 300  | #C7C7D9 | rgb(199, 199, 217)   | Disabled element borders, skeleton loaders  |
| 400  | #9595AE | rgb(149, 149, 174)   | Placeholder text, muted icons, captions     |
| 500  | #6B6B87 | rgb(107, 107, 135)   | Supporting body text, metadata, labels      |
| 600  | #4A4A62 | rgb(74, 74, 98)      | Primary body text, list items               |
| 700  | #343448 | rgb(52, 52, 72)      | Section headings, subheadings               |
| 800  | #1F1F30 | rgb(31, 31, 48)      | Display headings, high-emphasis text        |
| 900  | #11111E | rgb(17, 17, 30)      | Max contrast text, near-black               |

The violet undertone (H=240°) creates visual continuity between the neutral scale and the primary brand violet. The grays feel "of a piece" with the interface rather than generic.

---

### Semantic Colors

| Purpose | Light (bg/100) | Base (500)  | Dark (text/700) | WCAG (dark on light) | Usage                                     |
|---------|----------------|-------------|-----------------|----------------------|-------------------------------------------|
| Success | #ECFDF5        | #10B981     | #047857         | 5.1:1 -- PASS        | Task completed, milestone hit, approval   |
| Warning | #FFFBEB        | #F59E0B     | #B45309         | 4.8:1 -- PASS        | Overdue tasks, approaching deadline       |
| Error   | #FEF2F2        | #EF4444     | #B91C1C         | 5.8:1 -- PASS        | Failed saves, permission denied, conflict |
| Info    | #EFF6FF        | #3B82F6     | #1D4ED8         | 6.1:1 -- PASS        | Tips, inline help, neutral notifications  |

**Semantic differentiation notes:**
- Success green (160°) is clearly distinct from the primary violet (246°) -- no confusion possible.
- Info blue (217°) is adjacent to the secondary blue (216°). Do not use info blue and secondary blue interchangeably. Info is exclusively for system-generated informational messages. Secondary is for brand interactive elements.
- Warning amber base (38°) doubles as the accent color -- this is intentional and reduces palette size. Promotional uses are suppressed when the same screen shows warning states. Avoid using amber accent on screens where warning states appear.
- Error red (0°) is pure red-family. The primary is violet (246°). No hue confusion.

---

### WCAG Contrast Verification

| Foreground         | Background       | Hex Codes                    | Ratio    | Required | Result       |
|--------------------|------------------|------------------------------|----------|----------|--------------|
| white              | primary-500      | #FFFFFF on #5B4FE8           | 3.6:1    | 4.5:1    | **FAIL** (normal text) |
| white              | primary-500      | #FFFFFF on #5B4FE8           | 3.6:1    | 3:1      | PASS (large text only) |
| white              |
