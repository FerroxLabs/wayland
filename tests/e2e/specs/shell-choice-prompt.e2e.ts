/**
 * One-time Classic/Cockpit prompt for existing installs.
 *
 * Runs in a dedicated userData profile that is seeded by hand rather than with
 * `seedCompletedOnboarding`, because that helper now also sets
 * `ui.shellChoicePrompted` — which is exactly the flag this suite needs absent.
 * Leaving it out is what makes the profile look like a real existing install
 * that predates the chooser.
 *
 * The regression this guards: the prompt must appear ONCE and never again, and
 * it must record that it was shown even when the user declines. Getting that
 * wrong means a modal in front of the app on every single launch.
 */
import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { launchAppWithEnv } from '../fixtures';

const extensionsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-shellchoice-extensions-'));
const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-shellchoice-state-'));
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-shellchoice-userdata-'));
const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-shellchoice-home-'));

/** An established install from before the chooser existed: onboarded, never asked. */
function seedNeverPrompted(dir: string): void {
  const configDir = path.join(dir, 'config');
  fs.mkdirSync(configDir, { recursive: true });
  const json = JSON.stringify({ onboardingCompleted: true });
  fs.writeFileSync(
    path.join(configDir, 'wayland-config.txt'),
    Buffer.from(encodeURIComponent(json), 'utf8').toString('base64'),
    {
      mode: 0o600,
    }
  );
}

function readConfig(dir: string): Record<string, unknown> {
  const raw = fs.readFileSync(path.join(dir, 'config', 'wayland-config.txt'), 'utf8');
  return JSON.parse(decodeURIComponent(Buffer.from(raw, 'base64').toString('utf8')));
}

async function resolveMainWindow(electronApp: ElectronApplication): Promise<Page> {
  const existing = electronApp.windows().find((candidate) => !candidate.url().startsWith('devtools://'));
  if (existing) return existing;

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    // oxlint-disable-next-line eslint(no-await-in-loop)
    const candidate = await electronApp.waitForEvent('window', { timeout: 1_000 }).catch(() => null);
    if (candidate && !candidate.url().startsWith('devtools://')) return candidate;
  }
  throw new Error('Shell-choice E2E could not resolve the main Desktop window.');
}

const launchEnv = () => ({
  ELECTRON_RENDERER_URL: process.env.ELECTRON_RENDERER_URL ?? 'http://localhost:5173',
  WAYLAND_E2E_USER_DATA_DIR: userDataDir,
  WAYLAND_EXTENSIONS_PATH: extensionsDir,
  WAYLAND_EXTENSION_STATES_FILE: path.join(stateDir, 'extension-states.json'),
  HOME: homeDir,
});

test.describe.serial('Classic/Cockpit one-time prompt', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    seedNeverPrompted(userDataDir);
    electronApp = await launchAppWithEnv(launchEnv());
    page = await resolveMainWindow(electronApp);
  });

  test.afterAll(async () => {
    await electronApp?.close().catch(() => undefined);
    for (const dir of [extensionsDir, stateDir, userDataDir, homeDir]) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('offers the choice to an install that was never asked', async () => {
    await expect(page.getByTestId('shell-choice-prompt')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('shell-choice-card-classic')).toBeVisible();
    await expect(page.getByTestId('shell-choice-card-cockpit')).toBeVisible();
  });

  test('applies Cockpit and records that the choice was offered', async () => {
    await page.getByTestId('shell-choice-card-cockpit').click();
    await expect(page.getByTestId('shell-choice-card-cockpit')).toHaveAttribute('aria-checked', 'true');

    await page.getByRole('button', { name: 'Use this layout' }).click();
    await expect(page.getByTestId('shell-choice-prompt')).toHaveCount(0, { timeout: 15_000 });

    await expect(page.locator('[data-shell-experience]')).toHaveAttribute('data-shell-experience', 'cockpit', {
      timeout: 15_000,
    });

    await expect.poll(() => readConfig(userDataDir)['ui.shellChoicePrompted'], { timeout: 15_000 }).toBe(true);
    expect(readConfig(userDataDir)['ui.shell']).toBe('cockpit');
  });

  test('does not ask again on the next launch', async () => {
    // A relaunch, not a reload: this has to survive the process, which is the
    // whole point of the durable flag.
    await electronApp.close().catch(() => undefined);
    electronApp = await launchAppWithEnv(launchEnv());
    page = await resolveMainWindow(electronApp);

    await page.waitForSelector('[data-shell-experience]', { timeout: 30_000 });
    await expect(page.getByTestId('shell-choice-prompt')).toHaveCount(0);
  });
});
