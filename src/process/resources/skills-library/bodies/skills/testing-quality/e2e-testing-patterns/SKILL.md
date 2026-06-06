---
name: e2e-testing-patterns
description: |
  Guides expert-level e2e testing patterns implementation: automation and web-development decision frameworks, production-ready patterns, and concrete templates for e2e testing patterns workflows.
  Use when the user asks about e2e testing patterns, e2e testing patterns configuration, or testing best practices for e2e projects.
  Do NOT use when the user needs a different testing quality capability -- check sibling skills in the testing quality subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "testing automation web-development"
  category: "testing-quality"
  subcategory: "testing-quality"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# E2E Testing Patterns

## When to Use

**Use this skill when:**
- The user asks how to structure or architect an end-to-end test suite for a web application, mobile app, or API surface
- The user wants to reduce flakiness in their existing Playwright, Cypress, Selenium, or WebdriverIO test suite
- The user asks which selectors, fixtures, or page object patterns to use for maintainable E2E tests
- The user needs to integrate E2E tests into a CI/CD pipeline (GitHub Actions, GitLab CI, CircleCI, Jenkins) and wants stage gating, parallelization, or artifact handling guidance
- The user wants to decide between test isolation strategies -- shared state vs. fully isolated test runs -- and understand the trade-offs for their scale
- The user is designing a test data strategy for E2E tests (seeding, teardown, factory patterns, test accounts)
- The user wants to implement retry logic, visual regression testing, accessibility checks, or network interception within their E2E suite
- The user asks about the testing pyramid and where E2E tests belong relative to unit and integration tests

**Do NOT use this skill when:**
- The user needs unit testing patterns (Jest, Vitest, pytest, JUnit) -- use the unit testing skill instead
- The user needs API contract testing (Pact, Dredd) -- use the contract testing skill
- The user needs component-level testing with testing-library -- use the component testing skill
- The user is asking about load or performance testing (k6, Locust, JMeter) -- use the performance testing skill
- The user needs help writing a specific assertion or fixing a single broken test -- use the general debugging skill and apply only the relevant selector or wait strategy guidance from this skill
- The user is building a test framework from scratch for a non-web target (embedded systems, CLI tools) -- E2E patterns for GUI automation differ significantly
- The user wants CI pipeline configuration generally without E2E-specific context -- use the CI/CD pipeline skill

---

## Process

### 1. Assess the Application Under Test and Testing Goals

Before writing a single test, understand the system boundaries.

- **Identify the critical user journeys (CUJs):** These are the 3--10 workflows without which the application has no value. For an e-commerce app: add to cart, checkout, account login, order history. For a SaaS dashboard: login, create resource, view report, delete resource. E2E tests should cover CUJs first and expand outward only when CUJs are stable.
- **Map the technical surface:** Determine whether the app is server-rendered (Next.js SSR, Rails, Django templates), client-rendered (React SPA, Vue SPA), or a hybrid. Server-rendered pages often have simpler wait conditions; SPAs require explicit waits for network calls and DOM hydration.
- **Establish the test scope boundary:** Define what the E2E suite is NOT testing. If you have robust unit tests for business logic, E2E tests should not re-verify calculations -- they should verify that the correct result appears in the UI after user interaction.
- **Quantify acceptable flakiness:** Set a numeric threshold. A flakiness rate above 2% on any single test (measured over 100 runs) means that test costs more in engineer time than it provides signal. Tests above that threshold must be fixed or deleted within one sprint.
- **Identify external dependencies:** Third-party payment processors (Stripe, Braintree), email services, SSO providers, and CDN-served assets are candidates for stubbing or test-mode APIs. Document these explicitly before writing tests.

### 2. Choose the Right Framework for the Context

Framework selection has long-term maintenance consequences. Evaluate against these criteria:

