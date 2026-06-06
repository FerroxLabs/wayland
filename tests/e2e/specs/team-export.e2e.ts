/**
 * E2E (E1): Team export - whitelist-only JSON, zero sensitive fields.
 *
 * Flow per E2E-TEST-PLAN §E1:
 *   1. Create an ad-hoc team via team.create IPC (leader + 1 teammate).
 *   2. Invoke `team.export` IPC. The provider returns a JSON string directly
 *      (per `ipcBridge.team.export: buildProvider<string, ...>`); there is
 *      no renderer-side Export trigger in v0.6.0, so we exercise the IPC
 *      surface - that is the security boundary regardless of whether a
 *      menu item ever ships. UI trigger is a v0.6.1 followup.
 *   3. Parse the returned JSON. Assert ONLY the whitelist keys are present
 *      at the top level: version, id, name, leader, teammates, rituals?,
 *      capabilities.
 *   4. Recursively walk the parsed payload and assert NO key matches the
 *      sensitive-name regex `/apiKey|api_key|secret|token|env|mailbox|
 *      tasks|conversationId/i`. The exporter (exportTeam.ts) is the source
 *      of truth here - every excluded field is named in its header comment.
 */

import { test, expect } from '../fixtures';
import { invokeBridge } from '../helpers';

const TEAM_NAME_PREFIX = 'E2E Export E1';

type BridgeError = { __bridgeError: true; message?: string };
function isBridgeError(value: unknown): value is BridgeError {
  return Boolean(value) && typeof value === 'object' && '__bridgeError' in (value as Record<string, unknown>);
}

const SENSITIVE_KEY_REGEX = /apiKey|api_key|secret|token|env|mailbox|tasks|conversationId/i;
const ALLOWED_TOP_LEVEL = new Set(['version', 'id', 'name', 'leader', 'teammates', 'rituals', 'capabilities']);

/** Walk every key in the payload; throw if any matches the sensitive regex. */
function assertNoSensitiveKeys(value: unknown, path: string[] = []): void {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, idx) => assertNoSensitiveKeys(item, [...path, String(idx)]));
    return;
  }
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      throw new Error(
        `Sensitive key "${key}" found at path "${[...path, key].join('.')}" - exporter leaked a forbidden field`
      );
    }
    assertNoSensitiveKeys(val, [...path, key]);
  }
}

test.describe('Team export - E1', () => {
  test('export IPC returns whitelist-only payload with zero sensitive fields', async ({ page }) => {
    test.setTimeout(120_000);

    // Cleanup leftovers.
    const stale = await invokeBridge<Array<{ id: string; name: string }>>(page, 'team.list', {
      userId: 'system_default_user',
    });
    for (const t of stale) {
      if (t.name.startsWith(TEAM_NAME_PREFIX)) {
        await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => {});
      }
    }

    const teamName = `${TEAM_NAME_PREFIX} ${Date.now()}`;
    const created = await invokeBridge<{ id: string } | null>(page, 'team.create', {
      userId: 'system_default_user',
      name: teamName,
      workspace: '',
      workspaceMode: 'shared',
      agents: [
        {
          slotId: 'slot-lead',
          conversationId: '',
          role: 'leader',
          agentType: 'wcore',
          agentName: 'Leader',
          conversationType: 'wcore',
          status: 'idle',
        },
        {
          slotId: 'slot-mate',
          conversationId: '',
          role: 'teammate',
          agentType: 'wcore',
          agentName: 'Teammate One',
          conversationType: 'wcore',
          status: 'idle',
        },
      ],
    });
    if (!created?.id) throw new Error('team.create returned null - required backend (wcore) not installed');
    const teamId = created.id;

    // Export.
    const exported = await invokeBridge<string | BridgeError>(page, 'team.export', { teamId });
    if (isBridgeError(exported)) {
      throw new Error(`team.export failed: ${exported.message ?? 'unknown'}`);
    }
    expect(typeof exported).toBe('string');

    const parsed = JSON.parse(exported as string) as Record<string, unknown>;

    // Top-level keys must be a subset of the whitelist.
    for (const key of Object.keys(parsed)) {
      expect.soft(ALLOWED_TOP_LEVEL.has(key), `unexpected top-level key "${key}"`).toBe(true);
    }

    // Required keys present (rituals is optional per the exporter).
    expect(parsed.version).toBe('v1');
    expect(parsed.id).toBeTruthy();
    expect(parsed.name).toBe(teamName);
    expect(parsed.leader).toBeTruthy();
    expect(Array.isArray(parsed.teammates)).toBe(true);
    expect(parsed.capabilities).toBeTruthy();

    // Per exporter contract - capabilities ALWAYS serialize as all-false in v1.
    const caps = parsed.capabilities as Record<string, unknown>;
    expect(caps.canReadFiles).toBe(false);
    expect(caps.canWriteFiles).toBe(false);
    expect(caps.canSpawnAgents).toBe(false);
    expect(caps.canNetworkRequest).toBe(false);
    expect(caps.canCrossTeamMessage).toBe(false);

    // Deep walk - no sensitive keys anywhere in the payload.
    assertNoSensitiveKeys(parsed);

    // Cleanup.
    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });
});
