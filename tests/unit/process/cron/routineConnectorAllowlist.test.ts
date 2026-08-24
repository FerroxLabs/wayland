/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * B9: A SCHEDULED RUN HAD NO ROUTE TO MARKET DATA OF ANY KIND.
 *
 * Two independent walls. The shell has no network - measured, not read:
 * `wayland-core sandbox exec` on the pinned v0.13.4 answers
 * `curl: (6) Could not resolve host` for Yahoo, refuses raw-IP TCP, and refuses
 * `127.0.0.1:9222`, while the identical curl on the host returns `http=429`.
 * And `activeMcpServers: []` scopes every connector out, so the only other
 * route is closed too.
 *
 * This file is the grant that reopens exactly one door: a routine may NAME the
 * connectors it needs. Every test here also pins the thing that must NOT
 * change - the empty default - because the narrowing it relaxes is the only
 * thing standing between an unattended 07:00 run under blanket auto-approve
 * and 105 tvcontrol tools against the user's real account.
 */

import { describe, it, expect } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import {
  ROUTINE_CONNECTOR_CAP,
  isDeclarableConnectorId,
  selectRoutineConnectorIds,
} from '@process/services/cron/routineConnectors';
import { buildWCoreSessionMcpServers } from '@process/agent/acp/mcpSessionConfig';

function server(over: Partial<IMcpServer> & { id: string }): IMcpServer {
  return {
    name: over.id,
    enabled: true,
    status: 'connected',
    transport: { type: 'stdio', command: 'bun', args: [] },
    createdAt: 0,
    updatedAt: 0,
    originalJson: '{}',
    ...over,
  } as IMcpServer;
}

/**
 * A record the way the ONLY writer of one builds it (`entryToServerData`): the
 * three install-written statements - `source`, `libraryEntryId` and the
 * `originalJson` provenance stamp - all derived from the same catalog entry.
 * The grant keys on all three agreeing, so a fixture carrying only
 * `libraryEntryId` would be an impostor and would prove the opposite of what
 * these tests claim.
 */
function libraryInstall(entry: string, over: Partial<IMcpServer> & { id: string }): IMcpServer {
  return server({
    ...over,
    source: 'library',
    libraryEntryId: entry,
    originalJson: JSON.stringify({ source: 'library', entry }),
  });
}

const TV = libraryInstall('com.ferroxlabs/tvcontrol', { id: 'srv-tv', name: 'tvcontrol' });
const SLACK = libraryInstall('com.slack/slack-mcp', { id: 'srv-slack', name: 'slack' });

describe('a routine grants ONLY the connectors it names', () => {
  it('grants the declared connector', () => {
    expect(selectRoutineConnectorIds(['com.ferroxlabs/tvcontrol'], [TV, SLACK])).toEqual(['srv-tv']);
  });

  it('grants NOTHING when the routine declares nothing - the unchanged default', () => {
    expect(selectRoutineConnectorIds(undefined, [TV, SLACK])).toEqual([]);
    expect(selectRoutineConnectorIds([], [TV, SLACK])).toEqual([]);
  });

  it('never grants an undeclared connector the user happens to have installed', () => {
    // The whole point of the narrowing: Slack is enabled and connected, and an
    // ABSENT selection would hand it to the run with its full inventory.
    expect(selectRoutineConnectorIds(['com.ferroxlabs/tvcontrol'], [SLACK, TV])).toEqual(['srv-tv']);
  });

  it('does not grant a declared connector that is installed but DISABLED', () => {
    // A GENUINE install, so the refusal below can only be the DISABLED rule.
    const off = libraryInstall('com.ferroxlabs/tvcontrol', { id: 'srv-tv', name: 'tvcontrol', enabled: false });
    expect(selectRoutineConnectorIds(['com.ferroxlabs/tvcontrol'], [off])).toEqual([]);
  });

  it('does not grant a declared connector that is not installed at all', () => {
    expect(selectRoutineConnectorIds(['com.ferroxlabs/tvcontrol'], [SLACK])).toEqual([]);
  });

  it('keys the grant on the CATALOG identity, so a same-named custom server cannot capture it', () => {
    // B17: an external MCP definition mirrored in from another tool's settings
    // (`~/.gemini/settings.json`) registered under the name `tvcontrol` and won.
    // A name is user-editable; `libraryEntryId` is written at install from the
    // catalog entry and is not. The grant must follow the identity, not the label.
    // Named EXACTLY what the routine declares, which a user is free to do, and
    // carrying no catalog identity at all.
    const impostor = server({ id: 'srv-impostor', name: 'com.ferroxlabs/tvcontrol', libraryEntryId: undefined });
    expect(selectRoutineConnectorIds(['com.ferroxlabs/tvcontrol'], [impostor])).toEqual([]);
    // ...and the real one is still granted when both are present.
    expect(selectRoutineConnectorIds(['com.ferroxlabs/tvcontrol'], [impostor, TV])).toEqual(['srv-tv']);
  });

  it('never grants a builtin, which bypasses session scoping anyway', () => {
    // A GENUINE install too, so the refusal can only be the BUILTIN rule.
    const builtin = libraryInstall('com.ferroxlabs/tvcontrol', { id: 'builtin-image-gen', builtin: true });
    expect(selectRoutineConnectorIds(['com.ferroxlabs/tvcontrol'], [builtin])).toEqual([]);
  });

  it('drops a malformed declaration instead of matching on it', () => {
    const newline = String.fromCharCode(120, 10, 121);
    for (const bad of [null, 42, '', 'a b', newline, '../../etc/passwd ', 'z'.repeat(129)]) {
      expect(isDeclarableConnectorId(bad)).toBe(false);
    }
    expect(isDeclarableConnectorId('com.ferroxlabs/tvcontrol')).toBe(true);
    const weird = server({ id: 'srv-weird', libraryEntryId: '' });
    expect(selectRoutineConnectorIds([null, 42, ''], [weird, TV])).toEqual([]);
  });

  it('caps how many connectors one routine may name', () => {
    const names = Array.from({ length: ROUTINE_CONNECTOR_CAP + 1 }, (_, i) => `vendor/c${i}`);
    const servers = names.map((n, i) => libraryInstall(n, { id: `srv-${i}` }));
    const granted = selectRoutineConnectorIds(names, servers);
    expect(granted).toHaveLength(ROUTINE_CONNECTOR_CAP);
    expect(granted).not.toContain(`srv-${ROUTINE_CONNECTOR_CAP}`);
  });

  it('the granted id is the one the REAL wcore launch selector accepts', () => {
    // The ids this function returns are only worth anything if
    // `isServerActiveForSession` matches on them. Drive the real selector.
    const granted = selectRoutineConnectorIds(['com.ferroxlabs/tvcontrol'], [TV, SLACK]);
    expect(buildWCoreSessionMcpServers([TV, SLACK], granted).map((s) => s.name)).toEqual(['tvcontrol']);
    // KNOWN-POSITIVE CONTROL: with NO selection the same selector hands over
    // BOTH - the posture this grant must never regress to.
    expect(buildWCoreSessionMcpServers([TV, SLACK], undefined).map((s) => s.name)).toEqual(['tvcontrol', 'slack']);
    // ...and with the empty default it hands over neither.
    expect(buildWCoreSessionMcpServers([TV, SLACK], []).map((s) => s.name)).toEqual([]);
  });
});
