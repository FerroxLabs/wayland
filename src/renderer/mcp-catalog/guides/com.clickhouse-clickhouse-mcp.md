---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `uvx mcp-clickhouse` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your ClickHouse key"
    externalAction: { label: "Get a ClickHouse key", url: "https://clickhouse.com/cloud" }
    inputs:
      - { name: CLICKHOUSE_PASSWORD, label: "ClickHouse API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a ClickHouse key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# ClickHouse setup

Read-only SQL and schema exploration over ClickHouse and chDB - ClickHouse’s official MCP.
