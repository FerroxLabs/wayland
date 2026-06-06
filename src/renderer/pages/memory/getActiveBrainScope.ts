/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Memory scope resolver - answers "which brain should the Memory page
 * query?" by inspecting the active conversation context.
 *
 * Wayland's renderer keeps the active workspace path on
 * `useConversationContextSafe().workspace` (set by `useWorkspaceSelector`
 * when the user picks a project folder for a chat). When that value is
 * present the resolver returns `{ scope: 'project', path: workspace }` so
 * Wave 5's `ipcBridge.ijfw.brainInvoke` call scopes memory queries to the
 * project brain. Otherwise it returns the global app brain.
 *
 * The hook is consumed by `MemoryPage` (Task 3.1) and - in Wave 5 - by the
 * full panel shell's memory-fetching effects.
 */

import { useConversationContextSafe } from '@renderer/hooks/context/ConversationContext';

/** Output of {@link useActiveBrainScope}. */
export type BrainScope = { scope: 'app' | 'project'; path: string };

/** App-scope sentinel - Wave 5 IJFW client treats `/` as the global brain. */
const APP_SCOPE: BrainScope = { scope: 'app', path: '/' };

/**
 * Resolves the brain scope for the current renderer view.
 *
 * Safe to call outside `ConversationProvider` - falls back to the app brain.
 */
export const useActiveBrainScope = (): BrainScope => {
  const conversation = useConversationContextSafe();
  const workspace = conversation?.workspace;
  if (typeof workspace === 'string' && workspace.length > 0) {
    return { scope: 'project', path: workspace };
  }
  return APP_SCOPE;
};
