---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.browserbase.com/mcp` - nothing runs locally.
  - id: api-key
    title: "Paste your Browserbase API key"
    externalAction: { label: "Get a Browserbase key", url: "https://www.browserbase.com" }
    inputs:
      - { name: BROWSERBASE_API_KEY, label: "Browserbase API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a Browserbase key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# Browserbase setup

Drive a cloud headless browser - navigate, act, observe, and extract - via Stagehand. Browserbase’s official hosted MCP.
