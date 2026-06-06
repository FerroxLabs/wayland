/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Unit tests for kickoffBridge - the only main-process trust boundary in
// the Kickoff ship. Covers (TRIAGE TEST-2 + IPC-2, IPC-3, INIT-1, C-M-2/3):
//   - assistantId validation: length bounds (0, 129 chars), regex format
//     (invalid characters rejected)
//   - registry-not-ready timeout path
//   - engine throw → notRendered: 'engine-error' with sanitized errorName
//   - telemetry validation: event-name enum, kickoffId length cap,
//     notRenderedReason enum + length cap, cascadeLevel enum

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ----------------------------------------------------------------------------
// Mocks - capture the registered handlers so we can call them directly.
// vi.mock factories are hoisted above all imports, so they cannot reference
// top-level variables. Stash the mock fns on globalThis (set inside the
// factory) and read them back as locals below.
// ----------------------------------------------------------------------------

vi.mock('@/common', () => {
  const suggestProvider = (globalThis as any).__suggestProviderMock ?? ((globalThis as any).__suggestProviderMock = vi.fn());
  const telemetryProvider = (globalThis as any).__telemetryProviderMock ?? ((globalThis as any).__telemetryProviderMock = vi.fn());
  return {
    ipcBridge: {
      kickoff: {
        suggest: { provider: suggestProvider },
        telemetry: { provider: telemetryProvider },
      },
    },
  };
});

vi.mock('@process/services/kickoff/kickoffSingleton', () => {
  const engineSuggest = (globalThis as any).__engineSuggestMock ?? ((globalThis as any).__engineSuggestMock = vi.fn());
  return {
    getKickoffEngine: () => ({ suggest: engineSuggest }),
  };
});

vi.mock('@process/extensions/ExtensionRegistry', () => {
  const whenInitialized = (globalThis as any).__whenInitializedMock ?? ((globalThis as any).__whenInitializedMock = vi.fn());
  return {
    ExtensionRegistry: {
      getInstance: () => ({ whenInitialized }),
    },
  };
});

vi.mock('@process/services/cron/cronReadiness', () => {
  const waitForCronReady = (globalThis as any).__waitForCronReadyMock ?? ((globalThis as any).__waitForCronReadyMock = vi.fn());
  return {
    waitForCronReady: (...args: unknown[]) => waitForCronReady(...args),
  };
});

const suggestProviderMock: ReturnType<typeof vi.fn> = (globalThis as any).__suggestProviderMock;
const telemetryProviderMock: ReturnType<typeof vi.fn> = (globalThis as any).__telemetryProviderMock;
const engineSuggestMock: ReturnType<typeof vi.fn> = (globalThis as any).__engineSuggestMock;
const whenInitializedMock: ReturnType<typeof vi.fn> = (globalThis as any).__whenInitializedMock;
const waitForCronReadyMock: ReturnType<typeof vi.fn> = (globalThis as any).__waitForCronReadyMock;

import { initKickoffBridge } from '@process/bridge/kickoffBridge';
import type { KickoffResult, KickoffTelemetryEvent } from '@process/services/kickoff/types';

// Pulls the most-recently-registered handler from a `.provider` mock. The
// bridge calls `.provider(fn)` once at init; we re-init in `beforeEach`
// so the latest call is always our handler.
function getSuggestHandler(): (raw: unknown) => Promise<KickoffResult> {
  const last = suggestProviderMock.mock.calls.at(-1);
  if (!last) throw new Error('suggest provider was never registered');
  return last[0] as (raw: unknown) => Promise<KickoffResult>;
}

function getTelemetryHandler(): (raw: unknown) => Promise<void> {
  const last = telemetryProviderMock.mock.calls.at(-1);
  if (!last) throw new Error('telemetry provider was never registered');
  return last[0] as (raw: unknown) => Promise<void>;
}

