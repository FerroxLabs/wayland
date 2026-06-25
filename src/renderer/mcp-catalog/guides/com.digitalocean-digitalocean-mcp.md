---
guideVersion: 1.0.0
estimatedMinutes: 4
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `npx @digitalocean/mcp` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your DigitalOcean API token"
    externalAction: { label: "Get a DigitalOcean token", url: "https://cloud.digitalocean.com/account/api/tokens" }
    inputs:
      - { name: DIGITALOCEAN_API_TOKEN, label: "DigitalOcean API token", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a DigitalOcean token** above, generate a token with read/write scopes, and copy it.
      2. Paste it above and click **Save & connect**.
---

# DigitalOcean setup

Manage App Platform, droplets, managed databases, Kubernetes, and the container registry - DigitalOcean's official MCP.
