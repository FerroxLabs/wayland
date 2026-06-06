---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland connects to Miro's hosted MCP at `https://mcp.miro.com/` -
      nothing runs locally. Miro provides the OAuth flow centrally; no
      developer app registration is needed for the hosted endpoint.
  - id: authorize
    title: Sign in with Miro
    estSeconds: 30
    primaryAction: { label: "Sign in with Miro", action: "oauth-flow" }
    body: |
      Click **Sign in with Miro** below. A browser tab opens to `miro.com`
      and prompts you to sign in with the account whose boards you want
      Wayland to reach.

      Miro shows an **Allow access** consent screen requesting the
      `boards:read` and `boards:write` scopes:

      - `boards:read` - read sticky notes, frames, shapes, connectors, and
        comments on boards you have access to.
      - `boards:write` - create and edit those items on the same boards.

      Approve and the tab redirects back to Wayland. The token lives in your
      OS keychain. Revoke any time at **miro.com → Avatar → Settings →
      Connected apps**.

      The MCP respects existing board permissions - it can only see or edit
      boards you can already open in Miro.
---

# Miro setup

Miro hosts the MCP server and runs the OAuth flow for you. Sign in once,
approve `boards:read` and `boards:write`, and Wayland can manipulate sticky
notes, frames, shapes, and connectors on any board you can access.
