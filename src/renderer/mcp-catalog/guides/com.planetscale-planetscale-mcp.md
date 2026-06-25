---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.pscale.dev/mcp/planetscale` - nothing runs locally.
  - id: oauth
    title: "Sign in with PlanetScale"
    primaryAction: { label: "Sign in with PlanetScale", action: "oauth-flow" }
    body: |
      Click **Sign in with PlanetScale** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# PlanetScale setup

Manage organizations, databases, branches, schema, and Insights with destructive-SQL guards - PlanetScale’s official hosted MCP.
