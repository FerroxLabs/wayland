---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `npx agentql-mcp` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your AgentQL key"
    externalAction: { label: "Get a AgentQL key", url: "https://dev.agentql.com" }
    inputs:
      - { name: AGENTQL_API_KEY, label: "AgentQL API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a AgentQL key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# AgentQL setup

Turn a natural-language prompt into structured data from any web page - AgentQL’s official MCP.
