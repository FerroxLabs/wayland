---
guideVersion: 1.0.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Slack hosts the MCP server at `https://mcp.slack.com` - Wayland connects
      over `streamable-http`. There's nothing to download. Skip straight to
      Step 2 to authorize.
  - id: authorize
    title: Sign in with Slack
    estSeconds: 30
    primaryAction: { label: "Sign in with Slack", action: "oauth-flow" }
    body: |
      Slack doesn't allow apps to auto-register, so the first time you click
      **Sign in with Slack** Wayland opens a dialog asking for your own OAuth
      app's **Client ID** and **Client Secret**. The dialog walks you through
      creating the app at **api.slack.com/apps** (it takes a minute) and shows
      the exact redirect URL to paste in.

      Once you save the credentials, Wayland opens a browser tab to Slack's
      OAuth consent screen:

      1. If you're in multiple workspaces, use the workspace switcher
         (top-right of Slack's auth page) to pick the right one.
      2. Review the requested permissions - Wayland asks for `search:read`
         (search messages and files), `chat:write` (post on your behalf),
         `users:read` (look up workspace users), and `channels:history`
         (read channel history).
      3. Click **Allow**. The tab redirects back to Wayland and the server
         status flips to Running.

      **If your workspace requires admin approval**, your request goes to a
      workspace owner/admin, who approves it from Slack's app management area
      before the connection completes.

      The OAuth token is stored in your local OS keychain. To revoke later,
      open Slack in a browser, click your workspace name (top-left), then
      **Tools & settings → Manage apps**, find the Wayland connection, and
      remove it.
---

# Slack setup

Slack runs a hosted MCP. You only need to authorize once - there's no app to
install or configuration to fill out.

## Step 2 - Sign in

Click **Sign in with Slack**. A browser tab opens for OAuth. Pick the workspace
you want Wayland to access, review the requested scopes, and approve.

The token is stored in your local OS keychain. You can revoke access at any
time from your Slack workspace's connected apps page.
