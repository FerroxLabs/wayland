---
name: e2e-test-architect
description: |
  End-to-end test automation expertise covering Playwright and Cypress patterns, page object model design, test selector strategies (data-testid), wait strategies for asynchronous content, screenshot comparison, parallel execution, flaky test management, CI integration, and comprehensive test reporting.
  Use when the user asks about e2e test architect, e2e test architect best practices, or needs guidance on e2e test architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing best-practices guide"
  category: "testing-quality"
  subcategory: "test-automation"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# E2E Test Architect

## Core Philosophy

End-to-end tests validate complete user workflows through the real application. They are the most expensive tests to write, maintain, and run, so be strategic: test critical paths, not every feature. A small number of well-designed E2E tests provides more value than hundreds of brittle ones. Follow the testing pyramid -- E2E tests sit at the top.

## Framework Selection

| Feature | Playwright | Cypress |
|---------|-----------|---------|
| Language | JS/TS, Python, Java, .NET | JavaScript/TypeScript only |
| Browser support | Chromium, Firefox, WebKit | Chrome, Firefox, Edge, Electron |
| Multi-tab/window | Yes | No (workarounds exist) |
| iframes | Full support | Limited |
| Network interception | Yes | Yes |
| Parallel execution | Built-in | Via CI parallelization or Cypress Cloud |
| Auto-wait | Yes (built-in) | Yes (built-in) |
| Speed | Fast | Moderate |
| Best for | Cross-browser, complex apps | Simple to moderate web apps |

## Playwright Patterns

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('successful login redirects to dashboard', async ({ page }) => {
        await page.getByLabel('Email').fill('alice@example.com');
        await page.getByLabel('Password').fill('secure-password');
        await page.getByRole('button', { name: 'Sign In' }).click();

        await expect(page).toHaveURL('/dashboard');
        await expect(page.getByRole('heading', { name: 'Welcome, Alice' })).toBeVisible();
    });

    test('invalid credentials show error message', async ({ page }) => {
        await page.getByLabel('Email').fill('alice@example.com');
        await page.getByLabel('Password').fill('wrong-password');
        await page.getByRole('button', { name: 'Sign In' }).click();

        await expect(page.getByRole('alert')).toHaveText('Invalid email or password');
        await expect(page).toHaveURL('/login');
    });

    test('locked account shows lockout message after 5 attempts', async ({ page }) => {
        for (let i = 0; i < 5; i++) {
            await page.getByLabel('Email').fill('alice@example.com');
            await page.getByLabel('Password').fill('wrong');
            await page.getByRole('button', { name: 'Sign In' }).click();
            if (i < 4) {
                await page.getByRole('alert').waitFor();
            }
        }

        await expect(page.getByText('Account locked')).toBeVisible();
    });
});
```

### Authentication State Reuse

```typescript
// auth.setup.ts - Run once to create authenticated state
import { test as setup, expect } from '@playwright/test';

setup('authenticate as admin', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('admin-password');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');

    // Save signed-in state to file
    await page.context().storageState({ path: '.auth/admin.json' });
});

// playwright.config.ts
export default defineConfig({
    projects: [
        { name: 'setup', testMatch: /.*\.setup\.ts/ },
        {
            name: 'admin-tests',
            dependencies: ['setup'],
            use: { storageState: '.auth/admin.json' }
        }
    ]
});
```

## Page Object Model

### Implementation

```typescript
// pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly signInButton: Locator;
    readonly errorAlert: Locator;
    readonly forgotPasswordLink: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.getByLabel('Email');
        this.passwordInput = page.getByLabel('Password');
        this.signInButton = page.getByRole('button', { name: 'Sign In' });
        this.errorAlert = page.getByRole('alert');
        this.forgotPasswordLink = page.getByRole('link', { name: 'skipped password?' });
    }

    async goto() {
        await this.page.goto('/login');
    }

    async login(email: string, password: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.signInButton.click();
    }

    async expectError(message: string) {
        await expect(this.errorAlert).toHaveText(message);
    }
}

