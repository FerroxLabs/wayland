---
guideVersion: 1.0.0
estimatedMinutes: 4
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `npx @upstash/mcp-server` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your Upstash email and management API key"
    externalAction: { label: "Get an Upstash API key", url: "https://console.upstash.com/account/api" }
    inputs:
      - { name: UPSTASH_EMAIL, label: "Upstash account email" }
      - { name: UPSTASH_API_KEY, label: "Upstash management API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get an Upstash API key** above and create a management API key.
      2. Enter the account email and the key above, then click **Save & connect**.
---

# Upstash setup

Manage Upstash Redis, QStash, and Workflow resources in natural language - Upstash's official MCP.