- **Playwright** is the recommended default for greenfield projects as of 2024. It has native multi-browser support (Chromium, Firefox, WebKit), built-in auto-waiting, network interception, trace viewer, and parallel test execution. It uses an async/await model in TypeScript, JavaScript, Python, Java, and C#.
- **Cypress** is appropriate when the team is JavaScript-heavy and wants an interactive test runner with excellent debugging ergonomics. Cypress runs in-browser, which simplifies same-origin interactions but complicates cross-domain flows. Use Cypress when developer experience during test authoring is the top priority.
- **WebdriverIO** is appropriate when testing native mobile apps alongside web (via Appium integration) or when the team is already invested in the WebDriver protocol for compliance reasons (e.g., government or financial organizations requiring W3C WebDriver).
- **Selenium** is a legacy choice. Only select it for organizations with large existing Selenium investments or when testing in a proprietary browser environment where Playwright/Cypress are unsupported.
- **Decision rule:** If the project uses TypeScript and deploys to the web, choose Playwright. If the project is a React Native app with web companion, choose WebdriverIO + Appium. If the team already has 500+ Cypress tests, do not migrate unless the suite has systemic unfixable problems -- migration costs typically exceed 6 months of engineer time for suites of that size.

### 3. Design the Test Architecture and Folder Structure

Test architecture determines how maintainable the suite is at scale. Use these conventions:

- **Adopt the Page Object Model (POM) selectively:** POMs are valuable when a page or component is used across 3 or more tests. Do not create POMs for one-off test flows -- they add indirection without benefit. A POM should expose user-intent methods (`loginAs(user)`, `addProductToCart(sku)`) not raw DOM interactions (`click('#cart-btn')`).
- **Use Fixtures for test data and shared setup:** In Playwright, fixtures are first-class. Define authenticated session fixtures, test user fixtures, and feature-flag fixtures. Fixtures should be composable -- an `authenticatedAdminPage` fixture should compose a `page` fixture and an `authToken` fixture, not duplicate the login flow.
- **Organize by user journey, not by page:** A folder structure like `tests/checkout/`, `tests/onboarding/`, `tests/reporting/` is more maintainable than `tests/pages/cart/`, `tests/pages/profile/`. Journey-based organization makes it obvious what is tested when requirements change.
- **Separate test helpers from test files:** Keep utilities in `support/` or `helpers/`, keep test data factories in `factories/`, keep page objects in `pages/` or `components/`. Test files in `tests/` or `e2e/` should read as plain-English descriptions of user behavior.
- **Recommended folder structure:**
  ```
  e2e/
    fixtures/          # Playwright fixtures or Cypress custom commands
    pages/             # Page Object Models
    factories/         # Test data factory functions
    support/           # Shared utilities (waitForNetworkIdle, interceptApi, etc.)
    tests/
      auth/
      checkout/
      onboarding/
    playwright.config.ts (or cypress.config.ts)
  ```

### 4. Define the Selector Strategy

Selector choice is the single largest driver of test brittleness. Apply these rules in priority order:

- **Priority 1 -- ARIA roles and accessible names:** `getByRole('button', { name: 'Submit Order' })` is the most resilient selector because it breaks only when the feature behavior changes. This is also the approach recommended by the Testing Library philosophy and is fully supported in Playwright.
- **Priority 2 -- Test IDs:** When ARIA roles are ambiguous or the element has no semantic role, use `data-testid` or `data-cy` attributes. These must be added by developers as part of feature work. Standardize the attribute name team-wide. Example: `data-testid="checkout-total-price"`.
- **Priority 3 -- Form labels:** For input fields, `getByLabel('Email address')` is stable and meaningful.
- **Priority 4 -- Text content:** `getByText('Order confirmed')` is acceptable for unique, stable UI strings. Avoid it for strings that appear multiple times on a page or are subject to frequent copy changes.
- **NEVER use:** CSS class selectors (`.btn-primary`, `.card__title`) or XPath based on DOM structure (`//div[3]/span[2]`). These break on every refactor. Position-based selectors (`nth-child`) are also forbidden except in parameterized table tests where position is semantically meaningful.
- **Enforce selector rules in CI:** Add ESLint rules (eslint-plugin-playwright) or custom lint scripts that flag forbidden selector patterns. This prevents regressions from engineers who are not familiar with the conventions.

### 5. Implement Wait Strategies and Eliminate Artificial Delays

Flakiness in E2E tests has one dominant cause: timing. Eliminate all `sleep()`, `wait(ms)`, and `cy.wait(1000)` calls from the codebase.

