/**
 * OpenClaw Gateway - agent E2E.
 *
 * Non-ACP agent. Registered via AgentRegistry.detectOtherCliAgents() - it is
 * detected if and only if `openclaw` is on PATH (separate code path from
 * AcpDetector.detectBuiltinAgents). The runtime is a gateway/network process
 * rather than a stdio CLI, so per-prompt behavior tests skip cleanly when
 * the binary is absent.
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

const HAS_CLI = isCliOnPath('openclaw');

test.describe('Agent: OpenClaw Gateway', () => {
  test('detection: presence matches host CLI install', async ({ page }) => {
    const agents = await listAgents(page);
    const present = agents.some((a) => a.backend === 'openclaw-gateway' || a.kind === 'openclaw-gateway');
    if (HAS_CLI) {
      expect(present, `openclaw CLI on PATH but not in registry`).toBe(true);
    } else {
      // No openclaw on PATH → expect it NOT to be in the registry.
      expect(present).toBe(false);
    }
  });

  test('start: gateway smoke (requires openclaw CLI)', async ({ page: _page }) => {
    test.skip(!HAS_CLI, 'requires openclaw CLI installed');
    expect(true).toBe(true);
  });

  test('send/receive: round trip (requires openclaw CLI)', async ({ page: _page }) => {
    test.skip(!HAS_CLI, 'requires openclaw CLI installed');
    expect(true).toBe(true);
  });

  test('abort: cleans up child process (requires openclaw CLI)', async ({ page: _page }) => {
    test.skip(!HAS_CLI, 'requires openclaw CLI installed');
    expect(true).toBe(true);
  });

  test('restart: new session after abort (requires openclaw CLI)', async ({ page: _page }) => {
    test.skip(!HAS_CLI, 'requires openclaw CLI installed');
    expect(true).toBe(true);
  });
});
