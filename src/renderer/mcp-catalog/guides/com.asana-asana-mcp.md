---
guideVersion: 1.1.0
estimatedMinutes: 3
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      No local install needed. Asana hosts the MCP server at
      `https://mcp.asana.com` - Wayland connects over streamable HTTP the
      moment you finish sign-in below.
  - id: authorize
    title: Sign in with Asana
    estSeconds: 60
    primaryAction: { label: "Sign in with Asana", action: "oauth-flow" }
    warning: |
      The hosted MCP requires a paid Asana plan (Starter or above for most
      tools, Advanced/Enterprise for goal and portfolio scopes). Free
      personal workspaces can still authorize but will get permission
      errors on premium-only tools.
    body: |
      Click **Sign in with Asana** below. A browser tab opens at
      `app.asana.com` - Asana uses OAuth so there's nothing to register on
      their side.

      1. If you belong to multiple workspaces, pick the one you want
         Wayland to act on from the dropdown.
      2. Review the scopes - Wayland requests **default** (read + write
         tasks and projects), **task:read**, and **task:write**. The MCP
         only ever sees what *you* can see - your existing project
         membership is the ceiling.
      3. Click **Allow**. The tab redirects back to Wayland and the server
         status flips to Running.

      Tokens are stored in your OS keychain.
  - id: verify
    title: Verify the connection
    estSeconds: 30
    body: |
      Open a new chat and ask: *"Show my Asana tasks due this week."*
      Wayland will call the MCP and stream the task list back.

      If you'd rather use a long-lived Personal Access Token (e.g. for
      headless / CI use), open Asana's developer console at
      `app.asana.com/0/my-apps` → **Personal access tokens** → **Create
      new token**, copy the `1/…` token, and paste it into
      `ASANA_ACCESS_TOKEN` on the Configure tab. The OAuth path above is
      simpler for desktop use.

      Revoke any time from the same `/my-apps` page → **Authorized apps**.
---

# Asana setup

Asana runs the MCP server. One sign-in connects Wayland - no app registration,
no developer-console roundtrip required.

The MCP enforces your existing Asana permissions: private projects stay private,
guest-restricted boards stay restricted.
