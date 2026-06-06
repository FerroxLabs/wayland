---
guideVersion: 1.0.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Calendly hosts the MCP server at `https://mcp.calendly.com` - Wayland
      connects over `streamable-http`. Nothing to download. Skip to Step 2
      to authorize.
  - id: authorize
    title: Sign in with Calendly
    estSeconds: 30
    primaryAction: { label: "Sign in with Calendly", action: "oauth-flow" }
    body: |
      Click **Sign in with Calendly** below. A browser tab opens to
      Calendly's OAuth consent screen.

      1. Sign in with the Calendly account whose event types and scheduled
         events you want Wayland to read.
      2. Calendly shows the requested access (event types, scheduled
         events, and invitees). Click **Authorize** to grant.
      3. The tab redirects back to Wayland and the server status flips to
         Running.

      **Plan requirement:** Calendly API access requires a Standard,
      Teams, or Enterprise plan. The Free tier cannot authorize the MCP.

      Tokens are stored in your local OS keychain. To revoke later, sign
      in at `calendly.com`, open **Account settings → Integrations** and
      remove the Wayland connection from the connected-apps list.
---

# Calendly setup

Calendly runs the MCP server. One click and you're connected.

## Step 2 - Sign in

A browser tab opens at Calendly. Approve the requested access and you're done.
