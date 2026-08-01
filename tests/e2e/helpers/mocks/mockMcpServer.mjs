/**
 * Tiny stdio MCP server used by MCP tests to verify the Wayland MCP bridge can
 * speak the @modelcontextprotocol/sdk@1.29 wire protocol end-to-end without
 * depending on a published MCP server binary.
 *
 * Exposes a single tool `echo` that returns the input text verbatim, plus the
 * standard `initialize` / `tools/list` / `tools/call` lifecycle.
 *
 * Plain ESM JavaScript (NOT TypeScript) on purpose: tests spawn it with the
 * ambient runtime via `process.execPath`, which is often a Node version that
 * cannot execute a `.ts` file (Node < 23.6 without `--experimental-strip-types`
 * crashes on the type syntax, which manifested as "MCP fixture timeout:
 * initialize"). A `.mjs` runs on every Node/Electron/bun runtime unchanged.
 *
 * The script is intentionally dependency-free: it speaks the JSON-RPC line
 * protocol over stdio directly so we don't have to bundle the SDK into the
 * fixture path.
 */

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function handle(req) {
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
      const name = (req.params && req.params.name) || '';
      const args = (req.params && req.params.arguments) || {};
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
process.stdin.on('data', (chunk) => {
  buf += chunk;
  let idx = buf.indexOf('\n');
  while (idx !== -1) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (line.length > 0) {
      try {
        const req = JSON.parse(line);
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
