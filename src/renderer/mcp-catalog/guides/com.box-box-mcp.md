---
guideVersion: 1.1.0
estimatedMinutes: 3
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland connects to Box's hosted MCP at `https://mcp.box.com` —
      nothing runs locally. Box handles the OAuth flow for personal accounts;
      no developer app registration is needed for end users.
  - id: authorize
    title: Sign in with Box
    estSeconds: 60
    primaryAction: { label: "Sign in with Box", action: "oauth-flow" }
    warning: |
      If your account is on a **Business / Enterprise** plan, your Box admin
      may need to enable the Box MCP server from **Admin Console →
      Integrations → Box MCP server → Configure** before personal OAuth will
      succeed. Hit that error and you'll need to ask them first.
    body: |
      Click **Sign in with Box** below. A browser tab opens to
      `account.box.com` and prompts you to sign in.

      Box shows a **Grant access** consent screen requesting three scopes:

      - `root_readwrite` — read and write files and folders you select.
      - `ai.readwrite` — use Box AI to summarize and analyze content.
      - `docgen.readwrite` — generate documents with Box Doc Gen templates.

      Pick which folders the integration may touch — start narrow (one
      folder), widen later. Approve, and the tab redirects back to Wayland.

      The token lives in your OS keychain. Revoke any time at
      **app.box.com → Account Settings → Apps → Authorized apps**.
---

# Box setup

Box hosts the MCP server at `https://mcp.box.com`. One click of **Sign in
with Box**, approve the scopes and folder scope, and Wayland can read, write,
and run Box AI on your selected content.
