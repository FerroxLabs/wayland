---
name: color-contrast-designer
description: |
  Design accessible color systems using WCAG contrast ratios and APCA, simulate color blindness, build dark mode palettes, and select tooling for contrast validation.
  Use when the user asks about color contrast designer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of color contrast designer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "accessibility quick-reference javascript testing automation analysis safety competitive-programming"
  category: "web-development"
  subcategory: "accessibility-performance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Color Contrast Designer

You are an expert in accessible color design, specializing in contrast ratios, color blindness simulation, dark mode accessibility, and building design system color tokens that pass WCAG requirements automatically. You understand both the traditional WCAG 2.x contrast algorithm and the newer APCA (Accessible Perceptual Contrast Algorithm) approach.


## When to Use

**Use this skill when:**
- User asks about color contrast designer techniques or best practices
- User needs guidance on color contrast designer concepts
- User wants to implement or improve their approach to color contrast designer

**Do NOT use when:**
- The request falls outside the scope of color contrast designer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. Are you building a new color system or auditing an existing one?
2. What is your WCAG conformance target (AA or AAA)?
3. Do you need to support dark mode?
4. What is your brand's primary color, and is it flexible?
5. What UI framework or design tool are you using (Figma, Tailwind, Material, custom)?
6. Do you have data on your users' color vision characteristics?

## WCAG 2.x Contrast Requirements

### The Rules

| Content Type | AA Minimum | AAA Minimum |
|-------------|-----------|-------------|
| Normal text (below 18pt or below 14pt bold) | 4.5:1 | 7:1 |
| Large text (18pt+ or 14pt bold+) | 3:1 | 4.5:1 |
| UI components and graphical objects | 3:1 | Not defined |
| Non-text contrast (icons, borders, focus indicators) | 3:1 | Not defined |
| Disabled elements | No requirement | No requirement |
| Logos and branding | No requirement | No requirement |

Note: "18pt" in CSS is approximately 24px. "14pt bold" is approximately 18.66px bold.

### The WCAG 2.x Contrast Formula

The WCAG 2 algorithm compares relative luminance:

```
Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
where L1 is the lighter color's relative luminance
and L2 is the darker color's relative luminance
```

Relative luminance calculation:
```javascript
function relativeLuminance(r, g, b) {
  const [rL, gL, bL] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Example: white on dark blue
console.log(contrastRatio([255, 255, 255], [0, 51, 102]));
// Result: 11.07:1 -- passes AAA
```

### Known Limitations of WCAG 2.x Contrast

The WCAG 2 formula has documented issues:
- Treats all colors equally, but human perception is not uniform (blue text on black appears less readable than the ratio suggests)
- Over-penalizes dark mode backgrounds
- Does not account for font weight or size precisely
- A ratio of 4.5:1 can be achieved by combinations that are perceptually poor

## APCA (Accessible Perceptual Contrast Algorithm)

APCA is the contrast algorithm being developed for WCAG 3.0. It is more perceptually accurate than WCAG 2.x.

### Key Differences from WCAG 2.x

| Feature | WCAG 2.x | APCA |
|---------|----------|------|
| Polarity | Same ratio for light-on-dark and dark-on-light | Different values; polarity matters |
| Output | Ratio (e.g., 4.5:1) | Lightness Contrast value (Lc, e.g., Lc 60) |
| Font sensitivity | Two thresholds (large/normal) | Lookup table by font size and weight |
| Dark mode | Same rules | Better calibrated for dark backgrounds |

### APCA Minimum Contrast Lookup

| Font Size | Weight 400 | Weight 700 |
|-----------|-----------|-----------|
| 14px | Lc 90 | Lc 75 |
| 16px | Lc 80 | Lc 70 |
| 18px | Lc 75 | Lc 60 |
| 24px | Lc 60 | Lc 50 |
| 32px | Lc 55 | Lc 45 |
| 48px | Lc 45 | Lc 40 |

Higher Lc values mean more contrast. Body text at 16px weight 400 needs approximately Lc 75-80.

```javascript
// APCA contrast calculation using the apca-w3 package
// add the package dependency apca-w3

import { APCAcontrast, sRGBtoY } from 'apca-w3';

const textY = sRGBtoY([68, 68, 68]);      // #444444
const bgY = sRGBtoY([255, 255, 255]);      // #ffffff

const Lc = APCAcontrast(textY, bgY);
console.log('APCA Lc:', Lc);
// Result: approximately Lc 83 -- good for body text
```

### When to Use APCA vs WCAG 2.x

- **Use WCAG 2.x** for compliance testing today (legally referenced standard)
- **Use APCA** for design decisions, especially dark mode palettes
- **Use both** to find colors that pass under both algorithms
- APCA is expected to become the official algorithm in WCAG 3.0

## Color Blindness Design

### Types and Prevalence

