---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `npx @netlify/mcp` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your Netlify key"
    externalAction: { label: "Get a Netlify key", url: "https://app.netlify.com/user/applications" }
    inputs:
      - { name: NETLIFY_PERSONAL_ACCESS_TOKEN, label: "Netlify API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a Netlify key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# Netlify setup

Create, build, deploy, and manage projects, environment variables, and forms - Netlify’s official MCP.
