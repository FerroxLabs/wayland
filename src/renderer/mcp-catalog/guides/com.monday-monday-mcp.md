---
guideVersion: 1.1.0
estimatedMinutes: 3
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      No local install needed. monday.com hosts the MCP at
      `https://mcp.monday.com/mcp`. The integration is preinstalled on
      every monday account at no extra cost - Wayland connects over
      streamable HTTP the moment you finish sign-in.
  - id: authorize
    title: Sign in with monday.com (OAuth)
    estSeconds: 60
    primaryAction: { label: "Sign in with monday.com", action: "oauth-flow" }
    body: |
      Click **Sign in with monday.com** below. A browser tab opens.

      1. Sign in if you aren't already.
      2. Review the scopes - Wayland requests **boards:read**,
         **boards:write**, **users:read**, and **workspaces:read**. All
         MCP calls execute *as you* - anything you can't see in the app,
         the agent can't see either.
      3. Click **Authorize**. The tab redirects back to Wayland and the
         server status flips to Running.

      Revoke any time at
      `<your-account>.monday.com/admin/integrations/api/oauth`.
  - id: verify
    title: Verify the connection
    estSeconds: 30
    body: |
      Open a new chat and ask: *"Show items assigned to me in the Sprint
      board."* Wayland will call the MCP and stream the results back.

      **Personal API token (alternative):** for headless / CI use you can
      paste a long-lived token. monday.com offers **two paths** depending
      on your role:

      - **All users:** click your **profile picture** (top-right) →
        **Developers** → **API token** → **Show** → **Copy**.
      - **Account admins:** click your **profile picture** (top-right) →
        **Administration** → **Connections** → **Personal API token**.

      Paste it into `MONDAY_API_TOKEN` on the Configure tab. OAuth above
      is what we recommend for desktop use.
---

# monday.com setup

monday.com hosts the MCP and ships it preinstalled on every account. OAuth is
one click; the alternative personal API token route is documented above if you
need it for automation.

Tokens live in your OS keychain.
