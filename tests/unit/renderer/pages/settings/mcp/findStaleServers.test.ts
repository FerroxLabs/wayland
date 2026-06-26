/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { findStaleServers } from '@renderer/pages/settings/McpLibrary/hooks/useConnectedMcps';

// Mirror canonicalMcpServerName's slash/dot -> dash rewrite closely enough to
// exercise the canonical-compare path without importing process-side deps.
const canon = (n: string) => n.replace(/[\\/.\s]+/g, '-').toLowerCase();

describe('findStaleServers', () => {
  it('flags a server present in an agent but absent from the config', () => {
    const configured = new Set(['github']);
    const agentConfigs = [{ source: 'claude', servers: [{ name: 'github' }, { name: 'old-server' }] }];
    const stale = findStaleServers(configured, agentConfigs, canon);
    expect(stale).toEqual([{ name: 'old-server', agents: ['claude'] }]);
  });

  it('does NOT flag a configured server even when the agent rewrote its name', () => {
    // config holds "Google Workspace"; the agent stored it canonically rewritten.
    const configured = new Set([canon('Google Workspace')]);
    const agentConfigs = [{ source: 'codex', servers: [{ name: 'google-workspace' }] }];
    expect(findStaleServers(configured, agentConfigs, canon)).toEqual([]);
  });

  it('groups the agents that still carry the same leftover', () => {
    const configured = new Set<string>();
    const agentConfigs = [
      { source: 'claude', servers: [{ name: 'leftover' }] },
      { source: 'codex', servers: [{ name: 'leftover' }] },
    ];
    const stale = findStaleServers(configured, agentConfigs, canon);
    expect(stale).toHaveLength(1);
    expect(stale[0].name).toBe('leftover');
    expect(stale[0].agents.toSorted()).toEqual(['claude', 'codex']);
  });

  it('returns nothing when every installed server is still configured', () => {
    const configured = new Set(['a', 'b']);
    const agentConfigs = [{ source: 'gemini', servers: [{ name: 'a' }, { name: 'b' }] }];
    expect(findStaleServers(configured, agentConfigs, canon)).toEqual([]);
  });
});
