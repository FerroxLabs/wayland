---
guideVersion: 1.1.0
estimatedMinutes: 3
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      No local install needed. ClickUp hosts the MCP server at
      `https://mcp.clickup.com` - Wayland connects over streamable HTTP
      the moment you finish auth.
  - id: authorize
    title: Sign in with ClickUp (OAuth)
    estSeconds: 60
    primaryAction: { label: "Sign in with ClickUp", action: "oauth-flow" }
    body: |
      Click **Sign in with ClickUp** below. A browser tab opens at
      `app.clickup.com`.

      1. Sign in if you aren't already.
      2. On the consent screen, **select one or more Workspaces** to
         authorize. (You can only authorize workspaces you're a member
         of - guest workspaces and ones owned by another org won't appear
         here.)
      3. Click **Connect Workspace**. The tab redirects back to Wayland
         and the server status flips to Running.

      The MCP only sees the workspaces you ticked. Re-run sign-in later
      if you want to add more.
  - id: verify
    title: Verify the connection
    estSeconds: 30
    body: |
      Open a new chat and ask: *"List my open ClickUp tasks for this
      week."* Wayland will call the MCP and stream the task list back.

      **Personal API token (alternative):** if you'd rather use a
      long-lived token (headless / CI use), open ClickUp:

      1. Click your **avatar** in the upper-right corner.
      2. Go to **Settings** in the menu.
      3. In the sidebar, click **Apps**.
      4. Under **API Token**, click **Generate** (or **Regenerate**).
      5. Click **Copy** - the token starts with `pk_` and never expires.

      Paste it into `CLICKUP_API_TOKEN` on the Configure tab. The OAuth
      path above is what we recommend for desktop use - it's revocable
      per-workspace, the PAT is account-wide.
---

# ClickUp setup

ClickUp runs the MCP server. OAuth is the recommended path - you authorize
specific workspaces and Wayland never sees the others. Personal API tokens are
a fallback for automated / headless use.

Your credentials live in your OS keychain. Revoke OAuth any time from
ClickUp **Settings → Integrations → Connected Apps**.
