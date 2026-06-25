---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.newrelic.com/mcp/` - nothing runs locally.
  - id: api-key
    title: "Paste your New Relic API key"
    externalAction: { label: "Get a New Relic key", url: "https://one.newrelic.com/api-keys" }
    inputs:
      - { name: NEW_RELIC_API_KEY, label: "New Relic API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a New Relic key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent in the `Api-Key` header. Wayland tests the connection before enabling it.
---

# New Relic setup

Run NRQL, inspect alerts, entities, deployments, and golden metrics - New Relic’s official hosted MCP.
