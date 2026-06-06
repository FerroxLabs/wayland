---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland connects to Supabase's hosted MCP server - nothing to install
      locally. If the connection fails later, re-authorize from this page.
  - id: authorize
    title: Sign in with Supabase
    estSeconds: 60
    primaryAction: { label: "Sign in with Supabase", action: "oauth-flow" }
    warning: |
      Supabase's docs explicitly warn: **never connect the MCP server to
      production data** - it's designed for development and testing. Pick a
      dev/staging project on the consent screen, and keep the server in
      **read-only mode** (the default) unless you really need writes.
      If you must use a PAT instead of OAuth, treat it like a root key:
      it has the same scope as your Supabase user account.
    body: |
      Click **Sign in with Supabase** below. A browser tab opens to
      `app.supabase.com`. Supabase uses **dynamic client registration**, so
      no app setup is needed on your end - just approve the consent prompt
      and pick which **organization** and **projects** Wayland may touch.

      The tab redirects back to Wayland and the server status flips to
      Running. The token is stored in your OS keychain - revoke any time
      under **Dashboard → Account → Tokens** at app.supabase.com.

      **PAT fallback** (only if OAuth fails, e.g. CI containers):

      1. Open `app.supabase.com` → top-right avatar → **Account**.
      2. Sidebar → **Access Tokens** → **Generate new token**.
      3. Name it `wayland-mcp`. Copy the token (shown once).
      4. Restart Wayland with `SUPABASE_ACCESS_TOKEN=<your token>` in the
         environment - the MCP server will use it instead of OAuth.

      **Heads up on the service_role key:** Wayland does *not* use it for
      the MCP server, and you shouldn't paste it anywhere outside your own
      backend. Find it under **Project Settings → API Keys** if you need it
      for other tooling - it bypasses Row Level Security and grants full DB
      access.
---

# Supabase setup

Supabase runs the MCP server. Sign in once to authorize Wayland on the
projects you want to manage. OAuth is the recommended path - Supabase
handles the app registration for you.
