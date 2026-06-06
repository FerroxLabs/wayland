---
name: browser-automator
description: |
  Browser automation expertise covering Playwright and Puppeteer patterns, element selection strategies, wait mechanisms, network interception, file download and upload handling, multi-tab management, authentication flows, headless vs headed modes, screenshot and PDF generation, and CI integration.
  Use when the user asks about browser automator, browser automator best practices, or needs guidance on browser automator implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "automation shell-scripting web-development"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Browser Automator

## Core Philosophy

Browser automation programmatically controls a web browser to perform tasks that would otherwise require manual interaction: form filling, data extraction, testing, screenshot generation, and workflow automation. The key to reliable browser automation is understanding the asynchronous nature of web pages and building robust wait strategies that adapt to real-world page load variability.

## Framework Selection

### Playwright vs Puppeteer

| Feature | Playwright | Puppeteer |
|---------|-----------|-----------|
| Languages | JS/TS, Python, Java, .NET | JS/TS only |
| Browsers | Chromium, Firefox, WebKit | Chrome/Chromium (Firefox experimental) |
| Auto-wait | Built-in for all actions | Manual waits needed |
| Selectors | Role, text, CSS, XPath, test ID | CSS, XPath |
| Network interception | Yes, full API | Yes |
| Downloads/Uploads | First-class support | Supported |
| Parallel execution | Browser contexts (lightweight) | Incognito pages |
| Debugging | Trace viewer, codegen | DevTools Protocol |

**Recommendation:** Use Playwright for new projects. It has better auto-waiting, cross-browser support, and a richer API.

## Element Selection Strategies

### Priority Order

```typescript
// 1. Role-based (best: semantic, resilient)
await page.getByRole('button', { name: 'Submit' });
await page.getByRole('textbox', { name: 'Email' });
await page.getByRole('link', { name: 'Sign Up' });
await page.getByRole('heading', { name: 'Dashboard', level: 1 });
await page.getByRole('checkbox', { name: 'Accept terms' });

// 2. Text-based (good for visible text)
await page.getByText('Welcome back');
await page.getByLabel('Email address');
await page.getByPlaceholder('Enter your email');
await page.getByTitle('Close dialog');
await page.getByAltText('Company logo');

// 3. Test ID (good: stable, decoupled from UI)
await page.getByTestId('submit-form');

// 4. CSS selectors (last resort)
await page.locator('.product-card:first-child .add-to-cart');
await page.locator('[data-type="premium"]');

// 5. XPath (avoid unless necessary)
await page.locator('xpath=//div[@class="results"]//span[contains(text(), "Total")]');

// Chaining locators
await page.getByRole('listitem')
    .filter({ hasText: 'Premium Plan' })
    .getByRole('button', { name: 'Select' });

// nth element
await page.getByRole('listitem').nth(2);
await page.getByRole('listitem').first();
await page.getByRole('listitem').last();
```

## Wait Mechanisms

### Playwright Auto-Wait

```typescript
// Playwright automatically waits for elements to be:
// - Attached to DOM
// - Visible
// - Stable (no animation)
// - Enabled
// - Not obscured by other elements

// These all auto-wait:
await page.getByRole('button').click();
await page.getByLabel('Name').fill('Alice');
await page.getByRole('checkbox').check();
await page.getByRole('option').selectOption('premium');
```

### Explicit Waits

```typescript
// Wait for element state
await page.getByTestId('loading').waitFor({ state: 'hidden' });
await page.getByTestId('results').waitFor({ state: 'visible', timeout: 10000 });
await page.getByTestId('content').waitFor({ state: 'attached' });

// Wait for URL
await page.waitForURL('**/dashboard');
await page.waitForURL(/\/orders\/\d+/);

// Wait for network response
const responsePromise = page.waitForResponse(
    resp => resp.url().includes('/api/data') && resp.status() === 200
);
await page.getByRole('button', { name: 'Load' }).click();
const response = await responsePromise;

// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait for JavaScript condition
await page.waitForFunction(() => {
    return document.querySelectorAll('.item').length >= 10;
}, { timeout: 15000 });

// Wait for custom event
await page.waitForEvent('download');
await page.waitForEvent('popup');
```

