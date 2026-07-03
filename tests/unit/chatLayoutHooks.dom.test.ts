/**
 * Unit tests for hooks extracted from ChatLayout:
 * - useTitleRename
 * - useContainerWidth
 * - useWorkspaceCollapse
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockConversationUpdateInvoke = vi.fn().mockResolvedValue(true);
const mockRefreshConversationCache = vi.fn().mockResolvedValue(undefined);

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      update: { invoke: (...args: unknown[]) => mockConversationUpdateInvoke(...args) },
    },
  },
}));

vi.mock('@/renderer/utils/emitter', () => ({
  emitter: { emit: vi.fn() },
}));

vi.mock('@/renderer/pages/conversation/utils/conversationCache', () => ({
  refreshConversationCache: (...args: unknown[]) => mockRefreshConversationCache(...args),
}));

vi.mock('@arco-design/web-react', () => ({
  Message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({ t: (key: string) => key })),
}));

// Mock detectMobileViewportOrTouch - default to false (desktop)
const mockDetectMobile = vi.fn(() => false);
vi.mock('@/renderer/pages/conversation/utils/detectPlatform', () => ({
  detectMobileViewportOrTouch: () => mockDetectMobile(),
}));

vi.mock('@/renderer/utils/ui/focus', () => ({
  blurActiveElement: vi.fn(),
}));

vi.mock('@/renderer/utils/workspace/workspaceEvents', () => ({
  WORKSPACE_TOGGLE_EVENT: 'wayland-workspace-toggle',
  WORKSPACE_STATE_EVENT: 'wayland-workspace-state',
  WORKSPACE_HAS_FILES_EVENT: 'wayland-workspace-has-files',
  dispatchWorkspaceStateEvent: vi.fn(),
  dispatchWorkspaceToggleEvent: vi.fn(),
  dispatchWorkspaceHasFilesEvent: vi.fn(),
}));

// Provide a working localStorage mock if the environment lacks one
function ensureLocalStorage() {
  if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
    const store = new Map<string, string>();
    const mock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (index: number) => [...store.keys()][index] ?? null,
    };
    Object.defineProperty(globalThis, 'localStorage', { value: mock, writable: true });
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'localStorage', { value: mock, writable: true });
    }
  }
}
ensureLocalStorage();

// Import hooks after mocks are set up
import { useTitleRename } from '../../src/renderer/pages/conversation/hooks/useTitleRename';
import { useContainerWidth } from '../../src/renderer/pages/conversation/hooks/useContainerWidth';
import { useWorkspaceCollapse } from '../../src/renderer/pages/conversation/hooks/useWorkspaceCollapse';

// ── useTitleRename ─────────────────────────────────────────────────────────

describe('useTitleRename', () => {
  const mockUpdateTabName = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockConversationUpdateInvoke.mockResolvedValue(true);
    mockRefreshConversationCache.mockResolvedValue(undefined);
  });

  it('initial state: editingTitle is false, titleDraft syncs with title param', () => {
    const { result } = renderHook(() =>
      useTitleRename({ title: 'Hello', conversationId: 'conv-1', updateTabName: mockUpdateTabName })
    );

    expect(result.current.editingTitle).toBe(false);
    expect(result.current.titleDraft).toBe('Hello');
    expect(result.current.renameLoading).toBe(false);
  });

  it('titleDraft updates when title prop changes', () => {
    let title = 'Original';
    const { result, rerender } = renderHook(() =>
      useTitleRename({ title, conversationId: 'conv-1', updateTabName: mockUpdateTabName })
    );

    expect(result.current.titleDraft).toBe('Original');

    title = 'Updated';
    rerender();

    expect(result.current.titleDraft).toBe('Updated');
  });

  it('canRenameTitle is false when conversationId is missing', () => {
    const { result } = renderHook(() =>
      useTitleRename({ title: 'Hello', conversationId: undefined, updateTabName: mockUpdateTabName })
    );

    expect(result.current.canRenameTitle).toBe(false);
  });

  it('canRenameTitle is false when title is not a string', () => {
    const { result } = renderHook(() =>
      useTitleRename({ title: undefined, conversationId: 'conv-1', updateTabName: mockUpdateTabName })
    );

    expect(result.current.canRenameTitle).toBe(false);
  });

  it('canRenameTitle is true when both title and conversationId are provided', () => {
    const { result } = renderHook(() =>
      useTitleRename({ title: 'Hello', conversationId: 'conv-1', updateTabName: mockUpdateTabName })
    );

    expect(result.current.canRenameTitle).toBe(true);
  });

  it('submitTitleRename calls ipcBridge and updateTabName on success', async () => {
    const { result } = renderHook(() =>
      useTitleRename({ title: 'Old Title', conversationId: 'conv-1', updateTabName: mockUpdateTabName })
    );

    // Set a new title draft
    act(() => {
      result.current.setTitleDraft('New Title');
    });

    await act(async () => {
      await result.current.submitTitleRename();
    });

    expect(mockConversationUpdateInvoke).toHaveBeenCalledWith({
      id: 'conv-1',
      updates: { name: 'New Title' },
    });
    expect(mockRefreshConversationCache).toHaveBeenCalledWith('conv-1');
    expect(mockUpdateTabName).toHaveBeenCalledWith('conv-1', 'New Title');
    expect(result.current.editingTitle).toBe(false);
    expect(result.current.renameLoading).toBe(false);
  });

  it('submitTitleRename handles empty draft (resets to current title)', async () => {
    const { result } = renderHook(() =>
      useTitleRename({ title: 'Current', conversationId: 'conv-1', updateTabName: mockUpdateTabName })
    );

    // Set empty draft
    act(() => {
      result.current.setTitleDraft('   ');
      result.current.setEditingTitle(true);
    });

    await act(async () => {
      await result.current.submitTitleRename();
    });

    // Should not call ipcBridge
    expect(mockConversationUpdateInvoke).not.toHaveBeenCalled();
    // Should reset draft to current title
    expect(result.current.titleDraft).toBe('Current');
    expect(result.current.editingTitle).toBe(false);
  });

  it('submitTitleRename is a no-op when canRenameTitle is false', async () => {
    const { result } = renderHook(() =>
      useTitleRename({ title: 'Hello', conversationId: undefined, updateTabName: mockUpdateTabName })
    );

    act(() => {
      result.current.setTitleDraft('Something');
    });

    await act(async () => {
      await result.current.submitTitleRename();
    });

    expect(mockConversationUpdateInvoke).not.toHaveBeenCalled();
  });

  it('submitTitleRename skips API call when draft equals current title', async () => {
    const { result } = renderHook(() =>
      useTitleRename({ title: 'Same Title', conversationId: 'conv-1', updateTabName: mockUpdateTabName })
    );

    await act(async () => {
      await result.current.submitTitleRename();
    });

    expect(mockConversationUpdateInvoke).not.toHaveBeenCalled();
    expect(result.current.editingTitle).toBe(false);
  });

  it('submitTitleRename handles API failure gracefully', async () => {
    mockConversationUpdateInvoke.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useTitleRename({ title: 'Old', conversationId: 'conv-1', updateTabName: mockUpdateTabName })
    );

    act(() => {
      result.current.setTitleDraft('New');
    });

    await act(async () => {
      await result.current.submitTitleRename();
    });

    expect(mockUpdateTabName).not.toHaveBeenCalled();
    expect(result.current.renameLoading).toBe(false);
  });
});

// ── useContainerWidth ──────────────────────────────────────────────────────

describe('useContainerWidth', () => {
  it('returns a containerRef and containerWidth', () => {
    const { result } = renderHook(() => useContainerWidth());

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.containerRef.current).toBeNull();
    // Falls back to window.innerWidth when no element is mounted
    expect(typeof result.current.containerWidth).toBe('number');
  });

  it('containerWidth defaults to window.innerWidth when ref is unattached', () => {
    const { result } = renderHook(() => useContainerWidth());

    // In jsdom, window.innerWidth is typically 0 or a default value
    expect(result.current.containerWidth).toBe(window.innerWidth);
  });
});

// ── useWorkspaceCollapse ───────────────────────────────────────────────────

describe('useWorkspaceCollapse', () => {
  const STORAGE_KEY = 'wayland_workspace_panel_collapsed';

  function clearStorage() {
    globalThis.localStorage.removeItem(STORAGE_KEY);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    clearStorage();
    mockDetectMobile.mockReturnValue(false);
  });

  afterEach(() => {
    clearStorage();
  });

  it('initial collapsed state defaults to true when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useWorkspaceCollapse({ workspaceEnabled: true, isMobile: false, conversationId: 'conv-1' })
    );

    expect(result.current.rightSiderCollapsed).toBe(true);
  });

  it('initial collapsed state reads from localStorage', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, 'false');

    const { result } = renderHook(() =>
      useWorkspaceCollapse({ workspaceEnabled: true, isMobile: false, conversationId: 'conv-1' })
    );

    expect(result.current.rightSiderCollapsed).toBe(false);
  });

  it('initial collapsed state reads "true" from localStorage', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, 'true');

    const { result } = renderHook(() =>
      useWorkspaceCollapse({ workspaceEnabled: true, isMobile: false, conversationId: 'conv-1' })
    );

    expect(result.current.rightSiderCollapsed).toBe(true);
  });

  it('setRightSiderCollapsed updates state', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, 'true');

    const { result } = renderHook(() =>
      useWorkspaceCollapse({ workspaceEnabled: true, isMobile: false, conversationId: 'conv-1' })
    );

    expect(result.current.rightSiderCollapsed).toBe(true);

    act(() => {
      result.current.setRightSiderCollapsed(false);
    });

    expect(result.current.rightSiderCollapsed).toBe(false);
  });

  it('persists collapse state to localStorage on change', () => {
    const { result } = renderHook(() =>
      useWorkspaceCollapse({ workspaceEnabled: true, isMobile: false, conversationId: 'conv-1' })
    );

    act(() => {
      result.current.setRightSiderCollapsed(false);
    });

    expect(globalThis.localStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  it('force collapses when workspaceEnabled is false', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, 'false');

    const { result } = renderHook(() =>
      useWorkspaceCollapse({ workspaceEnabled: false, isMobile: false, conversationId: 'conv-1' })
    );

    // Even though localStorage says false, workspace disabled forces collapse
    expect(result.current.rightSiderCollapsed).toBe(true);
  });

  it('force collapses on mobile', () => {
    mockDetectMobile.mockReturnValue(true);
    globalThis.localStorage.setItem(STORAGE_KEY, 'false');

    const { result } = renderHook(() =>
      useWorkspaceCollapse({ workspaceEnabled: true, isMobile: true, conversationId: 'conv-1' })
    );

    // Mobile forces collapse regardless of localStorage
    expect(result.current.rightSiderCollapsed).toBe(true);
  });

  it('force collapses when switching to mobile mode', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, 'false');

    let isMobile = false;
    const { result, rerender } = renderHook(() =>
      useWorkspaceCollapse({ workspaceEnabled: true, isMobile, conversationId: 'conv-1' })
    );

    // Start expanded on desktop
    expect(result.current.rightSiderCollapsed).toBe(false);

    // Switch to mobile
    isMobile = true;
    rerender();

    expect(result.current.rightSiderCollapsed).toBe(true);
  });

  it('force collapses when workspace becomes disabled', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, 'false');

    let workspaceEnabled = true;
    const { result, rerender } = renderHook(() =>
      useWorkspaceCollapse({ workspaceEnabled, isMobile: false, conversationId: 'conv-1' })
    );

    expect(result.current.rightSiderCollapsed).toBe(false);

    // Disable workspace
    workspaceEnabled = false;
    rerender();

    expect(result.current.rightSiderCollapsed).toBe(true);
  });

  // Build #116 regression: the workflow Steps rail lives in this sider. It must
  // default EXPANDED (workspace-less workflows never fire the files auto-expand).
  describe('stepsRailMode (workflow Steps rail)', () => {
    const CONV_PREF_KEY = 'workspace-preference-conv-1';

    it('defaults EXPANDED, ignoring the collapsed global default', () => {
      globalThis.localStorage.setItem(STORAGE_KEY, 'true'); // plain-chat default = collapsed
      globalThis.localStorage.removeItem(CONV_PREF_KEY);

      const { result } = renderHook(() =>
        useWorkspaceCollapse({ workspaceEnabled: true, isMobile: false, conversationId: 'conv-1', stepsRailMode: true })
      );

      expect(result.current.rightSiderCollapsed).toBe(false);
    });

    it('defaults EXPANDED on mobile too (Steps must stay reachable)', () => {
      mockDetectMobile.mockReturnValue(true);
      globalThis.localStorage.removeItem(CONV_PREF_KEY);

      const { result } = renderHook(() =>
        useWorkspaceCollapse({ workspaceEnabled: true, isMobile: true, conversationId: 'conv-1', stepsRailMode: true })
      );

      expect(result.current.rightSiderCollapsed).toBe(false);
    });

    it('honors an explicit per-conversation collapse preference', () => {
      globalThis.localStorage.setItem('workspace-preference-conv-1', 'collapsed');

      const { result } = renderHook(() =>
        useWorkspaceCollapse({ workspaceEnabled: true, isMobile: false, conversationId: 'conv-1', stepsRailMode: true })
      );

      expect(result.current.rightSiderCollapsed).toBe(true);

      globalThis.localStorage.removeItem(CONV_PREF_KEY);
    });

    it('does not write the shared global collapse key', () => {
      globalThis.localStorage.removeItem(STORAGE_KEY);
      globalThis.localStorage.removeItem(CONV_PREF_KEY);

      const { result } = renderHook(() =>
        useWorkspaceCollapse({ workspaceEnabled: true, isMobile: false, conversationId: 'conv-1', stepsRailMode: true })
      );

      act(() => {
        result.current.setRightSiderCollapsed(true);
      });

      // Global default stays untouched so plain chats keep their own preference.
      expect(globalThis.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
