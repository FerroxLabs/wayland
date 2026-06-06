---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Vercel hosts the MCP server at `https://mcp.vercel.com` - nothing to
      install locally. Wayland connects over Streamable HTTP using the
      latest MCP Authorization spec, and stores the OAuth token in your OS
      keychain.
  - id: authorize
    title: Sign in with Vercel
    estSeconds: 60
    primaryAction: { label: "Sign in with Vercel", action: "oauth-flow" }
    warning: |
      Connecting Vercel MCP grants Wayland **the same access as your Vercel
      user account** for the team you select - including read access to
      deployment logs and the ability to manage projects. Pick a personal
      or staging team on the consent screen rather than your production
      org. Vercel requires explicit per-client consent (confused-deputy
      protection), so don't blanket-approve unknown clients.
    body: |
      Click **Sign in with Vercel** below. A browser tab opens to
      `vercel.com`. Pick the **team** you want Wayland to manage on the
      consent screen - you can only authorize one team per grant, so
      choose the narrowest scope you need (personal account, dev team,
      etc.).

      The tab redirects back to Wayland and the server status flips to
      Running.

      **Revoke any time:** `vercel.com` → top-right avatar → **Account
      Settings → Tokens**. OAuth grants appear alongside personal access
      tokens - delete the Wayland entry to cut access immediately.

      **PAT fallback** (for headless agents or CI):

      1. Open `vercel.com` → top-right avatar → **Account Settings**.
      2. Sidebar → **Tokens** → **Create Token**.
      3. Name it `wayland-mcp`. Scope: pick **Full Account**, a specific
         **Team**, or a single **Project** - narrowest scope wins.
         Expiration: pick the shortest window you can live with.
      4. Copy the token (shown once). Restart Wayland with
         `VERCEL_TOKEN=<your token>` in the environment.
---

# Vercel setup

Vercel runs the MCP server at `https://mcp.vercel.com`. Sign in to pick a
team, approve scopes, and Wayland can search Vercel docs, manage projects,
and analyze deployment logs - all through one OAuth grant.
