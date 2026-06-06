/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression for cross-audit Gemini-HIGH: telemetry events fired by the
 * renderer before the SQLite logger is wired must be buffered and flushed
 * in arrival order, not silently dropped. The IPC provider is registered
 * eagerly so the renderer's first `usage.recordEvent` invocation always
 * lands somewhere.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/common', () => {
  const providerFn = vi.fn();
  const queryProviderFn = vi.fn();
  const queryRecentProviderFn = vi.fn();
  return {
    ipcBridge: {
      usage: {
        recordEvent: { provider: providerFn },
        queryFrequentlyUsedModels: { provider: queryProviderFn },
        queryRecentlyUsedModels: { provider: queryRecentProviderFn },
      },
    },
  };
});

import { ipcBridge } from '@/common';
import {
  __resetUsageBridgeForTests,
  ensureUsageProviderRegistered,
  initUsageBridge,
} from '@process/bridge/usageBridge';

const providerFn = ipcBridge.usage.recordEvent.provider as unknown as ReturnType<typeof vi.fn>;
let providerCallback: ((input: unknown) => unknown) | null = null;

type RecordedEvent = {
  eventType: string;
  anchorId?: string;
  assistantId?: string;
  cliBackend?: string;
  metadata?: Record<string, unknown>;
};

function makeLogger() {
  const recorded: RecordedEvent[] = [];
  const logger = {
    record: vi.fn(async (event: RecordedEvent) => {
      recorded.push(event);
    }),
  };
  return { logger: logger as unknown as Parameters<typeof initUsageBridge>[0], recorded };
}

describe('usageBridge - startup race (Gemini-HIGH)', () => {
  beforeEach(() => {
    __resetUsageBridgeForTests();
    providerCallback = null;
    providerFn.mockReset();
    providerFn.mockImplementation((cb: (input: unknown) => unknown) => {
      providerCallback = cb;
    });
  });

  it('buffers events fired before the logger is wired and flushes them in arrival order', async () => {
    // Simulate `initBridge` registering the IPC channel eagerly during module
    // load - before `getDatabase()` has resolved.
    ensureUsageProviderRegistered();
    expect(providerCallback).toBeTruthy();
    expect(providerFn).toHaveBeenCalledTimes(1);

    // Renderer fires the cold-boot foreground event (and a couple more)
    // before the logger has been initialised.
    await providerCallback!({ eventType: 'guid.foreground' });
    await providerCallback!({ eventType: 'guid.cli_selected', cliBackend: 'wcore' });
    await providerCallback!({ eventType: 'launchpad.card_clicked', anchorId: 'cowork' });

    const { logger, recorded } = makeLogger();
    expect(recorded).toHaveLength(0);

    // Logger lands; buffered events flush in arrival order.
    initUsageBridge(logger);
    await Promise.resolve();
    await Promise.resolve();

    expect(recorded.map((e) => e.eventType)).toEqual([
      'guid.foreground',
      'guid.cli_selected',
      'launchpad.card_clicked',
    ]);
    expect(recorded[1].cliBackend).toBe('wcore');
    expect(recorded[2].anchorId).toBe('cowork');
  });

  it('forwards events synchronously to the logger once it is wired', async () => {
    ensureUsageProviderRegistered();
    const { logger, recorded } = makeLogger();
    initUsageBridge(logger);

    await providerCallback!({ eventType: 'guid.message_sent', cliBackend: 'gemini' });
    expect(recorded).toEqual([{ eventType: 'guid.message_sent', cliBackend: 'gemini' }]);
  });

  it('installs the IPC provider exactly once across init calls', () => {
    ensureUsageProviderRegistered();
    const { logger } = makeLogger();
    initUsageBridge(logger);
    initUsageBridge(logger);
    expect(providerFn).toHaveBeenCalledTimes(1);
  });
});

describe('usageBridge - eventType allowlist (MED-1)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetUsageBridgeForTests();
    providerCallback = null;
    providerFn.mockReset();
    providerFn.mockImplementation((cb: (input: unknown) => unknown) => {
      providerCallback = cb;
    });
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('drops events with unknown eventType and logs a warning', async () => {
    ensureUsageProviderRegistered();
    const { logger, recorded } = makeLogger();
    initUsageBridge(logger);

    await providerCallback!({ eventType: 'attacker.injected_event', metadata: { evil: true } });
    expect(recorded).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledWith(
      '[usage.recordEvent] dropped event with unknown type:',
      'attacker.injected_event'
    );
  });

  it('accepts events with a known eventType', async () => {
    ensureUsageProviderRegistered();
    const { logger, recorded } = makeLogger();
    initUsageBridge(logger);

    await providerCallback!({ eventType: 'guid.model_selected', metadata: { modelId: 'claude' } });
    expect(recorded).toHaveLength(1);
    expect(recorded[0].eventType).toBe('guid.model_selected');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('drops unknown events that arrive before the logger is wired (does not buffer)', async () => {
    ensureUsageProviderRegistered();
    await providerCallback!({ eventType: 'bogus.event' });

    const { logger, recorded } = makeLogger();
    initUsageBridge(logger);
    await Promise.resolve();
    await Promise.resolve();
    expect(recorded).toHaveLength(0);
  });
});

describe('usageBridge - workflow.* event types (Workflow Launch Surface v0.6.0)', () => {
  // The Workflow Launch Surface adds 13 new event types. They must pass the
  // allowlist or the right-rail progress + autonomous dispatch + parser
  // diagnostics all go silently dark. Spec refs: §4.3, §8, §11.1, §9.
  const WORKFLOW_EVENT_TYPES = [
    'workflow.session_started',
    'workflow.step_marker',
    'workflow.ask_emitted',
    'workflow.ask_answered',
    'workflow.session_completed',
    'workflow.autonomous_step_dispatched',
    'workflow.autonomous_step_completed',
    'workflow.marker_invalid',
    'workflow.marker_html_escaped',
    'workflow.marker_false_strip',
    'workflow.step_transition',
    'workflow.regress_attempt',
    'workflow.orphaned_ask',
  ] as const;

  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetUsageBridgeForTests();
    providerCallback = null;
    providerFn.mockReset();
    providerFn.mockImplementation((cb: (input: unknown) => unknown) => {
      providerCallback = cb;
    });
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('forwards every workflow.* event type to the logger (allowlist accepts all 13)', async () => {
    ensureUsageProviderRegistered();
    const { logger, recorded } = makeLogger();
    initUsageBridge(logger);

    for (const eventType of WORKFLOW_EVENT_TYPES) {
      await providerCallback!({ eventType });
    }

    expect(recorded.map((e) => e.eventType)).toEqual([...WORKFLOW_EVENT_TYPES]);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
