---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `npx @pinecone-database/mcp` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your Pinecone key"
    externalAction: { label: "Get a Pinecone key", url: "https://app.pinecone.io" }
    inputs:
      - { name: PINECONE_API_KEY, label: "Pinecone API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a Pinecone key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# Pinecone setup

Manage indexes, upsert records, run cascading vector search, and rerank - Pinecone’s official MCP.
