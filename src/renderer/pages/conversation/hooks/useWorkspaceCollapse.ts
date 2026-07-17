import { STORAGE_KEYS } from '@/common/config/storageKeys';
import { blurActiveElement } from '@/renderer/utils/ui/focus';
import {
  WORKSPACE_HAS_FILES_EVENT,
  WORKSPACE_TOGGLE_EVENT,
  dispatchWorkspaceStateEvent,
  type WorkspaceHasFilesDetail,
} from '@/renderer/utils/workspace/workspaceEvents';
import { detectMobileViewportOrTouch } from '@/renderer/pages/conversation/utils/detectPlatform';
import { useEffect, useRef, useState } from 'react';

type UseWorkspaceCollapseParams = {
  workspaceEnabled: boolean;
  isMobile: boolean;
  conversationId?: string;
  /**
   * Build #116 regression fix. When the right sider hosts the workflow Steps
   * rail (a workspace-less workflow keeps its Steps here), it must be VISIBLE by
   * default - the shared "collapsed" default would otherwise hide the rail until
   * the user manually toggled it. In this mode the sider defaults EXPANDED
   * (desktop and mobile) unless the user set an explicit per-conversation
   * collapse preference, it never auto-collapses to hide the rail, and it does
   * not write the shared global collapse key (which would leak into plain chats).
   */
  stepsRailMode?: boolean;
};