beforeEach(() => {
  suggestProviderMock.mockReset();
  telemetryProviderMock.mockReset();
  engineSuggestMock.mockReset();
  whenInitializedMock.mockReset();
  waitForCronReadyMock.mockReset();
  // Sensible defaults - most tests want registry ready + cron ready.
  whenInitializedMock.mockResolvedValue(undefined);
  waitForCronReadyMock.mockResolvedValue('ready');
  initKickoffBridge();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// suggest - input validation (assistantId)
// ============================================================================

describe('kickoffBridge.suggest - input validation', () => {
  it('rejects empty string assistantId with notRendered=error', async () => {
    const handler = getSuggestHandler();
    const result = await handler({ assistantId: '' });
    expect(result).toEqual({ notRendered: 'error' });
    expect(engineSuggestMock).not.toHaveBeenCalled();
  });

  it('rejects 129-char assistantId (length cap = 128)', async () => {
    const handler = getSuggestHandler();
    const longId = 'a'.repeat(129);
    const result = await handler({ assistantId: longId });
    expect(result).toEqual({ notRendered: 'error' });
    expect(engineSuggestMock).not.toHaveBeenCalled();
  });

  it('accepts 128-char assistantId at the boundary', async () => {
    const handler = getSuggestHandler();
    const id = 'a'.repeat(128);
    engineSuggestMock.mockResolvedValue({ notRendered: 'no-kickoffs-defined' });
    const result = await handler({ assistantId: id });
    expect(result).toEqual({ notRendered: 'no-kickoffs-defined' });
    expect(engineSuggestMock).toHaveBeenCalledWith(id);
  });

  it('rejects assistantId with invalid characters (foo/bar slash)', async () => {
    const handler = getSuggestHandler();
    const result = await handler({ assistantId: 'foo/bar' });
    expect(result).toEqual({ notRendered: 'error' });
    expect(engineSuggestMock).not.toHaveBeenCalled();
  });

  it('rejects assistantId with invalid characters (foo bar space)', async () => {
    const handler = getSuggestHandler();
    const result = await handler({ assistantId: 'foo bar' });
    expect(result).toEqual({ notRendered: 'error' });
    expect(engineSuggestMock).not.toHaveBeenCalled();
  });

  it('rejects non-object payload', async () => {
    const handler = getSuggestHandler();
    expect(await handler(null)).toEqual({ notRendered: 'error' });
    expect(await handler(undefined)).toEqual({ notRendered: 'error' });
    expect(await handler('helm')).toEqual({ notRendered: 'error' });
  });

  it('rejects payload with non-string assistantId', async () => {
    const handler = getSuggestHandler();
    expect(await handler({ assistantId: 123 })).toEqual({ notRendered: 'error' });
  });

  it('accepts ext-prefixed assistantId', async () => {
    const handler = getSuggestHandler();
    engineSuggestMock.mockResolvedValue({ notRendered: 'no-kickoffs-defined' });
    const result = await handler({ assistantId: 'ext-helm' });
    expect(result).toEqual({ notRendered: 'no-kickoffs-defined' });
    expect(engineSuggestMock).toHaveBeenCalledWith('ext-helm');
  });

  it('accepts builtin-prefixed assistantId', async () => {
    const handler = getSuggestHandler();
    engineSuggestMock.mockResolvedValue({ notRendered: 'no-kickoffs-defined' });
    const result = await handler({ assistantId: 'builtin-helm' });
    expect(result).toEqual({ notRendered: 'no-kickoffs-defined' });
    expect(engineSuggestMock).toHaveBeenCalledWith('builtin-helm');
  });
});

// ============================================================================
// suggest - registry-not-ready
// ============================================================================

describe('kickoffBridge.suggest - registry readiness', () => {
  it('returns notRendered=registry-not-ready when whenInitialized times out (never resolves)', async () => {
    // Re-init with a never-resolving registry promise so the 3s race times out.
    suggestProviderMock.mockReset();
    telemetryProviderMock.mockReset();
    whenInitializedMock.mockReturnValue(new Promise<void>(() => undefined));
    waitForCronReadyMock.mockResolvedValue('ready');
    // Use fake timers to advance through the 3s timeout deterministically.
    vi.useFakeTimers();
    initKickoffBridge();
    const handler = getSuggestHandler();
    const promise = handler({ assistantId: 'helm' });
    await vi.advanceTimersByTimeAsync(3001);
    const result = await promise;
    vi.useRealTimers();
    expect(result).toEqual({ notRendered: 'registry-not-ready' });
    expect(engineSuggestMock).not.toHaveBeenCalled();
  });

  it('returns notRendered=registry-not-ready when ExtensionRegistry.getInstance throws', async () => {
    suggestProviderMock.mockReset();
    telemetryProviderMock.mockReset();
    // Reset modules so vi.mock is re-applied with the throwing implementation.
    vi.resetModules();
    vi.doMock('@process/extensions/ExtensionRegistry', () => ({
      ExtensionRegistry: {
        getInstance: () => {
          throw new Error('not booted');
        },
      },
    }));
    vi.doMock('@/common', () => ({
      ipcBridge: {
        kickoff: {
          suggest: { provider: suggestProviderMock },
          telemetry: { provider: telemetryProviderMock },
        },
      },
    }));
    vi.doMock('@process/services/kickoff/kickoffSingleton', () => ({
      getKickoffEngine: () => ({ suggest: engineSuggestMock }),
    }));
    vi.doMock('@process/services/cron/cronReadiness', () => ({
      waitForCronReady: () => Promise.resolve('ready' as const),
    }));
    const { initKickoffBridge: initFresh } = await import('@process/bridge/kickoffBridge');
    initFresh();
    const handler = getSuggestHandler();
    const result = await handler({ assistantId: 'helm' });
    expect(result).toEqual({ notRendered: 'registry-not-ready' });
    // Restore mocks after this test (other tests rely on the top-level vi.mock).
    vi.doUnmock('@process/extensions/ExtensionRegistry');
    vi.doUnmock('@process/services/cron/cronReadiness');
    vi.doUnmock('@process/services/kickoff/kickoffSingleton');
    vi.doUnmock('@/common');
  });
});

// ============================================================================
// suggest - engine error + happy path
// ============================================================================

describe('kickoffBridge.suggest - engine integration', () => {
  it('engine throw → returns notRendered=engine-error with sanitized errorName', async () => {
    const handler = getSuggestHandler();
    class CustomEngineError extends Error {
      override name = 'CustomEngineError';
    }
    engineSuggestMock.mockRejectedValue(new CustomEngineError('top secret message'));
    const result = await handler({ assistantId: 'helm' });
    expect(result).toEqual({ notRendered: 'engine-error', errorName: 'CustomEngineError' });
    // CRITICAL: result must NOT carry the error message (PII risk).
    expect(JSON.stringify(result)).not.toContain('top secret message');
  });

  it('engine throws non-Error → errorName defaults to "Error"', async () => {
    const handler = getSuggestHandler();
    engineSuggestMock.mockRejectedValue('a plain string');
    const result = await handler({ assistantId: 'helm' });
    expect(result).toEqual({ notRendered: 'engine-error', errorName: 'Error' });
  });

  it('engine returns suggestion → bridge passes through verbatim', async () => {
    const handler = getSuggestHandler();
    const suggestion = {
      cascadeLevel: 3,
      cascadeReason: 'cold-start-library',
      kickoffId: 'morning-cold',
      text: 'Want me to surface the decision?',
      prefill: 'Surface the decision.',
      alternates: [],
    };
    engineSuggestMock.mockResolvedValue(suggestion);
    const result = await handler({ assistantId: 'helm' });
    expect(result).toBe(suggestion);
  });
});

// ============================================================================
// telemetry - validation
// ============================================================================

describe('kickoffBridge.telemetry - validation', () => {
  it("silently drops payload with unknown event name 'pwned'", async () => {
    const handler = getTelemetryHandler();
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    await expect(handler({ event: 'pwned' })).resolves.toBeUndefined();
    expect(debugSpy).not.toHaveBeenCalled();
    debugSpy.mockRestore();
  });

  it('silently drops payload with kickoffId longer than 128 chars', async () => {
    const handler = getTelemetryHandler();
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const evt: KickoffTelemetryEvent = {
      event: 'accepted',
      kickoffId: 'x'.repeat(129),
      cascadeLevel: 3,
    };
    await expect(handler(evt)).resolves.toBeUndefined();
    expect(debugSpy).not.toHaveBeenCalled();
    debugSpy.mockRestore();
  });

  it("silently drops payload with notRenderedReason: 'unknown'", async () => {
    const handler = getTelemetryHandler();
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    await expect(
      handler({ event: 'not_rendered', notRenderedReason: 'unknown' })
    ).resolves.toBeUndefined();
    expect(debugSpy).not.toHaveBeenCalled();
    debugSpy.mockRestore();
  });

  it('silently drops payload with notRenderedReason longer than 128 chars', async () => {
    const handler = getTelemetryHandler();
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    await expect(
      handler({ event: 'not_rendered', notRenderedReason: 'a'.repeat(129) })
    ).resolves.toBeUndefined();
    expect(debugSpy).not.toHaveBeenCalled();
    debugSpy.mockRestore();
  });

  it('silently drops payload with invalid cascadeLevel', async () => {
    const handler = getTelemetryHandler();
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    await expect(handler({ event: 'accepted', cascadeLevel: 9 })).resolves.toBeUndefined();
    expect(debugSpy).not.toHaveBeenCalled();
    debugSpy.mockRestore();
  });

  it('silently drops payload with invalid dismissReason', async () => {
    const handler = getTelemetryHandler();
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    await expect(
      handler({ event: 'dismissed', dismissReason: 'rage-quit' })
    ).resolves.toBeUndefined();
    expect(debugSpy).not.toHaveBeenCalled();
    debugSpy.mockRestore();
  });

  it('valid telemetry payload reaches the structured-log path', async () => {
    const handler = getTelemetryHandler();
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const evt: KickoffTelemetryEvent = {
      event: 'accepted',
      kickoffId: 'morning-cold',
      cascadeLevel: 3,
    };
    await handler(evt);
    expect(debugSpy).toHaveBeenCalledWith('[kickoff.telemetry]', JSON.stringify(evt));
    debugSpy.mockRestore();
  });

  it('valid not_rendered payload with valid notRenderedReason reaches the log', async () => {
    const handler = getTelemetryHandler();
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const evt: KickoffTelemetryEvent = {
      event: 'not_rendered',
      notRenderedReason: 'no-kickoffs-defined',
    };
    await handler(evt);
    expect(debugSpy).toHaveBeenCalledWith('[kickoff.telemetry]', JSON.stringify(evt));
    debugSpy.mockRestore();
  });

  it('valid dismissed payload with dismissReason=interaction reaches the log', async () => {
    const handler = getTelemetryHandler();
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const evt: KickoffTelemetryEvent = {
      event: 'dismissed',
      kickoffId: 'morning-cold',
      cascadeLevel: 3,
      dismissReason: 'interaction',
    };
    await handler(evt);
    expect(debugSpy).toHaveBeenCalledWith('[kickoff.telemetry]', JSON.stringify(evt));
    debugSpy.mockRestore();
  });

  it('valid dismissed payload with dismissReason=typing reaches the log', async () => {
    const handler = getTelemetryHandler();
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const evt: KickoffTelemetryEvent = {
      event: 'dismissed',
      kickoffId: 'morning-cold',
      cascadeLevel: 3,
      dismissReason: 'typing',
    };
    await handler(evt);
    expect(debugSpy).toHaveBeenCalledWith('[kickoff.telemetry]', JSON.stringify(evt));
    debugSpy.mockRestore();
  });

  it('silently drops non-object payload', async () => {
    const handler = getTelemetryHandler();
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    await expect(handler(null)).resolves.toBeUndefined();
    await expect(handler('hi')).resolves.toBeUndefined();
    expect(debugSpy).not.toHaveBeenCalled();
    debugSpy.mockRestore();
  });
});
