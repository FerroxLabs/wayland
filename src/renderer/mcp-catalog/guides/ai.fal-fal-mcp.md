---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Connect to the hosted MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland connects to the hosted MCP at `https://mcp.fal.ai/mcp` - nothing runs locally.
  - id: api-key
    title: "Paste your fal.ai API key"
    externalAction: { label: "Get a fal.ai key", url: "https://fal.ai/dashboard/keys" }
    inputs:
      - { name: FAL_KEY, label: "fal.ai API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a fal.ai key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# fal.ai setup

One gateway to 1,000+ generative media models - image, video, audio, and voice - through fal's hosted MCP. Search models, run inference, upload files.
