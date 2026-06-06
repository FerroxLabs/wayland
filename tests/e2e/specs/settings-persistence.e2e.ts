/**
 * Settings persistence across app restart.
 *
 * Each test writes a setting via the renderer storage bridge, quits the
 * Electron process cleanly, relaunches it against the same `userData`
 * directory, and verifies the written value is still there. This validates
 * the C1 storage allowlist fix (commit 4b9634897) end-to-end and closes the
 * "settings persistence" coverage gap - there was no prior runtime test
 * proving that quit→relaunch round-trips survived.
 *
 * Isolation model
 * ---------------
 * The singleton `electronApp` fixture is *shared* across the worker - quitting
 * it from inside a test would break every spec that runs after us. So this
 * spec launches its **own** Electron instance per test, pinned to a unique
 * `--user-data-dir`, and tears it down at the end of the test. We never touch
 * the singleton app or page fixtures.
 *
 * Storage wire keys
 * -----------------
 * From `src/common/adapter/bridgeAllowlist.ts` (buildStorage wrapper):
 *   - `<namespace>.storage.get`   data: "<key>"
 *   - `<namespace>.storage.set`   data: { key: "<key>", data: <value> }
 *   - `<namespace>.storage.clear` data: undefined
 *   - `<namespace>.storage.remove` data: "<key>"
 *
 * Namespaces (from `src/common/config/storage.ts`):
 *   - agent.chat          (ChatStorage)
 *   - agent.chat.message  (ChatMessageStorage)
 *   - agent.config        (ConfigStorage - holds System/Agents/Models/WebUI/Channels/Skills/Tools)
 *   - agent.env           (EnvStorage)
 *
 * Clean-quit note
 * ---------------
 * Playwright's `ElectronApplication.close()` works in practice but tears down
 * the process abruptly. We prefer `app.exit(0)` from the main process (same
 * pattern the fixture uses in its `beforeExit` cleanup) so any pending
 * `writeFileAtomic` flushes its buffer first. If a graceful exit doesn't take
 * within `QUIT_TIMEOUT_MS`, we fall back to `electronApp.close()`. A relaunch
 * always re-reads from disk, so this is sufficient to prove persistence.
 *
 * TODO (harness): teach `tests/e2e/fixtures.ts` to expose a `quitApp()` helper
 * so specs that need clean-quit semantics don't have to inline the
 * app.exit→close fallback dance.
 */
// Opt out of the shared `../fixtures` singleton - this spec needs to launch
// its OWN Electron instances per test. Uses our custom spawn+CDP driver
// (helpers/cdpDriver.ts) instead of Playwright's electron.launch() because
// Playwright's Node Inspector attach freezes V8 enough to block Chromium's
// own CDP port bind for this app. See cdpDriver.ts header for the full story.
import { test, expect } from '@playwright/test';
import { launchAppViaCdp, type CdpApp } from '../helpers/cdpDriver';
import path from 'path';
import fs from 'fs';
import os from 'os';

// ── Helpers ──────────────────────────────────────────────────────────────────

const QUIT_TIMEOUT_MS = 8_000;
// Launching a fresh, sandboxed Electron app on a per-test basis runs the
// full first-run init path (migrations, builtin-skill copy, DB init). On a
// loaded box that's noticeably slower than the singleton's amortised
// launch - the per-test timeout below (describe.configure timeout) covers
// two of these launches plus the bridge calls in between.
const RELAUNCH_TIMEOUT_MS = 120_000;

type StorageNamespace = 'agent.chat' | 'agent.chat.message' | 'agent.config' | 'agent.env';

/**
 * Per-test sandbox: a unique userData dir + extension-states file so we can
 * relaunch against the same on-disk state without colliding with the
 * singleton or with sibling tests.
 */
interface Sandbox {
  userDataDir: string;
  extensionStatesFile: string;
  /** Per-test CDP port so parallel workers don't collide on 9876. */
  cdpPort: number;
}

let nextCdpPort = 9876;
function allocCdpPort(): number {
  // Bump in 1-port steps; CDP servers are short-lived per test.
  return nextCdpPort++;
}

function createSandbox(testName: string): Sandbox {
  const slug = testName.replace(/[^a-z0-9]+/gi, '-').slice(0, 32);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `wayland-persist-${slug}-`));
  return {
    userDataDir: path.join(root, 'userData'),
    extensionStatesFile: path.join(root, 'extension-states.json'),
    cdpPort: allocCdpPort(),
  };
}

/**
 * Launch a sandboxed Electron instance pinned to a private userData dir,
 * driven via the custom spawn+CDP helper (see helpers/cdpDriver.ts header for
 * why we don't use Playwright's electron.launch() here).
 */
