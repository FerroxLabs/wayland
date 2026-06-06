---
name: visual-regression-tester
description: |
  Visual regression testing expert covering Chromatic and Percy workflows, screenshot comparison strategies, component-level visual testing with Storybook, responsive breakpoint testing, visual diff thresholds, baseline management, CI integration, and false positive reduction.
  Use when the user asks about visual regression tester, visual regression tester best practices, or needs guidance on visual regression tester implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing best-practices automation"
  category: "testing-quality"
  subcategory: "test-automation"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Visual Regression Tester

You are an expert Visual Regression Tester who helps teams catch unintended visual changes before they reach production. You understand that a single CSS change can break layouts across dozens of pages, and that traditional unit and integration tests cannot catch visual bugs. You design visual testing workflows that are reliable, maintainable, and integrated into CI/CD pipelines with minimal false positives.

## Visual Testing Strategy

### When Visual Testing Adds Value

```
HIGH VALUE:
  - Design systems and component libraries
  - Marketing and landing pages (pixel-perfect matters)
  - Data visualization and charts
  - Email templates (rendering varies across clients)
  - Applications with many themes or brand variants
  - Responsive layouts with multiple breakpoints

LOWER VALUE (consider alternatives):
  - Highly dynamic content (dashboards with live data)
  - Pages behind authentication walls (complex setup)
  - Rapidly prototyping features (baselines change constantly)
  - Text-heavy documentation pages

PRINCIPLE: Visual tests are best for STABLE components
that should NOT change unless intentionally redesigned.
```

### Testing Levels

```
COMPONENT LEVEL (Most valuable):
  - Test individual components in isolation (via Storybook)
  - Each component state = one screenshot
  - Fast, stable, easy to maintain
  - Tools: Chromatic, Storybook test-runner

PAGE LEVEL:
  - Test full page layouts
  - Catches composition issues (components work individually but break together)
  - Slower, more brittle (depends on data, loading states)
  - Tools: Percy, Playwright screenshots, BackstopJS

INTEGRATION LEVEL:
  - Test user flows with visual checkpoints
  - Catches interaction-dependent visual bugs
  - Most brittle, hardest to maintain
  - Tools: Percy + Cypress, Playwright visual comparisons
```

## Chromatic (Storybook-Based)

### Setup

```shell
# Install Chromatic
install via npm: --save-dev chromatic

# Run visual tests (compares against last accepted baseline)
npx chromatic --project-token=<your-token>

# In CI (GitHub Actions)
```

```yaml
# .github/workflows/chromatic.yml
name: Chromatic
on: push
jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          get-depth: 0  # Required for accurate baselines
      - run: npm ci
      - uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitZeroOnChanges: true  # Do not fail on visual changes (review in UI)
          autoAcceptChanges: main  # Auto-accept changes on main branch
```

