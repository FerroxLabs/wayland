---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.dropbox.com/mcp` - nothing runs locally.
  - id: oauth
    title: "Sign in with Dropbox"
    primaryAction: { label: "Sign in with Dropbox", action: "oauth-flow" }
    body: |
      Click **Sign in with Dropbox** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Dropbox setup

Browse, search, and read your Dropbox files and folders - Dropbox’s official hosted MCP (beta).
