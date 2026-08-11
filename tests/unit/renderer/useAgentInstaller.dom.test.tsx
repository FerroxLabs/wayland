/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * `useAgentInstaller` — the consent gate (T-B, decision D2).
 *
 * The band's DOM suite proves the sheet appears before an install. This suite
 * proves the stronger thing: there is NO WAY AROUND IT. A reviewer trying to
 * install without passing through the sheet has exactly one entry point —
 * `confirmInstall()`, which takes no arguments — and it refuses when no consent
 * is pending. Decision D1 is enforced on the same path: `requestInstall` will
 * not mint consent for an agent that already has a copy, and `confirmInstall`
 * re-checks the LIVE list, so a consent that goes stale while the sheet is open
 * dies instead of installing over the user's own working setup.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockInstall = vi.fn();
const mockCancel = vi.fn();
const mockUninstall = vi.fn();

vi.mock('../../../src/common', () => ({
  ipcBridge: {
    agentInstaller: {
      install: { invoke: (...a: unknown[]) => mockInstall(...a) },
      cancel: { invoke: (...a: unknown[]) => mockCancel(...a) },
      uninstall: { invoke: (...a: unknown[]) => mockUninstall(...a) },
    },
  },
}));

import type {
  InstallableAgent,
  InstallableAgentState,
} from '../../../src/renderer/pages/settings/AgentSettings/installableAgents';
import { useAgentInstaller } from '../../../src/renderer/pages/settings/AgentSettings/useAgentInstaller';

const PREFIX = '/data/agents/kimi';

function agent(state: InstallableAgentState, agentId = 'kimi'): InstallableAgent {
  return {
    agentId,
    name: 'Kimi Code',
    npmPackage: '@moonshot-ai/kimi-code',
    pinnedVersion: '0.34.0',
    installPrefix: PREFIX,
    state,
    installedVersion: null,
    failureReason: null,
  };
}

const revalidate = vi.fn(async () => undefined);

beforeEach(() => {
  vi.clearAllMocks();
  mockInstall.mockResolvedValue({ ok: true, status: {} });
  mockCancel.mockResolvedValue({ ok: true, cancelled: true, status: {} });
  mockUninstall.mockResolvedValue({ ok: true, removed: true, status: {} });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAgentInstaller — consent gates execution', () => {
  it('installs NOTHING when confirm is reached without a pending consent', async () => {
    // This is the exact bypass a reviewer will try: skip the sheet, call the
    // only exported execution function directly.
    const { result } = renderHook(() => useAgentInstaller([agent('absent')], revalidate));

    await act(async () => {
      await result.current.confirmInstall();
    });

    expect(mockInstall).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
  });

  it('requesting consent does not install', async () => {
    const { result } = renderHook(() => useAgentInstaller([agent('absent')], revalidate));

    act(() => result.current.requestInstall(agent('absent')));

    await waitFor(() => expect(result.current.pendingConsent).not.toBeNull());
    expect(mockInstall).not.toHaveBeenCalled();
  });

  it('carries the four facts D2 requires into the pending consent', async () => {
    const { result } = renderHook(() => useAgentInstaller([agent('absent')], revalidate));
    act(() => result.current.requestInstall(agent('absent')));

    await waitFor(() => expect(result.current.pendingConsent).not.toBeNull());
    expect(result.current.pendingConsent).toEqual({
      agentId: 'kimi',
      name: 'Kimi Code',
      npmPackage: '@moonshot-ai/kimi-code',
      version: '0.34.0',
      destination: PREFIX,
    });
  });

  it('dismissing drops the consent, so a later confirm installs nothing', async () => {
    const { result } = renderHook(() => useAgentInstaller([agent('absent')], revalidate));
    act(() => result.current.requestInstall(agent('absent')));
    await waitFor(() => expect(result.current.pendingConsent).not.toBeNull());

    act(() => result.current.dismissConsent());
    await waitFor(() => expect(result.current.pendingConsent).toBeNull());

    await act(async () => {
      await result.current.confirmInstall();
    });
    expect(mockInstall).not.toHaveBeenCalled();
  });

  it('dismissConsent is NOT a cancel: it never touches the cancel channel', async () => {
    // The two used to share the name `cancelInstall`, which is how a control
    // that only closes a sheet reads as one that stops a running install.
    const { result } = renderHook(() => useAgentInstaller([agent('absent')], revalidate));
    act(() => result.current.requestInstall(agent('absent')));
    await waitFor(() => expect(result.current.pendingConsent).not.toBeNull());

    act(() => result.current.dismissConsent());

    expect(mockCancel).not.toHaveBeenCalled();
  });

  it('confirming a pending consent installs exactly that agent, once', async () => {
    const { result } = renderHook(() => useAgentInstaller([agent('absent')], revalidate));
    act(() => result.current.requestInstall(agent('absent')));
    await waitFor(() => expect(result.current.pendingConsent).not.toBeNull());

    await act(async () => {
      await result.current.confirmInstall();
    });

    expect(mockInstall).toHaveBeenCalledTimes(1);
    expect(mockInstall).toHaveBeenCalledWith({ agentId: 'kimi' });
    expect(revalidate).toHaveBeenCalledTimes(1);
  });
});

