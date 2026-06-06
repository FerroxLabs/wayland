/**
 * E2E (E4): Team-import D7 attack-vector coverage - 6 cases.
 *
 * Flow per E2E-TEST-PLAN §E4. Each case exercises the renderer-side import
 * path against a crafted fixture. The first three reject in the
 * `team.importPreview` pipeline (DOS / prototype-pollution / Zod regex) and
 * surface a Message.error toast without ever opening the modal. The fourth
 * passes preview but renders missingSpecialists in the modal and disables
 * both CTAs. The fifth exercises the prompt sanitizer; the sixth exercises
 * the cross-team mailbox MCP gate.
 *
 * Cases 5 + 6 are covered at lower test layers - the e2e suite cannot
 * meaningfully add to that coverage today, so the placeholders below are
 * intentionally inert:
 *   • Case 5 (XSS): the DOMPurify sanitizer is exercised by 11 unit cases at
 *     tests/unit/renderer/utils/sanitize/sanitizeTeamTaskContent.test.ts.
 *     There is no production HTML sink that renders task content via
 *     dangerouslySetInnerHTML in v0.6.0 (every surface uses React text
 *     children, which auto-escape), so an e2e XSS attempt would have no
 *     observable failure mode even if it bypassed the sanitizer.
 *   • Case 6 (cross-team mailbox gate): the gate lives in
 *     TeamMcpServer.team_send_message and is exercised at the integration
 *     layer by tests/unit/process/team/mcp/team/TeamMcpServer.sandbox.test.ts
 *     (four cases: blocks cross-team without canCrossTeamMessage, allows
 *     same-team, allows team_id == own, allows cross-team when cap granted).
 *     Driving the gate end-to-end through ACP would require rerouting the
 *     Electron-side spawn() to a mock binary - not viable today.
 */

import path from 'path';
import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/team-imports');

const FIX_OVERSIZE = path.join(FIXTURES_DIR, 'oversize.json');
const FIX_PROTOTYPE = path.join(FIXTURES_DIR, 'prototype-pollution.json');
const FIX_INVALID_ID = path.join(FIXTURES_DIR, 'invalid-skill-id.json');
const FIX_MISSING = path.join(FIXTURES_DIR, 'missing-specialist.json');

/**
 * Open /teams cleanly so each case starts from a known-good state. Single
 * boot is fine because none of these cases mutate persisted teams (they
 * all reject before any team is created).
 */
async function gotoTeamsPage(page: import('@playwright/test').Page): Promise<void> {
  await navigateTo(page, '#/teams');
  await page.waitForURL(/\/teams$/, { timeout: 15_000 });
}

async function selectImportFile(
  page: import('@playwright/test').Page,
  fixturePath: string
): Promise<void> {
  await page.locator('[data-testid="teams-import-cta"]').click();
  await page.locator('[data-testid="teams-import-file-input"]').setInputFiles(fixturePath);
}

// Arco Message renders into a global container. The exact text varies by
// rejection reason, but the toast role is always live (`aria-live="polite"`).
// We match by class as a fallback so locale variations don't blow up the
// assertion.
const TOAST_LOCATOR = '.arco-message';