// pages/DashboardPage.ts
export class DashboardPage {
    readonly page: Page;
    readonly welcomeHeading: Locator;
    readonly createButton: Locator;
    readonly searchInput: Locator;
    readonly dataTable: Locator;

    constructor(page: Page) {
        this.page = page;
        this.welcomeHeading = page.getByRole('heading', { name: /Welcome/ });
        this.createButton = page.getByRole('button', { name: 'Create New' });
        this.searchInput = page.getByPlaceholder('Search...');
        this.dataTable = page.getByTestId('data-table');
    }

    async expectLoaded() {
        await expect(this.welcomeHeading).toBeVisible();
    }

    async search(query: string) {
        await this.searchInput.fill(query);
        await this.searchInput.press('Enter');
        // Wait for table to update
        await this.page.waitForResponse(resp =>
            resp.url().includes('/api/search') && resp.status() === 200
        );
    }

    async getRowCount(): Promise<number> {
        return await this.dataTable.locator('tbody tr').count();
    }
}

// Using page objects in tests
test('admin can search users', async ({ page }) => {
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    await login.goto();
    await login.login('admin@example.com', 'admin-password');
    await dashboard.expectLoaded();

    await dashboard.search('Alice');

    const rows = await dashboard.getRowCount();
    expect(rows).toBeGreaterThan(0);
});
```

## Test Selectors Strategy

### Priority Order (Best to Worst)

```typescript
// 1. BEST: Role-based selectors (accessible, resilient to UI changes)
page.getByRole('button', { name: 'Submit' });
page.getByRole('heading', { name: 'Dashboard' });
page.getByRole('link', { name: 'Settings' });
page.getByRole('textbox', { name: 'Email' });
page.getByRole('checkbox', { name: 'Remember me' });

// 2. GOOD: Label-based selectors (accessible)
page.getByLabel('Email address');
page.getByPlaceholder('Search...');
page.getByText('Welcome to the app');
page.getByAltText('Company logo');
page.getByTitle('Close dialog');

// 3. GOOD: Test ID selectors (stable, decoupled from UI)
page.getByTestId('submit-order-button');
page.getByTestId('user-avatar');

// 4. AVOID: CSS selectors (brittle, coupled to implementation)
page.locator('.btn-primary');         // Breaks when CSS class changes
page.locator('#submit-form');         // Tight coupling to DOM structure
page.locator('div > form > button'); // Extremely brittle
```

### Adding Test IDs in Your Application

```tsx
// React
<button data-testid="submit-order">Place Order</button> .// Vue
<button data-testid="submit-order">Place Order</button> .// Configure Playwright to use custom attribute
// playwright.config.ts
export default defineConfig({
    use: {
        testIdAttribute: 'data-testid',
    }
});
```

## Wait Strategies

### Playwright Auto-Wait

Playwright automatically waits for elements to be actionable before performing actions. These are the built-in wait conditions:

```typescript
// Automatic waits (no explicit wait needed)
await page.getByRole('button', { name: 'Submit' }).click();
// Playwright auto-waits for: attached, visible, stable, enabled, receives events

// Wait for specific element state
await expect(page.getByText('Success')).toBeVisible({ timeout: 10000 });
await expect(page.getByTestId('loading')).toBeHidden();
await expect(page.getByRole('button')).toBeEnabled();

// Wait for URL change
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveURL(/\/orders\/\d+/);

// Wait for network response
const responsePromise = page.waitForResponse(
    resp => resp.url().includes('/api/orders') && resp.status() === 200
);
await page.getByRole('button', { name: 'Save' }).click();
const response = await responsePromise;
const data = await response.json();

// Wait for loading state to complete
await page.getByRole('button', { name: 'Load Data' }).click();
await page.getByTestId('spinner').waitFor({ state: 'hidden' });
await expect(page.getByTestId('data-table')).toBeVisible();
```

### Anti-Patterns to Avoid

```typescript
// BAD: Hard-coded waits (slow and unreliable)
await page.waitForTimeout(3000);

