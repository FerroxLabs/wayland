---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.replicate.com` - nothing runs locally.
  - id: oauth
    title: "Sign in with Replicate"
    primaryAction: { label: "Sign in with Replicate", action: "oauth-flow" }
    body: |
      Click **Sign in with Replicate** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Replicate setup

Run, search, and compare thousands of community models for image, video, audio, and 3D generation - Replicate’s official hosted MCP.
