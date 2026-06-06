---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Sentry hosts the MCP server at `https://mcp.sentry.dev` - nothing to
      install. Wayland connects via streamable HTTP on first use.
  - id: authorize
    title: Sign in with Sentry
    estSeconds: 30
    primaryAction: { label: "Sign in with Sentry", action: "oauth-flow" }
    body: |
      Click **Sign in with Sentry** below. A browser tab opens at
      `mcp.sentry.dev` and redirects to Sentry's OAuth consent screen.

      1. Sign in to Sentry if you aren't already.
      2. Pick the **organization** you want to grant access to. If you
         belong to multiple orgs, repeat the flow per org from the Installed
         page later.
      3. Approve the scopes: read projects & issues, read events & traces,
         and (optionally) resolve issues / tag releases.
      4. The tab redirects back to Wayland and the server status flips
         to Running.

      **Self-hosted Sentry?** This hosted MCP is SaaS-only. For self-hosted
      Sentry, use the stdio package `@sentry/mcp-server` with
      `--host=sentry.example.com` - file an issue if you'd like first-class
      support in Wayland.
---

# Sentry setup

Sentry runs the MCP server - no API tokens to manage and no package to
install. Sign in once per organization, pick the scopes, and you're
connected to issues, events, releases, and performance traces.
