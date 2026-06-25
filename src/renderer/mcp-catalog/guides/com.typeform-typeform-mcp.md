---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://api.typeform.com/mcp` - nothing runs locally.
  - id: api-key
    title: "Paste your Typeform API key"
    externalAction: { label: "Get a Typeform key", url: "https://admin.typeform.com/account#/section/tokens" }
    inputs:
      - { name: TYPEFORM_TOKEN, label: "Typeform API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a Typeform key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# Typeform setup

Read your forms and read or write contacts - Typeform’s official hosted MCP (beta).
