/**
 * E2E (C4): Leader backend swap via per-agent backend pill.
 *
 * Flow per E2E-TEST-PLAN §C4 (depends on live-smoke fix #4b in HEAD):
 *   1. Create a leader team and navigate to /team/<id>.
 *   2. The per-agent backend pill ([data-testid="agent-backend-pill-<slotId>"])
 *      renders only when the host has ≥2 detected backends (the helper resolves
 *      detected ∪ wayland-core; with 0 CLIs installed it returns just 1).
 *      When the pill is absent we fixme with an honest reason instead of
 *      asserting a missing element.
 *   3. Open the pill dropdown → pick a different backend option.
 *   4. The change-agent-backend IPC fires; `team.get` confirms the agent
 *      backed by the chosen agentType.
 *   5. Activity tab logs a `decision` event (the swap path appends one).
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const TEAM_NAME_PREFIX = 'E2E BackendSwap C4';
const SLOT = 'slot-lead';

test.describe('Leader backend swap - C4', () => {
  test('per-agent pill swaps agent backend in place', async ({ page }) => {
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

    // Start as `claude` so the swap target stays in the same conversationType
    // family - TeamSessionService.changeAgentBackend rejects cross-type swaps
    // (claude/acp → gemini/gemini etc.) to avoid silently dropping chat
    // history. claude ↔ codex are both 'acp', so the swap is allowed.
    const teamName = `${TEAM_NAME_PREFIX} ${Date.now()}`;
    const created = await invokeBridge<{ id: string } | null>(page, 'team.create', {
      userId: 'system_default_user',
      name: teamName,
      workspace: '',
      workspaceMode: 'shared',
      agents: [
        {
          slotId: SLOT,
          conversationId: '',
          role: 'leader',
          agentType: 'claude',
          agentName: 'Leader',
          conversationType: 'acp',
          status: 'idle',
        },
      ],
    });
    if (!created?.id) throw new Error('team.create returned null - backend missing');
    const teamId = created.id;

    await navigateTo(page, `#/team/${teamId}`);
    await page.waitForURL(new RegExp(`/team/${teamId}`), { timeout: 15_000 });

    // The pill only renders when ≥2 backends are installed. Without it the
    // swap UI is intentionally unreachable - skip with an honest reason.
    const pill = page.locator(`[data-testid="agent-backend-pill-${SLOT}"]`);
    const pillVisible = await pill.isVisible().catch(() => false);
    test.fixme(
      !pillVisible,
      'AgentBackendPill is hidden - host has fewer than 2 installed CLIs. C4 swap UI is unreachable in this env.'
    );

    // Open the pill and pick the codex option (same conversationType as claude).
    await pill.click();
    const chosenBackend = 'codex';
    const codexOption = page.locator(`[data-testid="agent-backend-pill-${SLOT}-option-${chosenBackend}"]`);
    await expect(codexOption).toBeVisible({ timeout: 5_000 });
    await codexOption.click();

    // Backend agrees the swap happened.
    await expect
      .poll(
        async () => {
          const t = await invokeBridge<{ agents: Array<{ slotId: string; agentType: string }> } | null>(
            page,
            'team.get',
            { id: teamId }
          );
          return t?.agents.find((a) => a.slotId === SLOT)?.agentType;
        },
        { timeout: 20_000 }
      )
      .toBe(chosenBackend);

    // Activity tab: a decision event arrives. The exact `outcome` payload key
    // is implementation-detail; we assert the event type fires (the strict
    // outcome:'backend_changed' assertion is deferred to a unit test on
    // TeamSessionService - see v0.6.1 followups).
    await page.locator('[data-testid="team-activity-tab-button"]').click();
    const activity = page.locator('[data-testid="team-activity-tab"]');
    await expect(activity).toBeVisible({ timeout: 5_000 });
    await expect(
      activity.locator('[data-testid="team-activity-event"][data-event-type="decision"]').first()
    ).toBeVisible({ timeout: 15_000 });

    // Cleanup.
    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });
});
