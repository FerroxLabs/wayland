---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `npx resend-mcp` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your Resend key"
    externalAction: { label: "Get a Resend key", url: "https://resend.com/api-keys" }
    inputs:
      - { name: RESEND_API_KEY, label: "Resend API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a Resend key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# Resend setup

Send emails and manage contacts, broadcasts, domains, and webhooks - Resend’s official MCP.
