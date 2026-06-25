---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `npx @perplexity-ai/mcp-server` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your Perplexity key"
    externalAction: { label: "Get a Perplexity key", url: "https://www.perplexity.ai/settings/api" }
    inputs:
      - { name: PERPLEXITY_API_KEY, label: "Perplexity API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a Perplexity key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# Perplexity setup

Real-time search plus deep research and reasoning powered by Sonar - Perplexity’s official MCP.
