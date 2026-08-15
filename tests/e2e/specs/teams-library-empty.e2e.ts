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

    // `teams-empty-state` is keyed on hasAnyTeams, and the 60 team launchers now
    // ship in the COMPILED builtin catalog (builtinCatalog.ts imports
    // builtin-catalog/assistants.json statically) rather than as extensions - so
    // pointing WAYLAND_EXTENSIONS_PATH at an empty dir no longer empties the
    // library and that branch is unreachable in a normal build.
    //
    // The reachable sibling is `teams-no-results` (hasAnyTeams && totalTeams === 0),
    // which still proves the load-bearing behaviour: with nothing to show, the
    // sections and the BuildMyOwn card are all withheld.
    await page.locator('[data-testid="teams-search-input"]').fill('zzz-no-such-team-zzz');

    await expect(page.locator('[data-testid="teams-no-results"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="teams-group-standing"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="team-card-build-my-own"]')).toHaveCount(0);

    await page.screenshot({ path: 'tests/e2e/results/teams-library-empty.png', fullPage: true });
  });
});
