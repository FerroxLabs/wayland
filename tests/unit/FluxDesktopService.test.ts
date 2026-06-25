/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FluxDesktopService } from '@process/flux/FluxDesktopService';
import type { FluxDesktopState } from '@process/flux/fluxDesktopTypes';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-desktop-test-'));
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as unknown as Response;
}

describe('FluxDesktopService.detect', () => {
  it('returns DAEMON_RUNNING with parsed fields and mapped tools', async () => {
    fs.writeFileSync(path.join(tmpDir, 'socket-token'), '  bearer-tok-123  \n');
    fs.writeFileSync(
      path.join(tmpDir, 'manifest.json'),
      JSON.stringify({ schema: 1, default_tier: 'balanced', tool_tier_overrides: {}, tools: {} }),
    );

    const fetchImpl = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const u = url.toString();
      if (u.endsWith('/api/version')) {
        return jsonResponse({ ipc_version: '1.0', daemon_version: '0.2.6' });
      }
      if (u.endsWith('/api/status')) {
        return jsonResponse({
          api_key_configured: true,
          upstream_base: 'https://api.fluxrouter.ai',
          listen_port: 7878,
          proxy_state: 'running',
        });
      }
      if (u.endsWith('/api/tools')) {
        expect((init?.headers as Record<string, string>)?.Authorization).toBe('Bearer bearer-tok-123');
        return jsonResponse([
          {
            id: 'claude',
            status: 'routed',
            receipt: { managed_hash: 'hash-abc', config_path: '/home/u/.claude/config' },
          },
        ]);
      }
      throw new Error(`unexpected url ${u}`);
    }) as unknown as typeof fetch;

    const svc = new FluxDesktopService({ fetchImpl, fluxDir: tmpDir });
    const state = await svc.detect();

    expect(state.kind).toBe('DAEMON_RUNNING');
    if (state.kind !== 'DAEMON_RUNNING') return;
    expect(state.daemonVersion).toBe('0.2.6');
    expect(state.upstreamBase).toBe('https://api.fluxrouter.ai');
    expect(state.apiKeyConfigured).toBe(true);
    expect(state.defaultTier).toBe('balanced');
    expect(state.tools).toHaveLength(1);
    expect(state.tools[0]).toEqual({
      id: 'claude',
      status: 'routed',
      configPath: '/home/u/.claude/config',
      managedHash: 'hash-abc',
    });
  });

  it('returns DAEMON_RUNNING with best-effort fields when sub-fetches fail', async () => {
    const fetchImpl = vi.fn(async (url: string | URL) => {
      const u = url.toString();
      if (u.endsWith('/api/version')) {
        return jsonResponse({ daemon_version: '0.2.6' });
      }
      throw new Error('network down');
    }) as unknown as typeof fetch;

    const svc = new FluxDesktopService({ fetchImpl, fluxDir: tmpDir });
    const state = await svc.detect();

    expect(state.kind).toBe('DAEMON_RUNNING');
    if (state.kind !== 'DAEMON_RUNNING') return;
    expect(state.daemonVersion).toBe('0.2.6');
    expect(state.upstreamBase).toBe('');
    expect(state.apiKeyConfigured).toBe(false);
    expect(state.tools).toEqual([]);
    expect(state.defaultTier).toBeNull();
  });

  it('returns INSTALLED_NOT_RUNNING when port probe fails but manifest exists', async () => {
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify({ default_tier: null }));
    const fetchImpl = vi.fn(async () => {
      throw new Error('connection refused');
    }) as unknown as typeof fetch;

    const svc = new FluxDesktopService({ fetchImpl, fluxDir: tmpDir });
    const state = await svc.detect();
    expect(state.kind).toBe('INSTALLED_NOT_RUNNING');
  });

  it('returns KEY_ONLY when nothing reachable but a socket-token file exists', async () => {
    fs.writeFileSync(path.join(tmpDir, 'socket-token'), 'tok');
    const fetchImpl = vi.fn(async () => {
      throw new Error('connection refused');
    }) as unknown as typeof fetch;

    const svc = new FluxDesktopService({ fetchImpl, fluxDir: tmpDir });
    const state = await svc.detect();
    expect(state.kind).toBe('KEY_ONLY');
  });

  it('returns KEY_ONLY via an injected key predicate', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('connection refused');
    }) as unknown as typeof fetch;

    const svc = new FluxDesktopService({ fetchImpl, fluxDir: tmpDir, hasFluxKey: () => true });
    const state = await svc.detect();
    expect(state.kind).toBe('KEY_ONLY');
  });

  it('returns NONE when nothing is present', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('connection refused');
    }) as unknown as typeof fetch;

    const svc = new FluxDesktopService({ fetchImpl, fluxDir: tmpDir, hasFluxKey: () => false });
    const state = await svc.detect();
    expect(state.kind).toBe('NONE');
  });

  it('never throws even if the key predicate throws', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('connection refused');
    }) as unknown as typeof fetch;

    const svc = new FluxDesktopService({
      fetchImpl,
      fluxDir: tmpDir,
      hasFluxKey: () => {
        throw new Error('boom');
      },
    });
    const state = await svc.detect();
    expect(state.kind).toBe('NONE');
  });
});

describe('FluxDesktopService.start', () => {
  it('emits on first detect and again only when state changes', async () => {
    const states: FluxDesktopState[] = [
      { kind: 'NONE' },
      { kind: 'NONE' },
      { kind: 'KEY_ONLY' },
    ];
    let call = 0;

    const svc = new FluxDesktopService({ fluxDir: tmpDir });
    vi.spyOn(svc, 'detect').mockImplementation(async () => states[Math.min(call++, states.length - 1)]);

    const emitted: FluxDesktopState[] = [];
    vi.useFakeTimers();
    const stop = svc.start((s) => emitted.push(s), 1000);

    // first immediate detect
    await vi.advanceTimersByTimeAsync(0);
    expect(emitted).toHaveLength(1);
    expect(emitted[0].kind).toBe('NONE');

    // second detect: same state -> no emit
    await vi.advanceTimersByTimeAsync(1000);
    expect(emitted).toHaveLength(1);

    // third detect: changed -> emit
    await vi.advanceTimersByTimeAsync(1000);
    expect(emitted).toHaveLength(2);
    expect(emitted[1].kind).toBe('KEY_ONLY');

    stop();
    vi.useRealTimers();
  });
});
