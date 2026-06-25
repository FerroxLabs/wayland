---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `uvx mcp-server-qdrant` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your Qdrant key"
    externalAction: { label: "Get a Qdrant key", url: "https://cloud.qdrant.io" }
    inputs:
      - { name: QDRANT_API_KEY, label: "Qdrant API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a Qdrant key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# Qdrant setup

A semantic-memory layer over Qdrant - store and find by meaning - Qdrant’s official MCP.