| Type | Affects | Prevalence (Male) | Prevalence (Female) | Colors Confused |
|------|---------|-------------------|---------------------|-----------------|
| Deuteranopia | Green cones | ~5% | ~0.4% | Red and green |
| Protanopia | Red cones | ~1.3% | ~0.02% | Red and green, red appears darker |
| Tritanopia | Blue cones | ~0.01% | ~0.01% | Blue and yellow |
| Achromatopsia | All cones | ~0.003% | ~0.003% | No color perception |

Approximately 8% of men and 0.5% of women have some form of color vision deficiency. For 1,000 users, expect around 40 with color blindness.

### Design Strategies

#### Never Rely on Color Alone (WCAG 1.4.1)

```html
<!-- BAD: Status conveyed only by color -->
<span style="color: red;">Error</span>
<span style="color: green;">Success</span>

<!-- GOOD: Color plus icon plus text -->
<span class="status-error">
  <svg aria-hidden="true"><!-- X icon --></svg>
  Error: Invalid email address
</span>
<span class="status-success">
  <svg aria-hidden="true"><!-- checkmark icon --></svg>
  Success: Account created
</span>
```

#### Charts and Data Visualization

```javascript
// BAD: Distinguishing data series only by color
const colors = ['#ff0000', '#00ff00', '#0000ff'];

// GOOD: Color plus pattern plus shape plus label
const series = [
  { color: '#d32f2f', pattern: 'solid',   marker: 'circle',   label: 'Revenue' },
  { color: '#1976d2', pattern: 'dashed',  marker: 'square',   label: 'Expenses' },
  { color: '#388e3c', pattern: 'dotted',  marker: 'triangle', label: 'Profit' },
];

// Direct labeling is the best option -- place labels directly
// on or next to each line, eliminating the need for a legend
```

#### Form Validation

```css
/* BAD: Error indicated only by red border */
.input-error {
  border-color: red;
}

/* GOOD: Error indicated by border plus icon plus message */
.input-error {
  border-color: #d32f2f;
  border-width: 2px;
  /* 3:1 contrast against background */
}

.error-message {
  color: #b71c1c;
  /* Plus visible error text explaining the issue */
}
```

### Color Blindness Safe Palettes

Colors that remain distinguishable under all types of color vision (based on Wong, 2011):

| Name | Hex | Use Case |
|------|-----|----------|
| Black | #000000 | Text, borders |
| Orange | #E69F00 | Warning, highlight |
| Sky Blue | #56B4E9 | Information, link |
| Bluish Green | #009E73 | Success |
| Yellow | #F0E442 | Caution (with dark text) |
| Blue | #0072B2 | Primary action |
| Vermillion | #D55E00 | Error, destructive |
| Reddish Purple | #CC79A7 | Accent |

## Dark Mode Design

### Challenges Unique to Dark Mode

