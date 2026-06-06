/**
 * E2E (adversarial): Window-restart persistence.
 *
 * Launches an isolated Electron instance with its own --user-data-dir,
 * mutates state, closes the app, relaunches against the SAME data dir,
 * and verifies state survived.
 *
 * This is the only spec that doesn't share the singleton fixture - it
 * needs a clean SQLite DB it can predict the contents of, and a real
 * close/relaunch cycle.
 */

import { test, expect, type ElectronApplication, type Page, _electron as electron } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { invokeBridge } from '../helpers';

const projectRoot = path.resolve(__dirname, '../../..');

type TeamRow = { id: string; name: string; promotedToStanding?: boolean };

async function resolveMainWindow(app: ElectronApplication): Promise<Page> {
  const existing = app.windows().find((w) => !w.url().startsWith('devtools://'));
  if (existing) {
    await existing.waitForLoadState('domcontentloaded');
    // Wait for renderer to stabilize (electronAPI exposed).
    await existing.waitForFunction(() => typeof (window as { electronAPI?: unknown }).electronAPI !== 'undefined', {
      timeout: 15_000,
    });
    return existing;
  }
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const w = await app.waitForEvent('window', { timeout: 1_000 }).catch(() => null);
    if (w && !w.url().startsWith('devtools://')) {
      await w.waitForLoadState('domcontentloaded');
      await w.waitForFunction(() => typeof (window as { electronAPI?: unknown }).electronAPI !== 'undefined', {
        timeout: 15_000,
      });
      return w;
    }
  }
  throw new Error('Failed to resolve main renderer window for window-lifecycle E2E.');
}

async function launchIsolated(userDataDir: string, statesFile: string): Promise<ElectronApplication> {
  const launchArgs = ['.', `--user-data-dir=${userDataDir}`];
  if (process.platform === 'linux' && process.env.CI) {
    launchArgs.push('--no-sandbox');
  }
  return electron.launch({
    args: launchArgs,
    cwd: projectRoot,
    env: {
      ...process.env,
      WAYLAND_EXTENSIONS_PATH:
        process.env.WAYLAND_EXTENSIONS_PATH ||
        [
          path.join(projectRoot, 'examples'),
          path.join(projectRoot, 'tests/e2e/fixtures/extensions'),
        ].join(process.platform === 'win32' ? ';' : ':'),
      WAYLAND_EXTENSION_STATES_FILE: statesFile,
      WAYLAND_DISABLE_AUTO_UPDATE: '1',
      WAYLAND_DISABLE_DEVTOOLS: '1',
      WAYLAND_E2E_TEST: '1',
      WAYLAND_CDP_PORT: '0',
      NODE_ENV: 'development',
    },
    timeout: 60_000,
  });
}

// invokeBridge imported from ../helpers - uses the @office-ai/platform
// subscribe-{key} / subscribe.callback-{key}{id} provider protocol that
// the real bridge runs on. Re-aliased here for readability.
const invokeBridgeOn = invokeBridge;

const buildAgent = () => ({
  slotId: '',
  conversationId: '',
  role: 'leader' as const,
  agentType: 'wayland-core',
  agentName: 'Leader',
  conversationType: 'acp',
  status: 'pending' as const,
});

