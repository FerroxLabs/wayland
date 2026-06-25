---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.linkup.so/mcp` - nothing runs locally.
  - id: api-key
    title: "Paste your Linkup API key"
    externalAction: { label: "Get a Linkup key", url: "https://app.linkup.so" }
    inputs:
      - { name: LINKUP_API_KEY, label: "Linkup API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a Linkup key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# Linkup setup

Real-time web search, autonomous research, and page fetch - Linkup’s official hosted MCP.
