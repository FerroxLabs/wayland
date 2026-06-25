/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  resolveBridgePackage,
  resolveLatestBridgeVersion,
  splitPackage,
} from '@process/agent/acp/bridgeVersionResolver';

describe('splitPackage', () => {
  it('splits a scoped name@version without treating the scope @ as a separator', () => {
    expect(splitPackage('@agentclientprotocol/claude-agent-acp@0.44.0')).toEqual({
      name: '@agentclientprotocol/claude-agent-acp',
      version: '0.44.0',
    });
  });

  it('splits an unscoped name@version', () => {
    expect(splitPackage('codex-acp@0.9.5')).toEqual({ name: 'codex-acp', version: '0.9.5' });
  });

  it('handles a scoped name with no version', () => {
    expect(splitPackage('@scope/name')).toEqual({ name: '@scope/name', version: '' });
  });
});

describe('resolveLatestBridgeVersion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.AGENTCLIENTPROTOCOL_CLAUDE_AGENT_ACP_VERSION;
  });

  it('returns the registry latest on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ version: '9.9.9' }) }))
    );
    const v = await resolveLatestBridgeVersion('@some/uncached-pkg-a', '1.0.0');
    expect(v).toBe('9.9.9');
  });

  it('falls back when the registry call fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );
    const v = await resolveLatestBridgeVersion('@some/uncached-pkg-b', '1.2.3');
    expect(v).toBe('1.2.3');
  });

  it('falls back on a non-ok registry response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) }))
    );
    const v = await resolveLatestBridgeVersion('@some/uncached-pkg-c', '2.0.0');
    expect(v).toBe('2.0.0');
  });

  it('an env override wins over discovery', async () => {
    process.env.AGENTCLIENTPROTOCOL_CLAUDE_AGENT_ACP_VERSION = '0.40.0';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ version: '0.44.0' }) }))
    );
    const v = await resolveLatestBridgeVersion('@agentclientprotocol/claude-agent-acp', '0.33.1');
    expect(v).toBe('0.40.0');
  });
});

describe('resolveBridgePackage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rebuilds <name>@<resolved> from a pinned fallback string', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ version: '5.5.5' }) }))
    );
    const pkg = await resolveBridgePackage('@scope/uncached-pkg-d@1.0.0');
    expect(pkg).toBe('@scope/uncached-pkg-d@5.5.5');
  });
});
