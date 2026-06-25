---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.canva.com/mcp` - nothing runs locally.
  - id: oauth
    title: "Sign in with Canva"
    primaryAction: { label: "Sign in with Canva", action: "oauth-flow" }
    body: |
      Click **Sign in with Canva** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Canva setup

Create and edit designs with Canva AI, autofill brand templates, manage assets, and export to PDF, image, or video - Canva’s official hosted MCP.