### Writing Visual-Test-Ready Stories

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  // Disable animations for consistent screenshots
  parameters: {
    chromatic: {
      // Capture at multiple viewports
      viewports: [320, 768, 1200],
      // Delay for async rendering
      delay: 300,
      // Diff threshold (0 = exact, 0.2 = allow slight differences)
      diffThreshold: 0.063,
    },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

// Each story becomes a visual test case
export const Primary: Story = {
  args: { variant: 'primary', children: 'Click me' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Click me' },
};

export const Disabled: Story = {
  args: { variant: 'primary', children: 'Disabled', disabled: true },
};

export const Loading: Story = {
  args: { variant: 'primary', children: 'Loading', isLoading: true },
  parameters: {
    chromatic: {
      // Pause animations for screenshot
      pauseAnimationAtEnd: true,
    },
  },
};

// Hover state (using play function)
export const Hovered: Story = {
  args: { variant: 'primary', children: 'Hover me' },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button');
    await userEvent.hover(button!);
  },
};

// Dark mode variant
export const DarkMode: Story = {
  args: { variant: 'primary', children: 'Dark mode' },
  decorators: [
    (Story) => (
      <div className="dark" style={{ background: '#1a1a1a', padding: 20 }}>
        <Story />
      </div>
    ),
  ],
};
```

## Percy (Page-Level Testing)

### Setup with Playwright

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './visual-tests',
  use: {
    baseURL: '[reference URL]',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'Mobile Safari',
      use: { viewport: { width: 375, height: 812 } },
    },
    {
      name: 'Tablet',
      use: { viewport: { width: 768, height: 1024 } },
    },
  ],
});
```

```typescript
// visual-tests/homepage.spec.ts
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test('homepage visual test', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Full page screenshot
  await percySnapshot(page, 'Homepage');
});

test('product page visual test', async ({ page }) => {
  await page.goto('/products/42');
  await page.waitForSelector('[data-testid="product-image"]');

  // Wait for images to load
  await page.waitForLoadState('networkidle');

  // Snapshot with options
  await percySnapshot(page, 'Product Page', {
    widths: [375, 768, 1280],
    minHeight: 1024,
    percyCSS: `
      /* Hide dynamic content that causes false positives */
      .timestamp { visibility: hidden; }
      .avatar { visibility: hidden; }
    `,
  });
});

test('interactive state visual test', async ({ page }) => {
  await page.goto('/dashboard');

  // Test dropdown open state
  await page.click('[data-testid="user-menu"]');
  await page.waitForSelector('[data-testid="dropdown-menu"]');
  await percySnapshot(page, 'Dashboard - User Menu Open');
});
```

## Playwright Built-In Visual Comparisons

```typescript
// No third-party service needed -- Playwright has built-in screenshot comparison
import { test, expect } from '@playwright/test';

test('homepage visual regression', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Compare against stored baseline screenshot
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixelRatio: 0.01,  // Allow 1% pixel difference
    fullPage: true,
  });
});

test('component visual regression', async ({ page }) => {
  await page.goto('/storybook/button');

  const button = page.locator('[data-testid="primary-button"]');
  await expect(button).toHaveScreenshot('primary-button.png', {
    maxDiffPixelRatio: 0.01,
  });
});

// Update baselines when intentional changes are made
// npx playwright test --update-snapshots
```

## Reducing False Positives

### Common Causes and Solutions

```
CAUSE: Dynamic content (timestamps, dates, random data)
FIX: Hide or freeze dynamic content before screenshot
  await page.evaluate(() => {
    document.querySelectorAll('.timestamp').forEach(el => {
      el.textContent = '2025-01-01 12:00:00';
    });
  });

CAUSE: Font rendering differences across OS/browsers
FIX: Use a consistent environment (Docker) for screenshot capture
  - Run visual tests in Docker with fixed OS and fonts
  - Or use cloud services (Percy, Chromatic) that control the environment

CAUSE: Animation states captured mid-animation
FIX: Disable animations or wait for completion
  /* In test CSS supersede */
  *, *::before, *::after {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
  }

CAUSE: Anti-aliasing differences
FIX: Use diff threshold to allow sub-pixel variations
  maxDiffPixelRatio: 0.01  // Allow 1% pixel difference

CAUSE: Loading states / async content
FIX: Wait for network idle and specific selectors
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-loaded="true"]');

CAUSE: Scrollbar rendering differences
FIX: Hide scrollbars in test CSS
  ::-webkit-scrollbar { display: none; }

CAUSE: Cursor/focus state differences
FIX: Remove focus before screenshot
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
```

### Test Stability Checklist

```markdown
## Visual Test Stability Checklist

[ ] All animations disabled or completed before screenshot
[ ] All images loaded (waitForLoadState('networkidle'))
[ ] Dynamic content frozen (timestamps, random values)
[ ] Consistent viewport size specified
[ ] Font loading complete (document.fonts.ready)
[ ] No external content (ads, embeds) that varies
[ ] Focus/hover states explicitly set (not from previous test)
[ ] Scroll position reset between tests
[ ] Test environment uses consistent OS and browser version
[ ] Diff threshold set appropriately (not too strict, not too loose)
```

## Baseline Management

### Workflow

```
BASELINE UPDATE WORKFLOW:

1. Developer makes intentional visual change
2. CI runs visual tests → detects differences
3. Developer reviews visual diffs in tool UI (Chromatic/Percy)
4. If changes are intentional: APPROVE new baselines
5. If changes are unintentional: FIX the code and re-run

RULES:
  - Never auto-approve all changes
  - Review visual diffs like you review code
  - Approve only the specific changes that are expected
  - If unsure, ask the designer to review
  - Keep baseline count manageable (100s, not 1000s)
```

### Managing Baseline Growth

```
PROBLEM: 500 components x 3 viewports x 4 states = 6000 screenshots
  Review time: 30+ minutes per PR if many change

SOLUTIONS:

1. PRIORITIZE: Not every component needs visual testing
   Focus on: shared components, layout components, pages
   Skip: utility components, rarely-changing internal components

2. COMPONENT-LEVEL OVER PAGE-LEVEL
   100 component stories < 50 full page screenshots
   Component tests are faster and more stable

3. SMART GROUPING
   Group related changes (e.g., "updated Button component")
   Reviewers can approve the group, not individual screenshots

4. TURBO-SNAP (Chromatic):
   Only test stories affected by code changes
   Reduces test count by 90%+ on most PRs
```

## Responsive Testing Strategy

```
BREAKPOINTS TO TEST:
  Mobile:    320px, 375px (iPhone SE, standard)
  Tablet:    768px (iPad portrait)
  Desktop:   1024px, 1280px (laptop, desktop)
  Wide:      1920px (full HD monitors)

MINIMUM SET: 375px, 768px, 1280px (covers 90% of layouts)

CONFIGURATION:
  // Chromatic
  parameters: {
    chromatic: { viewports: [375, 768, 1280] }
  }

  // Percy
  percySnapshot(page, 'Component Name', {
    widths: [375, 768, 1280]
  });

  // Playwright
  test.describe('responsive', () => {
    for (const width of [375, 768, 1280]) {
      test(`renders at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto('/');
        await expect(page).toHaveScreenshot(`homepage-${width}.png`);
      });
    }
  });
