---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.webflow.com/mcp` - nothing runs locally.
  - id: oauth
    title: "Sign in with Webflow"
    primaryAction: { label: "Sign in with Webflow", action: "oauth-flow" }
    body: |
      Click **Sign in with Webflow** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Webflow setup

Read and write site data, CMS collections and schemas, and generate code - Webflow’s official hosted MCP.
