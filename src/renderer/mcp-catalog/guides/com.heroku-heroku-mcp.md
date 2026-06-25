---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.heroku.com/mcp` - nothing runs locally.
  - id: oauth
    title: "Sign in with Heroku"
    primaryAction: { label: "Sign in with Heroku", action: "oauth-flow" }
    body: |
      Click **Sign in with Heroku** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Heroku setup

Manage apps, dynos, add-ons, pipelines, Postgres, and logs - Heroku’s official hosted MCP.
