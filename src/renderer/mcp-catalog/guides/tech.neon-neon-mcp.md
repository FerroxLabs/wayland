---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Neon hosts the MCP server at `https://mcp.neon.tech/mcp` - nothing
      to install locally. Wayland connects over Streamable HTTP and stores
      the OAuth token in your OS keychain.
  - id: authorize
    title: Sign in with Neon
    estSeconds: 45
    primaryAction: { label: "Sign in with Neon", action: "oauth-flow" }
    warning: |
      The Neon MCP can **create branches, run arbitrary SQL, and drop
      databases**. Wayland surfaces a confirmation prompt before destructive
      operations, but always read the SQL diff Neon returns. For shared or
      production orgs, sign in with a user that only has access to the
      projects you want Wayland to touch.
    body: |
      Click **Sign in with Neon** below. A browser tab opens to
      `console.neon.tech`. Pick the Neon account whose projects you want
      Wayland to manage, then click **Authorize** on the consent screen.

      The tab redirects back to Wayland and the server status flips to
      Running.

      **Revoke any time:** open `console.neon.tech` → top-right profile
      avatar → **Account settings → API keys**. OAuth grants and personal
      API keys are managed from the same page - delete the Wayland entry
      to cut access immediately.

      **API key fallback** (for headless agents or CI):

      1. Same page → **Account settings → API keys → Create new API key**.
      2. Name it `wayland-mcp`. Copy the key (shown once).
      3. Restart Wayland with `NEON_API_KEY=<your key>` in the environment
         - the MCP client will use it instead of OAuth.
---

# Neon setup

Neon hosts the MCP server at `https://mcp.neon.tech/mcp`. Click sign in,
authorize Wayland against your Neon account, and you're done - no Postgres
connection strings to copy around.