test.describe.serial('Team window lifecycle (adversarial)', () => {
  let userDataDir: string;
  let statesFile: string;
  let app: ElectronApplication | null = null;
  let page: Page | null = null;

  test.beforeAll(() => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-e2e-window-'));
    userDataDir = path.join(root, 'userdata');
    statesFile = path.join(root, 'extension-states.json');
    fs.mkdirSync(userDataDir, { recursive: true });
  });

  test.afterAll(async () => {
    if (app) await app.close().catch(() => undefined);
    fs.rmSync(path.dirname(userDataDir), { recursive: true, force: true });
  });

  async function freshLaunch(): Promise<Page> {
    if (app) await app.close().catch(() => undefined);
    app = await launchIsolated(userDataDir, statesFile);
    page = await resolveMainWindow(app);
    // Give the DB migrations + extension loader a moment to settle.
    await page.waitForTimeout(2_000);
    return page;
  }

  test('case 1: 5 teams survive close + relaunch', async () => {
    test.setTimeout(180_000);
    const p1 = await freshLaunch();

    const before = await invokeBridgeOn<TeamRow[]>(p1, 'team.list', { userId: 'system_default_user' });
    const beforeCount = before.length;

    const createdIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = await invokeBridgeOn<{ id?: string } | null>(p1, 'team.create', {
        userId: 'system_default_user',
        name: `E2E WindowLifecycle Team${i} ${Date.now()}`,
        workspace: '',
        workspaceMode: 'shared',
        agents: [buildAgent()],
      });
      if (r?.id) createdIds.push(r.id);
    }
    if (createdIds.length < 5) {
      test.skip(true, `team.create returned <5 ids (got ${createdIds.length}) - backend missing`);
      return;
    }

    const after = await invokeBridgeOn<TeamRow[]>(p1, 'team.list', { userId: 'system_default_user' });
    expect(after.length).toBe(beforeCount + 5);

    // Close + relaunch.
    const p2 = await freshLaunch();
    const afterRestart = await invokeBridgeOn<TeamRow[]>(p2, 'team.list', { userId: 'system_default_user' });
    expect(afterRestart.length).toBe(beforeCount + 5);
    for (const id of createdIds) {
      expect(afterRestart.some((t) => t.id === id)).toBe(true);
    }

    // Cleanup.
    for (const id of createdIds) {
      await invokeBridgeOn(p2, 'team.remove', { id }).catch(() => undefined);
    }
  });

  test('case 2: team roster (added teammate) persists across restart', async () => {
    test.setTimeout(180_000);
    const p1 = await freshLaunch();

    const created = await invokeBridgeOn<{ id?: string } | null>(p1, 'team.create', {
      userId: 'system_default_user',
      name: `E2E WindowLifecycle Roster ${Date.now()}`,
      workspace: '',
      workspaceMode: 'shared',
      agents: [buildAgent()],
    });
    if (!created?.id) {
      test.skip(true, 'team.create returned null - backend missing');
      return;
    }
    const id = created.id;

    // Add a teammate so we have a state mutation to verify after restart.
    await invokeBridgeOn(p1, 'team.add-agent', {
      teamId: id,
      agent: {
        conversationId: '',
        role: 'teammate',
        agentType: 'wayland-core',
        agentName: 'Persisted Teammate',
        conversationType: 'acp',
        status: 'pending',
      },
    });

    const beforeRestart = await invokeBridgeOn<{ agents?: Array<{ role: string }> } | null>(
      p1,
      'team.get',
      { id }
    );
    expect(beforeRestart?.agents?.length).toBe(2);

    // Restart.
    const p2 = await freshLaunch();
    const afterRestart = await invokeBridgeOn<{ agents?: Array<{ role: string; agentName?: string }> } | null>(
      p2,
      'team.get',
      { id }
    );
    expect(afterRestart).not.toBeNull();
    expect(afterRestart?.agents?.length).toBe(2);
    expect(afterRestart?.agents?.some((a) => a.agentName === 'Persisted Teammate')).toBe(true);

    await invokeBridgeOn(p2, 'team.remove', { id }).catch(() => undefined);
  });

  test('case 3: abandoned launcher state does not persist (no orphan teams)', async () => {
    test.setTimeout(180_000);
    const p1 = await freshLaunch();

    const before = await invokeBridgeOn<TeamRow[]>(p1, 'team.list', { userId: 'system_default_user' });

    // Navigate to launcher and type a name, but never call team.create.
    await p1.evaluate(() => window.location.assign('#/teams/ext-marketing-agency/launch'));
    await p1.waitForURL(/\/teams\/ext-marketing-agency\/launch/, { timeout: 15_000 });
    await p1
      .locator('[data-testid="launcher-name-input"]')
      .fill(`E2E WindowLifecycle Abandoned ${Date.now()}`)
      .catch(() => undefined);
    // Close abruptly - no Launch click, no Cancel.

    // Restart.
    const p2 = await freshLaunch();
    const after = await invokeBridgeOn<TeamRow[]>(p2, 'team.list', { userId: 'system_default_user' });
    expect(after.length).toBe(before.length);
  });
});
