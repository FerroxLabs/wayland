---
guideVersion: 1.2.0
estimatedMinutes: 2
steps:
  - id: install
    title: Connect to the hosted MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland connects to Raindrop's hosted MCP at
      `https://api.raindrop.io/rest/v2/ai/mcp` - nothing runs locally.
      Authentication is a Bearer token in the `Authorization` header, set up
      in the next step.
  - id: api-key
    title: Paste your Raindrop test token
    estSeconds: 90
    externalAction: { label: "Open Raindrop integrations", url: "https://app.raindrop.io/settings/integrations" }
    inputs:
      - { name: RAINDROP_TOKEN, label: "Raindrop test token", secret: true }
    primaryAction: { label: "Save & connect", action: "api-key-save" }
    body: |
      1. Click **Open Raindrop integrations** above. The path is
         **Raindrop.io -> Settings -> Integrations**.
      2. Click **+ Create new app**, give it a name, then open the app.
      3. Copy the **Test token** field and paste it above.

      A test token acts on your own Raindrop account, which is exactly what
      you want for a personal MCP install. (Raindrop's hosted OAuth is not
      used here because it does not accept Wayland's local callback port.)
---

# Raindrop setup

Raindrop hosts the MCP server at `https://api.raindrop.io/rest/v2/ai/mcp` and
authenticates with a personal test token sent as a Bearer header. One field
and you're connected to your bookmarks, collections, and tags.
