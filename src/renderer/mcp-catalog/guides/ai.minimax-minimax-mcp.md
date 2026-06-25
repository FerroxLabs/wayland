---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `uvx minimax-mcp` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your MiniMax key"
    externalAction: { label: "Get a MiniMax key", url: "https://www.minimax.io/platform" }
    inputs:
      - { name: MINIMAX_API_KEY, label: "MiniMax API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a MiniMax key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# MiniMax (Hailuo) setup

Hailuo video generation, music, text-to-speech, voice cloning, and image generation - MiniMax’s official MCP.
