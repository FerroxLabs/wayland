/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The one guard the rest of the boundary-axis suite cannot supply.
 *
 * Everything about the live revoke - which sessions match, what counts as
 * revoked, what the provider reports - can be green against a registry that is
 * always EMPTY. If `WCoreAgent` stops publishing itself, no removal ever
 * reaches a running engine again, every other test in this milestone still
 * passes, and the only symptom is a folder that stays readable. So the publish
 * is pinned here through the REAL agent constructor, and the withdrawal through
 * the real `kill()`.
 */

import { describe, expect, it, afterEach, vi } from 'vitest';
import { WCoreAgent, type WCoreAgentOptions } from '@process/agent/wcore';
import { clearLivePathGrantSessionsForTest, listLivePathGrantSessions } from '@process/agent/wcore/pathGrantSessions';

const WORKSPACE = '/tmp/wcore-folder-grant-publish';

/**
 * The same minimal construction `pathGrantSeam.test.ts` uses: the constructor
 * spawns nothing, so a real agent is cheap and there is no reason to test a
 * stand-in for it.
 */
function makeAgent(workspace = WORKSPACE): WCoreAgent {
  return new WCoreAgent({
    workspace,
    model: {} as never,
    onStreamEvent: () => undefined,
  } as unknown as WCoreAgentOptions);
}

afterEach(() => {
  clearLivePathGrantSessionsForTest();
  vi.restoreAllMocks();
});

describe('a wcore session publishes itself for revoke', () => {
  it('is reachable from the registry as soon as it is constructed', () => {
    // Before: the assertion below would pass on a leaked registration.
    expect(listLivePathGrantSessions().some((s) => s.workspace === WORKSPACE)).toBe(false);

    makeAgent();

    const published = listLivePathGrantSessions().filter((s) => s.workspace === WORKSPACE);
    expect(published).toHaveLength(1);
    expect(published[0].revokePath).toBeTypeOf('function');
  });

  it('publishes the workspace it was actually spawned in', () => {
    makeAgent('/tmp/wcore-alpha');
    makeAgent('/tmp/wcore-beta');
    expect(
      listLivePathGrantSessions()
        .map((s) => s.workspace)
        .sort()
    ).toEqual(['/tmp/wcore-alpha', '/tmp/wcore-beta']);
  });

  it('the published revokePath drives the agent it came from', async () => {
    const agent = makeAgent();
    const spy = vi.spyOn(agent, 'revokePath').mockResolvedValue(null);

    const published = listLivePathGrantSessions().find((s) => s.workspace === WORKSPACE)!;
    await published.revokePath('grant-42');

    // Pins the BINDING, not just that a function is there: a registration
    // wired to some other agent, or to a no-op, would leave a real session
    // holding the grant.
    expect(spy).toHaveBeenCalledWith('grant-42');
  });

  it('withdraws itself when the agent is killed', async () => {
    const agent = makeAgent();
    expect(listLivePathGrantSessions().some((s) => s.workspace === WORKSPACE)).toBe(true);

    await agent.kill();

    // A dead session that stayed published would make every later removal
    // report a failed revoke against an engine that is not there.
    expect(listLivePathGrantSessions().some((s) => s.workspace === WORKSPACE)).toBe(false);
  });
});
