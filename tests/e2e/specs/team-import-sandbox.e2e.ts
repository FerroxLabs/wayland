/**
 * E2E (E3): Sandbox-path team import - no cool-off, all caps denied.
 *
 * Flow per E2E-TEST-PLAN §E3:
 *   1. /teams → click [data-testid="teams-import-cta"].
 *   2. setInputFiles `valid-trusted.json` (same trusted fixture is fine -
 *      the sandbox path forces all grants false regardless of payload).
 *   3. Click [data-testid="capability-review-sandbox"] immediately - no
 *      5s wait required (the cool-off is on the trusted CTA only).
 *   4. Renderer navigates to /team/<imported-id>.
 *   5. team.get confirms isSandboxed === true (per W4 audit fix: all
 *      imported teams persist sandboxed; this spec also verifies the
 *      sandbox path is unguarded by the cool-off).
 */

import path from 'path';
import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const IMPORT_FIXTURE = path.resolve(__dirname, '../fixtures/team-imports/valid-sandbox.json');

test.describe('Team import - sandbox (E3)', () => {
  test('sandbox CTA imports immediately with all caps denied', async ({ page }) => {
    test.setTimeout(180_000);

    // Cleanup leftovers.
    const stale = await invokeBridge<Array<{ id: string; name: string }>>(page, 'team.list', {
      userId: 'system_default_user',
    });
    for (const t of stale) {
      if (t.name.startsWith('Sandboxed Marketing Pod')) {
        await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => {});
      }
    }

    await navigateTo(page, '#/teams');
    await page.waitForURL(/\/teams$/, { timeout: 15_000 });

    await page.locator('[data-testid="teams-import-cta"]').click();
    await page.locator('[data-testid="teams-import-file-input"]').setInputFiles(IMPORT_FIXTURE);

    const modal = page.locator('[data-testid="capability-review-modal"]');
    await expect(modal).toBeVisible({ timeout: 15_000 });

    // Sandbox CTA is NOT gated by the 5s cool-off - click immediately.
    const sandbox = page.locator('[data-testid="capability-review-sandbox"]');
    await expect(sandbox).toBeEnabled();
    await sandbox.click();

    await page.waitForURL(/#\/team\/[^/]+$/, { timeout: 30_000 });
    const importedId = page.url().match(/#\/team\/([^/?#]+)/)?.[1];
    expect(importedId).toBeTruthy();

    const team = await invokeBridge<{
      id?: string;
      name?: string;
      importedFrom?: string;
      isSandboxed?: boolean;
      importCapabilityGrants?: Record<string, { by_user?: boolean }>;
    } | null>(page, 'team.get', { id: importedId! });
    expect(team?.id).toBe(importedId);
    expect(team?.isSandboxed).toBe(true);

    // No grant should be by_user=true on the sandbox path (the sandbox handler
    // calls acceptImport with all grants=false; the service forces network
    // off regardless).
    const grants = team?.importCapabilityGrants ?? {};
    for (const [cap, grant] of Object.entries(grants)) {
      expect.soft(grant?.by_user, `sandbox import granted ${cap} by_user=true`).not.toBe(true);
    }

    // Cleanup.
    await invokeBridge(page, 'team.remove', { id: importedId! }).catch(() => {});
  });
});
