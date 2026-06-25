---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `uvx redis-mcp-server` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your Redis key"
    externalAction: { label: "Get a Redis key", url: "https://redis.io/try-free/" }
    inputs:
      - { name: REDIS_PWD, label: "Redis API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a Redis key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# Redis setup

A natural-language interface over Redis strings, hashes, lists, sets, streams, JSON, and vector search - Redis’ official MCP.
