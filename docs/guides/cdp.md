# CDP (Chrome DevTools Protocol) for MCP Development

Wayland supports CDP for external debugging tools integration. In development mode (`just dev`), CDP is enabled by default on port 9230.

## Enable CDP in Production

1. Open Wayland Settings → System → Developer Debug
2. Enable "Enable Remote Debugging (CDP)"
3. Restart the app

## Configure MCP chrome-devtools

Add this to your IDE's MCP configuration. The configuration file location depends on your IDE:

| IDE                | Config Path                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Cursor**         | `~/.cursor/mcp.json`                                                                                                                 |
| **VS Code**        | `~/.vscode/mcp.json`                                                                                                                 |
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows) |
| **Codebuddy**      | `~/.codebuddy/mcp.json`                                                                                                              |

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@0.16.0", "--browser-url=http://127.0.0.1:9230"]
    }
  }
}
```

## Other AI-Friendly Development Tools

Wayland can integrate with other MCP tools for enhanced development experience:

| Tool               | Purpose                                             | Config                                    |
| ------------------ | --------------------------------------------------- | ----------------------------------------- |
| **Playwright MCP** | Browser automation (alternative to chrome-devtools) | `"@playwright/mcp@latest"`                |
| **Puppeteer MCP**  | Browser automation                                  | `"@puppeteer/mcp@latest"`                 |
| **Filesystem MCP** | File operations                                     | `@modelcontextprotocol/server-filesystem` |
| **Git MCP**        | Git repository operations                           | `@modelcontextprotocol/server-git`        |

See [MCP Servers](https://github.com/modelcontextprotocol/servers) for more tools.

## Usage with MCP

Once configured, you can use MCP tools to interact with Wayland:

- `list_pages` - List all open pages in Wayland
- `take_snapshot` - Get accessibility tree snapshot of current page
- `click`, `fill`, `hover` - Interact with UI elements
- `navigate_page` - Navigate to URLs

## Inspect with Chrome DevTools

1. Open `http://127.0.0.1:9230/json` in Chrome
2. Click on a page to inspect it with DevTools
3. Or use Chrome's `chrome://inspect` → Configure → add `127.0.0.1:9230`

---

# CDP (Chrome DevTools Protocol) for MCP Development

Wayland supports CDP for external debugging tools integration. In development mode (`just dev`), CDP is enabled by default on port 9230.

## Enable CDP in Production

1. Open Wayland Settings → System → Developer Debug
2. Enable "Enable Remote Debugging (CDP)"
3. Restart the app

## Configure MCP chrome-devtools

Add this to your IDE's MCP configuration. The configuration file location depends on your IDE:

| IDE                | Config Path                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Cursor**         | `~/.cursor/mcp.json`                                                                                                                 |
| **VS Code**        | `~/.vscode/mcp.json`                                                                                                                 |
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows) |
| **Codebuddy**      | `~/.codebuddy/mcp.json`                                                                                                              |

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@0.16.0", "--browser-url=http://127.0.0.1:9230"]
    }
  }
}
```

## Other AI-Friendly Development Tools

Wayland can integrate with other MCP tools for enhanced development experience:

| Tool               | Purpose                                             | Config                                    |
| ------------------ | --------------------------------------------------- | ----------------------------------------- |
| **Playwright MCP** | Browser automation (alternative to chrome-devtools) | `"@playwright/mcp@latest"`                |
| **Puppeteer MCP**  | Browser automation                                  | `"@puppeteer/mcp@latest"`                 |
| **Filesystem MCP** | File operations                                     | `@modelcontextprotocol/server-filesystem` |
| **Git MCP**        | Git repository operations                           | `@modelcontextprotocol/server-git`        |

See [MCP Servers](https://github.com/modelcontextprotocol/servers) for more tools.

## Usage with MCP

Once configured, you can use MCP tools to interact with Wayland:

- `list_pages` - List all open pages in Wayland
- `take_snapshot` - Get accessibility tree snapshot of current page
- `click`, `fill`, `hover` - Interact with UI elements
- `navigate_page` - Navigate to URLs

## Inspect with Chrome DevTools

1. Open `http://127.0.0.1:9230/json` in Chrome
2. Click on a page to inspect it with DevTools
3. Or use Chrome's `chrome://inspect` → Configure → add `127.0.0.1:9230`
