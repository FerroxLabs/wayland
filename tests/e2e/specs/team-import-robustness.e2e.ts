/**
 * E2E (adversarial): Team-import robustness - bad file inputs.
 *
 * Drives the import flow with crafted fixtures that a confused or hostile
 * user might feed it: PDF binary blobs, empty files, truncated JSON, valid
 * JSON of the wrong shape, all-null fields, duplicate imports, and a
 * cool-off restart probe.
 *
 * Each case writes its own per-test tmp fixture to keep concerns isolated.
 * Fixtures committed to tests/e2e/fixtures/team-imports/ stay reserved for
 * the security-suite (E4); robustness uses tmp paths so the canonical
 * fixtures don't grow into a kitchen sink.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { test, expect, type Page } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/team-imports');
const FIX_VALID = path.join(FIXTURES_DIR, 'valid-trusted.json');
const FIX_DEEP = path.join(FIXTURES_DIR, 'deep-nested.json');
const TOAST_LOCATOR = '.arco-message';

const tmpFiles: string[] = [];

function writeTmp(name: string, contents: string | Buffer): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-import-'));
  const p = path.join(dir, name);
  fs.writeFileSync(p, contents);
  tmpFiles.push(dir);
  return p;
}

async function gotoTeamsPage(page: Page): Promise<void> {
  await navigateTo(page, '#/teams');
  await page.waitForURL(/\/teams$/, { timeout: 15_000 });
}

async function selectImportFile(page: Page, fixturePath: string): Promise<void> {
  await page.locator('[data-testid="teams-import-cta"]').click();
  await page.locator('[data-testid="teams-import-file-input"]').setInputFiles(fixturePath);
}

async function dismissAllToasts(page: Page): Promise<void> {
  // Arco messages auto-dismiss after ~3s; clear the live region between
  // cases so the next assertion doesn't match the previous toast.
  await page.waitForTimeout(3_500);
}

test.afterAll(async () => {
  for (const dir of tmpFiles) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // best-effort
    }
  }
});

test.describe('Team import - robustness (adversarial)', () => {
  test('case 1: PDF binary file rejects + no modal', async ({ page }) => {
    test.setTimeout(45_000);
    await gotoTeamsPage(page);

    // Minimal valid-ish PDF magic bytes + binary garbage.
    const pdf = Buffer.concat([
      Buffer.from('%PDF-1.4\n%\xc3\xa1\xc3\xa9\xc3\xad\xc3\xb3\n'),
      Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0xff, 0xfe]),
    ]);
    const fixturePath = writeTmp('not-a-team.pdf', pdf);
    await selectImportFile(page, fixturePath);

    const toast = page.locator(TOAST_LOCATOR).filter({ hasText: /import|parse|json|fail/i });
    await expect(toast.first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="capability-review-modal"]')).toHaveCount(0);
    await dismissAllToasts(page);
  });

  test('case 2: empty file (0 bytes) rejects + no modal', async ({ page }) => {
    test.setTimeout(45_000);
    await gotoTeamsPage(page);

    const fixturePath = writeTmp('empty.json', '');
    await selectImportFile(page, fixturePath);

    const toast = page.locator(TOAST_LOCATOR).filter({ hasText: /import|parse|empty|fail/i });
    await expect(toast.first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="capability-review-modal"]')).toHaveCount(0);
    await dismissAllToasts(page);
  });

  test('case 3: truncated JSON rejects + no modal', async ({ page }) => {
    test.setTimeout(45_000);
    await gotoTeamsPage(page);

    const fixturePath = writeTmp('truncated.json', '{"name": "test", "version": "1"');
    await selectImportFile(page, fixturePath);

    const toast = page.locator(TOAST_LOCATOR).filter({ hasText: /parse|json|syntax|unexpected|import|fail/i });
    await expect(toast.first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="capability-review-modal"]')).toHaveCount(0);
    await dismissAllToasts(page);
  });

  test('case 4: bare empty object {} rejects + no modal', async ({ page }) => {
    test.setTimeout(45_000);
    await gotoTeamsPage(page);

    const fixturePath = writeTmp('bare-object.json', '{}');
    await selectImportFile(page, fixturePath);

    const toast = page.locator(TOAST_LOCATOR).filter({ hasText: /import|invalid|schema|required|fail/i });
    await expect(toast.first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="capability-review-modal"]')).toHaveCount(0);
    await dismissAllToasts(page);
  });

  test('case 5: bare array [] rejects + no modal', async ({ page }) => {
    test.setTimeout(45_000);
    await gotoTeamsPage(page);

    const fixturePath = writeTmp('bare-array.json', '[]');
    await selectImportFile(page, fixturePath);

    const toast = page.locator(TOAST_LOCATOR).filter({ hasText: /import|invalid|schema|expected.*object|fail/i });
    await expect(toast.first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="capability-review-modal"]')).toHaveCount(0);
    await dismissAllToasts(page);
  });

  test('case 6: bare string "hello" rejects + no modal', async ({ page }) => {
    test.setTimeout(45_000);
    await gotoTeamsPage(page);

    const fixturePath = writeTmp('bare-string.json', '"hello"');
    await selectImportFile(page, fixturePath);

    const toast = page.locator(TOAST_LOCATOR).filter({ hasText: /import|invalid|schema|expected|fail/i });
    await expect(toast.first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="capability-review-modal"]')).toHaveCount(0);
    await dismissAllToasts(page);
  });

  test('case 7: all-null schema-shape fields reject + no modal', async ({ page }) => {
    test.setTimeout(45_000);
    await gotoTeamsPage(page);

    const allNull = JSON.stringify({
      name: null,
      version: null,
      leader: null,
      teammates: null,
      rituals: null,
      capabilities: null,
    });
    const fixturePath = writeTmp('all-null.json', allNull);
    await selectImportFile(page, fixturePath);

    const toast = page.locator(TOAST_LOCATOR).filter({ hasText: /import|invalid|schema|expected|fail/i });
    await expect(toast.first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="capability-review-modal"]')).toHaveCount(0);
    await dismissAllToasts(page);
  });

  test('case 8: deep-nested fixture (depth 7, caps 6) rejects + no modal', async ({ page }) => {
    test.setTimeout(45_000);
    await gotoTeamsPage(page);

    await selectImportFile(page, FIX_DEEP);

    const toast = page.locator(TOAST_LOCATOR).filter({ hasText: /depth|deep|nest|import|invalid|fail/i });
    await expect(toast.first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="capability-review-modal"]')).toHaveCount(0);
    await dismissAllToasts(page);
  });

  test('case 9: cancel cool-off mid-flow, re-import → fresh cool-off restarts at 5s', async ({ page }) => {
    test.setTimeout(60_000);
    await gotoTeamsPage(page);

    await selectImportFile(page, FIX_VALID);

    // Modal opens; Trust CTA starts disabled.
    const trustCta = page.locator('[data-testid="capability-review-trust"]');
    await expect(trustCta).toBeVisible({ timeout: 10_000 });
    await expect(trustCta).toBeDisabled();

    // Wait 2s (cool-off NOT yet elapsed).
    await page.waitForTimeout(2_000);
    await expect(trustCta).toBeDisabled();

    // Cancel the modal.
    await page.locator('[data-testid="capability-review-cancel"]').click();
    await expect(page.locator('[data-testid="capability-review-modal"]')).toHaveCount(0);

    // Re-import immediately. The new modal must restart its cool-off - Trust
    // disabled for a fresh 5s, NOT immediately enabled (which would mean the
    // cool-off state leaked across instances).
    await selectImportFile(page, FIX_VALID);
    const newTrustCta = page.locator('[data-testid="capability-review-trust"]');
    await expect(newTrustCta).toBeVisible({ timeout: 10_000 });
    await expect(newTrustCta).toBeDisabled();
    // Still disabled 2s into the new cool-off (so the new clock isn't already 3s in).
    await page.waitForTimeout(2_000);
    await expect(newTrustCta).toBeDisabled();
    // Eventually enables after the new 5s elapses.
    await page.waitForTimeout(3_500);
    await expect(newTrustCta).toBeEnabled({ timeout: 5_000 });

    // Clean up: cancel the modal so we don't leave a half-imported team.
    await page.locator('[data-testid="capability-review-cancel"]').click();
  });

  test('case 10: duplicate import (same valid file twice) creates two distinct teams', async ({ page }) => {
    test.setTimeout(90_000);
    await gotoTeamsPage(page);

    const before = await invokeBridge<Array<{ id: string; name: string }>>(page, 'team.list', {
      userId: 'system_default_user',
    });

    // First import: trust path.
    await selectImportFile(page, FIX_VALID);
    await expect(page.locator('[data-testid="capability-review-trust"]')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(5_500);
    await page.locator('[data-testid="capability-review-trust"]').click();
    await page.waitForURL(/\/team\/[^/]+$/, { timeout: 30_000 });

    // Back to /teams for the second import.
    await navigateTo(page, '#/teams');
    await page.waitForURL(/\/teams$/, { timeout: 15_000 });

    // Second import - same fixture. Behavior we accept: a new distinct team
    // is created (no client-side dedupe). The acceptable alternative - a
    // duplicate-detection toast - would also be valid, but assertion below
    // captures the current actual behavior so a regression toward silent
    // failure is caught.
    await selectImportFile(page, FIX_VALID);
    await expect(page.locator('[data-testid="capability-review-trust"]')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(5_500);
    await page.locator('[data-testid="capability-review-trust"]').click();
    await page.waitForURL(/\/team\/[^/]+$/, { timeout: 30_000 });

    const after = await invokeBridge<Array<{ id: string; name: string }>>(page, 'team.list', {
      userId: 'system_default_user',
    });
    expect(after.length - before.length).toBe(2);

    // Cleanup: remove both newly-created teams.
    const created = after.filter((a) => !before.some((b) => b.id === a.id));
    for (const t of created) {
      await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => undefined);
    }
  });
});
