---
guideVersion: 1.0.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Intercom hosts the MCP server at `https://mcp.intercom.com/mcp`
      (legacy SSE endpoint also available at `https://mcp.intercom.com/sse`).
      Wayland connects over `streamable-http`. Nothing to download.

      **US-only:** per Intercom's docs, the hosted MCP is currently only
      supported on US-hosted workspaces. EU and AU workspaces aren't
      supported yet - check your Intercom workspace region before
      continuing.
  - id: authorize
    title: Sign in with Intercom
    estSeconds: 30
    primaryAction: { label: "Sign in with Intercom", action: "oauth-flow" }
    body: |
      Click **Sign in with Intercom** below. A browser tab opens to
      Intercom's OAuth consent screen.

      1. Sign in with the Intercom workspace whose conversations and
         contacts you want Wayland to access. If you have multiple
         workspaces, pick the right one from the workspace switcher.
      2. Review the requested permission groups - per Intercom's MCP docs:
         **Read and list users and companies**, **Read conversations**, and
         **Read and write articles**.
      3. Click **Authorize** to grant access. The tab redirects back to
         Wayland and the server status flips to Running.

      The OAuth token is stored in your local OS keychain. To revoke later,
      open your Intercom workspace settings, find the authorized-apps
      area, and remove the Wayland connection.
---

# Intercom setup

Intercom hosts the MCP server at `https://mcp.intercom.com/mcp`. Click sign
in and approve read access to conversations, users, and companies.

## Step 2 - Sign in

A browser tab opens to `intercom.com`. Approve the two read scopes - the
server is read-only, so the agent can search conversations and contacts but
cannot send messages.

**Region note:** US-hosted Intercom workspaces only. EU and AU workspaces
are not supported yet.

Revoke any time from Intercom's connected apps settings.
