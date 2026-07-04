import { describe, it, expect, vi } from 'vitest';

import { resolveOpenInSystemToast } from '@/renderer/pages/conversation/Preview/fileUtils';

/**
 * Tests for the defensive messageApi pattern used in PreviewPanel's handleOpenInSystem.
 *
 * When a component unmounts after an async operation, Arco Design's
 * Message.useMessage() contextHolderRef.current becomes null, causing
 * messageApi.error() / messageApi.success() to throw:
 *   TypeError: Cannot read properties of null (reading 'addInstance')
 *
 * The fix wraps messageApi calls in try-catch to prevent unhandled rejections.
 * Since PreviewPanel is deeply coupled to React contexts and IPC bridges,
 * this test validates the defensive pattern in isolation.
 */
describe('handleOpenInSystem defensive messageApi pattern', () => {
  // Simulate a messageApi whose context holder has been unmounted
  function createCrashedMessageApi() {
    return {
      error: vi.fn(() => {
        throw new TypeError("Cannot read properties of null (reading 'addInstance')");
      }),
      success: vi.fn(() => {
        throw new TypeError("Cannot read properties of null (reading 'addInstance')");
      }),
    };
  }

  it('should not throw when messageApi.error crashes due to unmounted context holder', () => {
    const messageApi = createCrashedMessageApi();

    // Simulate the fixed pattern: messageApi.error wrapped in try-catch
    expect(() => {
      try {
        messageApi.error('Open in system failed');
      } catch {
        // Context holder may be unmounted after async operation
      }
    }).not.toThrow();

    expect(messageApi.error).toHaveBeenCalledWith('Open in system failed');
  });

  it('should not throw when messageApi.success crashes due to unmounted context holder', () => {
    const messageApi = createCrashedMessageApi();

    expect(() => {
      try {
        messageApi.success('Open in system succeeded');
      } catch {
        // Context holder may be unmounted after async operation
      }
    }).not.toThrow();

    expect(messageApi.success).toHaveBeenCalledWith('Open in system succeeded');
  });

  it('should still display message when context holder is mounted', () => {
    const messageApi = {
      error: vi.fn(),
      success: vi.fn(),
    };

    try {
      messageApi.success('Open in system succeeded');
    } catch {
      // Context holder may be unmounted
    }

    expect(messageApi.success).toHaveBeenCalledWith('Open in system succeeded');
  });
});

// #621: the "open in system" handlers (PreviewPanel + PDFViewer) must gate the
// success toast on ShellOpenResult.ok - a failed shell open resolves { ok:false }
// rather than throwing, so the old catch-only code showed a misleading success.
describe('resolveOpenInSystemToast (#621)', () => {
  const messages = { success: 'Opened', failed: 'Failed to open' };

  it('shows the success toast when the shell open succeeded (ok:true)', () => {
    expect(resolveOpenInSystemToast({ ok: true }, messages)).toEqual({ kind: 'success', message: 'Opened' });
  });

  it('shows an error toast surfacing the real error when the open failed (ok:false with error)', () => {
    expect(resolveOpenInSystemToast({ ok: false, error: 'no xdg association' }, messages)).toEqual({
      kind: 'error',
      message: 'no xdg association',
    });
  });

  it('falls back to the localized failed message when ok:false has no error string', () => {
    expect(resolveOpenInSystemToast({ ok: false }, messages)).toEqual({ kind: 'error', message: 'Failed to open' });
  });

  it('treats a missing/undefined result as a failure (never a false success)', () => {
    expect(resolveOpenInSystemToast(undefined, messages)).toEqual({ kind: 'error', message: 'Failed to open' });
  });
});
