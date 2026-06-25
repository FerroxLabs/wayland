---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://api.you.com/mcp` - nothing runs locally.
  - id: oauth
    title: "Sign in with You.com"
    primaryAction: { label: "Sign in with You.com", action: "oauth-flow" }
    body: |
      Click **Sign in with You.com** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# You.com setup

Web and news search plus multi-step research with citations - You.com’s official hosted MCP, with a free no-key tier.
