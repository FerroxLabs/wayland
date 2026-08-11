/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * The "Available to install" data model (T-B).
 *
 * This module carries decision D1 — a detected system copy WINS and is never
 * offered an install — as an explicit precedence rule. The rule is only worth
 * anything if it holds against every competing signal, including a session-local
 * "installing" flag, so each rung of the precedence ladder is pinned separately
 * here rather than through the one happy path.
 */

import { describe, expect, it } from 'vitest';

import type { AgentInstallerReport, ManagedAgentStatus } from '@/common/types/agentInstaller';
import {
  buildInstallableAgents,
  isInstallable,
  resolveInstallableAgentName,
  resolveInstallableState,
  type InstallActivity,
} from '@renderer/pages/settings/AgentSettings/installableAgents';

function status(overrides: Partial<ManagedAgentStatus> = {}): ManagedAgentStatus {
  return {
    agentId: 'kimi',
    npmPackage: '@moonshot-ai/kimi-code',
    pinnedVersion: '0.34.0',
    installPrefix: '/Users/x/Library/Application Support/Wayland/agents/kimi',
    state: 'absent',
    detectedOnPath: false,
    managedInstall: null,
    reason: 'prefix-missing',
    installing: false,
    ...overrides,
  };
}

const RECEIPT = { prefix: '/prefix/kimi', version: '0.33.0', installedAt: '2026-08-11T00:00:00.000Z' };

function report(agents: ManagedAgentStatus[], bundledBunAvailable = true): AgentInstallerReport {
  return { bundledBunAvailable, agents };
}

describe('resolveInstallableState — precedence', () => {
  it('lets a detected system copy win over a valid Wayland install (D1)', () => {
    const s = status({ state: 'system', detectedOnPath: true, managedInstall: RECEIPT, reason: 'ok' });
    expect(resolveInstallableState(s, true, undefined)).toBe('system');
  });

  it('lets a detected system copy win over an install this session started (D1)', () => {
    // D1 is unconditional. A session-local flag must never be able to paint an
    // "Installing…" spinner over the copy the user already relies on.
    const s = status({ state: 'system', detectedOnPath: true });
    expect(resolveInstallableState(s, true, { phase: 'installing' })).toBe('system');
    expect(resolveInstallableState(s, true, { phase: 'failed', reason: 'install-failed' })).toBe('system');
  });

  it('shows an install in flight instead of the stale absent status', () => {
    // Without this the card would read `absent` for the whole install and then
    // blink straight to `installed`.
    expect(resolveInstallableState(status(), true, { phase: 'installing' })).toBe('installing');
  });

  it('MAIN-process installing survives a re-mount that emptied the session activity map', () => {
    // The bug this closes: the only guard was React state inside the mounted
    // component. Navigate away mid-install and back and `activity` is empty, so
    // the card read `absent`, the Install button re-enabled, and clicking it
    // started a SECOND `bun install` into the same prefix.
    const s = status({ installing: true });
    expect(resolveInstallableState(s, true, undefined)).toBe('installing');
    expect(isInstallable(resolveInstallableState(s, true, undefined))).toBe(false);
  });

  it('MAIN-process installing outranks a stale session failure', () => {
    // A previous attempt having failed says nothing about the one running now.
    const s = status({ installing: true });
    expect(resolveInstallableState(s, true, { phase: 'failed', reason: 'install-failed' })).toBe('installing');
  });

  it('D1 still outranks the main-process installing flag', () => {
    const s = status({ state: 'system', detectedOnPath: true, installing: true });
    expect(resolveInstallableState(s, true, undefined)).toBe('system');
  });

  it('shows a failed install instead of falling back to absent', () => {
    const state = resolveInstallableState(status(), true, { phase: 'failed', reason: 'install-failed' });
    expect(state).toBe('failed');
  });

  it('reports a receipt-backed install as installed', () => {
    expect(resolveInstallableState(status({ state: 'installed', managedInstall: RECEIPT }), true, undefined)).toBe(
      'installed'
    );
  });

  it('keeps an already-installed agent usable on a build with no bundled runtime', () => {
    // `unavailable` describes what this build can INSTALL, not what it can run.
    // An agent already on disk keeps working, so it must not be greyed out.
    const s = status({ state: 'installed', managedInstall: RECEIPT, reason: 'ok' });
    expect(resolveInstallableState(s, false, undefined)).toBe('installed');
  });

  it('reports an absent agent as unavailable when the build ships no bundled runtime', () => {
    // Offering an Install button that is guaranteed to fail is worse than
    // saying so (win32-arm64, non-AVX2 win32-x64).
    expect(resolveInstallableState(status(), false, undefined)).toBe('unavailable');
  });

  it('reports a plain missing agent as absent', () => {
    expect(resolveInstallableState(status(), true, undefined)).toBe('absent');
  });
});

