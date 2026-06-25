---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.apify.com` - nothing runs locally.
  - id: oauth
    title: "Sign in with Apify"
    primaryAction: { label: "Sign in with Apify", action: "oauth-flow" }
    body: |
      Click **Sign in with Apify** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Apify setup

Run thousands of ready-made scrapers and automation Actors - social, maps, e-commerce, any site - through Apify’s official hosted MCP.
