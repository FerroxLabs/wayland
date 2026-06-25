---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.railway.com` - nothing runs locally.
  - id: oauth
    title: "Sign in with Railway"
    primaryAction: { label: "Sign in with Railway", action: "oauth-flow" }
    body: |
      Click **Sign in with Railway** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Railway setup

Manage projects, deployments, environment variables, and logs in natural language - Railway’s official hosted MCP.
