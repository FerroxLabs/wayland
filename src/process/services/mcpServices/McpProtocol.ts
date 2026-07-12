/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPlatformServices } from '@/common/platform';
import type { AcpBackendAll } from '@/common/types/acpTypes';
import { JSONRPC_VERSION } from '@/common/types/acpTypes';
import type { IMcpServer } from '@/common/config/storage';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { getEnhancedEnv, normalizeNpxArgsForBundledBun, resolveNpxPath } from '@/process/utils/shellEnv';
import { getMcpScriptPath } from '@/process/utils/mcpScriptDir';
import { resolveJsRuntime } from '@/process/utils/jsRuntime';
import { isBuiltinWaylandMcpArg } from '@/process/resources/builtinMcp/constants';

/**
 * MCP source type - includes all ACP backends and Wayland built-ins
 */
export type McpSource = AcpBackendAll | 'gemini' | 'wayland' | 'wcore';

/**
 * MCP operation result interface
 */
export interface McpOperationResult {
  success: boolean;
  error?: string;
}

/**
 * MCP connection test result interface
 */
export interface McpConnectionTestResult {
  success: boolean;
  tools?: Array<{ name: string; description?: string; _meta?: Record<string, unknown> }>;
  error?: string;
  needsAuth?: boolean; // Whether OAuth authentication is needed
  authMethod?: 'oauth' | 'basic'; // Auth method
  wwwAuthenticate?: string; // WWW-Authenticate header content
}

/**
 * MCP detection result interface
 */
export interface DetectedMcpServer {
  source: McpSource;
  servers: IMcpServer[];
}

/**
 * MCP sync result interface
 */
