---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.bfl.ai` - nothing runs locally.
  - id: oauth
    title: "Sign in with Black Forest Labs"
    primaryAction: { label: "Sign in with Black Forest Labs", action: "oauth-flow" }
    body: |
      Click **Sign in with Black Forest Labs** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Black Forest Labs (FLUX) setup

Generate, edit, and vary images with FLUX.2 - text-to-image, inpainting, style transfer, and multi-reference composition. Official Black Forest Labs MCP.
