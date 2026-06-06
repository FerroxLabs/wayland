/**
 * E2E smoke: Quiet Money - v1 specialist, v2 Standing, v3 Council.
 *
 * Validates all three shapes of the Quiet Money product:
 *  - v1: solo preset assistant (custom:ext-quiet-money) - kickoff card mounts
 *  - v2: Standing Company launcher (custom:ext-quiet-money-standing) - kickoff card mounts
 *  - v3: Council team launcher (custom:ext-quiet-money-council) - kickoff card mounts
 *
 * The 6 v3 specialists (Position Auditor, Career Strategist, Spending Auditor,
 * Windfall Navigator, Generational Planner, Time Coach) are intentionally
 * NOT picker-selectable - they're spawned by the Council leader, not chosen
 * directly. So they have no kickoff cards.
 *
 * Bundle dual-write proof: each ext-quiet-money-* id resolves via the
 * overlay (`vendoredAssistantOverlay.ts`) and the engine returns a
 * kickoff (not no-kickoffs-defined) for each launcher.
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo, ROUTES } from '../helpers';

const KICKOFF_CARD = '[data-testid="new-chat-kickoff-card"]';
const KICKOFF_BODY = '[data-testid="new-chat-kickoff-body"]';
const GUID_TEXTAREA = 'textarea.arco-textarea';

type LauncherCase = {
  key: string;
  bodyIdiomsAnyOf: RegExp[];
};

const CASES: LauncherCase[] = [
  {
    key: 'custom:ext-quiet-money',
    bodyIdiomsAnyOf: [
      /boring path/i,
      /quiet test/i,
      /enough number/i,
      /12-month rule/i,
      /career trajectory/i,
      /pick up where we left/i,
      /first time/i,
    ],
  },
  {
    key: 'custom:ext-quiet-money-standing',
    bodyIdiomsAnyOf: [
      /standing/i,
      /bootstrap your quiet-money/i,
      /friday-question ritual/i,
      /enough defense/i,
      /workspace right now/i,
      /next 4 ritual/i,
      /standing badge/i,
      /first time/i,
    ],
  },
  {
    key: 'custom:ext-quiet-money-council',
    bodyIdiomsAnyOf: [
      /council/i,
      /6-question intake/i,
      /annual spending audit/i,
      /sudden money or sudden shock/i,
      /generational planning/i,
      /five-question trajectory/i,
      /open thread/i,
      /first time/i,
    ],
  },
];

for (const { key, bodyIdiomsAnyOf } of CASES) {
  test(`Quiet Money smoke - ${key} kickoff card mounts`, async ({ page }) => {
    await invokeBridge(page, 'agent.config.storage.set', {
      key: 'guid.lastSelectedAgent',
      data: key,
    });
    const verified = await invokeBridge<string | null>(
      page,
      'agent.config.storage.get',
      'guid.lastSelectedAgent'
    );
    expect(verified).toBe(key);

    await navigateTo(page, ROUTES.guid);
    await page.reload();
    await page.locator(GUID_TEXTAREA).first().waitFor({ state: 'visible', timeout: 10_000 });
    await expect(page.locator(KICKOFF_CARD)).toBeVisible({ timeout: 10_000 });

    const bodyText = (await page.locator(KICKOFF_BODY).textContent()) ?? '';
    expect(bodyText.length).toBeGreaterThan(20);

    const matched = bodyIdiomsAnyOf.some((re) => re.test(bodyText));
    expect(matched, `Expected one of ${bodyIdiomsAnyOf.length} idioms in: ${bodyText.slice(0, 200)}`).toBe(true);
  });
}