1. **WCAG 2.x ratios can be misleading** -- 4.5:1 white on dark gray can be harder to read than the ratio suggests due to halation (bright text blooms on dark backgrounds)
2. **Saturation appears higher** on dark backgrounds -- reduce saturation for dark mode
3. **Depth reversal** -- shadows do not work the same; use elevation with lighter surfaces
4. **User fatigue** -- pure white (#ffffff) on pure black (#000000) causes eye strain

### Dark Mode Best Practices

```css
/* Light mode tokens */
:root {
  --surface-primary: #ffffff;
  --surface-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #555555;
  --text-muted: #767676;
  --brand-primary: #0055cc;
  --error: #c62828;
  --success: #2e7d32;
}

/* Dark mode tokens -- not simply inverting light mode */
@media (prefers-color-scheme: dark) {
  :root {
    --surface-primary: #121212;
    --surface-secondary: #1e1e1e;
    --text-primary: #e0e0e0;       /* Not pure white to reduce halation */
    --text-secondary: #aaaaaa;
    --text-muted: #888888;
    --brand-primary: #6fa8ff;      /* Desaturated, lighter for dark bg */
    --error: #ff6b6b;
    --success: #66bb6a;
  }
}
```

**Key rules:**
- Use #121212 or #1a1a1a for the darkest background, not pure #000000
- Use #e0e0e0 or #eeeeee for primary text, not pure #ffffff
- Desaturate brand colors by 10-20% for dark backgrounds
- Increase elevation brightness (each dp of elevation adds 5% white overlay)
- Test every color pair in both modes

### Elevation in Dark Mode

```css
/* Dark mode elevation system */
.surface-0  { background-color: #121212; }  /* Base */
.surface-1  { background-color: #1e1e1e; }  /* Card */
.surface-2  { background-color: #232323; }  /* Elevated card */
.surface-3  { background-color: #252525; }  /* Navigation drawer */
.surface-4  { background-color: #272727; }  /* Modal */
.surface-8  { background-color: #2d2d2d; }  /* Menu */
.surface-12 { background-color: #333333; }  /* Snackbar */
.surface-16 { background-color: #363636; }  /* Dialog */
.surface-24 { background-color: #383838; }  /* Top app bar */
```

## Building Accessible Color Tokens

### Design System Token Strategy

```javascript
// Define primitive color scale
const blue = {
  50:  '#e3f2fd',
  100: '#bbdefb',
  200: '#90caf9',
  300: '#64b5f6',
  400: '#42a5f5',
  500: '#2196f3',
  600: '#1e88e5',
  700: '#1565c0',
  800: '#0d47a1',
  900: '#0a2472',
};

// Map to semantic tokens with contrast guarantees
const lightMode = {
  'color-text-primary':     '#1a1a1a',  // 13.5:1 on white
  'color-text-link':        blue[800],   // 7.0:1 on white
  'color-text-on-primary':  '#ffffff',   // Check against primary bg
  'color-bg-primary':       blue[700],   // 4.5:1 with white text
  'color-bg-error':         '#fde8e8',   // Background only, text is dark
  'color-border-error':     '#c62828',   // 3:1 against white bg
};
```

### Automated Contrast Checking in CI

```javascript
// contrast-check.js -- run in CI to catch regressions

const tokenPairs = [
  { text: '#1a1a1a', bg: '#ffffff', minWcag: 4.5, label: 'body text' },
  { text: '#ffffff', bg: '#1565c0', minWcag: 4.5, label: 'button text' },
  { text: '#767676', bg: '#ffffff', minWcag: 4.5, label: 'muted text' },
  { text: '#e0e0e0', bg: '#121212', minWcag: 4.5, label: 'dark mode body' },
];

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(hex) && hex.match(/([a-f\d]{2})/gi);
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function wcagContrast(rgb1, rgb2) {
  function luminance([r, g, b]) {
    const [rL, gL, bL] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
  }
  const l1 = luminance(rgb1);
  const l2 = luminance(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

let failures = 0;
for (const pair of tokenPairs) {
  const ratio = wcagContrast(hexToRgb(pair.text), hexToRgb(pair.bg));
  const pass = ratio >= pair.minWcag;
  console.log(
    (pass ? 'PASS' : 'FAIL'),
    pair.label + ':',
    ratio.toFixed(2) + ':1',
    '(need ' + pair.minWcag + ':1)'
  );
  if (!pass) failures++;
}

if (failures > 0) {
  process.exitCode = 1;
}
```

## Tools Reference

| Tool | Type | Best For |
|------|------|----------|
| WebAIM Contrast Checker | Web | Quick single-pair check |
| Colour Contrast Analyser (TPGi) | Desktop | Eyedropper from any on-screen content |
| Figma Stark plugin | Figma | In-design contrast and simulation |
| Chrome DevTools | Browser | Real-time contrast inspection |
| Sim Daltonism | macOS | Real-time color blindness simulation |
| Color Oracle | Cross-platform | Free color blindness simulation |
| Polypane | Browser | Side-by-side color blindness views |
| Leonardo (Adobe) | Web | Generate accessible color scales by target contrast |
| axe DevTools | Browser | Automated contrast violation detection |
| APCA Contrast Calculator | Web | APCA-specific calculation and font lookup |

## Quick Reference: Safe Text Colors

### On White Background (#ffffff)

| Color | Hex | WCAG Ratio | APCA Lc | Use For |
|-------|-----|-----------|---------|---------|
| Near-black | #1a1a1a | 16.8:1 | ~106 | Body text, headings |
| Dark gray | #333333 | 12.6:1 | ~97 | Body text |
| Medium gray | #555555 | 7.5:1 | ~78 | Secondary text |
| Gray | #767676 | 4.5:1 | ~54 | Muted text (AA minimum) |
| Dark blue | #0055cc | 7.3:1 | ~72 | Links |
| Dark red | #b71c1c | 7.8:1 | ~65 | Error text |
| Dark green | #2e7d32 | 4.8:1 | ~55 | Success text (AA) |

### On Dark Background (#121212)

| Color | Hex | WCAG Ratio | APCA Lc | Use For |
|-------|-----|-----------|---------|---------|
| Off-white | #e0e0e0 | 13.2:1 | ~90 | Body text |
| Light gray | #aaaaaa | 7.3:1 | ~62 | Secondary text |
| Medium gray | #888888 | 4.6:1 | ~44 | Muted text |
| Light blue | #6fa8ff | 6.3:1 | ~60 | Links |
| Light red | #ff6b6b | 5.3:1 | ~48 | Error text |
| Light green | #66bb6a | 5.8:1 | ~55 | Success text |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to color contrast designer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Color Contrast Designer Analysis

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

**Input:** "Help me with color contrast designer for my current situation"

**Output:**

Based on your situation, here is a structured approach to color contrast designer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
