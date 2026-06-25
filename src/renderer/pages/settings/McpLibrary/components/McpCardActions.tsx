import React, { createContext, useContext } from 'react';
import type { IMcpServer } from '@/common/config/storage';

/**
 * Card-level actions for the MCP Library Browse cards, provided once at the page
 * level so each `McpCard` can offer a quick on/off toggle + right-click menu
 * without every grid/section in between having to thread the handlers down.
 */
export interface McpCardActions {
  /** Installed server for a catalog entry id, when one exists. */
  serverFor: (libraryEntryId: string) => IMcpServer | undefined;
  /** Enable/disable an installed server (syncs/removes it from the agents). */
  onToggle: (serverId: string, enabled: boolean) => void;
  /** Re-run the connection test for an installed server (the card's Reconnect affordance). */
  onReconnect: (server: IMcpServer) => void;
  /** Permanently remove an installed server. */
  onRemove: (serverId: string) => void;
  /** Open the entry's detail page (install / configure / disconnect lifecycle). */
  onConfigure: (libraryEntryId: string) => void;
}

const McpCardActionsContext = createContext<McpCardActions | null>(null);

export function McpCardActionsProvider({
  value,
  children,
}: {
  value: McpCardActions;
  children: React.ReactNode;
}) {
  return <McpCardActionsContext.Provider value={value}>{children}</McpCardActionsContext.Provider>;
}

/** Returns the card actions, or `null` when rendered outside a provider. */
export function useMcpCardActions(): McpCardActions | null {
  return useContext(McpCardActionsContext);
}