## Network Interception

```typescript
// Mock API responses
await page.route('**/api/users', async (route) => {
    await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ users: [{ id: 1, name: 'Alice' }] }),
    });
});

// Modify requests
await page.route('**/api/**', async (route) => {
    const headers = { ...route.request().headers(), 'X-Custom-Header': 'test' };
    await route.continue({ headers });
});

// Block resources (speed up automation)
await page.route('**/*.{png,jpg,jpeg,gif,svg,ico}', route => route.abort());
await page.route('**/analytics/**', route => route.abort());
await page.route('**/ads/**', route => route.abort());

// Capture and inspect responses
const responses: Response[] = [];
page.on('response', (response) => {
    if (response.url().includes('/api/')) {
        responses.push(response);
    }
});

// Wait for specific API call
const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/search')),
    page.getByRole('button', { name: 'Search' }).click(),
]);
const data = await response.json();
```

## File Download and Upload

### File Download

```typescript
// Wait for download event
const downloadPromise = page.waitForEvent('download');
await page.getByRole('link', { name: 'Download Report' }).click();
const download = await downloadPromise;

// Save to specific path
await download.saveAs('/tmp/report.pdf');

// Get download content as buffer
const buffer = await download.createReadStream();

// Check download filename
console.log(download.suggestedFilename());
```

### File Upload

```typescript
// Single file upload
await page.getByLabel('Upload file').setInputFiles('/path/to/file.pdf');

// Multiple files
await page.getByLabel('Upload files').setInputFiles([
    '/path/to/file1.pdf',
    '/path/to/file2.pdf',
]);

// Clear file selection
await page.getByLabel('Upload file').setInputFiles([]);

// Handle file chooser dialog (for non-input elements)
const fileChooserPromise = page.waitForEvent('filechooser');
await page.getByRole('button', { name: 'Upload' }).click();
const fileChooser = await fileChooserPromise;
await fileChooser.setFiles('/path/to/file.pdf');

// Drag and drop file upload
const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
await page.dispatchEvent('.dropzone', 'drop', { dataTransfer });
```

## Multi-Tab Management

```typescript
// Open link in new tab
const pagePromise = context.waitForEvent('page');
await page.getByRole('link', { name: 'Open in new tab' }).click();
const newPage = await pagePromise;
await newPage.waitForLoadState();

// Create new tab programmatically
const newTab = await context.newPage();
await newTab.goto('[reference URL]');

// Switch between tabs
const pages = context.pages();
await pages[0].bringToFront();  // Switch to first tab
await pages[1].bringToFront();  // Switch to second tab

// Handle popup windows
const popupPromise = page.waitForEvent('popup');
await page.getByRole('button', { name: 'Open Settings' }).click();
const popup = await popupPromise;
await popup.getByRole('button', { name: 'Save' }).click();
await popup.close();
```

## Authentication Flows

### Session Storage

```typescript
// Save authenticated state
async function authenticate(page: Page): Promise<void> {
    await page.goto('[reference URL]');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard');

    // Save state for reuse
    await page.context().storageState({ path: '.auth/state.json' });
}

// Reuse authenticated state
const context = await browser.newContext({
    storageState: '.auth/state.json',
});
const page = await context.newPage();
await page.goto('[reference URL]');  // Already logged in
```

### OAuth Flow

```typescript
async function handleOAuth(page: Page): Promise<void> {
    await page.goto('[reference URL]');
    await page.getByRole('button', { name: 'Sign in with Google' }).click();

    // Handle OAuth popup or redirect
    if (await page.url().includes('accounts.google.com')) {
        await page.getByLabel('Email').fill('user@gmail.com');
        await page.getByRole('button', { name: 'Next' }).click();
        await page.getByLabel('Password').fill('password');
        await page.getByRole('button', { name: 'Next' }).click();

        // Handle consent screen
        const allowButton = page.getByRole('button', { name: 'Allow' });
        if (await allowButton.isVisible()) {
            await allowButton.click();
        }
    }

    await page.waitForURL('**/dashboard');
}
```

