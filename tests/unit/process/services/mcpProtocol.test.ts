import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock platform services
vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: {
      getName: () => 'Wayland',
      getVersion: () => '1.0.0',
    },
  }),
}));

// Mock SDK transports
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn(),
}));
vi.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
  SSEClientTransport: vi.fn(),
}));
vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: vi.fn(),
}));
vi.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
  StreamableHTTPClientTransport: vi.fn(),
}));
vi.mock('@process/utils/shellEnv', () => ({
  getEnhancedEnv: vi.fn().mockResolvedValue({}),
  getNpxCacheDir: vi.fn().mockReturnValue('/tmp/npx-cache'),
  normalizeNpxArgsForBundledBun: vi.fn((args: string[]) =>
    args.filter((arg) => arg !== '-y' && arg !== '--yes' && arg !== '--prefer-offline')
  ),
  resolveNpxPath: vi.fn().mockReturnValue('/usr/local/bin/bun'),
}));
vi.mock('fs', () => ({ promises: { access: vi.fn() } }));
vi.mock('@process/utils/safeExec', () => ({
  safeExec: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
}));
// #283/#306: McpProtocol gates "non-2xx probe -> auth required" on OAuth
// discovery. Mock the helper so these tests stay hermetic (no real .well-known
// network calls) and we can drive the discoverable / not-discoverable branches.
const { isOAuthProtectedEndpointMock } = vi.hoisted(() => ({
  isOAuthProtectedEndpointMock: vi.fn(async () => false),
}));
vi.mock('@process/services/mcpServices/McpOAuthService', () => ({
  isOAuthProtectedEndpoint: isOAuthProtectedEndpointMock,
}));

import type { McpConnectionTestResult, McpOperationResult } from '@process/services/mcpServices/McpProtocol';
import type { IMcpServer } from '@/common/config/storage';

// Create a concrete test subclass to access protected methods
class TestAgent {
  private agent: InstanceType<typeof import('@process/services/mcpServices/McpProtocol').AbstractMcpAgent>;

  constructor(agent: any) {
    this.agent = agent;
  }

  testHttpConnection(transport: { url: string; headers?: Record<string, string> }) {
    return (this.agent as any).testHttpConnection(transport);
  }

  testMcpConnection(serverOrTransport: IMcpServer | IMcpServer['transport']) {
    return this.agent.testMcpConnection(serverOrTransport);
  }
}

