/**
 * E2E (A2): /teams empty state.
 *
 * Boots an Electron app with WAYLAND_EXTENSIONS_PATH pointing at an empty
 * directory so the bundle's 24 launchers are absent. Asserts:
 *   - empty-state message renders ("No teams available yet.")
 *   - neither group section nor BuildMyOwn card render (both anchor on
 *     totalTeams > 0 per TeamsLibraryPage.tsx)
 *
 * Pattern mirrored from `ext-no-extensions.e2e.ts`: separate Electron
 * process with isolated extension state, so the singleton main app is
 * not affected.
 */

import { test, expect, type ElectronApplication, type Page, _electron as electron } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';

const emptyExtensionsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-teams-empty-'));
const stateSandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-teams-empty-state-'));
const extensionStatesFile = path.join(stateSandboxDir, 'extension-states.json');

function isDevToolsWindow(p: Page): boolean {
  return p.url().startsWith('devtools://');
}

async function resolveMainWindow(electronApp: ElectronApplication): Promise<Page> {
  const existingMainWindow = electronApp.windows().find((win) => !isDevToolsWindow(win));
  if (existingMainWindow) {
    await existingMainWindow.waitForLoadState('domcontentloaded');
    return existingMainWindow;
  }
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const win = await electronApp.waitForEvent('window', { timeout: 1_000 }).catch(() => null);
    if (win && !isDevToolsWindow(win)) {
      await win.waitForLoadState('domcontentloaded');
      return win;
    }
  }
  throw new Error('Failed to resolve main renderer window for teams-empty E2E app.');
}

async function launchAppWithoutBundle(): Promise<ElectronApplication> {
  const projectRoot = path.resolve(__dirname, '../../..');
  const launchArgs = ['.'];
  if (process.platform === 'linux' && process.env.CI) {
    launchArgs.push('--no-sandbox');
  }
  return electron.launch({
    args: launchArgs,
    cwd: projectRoot,
    env: {
      ...process.env,
      WAYLAND_EXTENSIONS_PATH: emptyExtensionsDir,
      WAYLAND_EXTENSION_STATES_FILE: extensionStatesFile,
      WAYLAND_DISABLE_AUTO_UPDATE: '1',
      WAYLAND_DISABLE_DEVTOOLS: '1',
      WAYLAND_E2E_TEST: '1',
      WAYLAND_CDP_PORT: '0',
      NODE_ENV: 'development',
    },
    timeout: 60_000,
  });
}

test.describe.serial('Teams Library - empty state', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await launchAppWithoutBundle();
    page = await resolveMainWindow(electronApp);
  });

  test.afterAll(async () => {
    await electronApp?.close().catch(() => {});
    fs.rmSync(stateSandboxDir, { recursive: true, force: true });
    fs.rmSync(emptyExtensionsDir, { recursive: true, force: true });
  });

  test('renders empty-state message and hides BuildMyOwn card', async () => {
    test.setTimeout(60_000);

    // Wait for renderer to be ready.
    await page
      .waitForFunction(() => typeof (window as { electronAPI?: unknown }).electronAPI !== 'undefined', {
        timeout: 15_000,
      })
      .catch(() => undefined);

    await page.evaluate(() => window.location.assign('#/teams'));
    await page.waitForURL(/#\/teams(\?|$)/, { timeout: 10_000 });

    const pageRoot = page.locator('[data-testid="teams-library-page"]');
    await expect(pageRoot).toBeVisible({ timeout: 15_000 });

    // totalTeams === 0 → empty state visible, neither section renders.
    const emptyState = page.locator('[data-testid="teams-empty-state"]');
    await expect(emptyState).toBeVisible({ timeout: 10_000 });

    // Subtitle reports zero teams (i18n token includes the count).
    await expect(page.locator('[data-testid="teams-total-count"]')).toContainText('0');

    // No standing section, no teams section, no BuildMyOwn card - all three
    // are conditional on either standing.length > 0 or totalTeams > 0.
    await expect(page.locator('[data-testid="teams-group-standing"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="teams-group-teams"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="team-card-build-my-own"]')).toHaveCount(0);

    await page.screenshot({ path: 'tests/e2e/results/teams-library-empty.png', fullPage: true });
  });
});