- **Use framework auto-waiting:** Playwright auto-waits for elements to be visible, enabled, and stable before interacting. This covers the majority of cases. Cypress similarly polls the DOM. Trust these mechanisms before adding explicit waits.
- **Wait for network responses explicitly when needed:** After a form submission, wait for the specific API response, not a fixed timeout. In Playwright: `const responsePromise = page.waitForResponse('**/api/orders'); await page.click('button[type=submit]'); await responsePromise;`. In Cypress: `cy.intercept('POST', '/api/orders').as('createOrder'); cy.get('[type=submit]').click(); cy.wait('@createOrder');`.
- **Wait for UI state, not time:** After a loading spinner appears, wait for it to disappear: `await page.waitForSelector('.loading-spinner', { state: 'hidden' })`. After navigation, wait for the URL to match or a landmark element to appear.
- **Set global timeouts appropriately:** Playwright's default actionTimeout is 30 seconds -- this is too long for local development feedback. Set actionTimeout to 10 seconds in config, and override to 30 seconds only for known slow operations (file uploads, external OAuth flows). This gives faster failure signals.
- **Use `waitForLoadState` correctly:** `waitForLoadState('networkidle')` waits for no network requests for 500ms -- useful after navigation but dangerous on pages with polling APIs (analytics, real-time dashboards). Use `waitForLoadState('domcontentloaded')` for those pages and add explicit element waits instead.

### 6. Design the Test Data Strategy

Test data management is the most underestimated challenge in E2E testing. Poor test data leads to coupled tests, order-dependent failures, and environmental drift.

- **Use test-specific data seeding, not shared fixtures:** Each test (or test suite) should create exactly the data it needs via an API call or database seed, then tear it down after. Never rely on pre-existing records in a shared test database. Use unique identifiers (UUID prefix + timestamp) in test data to prevent collisions.
- **Build factory functions, not static JSON fixtures:** A `createTestUser({ role: 'admin', verified: true })` factory is more flexible than a `fixtures/admin-user.json` file. Factories accept overrides, generate required fields automatically, and can call the application's own API to create data in a production-equivalent way.
- **Prefer API-level setup over UI-level setup:** Use the application's REST or GraphQL API to create prerequisite data, not UI flows. Logging in via the API to get a session token, then injecting it into the browser, is 10x faster than driving the login UI for every test. Playwright supports `request` fixtures for API calls alongside `page` fixtures.
- **Isolate test environments:** E2E tests should run against a dedicated test environment, not production and not a shared staging environment where other engineers are deploying. Use ephemeral environments (preview deployments) in CI for pull request validation.
- **Handle test account cleanup:** Register a cleanup hook (Playwright's `afterEach` / `afterAll`, Cypress's `after`) that deletes test-created records. If cleanup fails, log the orphaned record IDs so they can be purged manually. Do not rely on database resets between tests as the sole cleanup mechanism -- it is too slow and couples tests to database access patterns.

### 7. Configure CI Integration and Parallelization

A test suite that takes more than 10 minutes to complete in CI is not being used effectively for fast feedback.

- **Parallelize at the shard level:** Playwright supports sharding natively (`--shard=1/4`). Split tests across N workers in CI based on total test count. For suites under 50 tests, a single worker is fine. For 50--200 tests, use 2--4 shards. For 200+ tests, use 4--8 shards. Measure and adjust based on actual CI runtime, targeting 5--8 minutes total.
- **Run E2E tests in two stages in CI:** Stage 1 (smoke/critical path) runs on every pull request -- 10--20 tests covering core CUJs, must complete in under 3 minutes. Stage 2 (full suite) runs on merge to main or nightly -- the complete test suite. This balances feedback speed with coverage.
- **Capture test artifacts on failure:** Always configure CI to save screenshots, video recordings, and trace files on test failure. In Playwright, set `use: { screenshot: 'only-on-failure', video: 'on-first-retry', trace: 'on-first-retry' }`. These artifacts are the primary debugging tool for CI failures that cannot be reproduced locally.
- **Use retries judiciously:** Configure a maximum of 2 retries for CI runs (`retries: 2` in Playwright config). More than 2 retries means the suite is masking real flakiness rather than addressing it. Track retry rates per test as a flakiness metric.
- **Pin browser versions in CI:** Use Docker images with pinned browser versions or Playwright's `--browser chromium` with a fixed Playwright version in package.json. Browser auto-updates in CI are a source of unexpected test failures.
- **Upload test results to a reporting service:** Use Playwright's HTML reporter or integrate with Allure Report, ReportPortal, or Grafana for historical trend tracking. Flakiness trends must be visible to the team, not buried in raw CI logs.

