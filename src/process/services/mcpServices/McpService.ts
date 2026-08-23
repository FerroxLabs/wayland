/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { execSync } from 'child_process';
// `os.homedir()` survives in this file at TWO call sites, and only those two,
// both handing the USER's OWN home to `normalizeMcpServerForSpawn`. That
// function expands a leading `~` inside an MCP server's own allowed-directory
// arguments - the filesystem connector's `~/Documents` means the customer's
// Documents folder. It is NOT a third-party agent config root, and routing it
// through `agentConfigRoot()` would silently point a customer's filesystem
// server at a test sandbox. Every path that names another product's config
// goes through `./agentConfigRoot`.
import * as os from 'node:os';
import type { IMcpServer } from '@/common/config/storage';
import { ClaudeMcpAgent } from './agents/ClaudeMcpAgent';
import { CodebuddyMcpAgent } from './agents/CodebuddyMcpAgent';
import { QwenMcpAgent } from './agents/QwenMcpAgent';
import { GeminiMcpAgent } from './agents/GeminiMcpAgent';
import { WaylandMcpAgent } from './agents/WaylandMcpAgent';
import { CodexMcpAgent } from './agents/CodexMcpAgent';
import { OpencodeMcpAgent } from './agents/OpencodeMcpAgent';
import { WCoreMcpAgent } from './agents/WCoreMcpAgent';
import type {
  IMcpProtocol,
  DetectedMcpServer,
  McpConnectionTestResult,
  McpOperationResult,
  McpSyncResult,
  McpSource,
} from './McpProtocol';
import { isRetryableMcpOutcome, mcpAgentOperationSucceeded } from './McpProtocol';
import type { McpAgentOutcome } from './McpProtocol';
import { validateMcpServer, sanitizeMcpServerName } from './validateMcpServer';
import { normalizeMcpServerForSpawn } from '@/common/mcp/normalizeMcpServer';
import { applyBuiltinMcpRuntime } from '@process/services/mcpServices/builtinMcpRuntime';
import { mcpServerCollisionKey } from '@/common/mcp';
import { bindMcpPrepublicationProbeTruth } from './mcpSessionTruthGate';

/**
 * How long one agent CLI gets to accept a publication before the fan-out stops
 * waiting on it. Matches the agents' own class-level command budget.
 */
export const MCP_AGENT_PUBLICATION_DEADLINE_MS = 45_000;

/**
 * Bound ONE agent's publication.
 *
 * The fan-out below is a `Promise.all`, so before this existed a single agent
 * CLI that never returned hung the entire publication forever - and the
 * renderer publishes BEFORE committing `enabled: true`, so that hang meant no
 * commit, no rollback, no toast and no change to `updatedAt` (#B4c).
 *
 * The deadline is PER AGENT and it RESOLVES rather than rejecting: an
 * aggregate deadline would still let one starving agent consume the whole
 * budget for everyone, and a rejection here would be indistinguishable from a
 * CLI that answered with a real error.
 */
function withAgentPublicationDeadline(
  agentName: string,
  publication: Promise<McpOperationResult>,
  deadlineMs: number = MCP_AGENT_PUBLICATION_DEADLINE_MS
): Promise<McpOperationResult> {
  return new Promise<McpOperationResult>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      console.warn(`[McpService] MCP operation on "${agentName}" exceeded ${deadlineMs}ms; continuing without it`);
      resolve({
        success: false,
        outcome: 'timed-out',
        error: `${agentName} did not answer within ${deadlineMs}ms, so its config was left unchanged and unverified. Retry.`,
      });
    }, deadlineMs);
    // An unref'd timer must not keep the process alive on its own.
    timer.unref?.();
    const finish = (result: McpOperationResult): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    publication.then(finish, (error: unknown) =>
      finish({ success: false, error: error instanceof Error ? error.message : String(error) })
    );
  });
}

