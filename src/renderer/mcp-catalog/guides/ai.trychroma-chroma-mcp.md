---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `uvx chroma-mcp` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your Chroma key"
    externalAction: { label: "Get a Chroma key", url: "https://trychroma.com" }
    inputs:
      - { name: CHROMA_API_KEY, label: "Chroma API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a Chroma key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# Chroma setup

Collection management plus vector and full-text search over Chroma - the official chroma-mcp server.