### 8. Establish Maintenance Protocols

A test suite without active maintenance decays into a liability within 6 months.

- **Review flaky tests weekly:** Assign ownership. The engineer who last touched the feature area that a flaky test covers owns fixing that test within the current sprint. Do not let flaky tests accumulate.
- **Apply the "delete or fix" rule:** A test that has been skipped for more than 2 sprints must either be fixed immediately or permanently deleted. Commented-out tests are technical debt with zero benefit.
- **Update selectors as part of feature work:** When a developer changes a UI element that has associated E2E tests, updating those tests is part of the definition of done for that feature, not optional follow-up work.
- **Conduct quarterly test suite audits:** Every quarter, review: test count vs. CUJ coverage, average test duration, flakiness rate per test, and duplicate coverage between E2E and integration tests. Remove tests that duplicate lower-level coverage with no additional confidence benefit.
- **Document test intent, not implementation:** Test descriptions should answer "what user scenario is this validating?" not "what selectors are being clicked?" A test named `checkout - user can complete purchase with saved credit card after adding a promo code` is self-documenting. A test named `test checkout flow 3` is not.

---

## Output Format

When responding to a user about E2E testing patterns, structure the output as follows:

```markdown
## E2E Testing Assessment: [Project Context]

### Context Summary
- **Framework:** [Playwright / Cypress / WebdriverIO]
- **Application type:** [SPA / SSR / Mobile / Hybrid]
- **Team size:** [N engineers]
- **Current test count:** [N tests, or "greenfield"]
- **Primary problem:** [Flakiness / Coverage gaps / CI performance / Architecture]

---

### Critical User Journey Map
| Journey | Priority | Current Coverage | Recommended Test Count |
|---------|----------|-----------------|----------------------|
| [e.g., User login and auth] | P0 | [None / Partial / Full] | [2--4 tests] |
| [e.g., Core purchase flow] | P0 | [None / Partial / Full] | [4--6 tests] |
| [e.g., Account settings] | P1 | [None / Partial / Full] | [2--3 tests] |

---

### Selector Strategy Decision
| Element Type | Recommended Selector | Example |
|--------------|----------------------|---------|
| Buttons with clear labels | getByRole + name | `getByRole('button', { name: 'Place Order' })` |
| Form inputs | getByLabel | `getByLabel('Email address')` |
| Custom UI components | data-testid | `getByTestId('cart-item-count')` |
| Navigation links | getByRole + name | `getByRole('link', { name: 'My Orders' })` |

---

### Wait Strategy Assessment
| Scenario | Anti-Pattern | Correct Pattern |
|----------|-------------|-----------------|
| After form submit | `await page.waitForTimeout(2000)` | `await page.waitForResponse('**/api/submit')` |
| After navigation | `cy.wait(1000)` | `cy.url().should('include', '/dashboard')` |
| Loading state | Fixed sleep | `waitForSelector('.spinner', { state: 'hidden' })` |

---

### Test Architecture Recommendation
[Page Object structure or fixture design recommendation specific to the project]

---

### CI Configuration
- **Smoke suite:** [N tests, target runtime, trigger]
- **Full suite:** [N tests, target runtime, trigger, shard count]
- **Artifact config:** [Screenshot / video / trace settings]
- **Flakiness threshold:** 2% per test over 100 runs

---

### Implementation: [Specific Pattern or Code Snippet]
[Concrete, runnable code tailored to the user's framework and context]

---

### Maintenance Protocol
- Flaky test review cadence: [Weekly]
- Ownership model: [Feature owner / QA guild / Shared]
- Definition of done update: [E2E update required for UI changes]
```

---

## Rules

1. **NEVER write a test that calls `page.waitForTimeout()` or `cy.wait(N)` with a hardcoded millisecond value.** These are always wrong. Replace with event-driven waits (network response, element state, URL change). If the wait is for something truly non-deterministic, add a comment explaining why and use a maximum timeout, not a fixed delay.

