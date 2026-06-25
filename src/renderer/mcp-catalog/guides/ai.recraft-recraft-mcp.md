---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.recraft.ai/mcp` - nothing runs locally.
  - id: oauth
    title: "Sign in with Recraft"
    primaryAction: { label: "Sign in with Recraft", action: "oauth-flow" }
    body: |
      Click **Sign in with Recraft** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.
---

# Recraft setup

Generate and edit raster and vector (SVG) images, custom styles, vectorization, background removal, and upscaling - Recraft’s official hosted MCP.
