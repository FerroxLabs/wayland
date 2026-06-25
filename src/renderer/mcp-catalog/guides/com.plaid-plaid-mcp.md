---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://api.dashboard.plaid.com/mcp` - nothing runs locally.
  - id: oauth
    title: "Sign in with Plaid"
    primaryAction: { label: "Sign in with Plaid", action: "oauth-flow" }
    body: |
      Click **Sign in with Plaid** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Plaid setup

Debug Items, inspect Item health and Link conversion, and read usage analytics - Plaid’s official Dashboard MCP.
