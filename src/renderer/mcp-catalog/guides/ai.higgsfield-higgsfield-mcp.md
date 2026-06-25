---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.higgsfield.ai/mcp` - nothing runs locally.
  - id: oauth
    title: "Sign in with Higgsfield"
    primaryAction: { label: "Sign in with Higgsfield", action: "oauth-flow" }
    body: |
      Click **Sign in with Higgsfield** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Higgsfield setup

Generate cinematic video and images from 30+ models (Soul, Cinema Studio, Seedance, Kling, Veo) - Higgsfield’s official hosted MCP.
