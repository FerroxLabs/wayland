---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://coda.io/apis/mcp` - nothing runs locally.
  - id: api-key
    title: "Paste your Coda API key"
    externalAction: { label: "Get a Coda key", url: "https://coda.io/account" }
    inputs:
      - { name: CODA_API_TOKEN, label: "Coda API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a Coda key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# Coda setup

Read and write Coda docs, tables, rows, and formulas in natural language - Coda’s official hosted MCP (beta).
