---
guideVersion: 1.0.0
estimatedMinutes: 2
steps:
  - id: install
    title: "Install the MCP server"
    autoCompletedByInstall: true
    body: |
      Wayland runs `uvx elevenlabs-mcp` on first launch - no manual install needed.
  - id: api-key
    title: "Paste your ElevenLabs key"
    externalAction: { label: "Get a ElevenLabs key", url: "https://elevenlabs.io/app/settings/api-keys" }
    inputs:
      - { name: ELEVENLABS_API_KEY, label: "ElevenLabs API key", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Get a ElevenLabs key** above and copy your key.
      2. Paste it in the field above and click **Save & connect**.
      
      It is sent as a `Bearer` token. Wayland tests the connection before enabling it.
---

# ElevenLabs setup

Text-to-speech, voice cloning, voice design, audio isolation, transcription, and sound effects - ElevenLabs’ official MCP.