type UseWorkspaceCollapseReturn = {
  rightSiderCollapsed: boolean;
  setRightSiderCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

/**
 * Manages workspace panel collapse/expand state including localStorage persistence,
 * toggle events, file-based auto-expand, and mobile-specific behavior.
 */
export function useWorkspaceCollapse({
  workspaceEnabled,
  isMobile,
  conversationId,
  stepsRailMode = false,
}: UseWorkspaceCollapseParams): UseWorkspaceCollapseReturn {
  // Workspace panel collapse state - globally persisted
  const [rightSiderCollapsed, setRightSiderCollapsed] = useState(() => {
    // Steps rail sider: default EXPANDED so a workspace-less workflow shows its
    // Steps rail on mount. Honor an explicit per-conversation preference, but
    // ignore the shared global collapse key (it belongs to plain chats).
    if (stepsRailMode) {
      if (conversationId) {
        try {
          const pref = localStorage.getItem(`workspace-preference-${conversationId}`);
          if (pref === 'collapsed') return true;
          if (pref === 'expanded') return false;
        } catch {
          // ignore errors
        }
      }
      // Mobile: start COLLAPSED so the workflow doesn't open with the Steps rail
      // overlaying the chat full-screen (a narrow viewport can't show both). The
      // user reopens it in one tap via the titlebar workspace toggle, which fires
      // WORKSPACE_TOGGLE_EVENT (handled below) - see #116 mobile gate. Desktop
      // keeps it expanded.
      if (detectMobileViewportOrTouch()) {
        return true;
      }
      return false;
    }
    if (detectMobileViewportOrTouch()) {
      return true;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WORKSPACE_PANEL_COLLAPSE);
      if (stored !== null) {
        return stored === 'true';
      }
    } catch {
      // ignore errors
    }
    return true; // default collapsed
  });

  // Current active conversation ID (for recording user manual operation preference)
  const currentConversationIdRef = useRef<string | undefined>(undefined);

  // Mirror ref for collapse state
  const rightCollapsedRef = useRef(rightSiderCollapsed);

  // Keep ref in sync
  useEffect(() => {
    rightCollapsedRef.current = rightSiderCollapsed;
  }, [rightSiderCollapsed]);

  // Track the active conversation for the toggle handler. Previously this ref was
  // only populated by the has-files event, so a one-tap toggle (e.g. the mobile
  // titlebar affordance, #116) before any files event - the normal mobile case,
  // where files auto-expand is suppressed - recorded no per-conversation
  // preference, and the open/collapse choice was silently lost on the next
  // conversation switch. Sync it from the prop so the preference always persists.
  useEffect(() => {
    currentConversationIdRef.current = conversationId;
  }, [conversationId]);

  // Listen for workspace toggle events
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleWorkspaceToggle = () => {
      if (!workspaceEnabled) {
        return;
      }
      setRightSiderCollapsed((prev) => {
        const newState = !prev;
        // Record user manual operation preference
        const convId = currentConversationIdRef.current;
        if (convId) {
          try {
            localStorage.setItem(`workspace-preference-${convId}`, newState ? 'collapsed' : 'expanded');
          } catch {
            // ignore errors
          }
        }
        return newState;
      });
    };
    window.addEventListener(WORKSPACE_TOGGLE_EVENT, handleWorkspaceToggle);
    return () => {
      window.removeEventListener(WORKSPACE_TOGGLE_EVENT, handleWorkspaceToggle);
    };
  }, [workspaceEnabled]);

  // Auto expand/collapse workspace panel based on files state (user preference takes priority)
  useEffect(() => {
    if (typeof window === 'undefined' || !workspaceEnabled) {
      return undefined;
    }
    const handleHasFiles = (event: Event) => {
      const detail = (event as CustomEvent<WorkspaceHasFilesDetail>).detail;
      const convId = detail.conversationId;

      // Update current conversation ID
      currentConversationIdRef.current = convId;

      // Mobile: always keep workspace collapsed to avoid covering main chat area.
      // Skipped in steps-rail mode so the workflow's Steps rail stays reachable.
      if (isMobile && !stepsRailMode) {
        if (!rightCollapsedRef.current) {
          setRightSiderCollapsed(true);
        }
        return;
      }

      // Check if user has manual preference
      let userPreference: 'expanded' | 'collapsed' | null = null;
      if (convId) {
        try {
          const stored = localStorage.getItem(`workspace-preference-${convId}`);
          if (stored === 'expanded' || stored === 'collapsed') {
            userPreference = stored;
          }
        } catch {
          // ignore errors
        }
      }

      // If user has preference, use it; otherwise decide by file state
      if (userPreference) {
        const shouldCollapse = userPreference === 'collapsed';
        if (shouldCollapse !== rightSiderCollapsed) {
          setRightSiderCollapsed(shouldCollapse);
        }
      } else {
        // No user preference: expand if has files, collapse if not. In
        // steps-rail mode never auto-collapse - that would hide the Steps rail.
        // Never auto-EXPAND on mobile: a narrow viewport can't show chat and the
        // workspace/Steps side-by-side, so surfacing files here would overlay the
        // chat full-screen (the #593 mobile regression). Desktop still expands.
        if (detail.hasFiles && rightSiderCollapsed && !isMobile) {
          setRightSiderCollapsed(false);
        } else if (!detail.hasFiles && !rightSiderCollapsed && !stepsRailMode) {
          setRightSiderCollapsed(true);
        }
      }
    };
    window.addEventListener(WORKSPACE_HAS_FILES_EVENT, handleHasFiles);
    return () => {
      window.removeEventListener(WORKSPACE_HAS_FILES_EVENT, handleHasFiles);
    };
  }, [isMobile, workspaceEnabled, rightSiderCollapsed, stepsRailMode]);

  // Broadcast workspace state event
  useEffect(() => {
    if (!workspaceEnabled) {
      dispatchWorkspaceStateEvent(true);
      return;
    }
    dispatchWorkspaceStateEvent(rightSiderCollapsed);
  }, [rightSiderCollapsed, workspaceEnabled]);

  // Persist workspace panel collapse state. Skipped in steps-rail mode: the
  // workflow's default-expanded Steps sider must not overwrite the shared global
  // collapse default that plain chats read.
  useEffect(() => {
    if (stepsRailMode) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.WORKSPACE_PANEL_COLLAPSE, String(rightSiderCollapsed));
    } catch {
      // ignore errors
    }
  }, [rightSiderCollapsed, stepsRailMode]);

  // Force collapse when workspace is disabled
  useEffect(() => {
    if (!workspaceEnabled) {
      setRightSiderCollapsed(true);
    }
  }, [workspaceEnabled]);

  // Mobile: force collapse when entering mobile mode. Applies in steps-rail mode
  // too - on a narrow viewport the Steps rail must not overlay the chat.
  useEffect(() => {
    if (!workspaceEnabled || !isMobile || rightCollapsedRef.current) {
      return;
    }
    setRightSiderCollapsed(true);
  }, [isMobile, workspaceEnabled, stepsRailMode]);

  // Mobile: force collapse workspace on conversation switch to prevent overlay.
  // Applies in steps-rail mode too so a switched-to workflow doesn't reopen the
  // Steps rail full-screen over the chat.
  useEffect(() => {
    if (!workspaceEnabled || !isMobile) {
      return;
    }
    setRightSiderCollapsed(true);
  }, [conversationId, isMobile, workspaceEnabled, stepsRailMode]);

  // Mobile: blur active element on conversation switch to prevent soft keyboard
  useEffect(() => {
    if (!isMobile) {
      return;
    }
    const rafId = requestAnimationFrame(() => {
      blurActiveElement();
    });
    return () => cancelAnimationFrame(rafId);
  }, [conversationId, isMobile]);

  return { rightSiderCollapsed, setRightSiderCollapsed };
}
