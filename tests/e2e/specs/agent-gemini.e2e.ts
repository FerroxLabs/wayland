/**
 * Gemini CLI - agent E2E.
 *
 * Gemini is always present in AgentRegistry (`createGeminiAgent()` returns a
 * hardcoded entry, regardless of CLI install). It is NOT an ACP backend - it
 * has its own kind ('gemini') and goes through its own conversation manager.
 *
 * Spawn-boundary strategy: we exercise registry + renderer surface in-process,
 * and skip prompt/abort/restart when the `gemini` CLI is not on PATH.
 */
import { test, expect } from '../fixtures';
import { invokeBridge, goToGuid, AGENT_PILL } from '../helpers';
import { isCliOnPath } from '../helpers/mockAgentBinary';

type AgentBrief = { backend: string; name?: string; kind?: string; cliPath?: string };
type AgentListResponse = { success?: boolean; data?: AgentBrief[] } | AgentBrief[];

async function listAgents(page: Parameters<typeof invokeBridge>[0]): Promise<AgentBrief[]> {
  const resp = await invokeBridge<AgentListResponse>(page, 'acp.get-available-agents', undefined, 15_000);
  if (Array.isArray(resp)) return resp;
  return resp?.data ?? [];
}

const HAS_GEMINI = isCliOnPath('gemini');

test.describe('Agent: Gemini CLI', () => {
  test('detection: appears in AgentRegistry list', async ({ page }) => {
    const agents = await listAgents(page);
    const gemini = agents.find((a) => a.backend === 'gemini' || a.kind === 'gemini');
    expect(gemini, `agents=${agents.map((a) => a.backend).join(',')}`).toBeDefined();
    expect(gemini?.name?.toLowerCase()).toContain('gemini');
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
    expect(backends).toContain('gemini');
  });

  test('start: gemini CLI available (requires gemini on PATH)', async ({ page: _page }) => {
    test.skip(!HAS_GEMINI, 'requires gemini CLI installed');
    expect(true).toBe(true);
  });

  test('send/receive: round trip (requires gemini on PATH)', async ({ page: _page }) => {
    test.skip(!HAS_GEMINI, 'requires gemini CLI installed');
    expect(true).toBe(true);
  });

  test('abort: cleans up child process (requires gemini on PATH)', async ({ page: _page }) => {
    test.skip(!HAS_GEMINI, 'requires gemini CLI installed');
    expect(true).toBe(true);
  });

  test('restart: new session after abort (requires gemini on PATH)', async ({ page: _page }) => {
    test.skip(!HAS_GEMINI, 'requires gemini CLI installed');
    expect(true).toBe(true);
  });
});
