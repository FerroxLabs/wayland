/**
 * Adaptive Cockpit transition contract.
 *
 * Runs in a dedicated userData profile so it proves the missing-preference
 * default without reading or mutating a developer's Desktop profile.
 */
import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { launchAppWithEnv, seedCompletedOnboarding } from '../fixtures';
import { invokeBridge, sendMessageFromGuid, waitForAiReply } from '../helpers';
import { createMockAgentBinary } from '../helpers/mockAgentBinary';

const extensionsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-cockpit-extensions-'));
const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-cockpit-state-'));
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-cockpit-userdata-'));
const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-cockpit-home-'));
const proofAgentId = 'cockpit-first-turn-proof';
const proofReply = 'Your first useful result is ready: three prioritized next actions.';
const proofAgentBinary = createMockAgentBinary({
  binary: 'claude',
  responses: [{ type: 'text', chunks: [proofReply] }],
});

async function resolveMainWindow(electronApp: ElectronApplication): Promise<Page> {
  const existing = electronApp.windows().find((candidate) => !candidate.url().startsWith('devtools://'));
  if (existing) return existing;

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    // Polling a sequence of future window events is intentionally serial.
    // oxlint-disable-next-line eslint(no-await-in-loop)
    const candidate = await electronApp.waitForEvent('window', { timeout: 1_000 }).catch(() => null);
    if (candidate && !candidate.url().startsWith('devtools://')) return candidate;
  }
  throw new Error('Cockpit E2E could not resolve the main Desktop window.');
}

