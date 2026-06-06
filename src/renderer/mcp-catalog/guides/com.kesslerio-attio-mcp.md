---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `attio-mcp` from npm via `npx` on first launch - no
      manual install needed. The server runs locally in stdio mode and
      talks to Attio's REST API using the workspace access token you
      paste in the next step. If the server fails to start later,
      reinstall from this page.
  - id: api-key
    title: Paste your Attio API key
    estSeconds: 90
    externalAction: { label: "Open Attio developer settings", url: "https://app.attio.com/settings/apps" }
    inputs:
      - { name: ATTIO_API_KEY, label: "Attio API key", secret: true }
    body: |
      Attio scopes API access through a workspace **App**. You'll create
      one app and generate a single-workspace access token from it.

      1. Click **Open Attio developer settings** above. Sign in.
      2. In the left sidebar, go to **Workspace settings → Developers**
         (or **Apps** on some plans), then click **Create app**.
      3. Name it *Wayland* and continue.
      4. Open the new app, go to its **Permissions / Scopes** tab, and
         enable the scopes Wayland needs:
         - `object_configuration:read` and `record:read` (read-only), or
         - `record:read_write` and `list_entry:read_write` for full edit.
         Grant only what you need - you can change scopes later.
      5. Go to the app's **Auth** tab and copy the
         **Workspace access token**.
      6. Paste it into `ATTIO_API_KEY` above.

      The token is bound to this workspace only. Rotate or revoke it any
      time from the same app page.
---

# Attio setup

The Attio MCP server (community, by @kesslerio) talks to Attio's REST API
using a workspace access token you generate from a developer app.
