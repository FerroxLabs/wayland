/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #756 — Windows connector regressions (Hermes stall / OpenClaw connect failure).
 * These cover the pure decision logic of the three fixes; the Windows-only spawn
 * behaviour itself is verified on a packaged Windows rig.
 */
import { describe, expect, it } from 'vitest';
import { backendSpawnEnvHardening } from '../../src/process/agent/acp/acpConnectors';
import { openClawCommandCandidates } from '../../src/process/agent/openclaw/OpenClawGatewayManager';
import { normalizeGatewayHost } from '../../src/process/agent/openclaw/index';

describe('#756 backendSpawnEnvHardening', () => {
  it('hardens Hermes: auto-accept hooks + unbuffered stdout (else the spawn stalls)', () => {
    expect(backendSpawnEnvHardening('hermes')).toEqual({
      HERMES_ACCEPT_HOOKS: '1',
      PYTHONUNBUFFERED: '1',
    });
  });

  it('hardens Kimi (also a Python CLI) with unbuffered stdout, but no Hermes-only hook flag', () => {
    expect(backendSpawnEnvHardening('kimi')).toEqual({ PYTHONUNBUFFERED: '1' });
  });

  it('adds nothing for non-Python backends', () => {
    expect(backendSpawnEnvHardening('claude')).toEqual({});
    expect(backendSpawnEnvHardening('codex')).toEqual({});
    expect(backendSpawnEnvHardening('')).toEqual({});
  });
});

describe('#756 normalizeGatewayHost', () => {
  it('pins localhost to IPv4 so the probe and the WS connection cannot diverge', () => {
    // The whole bug: probe used 127.0.0.1 but the WS used raw 'localhost' → ::1 on Windows.
    expect(normalizeGatewayHost('localhost')).toBe('127.0.0.1');
  });

  it('leaves an explicit host untouched', () => {
    expect(normalizeGatewayHost('127.0.0.1')).toBe('127.0.0.1');
    expect(normalizeGatewayHost('192.168.1.10')).toBe('192.168.1.10');
    expect(normalizeGatewayHost('gateway.internal')).toBe('gateway.internal');
  });
});

describe('#756 openClawCommandCandidates', () => {
  it('POSIX: probes the bare command name in each PATH dir', () => {
    expect(openClawCommandCandidates('openclaw', '/usr/bin:/usr/local/bin', 'linux')).toEqual([
      '/usr/bin/openclaw',
      '/usr/local/bin/openclaw',
    ]);
  });

  it('Windows: probes PATHEXT executable extensions and NEVER the extensionless POSIX shim', () => {
    const out = openClawCommandCandidates('openclaw', 'C:\\bin', 'win32', '.EXE;.CMD');
    expect(out).toEqual(['C:\\bin\\openclaw.EXE', 'C:\\bin\\openclaw.CMD']);
    // The bare `openclaw` (npm's #!/bin/sh shim, unrunnable by cmd.exe) must not appear.
    expect(out).not.toContain('C:\\bin\\openclaw');
  });

  it('Windows: falls back to a sane default extension set when PATHEXT is unset', () => {
    const out = openClawCommandCandidates('openclaw', 'C:\\bin', 'win32', undefined);
    expect(out.some((c) => c.endsWith('.CMD'))).toBe(true);
    expect(out).not.toContain('C:\\bin\\openclaw');
  });

  it('Windows: an already-extensioned command is probed as-is (no openclaw.cmd.EXE)', () => {
    const out = openClawCommandCandidates('openclaw.cmd', 'C:\\bin', 'win32', '.EXE;.CMD');
    expect(out).toEqual(['C:\\bin\\openclaw.cmd']);
  });

  it('skips empty PATH segments', () => {
    expect(openClawCommandCandidates('openclaw', '/usr/bin::', 'linux')).toEqual(['/usr/bin/openclaw']);
  });
});