test.describe.serial('Adaptive Cockpit shell', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    // This suite models an existing Classic user upgrading to a build that
    // offers Cockpit. Keep onboarding complete while deliberately leaving the
    // shell preference absent so the migration default is still exercised.
    seedCompletedOnboarding(userDataDir);
    electronApp = await launchAppWithEnv({
      ELECTRON_RENDERER_URL: process.env.ELECTRON_RENDERER_URL ?? 'http://localhost:5173',
      WAYLAND_E2E_USER_DATA_DIR: userDataDir,
      WAYLAND_EXTENSIONS_PATH: extensionsDir,
      WAYLAND_EXTENSION_STATES_FILE: path.join(stateDir, 'extension-states.json'),
      HOME: homeDir,
    });

    page = await resolveMainWindow(electronApp);
    await page.waitForSelector('[data-shell-experience]', { timeout: 30_000 });
  });

  test.afterAll(async () => {
    await electronApp?.close().catch(() => undefined);
    fs.rmSync(extensionsDir, { recursive: true, force: true });
    fs.rmSync(stateDir, { recursive: true, force: true });
    fs.rmSync(userDataDir, { recursive: true, force: true });
    fs.rmSync(homeDir, { recursive: true, force: true });
  });

  test('defaults to Classic when the preference is absent', async () => {
    await expect(page.locator('[data-shell-experience]')).toHaveAttribute('data-shell-experience', 'classic');
    await expect(page.locator('[data-testid="cockpit-sider"]')).toHaveCount(0);
  });

  test('switches through Settings without replacing routes or data services', async () => {
    await page.getByText('Settings', { exact: true }).last().click();
    await page.waitForURL(/#\/settings\//, { timeout: 10_000 });
    await page.getByText('Navigation', { exact: true }).click();
    await page.waitForURL(/#\/settings\/navigation$/, { timeout: 10_000 });

    await page.getByText('Cockpit preview', { exact: true }).click();
    await expect(page.locator('[data-shell-experience]')).toHaveAttribute('data-shell-experience', 'cockpit');
    await expect(page).toHaveURL(/#\/settings\/navigation$/);

    await page.getByText('Back to Chat', { exact: true }).click();
    await page.waitForURL(/#\/guid$/, { timeout: 10_000 });
    await expect(page.locator('[data-testid="cockpit-sider"]')).toBeVisible();

    await Promise.all(
      ['New chat', 'Search', 'Chats', 'Projects', 'Library', 'Automations', 'Activity'].map((label) =>
        expect(page.getByText(label, { exact: true }).first()).toBeVisible()
      )
    );

    const compactAgentPicker = page.locator('[data-agent-picker-mode="compact"]');
    await expect(compactAgentPicker).toBeVisible();
    await expect(compactAgentPicker).toContainText(/\d+ agents?/);
    await compactAgentPicker.click();
    await expect(page.locator('.arco-dropdown-menu:visible, .arco-menu:visible').first()).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Find an agent' })).toBeVisible();
    await page.keyboard.press('Escape');

    const starter = page.locator('[data-testid="new-chat-starter"]');
    await expect(starter).toHaveAttribute('data-starter-order', 'outcome-first');
    const intentBox = await starter.locator('[data-testid="intent-pill-bar"]').boundingBox();
    const launchpadBox = await starter.locator('[data-testid="launchpad-bar"]').boundingBox();
    expect(intentBox).not.toBeNull();
    expect(launchpadBox).not.toBeNull();
    expect(intentBox!.y).toBeLessThan(launchpadBox!.y);
  });

  test('progressively reveals power destinations and opens real routes and commands', async () => {
    await page.getByText('Library', { exact: true }).click();
    await Promise.all(
      ['Assistants', 'Workflows', 'Teams', 'Skills', 'Connections', 'Memory & wiki'].map((label) =>
        expect(page.getByText(label, { exact: true }).first()).toBeVisible()
      )
    );

    await page.getByText('Projects', { exact: true }).first().click();
    await expect(page).toHaveURL(/#\/projects$/);

    await page.getByText('Search', { exact: true }).first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('gets a deterministic useful first-turn response from a clean profile', async () => {
    await invokeBridge(page, 'agent.config.storage.set', {
      key: 'acp.customAgents',
      data: [
        {
          id: proofAgentId,
          name: 'First-turn proof agent',
          enabled: true,
          defaultCliPath: proofAgentBinary,
          acpArgs: [],
        },
      ],
    });
    await invokeBridge(page, 'acp.refresh-custom-agents');
    await invokeBridge(page, 'agent.config.storage.set', {
      key: 'guid.lastSelectedAgent',
      data: `custom:${proofAgentId}`,
    });

    await page.locator('[data-testid="cockpit-new-chat"]').focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(/#\/guid$/, { timeout: 10_000 });
    await page.reload();
    await page.locator('textarea.arco-textarea').first().waitFor({ state: 'visible', timeout: 10_000 });

    const picker = page.locator('[data-agent-picker-mode="compact"]');
    await picker.click();
    const search = page.getByRole('searchbox', { name: 'Find an agent' });
    await search.fill('First-turn proof agent');
    await page.getByRole('menu').getByText('First-turn proof agent', { exact: true }).click();
    await expect(picker).toHaveAttribute('data-agent-key', `custom:${proofAgentId}`);

    await sendMessageFromGuid(page, 'Give me one useful result.');
    const reply = await waitForAiReply(page, 30_000);
    expect(reply).toContain(proofReply);
  });

  test('keeps the core journey keyboard-operable with accessible names', async () => {
    const newChat = page.locator('[data-testid="cockpit-new-chat"]');
    await newChat.focus();
    await expect(newChat).toBeFocused();
    await page.keyboard.press('Enter');
    await page.waitForURL(/#\/guid$/, { timeout: 10_000 });

    const search = page.locator('[data-testid="cockpit-command-palette"]');
    await search.focus();
    await expect(search).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');

    const projects = page.locator('[data-testid="cockpit-nav-projects"]');
    await projects.focus();
    await expect(projects).toBeFocused();
    await page.keyboard.press('Enter');
    await page.waitForURL(/#\/projects$/, { timeout: 10_000 });

    const library = page.locator('[data-testid="cockpit-nav-library"]');
    await library.focus();
    await expect(library).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(library).toHaveAttribute('aria-expanded', 'true');

    const assistants = page.locator('[data-testid="cockpit-nav-assistants"]');
    await assistants.focus();
    await expect(assistants).toBeFocused();
    await page.keyboard.press('Enter');
    await page.waitForURL(/#\/assistants$/, { timeout: 10_000 });

    const accessibleNames = await Promise.all(
      [newChat, search, projects, library, assistants].map((locator) =>
        locator.evaluate((element) => (element.getAttribute('aria-label') || element.textContent || '').trim())
      )
    );
    accessibleNames.forEach((accessibleName) => expect(accessibleName.length).toBeGreaterThan(0));
  });

  test('keeps New chat, Search, Projects, and Library reachable at 200% zoom in a narrow window', async () => {
    await page.setViewportSize({ width: 640, height: 720 });
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });

    const boxes = await Promise.all(
      ['cockpit-new-chat', 'cockpit-command-palette', 'cockpit-nav-projects', 'cockpit-nav-library'].map(
        async (testId) => {
          const control = page.locator(`[data-testid="${testId}"]`);
          await expect(control).toBeVisible();
          return control.boundingBox();
        }
      )
    );
    boxes.forEach((box) => {
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(640);
    });

    await page.evaluate(() => {
      document.documentElement.style.zoom = '';
    });
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('returns to Classic in place and can opt into Cockpit again', async () => {
    await page.getByText('Settings', { exact: true }).last().click();
    await page.waitForURL(/#\/settings\/navigation$/, { timeout: 10_000 });

    await page.getByText('Classic', { exact: true }).click();
    await expect(page.locator('[data-shell-experience]')).toHaveAttribute('data-shell-experience', 'classic');
    await expect(page).toHaveURL(/#\/settings\/navigation$/);
    await expect(page.locator('[data-testid="cockpit-sider"]')).toHaveCount(0);

    await page.getByText('Cockpit preview', { exact: true }).click();
    await expect(page.locator('[data-shell-experience]')).toHaveAttribute('data-shell-experience', 'cockpit');

    // Leave the isolated fixture in the safer compatibility state.
    await page.getByText('Classic', { exact: true }).click();
    await expect(page.locator('[data-shell-experience]')).toHaveAttribute('data-shell-experience', 'classic');
  });
});
