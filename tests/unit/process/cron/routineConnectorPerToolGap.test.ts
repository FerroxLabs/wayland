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
 *
 * IT WENT RED, AND THIS IS THAT GOOD NEWS (#998). The wire is still exactly as
 * described above - no engine grew a tool key, and the strings evidence still
 * holds. What changed is that Desktop stopped asking the engine to respect the
 * subset and started enforcing it itself: a connector with an explicit tool
 * selection is now handed to the engine as a descriptor pointing at Wayland's
 * filtering shim, which holds the real server and re-exports only the allowed
 * tools. So the tool names DO now appear in the session descriptors - as the
 * shim's own arguments, not as an engine field.
 *
 * THE MITIGATION IS THEREFORE AVAILABLE, AND `routineConnectors.ts` STILL HANDS
 * AN UNATTENDED RUN A WHOLE CONNECTOR. Narrowing that grant is a deliberate
 * change to what routines may do and is NOT made here; this file now proves
 * only that the mechanism exists to make it.
 *
 * IT WENT RED A SECOND TIME (#1167), AND THAT IS ALSO GOOD NEWS. Desktop now
 * carries `allowedTools` verbatim across all three engine boundaries - both ACP
 * session descriptors, the wcore `add_mcp_server` runtime path, and the startup
 * `config.toml` table - so an engine that understands the field can enforce the
 * subset natively. The strings evidence above still describes the PINNED engine;
 * Core's half is being implemented in parallel and is a no-op while absent.
 *
 * WHAT IS STILL TRUE, asserted below so it cannot be mistaken for coverage:
 * `toWCoreConfig` is still NOT shim-wrapped - that path rewrites the command for
 * restart-safety and interposing there risks persisting a stale runtime path. So
 * on the startup path the subset is a REQUEST the engine must honour, not a
 * boundary Desktop enforces, and it is only as good as Core's half. The two
 * session paths remain self-enforcing via the shim regardless.
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

  it('the wcore config.toml serializer NOW carries the tool allowlist (#1167)', () => {
    const config = toWCoreConfig(TV, { launchLocal: true }) as Record<string, unknown>;
    // Everything it already carried:
    expect(config.transport).toBe('stdio');
    expect(typeof config.command).toBe('string');
    // ...plus the subset, verbatim and untransformed. This used to assert the
    // absence; closing the gap is what turned it red, exactly as intended.
    expect(config.allowedTools).toEqual(['quote_batch', 'watchlist_get']);
    // Under exactly ONE spelling, so a second key never quietly appears.
    expect(Object.keys(config).filter((k) => /tool/i.test(k))).toEqual(['allowedTools']);
  });

  it('both wcore and ACP session injectors now carry the subset, via the shim', () => {
    const [wcore] = buildWCoreUserStdioMcpServers([TV], ['srv-tv']);
    expect(JSON.stringify(wcore)).toContain('quote_batch');
    // Mechanism 1, unchanged: the descriptor points at the shim, so the subset is
    // a boundary the engine cannot cross rather than state it is asked to respect.
    expect(JSON.stringify(wcore)).toContain('builtin-mcp-tool-filter');
    // Mechanism 2, new (#1167): the field itself, for an engine that can use it.
    expect(wcore.allowedTools).toEqual(['quote_batch', 'watchlist_get']);
    // The tool the user did NOT allow is absent from the descriptor entirely.
    expect(JSON.stringify(wcore)).not.toContain('alert_delete');

    const [acp] = buildAcpSessionMcpServers([TV], { stdio: true, http: true, sse: true }, ['srv-tv']);
    expect(JSON.stringify(acp)).toContain('quote_batch');
    expect(JSON.stringify(acp)).toContain('builtin-mcp-tool-filter');
    expect(acp.allowedTools).toEqual(['quote_batch', 'watchlist_get']);
    expect(JSON.stringify(acp)).not.toContain('alert_delete');
  });

  it('the startup config.toml serializer is STILL unwrapped - what remains', () => {
    // The subset now REACHES this path as a field, but Desktop does not enforce
    // it here: no shim is interposed, because this path rewrites the command for
    // restart-safety and wrapping it risks persisting a stale runtime path. So
    // startup enforcement depends entirely on Core honouring `allowedTools`.
    // Recorded as an assertion so wrapping it later turns this red on purpose.
    const config = toWCoreConfig(TV);
    expect(JSON.stringify(config)).not.toContain('builtin-mcp-tool-filter');
    expect(config.allowedTools).toEqual(['quote_batch', 'watchlist_get']);
  });

  it('THE EMPTY ALLOWLIST reaches config.toml as [], never as a missing key', () => {
    // The polarity trap (#1167): `[]` means the user disabled every tool. A
    // truthiness or omitempty guard here would drop the key, and an absent key
    // means "all tools" - maximum permission at the moment of maximum
    // restriction. Unlike the two session paths, nothing filters this one on
    // `contributesTools`, so `[]` genuinely travels.
    const config = toWCoreConfig({ ...TV, allowedTools: [] } as IMcpServer);
    expect('allowedTools' in config).toBe(true);
    expect(config.allowedTools).toEqual([]);
  });
});