test.describe.serial('Team import security - E4', () => {
  test('case 1: oversize file rejects with size error + no modal', async ({ page }) => {
    test.setTimeout(60_000);
    await gotoTeamsPage(page);

    await selectImportFile(page, FIX_OVERSIZE);

    // Toast surfaces the safeParse error (TEAM_IMPORT_TOO_LARGE → message
    // "File exceeds 256KB" - the renderer prefixes "Failed to import team:").
    const toast = page.locator(TOAST_LOCATOR).filter({ hasText: /256\s*KB|too large|exceeds/i });
    await expect(toast.first()).toBeVisible({ timeout: 15_000 });

    await expect(page.locator('[data-testid="capability-review-modal"]')).toHaveCount(0);
  });

  test('case 2: prototype-pollution payload rejects + no modal', async ({ page }) => {
    test.setTimeout(60_000);
    await gotoTeamsPage(page);

    await selectImportFile(page, FIX_PROTOTYPE);

    const toast = page.locator(TOAST_LOCATOR).filter({ hasText: /prototype|__proto__/i });
    await expect(toast.first()).toBeVisible({ timeout: 15_000 });

    await expect(page.locator('[data-testid="capability-review-modal"]')).toHaveCount(0);
  });

  test('case 3: invalid skill-id ("../../malicious") rejects + no modal', async ({ page }) => {
    test.setTimeout(60_000);
    await gotoTeamsPage(page);

    await selectImportFile(page, FIX_INVALID_ID);

    // Zod regex failure surfaces via TEAM_IMPORT_SCHEMA_INVALID. The Zod
    // message text references the regex path (`leader.id`) so we match on
    // that or the generic "Invalid team export" prefix.
    const toast = page.locator(TOAST_LOCATOR).filter({ hasText: /Invalid|leader\.id|skill/i });
    await expect(toast.first()).toBeVisible({ timeout: 15_000 });

    await expect(page.locator('[data-testid="capability-review-modal"]')).toHaveCount(0);
  });

  test('case 4: missing specialist opens modal with both CTAs disabled', async ({ page }) => {
    test.setTimeout(60_000);
    await gotoTeamsPage(page);

    await selectImportFile(page, FIX_MISSING);

    // Preview succeeds (the response carries `missingSpecialists`), so the
    // modal opens - but both action CTAs are disabled and the warning alert
    // explains what is missing.
    const modal = page.locator('[data-testid="capability-review-modal"]');
    await expect(modal).toBeVisible({ timeout: 15_000 });

    await expect(page.locator('[data-testid="capability-review-missing-specialists"]')).toBeVisible();
    await expect(page.locator('[data-testid="capability-review-trust"]')).toBeDisabled();
    await expect(page.locator('[data-testid="capability-review-sandbox"]')).toBeDisabled();

    // Cancel so subsequent serial-suite cases start from /teams cleanly.
    await page.locator('[data-testid="capability-review-cancel"]').click();
    await expect(modal).not.toBeVisible({ timeout: 5_000 });
  });

  test('case 5: XSS in task description covered by sanitizer unit suite', async ({ page }) => {
    // Sanitizer is fully covered by 11 unit cases at:
    //   tests/unit/renderer/utils/sanitize/sanitizeTeamTaskContent.test.ts
    // (script, img, javascript:, data:, vbscript:, onerror, style, anchor
    // rewrites, allowed-tag preservation, relative anchor handling).
    //
    // No production HTML sink renders task content via dangerouslySetInnerHTML
    // in v0.6.0, so an e2e attempt would have no observable failure mode. The
    // case is preserved as a documented anchor so future readers don't ship a
    // new HTML sink without a corresponding e2e regression test.
    test.fixme(
      true,
      'covered by sanitizeTeamTaskContent.test.ts unit suite - no production HTML sink to drive end-to-end in v0.6.0'
    );

    void page;
  });

  test('case 6: cross-team mailbox MCP gate covered by integration suite', async ({ page }) => {
    // Cross-team mailbox gate is covered by:
    //   tests/unit/process/team/mcp/teamMcpCrossTeamGate.test.ts
    // The integration suite drives TeamMcpServer.team_send_message with the
    // exact attack shape (team A leader → team B mailbox) and asserts denial.
    //
    // Driving this through ACP at the e2e layer would require rerouting the
    // Electron child's spawn() at runtime; that override is not part of v0.6.0.
    // The case is preserved as a documented anchor - if the spawn-override
    // path ships in v0.6.1, replace this with a real e2e assertion.
    test.fixme(
      true,
      'covered by TeamMcpServer.sandbox.test.ts (4 cross-team gate cases) - e2e blocked on missing ACP spawn override'
    );

    void page;
  });
});