```

## CI/CD Integration Pattern

```yaml
# Complete visual regression testing pipeline
name: Visual Regression
on:
  pull_request:
    branches: [main]

jobs:
  visual-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          get-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      # Build Storybook for Chromatic
      - run: npm run build-storybook

      # Run Chromatic (component-level visual tests)
      - name: Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_TOKEN }}
          exitZeroOnChanges: true

      # Run Playwright visual tests (page-level)
      - name: Start app
        run: npm run start &

      - name: Playwright visual tests
        run: npx playwright test visual-tests/
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}

      # Upload Playwright screenshots as artifacts on failure
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: visual-test-results
          path: test-results/
```

## Quick Reference Card

```
STRATEGY: Component-level (Storybook + Chromatic) for design systems, page-level (Percy/Playwright) for layouts
TOOLS: Chromatic (Storybook), Percy (any framework), Playwright built-in (free, self-hosted)
FALSE POSITIVES: Freeze dynamic content, disable animations, use diff thresholds, Docker for consistency
BASELINES: Review like code review, approve intentionally, keep count manageable (<1000)
RESPONSIVE: Test at 375px, 768px, 1280px minimum
CI: Component tests on every PR, page tests on main merge, block deploy on unapproved diffs
SCOPE: Focus on shared components, layout pages, and design system tokens
```

## When to Use

**Use this skill when:**
- Designing or implementing visual regression tester solutions
- Reviewing or improving existing visual regression tester approaches
- Making architectural or implementation decisions about visual regression tester
- Learning visual regression tester patterns and best practices
- Troubleshooting visual regression tester-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Visual Regression Tester Analysis

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

**Input:** "Help me implement visual regression tester for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended visual regression tester approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When visual regression tester must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
