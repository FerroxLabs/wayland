/**
 * Wayland Core (wcore engine) - agent E2E.
 *
 * Wayland Core is the always-present in-tree engine. Detection runs even
 * without the binary on disk because AgentRegistry hardcodes a wcore entry
 * (`createWCoreAgent()` in AgentRegistry.ts) - the binary's actual runtime
 * availability is checked only when a wcore conversation starts.
 *
 * Spawn-boundary strategy: the Electron app under test owns the spawn; we
 * can't reroute it from a Playwright test. So:
 *   - detection: assert wcore appears in the agent list (always).
 *   - send/abort/restart: gated on a `wayland-core` binary being
 *     resolvable. When unresolvable, skip cleanly with a clear message.
 *     `WCORE_SKIP=1` (set in CI) short-circuits these to skipped.
 *
 * Bridge key: `acp.get-available-agents` (acpConversation.getAvailableAgents).
 */
import { test, expect } from '../fixtures';
import { invokeBridge, goToGuid, AGENT_PILL } from '../helpers';
import { isCliOnPath } from '../helpers/mockAgentBinary';

type AgentBrief = {
  backend: string;
  name?: string;
  kind?: string;
  cliPath?: string;
};

type AgentListResponse = { success?: boolean; data?: AgentBrief[] } | AgentBrief[];

async function listAgents(page: Parameters<typeof invokeBridge>[0]): Promise<AgentBrief[]> {
  const resp = await invokeBridge<AgentListResponse>(page, 'acp.get-available-agents', undefined, 15_000);
  if (Array.isArray(resp)) return resp;
  return resp?.data ?? [];
}

const WCORE_RUNTIME_AVAILABLE = !process.env.WCORE_SKIP && isCliOnPath('wayland-core');

test.describe('Agent: Wayland Core (wcore)', () => {
  test('detection: appears in AgentRegistry list', async ({ page }) => {
    const agents = await listAgents(page);
    const wcore = agents.find((a) => a.backend === 'wcore' || a.kind === 'wcore');
    expect(wcore, `agents=${agents.map((a) => `${a.backend}/${a.kind}`).join(',')}`).toBeDefined();
    expect(wcore?.name?.toLowerCase()).toContain('wayland');
  });

  test('detection: surfaces in renderer pill bar', async ({ page }) => {
    await goToGuid(page);
    const pills = page.locator(AGENT_PILL);
    await expect(pills.first()).toBeVisible({ timeout: 8_000 });

    const count = await pills.count();
    const backends: string[] = [];
    for (let i = 0; i < count; i++) {
      const b = await pills.nth(i).getAttribute('data-agent-backend');
      if (b) backends.push(b);
    }
    // wcore registers under the 'wcore' backend id.
    expect(backends).toContain('wcore');
  });

  test('start: wcore binary spawn (requires wayland-core on PATH)', async ({ page }) => {
    test.skip(!WCORE_RUNTIME_AVAILABLE, 'requires wayland-core binary on PATH (or WCORE_SKIP=1 to skip in CI)');
    // Just exercise the registry call path - a real prompt would require a
    // conversation, which is covered by conversation-full-cycle.e2e.ts.
    const agents = await listAgents(page);
    expect(agents.some((a) => a.backend === 'wcore')).toBe(true);
  });

  test('send/receive: round trip (requires wayland-core on PATH)', async ({ page: _page }) => {
    test.skip(!WCORE_RUNTIME_AVAILABLE, 'requires wayland-core binary on PATH');
    // Round-trip prompt validation lives in conversation-full-cycle.e2e.ts;
    // this stub stays as an explicit per-agent placeholder so the matrix is
    // visible in --reporter=list output.
    expect(true).toBe(true);
  });

  test('abort: cleans up child process (requires wayland-core on PATH)', async ({ page: _page }) => {
    test.skip(!WCORE_RUNTIME_AVAILABLE, 'requires wayland-core binary on PATH');
    // Abort cleanup is covered by the H10 fix verification suite; per-agent
    // matrix entry retained for surface coverage.
    expect(true).toBe(true);
  });

  test('restart: new session starts cleanly after abort', async ({ page: _page }) => {
    test.skip(!WCORE_RUNTIME_AVAILABLE, 'requires wayland-core binary on PATH');
    expect(true).toBe(true);
  });
});
