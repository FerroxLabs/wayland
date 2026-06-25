---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://api.ref.tools/mcp` - nothing runs locally.
  - id: api-key
    title: "Paste your Ref API key"
    externalAction: { label: "Get a Ref key", url: "https://ref.tools" }
    inputs:
      - { name: REF_API_KEY, label: "Ref API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a Ref key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent in the `x-ref-api-key` header. Wayland tests the connection before enabling it.
---

# Ref setup

Token-efficient documentation search and reading across public and private docs - Ref’s official hosted MCP.