// BAD: Polling with short sleep
while (!await page.getByText('Ready').isVisible()) {
    await page.waitForTimeout(100);
}

// GOOD: Use expect with auto-retry
await expect(page.getByText('Ready')).toBeVisible({ timeout: 15000 });

// GOOD: Wait for a specific condition
await page.waitForFunction(() => {
    return document.querySelectorAll('table tbody tr').length > 0;
});
```

## Screenshot Comparison (Visual Testing)

```typescript
// Full page screenshot comparison
test('dashboard renders correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveScreenshot('dashboard.png', {
        maxDiffPixelRatio: 0.01,
        animations: 'disabled',
    });
});

// Element-level screenshot
test('navigation menu renders correctly', async ({ page }) => {
    await page.goto('/dashboard');
    const nav = page.getByRole('navigation');
    await expect(nav).toHaveScreenshot('navigation.png');
});

// Update baselines: npx playwright test --update-snapshots

// playwright.config.ts
export default defineConfig({
    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.01,
            animations: 'disabled',
            caret: 'hide',
        },
    },
    snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
});
```

## Parallel Execution

```typescript
// playwright.config.ts
export default defineConfig({
    fullyParallel: true,           // Run tests in parallel
    workers: ENV_CONFIG_VALUE ? 4 : undefined,  // 4 workers in CI
    retries: ENV_CONFIG_VALUE ? 2 : 0,          // Retry flaky tests in CI

    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
        { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
    ],
});

// Tests must be independent for parallel execution
// Each test gets its own browser context (isolated cookies, storage)
```

## Flaky Test Management

### Detection

```typescript
// playwright.config.ts
export default defineConfig({
    retries: 2,  // Retry failed tests up to 2 times
    reporter: [
        ['html'],
        ['json', { outputFile: 'test-results.json' }]
    ],
});

// After running: analyze test-results.json for tests that passed on retry
// These are your flaky tests
```

### Common Causes and Fixes

```
1. Race conditions with animations
   FIX: Disable animations in test config
   page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });

2. Network timing
   FIX: Wait for specific network responses, not arbitrary timeouts

3. Non-deterministic data
   FIX: Use seeded test data, reset DB state between tests

4. Third-party dependencies (ads, analytics, chatbots)
   FIX: Block these in tests via route interception
   await page.route('**/*analytics*', route => route.abort());

5. Date/time dependencies
   FIX: Mock the clock
   await page.clock.install({ time: new Date('2025-03-15T10:00:00') });
```

## CI Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

## Test Reporting

```typescript
// playwright.config.ts
export default defineConfig({
    reporter: [
        ['list'],                                    // Console output
        ['html', { open: 'never' }],                // HTML report
        ['junit', { outputFile: 'results.xml' }],   // For CI
        ['json', { outputFile: 'results.json' }],   // For custom dashboards
    ],
});
```

## Best Practices Summary

1. **Test user workflows, not implementation**: Click buttons, fill forms, verify outcomes
2. **Use page objects**: Encapsulate page structure, keep tests readable
3. **Prefer role-based selectors**: Accessible, resilient, framework-agnostic
4. **Never use hard-coded waits**: Use Playwright's auto-wait or explicit conditions
5. **Keep tests independent**: No shared state between tests
6. **Test the critical path first**: Login, checkout, core features
7. **Run in CI on every PR**: Catch regressions before merge
8. **Manage flaky tests proactively**: Quarantine, fix, or delete them

## When to Use

**Use this skill when:**
- Designing or implementing e2e test architect solutions
- Reviewing or improving existing e2e test architect approaches
- Making architectural or implementation decisions about e2e test architect
- Learning e2e test architect patterns and best practices
- Troubleshooting e2e test architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# E2e Test Architect Analysis

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

**Input:** "Help me implement e2e test architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended e2e test architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When e2e test architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
