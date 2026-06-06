---
guideVersion: 1.1.0
estimatedMinutes: 3
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      No local install needed. Notion hosts the MCP at
      `https://mcp.notion.com/mcp` - Wayland connects over streamable
      HTTP the moment you finish sign-in.
  - id: authorize
    title: Sign in with Notion (OAuth)
    estSeconds: 90
    primaryAction: { label: "Sign in with Notion", action: "oauth-flow" }
    warning: |
      Pick the smallest scope that makes sense. If you grant access to
      your whole workspace, *everything* you can see - private notes,
      draft pages, archived databases - is in scope for the agent. You
      can always come back and add more later.
    body: |
      Click **Sign in with Notion** below. A browser tab opens.

      1. Sign in if you aren't already and pick the workspace you want
         Wayland to act on (the dropdown is top-right of the consent
         screen).
      2. Click **Select pages** - Notion will show your sidebar tree.
         **Tick only the specific pages and databases** you want the
         agent to read and write. The MCP will reject calls to anything
         you didn't pick.
      3. Click **Allow access**. The tab redirects back to Wayland and
         the server status flips to Running.

      Granted scopes: **read_content**, **update_content**, and
      **insert_content** on the pages you selected. Tokens live in your
      OS keychain.
  - id: verify
    title: Verify the connection
    estSeconds: 30
    body: |
      Open a new chat and ask: *"Summarize the latest entries in my
      <database name>."* Wayland will call the MCP and stream the
      results back.

      **Manage or revoke access** any time inside Notion:

      1. Click **Settings** (top-left, under your workspace name).
      2. In the sidebar, click **My connections**.
      3. Find **Wayland** in the list. Click **…** → **Edit access** to
         change which pages it can see, or **Disconnect** to revoke.

      To add a new page later, return to **My connections → Wayland →
      Edit access → Add pages**.
---

# Notion setup

Notion hosts the MCP. The defining choice is *what* you grant - pick the
narrowest set of pages and databases that lets the agent do its job.
You can adjust the scope any time from **Settings → My connections**
without re-authorizing.
