/**
 * Tiny stdio MCP server used by tests/e2e/specs/mcp.e2e.ts to verify the
 * Wayland MCP bridge can speak the @modelcontextprotocol/sdk@1.29 wire
 * protocol end-to-end without depending on a published MCP server binary.
 *
 * Exposes a single tool `echo` that returns the input text verbatim, plus
 * the standard `initialize` / `tools/list` / `tools/call` lifecycle.
 *
 * Boot via:
 *   node tests/e2e/helpers/mocks/mockMcpServer.ts
 *
 * The script is intentionally dependency-free: it speaks the JSON-RPC line
 * protocol over stdio directly so we don't have to bundle the SDK into the
 * fixture path.
 */

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string };
};

function send(msg: JsonRpcResponse): void {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function handle(req: JsonRpcRequest): JsonRpcResponse | null {
  const id = req.id ?? 0;
  switch (req.method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: { name: 'wayland-e2e-mock-mcp', version: '0.0.1' },
          capabilities: { tools: {} },
        },
      };
    case 'initialized':
    case 'notifications/initialized':
      // Notifications have no response.
      return null;
    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'echo',
              description: 'Echo back the supplied text',
              inputSchema: {
                type: 'object',
                properties: { text: { type: 'string' } },
                required: ['text'],
              },
            },
          ],
        },
      };
    case 'tools/call': {
      const name = (req.params?.name as string) || '';
      const args = (req.params?.arguments as Record<string, unknown>) || {};
      if (name !== 'echo') {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `unknown tool: ${name}` },
        };
      }
      const text = typeof args.text === 'string' ? args.text : '';
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text }],
          isError: false,
        },
      };
    }
    default:
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `method not found: ${req.method}` },
      };
  }
}

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk: string) => {
  buf += chunk;
  let idx = buf.indexOf('\n');
  while (idx !== -1) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (line.length > 0) {
      try {
        const req = JSON.parse(line) as JsonRpcRequest;
        const resp = handle(req);
        if (resp) send(resp);
      } catch {
        // Ignore malformed input - the bridge will time out.
      }
    }
    idx = buf.indexOf('\n');
  }
});

process.stdin.on('end', () => process.exit(0));