2. **NEVER use CSS class selectors in E2E tests.** Classes like `.btn-primary` or `.form__input--error` change during styling refactors that have nothing to do with user-facing behavior. These selectors cause tests to fail for non-behavioral reasons, destroying trust in the test suite.

3. **NEVER log in via the UI in a fixture that runs before every test.** Login via UI takes 2--5 seconds. Across 100 tests, this wastes 3--8 minutes of CI time. Use the application's auth API to obtain a session token and inject it via `context.addCookies()` or `localStorage.setItem()`.

4. **NEVER share mutable test data between tests in the same suite.** If Test A creates a record and Test B reads it, deleting the record in Test A's teardown breaks Test B unpredictably depending on execution order. Each test owns its data lifecycle end-to-end.

5. **NEVER configure more than 2 retries in CI.** Retries mask flakiness -- they do not fix it. A test that passes on retry 2 out of 100 runs is a flaky test that needs to be fixed. Track retry counts per test separately from pass/fail rates.

6. **ALWAYS scope `data-testid` attributes semantically.** `data-testid="button"` is useless when there are 20 buttons on a page. Use `data-testid="checkout-confirm-button"` or `data-testid="nav-user-menu-toggle"`. The test ID should uniquely identify the element's purpose in context.

7. **ALWAYS assert on the result of an action, not just that the action occurred.** After clicking "Submit Order", assert that the order confirmation page is displayed AND that the order number appears AND that the user's email is shown in the confirmation. Asserting only that the button was clickable provides no confidence in the outcome.

8. **ALWAYS run E2E tests against a deployed, realistic environment.** Mocking the entire backend in an E2E test defeats the purpose -- E2E tests exist to validate the integrated system. Network interception (Playwright's `route()`, Cypress's `cy.intercept()`) is appropriate only for third-party services (payment gateways, email providers) or for testing specific error conditions that cannot be reliably triggered in a real environment.

9. **NEVER allow E2E tests to create records in production.** CI pipelines misconfigured to point at production have caused real user data corruption and billing charges in real organizations. Validate the environment URL in a test setup check that fails loudly if it detects a production domain.

10. **ALWAYS measure and report three suite-level metrics:** total duration, pass rate, and per-test flakiness rate. Without these metrics, test suite quality is invisible and will degrade silently. Flakiness rate above 5% for the whole suite is a P1 engineering issue requiring dedicated sprint capacity.

---

## Edge Cases

### Flaky Tests Caused by Animation and CSS Transitions
Many UI frameworks use CSS transitions (200--400ms) for modals, dropdowns, and toasts. An element can be technically "visible" in the DOM but still animating -- clicks during animation hit the wrong target or trigger no action. Fix this by: (a) using `actionability` checks that Playwright provides (it waits for elements to stop moving), (b) disabling animations in the E2E test environment via CSS (`*, *::before, *::after { animation-duration: 0ms !important; transition-duration: 0ms !important; }`), injected via a global stylesheet fixture. In Cypress, add this CSS to `cypress/support/index.css`. This single change resolves 30--40% of animation-related flakiness.

### Third-Party OAuth and SSO Flows
Testing login flows that redirect to an external identity provider (Google OAuth, Okta, Auth0, SAML) is a common E2E challenge. Never automate the third-party login UI directly -- it violates the provider's terms of service, is slow, and breaks when the provider updates their login page. Instead: (a) use the identity provider's test credentials or sandbox environment, (b) if the provider supports it, use a direct token endpoint to exchange credentials for a session token programmatically, bypassing the UI entirely, (c) for providers without sandbox support, use a dedicated test user in the production IdP that is never used by real users, and document its credentials in a secrets manager. In Playwright, use `request.post('https://auth-provider.com/token', ...)` in a fixture to obtain the token before the test starts.

### Multi-Tab and Pop-Up Window Handling
Some flows open payment iframes, OAuth pop-ups, or file download dialogs in new browser contexts. In Playwright, handle new tabs with `const [newPage] = await Promise.all([context.waitForEvent('page'), page.click('.open-in-new-tab')])` and then interact with `newPage` as a normal page object. In Cypress, new-tab navigation is intentionally blocked -- the standard workaround is to stub `window.open` and assert on the URL argument rather than following the navigation. For file downloads, use Playwright's download event: `const [download] = await Promise.all([page.waitForEvent('download'), page.click('#download-report')])`, then assert on `download.suggestedFilename()` and validate the file content if needed.