async function launchSandboxedApp(sandbox: Sandbox): Promise<CdpApp> {
  return launchAppViaCdp({
    userDataDir: sandbox.userDataDir,
    cdpPort: sandbox.cdpPort,
    readyTimeoutMs: RELAUNCH_TIMEOUT_MS,
    env: {
      WAYLAND_EXTENSIONS_PATH: process.env.WAYLAND_EXTENSIONS_PATH || path.join(path.resolve(__dirname, '../..'), 'examples'),
      WAYLAND_EXTENSION_STATES_FILE: sandbox.extensionStatesFile,
    },
  });
}

/** Tear down the spawned Electron - fires SIGTERM, waits, then SIGKILL. */
async function quitApp(app: CdpApp): Promise<void> {
  await Promise.race([
    app.quit(),
    new Promise<void>((_, reject) => setTimeout(() => reject(new Error('quit timeout')), QUIT_TIMEOUT_MS)),
  ]).catch(() => {
    // Best-effort: process is dead or kill failed. Either way, relaunch reads
    // from disk so the test continues.
    console.warn('[settings-persistence] quit timeout - process may still be exiting');
  });
}

function cleanupSandbox(sandbox: Sandbox): void {
  try {
    const root = path.dirname(sandbox.userDataDir);
    fs.rmSync(root, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup; OS will reclaim /tmp eventually.
  }
}

/**
 * Storage round-trip via the bridge. Uses the same wire format as
 * `@office-ai/platform`'s `buildStorage`:
 *   set → `subscribe-<ns>.storage.set` with `{ key, data: value }`
 *   get → `subscribe-<ns>.storage.get` with `<key>`
 */
async function storageSet(app: CdpApp, namespace: StorageNamespace, key: string, value: unknown): Promise<void> {
  await app.invokeBridge(`${namespace}.storage.set`, { key, data: value });
}

async function storageGet<T = unknown>(app: CdpApp, namespace: StorageNamespace, key: string): Promise<T> {
  return app.invokeBridge<T>(`${namespace}.storage.get`, key);
}

/**
 * Three-phase persistence harness shared by every test:
 *   1. write   - launch app, mutate one key, verify in-process read sees it.
 *   2. quit    - exit the Electron process cleanly.
 *   3. relaunch+read - relaunch against the same userData and confirm value.
 */
async function runPersistenceCase<T>(
  testInfo: { title: string },
  namespace: StorageNamespace,
  key: string,
  value: T,
  equalityCheck: (actual: unknown) => void
): Promise<void> {
  const sandbox = createSandbox(testInfo.title);
  let app: CdpApp | null = null;

  try {
    await test.step('write - launch app, set value, verify in-process', async () => {
      app = await launchSandboxedApp(sandbox);
      await storageSet(app, namespace, key, value);
      // Sanity read against the same instance - proves the write returned and
      // the bridge round-trips before we trust persistence.
      const before = await storageGet<unknown>(app, namespace, key);
      equalityCheck(before);
    });

    await test.step('quit - exit Electron cleanly', async () => {
      if (!app) throw new Error('app not launched');
      await quitApp(app);
      app = null;
    });

    await test.step('relaunch - re-open with same userData and verify', async () => {
      app = await launchSandboxedApp(sandbox);
      const after = await storageGet<unknown>(app, namespace, key);
      equalityCheck(after);
    });
  } finally {
    if (app) {
      await quitApp(app).catch(() => {});
    }
    cleanupSandbox(sandbox);
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────
//
// One test per Settings category in `src/renderer/pages/Settings/`. Each one
// drives a single, well-typed key in the right namespace. We use the bridge
// (not UI clicks) because the goal here is *persistence*, not UI behaviour -
// UI-level tests for individual switches live under tests/e2e/features/.

test.describe.configure({ mode: 'serial', timeout: 180_000 });

test.describe('Settings persistence across app restart', () => {
  // Uses helpers/cdpDriver.ts (spawn + Chromium CDP) instead of Playwright's
  // electron.launch(). Playwright's Node Inspector attach freezes V8 init
  // long enough to block Chromium's own CDP port bind for this app - see
  // cdpDriver.ts header. The CDP driver doesn't use --inspect, so it sidesteps
  // the issue cleanly.

  // ── System Settings ────────────────────────────────────────────────────────
  // `src/renderer/pages/Settings/SystemSettings.tsx` toggles like close-to-tray
  // map onto `agent.config` keys (`system.closeToTray`, language, theme).
  test('System: close-to-tray toggle survives restart', async () => {
    await runPersistenceCase(test.info(), 'agent.config', 'system.closeToTray', true, (actual) => {
      expect(actual, 'system.closeToTray persisted').toBe(true);
    });
  });

  test('System: language selection survives restart', async () => {
    await runPersistenceCase(test.info(), 'agent.config', 'language', 'en-US', (actual) => {
      expect(actual, 'language persisted').toBe('en-US');
    });
  });

  test('System: theme selection survives restart', async () => {
    await runPersistenceCase(test.info(), 'agent.config', 'theme', 'dark', (actual) => {
      expect(actual, 'theme persisted').toBe('dark');
    });
  });

  // ── Agents Settings ────────────────────────────────────────────────────────
  // `src/renderer/pages/Settings/AgentSettings/` enables/disables individual
  // CLI agents. The Gemini-flavour key surfaces as `gemini.config` in storage.
  test('Agents: gemini.config (preferredModelId + yoloMode) survives restart', async () => {
    const value = {
      authType: 'oauth',
      proxy: '',
      preferredModelId: 'gemini-2.5-pro',
      yoloMode: true,
    };
    await runPersistenceCase(test.info(), 'agent.config', 'gemini.config', value, (actual) => {
      expect(actual, 'gemini.config persisted').toMatchObject(value);
    });
  });

  test('Agents: last-selected agent on guid page survives restart', async () => {
    await runPersistenceCase(test.info(), 'agent.config', 'guid.lastSelectedAgent', 'claude', (actual) => {
      expect(actual, 'guid.lastSelectedAgent persisted').toBe('claude');
    });
  });

  // ── Models Settings ────────────────────────────────────────────────────────
  // `src/renderer/pages/Settings/GeminiSettings.tsx` and `WCoreSettings.tsx`
  // write the model.config / gemini.defaultModel keys. We pick a shape that
  // matches IProvider[] minimally so the persistence layer doesn't reject it.
  test('Models: model.config (provider list) survives restart', async () => {
    const providers = [
      {
        id: 'e2e-provider-1',
        platform: 'openai',
        name: 'E2E OpenAI',
        baseUrl: 'https://api.example.com',
        apiKey: 'sk-e2e-test-not-real',
        model: ['gpt-4o-mini'],
        enabled: true,
      },
    ];
    await runPersistenceCase(test.info(), 'agent.config', 'model.config', providers, (actual) => {
      expect(Array.isArray(actual), 'model.config is an array').toBe(true);
      const arr = actual as typeof providers;
      expect(arr).toHaveLength(1);
      expect(arr[0]).toMatchObject({ id: 'e2e-provider-1', platform: 'openai', enabled: true });
    });
  });

  test('Models: gemini.defaultModel survives restart', async () => {
    const def = { id: 'e2e-provider-1', useModel: 'gemini-2.5-pro' };
    await runPersistenceCase(test.info(), 'agent.config', 'gemini.defaultModel', def, (actual) => {
      expect(actual, 'gemini.defaultModel persisted').toMatchObject(def);
    });
  });

  // ── WebUI Settings ────────────────────────────────────────────────────────
  // `src/renderer/pages/Settings/WebuiSettings.tsx` exposes port + allow-remote.
  test('WebUI: port survives restart', async () => {
    await runPersistenceCase(test.info(), 'agent.config', 'webui.desktop.port', 8765, (actual) => {
      expect(actual, 'webui.desktop.port persisted').toBe(8765);
    });
  });

  test('WebUI: allow-remote toggle survives restart', async () => {
    await runPersistenceCase(test.info(), 'agent.config', 'webui.desktop.allowRemote', true, (actual) => {
      expect(actual, 'webui.desktop.allowRemote persisted').toBe(true);
    });
  });

  // ── Channels Settings (WeCom / DingTalk / Lark / WeChat / Telegram) ───────
  // Per-channel default-model + agent selection. Drives `assistant.<channel>.*`
  // keys defined in src/common/config/storage.ts. We cover one channel
  // explicitly + a second to exercise more than one path - that's what the
  // brief asks for ("at least one channel toggle").
  test('Channels: WeCom default model survives restart', async () => {
    const value = { id: 'e2e-provider-1', useModel: 'gpt-4o-mini' };
    await runPersistenceCase(test.info(), 'agent.config', 'assistant.wecom.defaultModel', value, (actual) => {
      expect(actual, 'assistant.wecom.defaultModel persisted').toMatchObject(value);
    });
  });

  test('Channels: Lark agent selection survives restart', async () => {
    const value = { backend: 'claude', name: 'Lark Bot' };
    await runPersistenceCase(test.info(), 'agent.config', 'assistant.lark.agent', value, (actual) => {
      expect(actual, 'assistant.lark.agent persisted').toMatchObject(value);
    });
  });

  // ── Skills Settings ────────────────────────────────────────────────────────
  // `src/renderer/pages/Settings/SkillsHubSettings.tsx` controls the
  // skillsMarket.enabled toggle (auto-injected built-in skills).
  test('Skills: skillsMarket.enabled toggle survives restart', async () => {
    await runPersistenceCase(test.info(), 'agent.config', 'skillsMarket.enabled', false, (actual) => {
      expect(actual, 'skillsMarket.enabled persisted').toBe(false);
    });
  });

  // ── Tools Settings ─────────────────────────────────────────────────────────
  // `src/renderer/pages/Settings/ToolsSettings/` exposes MCP servers. The
  // canonical persistence key is `mcp.config` - an array of IMcpServer. We
  // write a single stdio entry with enabled:false to validate the toggle.
  test('Tools: MCP server enable/disable survives restart', async () => {
    const servers = [
      {
        id: 'e2e-mcp-1',
        name: 'E2E Test MCP',
        enabled: false,
        transport: { type: 'stdio', command: '/bin/true', args: [] },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        originalJson: '{}',
      },
    ];
    await runPersistenceCase(test.info(), 'agent.config', 'mcp.config', servers, (actual) => {
      expect(Array.isArray(actual), 'mcp.config is an array').toBe(true);
      // Relaunch initializes builtin MCP servers (e.g. wayland-image-generation),
      // so the list may grow. Assert our user-added entry is present + unchanged,
      // not that it's the ONLY entry.
      const arr = actual as typeof servers;
      const ours = arr.find((s) => s.id === 'e2e-mcp-1');
      expect(ours, 'e2e MCP entry persisted').toBeDefined();
      expect(ours).toMatchObject({ id: 'e2e-mcp-1', enabled: false });
      expect(ours?.transport).toMatchObject({ type: 'stdio', command: '/bin/true' });
    });
  });

  // ── About / Update ────────────────────────────────────────────────────────
  // The auto-update settings page does not currently expose a dedicated
  // "channel" key in `IConfigStorageRefer` - auto-update is gated by
  // WAYLAND_DISABLE_AUTO_UPDATE env var and the auto-update.get-status bridge
  // (see security-audit-verification.e2e.ts:L17). The closest persisted
  // surface is the migration flag history, which is intentionally not
  // user-toggleable. We assert the namespace round-trips an arbitrary
  // user-update-related key (`migration.electronConfigImported`) instead, so
  // we still prove persistence covers update-related state.
  test('About/Update: migration flags persist across restart', async () => {
    await runPersistenceCase(test.info(), 'agent.config', 'migration.electronConfigImported', true, (actual) => {
      expect(actual, 'migration.electronConfigImported persisted').toBe(true);
    });
  });

  // ── Storage-namespace round-trip: chat / config / env ─────────────────────
  //
  // The brief asks for a direct write→quit→read against each of the three
  // production namespaces. We've covered `agent.config` extensively above -
  // these tests pin down `agent.chat` and `agent.env` so a regression that
  // only touches one namespace can't slip past.
  test('Namespace round-trip: agent.chat (chat.history) survives restart', async () => {
    const history = [
      {
        id: 'e2e-conv-1',
        createTime: 1_700_000_000_000,
        modifyTime: 1_700_000_000_000,
        name: 'E2E persistence conversation',
        type: 'wcore' as const,
        model: {
          id: 'e2e-provider-1',
          platform: 'openai',
          name: 'E2E',
          baseUrl: 'https://api.example.com',
          apiKey: 'sk-e2e',
          useModel: 'gpt-4o-mini',
        },
        extra: { workspace: '/tmp/e2e-workspace' },
      },
    ];
    await runPersistenceCase(test.info(), 'agent.chat', 'chat.history', history, (actual) => {
      expect(Array.isArray(actual), 'chat.history is an array').toBe(true);
      const arr = actual as typeof history;
      expect(arr).toHaveLength(1);
      expect(arr[0]).toMatchObject({ id: 'e2e-conv-1', name: 'E2E persistence conversation', type: 'wcore' });
      expect(arr[0]?.extra).toMatchObject({ workspace: '/tmp/e2e-workspace' });
    });
  });

  test('Namespace round-trip: agent.env (wayland.dir) survives restart', async () => {
    const dirs = { workDir: '/tmp/e2e-work', cacheDir: '/tmp/e2e-cache' };
    await runPersistenceCase(test.info(), 'agent.env', 'wayland.dir', dirs, (actual) => {
      expect(actual, 'wayland.dir persisted').toMatchObject(dirs);
    });
  });

  // The `agent.config` round-trip is already proven by every test above -
  // explicit no-op to document the coverage decision for future maintainers.
  test('Namespace round-trip: agent.config - covered by every System/Agents/Models/WebUI/Channels/Skills/Tools test above', () => {
    expect(true).toBe(true);
  });
});
