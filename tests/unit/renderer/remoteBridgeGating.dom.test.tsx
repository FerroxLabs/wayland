/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression test for #979 - the remote WebUI white-screens on load.
 *
 * On the remote (paired-device / standalone WebUI) transport the WS dispatcher
 * refuses a remote-denied provider key, and `settleRejectedInvoke`
 * (src/process/webserver/adapter.ts) replies with an ERROR ENVELOPE rather than
 * a rejection, because @office-ai/platform's `invoke()` is resolve-only: it has
 * no reject path and no timeout (verified against the platform bridge source -
 * `invoke` resolves only when `subscribe.callback-<key><id>` arrives).
 *
 * That makes `await ipcBridge.cost.listBudgets.invoke() ?? []` resolve to a
 * NON-NULL object, so the `?? []` default never fires and the next render-phase
 * `.find(...)` / `.slice(...)` throws a TypeError that the root ErrorBoundary
 * turns into a blank app.
 *
 * These tests drive the REAL ipcBridge over a loopback adapter that mirrors the
 * server's behaviour exactly (allowlist decision via the real
 * `isAllowedForRemote`, envelope byte-identical to `settleRejectedInvoke`), so
 * the assertion is about the shipped client, not a hand-written shape.
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bridge } from '@office-ai/platform';
import { ipcBridge } from '@/common';
import { BridgeUnavailableError, isAllowedForRemote } from '@/common/adapter/bridgeAllowlist';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: 'en' },
  }),
}));

/** Payload `settleRejectedInvoke` sends for a remote-denied key (adapter.ts:40). */
const REMOTE_FORBIDDEN_ENVELOPE = { error: 'failed', detail: 'remote-forbidden' } as const;

type PlatformEmitter = { emit: (name: string, data: unknown) => void };

let inboundEmitter: PlatformEmitter | null = null;
/** Wire keys the loopback "server" saw, in order. */
let seenKeys: string[] = [];

/**
 * Stand in for the WebSocket round trip: reply to every `subscribe-<key>` the
 * way `src/process/webserver/adapter.ts` does for a remote caller.
 */
function installRemoteLoopbackAdapter(
  allowedResponses: Record<string, unknown> = {},
  /**
   * The remote WS dispatcher applies the allowlist; the local Electron preload
   * IPC path does not (the local renderer is the trusted user). Set false to
   * model the local transport.
   */
  applyRemoteGate = true
): void {
  bridge.adapter({
    emit(name: string, data: unknown) {
      if (!name.startsWith('subscribe-')) return;
      const key = name.slice('subscribe-'.length);
      const id = (data as { id?: string } | undefined)?.id;
      if (typeof id !== 'string') return;
      seenKeys.push(key);
      const reply =
        !applyRemoteGate || isAllowedForRemote(name) ? (allowedResponses[key] ?? null) : REMOTE_FORBIDDEN_ENVELOPE;
      // The platform listens on `subscribe.callback-${key}${id}` - identical to
      // the name settleRejectedInvoke sends back.
      queueMicrotask(() => inboundEmitter?.emit(`subscribe.callback-${key}${id}`, reply));
    },
    on(emitter: PlatformEmitter) {
      inboundEmitter = emitter;
    },
  });
}

/** Make this renderer look like the browser WebUI (no preload-injected API). */
function makeRendererRemote(): void {
  delete (window as { electronAPI?: unknown }).electronAPI;
  delete (globalThis as { electronAPI?: unknown }).electronAPI;
}

describe('#979 remote bridge gating', () => {
  let electronApiBackup: unknown;

  beforeEach(() => {
    electronApiBackup = (window as { electronAPI?: unknown }).electronAPI;
    seenKeys = [];
    makeRendererRemote();
    installRemoteLoopbackAdapter();
  });

  afterEach(() => {
    (window as { electronAPI?: unknown }).electronAPI = electronApiBackup;
    (globalThis as { electronAPI?: unknown }).electronAPI = electronApiBackup;
  });

  it('rejects instead of resolving with the error envelope for a remote-denied key', async () => {
    await expect(ipcBridge.cost.listBudgets.invoke()).rejects.toBeInstanceOf(BridgeUnavailableError);
  });

  it('lets the renderer default (`?? []`) fire again for a remote-denied read', async () => {
    const budgets = await ipcBridge.cost.listBudgets.invoke().catch(() => undefined);
    // THIS is the #979 bug: before the fix `budgets` is the non-null envelope
    // object, so `?? []` is skipped and the next `.find(...)` throws.
    expect(budgets ?? []).toEqual([]);
  });

  it('rejects every remote-denied cost aggregate the Mission Control cost tab loads', async () => {
    const window_ = { fromMs: 0, toMs: 1 };
    const calls: Array<Promise<unknown>> = [
      ipcBridge.cost.summary.invoke(window_),
      ipcBridge.cost.byModel.invoke(window_),
      ipcBridge.cost.byBackend.invoke(window_),
      ipcBridge.cost.byConversation.invoke(window_),
      ipcBridge.cost.byTeam.invoke(window_),
      ipcBridge.cost.series.invoke({ window: window_, bucketMs: 1 }),
    ];
    const settled = await Promise.allSettled(calls);
    for (const outcome of settled) {
      expect(outcome.status).toBe('rejected');
      expect((outcome as PromiseRejectedResult).reason).toBeInstanceOf(BridgeUnavailableError);
    }
  });

  it('does not send a remote-denied invocation over the wire at all', async () => {
    await ipcBridge.cost.listBudgets.invoke().catch(() => undefined);
    expect(seenKeys).not.toContain('cost.listBudgets');
  });

  it('still resolves a remote-ALLOWED provider normally', async () => {
    installRemoteLoopbackAdapter({ 'cron.list-jobs': [{ id: 'job-1' }] });
    await expect(ipcBridge.cron.listJobs.invoke()).resolves.toEqual([{ id: 'job-1' }]);
  });

  it('leaves the local Electron transport untouched', async () => {
    (window as { electronAPI?: unknown }).electronAPI = { emit: () => undefined, on: () => undefined };
    installRemoteLoopbackAdapter({ 'cost.listBudgets': [{ id: 'b1' }] }, false);
    // The local renderer is trusted; the wire gate never applies to it, so the
    // call must go through and resolve with the provider's real answer.
    await expect(ipcBridge.cost.listBudgets.invoke()).resolves.toEqual([{ id: 'b1' }]);
    expect(seenKeys).toContain('cost.listBudgets');
  });
});

