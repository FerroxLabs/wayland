export const WORKSPACE_TOGGLE_EVENT = 'wayland-workspace-toggle';
export const WORKSPACE_STATE_EVENT = 'wayland-workspace-state';
export const WORKSPACE_HAS_FILES_EVENT = 'wayland-workspace-has-files';

export interface WorkspaceStateDetail {
  collapsed: boolean;
}

export interface WorkspaceHasFilesDetail {
  hasFiles: boolean;
  conversationId?: string;
}

export function dispatchWorkspaceToggleEvent() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(WORKSPACE_TOGGLE_EVENT));
}

export function dispatchWorkspaceStateEvent(collapsed: boolean) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<WorkspaceStateDetail>(WORKSPACE_STATE_EVENT, { detail: { collapsed } }));
}

/**
 * Dispatch when workspace files status changes
 */
export function dispatchWorkspaceHasFilesEvent(hasFiles: boolean, conversationId?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<WorkspaceHasFilesDetail>(WORKSPACE_HAS_FILES_EVENT, { detail: { hasFiles, conversationId } })
  );
}
