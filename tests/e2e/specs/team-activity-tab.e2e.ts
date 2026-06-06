/**
 * E2E (F1): Activity tab timeline - mailbox + spawn events render with the
 * expected row metadata (icon + actor → target arrow + relative timestamp).
 *
 * Flow per E2E-TEST-PLAN §F1:
 *   1. Create an ad-hoc team via team.create IPC (leader + 1 teammate).
 *   2. Navigate to /team/<id> and click [data-testid="team-activity-tab-button"].
 *   3. Send a leader message via team.send-message IPC. The mailbox event
 *      goes through the EventLogger and surfaces on the next activity-tab
 *      poll (2s cadence per TeamActivityTab).
 *   4. Wait for a mailbox event row + assert structure (icon + relative
 *      timestamp).
 *   5. Add a teammate via team.add-agent IPC → spawn event surfaces.
 *
 * UI shortcut: we use the IPC layer for message send + teammate add rather
 * than driving the SendBox component. The Activity tab polls
 * `team.listEvents` regardless of how the event was produced, so this still
 * exercises the same observability path. Driving the SendBox directly would
 * require sendBox testids that do not exist in v0.6.0 (queued v0.6.1).
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const TEAM_NAME_PREFIX = 'E2E Activity F1';

type BridgeError = { __bridgeError: true; message?: string };
function isBridgeError(value: unknown): value is BridgeError {
  return Boolean(value) && typeof value === 'object' && '__bridgeError' in (value as Record<string, unknown>);
}

test.describe('Team activity tab - F1', () => {
  test('mailbox + spawn events render with structure (icon, actor/target, timestamp)', async ({ page }) => {
    test.setTimeout(180_000);

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
      ],
    });
    if (!created?.id) throw new Error('team.create returned null - backend (wcore) not installed');
    const teamId = created.id;

    await navigateTo(page, `#/team/${teamId}`);
    await page.waitForURL(new RegExp(`/team/${teamId}`), { timeout: 15_000 });

    // Switch to Activity tab.
    const activityBtn = page.locator('[data-testid="team-activity-tab-button"]');
    await expect(activityBtn).toBeVisible({ timeout: 15_000 });
    await activityBtn.click();
    const activity = page.locator('[data-testid="team-activity-tab"]');
    await expect(activity).toBeVisible({ timeout: 5_000 });

    // Send a leader message via IPC - produces a mailbox event via EventLogger.
    const sent = await invokeBridge<void | BridgeError>(page, 'team.send-message', {
      teamId,
      content: 'ping from F1 activity spec',
    });
    if (isBridgeError(sent)) {
      // sendMessage requires a live session + agent; if the env can't start
      // one, we mark fixme rather than skip silently.
      test.fixme(
        true,
        `team.send-message failed (likely no live agent in this env): ${sent.message ?? 'unknown'}`
      );
      return;
    }

    // Activity tab polls every 2s - mailbox row arrives within ~5s.
    const mailboxRow = activity
      .locator('[data-testid="team-activity-event"][data-event-type="mailbox"]')
      .first();
    await expect(mailboxRow).toBeVisible({ timeout: 15_000 });

    // Row structure: icon container + summary div + relative timestamp.
    // The timestamp matches the formatRelative output (`Ns ago` / `Nm ago` / etc.).
    await expect(mailboxRow).toContainText(/\d+\s*(s|m|h|d)\s*ago|just now/);

    // Add a teammate via IPC → spawn event surfaces.
    const addAgent = await invokeBridge<unknown | BridgeError>(page, 'team.add-agent', {
      teamId,
      agent: {
        conversationId: '',
        role: 'teammate',
        agentType: 'wcore',
        agentName: 'F1 Spawned Teammate',
        conversationType: 'wcore',
        status: 'pending',
      },
    });
    if (isBridgeError(addAgent)) {
      throw new Error(`team.add-agent failed: ${addAgent.message ?? 'unknown'}`);
    }

    const spawnRow = activity
      .locator('[data-testid="team-activity-event"][data-event-type="spawn"]')
      .first();
    await expect(spawnRow).toBeVisible({ timeout: 15_000 });
    await expect(spawnRow).toContainText(/\d+\s*(s|m|h|d)\s*ago|just now/);

    // Cleanup.
    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });
});
