/**
 * E2E smoke: Quiet Money - v1 specialist, v2 Standing, v3 Council.
 *
 * Validates all three shapes of the Quiet Money product:
 *  - v1: solo preset assistant (quiet-money)          - kickoff card mounts
 *  - v2: Standing Company launcher (quiet-money-standing) - kickoff card mounts
 *  - v3: Council team launcher (quiet-money-council)  - kickoff card mounts
 *
 * The 6 v3 specialists (Position Auditor, Career Strategist, Spending Auditor,
 * Windfall Navigator, Generational Planner, Time Coach) are intentionally
 * NOT picker-selectable - they're spawned by the Council leader, not chosen
 * directly. So they have no kickoff cards.
 *
 * Two things this spec has to get right, both learned the hard way:
 *
 * 1. SELECTION KEY PREFIX. These ship in the native built-in catalog
 *    (`builtin-catalog/assistants.json`, bare ids like `quiet-money`), which
 *    `getBuiltinCatalogAssistants()` exposes as `builtin-<slug>`. The runtime
 *    selection key is therefore `custom:builtin-<slug>`, matching the sibling
 *    `kickoff-card.e2e.ts`. An `ext-` key does NOT resolve: `findAgentByKey`
 *    (useGuidAgentSelection.ts:189) strips only `builtin-`, so an `ext-` key
 *    misses every candidate and falls through to the defensive synthesized
 *    record instead of the real assistant. (The kickoff ENGINE is
 *    prefix-agnostic - `stripIdPrefix` strips both - which is why this failed
 *    in a confusing, half-working way rather than cleanly.)
 *
 * 2. PRESET-HERO MODE. Restoring a saved preset on a cold reload is NOT
 *    enough to mount the kickoff card. GuidPage only enters preset-hero mode
 *    when `hasInteractedWithAgentSelection` is set, and the blessed signal is
 *    React Router's `location.state.launchAssistant`. It must be seeded into
 *    history state (which survives the reload React Router re-hydrates on
 *    init). Without it the card never mounts and the spec fails on a product
 *    that is working correctly.
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo, ROUTES } from '../helpers';
import type { Page } from '@playwright/test';

const KICKOFF_CARD = '[data-testid="new-chat-kickoff-card"]';
const KICKOFF_BODY = '[data-testid="new-chat-kickoff-body"]';
const GUID_TEXTAREA = 'textarea.arco-textarea';

type LauncherCase = {
  key: string;
  bodyIdiomsAnyOf: RegExp[];
};

const CASES: LauncherCase[] = [
  {
    key: 'custom:builtin-quiet-money',
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
    key: 'custom:builtin-quiet-money-standing',
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
    key: 'custom:builtin-quiet-money-council',
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

/**
 * Seed the preset selection AND the launch signal, then open /guid.
 *
 * Mirrors `kickoff-card.e2e.ts`'s helper - deliberately NOT entering via a
 * launchpad card click, because those prefill the input and the card's
 * dismiss-on-type would hide it before the assertions run.
 */
async function seedLauncherAndOpenGuid(page: Page, agentKey: string): Promise<void> {
  await invokeBridge(page, 'agent.config.storage.set', { key: 'guid.lastSelectedAgent', data: agentKey });
  // Read it back so the write has committed before we reload.
  const verified = await invokeBridge<string | null>(page, 'agent.config.storage.get', 'guid.lastSelectedAgent');
  expect(verified).toBe(agentKey);

  await navigateTo(page, ROUTES.guid);
  await page.evaluate(() => {
    const prev = (window.history.state as Record<string, unknown>) || {};
    window.history.replaceState({ ...prev, usr: { launchAssistant: true } }, '');
  });
  await page.reload();
  await page.locator(GUID_TEXTAREA).first().waitFor({ state: 'visible', timeout: 10_000 });
}

for (const { key, bodyIdiomsAnyOf } of CASES) {
  test(`Quiet Money smoke - ${key} kickoff card mounts`, async ({ page }) => {
    await seedLauncherAndOpenGuid(page, key);

    await expect(page.locator(KICKOFF_CARD)).toBeVisible({ timeout: 10_000 });

    const bodyText = (await page.locator(KICKOFF_BODY).textContent()) ?? '';
    expect(bodyText.length).toBeGreaterThan(20);

    const matched = bodyIdiomsAnyOf.some((re) => re.test(bodyText));
    expect(matched, `Expected one of ${bodyIdiomsAnyOf.length} idioms in: ${bodyText.slice(0, 200)}`).toBe(true);
  });
}