export interface McpSyncResult {
  success: boolean;
  results: Array<{
    agent: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * MCP protocol interface - defines the standard protocol for MCP operations
 */
export interface IMcpProtocol {
  /**
   * Detect MCP configuration
   * @param cliPath optional CLI path
   * @returns list of MCP servers
   */
  detectMcpServers(cliPath?: string): Promise<IMcpServer[]>;

  /**
   * Install MCP servers into the agent
   * @param mcpServers list of MCP servers to install
   * @returns operation result
   */
  installMcpServers(mcpServers: IMcpServer[]): Promise<McpOperationResult>;

  /**
   * Remove an MCP server from the agent
   * @param mcpServerName name of MCP server to remove
   * @returns operation result
   */
  removeMcpServer(mcpServerName: string): Promise<McpOperationResult>;

  /**
   * Test MCP server connection
   * @param server MCP server configuration
   * @returns connection test result
   */
  testMcpConnection(server: IMcpServer): Promise<McpConnectionTestResult>;

  /**
   * Get supported transport types
   * @returns list of supported transport types
   */
  getSupportedTransports(): string[];

  /**
   * Get agent backend type
   * @returns agent backend type
   */
  getBackendType(): McpSource;
}

/**
 * MCP protocol abstract base class
 */
export abstract class AbstractMcpAgent implements IMcpProtocol {
  protected readonly backend: McpSource;
  protected readonly timeout: number;
  private operationQueue: Promise<any> = Promise.resolve();

  constructor(backend: McpSource, timeout: number = 30000) {
    this.backend = backend;
    this.timeout = timeout;
  }

  /**
   * Mutex that ensures operations run serially
   */
  protected withLock<T>(operation: () => Promise<T>): Promise<T> {
    const currentQueue = this.operationQueue;
    const operationName = operation.name || 'anonymous operation';

    // Create a new Promise that waits for the previous operation to finish
    const newOperation = currentQueue
      .then(() => operation())
      .catch((error) => {
        console.warn(`[${this.backend} MCP] ${operationName} failed:`, error);
        // Even if the operation fails, continue executing the next operation in the queue
        throw error;
      });

    // Update the queue (ignore errors so the queue keeps moving)
    this.operationQueue = newOperation.catch(() => {
      // Empty catch to prevent unhandled rejection
    });

    return newOperation;
  }

  abstract detectMcpServers(cliPath?: string): Promise<IMcpServer[]>;

  abstract installMcpServers(mcpServers: IMcpServer[]): Promise<McpOperationResult>;

  abstract removeMcpServer(mcpServerName: string): Promise<McpOperationResult>;

  abstract getSupportedTransports(): string[];

  getBackendType(): McpSource {
    return this.backend;
  }

  /**
   * Generic implementation for testing an MCP server connection
   * @param serverOrTransport full server configuration or just transport configuration
   */
  testMcpConnection(serverOrTransport: IMcpServer | IMcpServer['transport']): Promise<McpConnectionTestResult> {
    try {
      // Detect whether it's a full IMcpServer or just a transport
      const transport = 'transport' in serverOrTransport ? serverOrTransport.transport : serverOrTransport;

      switch (transport.type) {
        case 'stdio':
          return this.testStdioConnection(transport);
        case 'sse':
          return this.testSseConnection(transport);
        case 'http':
          return this.testHttpConnection(transport);
        case 'streamable_http':
          return this.testStreamableHttpConnection(transport);
        default:
          return Promise.resolve({
            success: false,
            error: 'Unsupported transport type',
          });
      }
    } catch (error) {
      return Promise.resolve({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Generic implementation for testing a Stdio connection
   * Uses the MCP SDK for correct protocol communication
   */
  protected async testStdioConnection(
    transport: {
      command: string;
      args?: string[];
      env?: Record<string, string>;
    },
    retryCount: number = 0
  ): Promise<McpConnectionTestResult> {
    let mcpClient: Client | null = null;
    // Hoisted so the catch block can report the resolved spawn argv and the
    // child's stderr even when connect() throws.
    let command = '';
    let args: string[] = [];
    let childStderr = '';

    try {
      // app imported statically

      const rawArgs = transport.args ?? [];
      // Bundled @wayland MCPs are stored as { command: 'node', args: ['builtin-mcp-<name>.mjs'] }.
      // End-user Macs frequently have no system `node` on PATH, so spawning the
      // bare command dies on launch and surfaces only as -32000 "Connection
      // closed". Run our own builtins through a resolved JS runtime — bundled Bun
      // in packaged builds (the app binary can't be used: #706, the RunAsNode
      // fuse makes ELECTRON_RUN_AS_NODE a no-op so it would boot as the app), or
      // the app binary as Node in dev. The bare filename is also rewritten to an
      // absolute path under out/main (dev) or app.asar.unpacked/out/main (packaged).
      const isBuiltinWaylandMcp = transport.command === 'node' && isBuiltinWaylandMcpArg(rawArgs[0]);
      const builtinRuntime = isBuiltinWaylandMcp ? resolveJsRuntime() : null;

      // Use enhanced env (includes shell PATH) instead of bare process.env
      // so CLI tools installed via nvm/fnm/volta are discoverable in packaged mode
      const enhancedEnv = {
        ...getEnhancedEnv(transport.env),
        TERM: 'dumb',
        NO_COLOR: '1',
        ...(builtinRuntime ? builtinRuntime.env : {}),
      };

      command = builtinRuntime
        ? builtinRuntime.command
        : transport.command === 'npx'
          ? resolveNpxPath(enhancedEnv)
          : transport.command;

      args = isBuiltinWaylandMcp
        ? [getMcpScriptPath(rawArgs[0]), ...rawArgs.slice(1)]
        : transport.command === 'npx'
          ? ['x', '--bun', ...normalizeNpxArgsForBundledBun(rawArgs)]
          : rawArgs;

      const stdioTransport = new StdioClientTransport({
        command,
        args,
        env: enhancedEnv,
        // Prevent child process stderr from inheriting parent's TTY.
        // Default 'inherit' causes `zsh: suspended (tty output)` when the
        // spawned MCP server (e.g. npx) writes to stderr while Electron
        // runs under terminal job control.
        stderr: 'pipe',
      });

      // Capture the child's stderr. When a local stdio MCP server dies on
      // launch (bad arch, missing `node`/`bun` binary, dyld/dependency error)
      // the SDK only surfaces a generic -32000 "Connection closed" — the real
      // OS-level reason is on the child's stderr. With stderr:'pipe' the SDK
      // exposes a PassThrough immediately (before start), so attaching here
      // loses no early output. Bounded so a chatty server can't grow unbounded.
      stdioTransport.stderr?.on('data', (chunk: Buffer) => {
        if (childStderr.length < 4096) {
          childStderr += chunk.toString('utf8');
        }
      });

      // Create MCP client
      mcpClient = new Client(
        {
          name: getPlatformServices().paths.getName(),
          version: getPlatformServices().paths.getVersion(),
        },
        {
          capabilities: {
            sampling: {},
          },
        }
      );

      // Connect to the server and fetch the tools list
      await mcpClient.connect(stdioTransport);
      const result = await mcpClient.listTools();

      const tools = result.tools.map((tool) =>
        Object.assign({ name: tool.name, description: tool.description }, tool._meta ? { _meta: tool._meta } : {})
      );

      return { success: true, tools };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as NodeJS.ErrnoException)?.code;

      // Surface the real launch failure. A bare -32000 "Connection closed"
      // means the child exited before the handshake; the captured stderr (and
      // the exact spawn argv) is the only place the real reason lives.
      const stderrTail = childStderr.trim().split('\n').slice(-6).join('\n').trim();
      console.error(
        `[McpStdio] connect failed: spawn=${JSON.stringify([command, ...args])} code=${errorCode ?? 'n/a'} message=${errorMessage}` +
          (stderrTail ? `\n[McpStdio] server stderr:\n${stderrTail}` : '\n[McpStdio] server stderr: <empty>')
      );
      // Compact suffix appended to user-facing errors so the cause isn't lost.
      const stderrSuffix = stderrTail ? ` Server output: ${stderrTail.replace(/\s+/g, ' ').slice(0, 300)}` : '';

      // Detect missing command (npx/node not installed)
      if (
        errorCode === 'ENOENT' ||
        errorMessage.includes('ENOENT') ||
        errorMessage.includes('spawn') ||
        errorMessage.includes('not found')
      ) {
        const cmd = transport.command;
        const isNpx = cmd === 'npx' || cmd.endsWith('/npx') || cmd.endsWith('\\npx');
        if (isNpx) {
          return {
            success: false,
            error: `Bundled bun runtime is unavailable. Please reinstall Wayland or use a direct stdio command instead of npx.${stderrSuffix}`,
          };
        }
        return {
          success: false,
          error: `Command "${cmd}" not found. Please ensure it is installed and available in your PATH.${stderrSuffix}`,
        };
      }

      // Detect permission errors
      if (errorCode === 'EACCES' || errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
        return {
          success: false,
          error: `Permission denied when running "${transport.command}". Please check file permissions or reinstall Wayland.`,
        };
      }

      // Detect timeout errors
      if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        return {
          success: false,
          error: `Connection timed out. The MCP server "${transport.command}" may be taking too long to start. Check network and try again.`,
        };
      }

      return {
        success: false,
        error: `${errorMessage}${stderrSuffix}`,
      };
    } finally {
      // Clean up connection
      if (mcpClient) {
        try {
          await mcpClient.close();
        } catch (closeError) {
          console.error('[Stdio] Error closing connection:', closeError);
        }
      }
    }
  }

  /**
   * Generic implementation for testing an SSE connection
   * Uses the MCP SDK for correct protocol communication
   */
  protected async testSseConnection(transport: {
    url: string;
    headers?: Record<string, string>;
  }): Promise<McpConnectionTestResult> {
    let mcpClient: Client | null = null;

    try {
      // app imported statically

      // First try a simple HTTP request to detect auth requirements
      const authCheckResponse = await fetch(transport.url, {
        method: 'GET',
        headers: transport.headers || {},
      });

      // Check whether authentication is required
      if (authCheckResponse.status === 401) {
        const wwwAuthenticate = authCheckResponse.headers.get('WWW-Authenticate');
        if (wwwAuthenticate) {
          return {
            success: false,
            needsAuth: true,
            authMethod: wwwAuthenticate.toLowerCase().includes('bearer') ? 'oauth' : 'basic',
            wwwAuthenticate: wwwAuthenticate,
            error: 'Authentication required',
          };
        }
      }

      // #283 / #306: a non-2xx probe without a 401 challenge (GitHub returns 400
      // "missing required Authorization header", Google Workspace similarly) is
      // an auth requirement only when OAuth is discoverable on the endpoint.
      // Gating on discovery keeps a transient 5xx a connection error.
      if (!authCheckResponse.ok) {
        const { isOAuthProtectedEndpoint } = await import('@process/services/mcpServices/McpOAuthService');
        if (await isOAuthProtectedEndpoint(transport.url)) {
          return {
            success: false,
            needsAuth: true,
            authMethod: 'oauth',
            error: 'Authentication required',
          };
        }
      }

      // Create SSE transport
      const sseTransport = new SSEClientTransport(new URL(transport.url), {
        requestInit: {
          headers: transport.headers,
        },
      });

      // Create MCP client
      mcpClient = new Client(
        {
          name: getPlatformServices().paths.getName(),
          version: getPlatformServices().paths.getVersion(),
        },
        {
          capabilities: {
            sampling: {},
          },
        }
      );

      // Connect to the server and fetch the tools list
      await mcpClient.connect(sseTransport);
      const result = await mcpClient.listTools();

      const tools = result.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
      }));

      return { success: true, tools };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check whether the error message contains auth-related information
      if (errorMessage.toLowerCase().includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
        return {
          success: false,
          needsAuth: true,
          error: 'Authentication required',
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      // Clean up connection
      if (mcpClient) {
        try {
          await mcpClient.close();
        } catch (closeError) {
          console.error('[SSE] Error closing connection:', closeError);
        }
      }
    }
  }

  /**
   * Generic implementation for testing an HTTP connection
   * MCP Streamable HTTP servers may respond with JSON or SSE (text/event-stream).
   * Try raw JSON-RPC first; if the response is SSE, fall back to StreamableHTTPClientTransport.
   */
  protected async testHttpConnection(transport: {
    url: string;
    headers?: Record<string, string>;
  }): Promise<McpConnectionTestResult> {
    try {
      // Quick probe: check if the server requires authentication before
      // handing off to the SDK (which doesn't surface 401 details).
      const probeResponse = await fetch(transport.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          ...transport.headers,
        },
        body: JSON.stringify({
          jsonrpc: JSONRPC_VERSION,
          method: 'initialize',
          id: 1,
          params: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            clientInfo: {
              name: getPlatformServices().paths.getName(),
              version: getPlatformServices().paths.getVersion(),
            },
          },
        }),
      });

      // Fast path: an RFC 6750 challenge (401 + WWW-Authenticate) is an
      // unambiguous OAuth requirement.
      if (probeResponse.status === 401) {
        const wwwAuthenticate = probeResponse.headers.get('WWW-Authenticate');
        if (wwwAuthenticate) {
          return {
            success: false,
            needsAuth: true,
            authMethod: wwwAuthenticate.toLowerCase().includes('bearer') ? 'oauth' : 'basic',
            wwwAuthenticate: wwwAuthenticate,
            error: 'Authentication required',
          };
        }
      }

      if (!probeResponse.ok) {
        // #283 / #306: GitHub/Google remote MCP reject an unauthenticated probe
        // with 400 "missing required Authorization header" (not 401 +
        // WWW-Authenticate), so the challenge fast path never fires. Treat a
        // non-2xx probe as an auth requirement ONLY when OAuth discovery
        // succeeds on the endpoint; a transient 5xx with no discoverable OAuth
        // stays a plain connection error rather than a spurious sign-in prompt.
        // Lazy import: only the (rare) non-2xx path needs the OAuth module, so
        // every other McpProtocol importer stays free of its load-time cost.
        const { isOAuthProtectedEndpoint } = await import('@process/services/mcpServices/McpOAuthService');
        if (await isOAuthProtectedEndpoint(transport.url)) {
          return {
            success: false,
            needsAuth: true,
            authMethod: 'oauth',
            error: 'Authentication required',
          };
        }
        return {
          success: false,
          error: `HTTP ${probeResponse.status}: ${probeResponse.statusText}`,
        };
      }

      // Auth OK - close the probe body and delegate to StreamableHTTPClientTransport
      // which handles session-id, SSE, and all protocol details correctly.
      await probeResponse.body?.cancel().catch(() => {});
      return this.testStreamableHttpConnection(transport);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generic implementation for testing a Streamable HTTP connection
   * Uses the MCP SDK for correct protocol communication
   */
  protected async testStreamableHttpConnection(transport: {
    url: string;
    headers?: Record<string, string>;
  }): Promise<McpConnectionTestResult> {
    let mcpClient: Client | null = null;

    try {
      // app imported statically

      // Create Streamable HTTP transport
      const streamableHttpTransport = new StreamableHTTPClientTransport(new URL(transport.url), {
        requestInit: {
          headers: transport.headers,
        },
      });

      // Create MCP client
      mcpClient = new Client(
        {
          name: getPlatformServices().paths.getName(),
          version: getPlatformServices().paths.getVersion(),
        },
        {
          capabilities: {
            sampling: {},
          },
        }
      );

      // Connect to the server and fetch the tools list
      await mcpClient.connect(streamableHttpTransport);
      const result = await mcpClient.listTools();

      const tools = result.tools.map((tool) =>
        Object.assign({ name: tool.name, description: tool.description }, tool._meta ? { _meta: tool._meta } : {})
      );

      return { success: true, tools };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      // Clean up connection
      if (mcpClient) {
        try {
          await mcpClient.close();
        } catch (closeError) {
          console.error('[StreamableHTTP] Error closing connection:', closeError);
        }
      }
    }
  }
}
