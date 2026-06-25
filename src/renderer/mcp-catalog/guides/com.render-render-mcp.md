---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.render.com/mcp` - nothing runs locally.
  - id: api-key
    title: "Paste your Render API key"
    externalAction: { label: "Get a Render key", url: "https://dashboard.render.com/u/settings/api-keys" }
    inputs:
      - { name: RENDER_API_KEY, label: "Render API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a Render key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# Render setup

Manage services, Postgres, key-value stores, metrics, and logs - Render’s official hosted MCP.
