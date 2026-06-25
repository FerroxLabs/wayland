---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.jina.ai/v1` - nothing runs locally.
  - id: api-key
    title: "Paste your Jina AI API key"
    externalAction: { label: "Get a Jina AI key", url: "https://jina.ai/api-dashboard/" }
    inputs:
      - { name: JINA_API_KEY, label: "Jina AI API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a Jina AI key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# Jina AI setup

Read any URL as clean markdown, search the web and arXiv, capture screenshots, and extract PDFs - Jina AI’s official hosted MCP.