describe('AbstractMcpAgent', () => {
  let testAgent: TestAgent;

  beforeEach(async () => {
    vi.resetModules();
    isOAuthProtectedEndpointMock.mockReset().mockResolvedValue(false);

    const { AbstractMcpAgent } = await import('@process/services/mcpServices/McpProtocol');

    // Create a minimal concrete subclass
    class ConcreteAgent extends AbstractMcpAgent {
      constructor() {
        super('wayland', 5000);
      }
      detectMcpServers(): Promise<IMcpServer[]> {
        return Promise.resolve([]);
      }
      installMcpServers(): Promise<McpOperationResult> {
        return Promise.resolve({ success: true });
      }
      removeMcpServer(): Promise<McpOperationResult> {
        return Promise.resolve({ success: true });
      }
      getSupportedTransports(): string[] {
        return ['http', 'streamable_http', 'stdio'];
      }
    }

    testAgent = new TestAgent(new ConcreteAgent());
  });

  describe('testHttpConnection', () => {
    it('should return needsAuth when server responds with 401 and WWW-Authenticate Bearer', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 401,
          statusText: 'Unauthorized',
          ok: false,
          headers: new Headers({ 'WWW-Authenticate': 'Bearer realm="mcp"' }),
        })
      );

      const result = await testAgent.testHttpConnection({ url: 'http://localhost:3000/mcp' });

      expect(result.success).toBe(false);
      expect(result.needsAuth).toBe(true);
      expect(result.authMethod).toBe('oauth');
      expect(result.wwwAuthenticate).toBe('Bearer realm="mcp"');

      vi.unstubAllGlobals();
    });

    it('should return error for 401 without WWW-Authenticate header', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 401,
          statusText: 'Unauthorized',
          ok: false,
          headers: new Headers(),
        })
      );

      const result = await testAgent.testHttpConnection({ url: 'http://localhost:3000/mcp' });

      expect(result.success).toBe(false);
      expect(result.needsAuth).toBeUndefined();
      expect(result.error).toBe('HTTP 401: Unauthorized');

      vi.unstubAllGlobals();
    });

    it('should return error for non-OK responses', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 500,
          statusText: 'Internal Server Error',
          ok: false,
          headers: new Headers(),
        })
      );

      const result = await testAgent.testHttpConnection({ url: 'http://localhost:3000/mcp' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP 500: Internal Server Error');

      vi.unstubAllGlobals();
    });

    it('should return error on network failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')));

      const result = await testAgent.testHttpConnection({ url: 'http://localhost:3000/mcp' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');

      vi.unstubAllGlobals();
    });

    it('should return needsAuth for a 400 "missing Authorization header" probe when OAuth is discoverable (#283 GitHub)', async () => {
      isOAuthProtectedEndpointMock.mockResolvedValue(true);
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 400,
          statusText: 'Bad Request',
          ok: false,
          headers: new Headers(),
        })
      );

      const result = await testAgent.testHttpConnection({ url: 'https://api.githubcopilot.com/mcp' });

      expect(result.success).toBe(false);
      expect(result.needsAuth).toBe(true);
      expect(result.authMethod).toBe('oauth');
      expect(isOAuthProtectedEndpointMock).toHaveBeenCalledWith('https://api.githubcopilot.com/mcp');

      vi.unstubAllGlobals();
    });

    it('should return a connection error (not needsAuth) for a non-2xx probe with no discoverable OAuth (#283 5xx guard)', async () => {
      isOAuthProtectedEndpointMock.mockResolvedValue(false);
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 503,
          statusText: 'Service Unavailable',
          ok: false,
          headers: new Headers(),
        })
      );

      const result = await testAgent.testHttpConnection({ url: 'https://down.example.com/mcp' });

      expect(result.success).toBe(false);
      expect(result.needsAuth).toBeUndefined();
      expect(result.error).toBe('HTTP 503: Service Unavailable');

      vi.unstubAllGlobals();
    });

    it('should delegate to testStreamableHttpConnection on successful probe', async () => {
      const cancelFn = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 200,
          statusText: 'OK',
          ok: true,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          body: { cancel: cancelFn },
        })
      );

      // The delegation will fail because SDK is mocked, but we verify
      // it reaches that path (error comes from SDK mock, not probe)
      const result = await testAgent.testHttpConnection({ url: 'http://localhost:3000/mcp' });

      // Probe body should be cancelled before delegation
      expect(cancelFn).toHaveBeenCalled();
      // Result comes from testStreamableHttpConnection (will fail due to SDK mock)
      expect(result).toBeDefined();

      vi.unstubAllGlobals();
    });
  });

  describe('testMcpConnection - _meta preservation', () => {
    it('should route http type to testHttpConnection', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('test')));

      const result = await testAgent.testMcpConnection({
        type: 'http' as const,
        url: 'http://localhost:3000/mcp',
      });

      expect(result.success).toBe(false);

      vi.unstubAllGlobals();
    });

    it('should translate npx stdio transports to bundled bun', async () => {
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
      const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');

      vi.mocked(Client).mockImplementation(function MockClient() {
        return {
          connect: vi.fn().mockResolvedValue(undefined),
          listTools: vi.fn().mockResolvedValue({ tools: [] }),
          close: vi.fn().mockResolvedValue(undefined),
        } as any;
      } as any);
      vi.mocked(StdioClientTransport).mockImplementation(function MockTransport(config: unknown) {
        // Mirror the real SDK: `.stderr` is a stream (or null) for stderr:'pipe',
        // never the literal 'pipe' string the input config carries.
        return Object.assign({}, config, { stderr: undefined }) as any;
      } as any);

      const result = await testAgent.testMcpConnection({
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp/workspace'],
      });

      expect(result.success).toBe(true);
      expect(StdioClientTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          command: '/usr/local/bin/bun',
          args: ['x', '--bun', '@modelcontextprotocol/server-filesystem', '/tmp/workspace'],
        })
      );
    });
  });

  // #438: local stdio MCP servers (Apple Ecosystem, Filesystem, ...) failed
  // with -32000 "Connection closed" on macOS Intel. Two launch defects:
  // bundled @wayland builtins spawned bare `node` (absent on most end-user
  // Macs), and child stderr was piped but never read so the real reason was
  // masked. These tests lock the fixes.
  describe('testMcpConnection - stdio launch (#438)', () => {
    // Returns a fresh StdioClientTransport mock (calls cleared) whose returned
    // transport exposes a real EventEmitter as `.stderr` (the production SDK
    // returns a PassThrough for stderr:'pipe'), optionally emitting `stderrLine`
    // during connect to simulate a child dying with a real OS error.
    const setupTransport = async (stderrLine?: string) => {
      const { EventEmitter } = await import('node:events');
      const stderrStream = new EventEmitter();
      const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
      vi.mocked(StdioClientTransport).mockReset();
      vi.mocked(StdioClientTransport).mockImplementation(function MockTransport(config: unknown) {
        return Object.assign({}, config, { stderr: stderrStream }) as any;
      } as any);
      return { StdioClientTransport, stderrStream };
    };
    const setupClientOk = async () => {
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
      vi.mocked(Client).mockImplementation(function MockClient() {
        return {
          connect: vi.fn().mockResolvedValue(undefined),
          listTools: vi.fn().mockResolvedValue({ tools: [] }),
          close: vi.fn().mockResolvedValue(undefined),
        } as any;
      } as any);
    };

    it('launches a bundled @wayland builtin via Electron-as-Node (process.execPath + ELECTRON_RUN_AS_NODE=1), not bare node', async () => {
      await setupClientOk();
      const { StdioClientTransport } = await setupTransport();

      const result = await testAgent.testMcpConnection({
        type: 'stdio',
        command: 'node',
        args: ['builtin-mcp-apple.mjs'],
      });

      expect(result.success).toBe(true);
      const cfg = vi.mocked(StdioClientTransport).mock.calls[0]![0] as any;
      expect(cfg.command).toBe(process.execPath);
      // bare filename rewritten to an ABSOLUTE path that still ends in the
      // builtin name (accept either path separator — Windows uses '\').
      expect(cfg.args[0]).toMatch(/[/\\]builtin-mcp-apple\.mjs$/);
      expect(cfg.env.ELECTRON_RUN_AS_NODE).toBe('1');
    });

    it('does NOT rewrite a user-defined node stdio server (only our bundled builtins)', async () => {
      await setupClientOk();
      const { StdioClientTransport } = await setupTransport();

      await testAgent.testMcpConnection({
        type: 'stdio',
        command: 'node',
        args: ['/Users/me/custom-server.js'],
      });

      const cfg = vi.mocked(StdioClientTransport).mock.calls[0]![0] as any;
      expect(cfg.command).toBe('node');
      expect(cfg.args).toEqual(['/Users/me/custom-server.js']);
      expect(cfg.env.ELECTRON_RUN_AS_NODE).toBeUndefined();
    });

    it('surfaces the child process stderr in the error when the server dies on launch (-32000)', async () => {
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
      const { stderrStream } = await setupTransport();

      vi.mocked(Client).mockImplementation(function MockClient() {
        return {
          connect: vi.fn().mockImplementation(async () => {
            // The child writes the real reason to stderr just before the pipe
            // closes; the listener was attached synchronously before connect().
            stderrStream.emit('data', Buffer.from('dyld: bad CPU type in executable\n'));
            throw new Error('MCP error -32000: Connection closed');
          }),
          listTools: vi.fn(),
          close: vi.fn().mockResolvedValue(undefined),
        } as any;
      } as any);

      const result = await testAgent.testMcpConnection({
        type: 'stdio',
        command: 'node',
        args: ['builtin-mcp-apple.mjs'],
      });

      expect(result.success).toBe(false);
      expect((result as { error?: string }).error).toContain('-32000');
      expect((result as { error?: string }).error).toContain('dyld: bad CPU type');
    });
  });
});
