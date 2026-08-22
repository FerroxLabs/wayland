/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * IS PER-TOOL SCOPING REACHABLE ON THE ROUTINE'S BACKEND?  NO. THIS IS THE PROOF.
 *
 * A per-routine connector grant hands an unattended run a WHOLE connector. The
 * obvious mitigation - grant `quote_batch` and `watchlist_get` but never
 * `watchlist_remove_bulk` or `alert_delete` - is not available on the path a
 * routine actually runs on, and this file establishes that by driving the two
 * production serializers over the SAME server rather than by reading either.
 *
 * Seeded routines run on `wcore` (`BuiltinRoutinesSeeder.ROUTINE_BACKEND`), and
 * the wcore launch serializer has nowhere to put a tool list. Codex is the
 * KNOWN POSITIVE: the same field on the same server does reach ITS engine, as
 * `enabled_tools`. Without that half, "no tool key" would be indistinguishable
 * from a test that looks at nothing.
 *
 * Corroborated outside the repo, by executing the pinned engine
 * (sha256 5c23739348d5..., `wayland-core 0.13.4`):
 *
 *   strings -a <engine> | grep -c enabled_tools   -> 0
 *   strings -a <engine> | grep -c include_tools   -> 0
 *   strings -a <engine> | grep -c allowed_tools   -> 20, ALL of them the
 *       sub-agent persona field (`allowed_tools = ["Read", "Grep", ...]` in the
 *       bundled AgentPack), never an `[mcp.servers.*]` key
 *
 * and its MCP tool curation is `McpCurationPolicy = off | top_k`, a RANKING,
 * not an allowlist. `WCoreManager` then answers every `approval_required` in a
 * `yoloMode` session with `true`, so there is no host-side gate either.
 *
 * IF THIS FILE EVER GOES RED because the wcore serializer started emitting a
 * tool key, that is good news and `routineConnectors.ts` should be revisited to
 * narrow the grant.
 */

import { describe, it, expect } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import { toWCoreConfig } from '@process/services/mcpServices/agents/WCoreMcpAgent';
import { buildCodexMcpServerTable } from '@process/task/codexConfig';
import { buildWCoreUserStdioMcpServers, buildAcpSessionMcpServers } from '@process/agent/acp/mcpSessionConfig';
import { ROUTINE_BACKEND } from '@process/services/cron/BuiltinRoutinesSeeder';

/** One server, two read-only tools allowed out of an inventory of many. */
const TV: IMcpServer = {
  id: 'srv-tv',
  name: 'tvcontrol',
  enabled: true,
  status: 'connected',
  libraryEntryId: 'com.ferroxlabs/tvcontrol',
  transport: { type: 'stdio', command: 'bun', args: ['x', '--bun', '@ferroxlabs/tvcontrol@2.3.1'] },
  allowedTools: ['quote_batch', 'watchlist_get'],
  createdAt: 0,
  updatedAt: 0,
  originalJson: '{}',
} as IMcpServer;

describe('per-tool scoping is not reachable on the backend routines run on', () => {
  it('runs routines on wcore, which is the backend under test', () => {
    // If a routine ever moves to codex or gemini, the mitigation above becomes
    // available and this whole file is describing the wrong engine.
    expect(ROUTINE_BACKEND).toBe('wcore');
  });

  it('KNOWN POSITIVE: the codex serializer DOES carry the tool allowlist', () => {
    const table = buildCodexMcpServerTable([TV]);
    const entry = Object.values(table)[0];
    expect(entry.enabled_tools).toEqual(['quote_batch', 'watchlist_get']);
  });

  it('the wcore config.toml serializer emits NO tool key at all', () => {
    const config = toWCoreConfig(TV, { launchLocal: true }) as Record<string, unknown>;
    // Everything it does carry:
    expect(config.transport).toBe('stdio');
    expect(typeof config.command).toBe('string');
    // ...and nothing that narrows the inventory, under any spelling.
    const keys = Object.keys(config);
    expect(keys.filter((k) => /tool/i.test(k))).toEqual([]);
    expect(JSON.stringify(config)).not.toContain('quote_batch');
  });

  it('neither wcore session injector carries it either', () => {
    const [wcore] = buildWCoreUserStdioMcpServers([TV], ['srv-tv']);
    expect(JSON.stringify(wcore)).not.toContain('quote_batch');
    expect(Object.keys(wcore).filter((k) => /tool/i.test(k))).toEqual([]);

    const [acp] = buildAcpSessionMcpServers([TV], { stdio: true, http: true, sse: true }, ['srv-tv']);
    expect(JSON.stringify(acp)).not.toContain('quote_batch');
    expect(Object.keys(acp).filter((k) => /tool/i.test(k))).toEqual([]);
  });
});
