/**
 * E2E (E2): Trusted-path team import - 5s cool-off + capability grant.
 *
 * Flow per E2E-TEST-PLAN §E2:
 *   1. /teams → click [data-testid="teams-import-cta"].
 *   2. Set the hidden <input> file to `valid-trusted.json` via Playwright's
 *      `setInputFiles`. The renderer calls `team.importPreview` IPC; on
 *      success the CapabilityReviewModal opens.
 *   3. Primary CTA `[data-testid="capability-review-trust"]` is disabled for
 *      ~5 seconds (modal countdown). We assert disabled → wait 5.5s →
 *      assert enabled.
 *   4. Tick the canReadFiles checkbox `[data-testid=
 *      "capability-review-checkbox-canReadFiles"]`, then click Trust.
 *   5. Modal closes → renderer navigates to /team/<imported-id>. The
 *      imported team always persists with `isSandboxed: true` per the W4
 *      audit fix - the sandbox flag is informational; the per-cap grant
 *      map is the security gate.
 *   6. Assert URL transition + assert `team.get` shows the team with
 *      `importedFrom` populated.
 */

import path from 'path';
import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const IMPORT_FIXTURE = path.resolve(__dirname, '../fixtures/team-imports/valid-trusted.json');

test.describe('Team import - trusted (E2)', () => {
  test('valid trusted payload imports after 5s cool-off + grant', async ({ page }) => {
    test.setTimeout(180_000);

    // Cleanup leftover imported teams from prior runs.
    const stale = await invokeBridge<Array<{ id: string; name: string }>>(page, 'team.list', {
      userId: 'system_default_user',
    });
    for (const t of stale) {
      if (t.name.startsWith('Trusted Marketing Pod')) {
        await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => {});
      }
    }

    await navigateTo(page, '#/teams');
    await page.waitForURL(/\/teams$/, { timeout: 15_000 });

    // Click the import CTA to surface the (hidden) file picker, then attach the file.
    // The file input is `display: none` but Playwright's setInputFiles works fine.
    await page.locator('[data-testid="teams-import-cta"]').click();
    await page.locator('[data-testid="teams-import-file-input"]').setInputFiles(IMPORT_FIXTURE);

    // Modal opens after team.importPreview round-trips.
    const modal = page.locator('[data-testid="capability-review-modal"]');
    await expect(modal).toBeVisible({ timeout: 15_000 });

    const trust = page.locator('[data-testid="capability-review-trust"]');
    await expect(trust).toBeDisabled();

    // Countdown is 5s; wait a hair past then assert enabled. We do NOT poll
    // the label every second because that would flake in slow Electron
    // contexts - the countdown is a setInterval driven by setRemaining so
    // a single elapsed wait is the right primitive.
    await page.waitForTimeout(5_400);
    await expect(trust).toBeEnabled();

    // Tick canReadFiles only (the fixture declares all caps=true so all rows render).
    const checkbox = page.locator('[data-testid="capability-review-checkbox-canReadFiles"]');
    await expect(checkbox).toBeVisible();
    await checkbox.click();

    await trust.click();

    // The renderer navigates to /team/<imported-id> on success.
    await page.waitForURL(/#\/team\/[^/]+$/, { timeout: 30_000 });

    // Backend agrees + provenance fields populated.
    const url = page.url();
    const importedId = url.match(/#\/team\/([^/?#]+)/)?.[1];
    expect(importedId).toBeTruthy();
    const team = await invokeBridge<{
      id?: string;
      name?: string;
      importedFrom?: string;
      isSandboxed?: boolean;
    } | null>(page, 'team.get', { id: importedId! });
    expect(team?.id).toBe(importedId);
    expect(team?.name).toBe('Trusted Marketing Pod');
    expect(team?.importedFrom).toBeTruthy();
    // Per W4 audit CRIT-2 fix: imported teams ALWAYS persist isSandboxed: true.
    // The grant map (not this flag) controls capability enforcement.
    expect(team?.isSandboxed).toBe(true);

    // Cleanup.
    await invokeBridge(page, 'team.remove', { id: importedId! }).catch(() => {});
  });
});