### Dynamic and Virtualized Lists
Infinite scroll lists, virtual scrollers (react-window, TanStack Virtual), and paginated data tables render only a subset of items in the DOM. Trying to find a list item by text when it is not yet rendered will fail. Handle this by: (a) scrolling the container to trigger rendering (`page.evaluate(() => container.scrollTo(0, container.scrollHeight))`), (b) using the application's search or filter API to bring the target item into the visible window before asserting, (c) never writing tests that depend on a specific position in a large dynamic list -- instead filter the list to a known state first.

### Environment-Specific Feature Flags
Many applications use feature flags (LaunchDarkly, Split.io, Unleash, custom implementations) to control feature rollout. A test written against a flag-enabled UI will fail in an environment where the flag is off. Always: (a) explicitly set required feature flags to a known state at test setup time, either via the flag provider's API or via a URL parameter convention your application supports (e.g., `?flags=new-checkout-enabled`), (b) tag tests that depend on a specific flag state (`@flag:new-checkout`) so they can be excluded from flag-disabled environments, (c) never write tests that silently pass in both flag states by accident -- the test should clearly document which flag state it validates.

### Testing Behind Authentication in CI with Ephemeral Environments
Ephemeral preview environments (Vercel previews, Railway, Heroku review apps) often have HTTP basic auth applied as a blanket security measure to prevent public access. This breaks Playwright/Cypress navigation. Handle it by: (a) passing HTTP basic auth credentials via the URL (`https://user:pass@preview.example.com`), (b) using Playwright's `page.authenticate({ username, password })` before navigation, (c) storing the basic auth credentials in CI secrets and passing them via environment variables to the test config. Never hardcode preview environment credentials in test files.

### Visual Regression Testing Integration
Adding visual regression tests (Percy, Playwright's `toHaveScreenshot()`, Chromatic) to an existing E2E suite requires careful scoping. Do not apply visual regression to the entire suite -- maintenance cost is prohibitive. Apply it to: (a) design system components that have no functional assertion that would catch visual regressions, (b) critical landing pages where brand consistency matters, (c) email templates or PDF outputs. For `toHaveScreenshot()`, establish a baseline update workflow (run `--update-snapshots` locally, review the diff, commit the new baseline) and enforce baseline updates in the same PR as the UI change. Use a `--threshold=0.2` (0.2% pixel difference tolerance) to avoid noise from antialiasing differences between platforms.

---

## Example

**Input:** "We have a React SPA (TypeScript) with a Node.js/Express backend. We're using Playwright but our test suite has 40% flakiness across 80 tests. Login happens before every test using the UI. Tests share a single test database that isn't reset between runs. We deploy to AWS, CI runs on GitHub Actions. Help us fix this."

**Output:**

## E2E Testing Assessment: React SPA with High Flakiness

### Context Summary
- **Framework:** Playwright (TypeScript)
- **Application type:** React SPA
- **Team size:** Unknown (assume 4--8 based on 80-test suite)
- **Current test count:** 80 tests, 40% flakiness rate
- **Primary problems:** UI-driven login in every test, shared mutable test database, likely timing-related selector issues

---

### Root Cause Analysis

A 40% flakiness rate in an 80-test suite means approximately 32 tests produce unreliable results. Based on the described setup, there are three root causes:

**Root Cause 1: UI login before every test (~15--25% of flakiness)**
Each test running login UI adds 3--6 seconds of timing-sensitive interaction. Over 80 tests, this is 4--8 minutes of unnecessary wait -- and 80 opportunities for a network hiccup, animation timing issue, or slow CI runner to cause a spurious failure.

**Root Cause 2: Shared mutable test database (~10--15% of flakiness)**
Tests that create, read, or modify shared records become order-dependent. If Test A expects a record count of 5 and Test B previously created record 6, Test A fails. Parallel test runs make this dramatically worse.

**Root Cause 3: Hardcoded waits or fragile selectors (~5--10% of flakiness)**
In suites with these architectural problems, engineers typically add `waitForTimeout` calls as workarounds, compounding the issue.

---

### Fix Plan: Phase 1 -- Authentication (Week 1, highest ROI)

Replace UI login with API-based session injection. Implement a Playwright fixture:

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base, expect, APIRequestContext } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
};

