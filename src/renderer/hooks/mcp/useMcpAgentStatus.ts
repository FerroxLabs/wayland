import { useState, useEffect, useRef, useCallback } from 'react';
import { ConfigStorage } from '@/common/config/storage';
import { acpConversation, mcpService } from '@/common/adapter/ipcBridge';
import type { IMcpServer } from '@/common/config/storage';

/**
 * MCP Agent install-status management hook.
 * Manages install-status checks and caching for MCP servers across each agent.
 */
export const useMcpAgentStatus = () => {
  const [agentInstallStatus, setAgentInstallStatus] = useState<Record<string, string[]>>({});
  const [loadingServers, setLoadingServers] = useState<Set<string>>(new Set());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckTimeRef = useRef<number>(0);
  const agentConfigsCacheRef = useRef<Array<{ source: string; servers: Array<{ name: string }> }> | null>(null);

  // Load saved agent install status
  useEffect(() => {
    void ConfigStorage.get('mcp.agentInstallStatus')
      .then((status) => {
        if (status && typeof status === 'object') {
          setAgentInstallStatus(status as Record<string, string[]>);
        }
      })
      .catch(() => {
        // Handle loading error silently
      });
  }, []);

  // Persist agent install status to storage
  const saveAgentInstallStatus = useCallback((status: Record<string, string[]>) => {
    void ConfigStorage.set('mcp.agentInstallStatus', status).catch(() => {
      // Handle storage error silently
    });
    setAgentInstallStatus(status);
  }, []);

  // Generic helper to process agent configuration data
  const processAgentConfigs = useCallback(
    (
      servers: IMcpServer[],
      agentConfigs: Array<{ source: string; servers: Array<{ name: string }> }>,
      targetServerName?: string
    ) => {
      // Build new state from current state to avoid resetting status of other servers
      const installStatus: Record<string, string[]> = { ...agentInstallStatus };

      // Pre-build a server-name -> server-object map to avoid repeated find calls
      const serverMap = new Map<string, IMcpServer>();
      const serversToProcess = targetServerName ? servers.filter((s) => s.name === targetServerName) : servers;

      serversToProcess.forEach((server) => {
        if (server.enabled) {
          serverMap.set(server.name, server);
          installStatus[server.name] = [];
        } else {
          // If the target server is disabled, also remove it from status
          delete installStatus[server.name];
        }
      });

      // Inspect each agent's MCP config, only checking enabled servers
      agentConfigs.forEach((agentConfig) => {
        agentConfig.servers.forEach((agentServer) => {
          // Map lookup, O(1) time
          const localServer = serverMap.get(agentServer.name);
          // Only show install status when the local server exists and is enabled
          if (localServer && installStatus[agentServer.name] !== undefined) {
            installStatus[agentServer.name].push(agentConfig.source);
          }
        });
      });

      // Before saving detection results, filter out disabled servers to avoid overwriting user deletions
      const currentEnabledServers = new Set(servers.filter((s) => s.enabled).map((s) => s.name));
      const filteredInstallStatus: Record<string, string[]> = {};

      for (const [serverName, agents] of Object.entries(installStatus)) {
        if (currentEnabledServers.has(serverName)) {
          filteredInstallStatus[serverName] = agents;
        }
      }

      saveAgentInstallStatus(filteredInstallStatus);
    },
    [agentInstallStatus, saveAgentInstallStatus]
  );

  // Check which agents each MCP server is installed in
  const checkAgentInstallStatus = useCallback(
    async (servers: IMcpServer[], forceRefresh = false, targetServerName?: string) => {
      // Cache check: if checked within 5s and cache exists, use cache directly (unless force refresh)
      const now = Date.now();
      const CACHE_DURATION = 5000; // 5s cache

      if (!forceRefresh && agentConfigsCacheRef.current && now - lastCheckTimeRef.current < CACHE_DURATION) {
        // Recompute status using cached data
        processAgentConfigs(servers, agentConfigsCacheRef.current, targetServerName);
        return;
      }

      // Set loading state - mark only the target server if specified, otherwise mark all enabled servers
      const serversToLoad = targetServerName ? [targetServerName] : servers.filter((s) => s.enabled).map((s) => s.name);
      setLoadingServers((prev) => {
        const newSet = new Set(prev);
        serversToLoad.forEach((name) => newSet.add(name));
        return newSet;
      });

      try {
        // First fetch agents, then fetch MCP configs based on that result (cannot truly parallelize since the second depends on the first)
        const agentsResponse = await acpConversation.getAvailableAgents.invoke();

        if (!agentsResponse.success || !agentsResponse.data) {
          // If no agents detected, only clear state on the initial load
          if (Object.keys(agentInstallStatus).length === 0) {
            saveAgentInstallStatus({});
          }
          return;
        }

        const mcpConfigsResponse = await mcpService.getAgentMcpConfigs.invoke(agentsResponse.data);

        if (!mcpConfigsResponse.success || !mcpConfigsResponse.data) {
          // If fetching the MCP config fails, keep current state to avoid flicker
          return;
        }

        // Update cache
        agentConfigsCacheRef.current = mcpConfigsResponse.data;
        lastCheckTimeRef.current = now;

        // Process config data
        processAgentConfigs(servers, mcpConfigsResponse.data, targetServerName);
      } catch (error) {
        // On error, keep current state to avoid flicker
      } finally {
        // Clear loading state
        setLoadingServers((prev) => {
          const newSet = new Set(prev);
          serversToLoad.forEach((name) => newSet.delete(name));
          return newSet;
        });
      }
    },
    [agentInstallStatus, processAgentConfigs, saveAgentInstallStatus]
  );

  // Debounced status check to avoid frequent calls
  const debouncedCheckAgentInstallStatus = useCallback(
    (servers: IMcpServer[], forceRefresh = false, targetServerName?: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        checkAgentInstallStatus(servers, forceRefresh, targetServerName).catch(() => {
          // Silently handle errors
        });
      }, 300); // 300ms debounce
    },
    [checkAgentInstallStatus]
  );

  // Check install status for a single server only (no connection test or other operations)
  const checkSingleServerInstallStatus = useCallback(async (serverName: string) => {
    // Set loading state
    setLoadingServers((prev) => new Set(prev).add(serverName));

    try {
      // Fetch available agents
      const agentsResponse = await acpConversation.getAvailableAgents.invoke();
      if (!agentsResponse.success || !agentsResponse.data) {
        return;
      }

      // Fetch MCP configs for all agents
      const mcpConfigsResponse = await mcpService.getAgentMcpConfigs.invoke(agentsResponse.data);
      if (!mcpConfigsResponse.success || !mcpConfigsResponse.data) {
        return;
      }

      // Only inspect the install status of the specified server
      const installedAgents: string[] = [];
      mcpConfigsResponse.data.forEach((agentConfig) => {
        const hasServer = agentConfig.servers.some((server) => server.name === serverName);
        if (hasServer) {
          installedAgents.push(agentConfig.source);
        }
      });

      // Update install status for this server
      setAgentInstallStatus((prev) => {
        const updated = { ...prev };
        if (installedAgents.length > 0) {
          updated[serverName] = installedAgents;
        } else {
          delete updated[serverName];
        }

        // Also update local storage
        void ConfigStorage.set('mcp.agentInstallStatus', updated).catch(() => {
          // Handle storage error silently
        });

        return updated;
      });
    } catch (error) {
      // Silently handle check failures
    } finally {
      // Clear loading state
      setLoadingServers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(serverName);
        return newSet;
      });
    }
  }, []);

  // Check whether a specific server is currently loading
  const isServerLoading = useCallback(
    (serverName: string) => {
      return loadingServers.has(serverName);
    },
    [loadingServers]
  );

  return {
    agentInstallStatus,
    setAgentInstallStatus,
    loadingServers,
    isServerLoading,
    checkAgentInstallStatus,
    debouncedCheckAgentInstallStatus,
    checkSingleServerInstallStatus,
  };
};
