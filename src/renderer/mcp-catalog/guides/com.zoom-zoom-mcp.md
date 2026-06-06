---
guideVersion: 1.0.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Zoom hosts the MCP server at `https://mcp.zoom.us` - Wayland connects
      over `streamable-http`. Nothing to download. Skip to Step 2 to
      authorize.
  - id: authorize
    title: Sign in with Zoom
    estSeconds: 30
    primaryAction: { label: "Sign in with Zoom", action: "oauth-flow" }
    body: |
      Zoom requires every integration to be a registered Zoom App, so the
      first time you click **Sign in with Zoom** Wayland opens a dialog for
      your own app's **Client ID** and **Client Secret**. The dialog walks you
      through creating a User-managed OAuth app in the Zoom Marketplace and
      shows the redirect URL to paste in.

      After you save the credentials, Wayland opens a browser tab to Zoom's
      OAuth consent screen:

      1. Sign in with the Zoom account whose meetings, recordings, and chat
         you want Wayland to access.
      2. Review the requested scopes - Wayland asks for `meeting:read`,
         `meeting:write`, `recording:read`, and `chat_message:write`.
      3. Click **Allow** to grant access. The tab redirects back to Wayland
         and the server status flips to Running.

      **If your Zoom account is part of a managed organization**, your
      admin may need to pre-approve the Wayland app for your domain before
      this step succeeds. If you see a "Request to Install" prompt, submit
      it and your admin will approve from the Zoom App Marketplace
      management area.

      Tokens are stored in your local OS keychain. To revoke later, sign in
      at `marketplace.zoom.us`, open **Manage → Installed Apps**, find
      Wayland, and click **Remove**.
---

# Zoom setup

Zoom runs the MCP server. One sign-in and you're connected.

## Step 2 - Sign in

A browser tab opens at Zoom. Approve the scopes and you're done. Tokens are
stored in your local OS keychain.