async function getSessionToken(
  request: APIRequestContext,
  credentials: { email: string; password: string }
): Promise<string> {
  const response = await request.post('/api/auth/login', {
    data: credentials,
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.sessionToken; // adjust to match your auth API response shape
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser, request }, use) => {
    const token = await getSessionToken(request, {
      email: process.env.E2E_USER_EMAIL!,
      password: process.env.E2E_USER_PASSWORD!,
    });

    const context = await browser.newContext();
    // Inject session into browser storage -- adjust key to match your app
    await context.addInitScript((sessionToken) => {
      localStorage.setItem('auth_token', sessionToken);
    }, token);
    // Or use cookies if your app is cookie-based:
    // await context.addCookies([{
    //   name: 'session',
    //   value: token,
    //   domain: 'localhost',
    //   path: '/',
    // }]);

    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser, request }, use) => {
    const token = await getSessionToken(request, {
      email: process.env.E2E_ADMIN_EMAIL!,
      password: process.env.E2E_ADMIN_PASSWORD!,
    });
    const context = await browser.newContext();
    await context.addInitScript((t) => localStorage.setItem('auth_token', t), token);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
```

Usage in tests:

```typescript
// e2e/tests/dashboard/reports.spec.ts
import { test, expect } from '../../fixtures/auth.fixture';

test('user can view monthly revenue report', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard/reports');
  await expect(authenticatedPage.getByRole('heading', { name: 'Revenue Reports' })).toBeVisible();
  await authenticatedPage.getByRole('button', { name: 'This Month' }).click();
  await authenticatedPage.waitForResponse('**/api/reports/revenue*');
  await expect(authenticatedPage.getByTestId('revenue-chart')).toBeVisible();
  await expect(authenticatedPage.getByTestId('total-revenue-value')).toContainText('$');
});
```

**Expected impact:** Reduces per-test setup time from ~4 seconds to ~300ms. Eliminates all flakiness from the login UI flow. This alone should reduce flakiness rate by 15--20 percentage points.

---

### Fix Plan: Phase 2 -- Test Data Isolation (Week 1--2)

Replace shared database state with per-test data creation and teardown.

**Factory pattern:**

```typescript
// e2e/factories/order.factory.ts
import { APIRequestContext } from '@playwright/test';
import { v4 as uuid } from 'uuid';

export interface TestOrder {
  id: string;
  customerEmail: string;
  totalCents: number;
  status: 'pending' | 'complete' | 'cancelled';
}

