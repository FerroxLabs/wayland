---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.axiom.co/mcp` - nothing runs locally.
  - id: oauth
    title: "Sign in with Axiom"
    primaryAction: { label: "Sign in with Axiom", action: "oauth-flow" }
    body: |
      Click **Sign in with Axiom** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Axiom setup

Query and analyze logs and events with APL - Axiom’s official hosted MCP.
