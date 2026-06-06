---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Raindrop hosts the MCP server at `https://mcp.raindrop.io` - nothing
      to install. Wayland connects via streamable HTTP on first use.
  - id: authorize
    title: Sign in with Raindrop
    estSeconds: 30
    primaryAction: { label: "Sign in with Raindrop", action: "oauth-flow" }
    body: |
      Click **Sign in with Raindrop** below. A browser tab opens at
      Raindrop's OAuth consent screen.

      1. Sign in to Raindrop.io if you aren't already.
      2. Approve the **raindrop:read** and **raindrop:write** scopes -
         this lets Wayland read your bookmarks/collections and save or
         edit new ones.
      3. The tab redirects back to Wayland and the server status flips
         to Running.

      **Prefer a test token instead?** Open
      `app.raindrop.io/settings/integrations` → click **+ Create new app**
      → name it → open the app → copy the **Test token** field. Test tokens
      only work for the app owner's own account, which is exactly what you
      want for a personal MCP install.
---

# Raindrop setup

Raindrop runs the MCP server. One click and you're connected to your
bookmarks, collections, and tags.