/**
 * MCP service - coordinates the MCP operation protocol across agents
 * New architecture: this layer only defines the protocol; implementations live in each Agent class
 *
 * Agent types:
 * - AcpBackend ('claude', 'qwen', 'gemini', 'codex', etc.): supported ACP backends
 * - 'wayland': @office-ai/aioncli-core (Wayland's locally managed Gemini implementation)
 */
export class McpService {
  private agents: Map<McpSource, IMcpProtocol>;

  /**
   * Service-level operation lock to serialize heavy MCP operations.
   * Prevents concurrent getAgentMcpConfigs / syncMcpToAgents / removeMcpFromAgents
   * which would otherwise spawn dozens of child processes simultaneously,
   * causing resource exhaustion and potential system freezes.
   */
  private operationQueue: Promise<unknown> = Promise.resolve();

  private withServiceLock<T>(operation: () => Promise<T>): Promise<T> {
    const queued = this.operationQueue.then(operation, () => operation());
    // Keep the queue moving even if the operation rejects
    this.operationQueue = queued.catch(() => {});
    return queued;
  }

  private isCliAvailable(cliCommand: string): boolean {
    const isWindows = process.platform === 'win32';
    const whichCommand = isWindows ? 'where' : 'which';

    // Keep original behavior: prefer where/which, then fallback on Windows to Get-Command.
    try {
      execSync(`${whichCommand} ${cliCommand}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 1000,
      });
      return true;
    } catch {
      if (!isWindows) return false;
    }

    if (isWindows) {
      try {
        // PowerShell fallback for shim scripts like *.ps1 (vfox)
        execSync(
          `powershell -NoProfile -NonInteractive -Command "Get-Command -All ${cliCommand} | Select-Object -First 1 | Out-Null"`,
          {
            encoding: 'utf-8',
            stdio: 'pipe',
            timeout: 1000,
          }
        );
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  constructor() {
    this.agents = new Map([
      ['claude', new ClaudeMcpAgent()],
      ['codebuddy', new CodebuddyMcpAgent()],
      ['qwen', new QwenMcpAgent()],
      ['gemini', new GeminiMcpAgent()],
      ['wayland', new WaylandMcpAgent()], // Wayland local @office-ai/aioncli-core
      ['codex', new CodexMcpAgent()],
      ['opencode', new OpencodeMcpAgent()],
      ['wcore', new WCoreMcpAgent()], // Wayland Core (Rust binary, TOML config)
    ]);
  }

  /**
   * Get the agent instance for a specific backend
   */
  private getAgent(backend: McpSource): IMcpProtocol | undefined {
    return this.agents.get(backend);
  }

  /**
   * Get the correct MCP agent instance based on agent config.
   * Fork Gemini (cliPath=undefined) uses WaylandMcpAgent.
   * Native Gemini (cliPath='gemini') uses GeminiMcpAgent.
   */
  private getAgentForConfig(agent: { backend: string; cliPath?: string }): IMcpProtocol | undefined {
    // Fork Gemini uses WaylandMcpAgent to manage MCP config
    if (agent.backend === 'gemini' && !agent.cliPath) {
      return this.agents.get('wayland');
    }
    return this.agents.get(agent.backend as McpSource);
  }

  /**
   * Ensure native Gemini CLI is in the agent list (if installed but not present).
   * AcpDetector returns fork Gemini (cliPath=undefined), but MCP operations need native Gemini CLI too.
   */
  private addNativeGeminiIfNeeded(
    agents: Array<{ backend: string; name: string; cliPath?: string }>
  ): Array<{ backend: string; name: string; cliPath?: string }> {
    const hasNativeGemini = agents.some((a) => a.backend === 'gemini' && a.cliPath === 'gemini');
    if (hasNativeGemini) return agents;

    try {
      if (!this.isCliAvailable('gemini')) return agents;

      const allAgents = [
        ...agents,
        {
          backend: 'gemini',
          name: 'Google Gemini CLI',
          cliPath: 'gemini',
        },
      ];
      console.log('[McpService] Added native Gemini CLI to agent list');
      return allAgents;
    } catch {
      return agents;
    }
  }

  /**
   * Resolve which MCP agent should be used for config detection and how it
   * should be reported back to the renderer.
   */
  private getDetectionTarget(agent: { backend: string; cliPath?: string }): {
    agentInstance: IMcpProtocol | undefined;
    source: McpSource;
  } {
    const agentInstance = this.getAgentForConfig(agent);
    const source: McpSource = agent.backend === 'gemini' && !agent.cliPath ? 'gemini' : (agent.backend as McpSource);
    return { agentInstance, source };
  }

  /**
   * Merge detection results by source so the UI sees a single entry per agent.
   * This also prevents duplicate Gemini rows when both built-in Gemini and the
   * native Gemini CLI expose the same MCP server names.
   */
  private mergeDetectedServers(results: DetectedMcpServer[]): DetectedMcpServer[] {
    const merged = new Map<McpSource, Map<string, IMcpServer>>();

    results.forEach((result) => {
      const serversByName = merged.get(result.source) ?? new Map<string, IMcpServer>();

      result.servers.forEach((server) => {
        const collisionKey = mcpServerCollisionKey(server.name);
        if (!server.id || !collisionKey) throw new Error(`Invalid MCP detection result for source "${result.source}"`);
        const existing = serversByName.get(collisionKey);
        if (existing && JSON.stringify(existing) !== JSON.stringify(server)) {
          throw new Error(
            `Conflicting MCP detection results for source "${result.source}" and server "${server.name}"`
          );
        }
        serversByName.set(collisionKey, existing ?? server);
      });

      merged.set(result.source, serversByName);
    });

    return Array.from(merged.entries()).map(([source, serversByName]) => ({
      source,
      servers: Array.from(serversByName.values()),
    }));
  }

  /**
   * Get MCP configuration from detected ACP agents (concurrent version)
   *
   * Note: this method also detects the native Gemini CLI's MCP configuration,
   * even when it is disabled in ACP config (because fork Gemini is used for ACP).
   */
  getAgentMcpConfigs(
    agents: Array<{
      backend: string;
      name: string;
      cliPath?: string;
    }>
  ): Promise<DetectedMcpServer[]> {
    return this.withServiceLock(async () => {
      // Build the full detection list, including ACP agents plus the native Gemini CLI
      const allAgentsToCheck = this.addNativeGeminiIfNeeded(agents);

      // Run MCP detection across all agents concurrently
      const promises = allAgentsToCheck.map(async (agent): Promise<DetectedMcpServer> => {
        try {
          const { agentInstance, source } = this.getDetectionTarget(agent);
          if (!agentInstance) {
            throw new Error(`MCP detection is not supported for backend "${agent.backend}"`);
          }

          const servers = await agentInstance.detectMcpServers(agent.cliPath);
          console.log(
            `[McpService] Detected ${servers.length} MCP servers for ${agent.backend} (cliPath: ${agent.cliPath || 'default'})`
          );

          return { source, servers };
        } catch (error) {
          console.warn(`[McpService] Failed to detect MCP servers for ${agent.backend}:`, error);
          throw new Error(
            `Incomplete MCP detection for backend "${agent.backend}": ${error instanceof Error ? error.message : String(error)}`,
            { cause: error }
          );
        }
      });

      const results = await Promise.all(promises);
      return this.mergeDetectedServers(results);
    });
  }

  /**
   * Get supported transport types for a given agent config.
   * Fork Gemini (backend='gemini', no cliPath) uses WaylandMcpAgent.
   */
  getSupportedTransportsForAgent(agent: { backend: string; cliPath?: string }): string[] {
    const agentInstance = this.getAgentForConfig(agent as { backend: string; cliPath?: string });
    return agentInstance ? agentInstance.getSupportedTransports() : [];
  }

  /**
   * Test connection to an MCP server
   */
  async testMcpConnection(server: IMcpServer): Promise<McpConnectionTestResult> {
    // A probe is an operation on an exact saved declaration. Validate before
    // normalization/spawn so malformed or unsafe declarations cannot acquire
    // probe truth merely because an adapter happened to tolerate them.
    validateMcpServer(server);
    // Use the first available agent to test the connection; the test logic in the base class is generic
    const firstAgent = this.agents.values().next().value;
    if (firstAgent) {
      // Translate a stored declaration into the transport that must actually be
      // spawned (e.g. the filesystem server's allowed directories moved from the
      // ineffective ALLOWED_DIRS env var to positional args, defaulting to home)
      // BEFORE probing, so the Library "Needs attention" status reflects the real
      // spawn instead of failing with "Connection closed" (#448).
      const spawnable = normalizeMcpServerForSpawn(server, os.homedir());
      // Reuse Wayland's stored OAuth bearer for the test, exactly like
      // syncMcpToAgents does. Without it, an already-authorized hosted server
      // (Notion/Canva/...) 401s here, reports needsAuth, and the stored status
      // never advances to 'connected' - so the Library UI shows "Not connected"
      // even though every agent CLI has the server connected.
      const authedServer = await this.attachOAuthToken(spawnable);
      const rawResult = await firstAgent.testMcpConnection(authedServer);
      return bindMcpPrepublicationProbeTruth(server, rawResult);
    }
    return bindMcpPrepublicationProbeTruth(server, {
      success: false,
      error: 'No agent available for connection testing',
    });
  }

  /**
   * Sync MCP configuration to all detected agents
   */
  syncMcpToAgents(
    mcpServers: IMcpServer[],
    agents: Array<{
      backend: string;
      name: string;
      cliPath?: string;
    }>
  ): Promise<McpSyncResult> {
    // Only sync enabled MCP servers. Sanitize each name into the conservative
    // identifier the agent CLIs require BEFORE validating - a stored server can
    // carry a raw catalog id with a slash (e.g. "com.slack/slack-mcp") that
    // older installs / JSON imports never sanitized, which would otherwise crash
    // every sync. removeMcpFromAgents applies the same transform so the keys match.
    const enabledServers = mcpServers
      .filter((server) => server.enabled)
      .map((server) =>
        normalizeMcpServerForSpawn({ ...server, name: sanitizeMcpServerName(server.name) }, os.homedir())
      );

    if (enabledServers.length === 0) {
      return Promise.resolve({
        success: false,
        results: [
          { agent: 'mcp-service', success: false, error: 'No enabled MCP server was supplied for publication' },
        ],
      });
    }

    // Reject command-injection-prone names / non-http(s) URLs before any agent
    // builds a CLI invocation from them (SEC-MCP-01 pre-sync guard).
    for (const server of enabledServers) {
      validateMcpServer(server);
    }

    return this.withServiceLock(async () => {
      // Ensure native Gemini CLI is also in the sync list
      const allAgents = this.addNativeGeminiIfNeeded(agents);
      if (allAgents.length === 0) {
        return {
          success: false,
          results: [{ agent: 'mcp-service', success: false, error: 'No MCP publication target is available' }],
        };
      }

      // Attach the OAuth bearer for already-authorized servers so the agent
      // CLIs reuse Wayland's token instead of starting their OWN ephemeral-port
      // OAuth flow. That second flow's callback server is torn down before the
      // user finishes authorizing in the browser, so the redirect hits a dead
      // port (ERR_CONNECTION_REFUSED) and the MCP never connects even though
      // Wayland's own login succeeded. Injecting the token we already hold makes
      // the engine skip its OAuth entirely.
      // #1008: Wayland's own bundled MCP servers are stored as bare `node`, which
      // does not exist on a stock macOS. Rewrite them onto the resolved JS runtime
      // (the SAME tuple the Library probe spawns) before any agent serializes them,
      // so all eight CLI publication targets emit a command that can actually run.
      // Applied AFTER validateMcpServer so validation still grades the user-visible
      // declaration, never Wayland's own trusted runtime path.
      const spawnableServers = enabledServers.map((server) => applyBuiltinMcpRuntime(server));
      const authedServers = await this.attachOAuthTokens(spawnableServers);

      // Run MCP sync across all agents concurrently
      const promises = allAgents.map(async (agent) => {
        try {
          // Use getAgentForConfig to correctly distinguish fork Gemini from native Gemini
          const agentInstance = this.getAgentForConfig(agent);
          if (!agentInstance) {
            console.warn(`[McpService] Skipping MCP sync for unsupported backend: ${agent.backend}`);
            return {
              agent: agent.name,
              success: false,
              unsupported: true,
              outcome: 'unsupported' as McpAgentOutcome,
              error: `MCP publication is not supported for backend "${agent.backend}"`,
            };
          }

          const result = await withAgentPublicationDeadline(
            agent.name,
            agentInstance.installMcpServers(authedServers)
          );
          const outcome: McpAgentOutcome = result.outcome ?? (result.success ? 'applied' : 'failed');
          return {
            agent: agent.name,
            success: result.success,
            error: result.error,
            outcome,
            retryable: isRetryableMcpOutcome(outcome),
          };
        } catch (error) {
          return {
            agent: agent.name,
            success: false,
            outcome: 'failed' as McpAgentOutcome,
            retryable: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

      const results = await Promise.all(promises);

      return { success: mcpAgentOperationSucceeded(results), results };
    });
  }

  /**
   * Attach the stored OAuth bearer to http/sse/streamable_http servers that
   * Wayland has already authorized, so the agent CLIs reuse it instead of
   * starting their own OAuth. Servers with no stored token, and servers that
   * already carry an explicit Authorization header (BYO), are returned
   * unchanged. The original server objects are never mutated.
   */
  /**
   * Public: return the servers with each one's CURRENT (refreshed) OAuth bearer
   * attached to its transport headers. Used by the ACP session builder to pass a
   * live-tokened hosted MCP into `session/new`, so the chat connects with a fresh
   * token instead of the stale one baked into a CLI/engine config at sync time.
   */
  attachOAuthTokens(servers: IMcpServer[]): Promise<IMcpServer[]> {
    return Promise.all(servers.map((server) => this.attachOAuthToken(server)));
  }

  /**
   * Single-server variant of {@link attachOAuthTokens}. Returns the server with
   * the stored OAuth bearer attached when one is held and no explicit
   * Authorization header is already present; otherwise returns it unchanged.
   * Never mutates the input.
   */
  private async attachOAuthToken(server: IMcpServer): Promise<IMcpServer> {
    const transport = server.transport;
    if (transport.type !== 'http' && transport.type !== 'sse' && transport.type !== 'streamable_http') {
      return server;
    }
    const headers = transport.headers ?? {};
    // Prefer a FRESH OAuth token from Wayland's token store over any Authorization
    // header already baked into the record. The connect flow persists the bearer
    // into the server's transport; once it expires, leaving it in place both masks
    // the refresh (we'd skip getValidToken) and keeps sending the dead token, which
    // the server rejects as invalid_token - the endless "sign in again" loop. Since
    // getValidToken refreshes an expired token, this keeps the bearer current. Only
    // when there is NO stored OAuth token do we respect a user-supplied (BYO)
    // Authorization header as-is. The original server object is never mutated.
    //
    // Import McpOAuthService dynamically (not at module top level): it pulls the
    // aioncli-core OAuth chain whose OAuthCredentialStorage static initializer
    // references HybridTokenStorage, and a top-level import triggers a
    // module-init TDZ ("Cannot access 'HybridTokenStorage' before initialization")
    // in any module that imports McpService. Deferring the import past the
    // non-http early return keeps the chain out of module load.
    const { mcpOAuthService } = await import('./McpOAuthService');
    const token = await mcpOAuthService.getValidToken(server).catch((): string | null => null);
    if (!token) {
      return server;
    }
    const nonAuthHeaders = Object.fromEntries(
      Object.entries(headers).filter(([k]) => k.toLowerCase() !== 'authorization')
    );
    return {
      ...server,
      transport: { ...transport, headers: { ...nonAuthHeaders, Authorization: `Bearer ${token}` } },
    };
  }

  /**
   * Remove MCP configuration from all detected agents
   */
  removeMcpFromAgents(
    mcpServerName: string,
    agents: Array<{
      backend: string;
      name: string;
      cliPath?: string;
    }>
  ): Promise<McpSyncResult> {
    // Match the key syncMcpToAgents wrote so a server installed under a
    // sanitized name (e.g. com.slack/slack-mcp -> com.slack-slack-mcp) is
    // actually found and removed from each agent config.
    const safeName = sanitizeMcpServerName(mcpServerName);
    return this.withServiceLock(async () => {
      // Ensure native Gemini CLI is also in the removal list
      const allAgents = this.addNativeGeminiIfNeeded(agents);

      // Run MCP removal across all agents concurrently.
      //
      // The agent is named by its DISPLAY NAME only, matching the publication
      // path. This path used to label it `${agent.backend}:${agent.name}`,
      // which is how the user's banner opened with the stutter
      // "claude:Claude Code: user/com.ferroxlabs-tvcontrol: failed: ...".
      const promises = allAgents.map(async (agent) => {
        try {
          // Use getAgentForConfig to correctly distinguish fork Gemini from native Gemini
          const agentInstance = this.getAgentForConfig(agent);
          if (!agentInstance) {
            console.warn(`[McpService] Skipping MCP removal for unsupported backend: ${agent.backend}`);
            return {
              agent: agent.name,
              success: false,
              unsupported: true,
              outcome: 'unsupported' as McpAgentOutcome,
              error: `MCP removal is not supported for backend "${agent.backend}"`,
            };
          }

          // The SAME per-agent deadline the publication path has carried since
          // #B4c. It was never applied here, so one agent CLI that never
          // returned hung a REMOVAL forever - and removal is the rollback half
          // of publication, so that hang stranded the connector mid-rollback
          // with no toast and no way forward.
          const result = await withAgentPublicationDeadline(agent.name, agentInstance.removeMcpServer(safeName));
          const outcome: McpAgentOutcome = result.outcome ?? (result.success ? 'applied' : 'failed');
          return {
            agent: agent.name,
            success: result.success,
            error: result.error,
            outcome,
            retryable: isRetryableMcpOutcome(outcome),
          };
        } catch (error) {
          return {
            agent: agent.name,
            success: false,
            outcome: 'failed' as McpAgentOutcome,
            retryable: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

      const results = await Promise.all(promises);

      // S12: mirror the sync path (syncMcpToAgents) - a per-agent removal that
      // failed is captured in results[] with success:false, but returning a
      // hardcoded `success: true` hid it, so the renderer reported "deleted"
      // while the server stayed in that agent's CLI config (Claude/Codex/wcore
      // drift). Reflect overall success from the per-agent results.
      //
      // Shares mcpAgentOperationSucceeded with the sync path. This path was
      // missed when the non-target exclusion was first applied, and because the
      // renderer throws on `!removeResponse.success` BEFORE it looks at the
      // per-result list, filtering only the list left rollback still failing.
      //
      // `emptyIsSuccess` because removing from no agents at all removed
      // everything there was to remove. The sync path deliberately does NOT
      // pass it: publishing to nothing published nothing.
      return { success: mcpAgentOperationSucceeded(results, { emptyIsSuccess: true }), results };
    });
  }
}

export const mcpService = new McpService();