describe('useAgentInstaller — D1 refusals', () => {
  it('refuses to mint consent for an agent the user already has (system)', async () => {
    const { result } = renderHook(() => useAgentInstaller([agent('system')], revalidate));

    act(() => result.current.requestInstall(agent('system')));

    expect(result.current.pendingConsent).toBeNull();
    await act(async () => {
      await result.current.confirmInstall();
    });
    expect(mockInstall).not.toHaveBeenCalled();
  });

  it('refuses to mint consent for installed, installing and unavailable too', async () => {
    for (const state of ['installed', 'installing', 'unavailable'] as InstallableAgentState[]) {
      const { result } = renderHook(() => useAgentInstaller([agent(state)], revalidate));
      act(() => result.current.requestInstall(agent(state)));
      expect(result.current.pendingConsent).toBeNull();
    }
    expect(mockInstall).not.toHaveBeenCalled();
  });

  it('kills a consent that went stale: the agent turned out to be a system copy', async () => {
    // The user opened the sheet while the card read `absent`; the status query
    // then discovered their own copy. Confirming must not install over it.
    const { result, rerender } = renderHook(({ agents }) => useAgentInstaller(agents, revalidate), {
      initialProps: { agents: [agent('absent')] },
    });

    act(() => result.current.requestInstall(agent('absent')));
    await waitFor(() => expect(result.current.pendingConsent).not.toBeNull());

    rerender({ agents: [agent('system')] });

    await act(async () => {
      await result.current.confirmInstall();
    });

    expect(mockInstall).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.pendingConsent).toBeNull());
  });

  it('kills a consent for an agent that has vanished from the catalogue', async () => {
    const { result, rerender } = renderHook(({ agents }) => useAgentInstaller(agents, revalidate), {
      initialProps: { agents: [agent('absent')] },
    });

    act(() => result.current.requestInstall(agent('absent')));
    await waitFor(() => expect(result.current.pendingConsent).not.toBeNull());

    rerender({ agents: [agent('absent', 'codex')] });

    await act(async () => {
      await result.current.confirmInstall();
    });

    expect(mockInstall).not.toHaveBeenCalled();
  });

  it('still allows a retry after a failure', async () => {
    // `failed` is the one non-absent state an install may start from - Retry
    // would be dead otherwise.
    const { result } = renderHook(() => useAgentInstaller([agent('failed')], revalidate));
    act(() => result.current.requestInstall(agent('failed')));
    await waitFor(() => expect(result.current.pendingConsent).not.toBeNull());

    await act(async () => {
      await result.current.confirmInstall();
    });
    expect(mockInstall).toHaveBeenCalledWith({ agentId: 'kimi' });
  });
});

describe('useAgentInstaller — cancel and uninstall', () => {
  it('cancelInstall reaches the cancel channel and re-reads status', async () => {
    const { result } = renderHook(() => useAgentInstaller([agent('installing')], revalidate));

    await act(async () => {
      await result.current.cancelInstall('kimi');
    });

    expect(mockCancel).toHaveBeenCalledWith({ agentId: 'kimi' });
    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it('cancelInstall does not write the activity map - the install call reports the outcome', async () => {
    // Writing `cancelled` here would race the `{ ok: false, reason: 'cancelled' }`
    // the awaiting confirmInstall is about to receive from the main process.
    const { result } = renderHook(() => useAgentInstaller([agent('installing')], revalidate));

    await act(async () => {
      await result.current.cancelInstall('kimi');
    });

    expect(result.current.activity.kimi).toBeUndefined();
  });

  it('a rejected cancel is survivable - the install may simply have finished', async () => {
    mockCancel.mockRejectedValue(new Error('no such channel'));
    const { result } = renderHook(() => useAgentInstaller([agent('installing')], revalidate));

    await act(async () => {
      await result.current.cancelInstall('kimi');
    });

    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it('uninstall reaches the uninstall channel and re-reads status', async () => {
    const { result } = renderHook(() => useAgentInstaller([agent('installed')], revalidate));

    await act(async () => {
      await result.current.uninstall('kimi');
    });

    expect(mockUninstall).toHaveBeenCalledWith({ agentId: 'kimi' });
    expect(revalidate).toHaveBeenCalledTimes(1);
  });
});

describe('useAgentInstaller — activity reporting', () => {
  it('clears the activity on success so the receipt is the only source of truth', async () => {
    const { result } = renderHook(() => useAgentInstaller([agent('absent')], revalidate));
    act(() => result.current.requestInstall(agent('absent')));
    await waitFor(() => expect(result.current.pendingConsent).not.toBeNull());

    await act(async () => {
      await result.current.confirmInstall();
    });

    expect(result.current.activity.kimi).toBeUndefined();
  });

  it('records the named failure reason from the bridge', async () => {
    mockInstall.mockResolvedValue({ ok: false, reason: 'bundled-bun-unavailable' });
    const { result } = renderHook(() => useAgentInstaller([agent('absent')], revalidate));
    act(() => result.current.requestInstall(agent('absent')));
    await waitFor(() => expect(result.current.pendingConsent).not.toBeNull());

    await act(async () => {
      await result.current.confirmInstall();
    });

    expect(result.current.activity.kimi).toEqual({ phase: 'failed', reason: 'bundled-bun-unavailable' });
  });

  it('marks a rejected invoke as a failure rather than leaving the card installing', async () => {
    mockInstall.mockRejectedValue(new Error('bridge died'));
    const { result } = renderHook(() => useAgentInstaller([agent('absent')], revalidate));
    act(() => result.current.requestInstall(agent('absent')));
    await waitFor(() => expect(result.current.pendingConsent).not.toBeNull());

    await act(async () => {
      await result.current.confirmInstall();
    });

    expect(result.current.activity.kimi).toEqual({ phase: 'failed', reason: 'error' });
    // The status re-read still happens, so a partially-completed install shows up.
    expect(revalidate).toHaveBeenCalledTimes(1);
  });
});