## Headless vs Headed

```typescript
// Headless (default for automation)
const browser = await chromium.launch({ headless: true });

// Headed (for debugging)
const browser = await chromium.launch({
    headless: false,
    slowMo: 100,  // Slow down actions by 100ms for visibility
});

// Headless with viewport
const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,  // Retina display
    userAgent: 'Custom User Agent',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    geolocation: { longitude: -73.935242, latitude: 40.730610 },
    permissions: ['geolocation'],
});
```

## Screenshot and PDF Generation

### Screenshots

```typescript
// Full page screenshot
await page.screenshot({
    path: 'fullpage.png',
    fullPage: true,
});

// Element screenshot
const element = page.getByTestId('chart');
await element.screenshot({ path: 'chart.png' });

// Specific region
await page.screenshot({
    path: 'region.png',
    clip: { x: 0, y: 0, width: 800, height: 600 },
});

// High quality
await page.screenshot({
    path: 'hd.png',
    type: 'png',
    scale: 'device',  // Use device pixel ratio
});

// JPEG with quality
await page.screenshot({
    path: 'photo.jpg',
    type: 'jpeg',
    quality: 90,
});

// Buffer instead of file
const buffer = await page.screenshot({ type: 'png' });
```

### PDF Generation

```typescript
// Generate PDF (Chromium only)
await page.pdf({
    path: 'document.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:10px; text-align:center; width:100%">Report</div>',
    footerTemplate: '<div style="font-size:10px; text-align:center; width:100%">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
});

// PDF from HTML string
await page.setContent(`
    <html>
    <body>
        <h1>Invoice #12345</h1>
        <table>...</table>
    </body>
    </html>
`);
await page.pdf({ path: 'invoice.pdf', format: 'Letter' });
```

## CI Integration

```yaml
# GitHub Actions
name: Browser Automation
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM

jobs:
  automate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: node dist/automation.js
        env:
          HEADLESS: 'true'
          TARGET_URL: ${{ secrets.TARGET_URL }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: automation-results
          path: |
            screenshots/
            reports/
            downloads/
```

## Debugging

```typescript
// Trace recording (most powerful debugging tool)
const context = await browser.newContext();
await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

// ... run automation ...

await context.tracing.stop({ path: 'trace.zip' });
// View: npx playwright show-trace trace.zip

// Console log forwarding
page.on('console', msg => console.log(`BROWSER: ${msg.type()}: ${msg.text()}`));
page.on('pageerror', error => console.error(`BROWSER ERROR: ${error.message}`));

// Codegen (generate code by interacting with browser)
// npx playwright codegen [reference URL]
```

## Best Practices

1. **Use auto-wait over explicit waits**: Let Playwright handle timing
2. **Prefer semantic selectors**: Role > text > test ID > CSS
3. **Block unnecessary resources**: Images, analytics, ads slow down automation
4. **Save authentication state**: Avoid re-logging in for every run
5. **Use browser contexts for isolation**: Lighter than separate browsers
6. **Record traces for debugging**: Replay exact browser state
7. **Handle popups and dialogs**: Register handlers before triggering them
8. **Set appropriate timeouts**: Default 30s, increase for slow pages
9. **Run in CI with container**: Consistent browser version and dependencies
10. **Use Codegen for discovery**: Generate selectors interactively

## When to Use

**Use this skill when:**
- Designing or implementing browser automator solutions
- Reviewing or improving existing browser automator approaches
- Making architectural or implementation decisions about browser automator
- Learning browser automator patterns and best practices
- Troubleshooting browser automator-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Browser Automator Analysis

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

**Input:** "Help me implement browser automator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended browser automator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When browser automator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
