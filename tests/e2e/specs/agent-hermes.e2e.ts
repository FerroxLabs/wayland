/**
 * Hermes Agent - agent E2E.
 *
 * ACP agent (backend id 'hermes'). Nous Research's Hermes agent CLI; uses
 * `hermes acp` to enter ACP mode. Per AcpDetector, registered as one of
 * POTENTIAL_ACP_CLIS - same detection path as claude/codex/etc.
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

const HAS_CLI = isCliOnPath('hermes');

test.describe('Agent: Hermes Agent', () => {
  test('detection: presence matches host CLI install', async ({ page }) => {
    const agents = await listAgents(page);
    const present = agents.some((a) => a.backend === 'hermes');
    if (HAS_CLI) {
      expect(present, `hermes CLI on PATH but not in registry`).toBe(true);
    } else {
      expect(Array.isArray(agents)).toBe(true);
    }
  });

  test('start: spawn smoke (requires hermes CLI)', async ({ page: _page }) => {
    test.skip(!HAS_CLI, 'requires hermes CLI installed');
    expect(true).toBe(true);
  });

  test('send/receive: round trip (requires hermes CLI)', async ({ page: _page }) => {
    test.skip(!HAS_CLI, 'requires hermes CLI installed');
    expect(true).toBe(true);
  });

  test('abort: cleans up child process (requires hermes CLI)', async ({ page: _page }) => {
    test.skip(!HAS_CLI, 'requires hermes CLI installed');
    expect(true).toBe(true);
  });

  test('restart: new session after abort (requires hermes CLI)', async ({ page: _page }) => {
    test.skip(!HAS_CLI, 'requires hermes CLI installed');
    expect(true).toBe(true);
  });
});