describe('isInstallable', () => {
  it('allows an install only from absent or failed', () => {
    expect(isInstallable('absent')).toBe(true);
    expect(isInstallable('failed')).toBe(true);
  });

  it('refuses an install for every state that already has a copy or cannot install', () => {
    // `system` is the one that matters: this predicate is what stops an Install
    // button rendering next to the user's own working copy, AND what refuses a
    // consent that went stale before it was confirmed.
    expect(isInstallable('system')).toBe(false);
    expect(isInstallable('installed')).toBe(false);
    expect(isInstallable('installing')).toBe(false);
    expect(isInstallable('unavailable')).toBe(false);
  });
});

describe('resolveInstallableAgentName', () => {
  it('reads the brand name from the ACP registry so the two cannot drift', () => {
    expect(resolveInstallableAgentName('codex')).toBe('Codex');
    expect(resolveInstallableAgentName('kimi')).toBe('Kimi Code');
  });

  it('falls back for a catalogued agent that is not an ACP backend', () => {
    // openclaw is installable but has no ACP_BACKENDS_ALL entry, so a registry
    // lookup alone would render the bare id.
    expect(resolveInstallableAgentName('openclaw')).toBe('OpenClaw');
  });

  it('degrades to the id rather than rendering nothing', () => {
    expect(resolveInstallableAgentName('not-an-agent')).toBe('not-an-agent');
  });
});

describe('buildInstallableAgents', () => {
  it('returns nothing when the main process reported nothing', () => {
    expect(buildInstallableAgents(undefined, {})).toEqual([]);
  });

  it('preserves catalogue order so the band does not reshuffle between reads', () => {
    const built = buildInstallableAgents(
      report([status({ agentId: 'codex' }), status({ agentId: 'kimi' }), status({ agentId: 'openclaw' })]),
      {}
    );
    expect(built.map((a) => a.agentId)).toEqual(['codex', 'kimi', 'openclaw']);
  });

  it('carries the destination the consent sheet has to name', () => {
    const built = buildInstallableAgents(report([status({ installPrefix: '/data/agents/kimi' })]), {});
    expect(built[0].installPrefix).toBe('/data/agents/kimi');
    expect(built[0].pinnedVersion).toBe('0.34.0');
    expect(built[0].npmPackage).toBe('@moonshot-ai/kimi-code');
  });

  it('still reports the Wayland receipt version on a system card', () => {
    // A machine with BOTH a system copy and a Wayland install says both: the
    // state is `system` (D1) but the version Wayland put on disk is still a fact.
    const built = buildInstallableAgents(
      report([status({ state: 'system', detectedOnPath: true, managedInstall: RECEIPT, reason: 'ok' })]),
      {}
    );
    expect(built[0].state).toBe('system');
    expect(built[0].installedVersion).toBe('0.33.0');
  });

  it('leaves the version null when Wayland has installed nothing', () => {
    expect(buildInstallableAgents(report([status()]), {})[0].installedVersion).toBeNull();
  });

  it('names the cause on a failed card and only on a failed card', () => {
    const activity: Record<string, InstallActivity | undefined> = {
      kimi: { phase: 'failed', reason: 'bundled-bun-unavailable' },
    };
    const built = buildInstallableAgents(report([status({ agentId: 'kimi' }), status({ agentId: 'codex' })]), activity);
    expect(built[0].state).toBe('failed');
    expect(built[0].failureReason).toBe('bundled-bun-unavailable');
    expect(built[1].state).toBe('absent');
    expect(built[1].failureReason).toBeNull();
  });

  it('applies the activity to the right agent only', () => {
    const built = buildInstallableAgents(report([status({ agentId: 'codex' }), status({ agentId: 'kimi' })]), {
      kimi: { phase: 'installing' },
    });
    expect(built.map((a) => a.state)).toEqual(['absent', 'installing']);
  });
});