export async function createTestOrder(
  request: APIRequestContext,
  overrides: Partial<TestOrder> = {}
): Promise<TestOrder> {
  const payload = {
    customerEmail: `test-${uuid()}@example-test.com`,
    totalCents: 9900,
    status: 'pending',
    ...overrides,
  };

  const response = await request.post('/api/internal/test/orders', {
    data: payload,
    headers: {
      'X-Test-API-Key': process.env.E2E_INTERNAL_API_KEY!,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create test order: ${await response.text()}`);
  }

  return response.json();
}

export async function deleteTestOrder(
  request: APIRequestContext,
  orderId: string
): Promise<void> {
  await request.delete(`/api/internal/test/orders/${orderId}`, {
    headers: { 'X-Test-API-Key': process.env.E2E_INTERNAL_API_KEY! },
  });
}
```

**Usage with proper teardown:**

```typescript
// e2e/tests/orders/order-detail.spec.ts
import { test, expect } from '../../fixtures/auth.fixture';
import { createTestOrder, deleteTestOrder } from '../../factories/order.factory';

test('admin can view order detail and mark as complete', async ({ adminPage, request }) => {
  // Create test-specific data
  const order = await createTestOrder(request, { status: 'pending', totalCents: 4999 });

  try {
    await adminPage.goto(`/admin/orders/${order.id}`);
    await expect(adminPage.getByRole('heading', { name: `Order #${order.id}` })).toBeVisible();
    await expect(adminPage.getByTestId('order-status-badge')).toHaveText('Pending');

    await adminPage.getByRole('button', { name: 'Mark as Complete' }).click();
    await adminPage.waitForResponse(`**/api/orders/${order.id}`);

    await expect(adminPage.getByTestId('order-status-badge')).toHaveText('Complete');
  } finally {
    // Always clean up, even on test failure
    await deleteTestOrder(request, order.id);
  }
});
```

**Note on the internal test API:** This pattern requires a thin internal API available only in non-production environments that allows test setup and teardown. Protect this with an `E2E_INTERNAL_API_KEY` environment variable and ensure it returns a 404 in production.

---

### Wait Strategy Audit: Replace All Hardcoded Waits

Run this command to find all hardcoded waits in the suite:

```bash
grep -rn "waitForTimeout\|cy\.wait([0-9]" e2e/
```

For each occurrence, apply the appropriate replacement:

| Hardcoded Wait Pattern | Replace With |
|------------------------|-------------|
| `await page.waitForTimeout(2000)` after form submit | `await page.waitForResponse('**/api/[endpoint]')` |
| `await page.waitForTimeout(1000)` after navigation | `await expect(page).toHaveURL(/\/dashboard/)` |
| `await page.waitForTimeout(500)` for spinner to clear | `await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden' })` |
| `await page.waitForTimeout(300)` for dropdown to open | Remove entirely -- Playwright auto-waits for element visibility |

Add animation-disabling CSS as a global fixture:

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    // ...
    contextOptions: {
      // Disable CSS transitions and animations for all tests
    },
  },
  // Inject CSS that disables animations
  globalSetup: './e2e/global-setup.ts',
});
```

```typescript
// e2e/global-setup.ts
// Add to your base page fixture or use addInitScript in contexts:
// await context.addStyleTag({
//   content: '*, *::before, *::after { animation-duration: 0ms !important; transition-duration: 0ms !important; }'
// });
```

---

### CI Configuration for GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  smoke-tests:
    name: Smoke Tests (PR Gate)
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install chromium --with-deps
      - name: Run smoke tests
        run: npx playwright test --grep @smoke
        env:
          BASE_URL: ${{ vars.E2E_PREVIEW_URL }}
          E2E_USER_EMAIL: ${{ secrets.E2E_USER_EMAIL }}
          E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}
          E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
          E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
          E2E_INTERNAL_API_KEY: ${{ secrets.E2E_INTERNAL_API_KEY }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: smoke-test-results
          path: playwright-report/
          retention-days: 7

  full-suite:
    name: Full E2E Suite (Post-Merge)
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    timeout-minutes: 20
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install chromium --with-deps
      - name: Run full suite (shard ${{ matrix.shard }}/4)
        run: npx playwright test --shard=${{ matrix.shard }}/4
        env:
          BASE_URL: ${{ vars.E2E_STAGING_URL }}
          E2E_USER_EMAIL: ${{ secrets.E2E_USER_EMAIL }}
          E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}
          E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
          E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
          E2E_INTERNAL_API_KEY: ${{ secrets.E2E_INTERNAL_API_KEY }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: full-suite-results-shard-${{ matrix.shard }}
          path: |
            playwright-report/
            test-results/
          retention-days: 14
```

---

### Playwright Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 2,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

---

### Expected Outcomes After Implementing All Three Phases

| Metric | Before | After Phase 1 | After Phase 2 | After Phase 3 |
|--------|--------|--------------|--------------|--------------|
| Flakiness rate | 40% | ~20% | ~5% | <2% |
| CI runtime (full suite) | ~18 min | ~14 min | ~12 min | ~6 min (with sharding) |
| Per-test setup time | 4--6s | 300ms | 300ms | 300ms |
| Debug-ability on failure | Low | Medium | High | High (traces + artifacts) |

Implement Phase 1 (auth fixtures) first -- it delivers the highest flakiness reduction for the lowest implementation effort (estimated 2--4 engineer hours). Phase 2 (data isolation) requires coordination with the backend team to add the internal test API, which is the main investment. Phase 3 (wait audit + CI sharding) can be parallelized with Phase 2 by a different team member.
