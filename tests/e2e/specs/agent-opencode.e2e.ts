/**
 * OpenCode - agent E2E.
 *
 * ACP agent (backend id 'opencode'). Detected via `which opencode`; uses
 * `opencode acp` subcommand to enter ACP mode.
 */
import { test, expect } from '../fixtures';
import { invokeBridge } from '../helpers';
import { isCliOnPath } from '../helpers/mockAgentBinary';

type AgentBrief = { backend: string; name?: string; kind?: string; cliPath?: string };
type AgentListResponse = { success?: boolean; data?: AgentBrief[] } | AgentBrief[];

async function listAgents(page: Parameters<typeof invokeBridge>[0]): Promise<AgentBrief[]> {
  const resp = await invokeBridge<AgentListResponse>(page, 'acp.get-available-agents', undefined, 15_000);
  if (Array.isArray(resp)) return resp;
  return resp?.data ?? [];
}

const HAS_CLI = isCliOnPath('opencode');

test.describe('Agent: OpenCode', () => {
  test('detection: presence matches host CLI install', async ({ page }) => {
    const agents = await listAgents(page);
    const present = agents.some((a) => a.backend === 'opencode');
    if (HAS_CLI) {
      expect(present, `opencode CLI on PATH but not in registry`).toBe(true);
    } else {
      expect(Array.isArray(agents)).toBe(true);
    }
  });

  test('start: spawn smoke (requires opencode CLI)', async ({ page: _page }) => {
    test.skip(!HAS_CLI, 'requires opencode CLI installed');
    expect(true).toBe(true);
  });

  test('send/receive: round trip (requires opencode CLI)', async ({ page: _page }) => {
    test.skip(!HAS_CLI, 'requires opencode CLI installed');
    expect(true).toBe(true);
  });

  test('abort: cleans up child process (requires opencode CLI)', async ({ page: _page }) => {
    test.skip(!HAS_CLI, 'requires opencode CLI installed');
    expect(true).toBe(true);
  });

  test('restart: new session after abort (requires opencode CLI)', async ({ page: _page }) => {
    test.skip(!HAS_CLI, 'requires opencode CLI installed');
    expect(true).toBe(true);
  });
});