describe('#979 remote renderer mount does not white-screen', () => {
  let electronApiBackup: unknown;

  beforeEach(() => {
    electronApiBackup = (window as { electronAPI?: unknown }).electronAPI;
    seenKeys = [];
    makeRendererRemote();
    installRemoteLoopbackAdapter();
  });

  afterEach(() => {
    (window as { electronAPI?: unknown }).electronAPI = electronApiBackup;
    (globalThis as { electronAPI?: unknown }).electronAPI = electronApiBackup;
  });

  /**
   * Mount under the SAME root ErrorBoundary src/renderer/main.tsx uses, so the
   * assertion is exactly the #979 symptom: a render-phase throw swaps the whole
   * subtree for the boundary fallback (the white screen).
   */
  const mountUnderRootBoundary = async (node: React.ReactNode) => {
    const { ErrorBoundary } = await import('@renderer/components/ErrorBoundary');
    const result = render(
      <ErrorBoundary>
        <SWRConfig value={{ provider: () => new Map() }}>
          <MemoryRouter>{node}</MemoryRouter>
        </SWRConfig>
      </ErrorBoundary>
    );
    // Let the loopback reply and SWR commit the resulting state.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    return result;
  };

  const expectNoBoundaryFallback = () => {
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  };

  it('mounts SpendPill on the remote transport without blanking the tree', async () => {
    // The pill is gated off on remote, so it must not even attempt the call.
    const listBudgets = vi.spyOn(ipcBridge.cost.listBudgets, 'invoke');
    const { SpendPill } = await import('@renderer/components/layout/Titlebar/SpendPill');
    const { container } = await mountUnderRootBoundary(<SpendPill />);

    // Before the fix the SWR fetcher resolved with the envelope and
    // `budgets.find(...)` threw during render. After the fix the pill is simply
    // absent on remote - there is no cost surface there at all.
    expectNoBoundaryFallback();
    expect(listBudgets).not.toHaveBeenCalled();
    expect(seenKeys).not.toContain('cost.listBudgets');
    expect(container).toBeEmptyDOMElement();
    listBudgets.mockRestore();
  });

  it('mounts the Mission Control cost tab on the remote transport without blanking the tree', async () => {
    const { CostTab } = await import('@renderer/pages/mission-control/cost/CostTab');
    await mountUnderRootBoundary(<CostTab />);

    // Before the fix `summary.events.toLocaleString()` ran against the envelope
    // and threw. After the fix the aggregates reject, SWR keeps `data`
    // undefined, and the `?? EMPTY_SUMMARY` / `?? []` defaults render the empty
    // state.
    expectNoBoundaryFallback();
    await waitFor(() => expect(screen.getByText('missionControl.cost.emptyTitle')).toBeInTheDocument());
  });
});

describe('#979 foreground-conversation reporter is skipped on the remote transport', () => {
  let electronApiBackup: unknown;

  beforeEach(() => {
    electronApiBackup = (window as { electronAPI?: unknown }).electronAPI;
    seenKeys = [];
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    installRemoteLoopbackAdapter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (window as { electronAPI?: unknown }).electronAPI = electronApiBackup;
    (globalThis as { electronAPI?: unknown }).electronAPI = electronApiBackup;
  });

  const renderReporter = async () => {
    const { useForegroundConversationReporter } =
      await import('@renderer/hooks/system/useForegroundConversationReporter');
    const Harness: React.FC = () => {
      useForegroundConversationReporter();
      return null;
    };
    render(
      <MemoryRouter initialEntries={['/conversation/abc-123']}>
        <Harness />
      </MemoryRouter>
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  it('does not even attempt the report from a remote renderer', async () => {
    const report = vi.spyOn(ipcBridge.application.setForegroundConversation, 'invoke');
    makeRendererRemote();
    await renderReporter();
    expect(report).not.toHaveBeenCalled();
    expect(seenKeys).not.toContain('app.set-foreground-conversation');
  });

  it('still reports from the local Electron renderer', async () => {
    const report = vi.spyOn(ipcBridge.application.setForegroundConversation, 'invoke');
    (window as { electronAPI?: unknown }).electronAPI = { emit: () => undefined, on: () => undefined };
    await renderReporter();
    expect(report).toHaveBeenCalledWith({ conversationId: 'abc-123' });
    expect(seenKeys).toContain('app.set-foreground-conversation');
  });
});
