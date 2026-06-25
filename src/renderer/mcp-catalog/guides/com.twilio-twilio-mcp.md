---
guideVersion: 1.0.0
estimatedMinutes: 4
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `npx @twilio-alpha/mcp` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your Twilio credentials"
    externalAction: { label: "Open Twilio Console", url: "https://console.twilio.com" }
    inputs:
      - { name: TWILIO_CREDENTIALS, label: "Credentials (AccountSID/APIKeySID:APIKeySecret)", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      In the Twilio Console create an **API Key** (Account > API keys & tokens). Then paste a single string in this exact format:
      
      `ACxxxxxxxx/SKxxxxxxxx:your_api_key_secret`
      
      (Account SID `/` API Key SID `:` API Key Secret), then click **Save & connect**.
---

# Twilio setup

Send SMS, place calls, and reach the full Twilio API surface - Twilio Alpha's official MCP.
