// tests/unit/standaloneAdapter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @office-ai/platform bridge before importing standalone
vi.mock('@office-ai/platform', () => ({
  bridge: {
    adapter: vi.fn(({ emit, on }) => {
      // Simulate bridge calling on() with a fake emitter ref
      const fakeEmitter = {
        emit: vi.fn((name: string, data: unknown) => ({ name, data })),
      };
      on(fakeEmitter);
    }),
    // C1: ipcBridge.ts is loaded as a side-effect from adapter/standalone.ts
    // and calls buildProvider/buildEmitter through the allowlist wrapper.
    // These stubs make those calls inert during the unit tests.
    buildProvider: vi.fn(() => ({ provider: vi.fn(), invoke: vi.fn() })),
    buildEmitter: vi.fn(() => ({ emit: vi.fn(), on: vi.fn() })),
  },
}));

// Mock registry
const mockBroadcastToAll = vi.fn();
const mockSetBridgeEmitter = vi.fn();
vi.mock('@/common/adapter/registry', () => ({
  broadcastToAll: mockBroadcastToAll,
  setBridgeEmitter: mockSetBridgeEmitter,
}));

describe('standalone adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('calls setBridgeEmitter on load', async () => {
    await import('@/common/adapter/standalone');
    expect(mockSetBridgeEmitter).toHaveBeenCalledOnce();
  });

  it('dispatchMessage routes allowlisted messages through EventEmitter to bridge emitter', async () => {
    // C1: standalone.ts now enforces the inbound allowlist. We register
    // 'test.allowed' via the allowlist's buildProvider (the same wrapper
    // ipcBridge.ts uses) so the dispatcher accepts `subscribe-test.allowed`.
    const { buildProvider } = await import('@/common/adapter/bridgeAllowlist');
    buildProvider('test.allowed');

    const { dispatchMessage } = await import('@/common/adapter/standalone');
    // setBridgeEmitter was called with fakeEmitter - get it
    const fakeEmitter = mockSetBridgeEmitter.mock.calls[0][0] as { emit: ReturnType<typeof vi.fn> };
    dispatchMessage('subscribe-test.allowed', { text: 'hello' });
    // Allow microtask queue to flush
    await new Promise((r) => setTimeout(r, 0));
    expect(fakeEmitter.emit).toHaveBeenCalledWith('subscribe-test.allowed', { text: 'hello' });
  });

  it('dispatchMessage drops messages not in the allowlist (C1)', async () => {
    const { dispatchMessage } = await import('@/common/adapter/standalone');
    const fakeEmitter = mockSetBridgeEmitter.mock.calls[0][0] as { emit: ReturnType<typeof vi.fn> };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    dispatchMessage('not.in.allowlist', { text: 'hello' });
    await new Promise((r) => setTimeout(r, 0));

    expect(fakeEmitter.emit).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      '[adapter] Rejected disallowed standalone bridge event:',
      'not.in.allowlist'
    );
    consoleSpy.mockRestore();
  });
});
